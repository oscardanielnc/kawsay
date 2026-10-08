"""Extract the INS Peruvian food composition tables (TPCA 2023, 11th digital edition 2025) from the official PDF.

Usage: python scripts/extract_ins.py <tpca.pdf> <foods.csv>

Each value is assigned to its column by horizontal position against the units row of its page, so values the PDF
prints glued together still land in the right column. "•" (not analysed or unknown) becomes an empty cell.
Group S (prepared foods) is skipped: its rows repeat per socioeconomic stratum with irregular labels, and ADR 0014
uses it only to cross-check seed dishes. Extracting it is a separate task.
"""

import csv
import re
import sys

import pdfplumber

COLUMNS = [
    ("energy_kcal", "kcal"), ("energy_kj", "kJ"), ("water_g", "g"), ("protein_g", "g"), ("fat_g", "g"),
    ("carbs_total_g", "g"), ("carbs_available_g", "g"), ("fiber_g", "g"), ("ash_g", "g"),
    ("calcium_mg", "mg"), ("phosphorus_mg", "mg"), ("zinc_mg", "mg"), ("iron_mg", "mg"), ("sodium_mg", "mg"),
    ("potassium_mg", "mg"), ("beta_carotene_eq_ug", "µg"), ("vitamin_a_rae_ug", "µg"), ("thiamin_mg", "mg"),
    ("riboflavin_mg", "mg"), ("niacin_mg", "mg"), ("vitamin_c_mg", "mg"), ("folate_ug", "µg"),
]
COLUMNS_PREPARED = [c for c in COLUMNS if c[0] != "beta_carotene_eq_ug"]
NUTRIENTS = [name for name, _ in COLUMNS]
UNITS = {unit for _, unit in COLUMNS}
GROUP_TITLE = re.compile(r"^([A-Z]) - (.+?)\s+Composición en 100 g")
NUMBER = re.compile(r"^-?\d+(\.\d+)?$")
MISSING = {"•", "-", "—"}
FOOTER_TOP = 550
# Footnote marks after a name: values imputed from another table (legend under each table page).
IMPUTED_FROM = {"*": "INCAP 2012", "**": "Tabla Boliviana 2005", "***": "Tabla Uruguaya", "****": "FAO"}
FOOTNOTE = re.compile(r"\s*\*+\s*Imputado.*$", re.IGNORECASE)
LINE_TOLERANCE = 2  # px; rows are ~27 px apart, words of one row differ by < 1.5 px
WRAP_DISTANCE = 22  # px; a wrapped name line sits ~9 px from its row


def cluster_lines(words):
    lines = []
    for w in sorted(words, key=lambda w: w["top"]):
        if lines and w["top"] - lines[-1]["top"] <= LINE_TOLERANCE:
            lines[-1]["words"].append(w)
        else:
            lines.append({"top": w["top"], "words": [w]})
    for line in lines:
        line["words"].sort(key=lambda w: w["x0"])
    return lines


def units_row(words):
    """The unit labels of the table header, left to right, and their columns; None on pages without a table."""
    for line in cluster_lines([w for w in words if w["text"] in UNITS]):
        row = line["words"]
        if len(row) == len(COLUMNS):
            return row, COLUMNS
        if len(row) == len(COLUMNS_PREPARED):  # group S
            return row, COLUMNS_PREPARED
    return None


def split_line(line, first_value_x, last_value_x):
    """Code, name words and value words of one table line."""
    left = [w for w in line["words"] if w["x0"] < first_value_x]
    values = [w for w in line["words"] if first_value_x <= w["x0"] <= last_value_x]
    code = None
    if len(left) >= 2 and re.fullmatch(r"[A-Z]{1,2}", left[0]["text"]) and left[1]["text"].isdigit():
        code, left = left[0]["text"] + left[1]["text"], left[2:]
    return code, [w["text"] for w in left], values


def read_values(row, centers, columns, where, problems):
    cells = dict.fromkeys(NUTRIENTS, "")
    for w in row["values"]:
        center = (w["x0"] + w["x1"]) / 2
        column = columns[min(range(len(centers)), key=lambda i: abs(centers[i] - center))][0]
        text = w["text"].replace(",", ".")
        if text in MISSING:
            continue
        if not NUMBER.match(text):
            problems.append(f"{where}: unreadable value {text!r}")
        elif cells[column]:
            problems.append(f"{where}: two values in {column}")
        else:
            cells[column] = text
    if not cells["energy_kcal"]:
        problems.append(f"{where}: no energy value")
    return cells


def clean_name(name):
    """Drop a footnote that leaked into the name and turn trailing asterisks into the imputation source."""
    name = FOOTNOTE.sub("", name).strip()
    marks = re.search(r"\*+$", name)
    if not marks:
        return name, ""
    return name[: marks.start()].strip(), IMPUTED_FROM.get(marks.group(), marks.group())


def extract(pdf_path):
    foods, problems = [], []
    group = None
    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            for text_line in page.extract_text().splitlines():
                title = GROUP_TITLE.match(text_line.strip())
                if title:
                    group = (title.group(1), title.group(2).strip().capitalize())
            words = page.extract_words()
            header = units_row(words)
            if not header:
                continue
            units, columns = header
            if columns is COLUMNS_PREPARED:
                continue
            centers = [(u["x0"] + u["x1"]) / 2 for u in units]
            first_value_x = units[0]["x0"] - 12
            last_value_x = units[-1]["x1"] + 4
            header_bottom = max(u["bottom"] for u in units)
            body = [w for w in words if header_bottom + 2 < w["top"] < FOOTER_TOP]

            rows, fragments = [], []
            for line in cluster_lines(body):
                code, name, values = split_line(line, first_value_x, last_value_x)
                if name and name[0].startswith("*") and not code:
                    continue
                if code or values:
                    rows.append({"top": line["top"], "code": code, "name": name, "values": values})
                elif name and not name[0].startswith("*") and not all(t.isupper() for t in name):
                    # skipped: footnote legends ("* Imputado …") and all-caps section titles
                    fragments.append((line["top"], name))

            # Long names wrap: the code row keeps the first words and the rest sits on its own line nearby.
            for top, name in fragments:
                nearest = min(rows, key=lambda r: abs(r["top"] - top), default=None)
                if nearest is None or abs(nearest["top"] - top) > WRAP_DISTANCE:
                    problems.append(f"p{page_number}: stray text {' '.join(name)!r}")
                elif top < nearest["top"]:
                    nearest["name"] = name + nearest["name"]
                else:
                    nearest["name"] = nearest["name"] + name

            for row in rows:
                where = f"p{page_number} {row['code']}"
                if not row["code"]:
                    problems.append(f"p{page_number}: row without code {' '.join(row['name'])!r}")
                    continue
                name, imputed_from = clean_name(" ".join(row["name"]))
                record = {
                    "code": row["code"],
                    "group": group[0],
                    "group_name": group[1],
                    "name": name,
                    "imputed_from": imputed_from,
                    "page": page_number,
                    **read_values(row, centers, columns, where, problems),
                }
                foods.append(record)
    return foods, problems


def write(path, records):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["code", "group", "group_name", "name", "imputed_from", "page", *NUTRIENTS])
        writer.writeheader()
        writer.writerows(records)


def main():
    pdf_path, foods_path = sys.argv[1:3]
    foods, problems = extract(pdf_path)
    write(foods_path, foods)
    print(f"{len(foods)} foods -> {foods_path}")
    for problem in problems:
        print("WARN", problem)


if __name__ == "__main__":
    main()
