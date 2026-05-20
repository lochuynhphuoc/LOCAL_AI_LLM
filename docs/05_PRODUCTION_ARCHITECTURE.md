# 6. PRODUCTION ARCHITECTURE

---

## 6.1 Kiến Trúc Hệ Thống Tổng Quan

```
                    ┌─────────────────────────────────┐
                    │         NGINX Reverse Proxy       │
                    │     (TLS, Rate Limit, Load Balance)│
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │       FastAPI Gateway             │
                    │  (Auth, WebSocket, SSE, Routing)  │
                    └──┬────────┬────────┬────────┬──┘
                       │        │        │        │
            ┌──────────▼──┐ ┌──▼─────┐ ┌▼──────┐ ┌▼────────┐
            │  LLM Engine  │ │ Qdrant │ │ Redis │ │PostgreSQL│
            │ (Ollama/vLLM)│ │ Vector │ │ Cache │ │ Users/   │
            │              │ │   DB   │ │Session│ │ History  │
            └──────────────┘ └────────┘ └───────┘ └──────────┘
```

## 6.2 Tech Stack Đề Xuất

| Layer | Technology | Vai trò |
|-------|-----------|---------|
| **Reverse Proxy** | Nginx | TLS termination, rate limit, load balance |
| **API Gateway** | FastAPI (Python) | REST API, WebSocket, SSE streaming |
| **LLM Inference** | Ollama (dev) / vLLM (prod) | Model serving, OpenAI-compatible API |
| **AI Gateway** | LiteLLM Proxy | API key auth, rate limit, unified logging |
| **Embedding** | BGE-M3 (via FastAPI service) | Document + query embedding |
| **Vector DB** | Qdrant | Hybrid search (dense + sparse) |
| **Cache/Session** | Redis | Chat history, session, rate limit cache |
| **Database** | PostgreSQL | Users, documents metadata, audit logs |
| **RAG Framework** | LlamaIndex + LangChain | Ingestion pipeline + orchestration |
| **Monitoring** | Prometheus + Grafana | GPU util, latency, throughput metrics |
| **Container** | Docker + Docker Compose | Service isolation, reproducible deploy |

## 6.3 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ============================================
  # NGINX Reverse Proxy
  # ============================================
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - fastapi
    restart: always

  # ============================================
  # FastAPI Application
  # ============================================
  fastapi:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - QDRANT_URL=http://qdrant:6333
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/localai
    volumes:
      - ./backend:/app
      - ./data/uploads:/app/uploads
    depends_on:
      - ollama
      - qdrant
      - redis
      - postgres
    restart: always

  # ============================================
  # Ollama LLM Engine
  # ============================================
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - OLLAMA_NUM_PARALLEL=4
      - OLLAMA_MAX_LOADED_MODELS=2
    restart: always

  # ============================================
  # Qdrant Vector Database
  # ============================================
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: always

  # ============================================
  # Redis Cache & Session
  # ============================================
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    restart: always

  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=localai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  # ============================================
  # Frontend (Next.js)
  # ============================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost/api
    depends_on:
      - fastapi
    restart: always

volumes:
  ollama_data:
  qdrant_data:
  redis_data:
  postgres_data:
```

## 6.4 Nginx Config Mẫu

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream fastapi_backend {
        server fastapi:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

    server {
        listen 80;
        server_name localhost;

        # API routes
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://fastapi_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket for streaming
        location /ws/ {
            proxy_pass http://fastapi_backend/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 86400;
        }

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
        }
    }
}
```

## 6.5 FastAPI Backend Skeleton

```python
# backend/main.py
from fastapi import FastAPI, WebSocket, UploadFile, Depends
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import httpx, redis.asyncio as redis, json

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect services
    app.state.redis = redis.from_url("redis://redis:6379")
    app.state.http_client = httpx.AsyncClient()
    yield
    # Shutdown
    await app.state.redis.close()
    await app.state.http_client.aclose()

app = FastAPI(title="Local AI Vietnamese RAG", lifespan=lifespan)

# ---- Chat endpoint with SSE streaming ----
@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        # 1. Get chat history from Redis
        history = await get_chat_history(request.session_id)
        
        # 2. RAG retrieval
        context = await rag_retrieve(request.message)
        
        # 3. Build prompt with context
        messages = build_rag_prompt(history, context, request.message)
        
        # 4. Stream from Ollama
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                "http://ollama:11434/v1/chat/completions",
                json={"model": "qwen3:8b", "messages": messages, "stream": True}
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        yield f"data: {line[6:]}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

# ---- Document upload & ingestion ----
@app.post("/documents/upload")
async def upload_document(file: UploadFile):
    # Parse → Chunk → Embed → Store in Qdrant
    pass

# ---- WebSocket for real-time chat ----
@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # Process and stream response
            async for token in generate_response(message, session_id):
                await websocket.send_text(json.dumps({"token": token}))
    except Exception:
        await websocket.close()
```

## 6.6 Folder Structure

```
LOCAL_AI_LLM/
├── docker-compose.yml
├── .env                          # Environment variables
├── README.md
│
├── backend/                      # FastAPI Application
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                   # FastAPI entry point
│   ├── config.py                 # Settings & env vars
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chat.py           # Chat endpoints
│   │   │   ├── documents.py      # Document upload/manage
│   │   │   ├── auth.py           # Authentication
│   │   │   └── health.py         # Health checks
│   │   └── middleware/
│   │       ├── auth.py           # JWT middleware
│   │       └── rate_limit.py     # Rate limiting
│   ├── services/
│   │   ├── llm_service.py        # Ollama/vLLM client
│   │   ├── rag_service.py        # RAG pipeline
│   │   ├── embedding_service.py  # BGE-M3 embedding
│   │   ├── reranker_service.py   # Reranking
│   │   └── document_service.py   # Parsing, chunking
│   ├── models/                   # Pydantic models
│   └── utils/
│
├── frontend/                     # Next.js Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│
├── data/
│   ├── uploads/                  # Uploaded documents
│   └── models/                   # Local model files
│
├── scripts/
│   ├── setup.sh                  # Initial setup
│   ├── pull_models.sh            # Download models
│   └── benchmark.py              # Performance testing
│
└── docs/                         # Documentation
    ├── 01_LLM_COMPARISON.md
    ├── 02_EMBEDDING_RERANKER.md
    ├── 03_RAG_ARCHITECTURE.md
    ├── 04_INFERENCE_QUANTIZATION.md
    ├── 05_PRODUCTION_ARCHITECTURE.md
    └── 06_FINAL_RECOMMENDATION.md
```
