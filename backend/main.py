from __future__ import annotations

import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, List
import builtins
import typing

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient

# Work around a missing Optional import in FlagEmbedding
if not hasattr(builtins, "Optional"):
    builtins.Optional = typing.Optional

from config import settings
from services.rag_service import RagService


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=8192, ge=1, le=16384)
    stream: bool = True
    use_rag: bool = False
    rag_top_k: int = Field(default=4, ge=1, le=10)


class UploadResult(BaseModel):
    filename: str
    chunks: int


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=None)
    app.state.qdrant = QdrantClient(url=settings.qdrant_url)
    app.state.rag = RagService(
        client=app.state.qdrant,
        collection=settings.qdrant_collection,
    )
    app.state.rag.ensure_collection()

    # Print access addresses for other devices
    _print_access_urls()

    yield
    await app.state.http_client.aclose()


def _print_access_urls():
    """Print all network addresses where the chatbot can be accessed."""
    import socket

    print("\n" + "=" * 60)
    print("🚀 GigaChat is running!")
    print("=" * 60)
    print(f"  Local:     http://localhost")

    try:
        hostname = socket.gethostname()
        # Get all IPv4 addresses for this host
        addrs = set()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if not ip.startswith("127."):
                addrs.add(ip)

        # Also try connecting to an external address to find the primary IP
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                primary_ip = s.getsockname()[0]
                addrs.add(primary_ip)
        except Exception:
            pass

        for ip in sorted(addrs):
            print(f"  Network:   http://{ip}")

        if addrs:
            print("-" * 60)
            print("  📱 Open the Network URL on other devices")
            print("     to access GigaChat from your phone/tablet.")
    except Exception:
        print("  (Could not detect network addresses)")

    print("=" * 60 + "\n")


app = FastAPI(title="Local AI LLM", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


async def stream_ollama_chat(payload: dict) -> AsyncGenerator[str, None]:
    url = f"{settings.ollama_base_url}/v1/chat/completions"
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", url, json=payload) as response:
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=await response.aread())

            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        yield "data: [DONE]\n\n"
                        break
                    yield f"data: {data}\n\n"


def _last_user_message(messages: List[ChatMessage]) -> str:
    for message in reversed(messages):
        if message.role == "user":
            return message.content
    return ""


def _build_messages(request: ChatRequest, rag_context: str) -> List[dict]:
    messages = [msg.model_dump() for msg in request.messages]
    if rag_context:
        system_prompt = (
            "You are a helpful assistant. Use the provided context when relevant. "
            "If the context is insufficient, say so. Include citations in the form "
            "[Source: file | Chunk: n].\n\nContext:\n"
            f"{rag_context}"
        )
        return [{"role": "system", "content": system_prompt}] + messages
    return messages


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    rag_context = ""
    if request.use_rag:
        query = _last_user_message(request.messages)
        rag_context = app.state.rag.build_context(query, top_k=request.rag_top_k)

    payload = {
        "model": settings.ollama_model,
        "messages": _build_messages(request, rag_context),
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "stream": True,
        "options": {"num_ctx": settings.ollama_num_ctx},
    }

    async def event_generator() -> AsyncGenerator[str, None]:
        async for chunk in stream_ollama_chat(payload):
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/chat")
async def chat(request: ChatRequest) -> JSONResponse:
    rag_context = ""
    if request.use_rag:
        query = _last_user_message(request.messages)
        rag_context = app.state.rag.build_context(query, top_k=request.rag_top_k)

    url = f"{settings.ollama_base_url}/v1/chat/completions"
    payload = {
        "model": settings.ollama_model,
        "messages": _build_messages(request, rag_context),
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "stream": False,
        "options": {"num_ctx": settings.ollama_num_ctx},
    }

    async with httpx.AsyncClient(timeout=None) as client:
        response = await client.post(url, json=payload)

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    return JSONResponse({"message": content})


@app.post("/documents/upload")
async def upload_document(files: List[UploadFile] = File(...)) -> JSONResponse:
    results: List[UploadResult] = []
    upload_dir = Path("/app/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    for upload in files:
        file_path = upload_dir / upload.filename
        content = await upload.read()
        file_path.write_bytes(content)
        chunks = app.state.rag.ingest_file(str(file_path), upload.filename)
        results.append(UploadResult(filename=upload.filename, chunks=chunks))

    return JSONResponse({"files": [result.model_dump() for result in results]})
