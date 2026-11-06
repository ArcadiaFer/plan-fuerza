// =====================================================================
// vista-plan.js — Pantalla "Plan": todo el PDF a la mano + tus datos.
// ---------------------------------------------------------------------
// Metas vigentes, lista del súper y meal prep (con palomitas), día tipo,
// rutina, progresión, técnica, suplementos, seguimiento, fiestas,
// fundamento y glosario. Al final: respaldo, restaurar y borrar datos.
// =====================================================================

import {
  est, guardar, ponerMeta, textoRespaldo, marcarRespaldo, leerRespaldo, reemplazarDatos, borrarTodo,
} from './almacen.js';
import {
  RESUMEN, OBJETIVOS, COMIDAS_PLAN, LISTA_SUPER, MEAL_PREP, RUTINA, RUTINA_INTRO, PROGRESION, TECNICA,
  TECNICA_INTRO, QUE_CAMBIO, SUPLEMENTOS, KPIS, FORMULA_E1RM, REGLAS_PDCA, NOTA_SEMANA1, RECUPERACION,
  FIESTAS, FUNDAMENTO, GLOSARIO, PESAR_COMIDA,
} from './datos-plan.js';
import { metaEn } from './calculos.js';
import { hoyISO, aISO, fechaCorta, diasEntre } from './fechas.js';
import { esc, fmt, num, abrirHoja, aviso, campoNumero } from './ui.js';
import { hojaBase } from './registro.js';

let ctx;
const abiertos = new Set();

export function iniciar(el, contexto) {
  ctx = contexto;
  el.addEventListener('click', ev => {
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    switch (b.dataset.accion) {
      case 'metas': hojaMetas(); break;
      case 'base': hojaBase(); break;
      case 'reiniciar-super': est().superLista = {}; guardar(); ctx.refrescar(); break;
      case 'reiniciar-prep': est().prep = {}; guardar(); ctx.refrescar(); break;
      case 'exportar': exportar(); break;
      case 'importar': el.querySelector('#archivo-respaldo').click(); break;
      case 'borrar': borrar(); break;
    }
  });
  el.addEventListener('change', ev => {
    const t = ev.target;
    if (t.dataset.super) {
      est().superLista[t.dataset.super] = t.checked;
      guardar();
      const marcados = LISTA_SUPER.filter(x => est().superLista[x.id]).length;
      el.querySelector('#cuenta-super').textContent = `${marcados}/${LISTA_SUPER.length}`;
    } else if (t.dataset.prep) {
      est().prep[t.dataset.prep] = t.checked;
      guardar();
    } else if (t.id === 'archivo-respaldo') {
      importar(t.files[0]);
      t.value = '';
    }
  });
  el.addEventListener('toggle', ev => {
    const id = ev.target.dataset?.seccion;
    if (!id) return;
    if (ev.target.open) abiertos.add(id); else abiertos.delete(id);
  }, true);
}

const seccion = (id, titulo, contenido) =>
  `<details data-seccion="${id}" ${abiertos.has(id) ? 'open' : ''}><summary>${titulo}</summary><div class="detalle">${contenido}</div></details>`;
const ul = items => `<ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
const ol = items => `<ol>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`;

export function render(el) {
  const m = metaEn(hoyISO());
  const marcados = LISTA_SUPER.filter(x => est().superLista[x.id]).length;
  const respaldo = est().ultimoRespaldo;
  const haceDias = respaldo ? diasEntre(aISO(new Date(respaldo)), hoyISO()) : null;

  el.innerHTML = `
    <section class="tarjeta">
      <h2>Mi plan</h2>
      <p>${esc(RESUMEN)}</p>
      <table class="tabla compacta metas-tabla"><tbody>
        <tr><th scope="row">Calorías</th><td>${fmt(m.kcal)} kcal (±${OBJETIVOS.toleranciaKcal})</td></tr>
        <tr><th scope="row">Proteína</th><td>${m.p} g (mínimo ${OBJETIVOS.proteinaMinima} g)</td></tr>
        <tr><th scope="row">Carbohidratos</th><td>${m.c} g</td></tr>
        <tr><th scope="row">Grasa</th><td>${m.gMin}–${m.gMax} g</td></tr>
        <tr><th scope="row">Fibra</th><td>30–40 g</td></tr>
        <tr><th scope="row">Agua</th><td>3 L</td></tr>
        <tr><th scope="row">Pasos</th><td>9,000–11,000</td></tr>
        <tr><th scope="row">Sueño</th><td>7.5–8 h</td></tr>
      </tbody></table>
      <button type="button" class="boton secundario ancho" data-accion="metas">Ajustar metas</button>
    </section>

    <section class="tarjeta guia">
      ${seccion('super', `Lista del súper <small id="cuenta-super">${marcados}/${LISTA_SUPER.length}</small>`, `
        <p class="nota">Cubre 7 días del día tipo con la cena rotada (3 de atún, 2 de pollo, 1 de res, 1 de huevo). Compra en un viaje y cocina el domingo.</p>
        ${LISTA_SUPER.map(x => `
          <label class="check-fila">
            <input type="checkbox" data-super="${x.id}" ${est().superLista[x.id] ? 'checked' : ''}>
            <span><b>${esc(x.producto)}</b> · ${esc(x.cantidad)}<small>${esc(x.nota)}</small></span>
          </label>`).join('')}
        <button type="button" class="enlace" data-accion="reiniciar-super">Desmarcar todo (nueva semana)</button>`)}

      ${seccion('prep', 'Meal prep del domingo (90 min)', `
        ${MEAL_PREP.map((paso, i) => `
          <label class="check-fila">
            <input type="checkbox" data-prep="${i}" ${est().prep[i] ? 'checked' : ''}>
            <span>${i + 1}. ${esc(paso)}</span>
          </label>`).join('')}
        <button type="button" class="enlace" data-accion="reiniciar-prep">Desmarcar todo</button>`)}

      ${seccion('dia', 'Día tipo', `
        <div class="tabla-scroll"><table class="tabla compacta">
          <thead><tr><th>Comida</th><th>kcal</th><th>P</th><th>C</th><th>G</th></tr></thead>
          <tbody>
            ${COMIDAS_PLAN.map(cm => { const o = cm.opciones[0]; return `
              <tr><th scope="row">${esc(cm.nombre)}<small>${esc(cm.hora)}</small></th><td>${fmt(o.kcal)}</td><td>${o.p}</td><td>${o.c}</td><td>${o.g}</td></tr>`; }).join('')}
            <tr class="total"><th scope="row">Total</th><td>2,217</td><td>180</td><td>237</td><td>63</td></tr>
          </tbody>
        </table></div>
        ${COMIDAS_PLAN.map(cm => `<p><b>${esc(cm.nombre)}:</b> ${esc(cm.opciones[0].detalle)}</p>`).join('')}
        <p class="nota">Cena: ${esc(COMIDAS_PLAN[3].nota)}</p>
        <p class="nota">${esc(PESAR_COMIDA)}</p>`)}

      ${seccion('rutina', 'Rutina semanal', `
        <p>${esc(RUTINA_INTRO)}</p>
        ${Object.values(RUTINA).map(s => `
          <h4>${esc(s.dia)} · ${esc(s.nombre)}</h4>
          <div class="tabla-scroll"><table class="tabla compacta">
            <thead><tr><th>Ejercicio</th><th>Series</th><th>Reps</th><th>RIR</th><th>Descanso</th></tr></thead>
            <tbody>${s.ejercicios.map(e => `
              <tr><th scope="row">${esc(e.nombre)}</th><td>${e.series}</td><td>${esc(e.reps)}</td><td>${esc(e.rir)}</td><td>${esc(e.descanso)}</td></tr>`).join('')}
            </tbody>
          </table></div>`).join('')}`)}

      ${seccion('progresion', 'Progresión de cargas', ol(PROGRESION))}

      ${seccion('tecnica', 'Notas de ejecución', `
        <p class="nota">${esc(TECNICA_INTRO)}</p>
        ${Object.values(TECNICA).map(t => `<p><b>${esc(t.nombre)}.</b> ${esc(t.texto)}</p>`).join('')}`)}

      ${seccion('cambio', 'Qué cambió en la rutina y por qué', ol(QUE_CAMBIO))}

      ${seccion('suplementos', 'Café, alcohol y suplementos', `
        <p class="nota">Dos ajustes importan: baja la creatina a 3–5 g y toma el último café antes de la 1 pm.</p>
        ${SUPLEMENTOS.map(s => `
          <div class="suplemento">
            <b>${esc(s.tema)}</b>
            <p><small>Antes:</small> ${esc(s.antes)}</p>
            <p><small>Ajuste:</small> ${esc(s.ajuste)}</p>
            <p class="nota">${esc(s.porque)}</p>
          </div>`).join('')}`)}

      ${seccion('seguimiento', 'Seguimiento y reglas de ajuste', `
        <p>Pésate a diario y decide cada 2 semanas con promedios, nunca con el dato de un día.</p>
        <div class="tabla-scroll"><table class="tabla compacta">
          <thead><tr><th>KPI</th><th>Cómo se mide</th><th>Meta</th></tr></thead>
          <tbody>${KPIS.map(k => `<tr><th scope="row">${esc(k.kpi)}</th><td>${esc(k.como)}</td><td>${esc(k.meta)}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="nota">${esc(FORMULA_E1RM)}</p>
        <h4>Reglas de ajuste cada 2 semanas</h4>
        <ul>${Object.entries(REGLAS_PDCA).filter(([id]) => id !== 'faltan').map(([, r]) => `<li><b>${esc(r.si)}</b> → ${esc(r.entonces)}</li>`).join('')}</ul>
        <p class="nota">${esc(NOTA_SEMANA1)}</p>`)}

      ${seccion('fiestas', 'Recuperación y fiestas', `
        <h4>Recuperación</h4>${ul(RECUPERACION)}
        <h4>Fiestas: 17 dic – 3 ene</h4>${ul(FIESTAS)}`)}

      ${seccion('porque', 'Por qué este plan', ul(FUNDAMENTO))}

      ${seccion('glosario', 'Glosario', `<dl class="glosario">${GLOSARIO.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`)}
    </section>

    <section class="tarjeta">
      <h2>Tus datos</h2>
      <p>Todo se guarda solo en este dispositivo; nada se sube a internet. Haz un respaldo cada semana (y úsalo para pasar tus datos al iPad).</p>
      <p class="nota">Último respaldo: ${respaldo ? `${fechaCorta(aISO(new Date(respaldo)))} (${haceDias === 0 ? 'hoy' : `hace ${haceDias} día${haceDias === 1 ? '' : 's'}`})` : 'nunca'}</p>
      <div class="fila-botones">
        <button type="button" class="boton principal" data-accion="exportar">Hacer respaldo</button>
        <button type="button" class="boton secundario" data-accion="importar">Restaurar</button>
      </div>
      <input type="file" id="archivo-respaldo" accept=".json,application/json" hidden>
      <button type="button" class="enlace" data-accion="base">Editar línea base (peso y cintura de arranque)</button>
      <button type="button" class="enlace peligro" data-accion="borrar">Borrar todos mis datos</button>
    </section>

    <section class="tarjeta">
      <h2>Instalar en el iPhone o iPad</h2>
      <ol>
        <li>Abre esta página en Safari.</li>
        <li>Toca Compartir (el cuadro con la flecha hacia arriba).</li>
        <li>Elige “Agregar a inicio”.</li>
      </ol>
      <p class="nota">Ya instalada abre a pantalla completa y funciona sin internet. Plan Fuerza · versión 1.</p>
    </section>`;
}

// ---------------------------------------------------------------- metas

function hojaMetas() {
  const hoy = hoyISO();
  const m = metaEn(hoy);
  abrirHoja({
    titulo: 'Ajustar metas',
    html: `
      <p class="nota">La meta nueva cuenta desde la fecha que elijas; los días anteriores se siguen midiendo con la que tenían. Las revisiones de Progreso lo hacen solas.</p>
      ${campoNumero({ id: 'mt-kcal', etiqueta: 'Calorías', valor: m.kcal, unidad: 'kcal', decimal: false })}
      <div class="campos-2">
        ${campoNumero({ id: 'mt-p', etiqueta: 'Proteína', valor: m.p, unidad: 'g', decimal: false })}
        ${campoNumero({ id: 'mt-c', etiqueta: 'Carbohidratos', valor: m.c, unidad: 'g', decimal: false })}
        ${campoNumero({ id: 'mt-gmin', etiqueta: 'Grasa mínima', valor: m.gMin, unidad: 'g', decimal: false })}
        ${campoNumero({ id: 'mt-gmax', etiqueta: 'Grasa máxima', valor: m.gMax, unidad: 'g', decimal: false })}
      </div>
      <label class="campo" for="mt-desde"><span>Desde</span>
        <span class="campo-entrada"><input id="mt-desde" type="date" value="${hoy}"></span></label>`,
    botones: [{ texto: 'Guardar', clase: 'principal', alTocar: dlg => {
      const v = id => num(dlg.querySelector(id).value);
      const kcal = v('#mt-kcal'), p = v('#mt-p'), c = v('#mt-c'), gMin = v('#mt-gmin'), gMax = v('#mt-gmax');
      const desde = dlg.querySelector('#mt-desde').value;
      if (!kcal || kcal < 1000 || kcal > 6000) { aviso('Revisa las calorías.'); return false; }
      if ([p, c, gMin, gMax].some(x => x == null || x < 0)) { aviso('Revisa los macros.'); return false; }
      if (gMin > gMax) { aviso('La grasa mínima no puede ser mayor que la máxima.'); return false; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) { aviso('Elige la fecha.'); return false; }
      ponerMeta({ ...metaEn(desde), desde, kcal, p, c, gMin, gMax, nota: 'Ajuste manual' });
      aviso('Metas guardadas');
      ctx.refrescar();
    } }],
  });
}

// ---------------------------------------------------------------- respaldo

// En el iPhone abre la hoja de compartir (Guardar en Archivos, OneDrive, AirDrop…);
// en la computadora, descarga el archivo.
function exportar() {
  const archivo = new File([textoRespaldo()], `plan-fuerza-${hoyISO()}.json`, { type: 'application/json' });
  if (navigator.canShare?.({ files: [archivo] })) {
    navigator.share({ files: [archivo], title: 'Respaldo de Plan Fuerza' })
      .then(() => { marcarRespaldo(); aviso('Respaldo listo'); ctx.refrescar(); })
      .catch(err => { if (err.name !== 'AbortError') descargar(archivo); });
  } else {
    descargar(archivo);
  }
}

function descargar(archivo) {
  const url = URL.createObjectURL(archivo);
  const a = Object.assign(document.createElement('a'), { href: url, download: archivo.name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  marcarRespaldo();
  aviso('Respaldo descargado');
  ctx.refrescar();
}

async function importar(archivo) {
  if (!archivo) return;
  try {
    const r = leerRespaldo(await archivo.text());
    const cuando = r.exportado ? new Date(r.exportado).toLocaleString('es-MX') : 'fecha desconocida';
    if (!confirm(`¿Reemplazar los datos de este dispositivo por el respaldo (${r.dias} días registrados, hecho el ${cuando})?`)) return;
    reemplazarDatos(r.datos);
    aviso('Respaldo restaurado');
    ctx.refrescar();
  } catch (error) {
    alert(error.message);
  }
}

function borrar() {
  if (!confirm('¿Borrar TODOS tus datos de este dispositivo? No se puede deshacer, salvo que tengas un respaldo.')) return;
  borrarTodo();
  aviso('Datos borrados');
  ctx.refrescar();
}
