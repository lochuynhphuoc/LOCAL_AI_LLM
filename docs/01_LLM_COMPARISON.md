# 1. SO SÁNH CÁC LLM LOCAL HỖ TRỢ TIẾNG VIỆT

> **Cập nhật:** Tháng 5/2026 | **Benchmark tham khảo:** SEA-HELM, VMLU, M3Exam

---

## 1.1 Bảng So Sánh Tổng Quan

| Model | Params | Tiếng Việt | Reasoning | Coding | RAG Quality | Context | VRAM (Q4_K_M) | License |
|-------|--------|-----------|-----------|--------|-------------|---------|---------------|---------|
| **Qwen3-30B-A3B** | 30B MoE (3.3B active) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 128K | ~18GB | Apache 2.0 |
| **Qwen3-8B** | 8B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 128K | ~5GB | Apache 2.0 |
| **Qwen2.5-7B-Instruct** | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 128K | ~4.5GB | Apache 2.0 |
| **Gemma 3 12B** | 12B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 128K | ~7GB | Gemma License |
| **Gemma 3 4B (donglao-vi)** | 4B | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 128K | ~2.5GB | Gemma License |
| **DeepSeek-V3** | 671B MoE (37B active) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 128K | ~120GB+ | DeepSeek License |
| **Llama 3.1 8B** | 8B | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 128K | ~5GB | Llama 3.1 Community |
| **SeaLLM-v3-7B** | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 8K | ~4.5GB | SeaLLM License |
| **Mistral 3 7B** | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 32K | ~4.5GB | Apache 2.0 |
| **Phi-4 14B** | 14B | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 16K | ~8GB | MIT |
| **PhoGPT/ViGPT** | 4-7B | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | 4K | ~3-4.5GB | Research |

## 1.2 Phân Tích Chi Tiết Từng Model

### 🥇 Qwen3-30B-A3B (MoE) — TOP PICK cho tiếng Việt

```
HuggingFace: https://huggingface.co/Qwen/Qwen3-30B-A3B
GGUF:        https://huggingface.co/unsloth/Qwen3-30B-A3B-GGUF
```

- **Kiến trúc:** Mixture-of-Experts, 30B total params nhưng chỉ activate 3.3B mỗi token
- **Tiếng Việt:** Đứng đầu SEA-HELM benchmark cho Vietnamese tasks
- **Thinking Mode:** Hỗ trợ `<think>` tags cho complex reasoning
- **VRAM:** Q4_K_M ≈ 18-19GB → Cần RTX 3090/4090 (24GB) để chạy full GPU
- **Quantization:** GGUF sẵn từ Unsloth (Q4_K_M, Q5_K_M, Q6_K, Q8_0)
- **⚠️ Lưu ý:** Dù chỉ activate 3.3B params, toàn bộ 30B phải load vào memory

### 🥈 Qwen3-8B — Best Balance

```
HuggingFace: https://huggingface.co/Qwen/Qwen3-8B
GGUF:        https://huggingface.co/unsloth/Qwen3-8B-GGUF
```

- **Tiếng Việt:** Rất tốt, kế thừa tokenizer 119 ngôn ngữ
- **VRAM:** Q4_K_M ≈ 5GB → Chạy được trên RTX 4060 (8GB)
- **Context:** 128K tokens
- **Phù hợp:** RAG, chatbot, general tasks

### 🥉 Gemma 3 4B (donglao-vi) — Best cho máy yếu

```
HuggingFace: https://huggingface.co/toandev/donglao-gemma-3-4b-it-vi
Base:        https://huggingface.co/google/gemma-3-4b-it
```

- **Fine-tuned:** Trên dataset `5CD-AI/Viet-ShareGPT-4o-Text-VQA`
- **VRAM:** Q4_K_M ≈ 2.5GB → RTX 3050 (6GB) chạy thoải mái
- **Đặc điểm:** Multimodal (text + image), 128K context

### SeaLLM-v3-7B — Chuyên biệt Đông Nam Á

```
HuggingFace: https://huggingface.co/SeaLLMs/SeaLLM-v3-7B-Chat
GGUF:        https://huggingface.co/itlwas/SeaLLMs-v3-7B-Chat-Q4_K_M-GGUF
```

- **Đặc điểm:** Thiết kế riêng cho SEA languages, hiểu ngữ cảnh văn hóa VN
- **Hạn chế:** Context chỉ 8K, reasoning yếu hơn Qwen3
- **Phù hợp:** Chatbot customer service, nội dung văn hóa VN

## 1.3 Kết Luận Model LLM

| Mục tiêu | Model đề xuất | Lý do |
|-----------|--------------|-------|
| **Máy yếu (6GB VRAM)** | Gemma 3 4B (donglao-vi) Q4_K_M | Fine-tuned tiếng Việt, chỉ ~2.5GB VRAM |
| **Balance (8-12GB VRAM)** | Qwen3-8B Q4_K_M | Tốt nhất trong phân khúc 8B, 128K context |
| **High-end (24GB VRAM)** | Qwen3-30B-A3B Q4_K_M | #1 SEA-HELM benchmark, MoE hiệu quả |
| **RAG tiếng Việt** | Qwen3-8B hoặc Qwen3-30B-A3B | Instruction following xuất sắc, context dài |
| **CPU-only (32GB+ RAM)** | Qwen3-8B Q4_K_M | GGUF offload CPU hoạt động tốt |
