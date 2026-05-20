# 2. EMBEDDING MODEL CHO TIẾNG VIỆT

---

## 2.1 Bảng So Sánh Embedding Models

| Model | Dims | Max Tokens | Tiếng Việt | Hybrid Search | VRAM/RAM | Speed | License |
|-------|------|-----------|-----------|---------------|----------|-------|---------|
| **BGE-M3** | 1024 | 8192 | ⭐⭐⭐⭐⭐ | ✅ Dense+Sparse+Multi-vector | ~2GB GPU / ~4GB RAM | Trung bình | MIT |
| **Jina Embeddings v4** | 2048 | 32000 | ⭐⭐⭐⭐ | ✅ Single+Multi-vector | ~6GB GPU | Chậm hơn | cc-by-nc-4.0 |
| **multilingual-e5-large** | 1024 | 512 | ⭐⭐⭐⭐ | ❌ Dense only | ~1.5GB GPU / ~3GB RAM | Nhanh | MIT |
| **multilingual-e5-small** | 384 | 512 | ⭐⭐⭐ | ❌ Dense only | ~400MB | Rất nhanh | MIT |
| **Vietnamese_Embedding_v2** | 1024 | 8192 | ⭐⭐⭐⭐⭐ | ❌ Dense only | ~2GB GPU | Trung bình | Apache 2.0 |
| **AITeamVN/Vietnamese_Embedding** | 1024 | 8192 | ⭐⭐⭐⭐⭐ | ✅ (BGE-M3 fine-tuned) | ~2GB GPU | Trung bình | Apache 2.0 |
| **gte-multilingual-base** | 768 | 8192 | ⭐⭐⭐⭐ | ❌ Dense only | ~600MB | Nhanh | Apache 2.0 |

## 2.2 Phân Tích Chi Tiết

### 🥇 BGE-M3 (BAAI) — TOP PICK

```
HuggingFace: https://huggingface.co/BAAI/bge-m3
```

**Tại sao chọn BGE-M3:**
- **Multi-Functionality:** Hỗ trợ đồng thời Dense, Sparse (lexical), và Multi-vector retrieval
- **Multi-Granularity:** Xử lý từ câu ngắn đến tài liệu dài (8192 tokens)
- **Multi-Lingual:** 100+ ngôn ngữ bao gồm tiếng Việt
- **Hybrid Search tích hợp:** Không cần setup BM25 riêng, sparse retrieval của BGE-M3 thay thế được
- **Community mạnh:** Là base model cho nhiều Vietnamese fine-tune

**Cách sử dụng:**
```python
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)

# Dense + Sparse embeddings cùng lúc
output = model.encode(
    ["Trường Đại học Bách Khoa TP.HCM là trường kỹ thuật hàng đầu"],
    return_dense=True,
    return_sparse=True,
    return_colbert_vecs=True
)

dense_vecs = output['dense_vecs']    # Cho semantic search
sparse_vecs = output['lexical_weights']  # Cho keyword search
colbert_vecs = output['colbert_vecs']    # Cho fine-grained matching
```

### 🥈 AITeamVN/Vietnamese_Embedding — Best cho domain-specific VN

```
HuggingFace: https://huggingface.co/AITeamVN/Vietnamese_Embedding
```

- Fine-tuned từ BGE-M3 trên Vietnamese datasets (Zalo Legal Text, etc.)
- Outperform BGE-M3 base trên formal/institutional Vietnamese documents
- Phù hợp: legal, government, academic Vietnamese text

### 🥉 Jina Embeddings v4 — Best cho Visual Documents

```
HuggingFace: https://huggingface.co/jinaai/jina-embeddings-v4
```

- **Multimodal:** Xử lý cả text lẫn image (charts, tables, diagrams)
- **32K context:** Dài nhất trong nhóm
- **Late-interaction (ColBERT-style):** Precision cao cho complex retrieval
- **⚠️ Lưu ý:** Tốn VRAM hơn (~6GB), license cc-by-nc-4.0

## 2.3 Kết Luận Embedding Model

| Mục tiêu | Model đề xuất | Lý do |
|-----------|--------------|-------|
| **Best overall cho VN** | BGE-M3 | Hybrid search tích hợp, 100+ ngôn ngữ, community mạnh |
| **Domain-specific VN** | AITeamVN/Vietnamese_Embedding | Fine-tuned trên VN data, outperform trên legal/formal text |
| **Visual documents** | Jina Embeddings v4 | Xử lý PDF có charts/tables/images |
| **Máy yếu / CPU** | multilingual-e5-small | Chỉ 400MB, rất nhanh |
| **Balance tốc độ/chất lượng** | multilingual-e5-large | 1.5GB, proven, easy deploy |

---

# 3. RERANKER MODELS

| Model | Params | Multilingual | Context | License | Phù hợp |
|-------|--------|-------------|---------|---------|---------|
| **Qwen3-Reranker-0.6B** | 0.6B | ✅ 100+ langs | 32K | Apache 2.0 | Nhẹ, nhanh |
| **Qwen3-Reranker-4B** | 4B | ✅ 100+ langs | 32K | Apache 2.0 | **Best balance** |
| **bge-reranker-v2-m3** | ~560M | ✅ | 8K | MIT | Lightweight baseline |
| **thanhtantran/Vietnamese_Reranker** | ~560M | 🇻🇳 VN-focused | 8K | Apache 2.0 | Vietnamese specialized |
| **ViRanker** | ~560M | 🇻🇳 VN-focused | 8K | Research | Vietnamese cross-encoder |

**Đề xuất:** `Qwen3-Reranker-0.6B` cho máy yếu, `thanhtantran/Vietnamese_Reranker` cho VN-specific tasks.
