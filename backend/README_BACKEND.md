Backend service for the local LLM and RAG pipeline. Run via docker-compose at repo root.

Endpoints exposed by this service:
- `POST /chat` and `POST /chat/stream` for model responses
- `POST /documents/upload` for file ingestion and indexing
- `GET /documents/source` for source review and chunk inspection
- `GET /documents/file` for opening the original uploaded file

PDF extraction uses table-aware parsing so multi-row table headers and cell values are preserved better during RAG ingestion. After updating extraction logic, re-upload documents so Qdrant stores the refreshed chunks.
