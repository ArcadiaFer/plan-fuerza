// =====================================================================
// alimentos.js — Base de alimentos para contar calorías.
// ---------------------------------------------------------------------
// Dos tipos de alimento:
//   1) Por 100 g (o 100 ml): k = kcal, p = proteína, c = carbohidratos,
//      g = grasa, f = fibra. `porciones` son atajos: ['pieza (30 g)', 30].
//      Valores de alimentos ya cocidos (salvo que diga "en seco"),
//      redondeados de las tablas USDA. Con ellos se reproducen los
//      números de las comidas del plan con 1–2 % de diferencia.
//   2) Por porción (`porcion: 'pedido'`): los valores ya son del platillo
//      completo. Los de "Comer fuera" son estimados (aprox: true).
// Tus alimentos propios (los que creas en la app) funcionan como el tipo 2.
// =====================================================================

export const GRUPOS = [
  ['proteina', 'Proteína'],
  ['carbohidrato', 'Carbohidrato'],
  ['grasa', 'Grasa'],
  ['verdura', 'Verdura'],
  ['fruta', 'Fruta'],
  ['lacteo', 'Lácteos'],
  ['bebida', 'Bebidas'],
  ['fuera', 'Comer fuera'],
  ['otro', 'Otros'],
];

export const ALIMENTOS = [
  // ---- Proteína
  { id: 'pollo', n: 'Pechuga de pollo cocida', grupo: 'proteina', k: 165, p: 31, c: 0, g: 3.6, f: 0 },
  { id: 'atun', n: 'Atún en agua (drenado)', grupo: 'proteina', k: 116, p: 25.5, c: 0, g: 0.8, f: 0, porciones: [['lata (≈100 g drenado)', 100]] },
  { id: 'pescado', n: 'Pescado blanco cocido', grupo: 'proteina', k: 128, p: 26, c: 0, g: 2.7, f: 0 },
  { id: 'res', n: 'Res magra cocida (bistec)', grupo: 'proteina', k: 175, p: 28.6, c: 0, g: 6.5, f: 0 },
  { id: 'molida', n: 'Carne molida de res 90/10 cocida', grupo: 'proteina', k: 217, p: 26, c: 0, g: 12, f: 0 },
  { id: 'salmon', n: 'Salmón cocido', grupo: 'proteina', k: 206, p: 22, c: 0, g: 12.4, f: 0 },
  { id: 'camaron', n: 'Camarón cocido', grupo: 'proteina', k: 99, p: 24, c: 0.2, g: 0.3, f: 0 },
  { id: 'huevo', n: 'Huevo entero', grupo: 'proteina', k: 143, p: 12.6, c: 0.7, g: 9.5, f: 0, porciones: [['pieza (50 g)', 50]] },
  { id: 'clara', n: 'Clara de huevo', grupo: 'proteina', k: 52, p: 10.9, c: 0.7, g: 0.2, f: 0, porciones: [['clara (33 g)', 33]] },
  { id: 'whey', n: 'Proteína whey', grupo: 'proteina', k: 400, p: 80, c: 10, g: 5, f: 0, porciones: [['scoop (30 g)', 30]] },
  { id: 'jamon_pavo', n: 'Jamón de pavo', grupo: 'proteina', k: 105, p: 17, c: 2.5, g: 3, f: 0, porciones: [['rebanada (20 g)', 20]] },
  { id: 'salchicha', n: 'Salchicha de pavo', grupo: 'proteina', k: 210, p: 13, c: 4, g: 16, f: 0, porciones: [['pieza (40 g)', 40]] },

  // ---- Lácteos (los líquidos van por 100 ml)
  { id: 'leche_desc', n: 'Leche descremada', grupo: 'lacteo', k: 34, p: 3.4, c: 5, g: 0.1, f: 0, ml: true, porciones: [['vaso (250 ml)', 250]] },
  { id: 'leche_light', n: 'Leche semidescremada (light)', grupo: 'lacteo', k: 50, p: 3.3, c: 4.8, g: 2, f: 0, ml: true, porciones: [['vaso (250 ml)', 250]] },
  { id: 'leche_entera', n: 'Leche entera', grupo: 'lacteo', k: 61, p: 3.2, c: 4.8, g: 3.3, f: 0, ml: true, porciones: [['vaso (250 ml)', 250]] },
  { id: 'yogur_griego', n: 'Yogur griego natural sin azúcar', grupo: 'lacteo', k: 59, p: 10.2, c: 3.6, g: 0.4, f: 0, porciones: [['envase (150 g)', 150]] },
  { id: 'panela', n: 'Queso panela', grupo: 'lacteo', k: 250, p: 18, c: 3, g: 18, f: 0, porciones: [['rebanada (30 g)', 30]] },
  { id: 'oaxaca', n: 'Queso Oaxaca', grupo: 'lacteo', k: 300, p: 22, c: 2, g: 22, f: 0, porciones: [['porción (30 g)', 30]] },

  // ---- Carbohidrato
  { id: 'arroz', n: 'Arroz blanco cocido', grupo: 'carbohidrato', k: 130, p: 2.7, c: 28.2, g: 0.3, f: 0.4, porciones: [['taza (200 g)', 200]] },
  { id: 'tortilla', n: 'Tortilla de maíz', grupo: 'carbohidrato', k: 218, p: 5.7, c: 44.6, g: 2.9, f: 6.3, porciones: [['pieza (30 g)', 30]] },
  { id: 'tortilla_harina', n: 'Tortilla de harina', grupo: 'carbohidrato', k: 306, p: 8.2, c: 50, g: 8, f: 3.5, porciones: [['pieza (45 g)', 45]] },
  { id: 'frijoles', n: 'Frijoles de olla / cocidos', grupo: 'carbohidrato', k: 132, p: 8.9, c: 23.7, g: 0.5, f: 8.7, porciones: [['½ taza (100 g)', 100]] },
  { id: 'papa', n: 'Papa cocida', grupo: 'carbohidrato', k: 86, p: 1.7, c: 20, g: 0.1, f: 1.8 },
  { id: 'camote', n: 'Camote cocido', grupo: 'carbohidrato', k: 90, p: 2, c: 20.7, g: 0.2, f: 3.3 },
  { id: 'pasta', n: 'Pasta cocida', grupo: 'carbohidrato', k: 158, p: 5.8, c: 30.9, g: 0.9, f: 1.8 },
  { id: 'avena', n: 'Avena (en seco)', grupo: 'carbohidrato', k: 379, p: 13.2, c: 67.7, g: 6.5, f: 10.1, porciones: [['½ taza (40 g)', 40]] },
  { id: 'pan_integral', n: 'Pan integral', grupo: 'carbohidrato', k: 252, p: 12.4, c: 42.7, g: 3.5, f: 6, porciones: [['rebanada (32 g)', 32]] },
  { id: 'galleta_arroz', n: 'Galleta de arroz', grupo: 'carbohidrato', k: 387, p: 8.2, c: 81.5, g: 2.8, f: 4.2, porciones: [['pieza (9 g)', 9]] },

  // ---- Grasa
  { id: 'aceite', n: 'Aceite de oliva o de aguacate', grupo: 'grasa', k: 884, p: 0, c: 0, g: 100, f: 0, porciones: [['cdta (4.5 g)', 4.5], ['cda (13.5 g)', 13.5]] },
  { id: 'aguacate', n: 'Aguacate', grupo: 'grasa', k: 160, p: 2, c: 8.5, g: 14.7, f: 6.7 },
  { id: 'almendras', n: 'Almendras', grupo: 'grasa', k: 579, p: 21.2, c: 21.6, g: 49.9, f: 12.5, porciones: [['pieza (≈1.2 g)', 1.2]] },
  { id: 'crema_cacahuate', n: 'Crema de cacahuate', grupo: 'grasa', k: 588, p: 25, c: 20, g: 50, f: 6, porciones: [['cda (16 g)', 16], ['cdta (5 g)', 5]] },
  { id: 'nueces', n: 'Nueces', grupo: 'grasa', k: 654, p: 15.2, c: 13.7, g: 65.2, f: 6.7 },

  // ---- Verdura
  { id: 'verduras', n: 'Verduras cocidas (mezcla)', grupo: 'verdura', k: 30, p: 1.8, c: 6, g: 0.3, f: 2.5 },
  { id: 'ensalada', n: 'Ensalada (lechuga, jitomate, pepino)', grupo: 'verdura', k: 16, p: 0.9, c: 3.3, g: 0.2, f: 1.2 },
  { id: 'brocoli', n: 'Brócoli cocido', grupo: 'verdura', k: 35, p: 2.4, c: 7.2, g: 0.4, f: 3.3 },
  { id: 'espinaca', n: 'Espinaca', grupo: 'verdura', k: 23, p: 2.9, c: 3.6, g: 0.4, f: 2.2 },
  { id: 'nopales', n: 'Nopales cocidos', grupo: 'verdura', k: 15, p: 1.4, c: 3.3, g: 0.1, f: 2 },
  { id: 'calabacita', n: 'Calabacita cocida', grupo: 'verdura', k: 15, p: 1.1, c: 2.7, g: 0.4, f: 1 },

  // ---- Fruta
  { id: 'frutos_rojos', n: 'Frutos rojos congelados', grupo: 'fruta', k: 48, p: 0.7, c: 11.5, g: 0.4, f: 3 },
  { id: 'platano', n: 'Plátano', grupo: 'fruta', k: 89, p: 1.1, c: 22.8, g: 0.3, f: 2.6, porciones: [['pieza mediana (120 g)', 120]] },
  { id: 'manzana', n: 'Manzana', grupo: 'fruta', k: 52, p: 0.3, c: 13.8, g: 0.2, f: 2.4, porciones: [['pieza (180 g)', 180]] },
  { id: 'papaya', n: 'Papaya', grupo: 'fruta', k: 43, p: 0.5, c: 10.8, g: 0.3, f: 1.7 },

  // ---- Bebidas (por 100 ml). Las calorías del alcohol no caben en P/C/G: por eso kcal va aparte.
  { id: 'cerveza_light', n: 'Cerveza light', grupo: 'bebida', k: 29, p: 0.3, c: 1.6, g: 0, f: 0, ml: true, porciones: [['lata (355 ml)', 355]] },
  { id: 'cerveza', n: 'Cerveza normal', grupo: 'bebida', k: 43, p: 0.5, c: 3.6, g: 0, f: 0, ml: true, porciones: [['lata (355 ml)', 355]] },
  { id: 'tequila', n: 'Tequila', grupo: 'bebida', k: 222, p: 0, c: 0, g: 0, f: 0, ml: true, porciones: [['caballito (45 ml)', 45]] },
  { id: 'refresco', n: 'Refresco normal', grupo: 'bebida', k: 42, p: 0, c: 10.6, g: 0, f: 0, ml: true, porciones: [['lata (355 ml)', 355]] },
  { id: 'trago_mineral', n: 'Tequila con agua mineral y limón', grupo: 'bebida', porcion: 'vaso', k: 100, p: 0, c: 1, g: 0, f: 0, aprox: true },
  { id: 'trago_refresco', n: 'Preparado con refresco', grupo: 'bebida', porcion: 'vaso', k: 200, p: 0, c: 26, g: 0, f: 0, aprox: true },

  // ---- Otros (por porción)
  { id: 'bloom', n: 'Bloom Greens', grupo: 'otro', porcion: 'scoop', k: 15, p: 0, c: 3, g: 0, f: 2, aprox: true },
  { id: 'barra_proteina', n: 'Barra de proteína (≥20 g)', grupo: 'otro', porcion: 'barra (≈60 g)', k: 210, p: 20, c: 22, g: 7, f: 3, aprox: true },

  // ---- Comer fuera (estimados a partir del plan)
  { id: 'wok_mejor', n: 'Wok: sin empanizar, doble verdura y ½ arroz', grupo: 'fuera', porcion: 'pedido', k: 775, p: 50, c: 85, g: 26, f: 6, aprox: true },
  { id: 'wok_combo', n: 'Wok: combo normal (arroz frito + pollo a la naranja)', grupo: 'fuera', porcion: 'pedido', k: 1450, p: 55, c: 190, g: 50, f: 5, aprox: true },
  { id: 'tacos_asada', n: '4 tacos de asada o pollo (1 tortilla) + frijoles de olla', grupo: 'fuera', porcion: 'orden', k: 750, p: 48, c: 70, g: 30, f: 10, aprox: true },
  { id: 'tacos_adobada', n: '5 tacos de adobada', grupo: 'fuera', porcion: 'orden', k: 975, p: 45, c: 95, g: 46, f: 8, aprox: true },
  { id: 'tienda_yogur', n: 'Tienda: yogur griego + barra de proteína', grupo: 'fuera', porcion: 'combo', k: 300, p: 35, c: 27, g: 8, f: 3, aprox: true },
  { id: 'tienda_sandwich', n: 'Tienda: leche + sándwich de pavo', grupo: 'fuera', porcion: 'combo', k: 420, p: 30, c: 50, g: 10, f: 4, aprox: true },
];

// Quita acentos y mayúsculas para buscar "platano" y encontrar "Plátano".
export const normalizar = texto => String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Busca por palabras: "pollo coc" encuentra "Pechuga de pollo cocida".
export function buscar(lista, consulta) {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (!palabras.length) return lista;
  return lista.filter(a => {
    const nombre = normalizar(a.n);
    return palabras.every(p => nombre.includes(p));
  });
}

// Las unidades posibles para capturar un alimento: [{ valor, nombre, gramos }].
//   valor 'g'  → gramos (o ml) directos
//   valor 0, 1 → índice de la porción
//   valor 'u'  → número de porciones (alimentos por porción)
export function unidades(alimento) {
  if (alimento.porcion) return [{ valor: 'u', nombre: alimento.porcion }];
  const lista = (alimento.porciones || []).map(([nombre, gramos], i) => ({ valor: String(i), nombre, gramos }));
  lista.push({ valor: 'g', nombre: alimento.ml ? 'ml' : 'g' });
  return lista;
}

// Calcula calorías y macros de una cantidad. Devuelve { kcal, p, c, g, f, detalle }.
export function calcular(alimento, cantidad, unidad) {
  let factor, detalle;
  const cant = Number(cantidad) || 0;
  const bonito = n => String(Math.round(n * 100) / 100);
  if (alimento.porcion) {
    factor = cant;                                   // valores por porción × número de porciones
    detalle = `${bonito(cant)} ${alimento.porcion}`;
  } else if (unidad === 'g') {
    factor = cant / 100;                             // valores por 100 g
    detalle = `${bonito(cant)} ${alimento.ml ? 'ml' : 'g'}`;
  } else {
    const [nombre, gramos] = alimento.porciones[Number(unidad)];
    factor = cant * gramos / 100;
    detalle = `${bonito(cant)} × ${nombre}`;
  }
  return {
    kcal: Math.round(alimento.k * factor),
    p: Math.round(alimento.p * factor * 10) / 10,
    c: Math.round(alimento.c * factor * 10) / 10,
    g: Math.round(alimento.g * factor * 10) / 10,
    f: Math.round((alimento.f || 0) * factor * 10) / 10,
    detalle,
  };
}
