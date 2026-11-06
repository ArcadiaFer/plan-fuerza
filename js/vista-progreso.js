// =====================================================================
// vista-progreso.js — Pantalla "Progreso": cómo vas contra el plan.
// ---------------------------------------------------------------------
// 1. Calendario de fases con la marca de "hoy".
// 2. Peso: promedio de 7 días, cambio semanal y gráfica.
// 3. Metas de resultado (16 dic y marzo) contra tu línea base.
// 4. Fuerza: e1RM de banca, sentadilla y peso muerto.
// 5. Revisión cada 2 semanas: la app evalúa las reglas del plan (PDCA)
//    y, si tú quieres, aplica el ajuste de calorías.
// 6. Cambio de fase (calorías de mantenimiento en fiestas y regreso).
// 7. Registro semanal (la tabla del PDF) e historial de metas.
// =====================================================================

import { est, guardar, ponerMeta } from './almacen.js';
import { PLAN, FASES, REVISIONES, BASICOS, META_BANCA, NOTA_SEMANA1, REGLAS_PDCA, FORMULA_E1RM } from './datos-plan.js';
import {
  semanaPlan, resumenSemana, evaluarRevision, pesoProm7, e1rmDelDia, metaEn, sugerenciaMantenimiento,
  metaRegresoDefinicion, avanceHitos, faseEn, proximaRevision, kg,
} from './calculos.js';
import { hoyISO, sumarDias, fechaCorta, diaCorto, diasEntre } from './fechas.js';
import { esc, fmt, icono, barra, aviso } from './ui.js';
import { dibujarGrafica } from './grafica.js';
import { hojaBase } from './registro.js';

let ctx;

const conSigno = x => x == null || isNaN(x) ? '—' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${kg(Math.abs(x))}`;

export function iniciar(el, contexto) {
  ctx = contexto;
  el.addEventListener('click', ev => {
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    switch (b.dataset.accion) {
      case 'base': hojaBase(); break;
      case 'decidir': decidir(Number(b.dataset.semana), b.dataset.opcion); break;
      case 'deshacer': deshacer(Number(b.dataset.semana)); break;
      case 'mantenimiento': aplicarMantenimiento(); break;
      case 'regreso': aplicarRegreso(); break;
    }
  });
}

export function render(el) {
  const hoy = hoyISO();
  el.innerHTML = [
    calendario(hoy),
    tarjetaPeso(hoy),
    tarjetaHitos(hoy),
    tarjetaFuerza(hoy),
    tarjetaRevision(hoy),
    tarjetaFases(hoy),
    tablaSemanal(hoy),
    historialMetas(),
  ].join('');
  dibujarGrafica(el.querySelector('#g-peso'), datosPeso(hoy));
  dibujarGrafica(el.querySelector('#g-fuerza'), datosFuerza(hoy));
}

// ---------------------------------------------------------------- 1. calendario

function calendario(hoy) {
  const ini = FASES[0].desde, fin = FASES.at(-1).hasta;
  const total = diasEntre(ini, fin) + 1;
  const pct = f => ((diasEntre(ini, f) / total) * 100).toFixed(2);
  const segmentos = FASES.map(fa => `
    <div class="seg ${fa.tipo}" style="left:${pct(fa.desde)}%;width:${(((diasEntre(fa.desde, fa.hasta) + 1) / total) * 100).toFixed(2)}%"></div>`).join('');
  const revisiones = REVISIONES.map(r => `<i class="rev" style="left:${pct(r.fecha)}%"></i>`).join('');
  const marcaHoy = hoy >= ini && hoy <= fin ? `<div class="marca-hoy" style="left:${pct(hoy)}%"><span>hoy</span></div>` : '';

  const fase = faseEn(hoy), sem = semanaPlan(hoy);
  let titulo;
  if (hoy < PLAN.inicio) titulo = `Línea base · el plan arranca en ${diasEntre(hoy, PLAN.inicio)} días`;
  else if (!fase) titulo = 'Plan completado: toca reevaluar';
  else titulo = `Semana ${sem} de ${PLAN.semanas} · ${fase.nombre}`;

  return `
    <section class="tarjeta">
      <h2>Calendario</h2>
      <p class="grande">${esc(titulo)}</p>
      <div class="linea-tiempo" aria-hidden="true">${segmentos}${revisiones}${marcaHoy}</div>
      <ul class="leyenda-fases">
        ${FASES.filter(f => f.tipo !== 'base').map(fa => `
          <li><i class="seg-mini ${fa.tipo}"></i><b>${esc(fa.nombre)}</b> ${fechaCorta(fa.desde)} – ${fechaCorta(fa.hasta)}</li>`).join('')}
        <li><i class="rev-mini"></i>Revisión cada 2 semanas</li>
      </ul>
    </section>`;
}

// ---------------------------------------------------------------- 2. peso

function tarjetaPeso(hoy) {
  const prom = pesoProm7(hoy);
  const anterior = pesoProm7(sumarDias(hoy, -7));
  const base = est().base.peso;
  return `
    <section class="tarjeta">
      <h2>Peso</h2>
      <div class="cifras">
        <div><span>Promedio 7 días</span><b>${prom != null ? `${kg(prom)} kg` : '—'}</b></div>
        <div><span>vs. semana pasada</span><b>${prom != null && anterior != null ? `${conSigno(prom - anterior)} kg` : '—'}</b></div>
        <div><span>Desde la base</span><b>${prom != null && base != null ? `${conSigno(prom - base)} kg` : '—'}</b></div>
      </div>
      <div class="grafica" id="g-peso"></div>
      <p class="nota">Meta: −0.4 a −0.7 kg por semana. Pésate a diario en ayunas y decide con promedios, nunca con el dato de un día.</p>
    </section>`;
}

function datosPeso(hoy) {
  const fechas = Object.keys(est().dias).filter(f => f <= hoy && est().dias[f].peso != null).sort();
  return {
    unidad: 'kg',
    vacio: 'Anota tu peso en “Hoy” para ver la gráfica.',
    series: [
      { nombre: 'Peso del día', color: 'var(--tinta-3)', tipo: 'puntos', puntos: fechas.map(f => [f, est().dias[f].peso]) },
      { nombre: 'Promedio 7 días', color: 'var(--serie-1)', tipo: 'linea', puntos: fechas.map(f => [f, Math.round(pesoProm7(f) * 10) / 10]) },
    ],
  };
}

// ---------------------------------------------------------------- 3. metas de resultado

function tarjetaHitos(hoy) {
  const base = est().base;
  if (base.peso == null && base.cintura == null) {
    return `
      <section class="tarjeta">
        <h2>Metas de resultado</h2>
        <p>Captura tu línea base (peso y cintura de arranque) para ver tus metas del 16 dic y de marzo en kilos y centímetros.</p>
        <button type="button" class="boton principal ancho" data-accion="base">Capturar línea base</button>
      </section>`;
  }
  const hitos = avanceHitos(hoy).map(h => {
    const cuando = hoy < h.fecha ? 'hoy' : `al ${fechaCorta(h.fecha)}`;
    return `
      <div class="hito">
        <p class="hito-tit"><b>${esc(h.nombre)}</b> <small>${fechaCorta(h.fecha)}</small></p>
        <div class="cifras">
          ${h.pesoMeta ? `<div><span>Peso prom. ${cuando}</span><b>${kg(h.pesoActual)} kg</b><small>meta ${kg(h.pesoMeta[0])}–${kg(h.pesoMeta[1])} kg</small></div>` : ''}
          ${h.cinturaMeta ? `<div><span>Cintura ${cuando}</span><b>${kg(h.cinturaActual)} cm</b><small>meta ${kg(h.cinturaMeta[0])}–${kg(h.cinturaMeta[1])} cm</small></div>` : ''}
        </div>
        <p class="nota">${esc(h.nota)}</p>
      </div>`;
  }).join('');
  return `
    <section class="tarjeta">
      <h2>Metas de resultado</h2>
      <p class="linea-base">Línea base: <b>${kg(base.peso)} kg</b> · <b>${kg(base.cintura)} cm</b>
        <button type="button" class="enlace" data-accion="base">Editar</button></p>
      ${hitos}
    </section>`;
}

// ---------------------------------------------------------------- 4. fuerza

function valoresFuerza(hoy, idTop) {
  return Object.keys(est().dias).filter(f => f <= hoy).sort()
    .map(f => [f, e1rmDelDia(f, idTop)])
    .filter(p => p[1] != null)
    .map(([f, v]) => [f, Math.round(v * 10) / 10]);
}

function tarjetaFuerza(hoy) {
  let mejorBanca = null;
  const filas = BASICOS.map(b => {
    const v = valoresFuerza(hoy, b.top).map(p => p[1]);
    const mejor = v.length ? Math.max(...v) : null;
    if (b.id === 'banca') mejorBanca = mejor;
    return `<tr><th scope="row">${esc(b.nombre)}</th><td>${kg(v.at(-1))}</td><td>${kg(mejor)}</td><td>${v.length > 1 ? conSigno(v.at(-1) - v[0]) : '—'}</td></tr>`;
  }).join('');
  return `
    <section class="tarjeta">
      <h2>Fuerza · e1RM de la serie top</h2>
      <div class="grafica" id="g-fuerza"></div>
      <table class="tabla compacta">
        <thead><tr><th></th><th>Último</th><th>Mejor</th><th>Cambio</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="meta-banca">
        <div class="macro-fila"><span>Banca: mejor e1RM vs. meta de ${META_BANCA.kg} kg</span><span><b>${kg(mejorBanca)}</b> / ${META_BANCA.kg}</span></div>
        ${barra(mejorBanca || 0, META_BANCA.kg, 'serie-1')}
        <p class="nota">${esc(META_BANCA.nota)} La meta es un 1RM real; el e1RM es un estimado. Si quieres probarlo: la semana del 14 dic, con alguien que te asista.</p>
      </div>
      <p class="nota">${esc(FORMULA_E1RM)}</p>
    </section>`;
}

function datosFuerza(hoy) {
  return {
    unidad: 'kg',
    leyenda: true,
    vacio: 'Anota tus series top en “Entreno” para ver tu e1RM.',
    series: BASICOS.map((b, i) => ({
      nombre: b.nombre, color: `var(--serie-${i + 1})`, tipo: 'linea', puntos: valoresFuerza(hoy, b.top),
    })),
  };
}

// ---------------------------------------------------------------- 5. revisión PDCA

function tarjetaRevision(hoy) {
  // Revisión pendiente: ya pasó su fecha (hace 14 días o menos) y no anotaste decisión.
  const pendiente = REVISIONES.filter(r => r.fecha <= hoy && !est().decisiones[r.semana] && diasEntre(r.fecha, hoy) <= 14).at(-1);
  const proxima = proximaRevision(sumarDias(hoy, 1));
  let cuerpo;
  if (pendiente) {
    const ev = evaluarRevision(pendiente.semana);
    cuerpo = `
      <div class="revision">
        <p class="grande">${esc(pendiente.nombre)} · ${esc(diaCorto(pendiente.fecha))} ${fechaCorta(pendiente.fecha)}</p>
        ${detalleEvaluacion(ev)}
        ${botonesDecision(pendiente, ev)}
      </div>`;
  } else if (proxima) {
    const faltan = diasEntre(hoy, proxima.fecha);
    cuerpo = `<p>Próxima: <b>${esc(proxima.nombre)}</b>, ${esc(diaCorto(proxima.fecha))} ${fechaCorta(proxima.fecha)} (en ${faltan} día${faltan === 1 ? '' : 's'}). Ese día la app evalúa tus 2 semanas con las reglas del plan.</p>`;
  } else {
    cuerpo = '<p>Ya no hay revisiones programadas: toca reevaluar el plan completo.</p>';
  }
  const pasadas = REVISIONES.filter(r => est().decisiones[r.semana]);
  const reglas = Object.entries(REGLAS_PDCA).filter(([id]) => id !== 'faltan')
    .map(([, r]) => `<li><b>${esc(r.si)}</b> → ${esc(r.entonces)}</li>`).join('');
  return `
    <section class="tarjeta">
      <h2>Revisión cada 2 semanas</h2>
      ${cuerpo}
      ${pasadas.length ? `
        <h3 class="subtitulo">Decisiones</h3>
        <ul class="decisiones">${pasadas.map(r => `
          <li><b>${esc(r.nombre)}</b> (${fechaCorta(r.fecha)}): ${esc(est().decisiones[r.semana].texto)}
            <button type="button" class="enlace" data-accion="deshacer" data-semana="${r.semana}">Deshacer</button></li>`).join('')}
        </ul>` : ''}
      <details><summary>Reglas de ajuste del plan</summary><div class="detalle"><ul>${reglas}</ul><p class="nota">${esc(NOTA_SEMANA1)}</p></div></details>
    </section>`;
}

function detalleEvaluacion(ev) {
  const ritmo = ev.ritmo == null ? 'faltan pesajes'
    : ev.ritmo >= 0 ? `bajaste ${kg(ev.ritmo)} kg/sem` : `subiste ${kg(-ev.ritmo)} kg/sem`;
  return `
    <ul class="kpis">
      <li><span>Adherencia</span><b>${ev.previa.adherencia}/7 y ${ev.actual.adherencia}/7 días</b>
        <small>meta 6 de 7 · días con comida anotada: ${ev.previa.conComida} y ${ev.actual.conComida}</small></li>
      <li><span>Ritmo</span><b>${ritmo}</b><small>meta 0.4–0.7 kg por semana · semana ${ev.ref} → ${ev.n}</small></li>
      <li><span>Fuerza</span><b>${ev.caidas.length ? `bajó 2 semanas seguidas en ${esc(ev.caidas.join(' y '))}` : 'se mantiene'}</b>
        <small>la regla se activa si baja en 2 o más básicos</small></li>
    </ul>
    <div class="decision">
      <small>Regla que aplica</small>
      <p><b>${esc(ev.si)}</b></p>
      <p>→ ${esc(ev.entonces)}</p>
    </div>
    ${ev.n === 2 ? `<p class="nota">${esc(NOTA_SEMANA1)}</p>` : ''}`;
}

function botonesDecision(rev, ev) {
  const b = [];
  if (ev.ajuste) {
    const partes = [`${ev.ajuste.kcal > 0 ? '+' : '−'}${Math.abs(ev.ajuste.kcal)} kcal`];
    if (ev.ajuste.aislamiento) partes.push('−1 serie en aislamientos');
    b.push(`<button type="button" class="boton principal" data-accion="decidir" data-semana="${rev.semana}" data-opcion="aplicar">Aplicar: ${partes.join(' y ')}</button>`);
  }
  if (ev.regla === 'lento') {
    b.push(`<button type="button" class="boton secundario" data-accion="decidir" data-semana="${rev.semana}" data-opcion="pasos">Mejor sumo 2,000 pasos</button>`);
  }
  b.push(`<button type="button" class="boton secundario" data-accion="decidir" data-semana="${rev.semana}" data-opcion="registrar">${ev.ajuste ? 'No cambiar nada' : 'Anotar decisión'}</button>`);
  return `<div class="fila-botones">${b.join('')}</div>`;
}

function decidir(semana, opcion) {
  const rev = REVISIONES.find(r => r.semana === semana);
  const ev = evaluarRevision(semana);
  const hoy = hoyISO();
  let texto = ev.entonces;
  if (opcion === 'aplicar' && ev.ajuste) {
    const manana = sumarDias(rev.fecha, 1);
    const desde = manana > hoy ? manana : hoy;
    const m = metaEn(desde);
    const nueva = {
      ...m, desde,
      kcal: m.kcal + (ev.ajuste.kcal || 0),
      c: m.c + (ev.ajuste.c || 0),
      aislamiento: (m.aislamiento || 0) + (ev.ajuste.aislamiento || 0),
      nota: `${rev.nombre}: ${ev.entonces}`,
    };
    ponerMeta(nueva);
    texto = `${ev.entonces} Nueva meta: ${fmt(nueva.kcal)} kcal desde el ${fechaCorta(desde)}.`;
  } else if (opcion === 'pasos') {
    texto = 'Sumar 2,000 pasos diarios (calorías sin cambio).';
  } else if (ev.ajuste) {
    texto = `Sin cambios (la regla sugería: ${ev.entonces})`;
  }
  est().decisiones[semana] = { texto, fecha: hoy };
  guardar();
  aviso('Decisión guardada');
  ctx.refrescar();
}

function deshacer(semana) {
  const rev = REVISIONES.find(r => r.semana === semana);
  if (!confirm(`¿Deshacer la decisión de la ${rev.nombre}? Si cambió tus calorías, se quita ese cambio.`)) return;
  delete est().decisiones[semana];
  const restantes = est().metas.filter(m => !(m.nota || '').startsWith(`${rev.nombre}:`));
  if (restantes.length) est().metas = restantes;
  guardar();
  ctx.refrescar();
}

// ---------------------------------------------------------------- 6. cambio de fase

function tarjetaFases(hoy) {
  const partes = [];
  if (hoy >= '2026-12-10' && hoy <= '2027-01-03') {
    const s = sugerenciaMantenimiento();
    const ya = est().metas.find(m => m.desde === '2026-12-17');
    partes.push(`
      <div class="cambio-fase">
        <p><b>Mantenimiento · 17 dic – 3 ene</b></p>
        ${s ? `<p>${fmt(s.base)} kcal + ${kg(Math.max(0, s.ritmo))} kg por semana × 1,100 ≈ <b>${fmt(s.kcal)} kcal</b>. Proteína mínimo 160 g.</p>`
            : '<p>Para calcularlo necesito tus pesajes de al menos 2 semanas del plan.</p>'}
        ${ya ? `<p class="estado bien">${icono('check')} Aplicado: ${fmt(ya.kcal)} kcal desde el 17 dic</p>`
             : s ? `<button type="button" class="boton principal" data-accion="mantenimiento">Aplicar ${fmt(s.kcal)} kcal desde el 17 dic</button>` : ''}
      </div>`);
  }
  if (hoy >= '2026-12-28' && hoy <= '2027-01-10') {
    const m = metaRegresoDefinicion();
    const ya = est().metas.find(x => x.desde === '2027-01-04');
    partes.push(`
      <div class="cambio-fase">
        <p><b>Regreso a definición · 4 ene</b></p>
        <p>Vuelves a tu meta de definición: <b>${fmt(m.kcal)} kcal</b>. Meta: no más de 1–1.5 kg sobre tu peso del 16 dic.</p>
        ${ya ? `<p class="estado bien">${icono('check')} Aplicado: ${fmt(ya.kcal)} kcal desde el 4 ene</p>`
             : `<button type="button" class="boton principal" data-accion="regreso">Aplicar ${fmt(m.kcal)} kcal desde el 4 ene</button>`}
      </div>`);
  }
  if (!partes.length) return '';
  return `<section class="tarjeta"><h2>Cambio de fase</h2>${partes.join('')}</section>`;
}

function aplicarMantenimiento() {
  const s = sugerenciaMantenimiento();
  if (!s) return;
  ponerMeta(s.meta);
  aviso(`Mantenimiento: ${fmt(s.kcal)} kcal desde el 17 dic`);
  ctx.refrescar();
}

function aplicarRegreso() {
  const m = metaRegresoDefinicion();
  ponerMeta(m);
  aviso(`Definición: ${fmt(m.kcal)} kcal desde el 4 ene`);
  ctx.refrescar();
}

// ---------------------------------------------------------------- 7. tablas

function tablaSemanal(hoy) {
  const ultima = Math.min(PLAN.semanas, semanaPlan(hoy));
  if (ultima < 0) return '';
  const filas = [];
  for (let n = ultima; n >= 0; n--) {
    const s = resumenSemana(n);
    const rev = REVISIONES.find(r => r.semana === n);
    const decision = est().decisiones[n]?.texto || (rev ? rev.nombre : n === 0 ? 'Línea base' : '');
    filas.push(`
      <tr>
        <th scope="row">${n === 0 ? 'Base' : n}<small>${fechaCorta(s.desde)}</small></th>
        <td>${kg(s.peso)}</td><td>${kg(s.cintura)}</td>
        ${BASICOS.map(b => `<td>${kg(s.fuerza[b.id])}</td>`).join('')}
        <td>${n === 0 ? '—' : `${s.adherencia}/7`}</td>
        <td>${s.sueno != null ? fmt(s.sueno, 1) : '—'}</td>
        <td class="decision">${esc(decision)}</td>
      </tr>`);
  }
  return `
    <section class="tarjeta">
      <h2>Registro semanal</h2>
      <div class="tabla-scroll">
        <table class="tabla">
          <thead><tr><th>Sem.</th><th>Peso prom.</th><th>Cintura</th><th>e1RM banca</th><th>e1RM sent.</th><th>e1RM PM</th><th>Adher.</th><th>Sueño</th><th>Decisión</th></tr></thead>
          <tbody>${filas.join('')}</tbody>
        </table>
      </div>
      <p class="nota">Peso, cintura y fuerza son indicadores de resultado; adherencia y sueño, de proceso. Desliza la tabla a los lados.</p>
    </section>`;
}

function historialMetas() {
  const metas = [...est().metas].sort((a, b) => b.desde.localeCompare(a.desde));
  return `
    <section class="tarjeta">
      <h2>Historial de metas</h2>
      <ul class="metas">${metas.map((m, i) => `
        <li><b>${fmt(m.kcal)} kcal</b> · P ${m.p} · C ${m.c} · G ${m.gMin}–${m.gMax}${m.aislamiento ? ` · aislamientos ${m.aislamiento}` : ''}
          <small>${i === metas.length - 1 ? 'desde el inicio' : `desde el ${fechaCorta(m.desde)}`} · ${esc(m.nota || '')}</small></li>`).join('')}
      </ul>
    </section>`;
}
