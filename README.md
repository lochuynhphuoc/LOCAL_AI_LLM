# 🌿 GigaChat — Local AI Chatbot for Smart Farming

<div align="center">

**A fully local, privacy-first AI assistant for agriculture and crop cultivation,
powered by Qwen3 LLM and RAG (Retrieval-Augmented Generation).**

[![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)](#quick-start)
[![Ollama](https://img.shields.io/badge/Ollama-000000?logo=ollama&logoColor=white)](#tech-stack)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=next.js&logoColor=white)](#tech-stack)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](#tech-stack)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Access from Other Devices](#access-from-other-devices)
- [Configuration](#configuration)
- [RAG Pipeline](#rag-pipeline)
- [Project Structure](#project-structure)
- [Supported File Formats](#supported-file-formats)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

GigaChat is a **100% local** AI chatbot designed for smart farming consultations. All data stays on your machine — no cloud APIs, no data leaks. It uses:

- **Qwen3 8B** as the core LLM (via Ollama)
- **BGE-M3** embeddings for multilingual semantic search (optimized for Vietnamese)
- **Qdrant** vector database for document storage and retrieval
- **RAG pipeline** so the AI can reference your uploaded farming documents

---

## Features

| Feature                             | Description                                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| 💬**Streaming Chat**          | Real-time token streaming for a responsive conversational experience |
| 📚**RAG Document Search**     | Upload your documents and ask questions — the AI cites its sources  |
| 🌐**Vietnamese Optimized**    | Model and embeddings chosen for strong Vietnamese language support   |
| 🔒**Fully Local**             | Everything runs on your machine. Zero data sent externally           |
| 📱**Network Access**          | Access the chatbot from phones/tablets on the same network           |
| 📁**Multi-format Upload**     | PDF, DOCX, XLSX, CSV, PPTX, images (OCR), code files, and more       |
| 🎨**Premium UI**              | Glassmorphism dark theme with smooth animations built on Next.js 15  |
| 📌**Conversation Management** | Pin, rename, delete, and export consultation history                 |
| ⚙️**Configurable**          | Adjust model, temperature, context length, and RAG parameters        |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Compose                       │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  Nginx   │───▶│   Next.js    │    │    Ollama     │  │
│  │ (port 80)│    │  Frontend    │    │  (Qwen3 8B)  │  │
│  │          │    │  (port 3000) │    │  (port 11434) │  │
│  └────┬─────┘    └──────────────┘    └───────┬───────┘  │
│       │                                      │          │
│       │          ┌──────────────┐             │          │
│       └─────────▶│   FastAPI    │─────────────┘          │
│                  │   Backend    │                        │
│                  │  (port 8000) │                        │
│                  └──────┬───────┘                        │
│                         │                               │
│                  ┌──────┴───────┐                        │
│                  │   Qdrant     │                        │
│                  │  Vector DB   │                        │
│                  │ (port 6333)  │                        │
│                  └──────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

**Request Flow:**

1. User opens the UI in the browser (port 80)
2. Nginx reverse-proxies `/api/*` requests to FastAPI and everything else to Next.js
3. FastAPI communicates with Ollama for LLM inference and Qdrant for vector search
4. When RAG is enabled, FastAPI retrieves relevant document chunks from Qdrant, injects them as context, and streams the LLM response back

---

## Tech Stack

| Layer                      | Technology                                                | Purpose                                    |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| **LLM**              | [Ollama](https://ollama.com/) + Qwen3 8B                     | Vietnamese-capable local language model    |
| **Embeddings**       | [BGE-M3](https://huggingface.co/BAAI/bge-m3) (FlagEmbedding) | Multilingual dense embeddings (1024-dim)   |
| **Vector DB**        | [Qdrant](https://qdrant.tech/)                               | High-performance vector similarity search  |
| **Backend**          | [FastAPI](https://fastapi.tiangolo.com/) + Python 3.11       | REST API, streaming SSE, RAG orchestration |
| **Frontend**         | [Next.js 15](https://nextjs.org/) + React 18 + TailwindCSS 3 | Premium dark-themed UI with glassmorphism  |
| **Reverse Proxy**    | Nginx (Alpine)                                            | Request routing and rate limiting          |
| **OCR**              | [Tesseract](https://github.com/tesseract-ocr/tesseract)      | Extract text from uploaded images          |
| **Containerization** | Docker Compose                                            | One-command orchestration of all services  |

---

## Prerequisites

| Requirement              | Minimum                                  |
| ------------------------ | ---------------------------------------- |
| **OS**             | Windows 10/11 (WSL2), macOS, or Linux    |
| **Docker Desktop** | Latest version with WSL2 engine enabled  |
| **RAM**            | 16 GB (8 GB for the model + system)      |
| **GPU**            | NVIDIA GPU with 8+ GB VRAM (recommended) |
| **NVIDIA Drivers** | Latest (for GPU acceleration via Docker) |
| **Disk Space**     | ~10 GB (model weights + Docker images)   |

> **Note:** GigaChat can run CPU-only, but GPU acceleration significantly improves response speed.

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/lochuynhphuoc/LOCAL_AI_LLM.git
cd LOCAL_AI_LLM
```

### 2. Build and start all services

```powershell
docker compose up --build
```

The first run will:

- Build the FastAPI and Next.js Docker images
- Pull the Ollama, Qdrant, and Nginx images
- Download the Qwen3 8B model (~5 GB) on the first chat request

### 3. Open the UI

Navigate to **http://localhost** in your browser.

### 4. Verify the API

```bash
curl http://localhost/api/health
# Expected: {"status": "ok"}
```

### 5. Stop all services

```powershell
docker compose down
```

To also remove stored model data and vectors:

```powershell
docker compose down -v
```

---

## Access from Other Devices

When GigaChat starts, the backend prints all available network addresses in the console:

```
============================================================
🚀 GigaChat is running!
============================================================
  Local:     http://localhost
  Network:   http://192.168.1.100
------------------------------------------------------------
  📱 Open the Network URL on other devices
     to access GigaChat from your phone/tablet.
============================================================
```

**Steps:**

1. Make sure the other device is on the **same Wi-Fi/LAN network**
2. Open the `Network` URL shown in the console (e.g., `http://192.168.1.100`)
3. If it doesn't work, check your **firewall** allows inbound connections on port 80

---

## Configuration

All configuration is done via environment variables in [`docker-compose.yml`](docker-compose.yml):

| Variable                     | Default                | Description                                       |
| ---------------------------- | ---------------------- | ------------------------------------------------- |
| `OLLAMA_MODEL`             | `qwen3:8b`           | Ollama model name (change to any supported model) |
| `OLLAMA_NUM_CTX`           | `8192`               | Context window size (tokens)                      |
| `OLLAMA_NUM_PARALLEL`      | `2`                  | Max concurrent Ollama requests                    |
| `OLLAMA_MAX_LOADED_MODELS` | `1`                  | Max models loaded in memory                       |
| `CORS_ORIGINS`             | `http://localhost`   | Allowed CORS origins (comma-separated)            |
| `QDRANT_URL`               | `http://qdrant:6333` | Qdrant vector database URL                        |
| `QDRANT_COLLECTION`        | `local_ai_docs`      | Name of the Qdrant collection                     |

### Changing the Model

```yaml
# In docker-compose.yml, under fastapi > environment:
- OLLAMA_MODEL=qwen3:4b   # Use a smaller model for less VRAM
```

Popular alternatives: `qwen3:4b`, `qwen3:1.7b`, `llama3.1:8b`, `gemma2:9b`

---

## RAG Pipeline

The RAG (Retrieval-Augmented Generation) pipeline lets the AI reference your uploaded documents when answering questions.

### How It Works

```
Upload Document → Extract Text → Chunk Text → Embed (BGE-M3) → Store in Qdrant
                                                                       │
User Question → Embed Query → Vector Search (Top-K) → Inject Context → LLM Answer
```

1. **Text Extraction** — Supports 15+ file formats via dedicated parsers
2. **Chunking** — Splits text into 2000-character chunks with 200-character overlap
3. **Embedding** — Uses BGE-M3 to produce 1024-dimensional dense vectors
4. **Storage** — Vectors are stored in Qdrant with cosine similarity indexing
5. **Retrieval** — On query, the top-K most similar chunks are retrieved
6. **Augmentation** — Retrieved chunks are injected as context into the LLM prompt
7. **Generation** — The LLM generates an answer citing sources as `[Source: file | Chunk: n]`

### Usage

1. Navigate to **Plant Knowledge** in the sidebar
2. Upload documents (drag & drop or click to select)
3. Go to the chat and enable **RAG toggle** before sending your question
4. The AI will reference your documents and cite its sources

---

## Project Structure

```
LOCAL_AI_LLM/
├── backend/                    # FastAPI backend
│   ├── Dockerfile
│   ├── main.py                 # API endpoints (chat, upload, health)
│   ├── config.py               # Environment-based configuration
│   ├── requirements.txt        # Python dependencies
│   └── services/
│       ├── rag_service.py      # RAG orchestration (embed, ingest, retrieve)
│       ├── text_extraction.py  # Multi-format text extraction
│       └── chunking.py         # Text chunking with overlap
│
├── frontend/                   # Next.js 15 frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Inter font
│   │   ├── globals.css         # Design system (glassmorphism theme)
│   │   ├── page.tsx            # Landing page
│   │   ├── chat/               # Chat page
│   │   ├── knowledge/          # Knowledge upload page
│   │   └── settings/           # Settings page
│   ├── components/
│   │   ├── layout/             # AppShell, Sidebar, Topbar
│   │   ├── chat/               # MessageList, Composer, TypingIndicator, etc.
│   │   ├── knowledge/          # UploadZone
│   │   ├── markdown/           # Markdown rendering
│   │   └── ui/                 # Radix UI primitives (ScrollArea, Sheet, etc.)
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Zustand store, utilities
│
├── nginx/
│   └── nginx.conf              # Reverse proxy config with rate limiting
│
├── data/
│   └── uploads/                # Uploaded documents (persistent volume)
│
├── docs/                       # Research & design documents
│   ├── 01_LLM_COMPARISON.md
│   ├── 02_EMBEDDING_RERANKER.md
│   ├── 03_RAG_ARCHITECTURE.md
│   ├── 04_INFERENCE_QUANTIZATION.md
│   ├── 05_PRODUCTION_ARCHITECTURE.md
│   └── 06_FINAL_RECOMMENDATION.md
│
├── docker-compose.yml          # Service orchestration
└── README.md                   # This file
```

---

## Supported File Formats

| Category                | Formats                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| **Documents**     | PDF, DOCX, RTF, TXT, Markdown (.md)                               |
| **Spreadsheets**  | XLSX, XLS, CSV, TSV                                               |
| **Presentations** | PPTX                                                              |
| **Data**          | JSON, XML                                                         |
| **Images (OCR)**  | PNG, JPG, JPEG, GIF, WebP, BMP                                    |
| **Code**          | .py, .js, .ts, .java, .c, .cpp, .html, .css, and other text files |

---

## Troubleshooting

| Problem                 | Solution                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Chat is very slow       | Ensure GPU is visible to Docker Desktop. Check `nvidia-smi` works inside Docker                |
| API returns 502         | Ollama is still downloading the model. Wait for download to complete                             |
| Port 80 is busy         | Stop conflicting services (IIS, Apache, etc.) or change the Nginx port in `docker-compose.yml` |
| Out of memory           | Use a smaller model (`qwen3:4b`) or reduce `OLLAMA_NUM_CTX`                                  |
| Can't access from phone | Check firewall rules. Both devices must be on the same network                                   |
| Upload fails            | Check that the file format is supported. See logs with `docker compose logs fastapi`           |
| BGE-M3 download slow    | First upload triggers model download (~2.4 GB). Subsequent uploads are fast                      |

### Viewing Logs

```powershell
# All services
docker compose logs -f

# Specific service
docker compose logs -f fastapi
docker compose logs -f ollama
docker compose logs -f frontend
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 🌿 for smarter farming**

</div>
