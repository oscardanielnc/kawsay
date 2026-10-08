"""Summarise INEI ENCONUT 2013 (food eaten away from home, Lima and Callao) per menu component.

Usage: python scripts/extract_enconut.py <folder with the unzipped SPSS modules 500-Modulo737 and 500-Modulo738> <out.csv>

ENCONUT is the survey behind INS group S. Per component it gives how many establishments served it, the median
weight of a plate as served and, per socioeconomic stratum, energy per 100 g and per plate. The importer uses it
to tell a strong group S reference (many establishments) from a weak one (a single kitchen).
"""

import csv
import glob
import statistics
import sys
from collections import defaultdict
from pathlib import Path

import pyreadstat


def main():
    folder, out_path = Path(sys.argv[1]), sys.argv[2]
    cooked, _ = pyreadstat.read_sav(glob.glob(str(folder / "500-Modulo737" / "**" / "*.sav"), recursive=True)[0], encoding="latin1")
    energy, _ = pyreadstat.read_sav(glob.glob(str(folder / "500-Modulo738" / "**" / "*.sav"), recursive=True)[0], encoding="latin1")

    plates = defaultdict(lambda: defaultdict(float))  # component -> (establishment, questionnaire) -> grams
    for row in cooked.itertuples():
        grams = row.C2P501E if row.C2P501E == row.C2P501E else row.C2P501D
        if grams == grams:
            plates[" ".join(row.nombre_compente_uniformizado.split())][(row.NSELESTAB, row.E2NCUES)] += grams

    strata = defaultdict(list)
    for row in energy.itertuples():
        kcal_100g = getattr(row, "Energía_100gr")
        if kcal_100g == kcal_100g:
            strata[" ".join(row.nombre_componente.split())].append((row.ESTRATO, kcal_100g, row.Energia_Total))

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["component", "establishments", "plate_g_median", "strata", "kcal_100g_min", "kcal_100g_max", "kcal_plate_median"])
        for component in sorted(plates):
            weights = list(plates[component].values())
            rows = strata.get(component, [])
            per100 = [k for _, k, _ in rows]
            per_plate = [t for _, _, t in rows if t == t]
            writer.writerow([
                component,
                len(weights),
                round(statistics.median(weights)),
                "".join(sorted(s for s, _, _ in rows)),
                round(min(per100), 1) if per100 else "",
                round(max(per100), 1) if per100 else "",
                round(statistics.median(per_plate)) if per_plate else "",
            ])
    print(f"{len(plates)} components -> {out_path}")


if __name__ == "__main__":
    main()
