from __future__ import annotations

import json
from pathlib import Path
from typing import Optional
from xml.etree import ElementTree

import pandas as pd
from docx import Document
from PIL import Image
import pdfplumber
from pypdf import PdfReader
from pptx import Presentation
from striprtf.striprtf import rtf_to_text
import pytesseract


def extract_text(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    try:
        if suffix == ".pdf":
            return _extract_pdf(path)
        if suffix == ".docx":
            return _extract_docx(path)
        if suffix == ".rtf":
            return _extract_rtf(path)
        if suffix == ".pptx":
            return _extract_pptx(path)
        if suffix in {".xlsx", ".xls"}:
            return _extract_excel(path)
        if suffix in {".csv", ".tsv"}:
            return _extract_csv(path, suffix)
        if suffix == ".json":
            return _extract_json(path)
        if suffix == ".xml":
            return _extract_xml(path)
        if suffix in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}:
            return _extract_image(path)

        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def extract_pdf_pages(file_path: str) -> list[str]:
    path = Path(file_path)
    pages: list[str] = []

    # Prefer pdfplumber because it can extract both free text and table content.
    try:
        with pdfplumber.open(str(path)) as pdf:
            for page in pdf.pages:
                parts: list[str] = []

                page_text = page.extract_text() or ""
                if page_text.strip():
                    parts.append(page_text)

                tables = page.extract_tables() or []
                for table_index, table in enumerate(tables):
                    table_text = _format_pdf_table(table, table_index)
                    if table_text:
                        parts.append(table_text)

                pages.append("\n\n".join(parts).strip())
        return pages
    except Exception:
        # Fall back to pypdf so extraction still works even if table parsing fails.
        reader = PdfReader(str(path))
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return pages


def _format_pdf_table(table: list[list[str | None]], table_index: int) -> str:
    normalized_rows = _normalize_pdf_table_rows(table)
    if not normalized_rows:
        return ""

    header_row_count = _detect_pdf_header_rows(normalized_rows)
    header_rows = normalized_rows[:header_row_count]
    data_rows = normalized_rows[header_row_count:]

    headers = _merge_pdf_header_rows(header_rows)
    if not headers:
        headers = [f"Cột {index + 1}" for index in range(len(normalized_rows[0]))]

    rows: list[str] = [f"[TABLE {table_index + 1}]", "Tiêu đề cột:"]
    for index, header in enumerate(headers, start=1):
        rows.append(f"- Cột {index}: {header}")

    if data_rows:
        rows.append("Dữ liệu:")
        for row_index, row in enumerate(data_rows, start=1):
            pairs: list[str] = []
            for column_index, value in enumerate(row):
                if not value:
                    continue
                header = headers[column_index] if column_index < len(headers) else f"Cột {column_index + 1}"
                pairs.append(f"{header}: {value}")
            if pairs:
                rows.append(f"- Dòng {row_index}: " + " | ".join(pairs))

    return "\n".join(rows)


def _normalize_pdf_table_rows(table: list[list[str | None]]) -> list[list[str]]:
    width = max((len(row) for row in table), default=0)
    normalized_rows: list[list[str]] = []

    for raw_row in table:
        row = [(cell or "").replace("\n", " ").strip() for cell in raw_row]
        if len(row) < width:
            row.extend([""] * (width - len(row)))
        if any(row):
            normalized_rows.append(row)

    return normalized_rows


def _detect_pdf_header_rows(rows: list[list[str]]) -> int:
    if not rows:
        return 0
    if len(rows) == 1:
        return 1

    header_row_count = 1
    for index in range(1, min(3, len(rows))):
        row = rows[index]
        if _looks_like_pdf_header_row(row):
            header_row_count += 1
        else:
            break

    return header_row_count


def _looks_like_pdf_header_row(row: list[str]) -> bool:
    cells = [cell for cell in row if cell]
    if not cells:
        return False

    numeric_cells = sum(1 for cell in cells if any(char.isdigit() for char in cell))
    short_cells = sum(1 for cell in cells if len(cell.split()) <= 5)
    sparse_row = sum(1 for cell in row if not cell) >= max(1, len(row) // 2)

    return numeric_cells <= max(1, len(cells) // 3) and (short_cells >= max(1, len(cells) // 2) or sparse_row)


def _merge_pdf_header_rows(header_rows: list[list[str]]) -> list[str]:
    if not header_rows:
        return []

    width = max(len(row) for row in header_rows)
    merged_headers: list[str] = []

    for column_index in range(width):
        parts: list[str] = []
        for row in header_rows:
            if column_index >= len(row):
                continue
            cell = row[column_index].strip()
            if not cell:
                continue
            if cell not in parts:
                parts.append(cell)

        if parts:
            merged_headers.append(" / ".join(parts))
        else:
            merged_headers.append(f"Cột {column_index + 1}")

    return merged_headers


def _extract_pdf(path: Path) -> str:
    return "\n".join(extract_pdf_pages(str(path)))


def _extract_docx(path: Path) -> str:
    doc = Document(str(path))
    return "\n".join(p.text for p in doc.paragraphs if p.text)


def _extract_rtf(path: Path) -> str:
    return rtf_to_text(path.read_text(encoding="utf-8", errors="ignore"))


def _extract_pptx(path: Path) -> str:
    presentation = Presentation(str(path))
    parts = []
    for slide in presentation.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text:
                parts.append(shape.text)
    return "\n".join(parts)


def _extract_excel(path: Path) -> str:
    data = pd.read_excel(path, sheet_name=None, engine="openpyxl")
    parts = []
    for name, frame in data.items():
        parts.append(f"# Sheet: {name}\n{frame.to_csv(index=False)}")
    return "\n".join(parts)


def _extract_csv(path: Path, suffix: str) -> str:
    sep = "\t" if suffix == ".tsv" else ","
    frame = pd.read_csv(path, sep=sep)
    return frame.to_csv(index=False)


def _extract_json(path: Path) -> str:
    data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
    return json.dumps(data, ensure_ascii=False, indent=2)


def _extract_xml(path: Path) -> str:
    tree = ElementTree.parse(path)
    return ElementTree.tostring(tree.getroot(), encoding="unicode")


def _extract_image(path: Path) -> str:
    image = Image.open(path)
    return pytesseract.image_to_string(image)
