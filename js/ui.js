// =====================================================================
// ui.js — Piezas de interfaz que usan todas las pantallas.
// ---------------------------------------------------------------------
// - esc(): "limpia" texto antes de meterlo al HTML (para que un nombre
//   como "<b>" no rompa la página).
// - fmt()/num(): mostrar y leer números al estilo mexicano (2,200 / 86.4).
// - abrirHoja(): la hoja que sube desde abajo para capturar datos.
// - aviso(): mensajito temporal abajo de la pantalla (con "Deshacer").
// =====================================================================

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = texto => String(texto ?? '').replace(/[&<>"']/g, c => ESCAPES[c]);

// 2200 → "2,200";  fmt(7.456, 1) → "7.5";  null → "—"
export function fmt(n, decimales = 0) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

// Hasta un decimal, sin ".0" de sobra: 33 → "33";  52.46 → "52.5"
export function fmt1(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('es-MX', { maximumFractionDigits: 1 });
}

// Lee lo que escribiste: acepta "86,4" o "86.4". Vacío → null.
export function num(texto) {
  const limpio = String(texto ?? '').trim().replace(',', '.');
  if (limpio === '') return null;
  const v = Number(limpio);
  return isNaN(v) ? null : v;
}

// Iconos sencillos dibujados con líneas (SVG).
const ICONOS = {
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  flecha: '<path d="M9 6l6 6-6 6"/>',
  agua: '<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>',
  basura: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  reloj: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M10 3h4"/>',
};
export const icono = (nombre, clase = '') =>
  `<svg class="ico ${clase}" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[nombre] || ''}</svg>`;

// Barra de avance (0 a 100 %). `clase` decide el color (proteina, carbos…).
export function barra(valor, meta, clase = '') {
  const pct = meta > 0 ? Math.max(0, Math.min(100, (valor / meta) * 100)) : 0;
  return `<div class="barra ${clase}"><i style="width:${pct.toFixed(1)}%"></i></div>`;
}

// ---------------------------------------------------------------- hoja inferior

const hoja = () => document.getElementById('hoja');

// Abre la hoja. `botones`: [{ texto, clase, alTocar(dialogo) }].
// Si alTocar devuelve false, la hoja se queda abierta (sirve para validar
// o para abrir otra hoja encima).
export function abrirHoja({ titulo, html, botones = [], alMontar }) {
  const d = hoja();
  d.innerHTML = `
    <div class="hoja-cab">
      <h2>${esc(titulo)}</h2>
      <button type="button" class="icono-btn" data-hoja="cerrar" aria-label="Cerrar">${icono('x')}</button>
    </div>
    <div class="hoja-cuerpo">${html}</div>
    <div class="hoja-avisos" role="status"></div>
    ${botones.length ? `<div class="hoja-pie">${botones.map((b, i) =>
      `<button type="button" class="boton ${b.clase || ''}" data-hoja="${i}">${esc(b.texto)}</button>`).join('')}</div>` : ''}`;

  d.onclick = ev => {
    if (ev.target === d) return cerrarHoja();               // tocaste el fondo oscuro
    const b = ev.target.closest('[data-hoja]');
    if (!b) return;
    if (b.dataset.hoja === 'cerrar') return cerrarHoja();
    const resultado = botones[Number(b.dataset.hoja)].alTocar?.(d);
    if (resultado !== false) cerrarHoja();
  };
  // "Intro" en el teclado = tocar el botón principal.
  d.onkeydown = ev => {
    if (ev.key === 'Enter' && ev.target.matches('input:not([type=checkbox])')) {
      ev.preventDefault();
      d.querySelector('.hoja-pie .principal')?.click();
    }
  };
  if (!d.open) d.showModal();
  d.querySelector('.hoja-cuerpo').scrollTop = 0;
  alMontar?.(d);
}

export function cerrarHoja() {
  const d = hoja();
  if (d.open) d.close();
}

// ---------------------------------------------------------------- avisos

// Si la hoja sigue abierta (por ejemplo, un dato mal escrito), el aviso sale
// dentro de la hoja; si no, abajo de la pantalla. Se decide un instante después
// para saber si la hoja se cerró o no.
export function aviso(texto, { accion, alTocar, ms = 3500 } = {}) {
  const el = document.createElement('div');
  el.className = 'aviso';
  el.innerHTML = `<span>${esc(texto)}</span>${accion ? `<button type="button">${esc(accion)}</button>` : ''}`;
  if (accion) el.querySelector('button').onclick = () => { alTocar(); el.remove(); };
  setTimeout(() => {
    const d = hoja();
    const caja = d.open ? d.querySelector('.hoja-avisos') : document.getElementById('avisos');
    caja.replaceChildren(el);
    setTimeout(() => el.remove(), ms);
  }, 0);
}

// Campo de texto numérico (abre el teclado de números en el iPhone).
export function campoNumero({ id, etiqueta, valor, unidad = '', ayuda = '', decimal = true, autofocus = false }) {
  return `
    <label class="campo" for="${id}">
      <span>${esc(etiqueta)}</span>
      <span class="campo-entrada">
        <input id="${id}" type="text" inputmode="${decimal ? 'decimal' : 'numeric'}" autocomplete="off"
               value="${valor == null ? '' : esc(valor)}" ${autofocus ? 'autofocus' : ''}>
        ${unidad ? `<em>${esc(unidad)}</em>` : ''}
      </span>
      ${ayuda ? `<small>${esc(ayuda)}</small>` : ''}
    </label>`;
}
