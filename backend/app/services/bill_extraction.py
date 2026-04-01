from paddleocr import PaddleOCR
from collections import Counter


def _build_ocr_model():
    recog_model_path = r"../../Default_models/rec"
    det_model_path = r"../../Default_models/det"
    return PaddleOCR(
        use_angle_cls=False,
        lang="en",
        recog_model_path=recog_model_path,
        det_model_path=det_model_path,
    )

def _normalize_row(row_texts, columns_per_row):
    if len(row_texts) == columns_per_row:
        return row_texts

    if len(row_texts) > columns_per_row:
        # Keep first columns fixed, merge overflow into last column.
        return row_texts[: columns_per_row - 1] + [" ".join(row_texts[columns_per_row - 1 :])]

    return row_texts + [""] * (columns_per_row - len(row_texts))


def _find_table_boundaries(lines):
    """Find start and end line indices for the item table.

    Start line is the header that contains at least one known start keyword.
    End line is the first line after start that contains a total marker.
    Matching is case-insensitive.
    """
    start_keywords = ("s.no", "sno", "amount", "name", "item", "items", "qty", "quantity", "rate")
    end_keywords = ("total", "grand total", "net total", "sub total", "subtotal")

    start_idx = None
    end_idx = None

    for idx, line in enumerate(lines):
        line_text = " ".join(w["text"] for w in line["words"]).casefold()
        if start_idx is None:
            if any(keyword in line_text for keyword in start_keywords):
                start_idx = idx
            continue

        # End marker search begins only after table header is found.
        if any(keyword in line_text for keyword in end_keywords):
            end_idx = idx
            break

    return start_idx, end_idx


def _infer_columns_per_row(lines, start_idx, end_idx, default=5):
    """Infer number of table columns from header + item lines."""
    candidate_counts = []

    # Header count is a strong signal when OCR detects it cleanly.
    if start_idx is not None and 0 <= start_idx < len(lines):
        header_count = len(lines[start_idx]["words"])
        if header_count >= 2:
            candidate_counts.append(header_count)

    if start_idx is not None and end_idx is not None and end_idx > start_idx:
        selected_lines = lines[start_idx + 1 : end_idx]
    elif start_idx is not None:
        selected_lines = lines[start_idx + 1 :]
    else:
        selected_lines = lines

    for line in selected_lines:
        count = len(line["words"])
        if count >= 2:
            candidate_counts.append(count)

    if not candidate_counts:
        return default

    # Use the most frequent count. Tie-breaker prefers larger count.
    count_frequency = Counter(candidate_counts)
    return max(count_frequency.items(), key=lambda item: (item[1], item[0]))[0]


def _is_header_like_row(row_texts):
    """Return True when a row looks like table header labels, not item data."""
    header_keywords = {
        "s.no",
        "sno",
        "sr.no",
        "name",
        "item",
        "items",
        "quantity",
        "qty",
        "rate",
        "amount",
        "description",
    }

    normalized = [text.casefold().strip(" .:-") for text in row_texts if text.strip()]
    if not normalized:
        return False

    keyword_hits = sum(1 for text in normalized if text in header_keywords)
    has_numeric = any(any(ch.isdigit() for ch in text) for text in normalized)

    # Header rows usually have multiple known labels and little/no numeric data.
    return keyword_hits >= 2 and not has_numeric

def extract_bill_rows(image_path, columns_per_row=None):
    ocr_model = _build_ocr_model()
    result = ocr_model.ocr(image_path, cls=False)

    words = []
    for page in result:
        if not page:
            continue
        for item in page:
            box, text_info = item
            text = text_info[0].strip()
            if not text:
                continue

            xs = [point[0] for point in box]
            ys = [point[1] for point in box]
            words.append(
                {
                    "text": text,
                    "x": sum(xs) / len(xs),
                    "y": sum(ys) / len(ys),
                }
            )

    if not words:
        return []

    words.sort(key=lambda w: (w["y"], w["x"]))

    # Group words into text lines using a vertical threshold.
    y_threshold = 12
    lines = []
    for word in words:
        placed = False
        for line in lines:
            if abs(word["y"] - line["y_mean"]) <= y_threshold:
                line["words"].append(word)
                line["y_mean"] = sum(w["y"] for w in line["words"]) / len(line["words"])
                placed = True
                break
        if not placed:
            lines.append({"y_mean": word["y"], "words": [word]})

    rows = []
    start_idx, end_idx = _find_table_boundaries(lines)

    if columns_per_row is None:
        columns_per_row = _infer_columns_per_row(lines, start_idx, end_idx, default=5)

    # Keep only rows between header and total when both markers are detected.
    if start_idx is not None and end_idx is not None and end_idx > start_idx:
        selected_lines = lines[start_idx + 1 : end_idx]
    # If header is found but total is missing, keep rows after header.
    elif start_idx is not None:
        selected_lines = lines[start_idx + 1 :]
    else:
        selected_lines = lines

    for line in selected_lines:
        sorted_words = sorted(line["words"], key=lambda w: w["x"])
        row_texts = [w["text"] for w in sorted_words]
        if _is_header_like_row(row_texts):
            continue
        rows.append(_normalize_row(row_texts, columns_per_row))

    return rows


if __name__ == "__main__":
    image_path = r"D:\New folder\OneDrive\Desktop\correct-bill (1).png"
    bill_rows = extract_bill_rows(image_path)
    print("Bill rows (list of lists):")
    for row in bill_rows:
        print(row)
        