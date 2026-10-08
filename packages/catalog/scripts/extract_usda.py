"""Slim the USDA FoodData Central SR Legacy release (CSV, April 2018, CC0) to the columns Kawsay uses.

Usage: python scripts/extract_usda.py <unzipped SR Legacy folder> <out.csv>

Column names match sources/ins-2023/foods.csv so both sources line up; B12 and vitamin D are the gap fillers INS
lacks (ADR 0014). Values are per 100 g; a nutrient the release does not report stays empty.
"""

import csv
import sys
from pathlib import Path

# USDA nutrient id -> our column
NUTRIENTS = {
    "1008": "energy_kcal", "1051": "water_g", "1003": "protein_g", "1004": "fat_g",
    "1005": "carbs_total_g", "1079": "fiber_g", "1007": "ash_g",
    "1087": "calcium_mg", "1091": "phosphorus_mg", "1095": "zinc_mg", "1089": "iron_mg",
    "1093": "sodium_mg", "1092": "potassium_mg", "1107": "beta_carotene_ug", "1106": "vitamin_a_rae_ug",
    "1165": "thiamin_mg", "1166": "riboflavin_mg", "1167": "niacin_mg", "1162": "vitamin_c_mg",
    "1177": "folate_ug", "1178": "vitamin_b12_ug", "1114": "vitamin_d_ug",
}


def main():
    folder, out_path = Path(sys.argv[1]), sys.argv[2]
    with open(folder / "food_category.csv", encoding="utf-8") as f:
        categories = {row["id"]: row["description"] for row in csv.DictReader(f)}
    with open(folder / "sr_legacy_food.csv", encoding="utf-8") as f:
        ndb = {row["fdc_id"]: row["NDB_number"] for row in csv.DictReader(f)}
    foods = {}
    with open(folder / "food.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            foods[row["fdc_id"]] = {
                "fdc_id": row["fdc_id"],
                "ndb_number": ndb.get(row["fdc_id"], ""),
                "category": categories.get(row["food_category_id"], ""),
                "name": row["description"],
                **dict.fromkeys(NUTRIENTS.values(), ""),
            }
    with open(folder / "food_nutrient.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            column = NUTRIENTS.get(row["nutrient_id"])
            food = foods.get(row["fdc_id"])
            if column and food is not None:
                food[column] = row["amount"]
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["fdc_id", "ndb_number", "category", "name", *NUTRIENTS.values()])
        writer.writeheader()
        writer.writerows(sorted(foods.values(), key=lambda food: int(food["fdc_id"])))
    print(f"{len(foods)} foods -> {out_path}")


if __name__ == "__main__":
    main()
