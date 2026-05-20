# 3. KIẾN TRÚC RAG HOÀN CHỈNH CHO TIẾNG VIỆT

---

## 3.1 Pipeline Tổng Quan

```
User Question
     │
     ▼
┌─────────────────┐
│  Query Rewrite   │  ← LLM rewrite query cho rõ ràng hơn
└────────┬────────┘
         ▼
┌─────────────────┐
│   Embedding      │  ← BGE-M3 (dense + sparse)
└────────┬────────┘
         ▼
┌─────────────────┐
│  Hybrid Search   │  ← Dense (semantic) + Sparse (BM25/lexical)
│  (Qdrant)        │
└────────┬────────┘
         ▼
┌─────────────────┐
│   Reranking      │  ← Qwen3-Reranker-0.6B hoặc bge-reranker-v2-m3
└────────┬────────┘
         ▼
┌─────────────────┐
│ Context Building │  ← Top-K chunks + metadata + citation
└────────┬────────┘
         ▼
┌─────────────────┐
│ LLM Generation   │  ← Qwen3-8B / Qwen3-30B-A3B
└────────┬────────┘
         ▼
┌─────────────────┐
│ Streaming Response│  ← SSE / WebSocket
└─────────────────┘
```

## 3.2 Document Ingestion Pipeline

```
PDF/DOCX/TXT/MD/Image
        │
        ▼
┌───────────────────┐
│  Document Parsing  │  ← Docling (IBM) / Unstructured.io / PyMuPDF
│  + OCR (nếu cần)  │  ← Tesseract / PaddleOCR cho tiếng Việt
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Text Cleaning     │  ← Remove headers/footers, fix encoding
│  + Markdown Output │
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Chunking          │  ← Semantic / Parent-Context chunking
│  + Metadata        │  ← Inject: title, page, section headers
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Embedding         │  ← BGE-M3 (dense + sparse cùng lúc)
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Vector Store      │  ← Qdrant (lưu dense + sparse vectors)
└───────────────────┘
```

## 3.3 Vietnamese Chunking Strategy

### Cấu hình đề xuất

| Tham số | Giá trị | Lý do |
|---------|---------|-------|
| **Chunk size** | 512-768 tokens | Tiếng Việt dài hơn English khi tokenize |
| **Overlap** | 128-200 tokens (~20-25%) | Đảm bảo không mất ngữ cảnh giữa các chunks |
| **Phương pháp** | Semantic + Parent-Context | Giữ nguyên ý nghĩa, pass parent chunk cho LLM |
| **Word segmentation** | KHÔNG cần nếu dùng BGE-M3 | Modern transformers dùng sub-word tokenization |
| **Metadata** | Title, page, section header, source file | Cải thiện retrieval + citation |

### Code mẫu: Vietnamese Semantic Chunking

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
from FlagEmbedding import BGEM3FlagModel

# Option 1: Recursive (ưu tiên paragraph boundaries)
splitter = RecursiveCharacterTextSplitter(
    chunk_size=768,
    chunk_overlap=150,
    separators=["\n\n", "\n", ".", "!", "?", ";", ",", " "],
    length_function=len,
)

# Option 2: Parent-Context Chunking (RECOMMENDED)
from langchain.text_splitter import RecursiveCharacterTextSplitter

parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)

# Index child chunks, nhưng retrieve parent chunks cho LLM
# → Precision cao (child), Context đầy đủ (parent)
```

## 3.4 So Sánh RAG Frameworks

| Tiêu chí | LlamaIndex | LangChain | Haystack |
|----------|------------|-----------|----------|
| **RAG thuần túy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Agent/Tool** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Indexing nâng cao** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Production-ready** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Observability** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ (LangSmith) | ⭐⭐⭐⭐ |
| **Learning curve** | Trung bình | Thấp | Cao |

**Đề xuất 2026:** Kết hợp **LlamaIndex** cho Ingestion/Retrieval + **LangChain/LangGraph** cho Orchestration.

## 3.5 So Sánh Vector Databases

| Database | Production | Filtering | Scale | Ease of Use | Deploy |
|----------|-----------|-----------|-------|-------------|--------|
| **Qdrant** ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Docker |
| **ChromaDB** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Embedded |
| **Milvus** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | K8s |
| **FAISS** | ❌ (library) | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐ | Code |

**Đề xuất:** **Qdrant** — Production-ready, Rust-based, rich metadata filtering, Docker deploy dễ dàng, hỗ trợ hybrid search (dense + sparse vectors).

## 3.6 Tính Năng RAG Nâng Cao

| Feature | Cách thực hiện |
|---------|---------------|
| **Hybrid Search** | BGE-M3 dense + sparse → Qdrant hybrid query |
| **Reranking** | 2-stage: retrieve top-20 → rerank → top-5 cho LLM |
| **Citation** | Mỗi chunk kèm metadata (source, page) → LLM trích dẫn |
| **Multi-turn Memory** | Redis lưu chat history, inject vào prompt |
| **OCR** | PaddleOCR (hỗ trợ VN) / Tesseract-OCR |
| **Metadata Filtering** | Filter theo document type, date, author trước khi search |
