"""Group S of the INS 2023 table as ready-to-log dishes (ADR 0028, layer 1).

Reads sources/ins-2023/prepared.csv (one row per stratum) and sources/inei-enconut-2013/components.csv (plate
sizes) and writes seed/generated/ins-dishes.json plus reports/ins-dishes.md.

- Nutrients per 100 g: the median of the strata rows, published values only (empty stays null, never 0)
- Serving: the ENCONUT median plate when the name matches, else the median of its kind
- Added sugar and refined-flour carbohydrate are not in the source: estimated by explicit rules, each dish says which
- Dishes the curated seed already links to group S (seed/matches.json) are left out

Usage: python scripts/build_ins_dishes.py   (from packages/catalog)
"""

from __future__ import annotations

import csv
import json
import re
import statistics
import unicodedata
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREPARED = ROOT / 'sources/ins-2023/prepared.csv'
ENCONUT = ROOT / 'sources/inei-enconut-2013/components.csv'
MATCHES = ROOT / 'seed/matches.json'
OUT = ROOT / 'seed/generated/ins-dishes.json'
REPORT = ROOT / 'reports/ins-dishes.md'

NUTRIENT_COLUMNS = [
    'energy_kcal', 'water_g', 'protein_g', 'fat_g', 'carbs_total_g', 'carbs_available_g', 'fiber_g', 'ash_g',
    'calcium_mg', 'phosphorus_mg', 'zinc_mg', 'iron_mg', 'sodium_mg', 'potassium_mg', 'vitamin_a_rae_ug',
    'thiamin_mg', 'riboflavin_mg', 'niacin_mg', 'vitamin_c_mg', 'folate_ug',
]

# Accents the PDF extraction or the source left out (display name only; the INS name is kept as `insName`).
ACCENTS = {
    'arabe': 'árabe', 'chicharron': 'chicharrón', 'cesar': 'césar', 'tallarin': 'tallarín', 'tallarines': 'tallarines',
    'jamon': 'jamón', 'limon': 'limón', 'salmon': 'salmón', 'atun': 'atún', 'platano': 'plátano', 'maiz': 'maíz',
    'camaron': 'camarón', 'champinon': 'champiñón', 'champinones': 'champiñones', 'pure': 'puré', 'menestron': 'menestrón',
    'frejol': 'fréjol', 'frejoles': 'fréjoles', 'pina': 'piña', 'jugo': 'jugo', 'cafe': 'café', 'te': 'té',
    'maracuya': 'maracuyá', 'sandwich': 'sándwich', 'cebiche': 'cebiche', 'sudado': 'sudado', 'lacteo': 'lácteo',
    'pollo': 'pollo', 'brocoli': 'brócoli', 'aji': 'ají', 'huancaina': 'huancaína', 'sémola': 'sémola',
}

ICON_RULES = [  # first match wins; icons as in seed/dishes.json
    ('sopa', r'^(aguadito|caldo|chupe|consom|crema de|sopa|sancochado|menestr[oó]n|shambar|parihuela|chilcano|cazuela|patasca|chairo|inchicapi|timbuche|sustancia)'),
    ('hoja', r'(juane|tamal|humita|chapana|patarashca)'),
    ('brocheta', r'(anticucho|brocheta|pinchito)'),
    ('pescado', r'(cebiche|ceviche|tiradito|pescado|jalea|choritos|mariscos|pota|trucha|bonito|caballa|tollo|langostino|camar[oó]n|pulpo|calamar|conchas|cangrejo|chicharr[oó]n de pescado|sudado)'),
    ('pan', r'(pan |^pan$|s[aá]ndwich|sanguche|butifarra|hamburguesa|pizza|empanada|teque[nñ]o|wantan|want[aá]n|pastel|enrollado|tostada)'),
    ('arroz', r'(arroz|chaufa|tacu ?tacu|aeropuerto|risotto)'),
    ('huevo', r'(huevo|tortilla)'),
    ('fruta', r'(ensalada de fruta|fruta)'),
]

# Share of the available carbohydrate that comes from refined flours or white rice (F24 tags white rice and wheat
# products). Explicit rules, first match wins; the dish records which one applied.
FLOUR_RULES = [
    ('pasta', 0.85, r'(tallar|fideo|spaghetti|espagueti|lasa[nñ]a|macarr|pasta|ravioli|canelon|sopa wantan|tallarines)'),
    ('dough', 0.80, r'(pizza|teque[nñ]o|empanada|want[aá]n|s[aá]ndwich|sanguche|butifarra|hamburguesa|\bpan\b|pastel|panqueque|enrollado|tostada|torta|keke|pionono|alfajor|galleta)'),
    ('semolina', 0.70, r'(semola)'),
    ('rice-and-tuber', 0.45, r'(arroz|chaufa|tacu ?tacu|aeropuerto).*(papa|yuca|camote|pl[aá]tano|frit)|(papa|yuca|camote|frit).*(arroz)'),
    ('rice', 0.70, r'(arroz|chaufa|tacu ?tacu|aeropuerto|risotto)'),
    ('breaded', 0.25, r'(apanad|milanesa|broaster|empanizad|chicharr[oó]n de pollo)'),
]

# Added sugar (F22, free sugars): share of the available carbohydrate, by group and kind. Savory dishes: 0.
DRINK_SUGAR_RULES = [
    ('lemonade-or-tea', 0.95, r'(limonada|infusion|emoliente)'),
    ('soy-drink', 0.50, r'(soya)'),
    ('cereal-drink', 0.40, r'(hojuela|quinua|avena|kiwicha|cereal)'),
    ('chicha', 0.60, r'(chicha)'),
    ('homemade-refresco', 0.75, r'.'),
]
SWEET_SUGAR_RULES = [
    ('fruit-salad', 0.0, r'(ensalada de frutas)'),
    ('gelatin', 0.95, r'(gelatina)'),
    ('starchy-dessert', 0.45, r'(arroz con leche|arroz zambito|budin|panqueque|canihua)'),
    ('custard-or-syrup', 0.70, r'(flan|crema volteada|leche asada|almibar|tiramisu)'),
    ('dessert', 0.60, r'.'),
]

GROUP_DEFAULT_SERVING = {'drink': ('1 vaso', None), 'sweet': ('1 porción', None), 'soup': ('1 plato', None),
                         'salad': ('1 porción', None), 'side': ('1 porción', None), 'main': ('1 plato', None)}


def norm(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', text).strip()


def display_name(name: str) -> str:
    words = name.split(' ')
    fixed = [ACCENTS.get(w.lower(), w) if w.islower() or w.lower() in ACCENTS else w for w in words]
    out = ' '.join(fixed)
    return out[0].upper() + out[1:]


def group_of(code: str, name: str) -> str:
    n = norm(name)
    if code.startswith(('SR', 'SB')):
        return 'drink'
    if code.startswith('SP'):
        return 'sweet'
    if re.search(ICON_RULES[0][1], n):
        return 'soup'
    if n.startswith('ensalada'):
        return 'salad'
    return 'side' if code.startswith('SE') else 'main'


def icon_of(group: str, name: str) -> str:
    if group == 'drink':
        return 'jugo'
    if group == 'sweet':
        return 'dulce'
    n = norm(name)
    for icon, pattern in ICON_RULES:
        if re.search(pattern, n):
            return icon
    return 'plato'


def first_rule(rules, text: str):
    for name, share, pattern in rules:
        if re.search(pattern, text):
            return name, share
    return None, 0.0


def median(values):
    nums = [float(v) for v in values if v not in ('', None)]
    return round(statistics.median(nums), 2) if nums else None


def main() -> None:
    rows = list(csv.DictReader(PREPARED.open(encoding='utf-8')))
    by_code: OrderedDict[str, list[dict]] = OrderedDict()
    for row in rows:
        by_code.setdefault(row['code'], []).append(row)

    curated_codes = {link['code'] for link in json.loads(MATCHES.read_text(encoding='utf-8'))['groupS'].values()}
    enconut = {norm(r['component']): r for r in csv.DictReader(ENCONUT.open(encoding='utf-8'))}

    dishes, unmatched_serving, skipped, derived_carbs = [], [], [], []
    plates_by_group: dict[str, list[float]] = {}
    pending_defaults = []

    for code, strata in by_code.items():
        name = strata[0]['name'].strip()
        if code in curated_codes:
            skipped.append(f'{code} {name} (curated seed dish)')
            continue
        group = group_of(code, name)
        per100 = {col: median(r.get(col) for r in strata) for col in NUTRIENT_COLUMNS}
        per100['water_g'] = None   # group S leaves out the cooking water (sources/README.md): unknown, not ~20 g
        if per100['energy_kcal'] is None:
            skipped.append(f'{code} {name} (no energy value)')
            continue
        key = norm(name)
        hit = enconut.get(key) or max(
            (r for k, r in enconut.items() if k.startswith(key + ' ') or k == key),
            key=lambda r: int(r['establishments'] or 0), default=None)
        total, fiber, avail = per100['carbs_total_g'], per100['fiber_g'] or 0.0, per100['carbs_available_g']
        if total is not None and (avail is None or abs((total - fiber) - avail) > max(2.0, 0.2 * total)):
            per100['carbs_available_g'] = round(max(total - fiber, 0.0), 2)   # published value missing or inconsistent
            derived_carbs.append(name)
        carbs = per100['carbs_available_g'] or 0.0
        rules = DRINK_SUGAR_RULES if group == 'drink' else SWEET_SUGAR_RULES if group == 'sweet' else []
        sugar_rule, sugar_share = first_rule(rules, key)
        flour_rule, flour_share = first_rule(FLOUR_RULES, key)
        dish = {
            'id': f'ins-{code.lower()}',
            'name': display_name(name),
            'insName': name,
            'group': group,
            'icon': icon_of(group, name),
            'source': {'kind': 'INS-S', 'code': code, 'strata': ''.join(sorted(r['stratum'] or '·' for r in strata)),
                       'page': strata[0]['page']},
            'confidence': 'high' if len(strata) >= 2 or any(r['analysed'] == 'yes' for r in strata) else 'medium',
            'per100g': per100,
            'addedSugarPer100g': round(carbs * sugar_share, 1),
            'addedSugarRule': sugar_rule or 'savory: 0',
            'refinedFlourCarbsPer100g': round(carbs * flour_share, 1),
            'refinedFlourRule': flour_rule or 'none: 0',
            'estimated': ['addedSugarPer100g', 'refinedFlourCarbsPer100g'],
        }
        if hit and hit['plate_g_median']:
            grams = float(hit['plate_g_median'])
            dish['serving'] = {'label': GROUP_DEFAULT_SERVING[group][0], 'grams': grams, 'from': f"ENCONUT: {hit['component']}"}
            plates_by_group.setdefault(group, []).append(grams)
        else:
            pending_defaults.append(dish)
        dishes.append(dish)

    defaults = {g: round(statistics.median(v)) for g, v in plates_by_group.items()}
    defaults.setdefault('drink', 250)
    defaults.setdefault('sweet', 150)
    for dish in pending_defaults:
        grams = defaults.get(dish['group'], 300)
        dish['serving'] = {'label': GROUP_DEFAULT_SERVING[dish['group']][0], 'grams': grams,
                           'from': f"median ENCONUT plate of group '{dish['group']}'"}
        unmatched_serving.append(dish['name'])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        'about': 'INS 2023 group S preparations as dishes (ADR 0028, layer 1). Generated by scripts/build_ins_dishes.py; do not edit by hand.',
        'servingDefaults': defaults,
        'dishes': dishes,
    }, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    by_group: dict[str, int] = {}
    for d in dishes:
        by_group[d['group']] = by_group.get(d['group'], 0) + 1
    lines = [
        '# INS group S dishes (generated)', '',
        f'- Source rows: {len(rows)} · preparations: {len(by_code)} · dishes written: **{len(dishes)}**',
        f'- Left out: {len(skipped)} (already curated or without energy)',
        f'- By group: ' + ' · '.join(f'{g} {n}' for g, n in sorted(by_group.items())),
        f'- Serving from ENCONUT: {len(dishes) - len(unmatched_serving)} · group median: {len(unmatched_serving)} '
        f'({", ".join(f"{g} {v} g" for g, v in sorted(defaults.items()))})',
        '- Estimated, not published by INS: added sugar and refined-flour carbohydrate (rule per dish in the JSON)',
        f'- Available carbohydrate derived as total − fiber (published value missing or off by > 20 %): {len(derived_carbs)}', '',
        '## Left out', '', *[f'- {s}' for s in skipped], '',
        '## Serving from the group median (check if one looks wrong)', '', *[f'- {n}' for n in unmatched_serving], '',
    ]
    REPORT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'{len(dishes)} dishes → {OUT.relative_to(ROOT)}; report → {REPORT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
