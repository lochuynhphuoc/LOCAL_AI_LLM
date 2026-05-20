from __future__ import annotations

from typing import List


def clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return "\n".join(line.strip() for line in text.split("\n") if line.strip())


def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 200) -> List[str]:
    cleaned = clean_text(text)
    if not cleaned:
        return []

    chunks: List[str] = []
    start = 0
    length = len(cleaned)
    while start < length:
        end = min(start + chunk_size, length)
        chunk = cleaned[start:end]
        chunks.append(chunk)
        if end == length:
            break
        start = max(0, end - overlap)

    return chunks
