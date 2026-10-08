"""Extract group S (prepared foods) of the INS tables TPCA 2023 from the official PDF.

Usage: python scripts/extract_ins_prepared.py <tpca.pdf> <prepared.csv>

Group S comes from the INEI survey of food eaten away from home: one row per socioeconomic stratum (A–E) of each
preparation, or a single row marked "•" when the value comes from chemical analysis (name ends in "*"). The code is
printed once per preparation on the right edge, next to one of its rows; that right-hand code is the anchor.
"""

import csv
import re
import sys
from collections import Counter

import pdfplumber

from extract_ins import COLUMNS_PREPARED, FOOTER_TOP, NUTRIENTS, cluster_lines, read_values, units_row

STRATA = {"A", "B", "C", "D", "E", "•"}
NUMERIC = re.compile(r"^(-?\d+([.,]\d+)?|•)$")
CODE_PREFIX = re.compile(r"^S[A-Z]$")
FRAGMENT_DISTANCE = 13.5  # px; a name wraps over up to 4 lines, 4.5–13.2 px from its row; rows are 27 px apart


def page_layout(page):
    header = units_row(page.extract_words())
    if not header or header[1] is not COLUMNS_PREPARED:
        return None
    units = header[0]
    return {
        "units": units,
        "centers": [(u["x0"] + u["x1"]) / 2 for u in units],
        "first_value_x": units[0]["x0"] - 12,
        "last_value_x": 812,
        # Measured on the page: the stratum letter sits at x ≈ 826, the right-hand code at x ≈ 850.
        "stratum_x": (815, 845),
        "code_x": 845,
        "header_bottom": max(u["bottom"] for u in units),
    }


def read_page(page, page_number, layout, problems):
    """Rows (one per stratum line with values) and right-edge code markers of one page."""
    body = [w for w in page.extract_words() if layout["header_bottom"] + 2 < w["top"] < FOOTER_TOP]
    rows, fragments, markers = [], [], []
    for line in cluster_lines(body):
        words = line["words"]
        if words[0]["text"].startswith(("*Informaci", "NOTA")):
            break  # closing notes of the group: prose, not table rows
        right = [w for w in words if w["x0"] >= layout["code_x"]]
        if len(right) >= 2 and CODE_PREFIX.match(right[0]["text"]) and right[1]["text"].isdigit():
            markers.append({"top": line["top"], "code": right[0]["text"] + right[1]["text"], "page": page_number})
        left = [w["text"] for w in words if w["x0"] < layout["first_value_x"]]
        values = [w for w in words if layout["first_value_x"] <= w["x0"] <= layout["last_value_x"]]
        stratum = next(
            (w["text"] for w in words
             if layout["stratum_x"][0] <= w["x0"] < layout["stratum_x"][1] and w["text"] in STRATA),
            None,
        )
        # The left-hand code may be glued to the name ("SE 1 Aguadito") or split over two lines ("3" / "SP").
        while left and (CODE_PREFIX.match(left[0]) or left[0].isdigit()):
            left = left[1:]
        numeric = [w for w in values if NUMERIC.match(w["text"])]
        if len(numeric) >= len(COLUMNS_PREPARED) - 2:
            rows.append({
                "top": line["top"], "page": page_number, "pieces": [(line["top"], left)], "values": values,
                "stratum": stratum,
            })
        elif left and not left[0].startswith(("*", "NOTA")) and not all(t.isupper() for t in left):
            fragments.append((line["top"], left))
        elif numeric:
            problems.append(f"p{page_number}: line with {len(values)} values ignored at {line['top']:.0f}")

    for top, text in fragments:
        nearest = min(rows, key=lambda r: abs(r["top"] - top), default=None)
        if nearest is None or abs(nearest["top"] - top) > FRAGMENT_DISTANCE:
            problems.append(f"p{page_number}: stray text {' '.join(text)!r}")
        else:
            nearest["pieces"].append((top, text))

    for row in rows:
        row["name"] = " ".join(word for _, words in sorted(row["pieces"]) for word in words)
        row["cells"] = read_values(row, layout["centers"], COLUMNS_PREPARED, f"p{page_number}", problems)
    return rows, markers


def name_key(name):
    """Names compared without case or punctuation: the PDF has typos such as "menestra. sarsa" next to "menestra,"."""
    return re.sub(r"[^\w]+", " ", name.lower()).strip()


def group_preparations(rows, markers, problems):
    """Consecutive rows with the same name are one preparation; split a run where it holds several codes."""
    runs = []
    for row in rows:
        if runs and name_key(runs[-1][-1]["name"]) == name_key(row["name"]):
            runs[-1].append(row)
        else:
            runs.append([row])

    position = lambda item: (item["page"], item["top"])
    records = []
    for run in runs:
        start, end = position(run[0]), position(run[-1])
        codes = []
        for m in markers:
            if start <= position(m) <= end or any(m["page"] == r["page"] and abs(m["top"] - r["top"]) < 20 for r in run):
                if m["code"] not in codes:
                    codes.append(m["code"])
        if not codes:
            problems.append(f"p{run[0]['page']}: no code for {run[0]['name']!r}")
            continue
        own_markers = [m for m in markers if m["code"] in codes]
        spelling = Counter(r["name"] for r in run).most_common(1)[0][0]
        for row in run:
            if len(codes) == 1:
                code = codes[0]
            else:  # identical names, different preparations: take the closest code on the same page
                same_page = [m for m in own_markers if m["page"] == row["page"]] or own_markers
                code = min(same_page, key=lambda m: abs(m["top"] - row["top"]))["code"]
            records.append((code, {**row, "name": spelling}))
    return records


def clean(name):
    analysed = name.endswith("*")
    return name.rstrip("* ").strip(), analysed


def extract(pdf_path):
    rows, markers, problems = [], [], []
    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            layout = page_layout(page)
            if layout:
                page_rows, page_markers = read_page(page, page_number, layout, problems)
                rows += page_rows
                markers += page_markers
    records = []
    for code, row in group_preparations(rows, markers, problems):
        name, analysed = clean(row["name"])
        records.append({
            "code": code,
            "subgroup": code[:2],
            "name": name,
            "stratum": "" if row["stratum"] in (None, "•") else row["stratum"],
            "analysed": "yes" if analysed else "",
            "page": row["page"],
            **row["cells"],
        })
    return records, problems


def main():
    pdf_path, out_path = sys.argv[1:3]
    records, problems = extract(pdf_path)
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["code", "subgroup", "name", "stratum", "analysed", "page", *NUTRIENTS]
        )
        writer.writeheader()
        writer.writerows(records)
    print(f"{len(records)} rows, {len({r['code'] for r in records})} preparations -> {out_path}")
    for problem in problems:
        print("WARN", problem)


if __name__ == "__main__":
    main()
