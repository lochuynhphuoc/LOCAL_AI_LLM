from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import List, Sequence

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from services.chunking import chunk_text
from services.text_extraction import extract_text


@dataclass
class RetrievedChunk:
    text: str
    source: str
    index: int


class RagService:
    def __init__(self, client: QdrantClient, collection: str) -> None:
        self._client = client
        self._embedder = None
        self._collection = collection
        self._vector_size = 1024

    def ensure_embedder(self) -> None:
        if self._embedder is not None:
            return
        from FlagEmbedding import BGEM3FlagModel

        self._embedder = BGEM3FlagModel("BAAI/bge-m3", use_fp16=False)

    def ensure_collection(self) -> None:
        collections = self._client.get_collections().collections
        if any(col.name == self._collection for col in collections):
            return
        self._client.create_collection(
            collection_name=self._collection,
            vectors_config=VectorParams(size=self._vector_size, distance=Distance.COSINE),
        )

    def embed_texts(self, texts: Sequence[str]) -> List[List[float]]:
        self.ensure_embedder()
        output = self._embedder.encode(
            list(texts),
            return_dense=True,
            return_sparse=False,
            return_colbert_vecs=False,
        )
        dense = output["dense_vecs"]
        return [vector.tolist() for vector in dense]

    def ingest_file(self, file_path: str, filename: str) -> int:
        text = self.extract_source_text(file_path)
        if not text.strip():
            return 0

        chunks = self.chunk_source_text(text)
        if not chunks:
            return 0

        vectors = self.embed_texts(chunks)
        points = []
        for index, (chunk, vector) in enumerate(zip(chunks, vectors)):
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "text": chunk,
                        "source": filename,
                        "index": index,
                    },
                )
            )

        self._client.upsert(collection_name=self._collection, points=points)
        return len(chunks)

    def extract_source_text(self, file_path: str) -> str:
        return extract_text(file_path)

    def chunk_source_text(self, text: str) -> List[str]:
        return chunk_text(text)

    def retrieve(self, query: str, top_k: int = 4) -> List[RetrievedChunk]:
        if not query.strip():
            return []

        vector = self.embed_texts([query])[0]
        results = self._client.search(
            collection_name=self._collection,
            query_vector=vector,
            limit=top_k,
            with_payload=True,
        )

        chunks: List[RetrievedChunk] = []
        for item in results:
            payload = item.payload or {}
            chunks.append(
                RetrievedChunk(
                    text=str(payload.get("text", "")),
                    source=str(payload.get("source", "")),
                    index=int(payload.get("index", 0)),
                )
            )
        return chunks

    def build_context(self, query: str, top_k: int = 4) -> str:
        chunks = self.retrieve(query, top_k=top_k)
        if not chunks:
            return ""

        parts = []
        for chunk in chunks:
            parts.append(
                f"[Source: {chunk.source} | Chunk: {chunk.index}]\n{chunk.text}"
            )
        return "\n\n".join(parts)
