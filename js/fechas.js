// =====================================================================
// fechas.js — Ayudantes para trabajar con fechas.
// ---------------------------------------------------------------------
// Toda la app guarda las fechas como texto 'AAAA-MM-DD' (ej. '2026-11-09').
// Así se pueden comparar como texto ('2026-11-09' < '2026-11-10') y sirven
// directo como "cajones" para guardar cada día. Se calculan en tu hora local
// (no en UTC), para que "hoy" sea tu día real aunque sean las 11 de la noche.
// =====================================================================

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Date de JavaScript → 'AAAA-MM-DD'
export function aISO(d) {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// 'AAAA-MM-DD' → Date a medianoche local
export function deISO(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export const hoyISO = () => aISO(new Date());

// Suma (o resta, con n negativo) días a una fecha.
export function sumarDias(iso, n) {
  const d = deISO(iso);
  d.setDate(d.getDate() + n);
  return aISO(d);
}

// Cuántos días van de `a` a `b` (positivo si b es después). Math.round evita
// errores de una hora en los cambios de horario.
export const diasEntre = (a, b) => Math.round((deISO(b) - deISO(a)) / 86400000);

// 0 = domingo, 1 = lunes … 6 = sábado
export const diaSemana = iso => deISO(iso).getDay();

// El lunes de la semana de esa fecha (las semanas del plan van de lunes a domingo).
export function lunesDe(iso) {
  const ds = diaSemana(iso);
  return sumarDias(iso, ds === 0 ? -6 : 1 - ds);
}

export const nombreDia = iso => DIAS[diaSemana(iso)];
export const diaCorto = iso => DIAS_CORTOS[diaSemana(iso)];

// '2026-11-09' → '9 nov'
export function fechaCorta(iso) {
  const d = deISO(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

// '2026-11-09' → 'lunes 9 nov'
export const fechaLarga = iso => `${nombreDia(iso)} ${fechaCorta(iso)}`;

// Recorre los días de `desde` a `hasta` (incluidos).
export function* recorrerDias(desde, hasta) {
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) yield f;
}
