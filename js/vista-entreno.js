// =====================================================================
// vista-entreno.js — Pantalla "Entreno": la rutina del día.
// ---------------------------------------------------------------------
// Arriba eliges la sesión (por omisión, la que toca ese día de la semana).
// Cada ejercicio muestra lo que pide el plan (series × reps, RIR,
// descanso), lo que hiciste la vez pasada y una sugerencia de carga.
// Tocas una serie, pones peso/reps/RIR con los botones − y +, y al
// guardar arranca el temporizador de descanso.
// =====================================================================

import { dia, diaEditable, guardar } from './almacen.js';
import { RUTINA, TECNICA } from './datos-plan.js';
import {
  sesionProgramada, seriesPrescritas, rirPrescrito, sugerencia, ultimoRegistro, seriesDe,
  semanaPlan, enDescarga, metaEn, e1rm, mejorSerie, rango, ejercicio, kg,
} from './calculos.js';
import { diaCorto, fechaCorta } from './fechas.js';
import { esc, num, icono, abrirHoja, aviso, barra } from './ui.js';
import { editarMedida } from './registro.js';
import { iniciarTemporizador } from './temporizador.js';

let ctx;
const elegida = {};            // sesión elegida a mano para una fecha (antes de anotar series)
let candado = null;            // "wake lock": mantiene la pantalla encendida
let quiereCandado = false;

export function iniciar(el, contexto) {
  ctx = contexto;
  el.addEventListener('click', ev => {
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    const f = ctx.fecha;
    switch (b.dataset.accion) {
      case 'sesion': elegirSesion(f, b.dataset.sesion); break;
      case 'serie': hojaSerie(f, b.dataset.ej, Number(b.dataset.i)); break;
      case 'info': hojaInfo(f, b.dataset.ej); break;
      case 'caminata': editarMedida(f, 'caminata'); break;
      case 'pantalla': alternarPantalla(); break;
    }
  });
  // Las notas se guardan al salir del cuadro de texto.
  el.addEventListener('change', ev => {
    if (ev.target.id !== 'notas-entreno') return;
    const d = diaEditable(ctx.fecha);
    d.entreno ||= { sesion: sesionActual(ctx.fecha), series: {} };
    d.entreno.notas = ev.target.value;
    guardar();
    aviso('Notas guardadas');
  });
  // Al volver a la app, iOS suelta el "wake lock": se pide otra vez.
  document.addEventListener('visibilitychange', () => {
    if (quiereCandado && document.visibilityState === 'visible' && !candado) pedirCandado();
  });
}

const sesionActual = f => dia(f).entreno?.sesion || elegida[f] || sesionProgramada(f);

function elegirSesion(f, id) {
  const d = dia(f);
  if (d.entreno) {
    const hay = Object.values(d.entreno.series || {}).some(a => a?.some(s => s?.reps));
    if (hay && d.entreno.sesion !== id &&
        !confirm(`Ya anotaste series de ${RUTINA[d.entreno.sesion]?.nombre}. ¿Cambiar a ${RUTINA[id].nombre}? (Las series no se borran.)`)) return;
    diaEditable(f).entreno.sesion = id;
    guardar();
  } else {
    elegida[f] = id;
  }
  ctx.refrescar();
}

export function render(el) {
  const f = ctx.fecha;
  const id = sesionActual(f), programada = sesionProgramada(f);
  const chips = Object.entries(RUTINA).map(([k, s]) => `
    <button type="button" class="chip ${k === id ? 'activo' : ''}" data-accion="sesion" data-sesion="${k}">
      ${esc(s.nombre)} <small>${esc(s.dia.slice(0, 3).toLowerCase())}</small>
    </button>`).join('');

  const avisos = [];
  if (semanaPlan(f) <= 1) avisos.push('Semana 1 = línea base: en cada básico sube en series de 3–5 reps hasta una a RIR 2. Esa es tu serie top real.');
  if (enDescarga(f)) avisos.push('Semana de descarga: mismas cargas, mitad de series, RIR 3–4.');
  const ajuste = metaEn(f).aislamiento || 0;
  if (ajuste < 0) avisos.push(`Ajuste vigente: ${ajuste} serie en cada aislamiento (la fuerza cayó 2 semanas seguidas).`);

  let cuerpo;
  if (!id) {
    cuerpo = `
      <section class="tarjeta">
        <h2>Descanso</h2>
        <p>Hoy (${esc(diaCorto(f))}) no toca pesas. Si moviste tu día, elige la sesión arriba.</p>
        ${fichaCaminata(f)}
      </section>`;
  } else {
    const s = RUTINA[id];
    const total = s.ejercicios.reduce((a, e) => a + seriesPrescritas(e, f), 0);
    const hechas = s.ejercicios.reduce((a, e) => a + Math.min(seriesDe(f, e.id).length, seriesPrescritas(e, f)), 0);
    const cambio = programada && programada !== id ? `Hoy tocaba ${RUTINA[programada].nombre}` : (!programada ? 'Sesión en día libre' : `${s.ejercicios.length} ejercicios · ${total} series`);
    cuerpo = `
      <section class="tarjeta">
        <div class="entreno-resumen">
          <div><b>${esc(s.dia)} · ${esc(s.nombre)}</b><small>${esc(cambio)}</small></div>
          <span class="progreso-num">${hechas}/${total}</span>
        </div>
        ${barra(hechas, total, 'acento')}
        ${'wakeLock' in navigator ? `
          <button type="button" class="enlace" data-accion="pantalla">
            ${candado ? 'Pantalla encendida durante el entreno: sí (tocar para quitar)' : 'Mantener la pantalla encendida'}
          </button>` : ''}
      </section>
      ${s.ejercicios.map(e => tarjetaEjercicio(e, f)).join('')}
      <section class="tarjeta">
        ${fichaCaminata(f)}
        <label class="campo" for="notas-entreno"><span>Notas de la sesión</span>
          <textarea id="notas-entreno" rows="2" placeholder="Cómo te sentiste, molestias, técnica…">${esc(dia(f).entreno?.notas || '')}</textarea>
        </label>
      </section>`;
  }

  el.innerHTML = `
    <div class="chips sesiones">${chips}</div>
    ${avisos.length ? `<section class="banner"><ul>${avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul></section>` : ''}
    ${cuerpo}`;

  // Que la sesión elegida se vea completa en la fila de chips (en el iPhone no caben las 4).
  const fila = el.querySelector('.chips'), activo = fila.querySelector('.activo');
  if (activo) fila.scrollLeft = activo.offsetLeft - (fila.clientWidth - activo.offsetWidth) / 2;
}

function fichaCaminata(f) {
  const min = dia(f).caminata;
  return `
    <button type="button" class="ficha ancha" data-accion="caminata">
      <span>Caminata</span><b>${min ? `${min} min` : '<em>Anotar</em>'}</b><small>45–60 min, 4 días por semana</small>
    </button>`;
}

function tarjetaEjercicio(ej, f) {
  const n = seriesPrescritas(ej, f);
  const rir = rirPrescrito(ej, f);
  const reg = dia(f).entreno?.series?.[ej.id] || [];
  const cuantas = Math.max(n, reg.length);
  const hechas = reg.filter(s => s?.reps).length;
  const sug = sugerencia(ej, f);

  const chips = Array.from({ length: cuantas }, (_, i) => {
    const s = reg[i];
    return s?.reps
      ? `<button type="button" class="serie hecha" data-accion="serie" data-ej="${ej.id}" data-i="${i}">
           <small>S${i + 1}</small><b>${kg(s.peso)}×${s.reps}</b><small>RIR ${s.rir}</small></button>`
      : `<button type="button" class="serie ${i >= n ? 'extra' : ''}" data-accion="serie" data-ej="${ej.id}" data-i="${i}">
           <small>S${i + 1}</small><b>—</b><small>anotar</small></button>`;
  }).join('') +
    `<button type="button" class="serie mas" data-accion="serie" data-ej="${ej.id}" data-i="${cuantas}" aria-label="Agregar serie extra">${icono('mas')}</button>`;

  const etiquetas = [
    ej.tipo === 'top' ? '<span class="etiqueta top">Serie top</span>' : '',
    ej.tipo === 'respaldo' ? '<span class="etiqueta">Respaldo −10 %</span>' : '',
    ej.nuevo ? '<span class="etiqueta">Nuevo</span>' : '',
    ej.aislamiento ? '<span class="etiqueta">Aislamiento</span>' : '',
  ].join('');

  // e1RM de la serie top (y la diferencia contra la vez pasada).
  let lineaE1rm = '';
  if (ej.tipo === 'top') {
    const m = mejorSerie(reg.filter(s => s?.reps));
    if (m?.peso) {
      const hoy = e1rm(m.peso, m.reps, m.rir);
      const u = ultimoRegistro(ej.id, f);
      const mu = u && mejorSerie(u.series);
      const antes = mu?.peso ? e1rm(mu.peso, mu.reps, mu.rir) : null;
      const dif = antes != null ? hoy - antes : null;
      lineaE1rm = `<p class="e1rm">e1RM de hoy: <b>${kg(hoy)} kg</b>${dif != null ? ` (${dif >= 0 ? '+' : '−'}${kg(Math.abs(dif))} kg vs la vez pasada)` : ''}</p>`;
    }
  }

  return `
    <article class="tarjeta ejercicio ${hechas >= n ? 'completo' : ''}">
      <header>
        <h3>${esc(ej.nombre)}</h3>
        ${ej.tecnica || ej.nota ? `<button type="button" class="icono-btn" data-accion="info" data-ej="${ej.id}" aria-label="Técnica y notas de ${esc(ej.nombre)}">${icono('info')}</button>` : ''}
      </header>
      ${etiquetas ? `<div class="etiquetas">${etiquetas}</div>` : ''}
      <p class="prescripcion">${n} × ${esc(ej.reps)} reps · RIR ${esc(rir)} · descanso ${esc(ej.descanso)}${n !== ej.series ? ` <small>(en el plan: ${ej.series})</small>` : ''}</p>
      ${sug?.texto ? `<p class="sugerencia">${esc(sug.texto)}</p>` : ''}
      <div class="series">${chips}</div>
      ${lineaE1rm}
    </article>`;
}

// ---------------------------------------------------------------- hoja de una serie

function hojaSerie(f, idEj, i) {
  const ej = ejercicio(idEj);
  const n = seriesPrescritas(ej, f);
  const rirTxt = rirPrescrito(ej, f);
  const reg = dia(f).entreno?.series?.[idEj] || [];
  const actual = reg[i]?.reps ? reg[i] : null;
  const [repMin, repMax] = rango(ej.reps);
  const [rirMin] = rango(rirTxt);
  const sug = sugerencia(ej, f);
  const previaHoy = reg.slice(0, i).reverse().find(s => s?.reps);
  const ult = ultimoRegistro(idEj, f);
  const ultI = ult ? (ult.series[i] || ult.series.at(-1)) : null;
  const repsDefecto = ej.tipo === 'top' ? repMax : repMin;

  // Valores con que arranca la hoja: lo ya anotado → la serie anterior de hoy →
  // la sugerencia → lo de la vez pasada → vacío.
  const inicio = actual || previaHoy
    || (sug?.peso != null ? { peso: sug.peso, reps: ultI?.reps ?? repsDefecto, rir: rirMin } : null)
    || ultI || { peso: '', reps: repsDefecto, rir: rirMin };

  const paso = (id, etiqueta, valor, delta) => `
    <div class="campo"><span>${etiqueta}</span>
      <div class="paso">
        <button type="button" data-paso="${id}" data-d="${-delta}" aria-label="Menos">${icono('menos')}</button>
        <input id="hs-${id}" type="text" inputmode="decimal" autocomplete="off" value="${valor ?? ''}" aria-label="${etiqueta}">
        <button type="button" data-paso="${id}" data-d="${delta}" aria-label="Más">${icono('mas')}</button>
      </div>
    </div>`;

  const html = `
    <p class="sub">Serie ${i + 1}${i < n ? ` de ${n}` : ' (extra)'} · meta ${esc(ej.reps)} reps a RIR ${esc(rirTxt)}</p>
    ${paso('peso', 'Peso (kg)', inicio.peso, 2.5)}
    ${paso('reps', 'Repeticiones', inicio.reps, 1)}
    ${paso('rir', 'RIR (reps que te quedaban)', inicio.rir, 1)}
    <p class="e1rm" id="hs-e1rm"></p>
    ${sug?.texto ? `<p class="nota">${esc(sug.texto)}</p>` : ''}
    ${ej.nota ? `<p class="nota">${esc(ej.nota)}</p>` : ''}`;

  const botones = [];
  if (actual) botones.push({ texto: 'Borrar serie', clase: 'secundario', alTocar: () => {
    const arr = diaEditable(f).entreno.series[idEj];
    arr[i] = null;
    while (arr.length && !arr.at(-1)) arr.pop();
    guardar();
    ctx.refrescar();
  } });
  botones.push({ texto: `Guardar · descanso ${ej.descanso}`, clase: 'principal', alTocar: dlg => {
    const leer = id => num(dlg.querySelector(`#hs-${id}`).value);
    const peso = leer('peso'), reps = leer('reps'), rir = leer('rir');
    if (peso == null || peso < 0 || peso > 500) { aviso('Revisa el peso (pon 0 si fue sin peso).'); return false; }
    if (!reps || reps < 1 || reps > 100) { aviso('Revisa las repeticiones.'); return false; }
    if (rir == null || rir < 0 || rir > 10) { aviso('Revisa el RIR (de 0 a 10).'); return false; }
    const d = diaEditable(f);
    d.entreno ||= { sesion: sesionActual(f), series: {} };
    d.entreno.sesion ||= sesionActual(f);
    d.entreno.series ||= {};
    const arr = d.entreno.series[idEj] ||= [];
    arr[i] = { peso: Math.round(peso * 100) / 100, reps: Math.round(reps), rir: Math.round(rir) };
    for (let k = 0; k < arr.length; k++) if (arr[k] === undefined) arr[k] = null;
    guardar();
    iniciarTemporizador(ej.seg, `Descanso · ${ej.nombre}`);
    ctx.refrescar();
  } });

  abrirHoja({
    titulo: ej.nombre, html, botones,
    alMontar: dlg => {
      const cuerpo = dlg.querySelector('.hoja-cuerpo');
      const pintarE1rm = () => {
        const p = num(cuerpo.querySelector('#hs-peso').value), r = num(cuerpo.querySelector('#hs-reps').value), x = num(cuerpo.querySelector('#hs-rir').value);
        cuerpo.querySelector('#hs-e1rm').innerHTML = p && r ? `e1RM ≈ <b>${kg(e1rm(p, r, x || 0))} kg</b>` : '';
      };
      cuerpo.addEventListener('click', ev => {
        const b = ev.target.closest('[data-paso]');
        if (!b) return;
        const campo = cuerpo.querySelector(`#hs-${b.dataset.paso}`);
        const nuevo = Math.max(0, (num(campo.value) || 0) + Number(b.dataset.d));
        campo.value = Math.round(nuevo * 100) / 100;
        pintarE1rm();
      });
      cuerpo.addEventListener('input', pintarE1rm);
      pintarE1rm();
    },
  });
}

// ---------------------------------------------------------------- técnica e historial

function hojaInfo(f, idEj) {
  const ej = ejercicio(idEj);
  const tec = ej.tecnica ? TECNICA[ej.tecnica] : null;
  // Las últimas 5 sesiones de este ejercicio.
  const historial = [];
  let antes = f;
  for (let k = 0; k < 5; k++) {
    const u = ultimoRegistro(idEj, antes);
    if (!u) break;
    historial.push(u);
    antes = u.fecha;
  }
  abrirHoja({
    titulo: ej.nombre,
    html: `
      ${tec ? `<h3 class="subtitulo">Técnica</h3><p>${esc(tec.texto)}</p>` : ''}
      ${ej.nota ? `<p class="nota">${esc(ej.nota)}</p>` : ''}
      <h3 class="subtitulo">Últimas sesiones</h3>
      ${historial.length ? `<ul class="historial">${historial.map(u => `
        <li><b>${esc(diaCorto(u.fecha))} ${esc(fechaCorta(u.fecha))}</b> ${u.series.map(s => `${kg(s.peso)}×${s.reps} @${s.rir}`).join(' · ')}</li>`).join('')}</ul>`
        : '<p class="vacio">Todavía no hay registros de este ejercicio.</p>'}`,
  });
}

// ---------------------------------------------------------------- pantalla encendida

async function pedirCandado() {
  try {
    candado = await navigator.wakeLock.request('screen');
    candado.addEventListener('release', () => {
      candado = null;
      if (ctx.vista === 'entreno') ctx.refrescar();
    });
  } catch {
    quiereCandado = false;
    aviso('Este teléfono no dejó mantener la pantalla encendida.');
  }
  ctx.refrescar();
}

async function alternarPantalla() {
  if (candado) {
    quiereCandado = false;
    await candado.release();
    candado = null;
    ctx.refrescar();
  } else {
    quiereCandado = true;
    await pedirCandado();
  }
}
