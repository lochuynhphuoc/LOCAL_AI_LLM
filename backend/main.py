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
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient

# Work around a missing Optional import in FlagEmbedding
if not hasattr(builtins, "Optional"):
    builtins.Optional = typing.Optional

from config import settings
from services.text_extraction import extract_pdf_pages
from services.rag_service import RagService, RetrievedChunk


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


class DeleteResult(BaseModel):
    filename: str
    deleted: bool = True


class SourceDocumentResponse(BaseModel):
    filename: str
    text: str
    chunks: List[str]
    chunk_index: int
    chunk_text: str
    page_texts: List[str] | None = None
    page_index: int | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    import threading

    app.state.http_client = httpx.AsyncClient(timeout=None)
    app.state.qdrant = QdrantClient(url=settings.qdrant_url)
    app.state.rag = RagService(
        client=app.state.qdrant,
        collection=settings.qdrant_collection,
    )
    app.state.rag.ensure_collection()
    app.state.embedder_ready = False

    # Preload embedding model in background so server starts immediately
    def _preload():
        try:
            logging.warning("⏳ Preloading embedding model (bge-m3) in background...")
            app.state.rag.ensure_embedder()
            app.state.embedder_ready = True
            logging.warning("✅ Embedding model ready.")
        except Exception:
            logging.exception("❌ Failed to load embedding model")

    threading.Thread(target=_preload, daemon=True).start()

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


def _build_rag_context(chunks: List[RetrievedChunk]) -> str:
    if not chunks:
        return ""

    parts = []
    for chunk in chunks:
        parts.append(f"[Source: {chunk.source} | Chunk: {chunk.index}]\n{chunk.text}")
    return "\n\n".join(parts)


def _build_citation_footer(chunks: List[RetrievedChunk]) -> str:
    if not chunks:
        return ""

    unique_refs: List[tuple[str, int]] = []
    seen: set[tuple[str, int]] = set()
    for chunk in chunks:
        key = (chunk.source, chunk.index)
        if key in seen:
            continue
        seen.add(key)
        unique_refs.append(key)

    lines = ["Nguồn tham khảo:"]
    for source, index in unique_refs:
        lines.append(f"- [Source: {source} | Chunk: {index}]")
    return "\n" + "\n".join(lines)


def _upload_dir() -> Path:
    return Path("/app/uploads")


def _list_uploaded_files() -> List[UploadResult]:
    upload_dir = _upload_dir()
    if not upload_dir.exists():
        return []

    results: List[UploadResult] = []
    for file_path in sorted(
        (
            path
            for path in upload_dir.iterdir()
            if path.is_file() and not path.name.startswith(".")
        ),
        key=lambda path: path.name.lower(),
    ):
        try:
            text = app.state.rag.extract_source_text(str(file_path))
            chunks = app.state.rag.chunk_source_text(text)
            results.append(UploadResult(filename=file_path.name, chunks=len(chunks)))
        except Exception:
            results.append(UploadResult(filename=file_path.name, chunks=0))
    return results


def _delete_uploaded_file(filename: str) -> None:
    safe_name = Path(filename).name
    if safe_name.startswith("."):
        raise HTTPException(status_code=400, detail="Hidden files cannot be deleted through this endpoint")
    file_path = _upload_dir() / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Source file not found")

    try:
        app.state.rag.delete_source(safe_name)
    except Exception:
        import logging

        logging.exception("Failed to remove vector records for %s", safe_name)

    file_path.unlink()


async def stream_ollama_chat(payload: dict, citation_footer: str = "") -> AsyncGenerator[str, None]:
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
                        if citation_footer:
                            citation_chunk = {
                                "id": "rag-citation",
                                "object": "chat.completion.chunk",
                                "created": 0,
                                "model": settings.ollama_model,
                                "choices": [
                                    {
                                        "index": 0,
                                        "delta": {"content": f"\n\n{citation_footer}"},
                                        "finish_reason": None,
                                    }
                                ],
                            }
                            yield f"data: {json.dumps(citation_chunk, ensure_ascii=False)}\n\n"
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
            "You are a helpful assistant. Prefer facts from the provided context. "
            "If the context is insufficient, explicitly say so. Include citations in the form "
            "[Source: file | Chunk: n].\n\nContext:\n"
            f"{rag_context}"
        )
        return [{"role": "system", "content": system_prompt}] + messages
    return messages


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    rag_context = ""
    citation_footer = ""
    if request.use_rag:
        query = _last_user_message(request.messages)
        retrieved_chunks = app.state.rag.retrieve(query, top_k=request.rag_top_k)
        rag_context = _build_rag_context(retrieved_chunks)
        citation_footer = _build_citation_footer(retrieved_chunks)

    payload = {
        "model": settings.ollama_model,
        "messages": _build_messages(request, rag_context),
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "stream": True,
        "options": {"num_ctx": settings.ollama_num_ctx},
    }

    async def event_generator() -> AsyncGenerator[str, None]:
        async for chunk in stream_ollama_chat(payload, citation_footer=citation_footer):
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/chat")
async def chat(request: ChatRequest) -> JSONResponse:
    rag_context = ""
    citation_footer = ""
    if request.use_rag:
        query = _last_user_message(request.messages)
        retrieved_chunks = app.state.rag.retrieve(query, top_k=request.rag_top_k)
        rag_context = _build_rag_context(retrieved_chunks)
        citation_footer = _build_citation_footer(retrieved_chunks)

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
    if citation_footer:
        content = f"{content}\n\n{citation_footer}"
    return JSONResponse({"message": content})


@app.get("/documents/uploads")
async def list_uploaded_documents() -> JSONResponse:
    return JSONResponse({"files": [result.model_dump() for result in _list_uploaded_files()]})


@app.post("/documents/upload")
async def upload_document(files: List[UploadFile] = File(...)) -> JSONResponse:
    import logging

    if not getattr(app.state, "embedder_ready", False):
        raise HTTPException(
            status_code=503,
            detail="Embedding model is still loading. Please wait and try again.",
        )

    logger = logging.getLogger("upload")
    results: List[UploadResult] = []
    upload_dir = _upload_dir()
    upload_dir.mkdir(parents=True, exist_ok=True)

    for upload in files:
        try:
            file_path = upload_dir / upload.filename
            content = await upload.read()
            file_path.write_bytes(content)
            logger.info("Processing file: %s (%d bytes)", upload.filename, len(content))
            chunks = app.state.rag.ingest_file(str(file_path), upload.filename)
            logger.info("File %s indexed: %d chunks", upload.filename, chunks)
            results.append(UploadResult(filename=upload.filename, chunks=chunks))
        except Exception as exc:
            logger.exception("Failed to process file %s", upload.filename)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process {upload.filename}: {exc}",
            )

    return JSONResponse({"files": [result.model_dump() for result in results]})


@app.delete("/documents/file")
async def delete_source_file(filename: str) -> JSONResponse:
    _delete_uploaded_file(filename)
    safe_name = Path(filename).name
    return JSONResponse(DeleteResult(filename=safe_name).model_dump())


@app.get("/documents/source")
async def get_source_document(filename: str, chunk: int = 0) -> JSONResponse:
    upload_dir = _upload_dir()
    safe_name = Path(filename).name
    if safe_name.startswith("."):
        raise HTTPException(status_code=404, detail="Source file not found")
    file_path = upload_dir / safe_name

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Source file not found")

    text = app.state.rag.extract_source_text(str(file_path))
    chunks = app.state.rag.chunk_source_text(text)
    if not chunks:
        raise HTTPException(status_code=404, detail="No extracted text found")

    page_texts: List[str] | None = None
    page_index: int | None = None
    if safe_name.lower().endswith(".pdf"):
        page_texts = extract_pdf_pages(str(file_path))
        normalized_chunk = " ".join(chunks[max(0, min(chunk, len(chunks) - 1))].split()).casefold()
        for index, page_text in enumerate(page_texts):
          normalized_page = " ".join(page_text.split()).casefold()
          if normalized_chunk and normalized_chunk in normalized_page:
              page_index = index
              break

    chunk_index = max(0, min(chunk, len(chunks) - 1))
    return JSONResponse(
        SourceDocumentResponse(
            filename=safe_name,
            text=text,
            chunks=chunks,
            chunk_index=chunk_index,
            chunk_text=chunks[chunk_index],
            page_texts=page_texts,
            page_index=page_index,
        ).model_dump()
    )


@app.get("/documents/file")
async def download_source_file(filename: str) -> FileResponse:
    upload_dir = _upload_dir()
    safe_name = Path(filename).name
    if safe_name.startswith("."):
        raise HTTPException(status_code=404, detail="Source file not found")
    file_path = upload_dir / safe_name

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Source file not found")

    return FileResponse(path=file_path, filename=safe_name)
