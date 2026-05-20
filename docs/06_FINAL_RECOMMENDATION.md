# 7. HUGGING FACE RESEARCH — Links & Resources

---

## 7.1 LLM Models

| Model | HuggingFace Link | GGUF Link | License | Popularity |
|-------|-----------------|-----------|---------|-----------|
| Qwen3-30B-A3B | [Qwen/Qwen3-30B-A3B](https://huggingface.co/Qwen/Qwen3-30B-A3B) | [unsloth/Qwen3-30B-A3B-GGUF](https://huggingface.co/unsloth/Qwen3-30B-A3B-GGUF) | Apache 2.0 | 🔥🔥🔥🔥🔥 |
| Qwen3-8B | [Qwen/Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B) | [unsloth/Qwen3-8B-GGUF](https://huggingface.co/unsloth/Qwen3-8B-GGUF) | Apache 2.0 | 🔥🔥🔥🔥🔥 |
| Qwen3-4B | [Qwen/Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B) | [unsloth/Qwen3-4B-GGUF](https://huggingface.co/unsloth/Qwen3-4B-GGUF) | Apache 2.0 | 🔥🔥🔥🔥 |
| Qwen2.5-7B-Instruct | [Qwen/Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) | [unsloth/Qwen2.5-7B-Instruct-GGUF](https://huggingface.co/unsloth/Qwen2.5-7B-Instruct-GGUF) | Apache 2.0 | 🔥🔥🔥🔥 |
| Gemma 3 4B VN | [toandev/donglao-gemma-3-4b-it-vi](https://huggingface.co/toandev/donglao-gemma-3-4b-it-vi) | Convert needed | Gemma | 🔥🔥🔥 |
| Gemma 3 12B | [google/gemma-3-12b-it](https://huggingface.co/google/gemma-3-12b-it) | [lmstudio-community](https://huggingface.co/lmstudio-community) | Gemma | 🔥🔥🔥🔥 |
| SeaLLM-v3-7B | [SeaLLMs/SeaLLM-v3-7B-Chat](https://huggingface.co/SeaLLMs/SeaLLM-v3-7B-Chat) | [itlwas/SeaLLMs-v3-7B-Chat-Q4_K_M-GGUF](https://huggingface.co/itlwas/SeaLLMs-v3-7B-Chat-Q4_K_M-GGUF) | SeaLLM | 🔥🔥🔥 |
| DeepSeek-V3 | [deepseek-ai/DeepSeek-V3](https://huggingface.co/deepseek-ai/DeepSeek-V3) | Community | DeepSeek | 🔥🔥🔥🔥🔥 |

## 7.2 Embedding Models

| Model | HuggingFace Link | Dims | License |
|-------|-----------------|------|---------|
| BGE-M3 | [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3) | 1024 | MIT |
| Vietnamese Embedding | [AITeamVN/Vietnamese_Embedding](https://huggingface.co/AITeamVN/Vietnamese_Embedding) | 1024 | Apache 2.0 |
| multilingual-e5-large | [intfloat/multilingual-e5-large](https://huggingface.co/intfloat/multilingual-e5-large) | 1024 | MIT |
| Jina Embeddings v4 | [jinaai/jina-embeddings-v4](https://huggingface.co/jinaai/jina-embeddings-v4) | 2048 | cc-by-nc-4.0 |
| gte-multilingual-base | [Alibaba-NLP/gte-multilingual-base](https://huggingface.co/Alibaba-NLP/gte-multilingual-base) | 768 | Apache 2.0 |

## 7.3 Reranker Models

| Model | HuggingFace Link | License |
|-------|-----------------|---------|
| Qwen3-Reranker-0.6B | [Qwen/Qwen3-Reranker-0.6B](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B) | Apache 2.0 |
| Qwen3-Reranker-4B | [Qwen/Qwen3-Reranker-4B](https://huggingface.co/Qwen/Qwen3-Reranker-4B) | Apache 2.0 |
| bge-reranker-v2-m3 | [BAAI/bge-reranker-v2-m3](https://huggingface.co/BAAI/bge-reranker-v2-m3) | MIT |
| Vietnamese Reranker | [thanhtantran/Vietnamese_Reranker](https://huggingface.co/thanhtantran/Vietnamese_Reranker) | Apache 2.0 |

## 7.4 Benchmarks Tham Khảo

| Benchmark | URL | Đánh giá |
|-----------|-----|----------|
| SEA-HELM | [leaderboard.sea-lion.ai](https://leaderboard.sea-lion.ai) | Southeast Asian LLM ranking |
| VMLU | [vmlu.ai](https://vmlu.ai) | Vietnamese Language Understanding |
| MTEB | [huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard) | Embedding model ranking |
| M3Exam | Paper-based | Multilingual exam benchmark |

---

# 8. KẾT LUẬN CUỐI CÙNG

---

## 8.1 Recommended Stack Tổng Thể

```
┌─────────────────────────────────────────────────────┐
│                  RECOMMENDED STACK                   │
├─────────────────┬───────────────────────────────────┤
│ LLM Model       │ Qwen3-8B (balance)                │
│                 │ Qwen3-30B-A3B (high-end)           │
│                 │ Qwen3-4B (máy yếu)                 │
├─────────────────┼───────────────────────────────────┤
│ Embedding       │ BGE-M3 (BAAI/bge-m3)              │
├─────────────────┼───────────────────────────────────┤
│ Reranker        │ Qwen3-Reranker-0.6B               │
│                 │ hoặc bge-reranker-v2-m3            │
├─────────────────┼───────────────────────────────────┤
│ Inference       │ Ollama (dev) → vLLM (production)  │
├─────────────────┼───────────────────────────────────┤
│ Vector DB       │ Qdrant                             │
├─────────────────┼───────────────────────────────────┤
│ RAG Framework   │ LlamaIndex + LangChain             │
├─────────────────┼───────────────────────────────────┤
│ Quantization    │ GGUF Q4_K_M (dev) / AWQ (prod)    │
├─────────────────┼───────────────────────────────────┤
│ Backend         │ FastAPI + Uvicorn                   │
├─────────────────┼───────────────────────────────────┤
│ Frontend        │ Next.js                             │
├─────────────────┼───────────────────────────────────┤
│ Cache           │ Redis                               │
├─────────────────┼───────────────────────────────────┤
│ Database        │ PostgreSQL                          │
├─────────────────┼───────────────────────────────────┤
│ Proxy           │ Nginx                               │
├─────────────────┼───────────────────────────────────┤
│ Container       │ Docker Compose                      │
├─────────────────┼───────────────────────────────────┤
│ Monitoring      │ Prometheus + Grafana                │
└─────────────────┴───────────────────────────────────┘
```

## 8.2 Hardware Recommendation

| Tier | GPU | RAM | Storage | Đánh giá |
|------|-----|-----|---------|----------|
| **Entry** | RTX 3050 6GB | 16GB | 256GB SSD | Chạy Qwen3-4B, RAG cơ bản |
| **Mid** | RTX 4060 8GB | 32GB | 512GB SSD | Chạy Qwen3-8B, RAG đầy đủ |
| **High** | RTX 4090 24GB | 64GB | 1TB NVMe | Chạy Qwen3-30B MoE, production |
| **Server** | 2x RTX 4090 | 128GB | 2TB NVMe | Multi-user, full pipeline |

## 8.3 Cost Estimation (ước tính phần cứng)

| Tier | GPU | Tổng hệ thống | Chi phí/tháng (điện) |
|------|-----|---------------|---------------------|
| Entry | ~$250 | ~$600-800 | ~$10-15 |
| Mid | ~$300 | ~$900-1200 | ~$15-20 |
| High | ~$1600 | ~$2500-3500 | ~$30-50 |
| Server | ~$3200 | ~$5000-7000 | ~$60-100 |

> **So sánh:** Chi phí API OpenAI cho lượng tương đương ≈ $200-500/tháng → ROI local sau 6-12 tháng.

## 8.4 Roadmap Triển Khai

### Phase 1: Foundation (Tuần 1-2)
- [ ] Setup Docker Compose (Ollama + Qdrant + Redis + PostgreSQL)
- [ ] Pull Qwen3-8B model via Ollama
- [ ] Setup BGE-M3 embedding service
- [ ] Tạo FastAPI skeleton với basic chat endpoint
- [ ] Test streaming response

### Phase 2: RAG Pipeline (Tuần 3-4)
- [ ] Implement document upload (PDF/DOCX/TXT)
- [ ] Implement Vietnamese chunking pipeline
- [ ] Setup Qdrant collection với hybrid search
- [ ] Implement RAG retrieval + reranking
- [ ] Test end-to-end RAG pipeline

### Phase 3: Frontend & UX (Tuần 5-6)
- [ ] Build Next.js chat interface
- [ ] WebSocket/SSE streaming
- [ ] Document management UI
- [ ] Multi-turn conversation với Redis
- [ ] Citation display

### Phase 4: Production Hardening (Tuần 7-8)
- [ ] Nginx reverse proxy + TLS
- [ ] JWT authentication
- [ ] Rate limiting
- [ ] Prometheus + Grafana monitoring
- [ ] GPU health checks
- [ ] Error handling & logging

### Phase 5: Optimization (Tuần 9+)
- [ ] Benchmark & tune chunk sizes
- [ ] A/B test embedding models
- [ ] Evaluate reranker impact
- [ ] Optimize VRAM usage
- [ ] Load testing multi-user

## 8.5 Warnings & Pitfalls

> **⚠️ QUAN TRỌNG — Đọc trước khi triển khai:**

1. **Quantization thấp + Tiếng Việt = Giảm chất lượng rõ rệt.** Tiếng Việt có dấu thanh (sắc, huyền, hỏi, ngã, nặng) — quantization Q2/Q3 có thể gây nhầm lẫn dấu. Tối thiểu dùng Q4_K_M.

2. **Context length ≠ Effective context.** Model quảng cáo 128K context nhưng performance giảm đáng kể sau 32K tokens. Với RAG, giữ context dưới 8K-16K cho kết quả tốt nhất.

3. **KV Cache ăn VRAM.** Context càng dài, KV cache càng lớn. RTX 4060 8GB chạy Qwen3-8B Q4_K_M + context 32K có thể OOM. Giữ `num_ctx` ở 4096-8192.

4. **Embedding model KHÔNG cần GPU mạnh.** BGE-M3 chạy tốt trên CPU (chậm hơn ~3x so với GPU). Ưu tiên GPU cho LLM inference.

5. **Chunking quan trọng hơn model.** Nếu RAG cho kết quả kém, 80% do chunking strategy sai, chỉ 20% do model. Hãy optimize chunking trước khi đổi model.

6. **Ollama không phù hợp multi-user production.** Nếu cần phục vụ >5 users đồng thời, chuyển sang vLLM.

7. **Qdrant cần persistent volume.** LUÔN mount volume cho Qdrant. Mất volume = mất toàn bộ embeddings = phải re-index.

8. **Test trên data thật.** Benchmark chung (MTEB, SEA-HELM) không đại diện cho domain cụ thể. LUÔN test trên data thật của bạn.
