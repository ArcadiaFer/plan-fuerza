// =====================================================================
// app.js — Arranque de la app y navegación entre pantallas.
// ---------------------------------------------------------------------
// - Carga tus datos del teléfono.
// - Prepara las 5 pantallas (Hoy, Comida, Entreno, Progreso, Plan) y la
//   barra de pestañas de abajo.
// - Maneja la fecha activa (‹ › arriba) para registrar días pasados.
// - Registra el "service worker" (sw.js) para que funcione sin internet.
// =====================================================================

import { cargar } from './almacen.js';
import { hoyISO, sumarDias, fechaCorta, diaCorto } from './fechas.js';
import { prepararTemporizador } from './temporizador.js';
import { alGuardarRegistro } from './registro.js';
import * as hoy from './vista-hoy.js';
import * as comida from './vista-comida.js';
import * as entreno from './vista-entreno.js';
import * as progreso from './vista-progreso.js';
import * as plan from './vista-plan.js';

const VISTAS = { hoy, comida, entreno, progreso, plan };
const TITULOS = { hoy: 'Hoy', comida: 'Comida', entreno: 'Entreno', progreso: 'Progreso', plan: 'Mi plan' };
const CON_FECHA = new Set(['hoy', 'comida', 'entreno']);   // pantallas que dependen del día elegido

// "ctx" (contexto) es lo que comparten todas las pantallas.
const ctx = { fecha: hoyISO(), vista: 'hoy', irA, refrescar };

function irA(vista) {
  ctx.vista = vista;
  for (const nombre of Object.keys(VISTAS)) document.getElementById(`v-${nombre}`).hidden = nombre !== vista;
  for (const b of document.querySelectorAll('#pestanas [data-vista]')) {
    if (b.dataset.vista === vista) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
  refrescar();
}

// Vuelve a dibujar la pantalla visible (después de cualquier cambio).
function refrescar() {
  VISTAS[ctx.vista].render(document.getElementById(`v-${ctx.vista}`));
  pintarCabecera();
}

function pintarCabecera() {
  document.getElementById('titulo').textContent = TITULOS[ctx.vista];
  const nav = document.getElementById('navfecha');
  nav.hidden = !CON_FECHA.has(ctx.vista);
  const esHoy = ctx.fecha === hoyISO();
  document.getElementById('fecha-texto').textContent = `${esHoy ? 'Hoy · ' : ''}${diaCorto(ctx.fecha)} ${fechaCorta(ctx.fecha)}`;
  document.getElementById('fecha-elegir').value = ctx.fecha;
  nav.classList.toggle('otro-dia', !esHoy);
  document.getElementById('volver-hoy').hidden = esHoy;
}

function cambiarFecha(fecha) {
  ctx.fecha = fecha;
  refrescar();
}

// ---------------------------------------------------------------- arranque

cargar();
alGuardarRegistro(refrescar);
for (const [nombre, modulo] of Object.entries(VISTAS)) modulo.iniciar(document.getElementById(`v-${nombre}`), ctx);
prepararTemporizador();

document.getElementById('pestanas').addEventListener('click', ev => {
  const b = ev.target.closest('[data-vista]');
  if (b) irA(b.dataset.vista);
});

document.getElementById('navfecha').addEventListener('click', ev => {
  const b = ev.target.closest('[data-fecha]');
  if (!b) return;
  const v = b.dataset.fecha;
  cambiarFecha(v === 'hoy' ? hoyISO() : sumarDias(ctx.fecha, Number(v)));
});
// La fecha del centro es un <input type="date"> invisible encima del texto:
// en el iPhone, al tocarlo sale la rueda de fechas. En la computadora se abre con showPicker().
const campoFecha = document.getElementById('fecha-elegir');
campoFecha.addEventListener('click', () => { try { campoFecha.showPicker?.(); } catch { /* el navegador no lo permite */ } });
campoFecha.addEventListener('change', () => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(campoFecha.value)) cambiarFecha(campoFecha.value);
});

// Si abres la app al día siguiente y estabas viendo "hoy", pasa al nuevo hoy.
let ultimoHoy = hoyISO();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const h = hoyISO();
  if (h === ultimoHoy) return;
  if (ctx.fecha === ultimoHoy) ctx.fecha = h;
  ultimoHoy = h;
  refrescar();
});

irA('hoy');

// Funcionar sin internet + pedir que el navegador no borre los datos.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker:', err));
}
navigator.storage?.persist?.().catch(() => {});
