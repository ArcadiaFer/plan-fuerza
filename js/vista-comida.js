// =====================================================================
// vista-comida.js — Pantalla "Comida": el contador de calorías.
// ---------------------------------------------------------------------
// Arriba un buscador y "chips" por grupo (Recientes, Del plan, Proteína…).
// Tocar un alimento abre su hoja para poner cuánto comiste. Abajo está lo
// que llevas en el día y una guía rápida (intercambios, regla de la mano,
// qué pedir en el Tec…).
// =====================================================================

import { est, dia } from './almacen.js';
import {
  COMIDAS_PLAN, INTERCAMBIOS, REGLA_MANO, COMER_FUERA, META_TAPER, CAMBIOS, HORARIOS, PESAR_COMIDA,
} from './datos-plan.js';
import { ALIMENTOS, GRUPOS, buscar } from './alimentos.js';
import { totales, metaEn } from './calculos.js';
import { hoyISO } from './fechas.js';
import { esc, fmt, icono } from './ui.js';
import {
  hojaAlimento, hojaRapido, hojaCrearAlimento, hojaComidaPlan, quitarEntrada, filaEntrada,
  recientes, buscarAlimento, entradaPlan, opcionPreferida,
} from './registro.js';

let ctx;
let consulta = '';          // lo escrito en el buscador
let grupo = 'recientes';    // el chip elegido
const abiertos = new Set(); // secciones de la guía que dejaste abiertas

const CHIPS = [['recientes', 'Recientes'], ['plan', 'Del plan'], ...GRUPOS, ['propios', 'Mis alimentos']];

export function iniciar(el, contexto) {
  ctx = contexto;
  el.addEventListener('click', ev => {
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    const f = ctx.fecha;
    switch (b.dataset.accion) {
      case 'grupo':
        grupo = b.dataset.grupo;
        consulta = '';
        render(el);
        break;
      case 'elegir': {
        const a = buscarAlimento(b.dataset.id);
        if (a) hojaAlimento(f, a);
        break;
      }
      case 'plan': hojaComidaPlan(f, b.dataset.comida); break;
      case 'rapido': hojaRapido(f); break;
      case 'crear': hojaCrearAlimento(f); break;
      case 'quitar': quitarEntrada(f, b.dataset.id); break;
    }
  });
  // Al escribir en el buscador solo se redibuja la lista (así no se cierra el teclado).
  el.addEventListener('input', ev => {
    if (ev.target.id !== 'buscar') return;
    consulta = ev.target.value;
    el.querySelector('#resultados').innerHTML = resultados();
    for (const c of el.querySelectorAll('.chips .chip')) c.classList.toggle('activo', !consulta && c.dataset.grupo === grupo);
  });
  // Recordar qué secciones de la guía están abiertas.
  el.addEventListener('toggle', ev => {
    const id = ev.target.dataset?.seccion;
    if (!id) return;
    if (ev.target.open) abiertos.add(id); else abiertos.delete(id);
  }, true);
}

export function render(el) {
  const f = ctx.fecha, d = dia(f), t = totales(d), m = metaEn(f);
  const entradas = [...d.comidas].sort((a, b) => a.t - b.t);
  el.innerHTML = `
    <div class="buscador">
      <input id="buscar" type="search" placeholder="Buscar alimento…" value="${esc(consulta)}" autocomplete="off" enterkeyhint="search" aria-label="Buscar alimento">
    </div>
    <div class="chips">${CHIPS.map(([id, nombre]) => `
      <button type="button" class="chip ${!consulta && id === grupo ? 'activo' : ''}" data-accion="grupo" data-grupo="${id}">${esc(nombre)}</button>`).join('')}
    </div>
    <div id="resultados" class="lista">${resultados()}</div>
    <div class="fila-botones">
      <button type="button" class="boton secundario" data-accion="rapido">Agregar rápido</button>
      <button type="button" class="boton secundario" data-accion="crear">Crear alimento</button>
    </div>

    <section class="tarjeta">
      <h2>Lo que llevas ${f === hoyISO() ? 'hoy' : 'ese día'}</h2>
      <p class="totales"><b>${fmt(t.kcal)}</b> / ${fmt(m.kcal)} kcal · P ${fmt(t.p)} g · C ${fmt(t.c)} g · G ${fmt(t.g)} g · Fibra ${fmt(t.f)} g</p>
      ${entradas.length ? entradas.map(filaEntrada).join('') : '<p class="vacio">Aún no registras nada este día.</p>'}
    </section>

    ${guia()}`;
}

function resultados() {
  const f = ctx.fecha;
  let lista;
  if (consulta.trim()) {
    lista = buscar([...ALIMENTOS, ...est().propios], consulta).slice(0, 40);
  } else if (grupo === 'plan') {
    return COMIDAS_PLAN.map(cm => {
      const hecha = entradaPlan(f, cm.id);
      const o = opcionPreferida(cm);
      return `
        <button type="button" class="fila-alimento ${hecha ? 'hecha' : ''}" data-accion="plan" data-comida="${cm.id}">
          <span>${esc(cm.nombre)}${hecha ? ' · anotada' : ''}</span>
          <small>${esc(cm.hora)} · ${fmt(o.kcal)} kcal · ${fmt(o.p)} g P</small>
          ${icono(hecha ? 'check' : 'mas')}
        </button>`;
    }).join('');
  } else if (grupo === 'recientes') {
    lista = recientes();
    if (!lista.length) return '<p class="vacio">Aquí aparecerán los alimentos que vayas agregando. Busca arriba o elige un grupo.</p>';
  } else if (grupo === 'propios') {
    lista = est().propios;
    if (!lista.length) return '<p class="vacio">Aún no tienes alimentos propios. Toca “Crear alimento” y copia la etiqueta (por ejemplo, tu barra de proteína).</p>';
  } else {
    lista = ALIMENTOS.filter(a => a.grupo === grupo);
  }
  if (!lista.length) return '<p class="vacio">Sin resultados. Prueba otra palabra o usa “Agregar rápido”.</p>';
  return lista.map(a => {
    const base = a.porcion ? `por ${a.porcion}` : `por 100 ${a.ml ? 'ml' : 'g'}`;
    return `
      <button type="button" class="fila-alimento" data-accion="elegir" data-id="${esc(a.id)}">
        <span>${esc(a.n)}</span>
        <small>${fmt(a.k)} kcal · ${fmt(a.p)} g P · ${esc(base)}${a.aprox ? ' · estimado' : ''}</small>
        ${icono('mas')}
      </button>`;
  }).join('');
}

function guia() {
  const seccion = (id, titulo, contenido) => `
    <details data-seccion="${id}" ${abiertos.has(id) ? 'open' : ''}><summary>${titulo}</summary><div class="detalle">${contenido}</div></details>`;
  const lista = items => `<ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return `
    <section class="tarjeta guia">
      <h2>Guía rápida</h2>
      ${seccion('intercambios', 'Intercambios', `
        <p class="nota">Cambia alimentos dentro del mismo grupo y el día sigue cuadrando.</p>
        ${INTERCAMBIOS.map(g => `
          <div class="intercambio"><b>${esc(g.grupo)}</b><span>${esc(g.base)} equivale a:</span>${lista(g.equivale)}</div>`).join('')}`)}
      ${seccion('mano', 'Regla de la mano', `<p>${esc(REGLA_MANO)}</p>`)}
      ${seccion('tec', 'Comer en el Tec', `
        ${COMER_FUERA.map(x => `
          <div class="fuera">
            <p><b>${esc(x.hoy)}</b><small>${esc(x.estimado)}</small></p>
            <p class="mejor">Pide mejor: ${esc(x.mejor)}</p>
          </div>`).join('')}
        <p class="nota">${esc(META_TAPER)} En “Comer fuera” tienes estos platillos ya calculados.</p>`)}
      ${seccion('cambios', 'Cambios frente a lo que comías', lista(CAMBIOS))}
      ${seccion('horarios', 'Horarios y variaciones', `${lista(HORARIOS)}<p class="nota">${esc(PESAR_COMIDA)}</p>`)}
    </section>`;
}
