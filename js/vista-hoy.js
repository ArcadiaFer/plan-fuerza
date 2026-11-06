// =====================================================================
// vista-hoy.js — Pantalla "Hoy": el tablero del día.
// ---------------------------------------------------------------------
// 1. Fase y semana del plan, con avisos del día (descarga, revisión…).
// 2. Calorías y macros contra tu meta.
// 3. Las 4 comidas del plan: un toque en el círculo y quedan anotadas.
// 4. Medidas: peso, cintura, sueño, pasos y agua.
// 5. Hábitos: creatina, café antes de 13:00, táper y caminata.
// 6. El entreno que toca hoy.
// =====================================================================

import { dia } from './almacen.js';
import { COMIDAS_PLAN, OBJETIVOS, RUTINA, PLAN } from './datos-plan.js';
import {
  totales, metaEn, estadoKcal, semanaPlan, faseEn, eventosEn, sesionProgramada, pesoProm7,
  contarSemana, proximaRevision, seriesPrescritas, seriesDe, enDescarga, kg,
} from './calculos.js';
import { diaSemana, diasEntre } from './fechas.js';
import { esc, fmt, icono, barra } from './ui.js';
import {
  alternarComidaPlan, hojaComidaPlan, opcionPreferida, quitarEntrada, filaEntrada,
  editarMedida, sumarAgua, alternarHabito,
} from './registro.js';

let ctx;

export function iniciar(el, contexto) {
  ctx = contexto;
  // Un solo "escuchador" para toda la pantalla: cada botón dice qué hacer en data-accion.
  el.addEventListener('click', ev => {
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    const f = ctx.fecha;
    switch (b.dataset.accion) {
      case 'toggle-comida': alternarComidaPlan(f, b.dataset.comida); break;
      case 'ver-comida': hojaComidaPlan(f, b.dataset.comida); break;
      case 'quitar': quitarEntrada(f, b.dataset.id); break;
      case 'agregar': ctx.irA('comida'); break;
      case 'medida': editarMedida(f, b.dataset.campo); break;
      case 'agua': sumarAgua(f, Number(b.dataset.ml)); break;
      case 'habito': alternarHabito(f, b.dataset.habito); break;
      case 'entreno': ctx.irA('entreno'); break;
      case 'cerrar-tip':
        localStorage.setItem('plan-fuerza:tip-instalar', '1');
        ctx.refrescar();
        break;
    }
  });
}

export function render(el) {
  const f = ctx.fecha, d = dia(f);
  el.innerHTML = [
    tipInstalar(),
    bannerFase(f, d),
    tarjetaCalorias(totales(d), metaEn(f)),
    tarjetaComidas(d),
    tarjetaMedidas(f, d),
    tarjetaHabitos(f, d),
    tarjetaEntreno(f, d),
  ].join('');
}

// ---------------------------------------------------------------- 0. instalar

// Solo Safari de iPhone/iPad tiene navigator.standalone: si es false, la app
// se abrió en el navegador y no desde la pantalla de inicio.
function tipInstalar() {
  if (!('standalone' in navigator) || navigator.standalone || localStorage.getItem('plan-fuerza:tip-instalar')) return '';
  return `
    <section class="tip">
      <p><b>Instálala:</b> toca Compartir y luego “Agregar a inicio”. Así abre a pantalla completa y funciona sin internet.</p>
      <button type="button" class="icono-btn" data-accion="cerrar-tip" aria-label="Cerrar">${icono('x')}</button>
    </section>`;
}

// ---------------------------------------------------------------- 1. fase

function bannerFase(f, d) {
  const fase = faseEn(f);
  let titulo, texto;
  if (f < PLAN.inicio) {
    const faltan = diasEntre(f, PLAN.inicio);
    titulo = 'Línea base';
    texto = `El plan arranca el lunes 9 nov (${faltan === 1 ? 'mañana' : `faltan ${faltan} días`}). Pésate en ayunas y mide tu cintura.`;
  } else if (!fase) {
    titulo = 'Plan completado';
    texto = 'Terminaron las 18 semanas: toca reevaluar metas con tus números.';
  } else {
    titulo = `${fase.nombre} · semana ${semanaPlan(f)} de ${PLAN.semanas}`;
    texto = fase.resumen;
  }
  const avisos = eventosEn(f).map(e => e.texto);
  if (diaSemana(f) === 0) {
    if (d.cintura == null) avisos.push('Domingo: mide tu cintura en ayunas, a la altura del ombligo.');
    avisos.push('Domingo: súper y meal prep de 90 min (están en Plan).');
  }
  const rev = proximaRevision(f);
  if (rev?.fecha === f) avisos.push(`Hoy es la ${rev.nombre}: revisa tus números en Progreso.`);
  return `
    <section class="banner">
      <h2>${esc(titulo)}</h2>
      <p>${esc(texto)}</p>
      ${avisos.length ? `<ul>${avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    </section>`;
}

// ---------------------------------------------------------------- 2. calorías

function tarjetaCalorias(t, m) {
  const estado = estadoKcal(t.kcal, m.kcal);
  const circ = 2 * Math.PI * 52;                         // largo del círculo (radio 52)
  const pct = Math.max(0, Math.min(1, t.kcal / m.kcal));
  const resta = Math.round(m.kcal - t.kcal);
  const textoResta = resta >= 0 ? `Faltan <b>${fmt(resta)}</b> kcal` : `Te pasaste <b>${fmt(-resta)}</b> kcal`;

  let cumplimiento = '';
  if (t.kcal > 0) {
    const pMin = OBJETIVOS.proteinaMinima;
    const okKcal = Math.abs(t.kcal - m.kcal) <= m.kcal * OBJETIVOS.adherenciaPct;
    const okProt = t.p >= pMin;
    const pendientes = [];
    if (!okProt) pendientes.push(`faltan ${fmt(pMin - t.p)} g de proteína para el mínimo de ${pMin} g`);
    if (!okKcal) pendientes.push(t.kcal < m.kcal ? 'calorías aún debajo del rango (±10 %)' : 'calorías arriba del rango (±10 %)');
    cumplimiento = pendientes.length
      ? `<p class="estado">Para cumplir el día: ${pendientes.join('; ')}.</p>`
      : `<p class="estado bien">${icono('check')} Día dentro de meta (±10 % de calorías y ≥${pMin} g de proteína)</p>`;
  }

  const macro = (nombre, clase, valor, meta, textoMeta) => `
    <div class="macro">
      <div class="macro-fila"><span><i class="punto ${clase}"></i>${nombre}</span><span><b>${fmt(valor)}</b> / ${textoMeta}</span></div>
      ${barra(valor, meta, clase)}
    </div>`;

  return `
    <section class="tarjeta">
      <div class="calorias">
        <div class="anillo ${estado}">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="pista" cx="60" cy="60" r="52"/>
            ${pct > 0 ? `<circle class="avance" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"
                    stroke-dasharray="${(circ * pct).toFixed(1)} ${circ.toFixed(1)}"/>` : ''}
          </svg>
          <div class="anillo-texto"><b>${fmt(t.kcal)}</b><span>de ${fmt(m.kcal)} kcal</span></div>
        </div>
        <div class="macros">
          ${macro('Proteína', 'proteina', t.p, m.p, `${fmt(m.p)} g`)}
          ${macro('Carbos', 'carbos', t.c, m.c, `${fmt(m.c)} g`)}
          ${macro('Grasa', 'grasa', t.g, m.gMax, `${m.gMin}–${m.gMax} g`)}
          ${macro('Fibra', 'fibra', t.f, OBJETIVOS.fibra[0], `${OBJETIVOS.fibra[0]}–${OBJETIVOS.fibra[1]} g`)}
        </div>
      </div>
      <p class="cal-resta">${textoResta} <small>(ideal ±${OBJETIVOS.toleranciaKcal})</small></p>
      ${cumplimiento}
    </section>`;
}

// ---------------------------------------------------------------- 3. comidas

function tarjetaComidas(d) {
  const filas = COMIDAS_PLAN.map(cm => {
    const e = d.comidas.find(x => x.plan === cm.id);
    const o = e ? (cm.opciones.find(x => x.id === e.opcion) || cm.opciones[0]) : opcionPreferida(cm);
    const kcal = e ? e.kcal : o.kcal, p = e ? e.p : o.p;
    const variante = cm.opciones.length > 1 && o.id !== 'base' ? `${o.nombre} · ` : '';
    const porcion = e && e.factor !== 1 ? ` · ×${e.factor}` : '';
    return `
      <div class="comida-plan ${e ? 'hecha' : ''}">
        <button type="button" class="check" data-accion="toggle-comida" data-comida="${cm.id}"
                aria-pressed="${e ? 'true' : 'false'}" aria-label="${e ? 'Desmarcar' : 'Marcar'} ${esc(cm.nombre)}">${icono('check')}</button>
        <button type="button" class="comida-info" data-accion="ver-comida" data-comida="${cm.id}">
          <span class="comida-tit">${esc(cm.nombre)} <small>${esc(cm.hora)}</small></span>
          <span class="comida-det">${esc(variante)}${fmt(kcal)} kcal · ${fmt(p)} g proteína${porcion}</span>
        </button>
      </div>`;
  }).join('');
  const otros = d.comidas.filter(x => !x.plan);
  return `
    <section class="tarjeta">
      <h2>Comidas del plan</h2>
      ${filas}
      ${otros.length ? `<h3 class="subtitulo">Otros alimentos</h3>${otros.map(filaEntrada).join('')}` : ''}
      <button type="button" class="boton secundario ancho" data-accion="agregar">${icono('mas')} Agregar otro alimento</button>
    </section>`;
}

// ---------------------------------------------------------------- 4. medidas

function tarjetaMedidas(f, d) {
  const prom = pesoProm7(f);
  const domingo = diaSemana(f) === 0;
  const ficha = (campo, nombre, valor, sub, resaltar = false) => `
    <button type="button" class="ficha ${resaltar ? 'resaltar' : ''}" data-accion="medida" data-campo="${campo}">
      <span>${nombre}</span><b>${valor ?? '<em>Anotar</em>'}</b><small>${esc(sub)}</small>
    </button>`;
  const agua = d.agua || 0;
  const litros = (agua / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 });
  return `
    <section class="tarjeta">
      <h2>Registro del día</h2>
      <div class="mosaico">
        ${ficha('peso', 'Peso', d.peso != null ? `${kg(d.peso)} kg` : null, prom != null ? `promedio 7 días: ${kg(prom)}` : 'en ayunas')}
        ${ficha('cintura', 'Cintura', d.cintura != null ? `${kg(d.cintura)} cm` : null, domingo ? 'hoy toca medir' : 'los domingos', domingo && d.cintura == null)}
        ${ficha('sueno', 'Sueño', d.sueno != null ? `${fmt(d.sueno, 1)} h` : null, 'meta 7.5–8 h')}
        ${ficha('pasos', 'Pasos', d.pasos != null ? fmt(d.pasos) : null, 'meta 9,000–11,000')}
      </div>
      <div class="agua">
        <button type="button" class="agua-info" data-accion="medida" data-campo="agua">
          <span>Agua</span><b>${litros} <small>/ 3 L</small></b>
          ${barra(agua, OBJETIVOS.aguaMl, 'agua')}
        </button>
        <button type="button" class="boton-agua" data-accion="agua" data-ml="250" aria-label="Sumar 250 ml de agua">${icono('agua')}+250 ml</button>
      </div>
    </section>`;
}

// ---------------------------------------------------------------- 5. hábitos

function tarjetaHabitos(f, d) {
  const h = d.habitos || {};
  const ds = diaSemana(f);
  const entreSemana = ds >= 1 && ds <= 5;
  const taperes = contarSemana(f, x => x.habitos?.taper);
  const caminatas = contarSemana(f, x => (x.caminata || 0) > 0);
  const chip = (id, texto) => `
    <button type="button" class="habito ${h[id] ? 'hecho' : ''}" data-accion="habito" data-habito="${id}" aria-pressed="${h[id] ? 'true' : 'false'}">
      ${icono('check')}<span>${texto}</span>
    </button>`;
  return `
    <section class="tarjeta">
      <h2>Hábitos</h2>
      <div class="habitos">
        ${chip('creatina', 'Creatina 3–5 g')}
        ${chip('cafe', 'Último café antes de 13:00')}
        ${entreSemana ? chip('taper', 'Comí de táper') : ''}
      </div>
      <button type="button" class="ficha ancha" data-accion="medida" data-campo="caminata">
        <span>Caminata</span><b>${d.caminata ? `${d.caminata} min` : '<em>Anotar</em>'}</b>
        <small>esta semana: ${caminatas} de 4 días</small>
      </button>
      <p class="nota">Táper esta semana: ${taperes} (meta: 4 de 5 días entre semana).</p>
    </section>`;
}

// ---------------------------------------------------------------- 6. entreno

function tarjetaEntreno(f, d) {
  const id = d.entreno?.sesion || sesionProgramada(f);
  if (!id) {
    return `
      <section class="tarjeta">
        <h2>Entreno</h2>
        <p>Hoy no toca pesas. Si te falta, camina 45–60 min (4 días por semana).</p>
        <button type="button" class="boton secundario ancho" data-accion="entreno">Ver rutina</button>
      </section>`;
  }
  const s = RUTINA[id];
  const total = s.ejercicios.reduce((a, e) => a + seriesPrescritas(e, f), 0);
  const hechas = s.ejercicios.reduce((a, e) => a + Math.min(seriesDe(f, e.id).length, seriesPrescritas(e, f)), 0);
  return `
    <section class="tarjeta">
      <h2>Entreno</h2>
      <div class="entreno-resumen">
        <div><b>${esc(s.dia)} · ${esc(s.nombre)}</b><small>${s.ejercicios.length} ejercicios · ${total} series${enDescarga(f) ? ' (descarga)' : ''}</small></div>
        <span class="progreso-num">${hechas}/${total}</span>
      </div>
      ${barra(hechas, total, 'acento')}
      <button type="button" class="boton principal ancho" data-accion="entreno">${hechas ? 'Seguir entrenando' : 'Empezar entreno'}</button>
    </section>`;
}
