# Catalog sources

Raw nutrient tables, per 100 g of edible portion, converted once from the official releases. The importer (next
step) matches `seed/foods.json` against them. Never edit these files by hand: re-run the script.

| Folder                             | Source                                                                                                                                          | Licence                                                                                          | Rows                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `ins-2023/foods.csv`               | INS/CENAN, _Tablas Peruanas de Composición de Alimentos_, 2023 digital version, 11th edition (March 2025), ISBN 978-612-310-178-7               | "Se autoriza su reproducción total o parcial, siempre y cuando se cite la fuente" (credits page) | 1,125 foods, groups A–U                                                            |
| `ins-2023/prepared.csv`            | Same document, group S: preparations eaten away from home (INEI survey, mostly Lima and Callao)                                                 | Same                                                                                             | 567 preparations, 1,103 rows                                                       |
| `inei-enconut-2013/components.csv` | INEI, _Encuesta para medir la composición nutricional de los principales alimentos consumidos fuera del hogar_ (ENCONUT 2013), public microdata | Public microdata, cite INEI                                                                      | 522 menu components: establishments, median plate weight, kcal range across strata |
| `usda-sr-legacy/foods.csv`         | USDA FoodData Central, SR Legacy (April 2018)                                                                                                   | CC0 1.0                                                                                          | 7,793 foods                                                                        |

## Regenerate

```sh
# INS: PDF from the INS repository (item 945f2705-5700-4561-9281-974adb816604)
curl -L -o tpca.pdf https://repositorio.ins.gob.pe/server/api/core/bitstreams/6cc030c5-daf4-4f19-9357-6910343796d9/content
# sha256 f6b32f1834b9640b533cb06cdca40b4946f331ebbd69b3bd11a59af5e4848485
pip install pdfplumber
python scripts/extract_ins.py tpca.pdf sources/ins-2023/foods.csv
python scripts/extract_ins_prepared.py tpca.pdf sources/ins-2023/prepared.csv

# INEI ENCONUT 2013: SPSS modules 737 (cooked components) and 738 (energy per menu component)
for m in 737 738; do curl -LO https://proyectos.inei.gob.pe/iinei/srienaho/descarga/SPSS/500-Modulo$m.zip; unzip 500-Modulo$m.zip -d enconut; done
pip install pyreadstat
python scripts/extract_enconut.py enconut sources/inei-enconut-2013/components.csv

# USDA
curl -L -o sr.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
# sha256 b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0
unzip sr.zip -d sr
python scripts/extract_usda.py sr/FoodData_Central_sr_legacy_food_csv_2018-04 sources/usda-sr-legacy/foods.csv
```

## Reading the INS file

- Empty cell = "•" in the PDF: not analysed or unknown. It is never zero
- `imputed_from`: the INS marks some foods with asterisks; their values come from INCAP 2012 (`*`), Tabla Boliviana
  2005 (`**`), Tabla Uruguaya (`***`) or FAO (`****`)
- `page` points to the PDF page, so any value can be checked by eye
- Some rows are inconsistent in the source itself (e.g. A93 kcal vs kJ, margarines summing to ~93 g). They are kept
  as published; the importer reports them

## Reading the group S file

- One row per socioeconomic stratum (`A`–`E`) of each preparation; a preparation appears only in the strata the
  survey found it in. Compare a seed dish against the median of its rows
- `stratum` empty and `analysed = yes`: values from chemical analysis (the PDF marks them `•` and `*`)
- Subgroups by code prefix: `SB` breakfast drinks · `SE` starters · `SS` main dishes · `SR` soft drinks · `SP` desserts
- Used only to cross-check seed dishes (ADR 0014), never as the dish itself
- Energy matches the Atwater factors (median kcal ÷ (4P + 9F + 4C) = 1.03), but `water_g` leaves out the water added
  while cooking: the proximate components sum to ~70 g. Compare energy, not water
