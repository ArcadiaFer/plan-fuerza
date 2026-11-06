// =====================================================================
// calculos.js — Las cuentas de la app (sin nada de pantalla).
// ---------------------------------------------------------------------
// Totales del día, metas vigentes, semana y fase del plan, promedios de
// peso, e1RM, sugerencias de carga y las reglas de ajuste cada 2 semanas.
// =====================================================================

import { PLAN, FASES, EVENTOS, REVISIONES, OBJETIVOS, RUTINA, DIAS_ENTRENO, BASICOS, REGLAS_PDCA, HITOS } from './datos-plan.js';
import { sumarDias, diasEntre, diaSemana, recorrerDias, lunesDe } from './fechas.js';
import { est, dia } from './almacen.js';

export const redondear = (n, paso) => Math.round(n / paso) * paso;

// Kilos con máximo un decimal y sin ".0": 102.5 → "102.5", 100 → "100".
export const kg = n => (n == null || isNaN(n)) ? '—' : String(Math.round(n * 10) / 10);

export function promedio(valores) {
  const v = valores.filter(x => x != null && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// ---------------------------------------------------------------- comida

// Suma calorías y macros de todo lo que comiste ese día.
export function totales(d) {
  const t = { kcal: 0, p: 0, c: 0, g: 0, f: 0 };
  for (const x of d.comidas || []) for (const k in t) t[k] += Number(x[k]) || 0;
  return t;
}

// La meta vigente en una fecha: la última cuyo "desde" ya pasó.
export function metaEn(fecha) {
  const metas = [...est().metas].sort((a, b) => a.desde.localeCompare(b.desde));
  let vigente = metas[0];
  for (const m of metas) if (m.desde <= fecha) vigente = m;
  return vigente;
}

// ¿El día cumple la adherencia? (±10 % de calorías y ≥160 g de proteína).
// Devuelve null si no registraste comida ese día.
export function adherente(fecha) {
  const d = dia(fecha);
  if (!d.comidas?.length) return null;
  const t = totales(d), m = metaEn(fecha);
  return Math.abs(t.kcal - m.kcal) <= m.kcal * OBJETIVOS.adherenciaPct && t.p >= OBJETIVOS.proteinaMinima;
}

// 'ideal' (±100 kcal), 'ok' (±10 %), 'bajo' o 'alto'
export function estadoKcal(kcal, meta) {
  const dif = kcal - meta;
  if (Math.abs(dif) <= OBJETIVOS.toleranciaKcal) return 'ideal';
  if (Math.abs(dif) <= meta * OBJETIVOS.adherenciaPct) return 'ok';
  return dif < 0 ? 'bajo' : 'alto';
}

// ---------------------------------------------------------------- calendario

// Semana del plan: 1 = 9–15 nov, 0 = semana de línea base, negativo = antes.
export const semanaPlan = fecha => Math.floor(diasEntre(PLAN.inicio, fecha) / 7) + 1;

export function rangoSemana(n) {
  const desde = sumarDias(PLAN.inicio, (n - 1) * 7);
  return { desde, hasta: sumarDias(desde, 6) };
}

export const faseEn = fecha => FASES.find(f => fecha >= f.desde && fecha <= f.hasta) || null;
export const enDescarga = fecha => fecha >= PLAN.descarga.desde && fecha <= PLAN.descarga.hasta;
export const eventosEn = fecha => EVENTOS.filter(e => fecha >= e.desde && fecha <= e.hasta);
export const sesionProgramada = fecha => DIAS_ENTRENO[diaSemana(fecha)] || null;
export const proximaRevision = fecha => REVISIONES.find(r => r.fecha >= fecha) || null;
export const ultimaRevision = fecha => [...REVISIONES].reverse().find(r => r.fecha <= fecha) || null;

// ---------------------------------------------------------------- medidas

// Valores de un campo (peso, sueno…) registrados entre dos fechas.
export function valores(desde, hasta, campo) {
  const lista = [];
  for (const f of recorrerDias(desde, hasta)) {
    const v = est().dias[f]?.[campo];
    if (v != null) lista.push(v);
  }
  return lista;
}

// Promedio de peso de los 7 días que terminan en `fecha`.
export const pesoProm7 = fecha => promedio(valores(sumarDias(fecha, -6), fecha, 'peso'));

// El último valor registrado de un campo hasta una fecha: { fecha, valor } o null.
export function ultimoValor(campo, hasta) {
  const fechas = Object.keys(est().dias).filter(f => f <= hasta && est().dias[f][campo] != null).sort();
  const f = fechas.at(-1);
  return f ? { fecha: f, valor: est().dias[f][campo] } : null;
}

// Cuenta días de la semana (lunes a domingo) que cumplen una condición.
export function contarSemana(fecha, condicion) {
  const lunes = lunesDe(fecha);
  let n = 0;
  for (const f of recorrerDias(lunes, sumarDias(lunes, 6))) if (condicion(dia(f), f)) n++;
  return n;
}

// ---------------------------------------------------------------- entrenamiento

// e1RM = peso × (1 + (reps + RIR) / 30)
export const e1rm = (peso, reps, rir = 0) => peso * (1 + (reps + rir) / 30);

export function ejercicio(id) {
  for (const sesion of Object.values(RUTINA)) {
    const e = sesion.ejercicios.find(x => x.id === id);
    if (e) return e;
  }
  return null;
}

// '6–10 por pierna' → [6, 10];  '5' → [5, 5];  '0–1' → [0, 1]
export function rango(texto) {
  const n = (String(texto).match(/\d+(\.\d+)?/g) || []).map(Number);
  return [n[0] ?? 0, n[1] ?? n[0] ?? 0];
}

// Series que tocan ese día: la descarga las parte a la mitad y una revisión
// puede quitar una serie a los aislamientos.
export function seriesPrescritas(ej, fecha) {
  let n = ej.series;
  if (ej.aislamiento) n = Math.max(1, n + (metaEn(fecha).aislamiento || 0));
  if (enDescarga(fecha)) n = Math.max(1, Math.round(n / 2));
  return n;
}
export const rirPrescrito = (ej, fecha) => enDescarga(fecha) ? '3–4' : ej.rir;

// Las series registradas de un ejercicio en un día (solo las que tienen reps).
export function seriesDe(fecha, idEj) {
  return (est().dias[fecha]?.entreno?.series?.[idEj] || []).filter(s => s && s.reps);
}

// La última vez que hiciste un ejercicio ANTES de `fecha`: { fecha, series } o null.
export function ultimoRegistro(idEj, antesDe) {
  const fechas = Object.keys(est().dias).filter(f => f < antesDe).sort().reverse();
  for (const f of fechas) {
    const series = seriesDe(f, idEj);
    if (series.length) return { fecha: f, series };
  }
  return null;
}

// De varias series, la de mayor e1RM (la "serie top" real del día).
export function mejorSerie(series) {
  let mejor = null;
  for (const s of series) if (!mejor || e1rm(s.peso || 0, s.reps, s.rir) > e1rm(mejor.peso || 0, mejor.reps, mejor.rir)) mejor = s;
  return mejor;
}

// Mejor e1RM de la serie top de un básico en un día (o null).
export function e1rmDelDia(fecha, idTop) {
  const s = mejorSerie(seriesDe(fecha, idTop));
  return s && s.peso ? e1rm(s.peso, s.reps, s.rir) : null;
}

// Sugerencia para la siguiente serie: { peso?, texto }.
export function sugerencia(ej, fecha) {
  if (ej.tipo === 'top') return sugerenciaTop(ej, fecha);
  if (ej.tipo === 'respaldo') return sugerenciaRespaldo(ej, fecha);
  return sugerenciaDoble(ej, fecha);
}

function sugerenciaTop(ej, fecha) {
  const u = ultimoRegistro(ej.id, fecha);
  if (semanaPlan(fecha) <= 1) {
    return { peso: u ? mejorSerie(u.series).peso : undefined, texto: 'Semana 1 (línea base): sube en series de 3–5 reps hasta una a RIR 2. Esa es tu serie top real.' };
  }
  if (!u) return { texto: 'Sin registro anterior: busca una serie de 3–5 reps a RIR 2.' };
  const s = mejorSerie(u.series);
  const antes = `${kg(s.peso)} kg × ${s.reps} a RIR ${s.rir}`;
  if (enDescarga(fecha)) return { peso: s.peso, texto: `Descarga: misma carga que la vez pasada (${kg(s.peso)} kg) con RIR 3–4.` };
  if (s.reps >= 5 && s.rir >= 2) return { peso: s.peso + ej.salto, texto: `La vez pasada: ${antes}. Lograste 5 a RIR 2 → sube ${ej.salto} kg.` };
  if (s.reps >= 3) return { peso: s.peso, texto: `La vez pasada: ${antes}. Con 3–4 reps → repite la carga.` };
  return { peso: s.peso, texto: `La vez pasada: ${antes}. Menos de 3 reps → repite la carga o baja un escalón.` };
}

function sugerenciaRespaldo(ej, fecha) {
  const topHoy = mejorSerie(seriesDe(fecha, ej.top));
  if (topHoy?.peso) {
    const peso = redondear(topHoy.peso * 0.9, 2.5);
    return { peso, texto: `−10 % de tu serie top de hoy (${kg(topHoy.peso)} kg) ≈ ${kg(peso)} kg.` };
  }
  const top = sugerenciaTop(ejercicio(ej.top), fecha);
  if (top.peso) {
    const peso = redondear(top.peso * 0.9, 2.5);
    return { peso, texto: `Primero registra la serie top. Si haces ${kg(top.peso)} kg, el respaldo es ≈${kg(peso)} kg.` };
  }
  return { texto: 'Primero registra la serie top: el respaldo es 10 % menos.' };
}

// Doble progresión: primero reps, luego peso.
function sugerenciaDoble(ej, fecha) {
  const u = ultimoRegistro(ej.id, fecha);
  if (!u) return null;
  const [repMin, repMax] = rango(ej.reps);
  const [rirMin] = rango(ej.rir);
  const pesoRef = Math.max(...u.series.map(s => s.peso || 0));
  const antes = u.series.map(s => `${kg(s.peso)}×${s.reps}`).join(', ');
  if (enDescarga(fecha)) return { peso: pesoRef, texto: `Descarga: misma carga (${kg(pesoRef)} kg) con RIR 3–4.` };
  const n = seriesPrescritas(ej, u.fecha);
  const alTope = u.series.length >= n && u.series.slice(0, n).every(s => s.reps >= repMax && (s.rir ?? 0) >= rirMin);
  if (alTope && pesoRef === 0) {
    return { peso: 2.5, texto: `La vez pasada: ${antes}. Llegaste al tope → agrega ≈2.5 kg de lastre y vuelve a ${repMin} reps.` };
  }
  if (alTope) {
    const a = redondear(pesoRef * 1.025, 0.5), b = redondear(pesoRef * 1.05, 0.5);
    return { peso: Math.max(b, pesoRef + 1), texto: `La vez pasada: ${antes}. Llegaste al tope → sube 2.5–5 % (≈${kg(a)}–${kg(b)} kg) y vuelve a ${repMin} reps.` };
  }
  return { peso: pesoRef, texto: `La vez pasada: ${antes}. Mismo peso; busca ${repMax} reps en todas las series.` };
}

// ---------------------------------------------------------------- semanas y revisiones

// Todo lo de una semana del plan, como en la tabla "Registro semanal" del PDF.
export function resumenSemana(n) {
  const { desde, hasta } = rangoSemana(n);
  const pesos = [], suenos = [];
  const fuerza = { banca: null, sentadilla: null, pm: null };
  let cintura = null, adherencia = 0, conComida = 0;
  for (const f of recorrerDias(desde, hasta)) {
    const d = est().dias[f];
    if (!d) continue;
    if (d.peso != null) pesos.push(d.peso);
    if (d.sueno != null) suenos.push(d.sueno);
    if (d.cintura != null) cintura = d.cintura;          // la última de la semana (lo ideal: el domingo)
    const a = adherente(f);
    if (a !== null) { conComida++; if (a) adherencia++; }
    for (const b of BASICOS) {
      const v = e1rmDelDia(f, b.top);
      if (v && (!fuerza[b.id] || v > fuerza[b.id])) fuerza[b.id] = v;
    }
  }
  let peso = promedio(pesos);
  if (n === 0) {                                          // semana base: si no hay pesajes, usa tu línea base
    if (peso == null) peso = est().base.peso;
    if (cintura == null) cintura = est().base.cintura;
  }
  return { n, desde, hasta, peso, diasPeso: pesos.length, cintura, fuerza, adherencia, conComida, sueno: promedio(suenos) };
}

// Evalúa las reglas de ajuste al cierre de la semana n.
export function evaluarRevision(n) {
  const S = resumenSemana;
  const actual = S(n), previa = S(n - 1), antes = S(n - 2);
  const adhPromedio = (actual.adherencia + previa.adherencia) / 2;

  // Ritmo: promedio de la semana de referencia contra la última. La semana 1 (y la 9,
  // tras las fiestas) bajan más por agua, así que nunca se compara contra una semana anterior a ellas.
  const primera = n >= 9 ? 9 : 1;
  const ref = Math.max(n - 2, primera);
  const semRef = S(ref);
  const ritmo = (ref < n && semRef.peso != null && actual.peso != null)
    ? (semRef.peso - actual.peso) / (n - ref) : null;

  // Fuerza: ¿bajó el e1RM 2 semanas seguidas?
  const caidas = BASICOS.filter(b => {
    const x = antes.fuerza[b.id], y = previa.fuerza[b.id], z = actual.fuerza[b.id];
    return x && y && z && y < x && z < y;
  }).map(b => b.nombre);

  let regla;
  if (adhPromedio < OBJETIVOS.adherenciaMeta) regla = 'proceso';
  else if (caidas.length >= 2) regla = 'fuerza';
  else if (ritmo == null) regla = 'faltan';
  else if (ritmo > 0.9) regla = 'rapido';
  else if (ritmo < 0.4) regla = 'lento';
  else regla = 'bien';

  return { n, actual, previa, adhPromedio, ritmo, ref, caidas, regla, ...REGLAS_PDCA[regla] };
}

// Calorías de mantenimiento para las fiestas: meta + (kg perdidos por semana × 1,100).
export function sugerenciaMantenimiento() {
  const semanas = [1, 2, 3, 4, 5].map(resumenSemana).filter(s => s.peso != null);
  if (semanas.length < 2) return null;
  const primera = semanas[0], ultima = semanas.at(-1);
  const ritmo = (primera.peso - ultima.peso) / (ultima.n - primera.n);
  const m = metaEn('2026-12-16');
  const kcal = redondear(m.kcal + Math.max(0, ritmo) * 1100, 50);
  const extra = kcal - m.kcal;
  return {
    ritmo, kcal, base: m.kcal,
    meta: {
      desde: '2026-12-17', kcal, p: m.p,
      c: m.c + Math.round(extra * 0.6 / 4), gMin: m.gMin + Math.round(extra * 0.4 / 9), gMax: m.gMax + Math.round(extra * 0.4 / 9),
      aislamiento: m.aislamiento || 0, nota: 'Mantenimiento (fiestas)',
    },
  };
}

// La meta de definición que tenías antes de las fiestas (para volver a ella el 4 ene).
export function metaRegresoDefinicion() {
  const m = metaEn('2026-12-16');
  return { ...m, desde: '2027-01-04', nota: 'Regreso a definición' };
}

// ¿Cómo vas contra cada hito? Usa tu línea base (que capturas tú).
export function avanceHitos(hoy) {
  const base = est().base;
  return HITOS.map(h => {
    const corte = hoy < h.fecha ? hoy : h.fecha;
    const peso = pesoProm7(corte);
    const cintura = ultimoValor('cintura', corte)?.valor ?? null;
    return {
      ...h,
      pesoMeta: base.peso != null ? [base.peso + h.peso[0], base.peso + h.peso[1]] : null,
      cinturaMeta: base.cintura != null ? [base.cintura + h.cintura[0], base.cintura + h.cintura[1]] : null,
      pesoActual: peso, cinturaActual: cintura,
    };
  });
}
