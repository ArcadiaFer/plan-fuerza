// =====================================================================
// almacen.js — Guarda y lee tus datos en el propio teléfono.
// ---------------------------------------------------------------------
// Todo vive en un solo objeto ("datos") que se guarda como texto JSON en
// localStorage, la memoria que cada sitio web tiene en tu navegador.
// No se manda nada a internet. Por eso existe el respaldo: un archivo
// .json que puedes guardar en Archivos/OneDrive o pasar al iPad.
//
// Forma de los datos:
//   dias: { '2026-11-09': { comidas: [...], peso, cintura, agua, pasos,
//           sueno, caminata, habitos: {creatina, cafe, taper},
//           entreno: { sesion, series: { idEjercicio: [{peso, reps, rir}] }, notas } } }
//   metas: historial de metas [{ desde, kcal, p, c, gMin, gMax, aislamiento, nota }]
//   base: tu línea base { peso, cintura }
//   propios: alimentos que tú creaste
//   superLista / prep: palomitas de la lista del súper y del meal prep
//   decisiones: lo que decidiste en cada revisión { semana: { texto, fecha } }
//   preferencias: la última variante que elegiste de cada comida del plan
// =====================================================================

import { METAS_INICIALES } from './datos-plan.js';

const CLAVE = 'plan-fuerza:datos';
let datos = null;

function vacio() {
  return {
    version: 1,
    dias: {},
    metas: [{ ...METAS_INICIALES }],
    base: { peso: null, cintura: null },
    propios: [],
    superLista: {},
    prep: {},
    decisiones: {},
    preferencias: {},
    ultimoRespaldo: null,
  };
}

// Completa lo que falte (por si el dato viene de una versión vieja o de un respaldo).
function normalizar(d) {
  const v = vacio();
  if (!d || typeof d !== 'object') return v;
  const objeto = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};
  return {
    ...v,
    ...d,
    dias: objeto(d.dias),
    metas: Array.isArray(d.metas) && d.metas.length ? d.metas : v.metas,
    base: { ...v.base, ...objeto(d.base) },
    propios: Array.isArray(d.propios) ? d.propios : [],
    superLista: objeto(d.superLista),
    prep: objeto(d.prep),
    decisiones: objeto(d.decisiones),
    preferencias: objeto(d.preferencias),
  };
}

export function cargar() {
  try {
    datos = normalizar(JSON.parse(localStorage.getItem(CLAVE)));
  } catch {
    datos = vacio();
  }
  return datos;
}

// Acceso a los datos desde cualquier pantalla.
export const est = () => datos;

export function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
    return true;
  } catch (error) {
    console.error(error);
    alert('No se pudo guardar en el teléfono. Haz un respaldo desde Plan → Datos.');
    return false;
  }
}

const diaVacio = () => ({ comidas: [], agua: 0, habitos: {} });

// Un día para LEER (si no existe, devuelve uno vacío sin guardarlo).
export const dia = fecha => datos.dias[fecha] || diaVacio();

// Un día para ESCRIBIR (lo crea si no existe).
export function diaEditable(fecha) {
  if (!datos.dias[fecha]) datos.dias[fecha] = diaVacio();
  const d = datos.dias[fecha];
  d.comidas ||= [];
  d.habitos ||= {};
  return d;
}

// Agrega una meta al historial (si ya hay una con la misma fecha "desde", la reemplaza).
export function ponerMeta(meta) {
  datos.metas = datos.metas.filter(m => m.desde !== meta.desde);
  datos.metas.push(meta);
  datos.metas.sort((a, b) => a.desde.localeCompare(b.desde));
  guardar();
}

// Identificador corto y único para cada registro (para poder borrarlo después).
export const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------------------------------------------------------------- respaldo

export function textoRespaldo() {
  return JSON.stringify({ app: 'plan-fuerza', version: 1, exportado: new Date().toISOString(), datos });
}

export function marcarRespaldo() {
  datos.ultimoRespaldo = new Date().toISOString();
  guardar();
}

// Revisa que el archivo sea un respaldo de esta app antes de reemplazar nada.
export function leerRespaldo(texto) {
  let obj;
  try { obj = JSON.parse(texto); } catch { throw new Error('El archivo no es un JSON válido.'); }
  if (!obj || obj.app !== 'plan-fuerza' || !obj.datos || typeof obj.datos.dias !== 'object') {
    throw new Error('El archivo no es un respaldo de Plan Fuerza.');
  }
  const d = normalizar(obj.datos);
  for (const [fecha, dia] of Object.entries(d.dias)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !dia || typeof dia !== 'object') {
      throw new Error(`Día con formato inválido: ${fecha}`);
    }
    if (!Array.isArray(dia.comidas)) dia.comidas = [];
    if (!dia.habitos || typeof dia.habitos !== 'object') dia.habitos = {};
  }
  return { datos: d, exportado: obj.exportado, dias: Object.keys(d.dias).length };
}

export function reemplazarDatos(nuevos) {
  datos = nuevos;
  guardar();
}

export function borrarTodo() {
  datos = vacio();
  guardar();
}
