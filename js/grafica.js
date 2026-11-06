// =====================================================================
// grafica.js — Gráficas de línea en SVG, hechas a mano (sin librerías).
// ---------------------------------------------------------------------
// dibujarGrafica(contenedor, { series, unidad, alto, vacio })
//   series: [{ nombre, color, tipo: 'linea' | 'puntos', puntos: [['2026-11-09', 86.4], …] }]
// - Líneas de 2 px, rejilla tenue y una sola escala vertical.
// - Con 2 o más series hay leyenda; el último valor de cada línea se
//   escribe a su derecha si no se enciman.
// - Tocar o arrastrar el dedo encima muestra la fecha y los valores.
// =====================================================================

import { diasEntre, sumarDias, fechaCorta } from './fechas.js';
import { esc, fmt } from './ui.js';

const observadores = new Set();

// Divide un rango en 3–5 marcas "redondas" (85, 86, 87… o 100, 120, 140…).
function ticksBonitos(min, max, cuantos = 4) {
  if (min === max) { min -= 1; max += 1; }
  const crudo = (max - min) / cuantos;
  const magnitud = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map(m => m * magnitud).find(p => p >= crudo);
  const ini = Math.floor(min / paso) * paso;
  const fin = Math.ceil(max / paso) * paso;
  const ticks = [];
  for (let v = ini; v <= fin + paso / 2; v += paso) ticks.push(Math.round(v * 1e6) / 1e6);
  return { ticks, min: ini, max: fin, paso };
}

export function dibujarGrafica(el, opciones) {
  // Limpia observadores de gráficas que ya no están en pantalla.
  for (const o of observadores) if (!o.el.isConnected) { o.obs.disconnect(); observadores.delete(o); }
  pintar(el, opciones);
  if ('ResizeObserver' in window) {
    let ancho = el.clientWidth;
    const obs = new ResizeObserver(() => {
      if (Math.abs(el.clientWidth - ancho) > 4) { ancho = el.clientWidth; pintar(el, opciones); }
    });
    obs.observe(el);
    observadores.add({ el, obs });
  }
}

function pintar(el, { series, unidad = '', alto = 190, vacio = 'Sin datos todavía.', leyenda: conLeyenda }) {
  const visibles = series.filter(s => s.puntos.length);
  if (!visibles.length) {
    el.innerHTML = `<p class="g-vacio">${esc(vacio)}</p>`;
    return;
  }
  const W = Math.max(260, Math.round(el.clientWidth || 320));
  const H = alto;
  const M = { izq: 40, der: 12, arr: 10, aba: 24 };

  // ---- escalas
  const fechas = [...new Set(visibles.flatMap(s => s.puntos.map(p => p[0])))].sort();
  let f0 = fechas[0], f1 = fechas.at(-1);
  if (f0 === f1) { f0 = sumarDias(f0, -1); f1 = sumarDias(f1, 1); }
  const totalDias = diasEntre(f0, f1);
  const valores = visibles.flatMap(s => s.puntos.map(p => p[1]));
  const { ticks, min, max, paso } = ticksBonitos(Math.min(...valores), Math.max(...valores));
  const decTick = paso < 1 ? 1 : 0;
  const Y = v => M.arr + (1 - (v - min) / (max - min)) * (H - M.arr - M.aba);

  // ---- ¿caben las etiquetas al final de cada línea sin encimarse?
  const lineas = visibles.filter(s => s.tipo !== 'puntos');
  const finales = lineas.map(s => ({ s, ultimo: s.puntos.at(-1), y: Y(s.puntos.at(-1)[1]) })).sort((a, b) => a.y - b.y);
  const caben = finales.every((e, i) => i === 0 || e.y - finales[i - 1].y >= 13);
  if (caben && finales.length) M.der = 44;
  const X = f => M.izq + (diasEntre(f0, f) / totalDias) * (W - M.izq - M.der);

  // ---- rejilla y ejes
  let svg = '';
  for (const t of ticks) {
    svg += `<line class="g-rejilla" x1="${M.izq}" x2="${W - M.der}" y1="${Y(t)}" y2="${Y(t)}"/>`;
    svg += `<text class="g-eje-y" x="${M.izq - 6}" y="${Y(t)}">${fmt(t, decTick)}</text>`;
  }
  const nEtiquetas = Math.min(4, totalDias + 1);
  for (let i = 0; i < nEtiquetas; i++) {
    const f = sumarDias(f0, Math.round((totalDias * i) / Math.max(1, nEtiquetas - 1)));
    const ancla = i === 0 ? 'start' : i === nEtiquetas - 1 ? 'end' : 'middle';
    svg += `<text class="g-eje-x" x="${X(f)}" y="${H - 6}" text-anchor="${ancla}">${fechaCorta(f)}</text>`;
  }

  // ---- datos: primero los puntos sueltos (contexto), encima las líneas
  for (const s of visibles.filter(s => s.tipo === 'puntos')) {
    for (const [f, v] of s.puntos) svg += `<circle class="g-punto" cx="${X(f)}" cy="${Y(v)}" r="3" style="fill:${s.color}"/>`;
  }
  for (const s of lineas) {
    const d = s.puntos.map(([f, v], i) => `${i ? 'L' : 'M'}${X(f).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    const [fu, vu] = s.puntos.at(-1);
    svg += `<path class="g-linea" d="${d}" style="stroke:${s.color}"/>`;
    svg += `<circle class="g-final" cx="${X(fu)}" cy="${Y(vu)}" r="4" style="fill:${s.color}"/>`;
    if (caben) svg += `<text class="g-etiqueta" x="${X(fu) + 8}" y="${Y(vu)}">${fmt(vu, 1)}</text>`;
  }
  svg += `<line class="g-cruz" x1="0" x2="0" y1="${M.arr}" y2="${H - M.aba}" visibility="hidden"/><g class="g-marcas"></g>`;

  // ---- leyenda (con 2 o más series, o si se pide)
  const leyenda = (conLeyenda ?? visibles.length >= 2)
    ? `<div class="g-leyenda">${visibles.map(s => `
        <span><i class="${s.tipo === 'puntos' ? 'punto' : 'linea'}" style="background:${s.color}"></i>${esc(s.nombre)}</span>`).join('')}</div>`
    : '';
  const descripcion = visibles.map(s => `${s.nombre}: último ${fmt(s.puntos.at(-1)[1], 1)} ${unidad}`).join('; ');

  el.innerHTML = `${leyenda}
    <div class="g-lienzo">
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(descripcion)}">${svg}</svg>
      <div class="g-tip" hidden></div>
    </div>`;

  // ---- tocar / arrastrar: cruz y cuadrito con los valores de ese día
  const lienzo = el.querySelector('svg');
  const tip = el.querySelector('.g-tip');
  const cruz = lienzo.querySelector('.g-cruz');
  const marcas = lienzo.querySelector('.g-marcas');
  const posiciones = fechas.map(f => ({ f, x: X(f) }));
  let temporizador = null;

  function mostrar(ev) {
    clearTimeout(temporizador);
    const caja = lienzo.getBoundingClientRect();
    const x = (ev.clientX - caja.left) * (W / caja.width);
    let cerca = posiciones[0];
    for (const p of posiciones) if (Math.abs(p.x - x) < Math.abs(cerca.x - x)) cerca = p;
    cruz.setAttribute('x1', cerca.x);
    cruz.setAttribute('x2', cerca.x);
    cruz.setAttribute('visibility', 'visible');
    let filas = '', circulos = '';
    for (const s of visibles) {
      const punto = s.puntos.find(p => p[0] === cerca.f);
      if (!punto) continue;
      circulos += `<circle class="g-marca" cx="${cerca.x}" cy="${Y(punto[1])}" r="5" style="fill:${s.color}"/>`;
      filas += `<div><i style="background:${s.color}"></i>${esc(s.nombre)} <b>${fmt(punto[1], 1)} ${esc(unidad)}</b></div>`;
    }
    marcas.innerHTML = circulos;
    tip.innerHTML = `<strong>${fechaCorta(cerca.f)}</strong>${filas}`;
    tip.hidden = false;
    const izquierda = (cerca.x / W) * caja.width - tip.offsetWidth / 2;
    tip.style.left = `${Math.max(0, Math.min(caja.width - tip.offsetWidth, izquierda))}px`;
  }
  function ocultar() {
    tip.hidden = true;
    cruz.setAttribute('visibility', 'hidden');
    marcas.innerHTML = '';
  }
  lienzo.addEventListener('pointerdown', mostrar);
  lienzo.addEventListener('pointermove', mostrar);
  lienzo.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') ocultar(); });
  lienzo.addEventListener('pointerup', ev => {
    if (ev.pointerType !== 'mouse') temporizador = setTimeout(ocultar, 2500);
  });
}
