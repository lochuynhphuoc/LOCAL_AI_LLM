# 4. TỐI ƯU LOCAL INFERENCE

---

## 4.1 So Sánh Inference Engines

| Engine | Tốc độ | VRAM Usage | Streaming | Batch | Multi-user | Ease of Use |
|--------|--------|-----------|-----------|-------|------------|-------------|
| **Ollama** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| **llama.cpp** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ❌ | ❌ | ⭐⭐⭐ |
| **vLLM** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ | ✅ | ⭐⭐⭐ |
| **ExLlamaV2** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ❌ | ❌ | ⭐⭐ |
| **TensorRT-LLM** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ | ✅ | ⭐ |

### Khi nào chọn engine nào?

| Scenario | Engine đề xuất | Lý do |
|----------|---------------|-------|
| **Dev/Prototype nhanh** | Ollama | 1 lệnh install, auto download model |
| **Single user, tối ưu VRAM** | llama.cpp | CPU+GPU offload, GGUF native |
| **Production multi-user** | vLLM | PagedAttention, continuous batching |
| **Max speed NVIDIA** | ExLlamaV2 | EXL2 format, fastest tok/s trên single GPU |
| **Enterprise scale** | TensorRT-LLM | NVIDIA optimization, nhưng setup phức tạp |

## 4.2 Setup Theo Từng GPU

### 🔴 RTX 3050 (6GB VRAM)

```bash
# Cài Ollama
winget install Ollama.Ollama

# Model đề xuất
ollama pull qwen3:4b          # ~2.5GB VRAM, best cho 6GB
ollama pull gemma3:4b          # Alternative

# Chạy với giới hạn context
ollama run qwen3:4b --num-ctx 4096

# ⚠️ KHÔNG chạy model 7B+ trên 6GB → sẽ spill sang RAM, rất chậm
```

**Config tối ưu:**
```
Model: Qwen3-4B Q4_K_M
Context: 4096 tokens (max khuyến nghị)
Batch size: 512
GPU Layers: ALL (full offload)
Tokens/s ước tính: 15-25 tok/s
```

### 🟡 RTX 4060 (8GB VRAM)

```bash
# Model đề xuất
ollama pull qwen3:8b           # ~5GB VRAM, best balance
ollama pull qwen2.5-coder:7b   # Cho coding tasks

# Chạy
ollama run qwen3:8b --num-ctx 8192
```

**Config tối ưu:**
```
Model: Qwen3-8B Q4_K_M
Context: 8192 tokens
Batch size: 512
GPU Layers: ALL
Tokens/s ước tính: 20-35 tok/s
```

### 🟢 RTX 4090 (24GB VRAM)

```bash
# Model đề xuất — CHẠY FULL Qwen3-30B MoE
ollama pull qwen3:30b-a3b      # ~18GB VRAM

# Hoặc dùng vLLM cho production
pip install vllm
vllm serve Qwen/Qwen3-30B-A3B \
  --quantization awq \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.9 \
  --port 8000
```

**Config tối ưu:**
```
Model: Qwen3-30B-A3B Q4_K_M (hoặc AWQ cho vLLM)
Context: 32768 tokens
GPU Layers: ALL
Engine: vLLM (production) / Ollama (dev)
Tokens/s ước tính: 40-60 tok/s
```

### ⚪ CPU-Only (32GB+ RAM)

```bash
# Dùng llama.cpp server
# Build từ source hoặc download binary
llama-server \
  -m ./models/qwen3-8b-q4_k_m.gguf \
  --host 0.0.0.0 \
  --port 8080 \
  -ngl 0 \         # 0 GPU layers = full CPU
  -c 4096 \
  -t 8             # Số CPU threads

# Tokens/s: 3-8 tok/s (chậm nhưng hoạt động)
```

## 4.3 Ollama Quick Setup (Đề xuất cho Development)

```bash
# 1. Install
winget install Ollama.Ollama

# 2. Pull models
ollama pull qwen3:8b                    # Main LLM
ollama pull bge-m3                      # Embedding model (nếu có)
ollama pull qwen3-reranker:0.6b         # Reranker (nếu có)

# 3. Test
ollama run qwen3:8b "Giải thích machine learning bằng tiếng Việt"

# 4. API endpoint (OpenAI-compatible)
# http://localhost:11434/v1/chat/completions
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:8b",
    "messages": [{"role": "user", "content": "Xin chào!"}],
    "stream": true
  }'
```

---

# 5. QUANTIZATION

## 5.1 So Sánh Các Định Dạng Quantization

| Format | Backend | CPU Support | GPU Offload | Mixed Precision | Dùng với |
|--------|---------|------------|-------------|-----------------|----------|
| **GGUF** | llama.cpp/Ollama | ✅ | ✅ Partial | ✅ | Ollama, LM Studio, llama.cpp |
| **AWQ** | CUDA only | ❌ | ✅ Full | ❌ | vLLM, TGI |
| **GPTQ** | CUDA only | ❌ | ✅ Full | ❌ | vLLM, TGI, AutoGPTQ |
| **EXL2** | CUDA only | ❌ | ✅ Full | ✅ Custom bpw | ExLlamaV2 |

## 5.2 GGUF Quantization Levels

| Quant | Bits | Size vs FP16 | Quality vs FP16 | VRAM (7B model) | Đề xuất |
|-------|------|-------------|-----------------|-----------------|---------|
| **Q8_0** | 8-bit | ~50% | ~99%+ | ~8GB | Khi đủ VRAM, gần FP16 |
| **Q6_K** | 6-bit | ~40% | ~98% | ~6GB | High quality, vừa VRAM |
| **Q5_K_M** | 5-bit | ~35% | ~97% | ~5.5GB | Tốt cho coding/reasoning |
| **Q4_K_M** | 4-bit | ~25% | ~95% | ~4.5GB | **⭐ Sweet spot** |
| **Q3_K_M** | 3-bit | ~20% | ~90% | ~3.5GB | Máy yếu, chấp nhận giảm chất lượng |
| **Q2_K** | 2-bit | ~15% | ~80% | ~2.5GB | ⚠️ Chất lượng giảm đáng kể |

## 5.3 Đề Xuất Quantization

| Mục đích | Format | Level | Lý do |
|----------|--------|-------|-------|
| **RAG tiếng Việt** | GGUF | Q5_K_M | RAG cần accuracy cao, instruction following tốt |
| **Chatbot general** | GGUF | Q4_K_M | Balance tốt nhất |
| **Máy yếu 6GB** | GGUF | Q4_K_M (model nhỏ) | Tiết kiệm VRAM tối đa |
| **Production vLLM** | AWQ | 4-bit | Giữ reasoning quality, tối ưu throughput |
| **Max speed** | EXL2 | 4.0-5.0 bpw | Fastest trên NVIDIA |

> **⚠️ Pitfall:** Tiếng Việt nhạy cảm hơn English với quantization thấp. Tránh dùng Q2_K/Q3 cho Vietnamese tasks quan trọng — accuracy drop đáng kể ở dấu thanh và từ đồng âm.
