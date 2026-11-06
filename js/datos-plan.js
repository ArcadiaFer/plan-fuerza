// =====================================================================
// datos-plan.js — Tu "Plan de definición y fuerza" convertido en datos.
// ---------------------------------------------------------------------
// Aquí NO hay lógica: solo números y textos que el resto de la app lee.
// Si el plan cambia (otra rutina, otras comidas), se edita este archivo.
//
// OJO: este archivo se publica en GitHub (repo público). Por eso no lleva
// tu nombre ni tus medidas (peso, cintura, % de grasa): esas las capturas
// en la app y se quedan guardadas solo en tu teléfono.
// =====================================================================

// ---------------------------------------------------------------- fechas clave

export const PLAN = {
  inicio: '2026-11-09',     // lunes de la semana 1 (la semana 0 es la línea base)
  semanas: 18,              // 9 nov 2026 → 14 mar 2027
  descarga: { desde: '2026-12-21', hasta: '2026-12-27' },
};

export const RESUMEN =
  'Comes 2,200 kcal con 180 g de proteína y mantienes cargas pesadas. ' +
  'La meta es bajar 0.4–0.7 kg por semana sin perder fuerza.';

// Las fases del calendario. `tipo` decide qué reglas aplican.
export const FASES = [
  { id: 'base', nombre: 'Línea base', tipo: 'base', desde: '2026-11-05', hasta: '2026-11-08',
    resumen: 'Pésate en ayunas y mide tu cintura. El plan arranca el lunes 9 nov.' },
  { id: 'def1', nombre: 'Definición', tipo: 'definicion', desde: '2026-11-09', hasta: '2026-12-16',
    resumen: '2,200 kcal y 180 g de proteína; bajar 0.4–0.7 kg por semana sin perder fuerza.' },
  { id: 'mant', nombre: 'Mantenimiento', tipo: 'mantenimiento', desde: '2026-12-17', hasta: '2027-01-03',
    resumen: 'Fiestas: calorías de mantenimiento, proteína mínima 160 g y descarga del 21 al 27 dic.' },
  { id: 'def2', nombre: 'Definición', tipo: 'definicion', desde: '2027-01-04', hasta: '2027-03-14',
    resumen: 'De vuelta al déficit hasta mediados de marzo; luego reevaluamos.' },
];

// Avisos que aparecen en "Hoy" en ciertas fechas.
export const EVENTOS = [
  { desde: '2026-11-09', hasta: '2026-11-15',
    texto: 'Semana 1 = línea base de fuerza: en cada básico sube en series de 3–5 reps hasta una a RIR 2 y anótala. Esa es tu serie top real.' },
  { desde: '2026-12-14', hasta: '2026-12-16',
    texto: 'Opcional esta semana: prueba 1RM o 3RM de banca con alguien que te asista.' },
  { desde: '2026-12-16', hasta: '2026-12-16',
    texto: 'Cierre de la fase de definición: compara tu peso y cintura con la línea base (Progreso).' },
  { desde: '2026-12-17', hasta: '2026-12-17',
    texto: 'Empieza mantenimiento: aplica tus calorías de mantenimiento en Progreso.' },
  { desde: '2026-12-21', hasta: '2026-12-27',
    texto: 'Semana de descarga: mismas cargas, mitad de series, RIR 3–4. Sin gym: 3 sesiones de cuerpo completo y 8,000–10,000 pasos.' },
  { desde: '2026-12-24', hasta: '2026-12-25',
    texto: 'Comida libre planeada; el resto del día, normal. Proteína mínimo 160 g.' },
  { desde: '2026-12-31', hasta: '2026-12-31',
    texto: 'Comida libre planeada; el resto del día, normal. Proteína mínimo 160 g.' },
  { desde: '2027-01-04', hasta: '2027-01-04',
    texto: 'Regreso a definición: la meta es estar a no más de 1–1.5 kg sobre tu peso del 16 dic (casi todo será agua y glucógeno).' },
];

// Revisiones cada 2 semanas (PDCA). `semana` = la semana que cierra ese domingo.
export const REVISIONES = [
  { semana: 2, fecha: '2026-11-22', nombre: 'Revisión 1' },
  { semana: 4, fecha: '2026-12-06', nombre: 'Revisión 2' },
  { semana: 10, fecha: '2027-01-17', nombre: 'Revisión 3' },
  { semana: 12, fecha: '2027-01-31', nombre: 'Revisión 4' },
  { semana: 14, fecha: '2027-02-14', nombre: 'Revisión 5' },
  { semana: 16, fecha: '2027-02-28', nombre: 'Revisión 6' },
  { semana: 18, fecha: '2027-03-14', nombre: 'Reevaluación final' },
];

// Hitos de resultado, RELATIVOS a tu línea base (así no se publican tus medidas).
// peso y cintura: [mínimo, máximo] de cambio esperado (negativo = bajar).
export const HITOS = [
  { fecha: '2026-12-16', nombre: 'Cierre de la fase 1', peso: [-4, -2], cintura: [-4, -2],
    nota: '[Probable] −2 a −4 kg y −2 a −4 cm de cintura.' },
  { fecha: '2027-03-14', nombre: 'Meta de cintura', peso: [-10, -7], cintura: [-9, -6],
    nota: '[Probable] Hacia marzo de 2027, tras perder 7–10 kg en total.' },
];
export const META_BANCA = {
  kg: 120,
  nota: '[Probable] Posible en este bloque si tus series actuales son estrictas; si no, en la fase que sigue a la definición.',
};

// ---------------------------------------------------------------- metas diarias

// Metas con las que arranca la app. Cuando una revisión cambie las calorías,
// la app agrega una meta nueva "desde tal fecha" y conserva el historial.
// aislamiento: series de más/menos en cada aislamiento (−1 = quitar una).
export const METAS_INICIALES = {
  desde: '2026-11-01', kcal: 2200, p: 180, c: 235, gMin: 60, gMax: 65, aislamiento: 0, nota: 'Plan inicial',
};

export const OBJETIVOS = {
  toleranciaKcal: 100,     // ±100 kcal = día ideal
  adherenciaPct: 0.10,     // ±10 % de las calorías = día cumplido (KPI de adherencia)
  proteinaMinima: 160,     // g; también el mínimo en fiestas
  fibra: [30, 40],
  aguaMl: 3000,
  pasos: [9000, 11000],
  sueno: [7.5, 8],
  caminata: { dias: 4, min: [45, 60] },
  taper: { dias: 4, de: 5 },
  adherenciaMeta: 6,       // de 7 días
};

// ---------------------------------------------------------------- alimentación

// El día tipo. Las calorías y macros son las del plan (suman 2,217 kcal y 180 g de proteína).
// La fibra de cada comida es un estimado que suma los 39 g del plan.
// La cena tiene variantes: el plan pide atún 2–3 veces por semana y los otros días
// 90 g de pollo, 90 g de res magra o 1 huevo + 5 claras (calculadas aparte).
export const COMIDAS_PLAN = [
  {
    id: 'desayuno', nombre: 'Desayuno', hora: '5:30–6:30',
    opciones: [
      { id: 'base', nombre: 'Del plan', kcal: 489, p: 39, c: 45, g: 17, f: 6,
        detalle: '3 huevos + 2 claras con 100 g de espinaca, jitomate y cebolla · 2 tortillas de maíz · café con 250 ml de leche descremada' },
    ],
  },
  {
    id: 'comida', nombre: 'Comida', hora: '13:00–14:00',
    opciones: [
      { id: 'base', nombre: 'Táper del plan', kcal: 810, p: 66, c: 96, g: 18, f: 17,
        detalle: '150 g de pechuga de pollo · 200 g de arroz (1 taza) · 100 g de frijoles de olla (½ taza) · 200 g de verduras · 40 g de aguacate · 1 cdta de aceite' },
    ],
  },
  {
    id: 'licuado', nombre: 'Licuado', hora: '15:30–16:00 · antes de entrenar',
    opciones: [
      { id: 'base', nombre: 'Del plan', kcal: 452, p: 42, c: 46, g: 12, f: 5,
        detalle: '1 scoop de whey · 250 ml de leche descremada · 40 g de avena · 1 cda de crema de cacahuate (16 g)' },
      { id: 'frutos', nombre: 'Con frutos rojos', kcal: 500, p: 43, c: 58, g: 12, f: 8,
        detalle: 'El licuado del plan + 100 g de frutos rojos congelados (≈50 kcal)' },
    ],
  },
  {
    id: 'cena', nombre: 'Cena', hora: '19:00–19:30 · después de entrenar',
    opciones: [
      { id: 'atun', nombre: 'Atún', kcal: 466, p: 33, c: 50, g: 16, f: 11,
        detalle: '1 lata de atún en agua (≈100 g drenado) · 3 tortillas de maíz · 150 g de ensalada · 50 g de aguacate · 1 cdta de aceite' },
      { id: 'pollo', nombre: 'Pollo', kcal: 499, p: 35, c: 50, g: 18, f: 11,
        detalle: '90 g de pechuga de pollo · 3 tortillas de maíz · 150 g de ensalada · 50 g de aguacate · 1 cdta de aceite' },
      { id: 'res', nombre: 'Res magra', kcal: 508, p: 33, c: 50, g: 21, f: 11,
        detalle: '90 g de res magra · 3 tortillas de maíz · 150 g de ensalada · 50 g de aguacate · 1 cdta de aceite' },
      { id: 'huevo', nombre: 'Huevo + claras', kcal: 507, p: 32, c: 52, g: 20, f: 11,
        detalle: '1 huevo + 5 claras · 3 tortillas de maíz · 150 g de ensalada · 50 g de aguacate · 1 cdta de aceite' },
    ],
    nota: 'Atún 2–3 veces por semana (la FDA recomienda 2–3 porciones de pescado bajo en mercurio); los otros días, pollo, res o huevo.',
  },
];

export const PESAR_COMIDA = 'Pesa la comida ya cocida, salvo la avena (en seco).';

export const CAMBIOS = [
  'Salchichas → claras: más proteína por caloría y menos carne procesada.',
  'Cena vacía → cena con 33 g de proteína: repartes la proteína en 4 tomas.',
  'Wok o tacos diarios → táper casi todos los días.',
  'Leche entera → descremada: ahorras ≈120 kcal con dos vasos.',
];

export const HORARIOS = [
  'Entrenas a las 17:00: el licuado va de 15:30 a 16:00 y la cena es tu comida post-entreno; ya no te la saltes.',
  'Si caminas después de pesas: cena al terminar (≈19:15); te quedan ≈1.5 h antes de dormir.',
  'Fruta: opcional. 100 g de frutos rojos congelados en el licuado suman ≈50 kcal.',
  'Fines de semana: mismos números; si sales a comer, usa la regla de la mano.',
  'Si en realidad entrenas a las 5 am: café antes, desayuno al terminar y licuado a media tarde.',
];

export const INTERCAMBIOS = [
  { grupo: 'Proteína (≈30 g)', base: '100 g de pechuga de pollo cocida',
    equivale: ['120 g de atún en agua', '120 g de pescado blanco', '105 g de res magra', '9 claras', '1¼ scoop de whey', '300 g de yogur griego natural (suma 11 g de carbohidrato)'] },
  { grupo: 'Carbohidrato (≈28 g)', base: '100 g de arroz cocido',
    equivale: ['2 tortillas de maíz', '140 g de papa cocida', '90 g de pasta cocida', '40 g de avena', '2 rebanadas de pan integral', '120 g de frijoles (suma 11 g de proteína)'] },
  { grupo: 'Grasa (≈5 g)', base: '1 cdta de aceite',
    equivale: ['35 g de aguacate', '10 g de almendras (≈8)', '½ cda de crema de cacahuate'] },
  { grupo: 'Verdura', base: '100 g',
    equivale: ['Brócoli, calabacita, ejotes, espinaca, nopales, lechuga, jitomate, pepino: sin límite práctico'] },
];

export const REGLA_MANO =
  'Por comida fuera de casa: 2 palmas de proteína magra, 1½–2 puños de carbohidrato, 2 puños de verdura y 1 pulgar de grasa.';

export const COMER_FUERA = [
  { hoy: 'Combo del Wok: arroz frito, verduras y 2 porciones de pollo a la naranja', estimado: '1,300–1,600 kcal · ≈55 g de proteína',
    mejor: 'Proteína sin empanizar, doble verdura y media porción de arroz: ≈700–850 kcal' },
  { hoy: '5 tacos de adobada', estimado: '850–1,100 kcal · ≈45 g de proteína',
    mejor: '4 tacos de asada o pollo con una tortilla + frijoles de olla o consomé: ≈700–800 kcal' },
  { hoy: 'Tienda de conveniencia', estimado: 'Variable',
    mejor: 'Yogur griego natural + barra con ≥20 g de proteína, o leche + sándwich de pavo; sin pan dulce ni refresco' },
];

export const META_TAPER = 'Táper 4 de 5 días entre semana; la quinta comida, fuera con la regla de la mano.';

export const SUPLEMENTOS = [
  { tema: 'Creatina', antes: '1 cucharada (puede ser 10 g o más)',
    ajuste: '3–5 g diarios, a cualquier hora; pésala o usa el medidor del bote.',
    porque: '[Seguro] 3–5 g al día bastan para saturar el músculo (Kreider et al., 2017).' },
  { tema: 'Café', antes: '2 americanos de 3 shots (≈380–450 mg de cafeína)',
    ajuste: 'Máximo ≈400 mg; último café antes de las 13:00; sin café antes de entrenar a las 17:00 (quedaría a 4–5 h de dormir).',
    porque: '[Seguro] 400 mg tomados 6 h antes de dormir recortaron más de 1 h de sueño (Drake et al., 2013).' },
  { tema: 'Alcohol', antes: 'Cada 2 semanas: 4 cervezas o 5 preparados',
    ajuste: 'Cerveza light o tequila con agua mineral y limón; máximo 3–4 bebidas; ese día recorta grasa y carbohidrato de la cena, nunca la proteína.',
    porque: '[Probable] Cada preparado con refresco suma ≈100 kcal extra. [Seguro] Una dosis alta tras entrenar bajó la síntesis de proteína 24–37 % (Parr et al., 2014); con 4 bebidas el efecto debería ser menor, pero no cero.' },
  { tema: 'Bloom', antes: '1 scoop al día',
    ajuste: 'Opcional; no cuenta como verdura ni como fuente de fibra.',
    porque: '[Seguro] Un scoop aporta 2 g de fibra frente a los 30–40 g que necesitas.' },
  { tema: 'Proteína whey', antes: 'No tomas',
    ajuste: '1 scoop al día en el licuado.',
    porque: 'Comodidad: 24 g de proteína en 30 segundos.' },
];

// Cubre 7 días del día tipo con la cena rotada (3 de atún, 2 de pollo, 1 de res, 1 de huevo).
export const LISTA_SUPER = [
  { id: 'pollo', producto: 'Pechuga de pollo (cruda)', cantidad: '1.5–1.7 kg', nota: 'Pierde ≈25 % de peso al cocinarse' },
  { id: 'atun', producto: 'Atún en agua', cantidad: '3 latas', nota: 'Máximo 3 cenas por semana' },
  { id: 'res', producto: 'Bistec de res magro', cantidad: '150 g', nota: '1 cena' },
  { id: 'huevo', producto: 'Huevo', cantidad: '22 piezas', nota: 'Una tapa de 30 dura 10 días' },
  { id: 'claras', producto: 'Claras líquidas', cantidad: '650 g', nota: 'O separa las claras de huevo entero' },
  { id: 'tortillas', producto: 'Tortillas de maíz', cantidad: '1 kg', nota: '≈35 piezas de 30 g' },
  { id: 'arroz', producto: 'Arroz', cantidad: '½ kg crudo', nota: '≈1.4 kg ya cocido' },
  { id: 'frijol', producto: 'Frijol', cantidad: '300 g crudo', nota: 'O 2 bolsas de frijoles de olla' },
  { id: 'verduras', producto: 'Verduras frescas o congeladas', cantidad: '3 kg', nota: 'Espinaca, jitomate, cebolla, brócoli, calabacita, lechuga, pepino' },
  { id: 'aguacate', producto: 'Aguacate', cantidad: '4–5 medianos', nota: '≈90 g de pulpa al día' },
  { id: 'leche', producto: 'Leche descremada', cantidad: '4 L', nota: '2 vasos al día' },
  { id: 'avena', producto: 'Avena', cantidad: '300 g', nota: '40 g al día' },
  { id: 'whey', producto: 'Proteína whey', cantidad: '210 g (7 scoops)', nota: 'Un bote de 2 lb dura ≈4 semanas' },
  { id: 'cacahuate', producto: 'Crema de cacahuate', cantidad: '115 g', nota: 'Un frasco dura 3–4 semanas' },
  { id: 'aceite', producto: 'Aceite de oliva o de aguacate', cantidad: '70 ml', nota: '2 cdtas al día' },
  { id: 'creatina', producto: 'Creatina', cantidad: '35 g', nota: '5 g al día' },
];

export const MEAL_PREP = [
  'Hornea 1.2 kg de pechuga con sal y especias a 200 °C hasta que llegue a 74 °C por dentro (≈25 min).',
  'Mientras, cuece ½ kg de arroz y los frijoles (o calienta los de bolsa).',
  'Cuece al vapor 1.5 kg de verduras.',
  'Arma 5 tápers: 150 g de pollo, 200 g de arroz, 100 g de frijoles y 200 g de verduras; el aguacate se agrega el día que comes.',
  '[Seguro] Refrigera 4 días como máximo; congela el táper del viernes y sácalo el jueves en la noche.',
];

// ---------------------------------------------------------------- entrenamiento

export const RUTINA_INTRO =
  'El volumen total no cambia (66 series por semana); cambia el cómo: series top pesadas en los básicos, ' +
  'banca 2 veces y RIR en cada ejercicio. Lunes, martes, jueves y viernes; la caminata de 45–60 min, ' +
  '4 días, después de pesas o en días libres.';

// Notas de ejecución de los básicos (se abren con el botón ⓘ de cada ejercicio).
export const TECNICA = {
  banca: { nombre: 'Press banca', texto: 'Escápulas juntas y hacia abajo, pies firmes; baja a la parte baja del pecho y toca sin rebotar. En la versión con pausa, cuenta 1 s quieto en el pecho.' },
  sentadilla: { nombre: 'Sentadilla', texto: 'Respira y aprieta el abdomen antes de bajar; llega siempre a la misma profundidad, cadera por debajo de la rodilla si tu movilidad lo permite; rodillas en la línea de los pies.' },
  pesoMuerto: { nombre: 'Peso muerto', texto: 'Barra sobre la mitad del pie, espalda neutra y dorsales apretados; empuja el piso en vez de jalar con los brazos. Cada repetición arranca del piso, sin rebote.' },
  militar: { nombre: 'Press militar', texto: 'Sentado, con el respaldo casi vertical y glúteos y espalda alta pegados a él. Baja la barra a la barbilla o la parte alta del pecho y termina con los brazos extendidos; si te reclinas, se vuelve press inclinado y tus números dejan de ser comparables.' },
  dominadas: { nombre: 'Dominadas', texto: 'De brazos extendidos a barbilla sobre la barra, sin balanceo; una repetición sin rango completo no cuenta.' },
  rumano: { nombre: 'Peso muerto rumano', texto: 'Cadera atrás con rodillas un poco flexionadas; baja hasta sentir el estiramiento del femoral, con la espalda neutra.' },
};
export const TECNICA_INTRO = 'La técnica estricta va primero: es lo que hace comparables tus números de una semana a otra.';

// Cada ejercicio:
//   series, reps, rir y descanso tal como vienen en el plan (texto);
//   seg = segundos del temporizador de descanso (el mínimo del rango);
//   tipo 'top' = serie top de un básico (salto = cuánto subir si cumples);
//   tipo 'respaldo' = series al −10 % de la top de ese día;
//   aislamiento = se le quita una serie si la fuerza cae 2 semanas seguidas.
const ELEVACION_LATERAL = { id: 'elevacion_lateral', nombre: 'Elevación lateral', series: 3, reps: '10–15', rir: '0–1', descanso: '1 min', seg: 60, aislamiento: true };
const EXT_CUADRICEPS = { id: 'ext_cuadriceps', nombre: 'Extensión de cuádriceps', series: 2, reps: '10–15', rir: '0–1', descanso: '1.5 min', seg: 90, aislamiento: true };
const CURL_FEMORAL = { id: 'curl_femoral', nombre: 'Curl femoral', series: 2, reps: '10–15', rir: '0–1', descanso: '1.5 min', seg: 90, aislamiento: true };

export const RUTINA = {
  torsoA: {
    nombre: 'Torso A', dia: 'Lunes',
    ejercicios: [
      { id: 'banca_top', nombre: 'Press banca: serie top', series: 1, reps: '3–5', rir: '2', descanso: '3–4 min', seg: 180, tipo: 'top', basico: 'banca', salto: 2.5, tecnica: 'banca' },
      { id: 'banca_resp', nombre: 'Press banca: respaldo (−10 % de la top)', series: 2, reps: '6–8', rir: '2', descanso: '2–3 min', seg: 120, tipo: 'respaldo', top: 'banca_top', tecnica: 'banca' },
      { id: 'dominada_lastrada', nombre: 'Dominada lastrada o jalón al pecho', series: 3, reps: '5–8', rir: '1–2', descanso: '2–3 min', seg: 120, tecnica: 'dominadas',
        nota: 'En dominada anota el lastre (0 = solo tu peso); en jalón, el peso de la máquina.' },
      { id: 'press_inclinado', nombre: 'Press inclinado con mancuernas', series: 3, reps: '6–10', rir: '1–2', descanso: '2 min', seg: 120, nota: 'Anota el peso de una mancuerna.' },
      { id: 'remo', nombre: 'Remo con barra o en máquina', series: 3, reps: '6–10', rir: '1–2', descanso: '2 min', seg: 120 },
      ELEVACION_LATERAL,
      { id: 'curl_biceps', nombre: 'Curl de bíceps', series: 2, reps: '8–12', rir: '0–1', descanso: '1–1.5 min', seg: 60, aislamiento: true },
      { id: 'triceps_polea', nombre: 'Extensión de tríceps en polea', series: 2, reps: '8–12', rir: '0–1', descanso: '1–1.5 min', seg: 60, aislamiento: true },
    ],
  },
  piernaA: {
    nombre: 'Pierna A', dia: 'Martes',
    ejercicios: [
      { id: 'sentadilla_top', nombre: 'Sentadilla: serie top', series: 1, reps: '3–5', rir: '2', descanso: '3–4 min', seg: 180, tipo: 'top', basico: 'sentadilla', salto: 5, tecnica: 'sentadilla' },
      { id: 'sentadilla_resp', nombre: 'Sentadilla: respaldo (−10 %)', series: 2, reps: '6–8', rir: '2', descanso: '3 min', seg: 180, tipo: 'respaldo', top: 'sentadilla_top', tecnica: 'sentadilla' },
      { id: 'peso_muerto_rumano', nombre: 'Peso muerto rumano', series: 3, reps: '6–10', rir: '2', descanso: '2–3 min', seg: 120, tecnica: 'rumano', nuevo: true },
      EXT_CUADRICEPS,
      CURL_FEMORAL,
      { id: 'crunch', nombre: 'Crunch con carga (polea o disco)', series: 3, reps: '8–12', rir: '1', descanso: '1 min', seg: 60 },
    ],
  },
  torsoB: {
    nombre: 'Torso B', dia: 'Jueves',
    ejercicios: [
      { id: 'banca_pausa', nombre: 'Press banca con pausa de 1 s', series: 3, reps: '4–6', rir: '2–3', descanso: '3 min', seg: 180, tecnica: 'banca', nuevo: true },
      { id: 'dominada', nombre: 'Dominada o jalón al pecho', series: 3, reps: '6–10', rir: '1–2', descanso: '2 min', seg: 120, tecnica: 'dominadas',
        nota: 'En dominada anota el lastre (0 = solo tu peso); en jalón, el peso de la máquina.' },
      { id: 'press_militar', nombre: 'Press militar sentado con barra (respaldo vertical)', series: 3, reps: '5–8', rir: '2', descanso: '2–3 min', seg: 120, tecnica: 'militar' },
      { id: 'fondos', nombre: 'Fondos', series: 2, reps: '6–10', rir: '1–2', descanso: '2 min', seg: 120, nota: 'Anota el lastre (0 = solo tu peso).' },
      ELEVACION_LATERAL,
      { id: 'press_frances', nombre: 'Press francés', series: 2, reps: '8–12', rir: '1', descanso: '1.5 min', seg: 90, aislamiento: true },
      { id: 'curl_arana', nombre: 'Curl araña', series: 2, reps: '8–12', rir: '0–1', descanso: '1–1.5 min', seg: 60, aislamiento: true },
    ],
  },
  piernaB: {
    nombre: 'Pierna B', dia: 'Viernes',
    ejercicios: [
      { id: 'pm_top', nombre: 'Peso muerto: serie top', series: 1, reps: '3–5', rir: '2', descanso: '3–4 min', seg: 180, tipo: 'top', basico: 'pm', salto: 5, tecnica: 'pesoMuerto' },
      { id: 'pm_resp', nombre: 'Peso muerto: respaldo (−10 %)', series: 2, reps: '5', rir: '2–3', descanso: '3 min', seg: 180, tipo: 'respaldo', top: 'pm_top', tecnica: 'pesoMuerto' },
      { id: 'bulgara', nombre: 'Sentadilla búlgara', series: 3, reps: '6–10 por pierna', rir: '1–2', descanso: '2 min', seg: 120, nota: 'Anota el peso de una mancuerna (0 = sin peso).' },
      { id: 'hip_thrust', nombre: 'Hip thrust', series: 3, reps: '6–10', rir: '1–2', descanso: '2 min', seg: 120 },
      EXT_CUADRICEPS,
      CURL_FEMORAL,
      { id: 'lenador', nombre: 'Leñador en polea', series: 3, reps: '10–12 por lado', rir: '1', descanso: '1 min', seg: 60 },
    ],
  },
};

// Qué sesión toca cada día de la semana (1 = lunes … 5 = viernes).
export const DIAS_ENTRENO = { 1: 'torsoA', 2: 'piernaA', 4: 'torsoB', 5: 'piernaB' };

// Los 3 básicos que se siguen con e1RM.
export const BASICOS = [
  { id: 'banca', nombre: 'Banca', top: 'banca_top' },
  { id: 'sentadilla', nombre: 'Sentadilla', top: 'sentadilla_top' },
  { id: 'pm', nombre: 'Peso muerto', top: 'pm_top' },
];

export const QUE_CAMBIO = [
  'Serie top de 3–5 reps en banca, sentadilla y peso muerto. [Seguro] La fuerza máxima responde mejor a cargas altas (Schoenfeld et al., 2017); las series totales son las mismas.',
  'Banca 2 veces por semana. La banca con pausa del jueves reemplaza al chest fly: practicas más el levantamiento que quieres llevar a 120 kg con el mismo volumen de pecho (11 series).',
  'Peso muerto primero el día 4. Antes iba después de la búlgara; el básico se hace fresco.',
  'Peso muerto rumano el día 2; el hip thrust pasa al día 4. El femoral sube de 4 a 7 series directas y practicas la bisagra.',
  'Press militar de 2 a 3 series y antes en la sesión.',
  'Aislamientos a 10–15 reps y abdomen a 8–12. [Probable] Mismo estímulo con menos estrés articular que a 6–8.',
  'RIR y descanso en cada ejercicio. Antes no había una intensidad definida.',
];

export const PROGRESION = [
  'Semana 1 (9–15 nov): línea base. En cada básico sube en series de 3–5 reps hasta una a RIR 2; anota peso, reps y RIR. Esa es tu serie top real.',
  'Series top. Si logras 5 reps a RIR 2, sube 2.5 kg en banca o 5 kg en sentadilla y peso muerto la semana siguiente; con 3–4 reps, repite la carga.',
  'Series de respaldo. Siempre 10 % menos que la serie top de ese día.',
  'Resto de ejercicios (doble progresión). Cuando todas las series llegan al tope del rango con el RIR indicado, sube 2.5–5 % y regresa al mínimo del rango.',
  'Si la fuerza cae 2 semanas seguidas. Quita 1 serie de cada aislamiento antes de tocar las series pesadas.',
  'Semana del 14 dic (opcional). Prueba 1RM o 3RM de banca con alguien que te asista.',
  'Fiestas. Descarga del 21 al 27 dic: mismas cargas, mitad de series, RIR 3–4.',
];

// ---------------------------------------------------------------- seguimiento

export const KPIS = [
  { kpi: 'Peso promedio semanal', como: 'Diario, en ayunas y después del baño; promedio de 7 días', meta: '−0.4 a −0.7 kg por semana' },
  { kpi: 'Cintura', como: 'Domingo en ayunas, a la altura del ombligo', meta: '[Suposición] −0.3 a −0.7 cm por semana' },
  { kpi: 'Fuerza', como: 'e1RM de la serie top', meta: 'Igual o mayor' },
  { kpi: 'Adherencia', como: 'Días dentro de ±10 % de las calorías y con ≥160 g de proteína', meta: '6 de 7 días' },
  { kpi: 'Sueño', como: 'Promedio de horas', meta: '≥7.5 h' },
];

export const FORMULA_E1RM = 'e1RM = peso × (1 + (reps + RIR) / 30). Ejemplo: 100 kg × 4 a RIR 2 = 100 × (1 + 6/30) = 120 kg estimados.';

// Reglas de ajuste cada 2 semanas. `ajuste` es lo que la app cambia si tocas "Aplicar".
export const REGLAS_PDCA = {
  proceso: { si: 'La adherencia fue menor a 6 de 7 días', entonces: 'No toques calorías: arregla el proceso (táper, compras, horarios).', ajuste: null },
  lento: { si: 'Bajaste menos de 0.4 kg por semana con buena adherencia', entonces: 'Quita 150 kcal (≈35 g de carbohidrato) o suma 2,000 pasos diarios.', ajuste: { kcal: -150, c: -35 } },
  bien: { si: 'Bajaste 0.4–0.9 kg por semana y la fuerza se mantiene', entonces: 'No cambies nada.', ajuste: null },
  rapido: { si: 'Bajaste más de 0.9 kg por semana', entonces: 'Suma 150 kcal de carbohidrato.', ajuste: { kcal: 150, c: 35 } },
  fuerza: { si: 'El e1RM bajó 2 semanas seguidas en 2 o más básicos', entonces: 'Suma 150 kcal y quita 1 serie de cada aislamiento.', ajuste: { kcal: 150, c: 35, aislamiento: -1 } },
  faltan: { si: 'No hay suficientes pesajes', entonces: 'Pésate a diario para poder calcular tu ritmo.', ajuste: null },
};
export const NOTA_SEMANA1 = '[Probable] La semana 1 baja más por agua y glucógeno; no ajustes con ella.';

// ---------------------------------------------------------------- recuperación y fiestas

export const RECUPERACION = [
  'Sueño. [Seguro] 7.5–8 h entre semana cumplen la recomendación de 7 h o más. [Probable] Desvelarte hasta las 12 el fin de semana mueve tu reloj 3 h; procura no pasar de 1–1.5 h de diferencia.',
  'Entrenar a las 17:00. [Probable] Terminas las pesas 2.5 h antes de dormir; el ejercicio por la tarde no empeora el sueño salvo que sea intenso en la última hora antes de acostarte (Stutz et al., 2019).',
  'Estrés. En semanas de entregas conserva las series top y recorta accesorios; no recortes proteína ni sueño.',
  'Hidratación. 3 L al día y [Probable] 0.5 L más por cada hora de ejercicio; la orina debe verse amarillo claro.',
];

export const FIESTAS = [
  'Calorías. Mantenimiento: [Probable] tu promedio del plan + (kg perdidos por semana × 1,100). Si bajaste 0.5 kg por semana con 2,200 kcal, son 2,750 kcal.',
  'Proteína. Mínimo 160 g todos los días, también el 24, 25 y 31.',
  'Comidas libres. 3 planeadas (24, 25 y 31 de diciembre); el resto de esos días, normal.',
  'Entrenamiento con gym. Del 21 al 27 de diciembre, semana de descarga: mismas cargas, mitad de series, RIR 3–4.',
  'Entrenamiento sin gym. 3 sesiones de cuerpo completo con lo que haya (búlgaras, lagartijas, dominadas, remo con mancuerna) y 8,000–10,000 pasos diarios.',
  'Meta. Regresar el 4 de enero con no más de 1–1.5 kg sobre tu peso del 16 de diciembre; [Probable] casi todo será agua y glucógeno.',
  '[Probable] En gente entrenada, una pausa en mantenimiento no acelera la pérdida de grasa, pero tampoco la frena (Peos et al., 2021); su valor es que el plan no se rompa.',
];

// ---------------------------------------------------------------- por qué y glosario

export const FUNDAMENTO = [
  'Ritmo. [Seguro] En atletas, bajar 0.7 % del peso por semana aumentó la masa magra; bajar 1.4 % no lo logró (Garthe et al., 2011). Por eso apuntamos a 0.4–0.7 kg semanales.',
  'Proteína. [Seguro] En déficit se recomiendan 2.3–3.1 g por kg de masa magra (Helms et al., 2014); tus 180 g quedan dentro de ese rango.',
  'Intensidad. [Seguro] Mantener cargas pesadas conserva músculo y fuerza aun con mucho menos volumen (Bickel et al., 2011). Por eso las series top no se negocian; los aislamientos sí.',
  'Recomposición. [Probable] Vienes de entrenar menos y con grasa por encima del promedio de un atleta: es el perfil con más probabilidad de ganar algo de músculo en déficit (Barakat et al., 2020).',
  'Sueño. [Seguro] Con el mismo déficit, 5.5 h en cama en vez de 8.5 h hicieron perder menos grasa y más masa magra (Nedeltcheva et al., 2010). Tus 7.5–8 h son una ventaja.',
];

export const GLOSARIO = [
  ['RIR', 'Repeticiones en reserva: cuántas más podías hacer con buena técnica. RIR 2 = te quedaban 2.'],
  ['RPE', 'Esfuerzo percibido del 1 al 10. RPE 8 = RIR 2.'],
  ['RM', 'Repetición máxima: el mayor peso para cierto número de reps. 1RM = una sola repetición.'],
  ['e1RM', '1RM estimado a partir de una serie, sin probar tu máximo real.'],
  ['Serie top', 'La serie más pesada del día en un básico.'],
  ['Series de respaldo', 'Series con 10 % menos carga después de la serie top.'],
  ['Doble progresión', 'Primero subes reps dentro del rango; al llegar al tope, subes peso.'],
];
