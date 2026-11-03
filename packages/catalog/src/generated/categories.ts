/**
 * Categories of the estimated dishes (ADR 0028 layer 2): what to ask for, the catalog group they land in, and the
 * ranges a recipe must fall in to be accepted. Desserts and bakery first: INS group S has almost none.
 */
export interface Category {
  id: string;
  /** Spanish description for the prompt. */
  prompt: string;
  group: 'breakfast' | 'soup' | 'main' | 'side' | 'salad' | 'drink' | 'sweet' | 'sauce';
  /** How many names to ask for. */
  target: number;
  kcalPer100g: [number, number];
  kcalPerServing: [number, number];
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'postres',
    prompt:
      'postres peruanos y populares en Perú (tortas, mazamorras, dulces criollos, helados caseros)',
    group: 'sweet',
    target: 180,
    kcalPer100g: [40, 560],
    kcalPerServing: [60, 900],
  },
  {
    id: 'panaderia',
    prompt:
      'panadería y pastelería de Perú (panes, keke, alfajores, empanadas dulces, galletas caseras, panetón)',
    group: 'sweet',
    target: 130,
    kcalPer100g: [180, 580],
    kcalPerServing: [40, 900],
  },
  {
    id: 'criollo',
    prompt: 'platos de fondo criollos de Lima y la costa central',
    group: 'main',
    target: 160,
    kcalPer100g: [70, 330],
    kcalPerServing: [250, 1500],
  },
  {
    id: 'norte',
    prompt: 'platos de la costa norte (Piura, Lambayeque, La Libertad, Tumbes)',
    group: 'main',
    target: 90,
    kcalPer100g: [70, 330],
    kcalPerServing: [250, 1500],
  },
  {
    id: 'sur-sierra',
    prompt: 'platos del sur y de la sierra (Arequipa, Cusco, Puno, Ayacucho, Junín, Huánuco)',
    group: 'main',
    target: 100,
    kcalPer100g: [60, 330],
    kcalPerServing: [250, 1500],
  },
  {
    id: 'selva',
    prompt: 'platos de la selva peruana (Loreto, San Martín, Ucayali, Madre de Dios)',
    group: 'main',
    target: 70,
    kcalPer100g: [70, 330],
    kcalPerServing: [250, 1500],
  },
  {
    id: 'chifa',
    prompt: 'platos de chifa (cocina chino-peruana)',
    group: 'main',
    target: 100,
    kcalPer100g: [80, 330],
    kcalPerServing: [250, 1400],
  },
  {
    id: 'nikkei',
    prompt: 'platos nikkei y japoneses comunes en Perú (makis, sushi, tiraditos nikkei)',
    group: 'main',
    target: 60,
    kcalPer100g: [70, 330],
    kcalPerServing: [150, 1200],
  },
  {
    id: 'marinos',
    prompt:
      'pescados y mariscos peruanos (ceviches, tiraditos, sudados, chupes, jaleas, arroces con mariscos)',
    group: 'main',
    target: 100,
    kcalPer100g: [50, 300],
    kcalPerServing: [150, 1400],
  },
  {
    id: 'sopas',
    prompt: 'sopas, caldos y cremas peruanas y populares en Perú',
    group: 'soup',
    target: 100,
    kcalPer100g: [20, 160],
    kcalPerServing: [80, 900],
  },
  {
    id: 'calle',
    prompt:
      'comida al paso y de la calle en Perú (anticuchos, salchipapas, choclo con queso, sanguches de carretilla)',
    group: 'main',
    target: 100,
    kcalPer100g: [100, 450],
    kcalPerServing: [100, 1300],
  },
  {
    id: 'rapida',
    prompt:
      'comida rápida y de cadenas comunes en Perú (hamburguesas, pizzas, broaster, hot dogs, burritos)',
    group: 'main',
    target: 120,
    kcalPer100g: [120, 420],
    kcalPerServing: [150, 1600],
  },
  {
    id: 'internacional',
    prompt:
      'platos internacionales comunes en Perú (italianos, mexicanos, españoles, árabes, estadounidenses, venezolanos)',
    group: 'main',
    target: 150,
    kcalPer100g: [60, 400],
    kcalPerServing: [150, 1500],
  },
  {
    id: 'desayunos',
    prompt:
      'desayunos y sanguches peruanos (pan con..., tamales, humitas, avena, quinua, emoliente con pan)',
    group: 'breakfast',
    target: 120,
    kcalPer100g: [50, 420],
    kcalPerServing: [100, 1000],
  },
  {
    id: 'bebidas',
    prompt:
      'bebidas peruanas y populares (jugos, refrescos caseros, chichas, batidos, cafés, infusiones con leche)',
    group: 'drink',
    target: 100,
    kcalPer100g: [0, 180],
    kcalPerServing: [0, 700],
  },
  {
    id: 'ensaladas',
    prompt: 'ensaladas peruanas y populares en Perú',
    group: 'salad',
    target: 60,
    kcalPer100g: [15, 260],
    kcalPerServing: [30, 800],
  },
  {
    id: 'fiestas',
    prompt:
      'platos de fiestas y celebraciones en Perú (Navidad, Año Nuevo, Semana Santa, cumpleaños, Fiestas Patrias)',
    group: 'main',
    target: 50,
    kcalPer100g: [60, 450],
    kcalPerServing: [100, 1500],
  },
  {
    id: 'guarniciones',
    prompt: 'guarniciones y acompañamientos (arroces, purés, frituras, menestras, tortillas)',
    group: 'side',
    target: 60,
    kcalPer100g: [40, 380],
    kcalPerServing: [40, 700],
  },
];

/** The 12 dish icons of the app (FoodIcon). */
export const ICONS = [
  'hoja',
  'arroz',
  'plato',
  'brocheta',
  'pan',
  'huevo',
  'pescado',
  'jugo',
  'sopa',
  'nuez',
  'fruta',
  'dulce',
] as const;
