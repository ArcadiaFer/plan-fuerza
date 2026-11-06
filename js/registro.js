// =====================================================================
// registro.js — Acciones para anotar tu día (las usan varias pantallas).
// ---------------------------------------------------------------------
// - Comidas del plan: marcarlas con un toque o abrir su hoja para elegir
//   variante (la cena) y porción.
// - Alimentos sueltos: la hoja para capturar cantidad, "Agregar rápido"
//   y "Crear alimento" (tus alimentos propios).
// - Medidas del día: peso, cintura, agua, pasos, sueño y caminata.
// - Línea base: tu peso y cintura de arranque.
// Cada entrada de comida guarda sus calorías y macros ya calculadas, así
// tu historial no cambia aunque después se corrija la base de alimentos.
// =====================================================================

import { est, dia, diaEditable, guardar, nuevoId } from './almacen.js';
import { COMIDAS_PLAN, PESAR_COMIDA } from './datos-plan.js';
import { ALIMENTOS, unidades, calcular } from './alimentos.js';
import { contarSemana, kg, resumenSemana } from './calculos.js';
import { sumarDias, hoyISO } from './fechas.js';
import { esc, fmt, fmt1, num, icono, abrirHoja, aviso, campoNumero } from './ui.js';

// La app pone aquí la función que vuelve a dibujar la pantalla.
let alCambiar = () => {};
export const alGuardarRegistro = fn => { alCambiar = fn; };

function agregar(fecha, entrada) {
  diaEditable(fecha).comidas.push(entrada);
  guardar();
  alCambiar();
}

export function quitarEntrada(fecha, id) {
  const d = diaEditable(fecha);
  const i = d.comidas.findIndex(x => x.id === id);
  if (i < 0) return;
  const [quitada] = d.comidas.splice(i, 1);
  guardar();
  alCambiar();
  aviso(`Quitaste: ${quitada.nombre}`, {
    accion: 'Deshacer',
    alTocar: () => { diaEditable(fecha).comidas.splice(i, 0, quitada); guardar(); alCambiar(); },
  });
}

// Renglón de una entrada (en "Hoy" y en "Comida").
export function filaEntrada(x) {
  return `
    <div class="entrada">
      <div><b>${esc(x.nombre)}</b><small>${esc(x.detalle || '')}</small></div>
      <span class="entrada-num">${fmt(x.kcal)} kcal<small>${fmt(x.p)} g P</small></span>
      <button type="button" class="icono-btn" data-accion="quitar" data-id="${esc(x.id)}" aria-label="Quitar ${esc(x.nombre)}">${icono('x')}</button>
    </div>`;
}

export const previa = t => `
  <b>${fmt(t.kcal)} kcal</b><span>Proteína ${fmt1(t.p)} g</span><span>Carbos ${fmt1(t.c)} g</span>
  <span>Grasa ${fmt1(t.g)} g</span><span>Fibra ${fmt1(t.f)} g</span>`;

// ---------------------------------------------------------------- comidas del plan

export const comidaPlan = id => COMIDAS_PLAN.find(c => c.id === id);
export const entradaPlan = (fecha, idComida) => dia(fecha).comidas.find(x => x.plan === idComida);

// La variante que usaste la última vez (o la primera).
export function opcionPreferida(cm) {
  const id = est().preferencias[cm.id];
  return cm.opciones.find(o => o.id === id) || cm.opciones[0];
}

function entradaDePlan(cm, opcion, factor) {
  const r = n => Math.round(n * factor * 10) / 10;
  return {
    id: nuevoId(), t: Date.now(), plan: cm.id, opcion: opcion.id, factor,
    nombre: cm.opciones.length > 1 ? `${cm.nombre} · ${opcion.nombre}` : cm.nombre,
    detalle: factor === 1 ? 'Del plan' : `Del plan × ${factor}`,
    kcal: Math.round(opcion.kcal * factor), p: r(opcion.p), c: r(opcion.c), g: r(opcion.g), f: r(opcion.f),
  };
}

// Toque en el círculo: la marca (con la variante de siempre) o la desmarca.
export function alternarComidaPlan(fecha, idComida) {
  const ya = entradaPlan(fecha, idComida);
  if (ya) return quitarEntrada(fecha, ya.id);
  const cm = comidaPlan(idComida);
  agregar(fecha, entradaDePlan(cm, opcionPreferida(cm), 1));
}

// Hoja con el detalle de la comida: variante, porción y totales.
export function hojaComidaPlan(fecha, idComida) {
  const cm = comidaPlan(idComida);
  const ya = entradaPlan(fecha, idComida);
  let opcion = ya ? (cm.opciones.find(o => o.id === ya.opcion) || cm.opciones[0]) : opcionPreferida(cm);
  let factor = ya?.factor || 1;
  const atunes = cm.id === 'cena'
    ? contarSemana(fecha, d => d.comidas?.some(x => x.plan === 'cena' && x.opcion === 'atun')) : 0;

  const html = `
    <p class="sub">${esc(cm.hora)}</p>
    ${cm.opciones.length > 1 ? `<div class="opciones" role="radiogroup" aria-label="Variante">${cm.opciones.map(o => `
      <label class="opcion">
        <input type="radio" name="opcion" value="${o.id}" ${o.id === opcion.id ? 'checked' : ''}>
        <span><b>${esc(o.nombre)}</b><small>${fmt(o.kcal)} kcal · ${fmt(o.p)} g proteína</small></span>
      </label>`).join('')}</div>` : ''}
    <p class="detalle-comida" id="hc-detalle"></p>
    <div class="campo"><span>Porción</span>
      <div class="segmentos" id="hc-factor">${[0.5, 1, 1.5, 2].map(x => `
        <button type="button" data-f="${x}" class="${x === factor ? 'activo' : ''}">${x === 0.5 ? '½' : x === 1.5 ? '1½' : x}</button>`).join('')}
      </div>
    </div>
    <div class="vista-previa" id="hc-previa"></div>
    ${cm.nota ? `<p class="nota">${esc(cm.nota)}${cm.id === 'cena' ? ` Esta semana llevas ${atunes} de atún.` : ''}</p>` : ''}
    <p class="nota">${esc(PESAR_COMIDA)} Si cambiaste algo por otro alimento del mismo grupo (Intercambios), el total no cambia.</p>`;

  const botones = [];
  if (ya) botones.push({ texto: 'Quitar', clase: 'secundario', alTocar: () => quitarEntrada(fecha, ya.id) });
  botones.push({
    texto: ya ? 'Guardar' : 'Marcar como comida', clase: 'principal',
    alTocar: () => {
      est().preferencias[cm.id] = opcion.id;
      const nueva = entradaDePlan(cm, opcion, factor);
      const d = diaEditable(fecha);
      const i = ya ? d.comidas.findIndex(x => x.id === ya.id) : -1;
      if (i >= 0) { nueva.id = ya.id; nueva.t = ya.t; d.comidas[i] = nueva; } else d.comidas.push(nueva);
      guardar();
      alCambiar();
    },
  });

  abrirHoja({
    titulo: cm.nombre, html, botones,
    alMontar: dlg => {
      const cuerpo = dlg.querySelector('.hoja-cuerpo');
      const pintar = () => {
        cuerpo.querySelector('#hc-detalle').textContent = opcion.detalle;
        const t = {};
        for (const k of ['kcal', 'p', 'c', 'g', 'f']) t[k] = opcion[k] * factor;
        cuerpo.querySelector('#hc-previa').innerHTML = previa(t);
      };
      cuerpo.addEventListener('change', ev => {
        if (ev.target.name !== 'opcion') return;
        opcion = cm.opciones.find(o => o.id === ev.target.value);
        pintar();
      });
      cuerpo.querySelector('#hc-factor').addEventListener('click', ev => {
        const b = ev.target.closest('[data-f]');
        if (!b) return;
        factor = Number(b.dataset.f);
        for (const x of cuerpo.querySelectorAll('#hc-factor button')) x.classList.toggle('activo', x === b);
        pintar();
      });
      pintar();
    },
  });
}

// ---------------------------------------------------------------- alimentos sueltos

export const buscarAlimento = id => ALIMENTOS.find(a => a.id === id) || est().propios.find(a => a.id === id) || null;

// Alimentos usados en los últimos 30 días, del más reciente al más viejo.
export function recientes() {
  const vistos = new Map();
  const fechas = Object.keys(est().dias).filter(f => f >= sumarDias(hoyISO(), -30)).sort().reverse();
  for (const f of fechas) {
    for (const x of [...(est().dias[f].comidas || [])].reverse()) {
      if (!x.alimento || vistos.has(x.alimento)) continue;
      const a = buscarAlimento(x.alimento);
      if (a) vistos.set(x.alimento, a);
    }
  }
  return [...vistos.values()].slice(0, 12);
}

// La última cantidad que usaste de un alimento (para proponerla de nuevo).
function ultimaCantidad(id) {
  const fechas = Object.keys(est().dias).sort().reverse().slice(0, 60);
  for (const f of fechas) {
    const x = [...(est().dias[f].comidas || [])].reverse().find(e => e.alimento === id);
    if (x) return { cantidad: x.cantidad, unidad: x.unidad };
  }
  return null;
}

export function hojaAlimento(fecha, alimento) {
  const opciones = unidades(alimento);
  const previo = ultimaCantidad(alimento.id);
  let unidad = previo && opciones.some(u => u.valor === previo.unidad) ? previo.unidad : opciones[0].valor;
  const cantidad = previo && previo.unidad === unidad ? previo.cantidad : (unidad === 'g' ? 100 : 1);
  const base = alimento.porcion ? `por ${alimento.porcion}` : `por 100 ${alimento.ml ? 'ml' : 'g'}`;

  const html = `
    <p class="sub">${fmt(alimento.k)} kcal · P ${fmt1(alimento.p)} · C ${fmt1(alimento.c)} · G ${fmt1(alimento.g)} ${base}${alimento.aprox ? ' · estimado' : ''}</p>
    <div class="cantidad">
      <input id="ha-cant" type="text" inputmode="decimal" autocomplete="off" value="${cantidad}" aria-label="Cantidad">
      <select id="ha-unidad" aria-label="Unidad">${opciones.map(u =>
        `<option value="${u.valor}" ${u.valor === unidad ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}</select>
    </div>
    <div class="atajos" id="ha-atajos"></div>
    <div class="vista-previa" id="ha-previa"></div>
    ${alimento.propio ? `<button type="button" class="enlace peligro" id="ha-borrar">Eliminar de mis alimentos</button>` : ''}`;

  abrirHoja({
    titulo: alimento.n, html,
    botones: [{
      texto: 'Agregar', clase: 'principal',
      alTocar: dlg => {
        const c = num(dlg.querySelector('#ha-cant').value);
        if (!c || c <= 0) { aviso('Escribe una cantidad mayor a 0.'); return false; }
        const r = calcular(alimento, c, unidad);
        agregar(fecha, { id: nuevoId(), t: Date.now(), alimento: alimento.id, cantidad: c, unidad, nombre: alimento.n, ...r });
        aviso(`Agregado: ${alimento.n} (${fmt(r.kcal)} kcal)`);
      },
    }],
    alMontar: dlg => {
      const cuerpo = dlg.querySelector('.hoja-cuerpo');
      const campo = cuerpo.querySelector('#ha-cant');
      const pintarAtajos = () => {
        const lista = unidad === 'g' ? [50, 100, 150, 200] : [0.5, 1, 2, 3];
        cuerpo.querySelector('#ha-atajos').innerHTML = lista.map(v => `<button type="button" data-v="${v}">${v === 0.5 ? '½' : v}</button>`).join('');
      };
      const pintar = () => { cuerpo.querySelector('#ha-previa').innerHTML = previa(calcular(alimento, num(campo.value) || 0, unidad)); };
      campo.addEventListener('input', pintar);
      cuerpo.querySelector('#ha-unidad').addEventListener('change', ev => {
        unidad = ev.target.value;
        campo.value = unidad === 'g' ? 100 : 1;
        pintarAtajos();
        pintar();
      });
      cuerpo.querySelector('#ha-atajos').addEventListener('click', ev => {
        const b = ev.target.closest('[data-v]');
        if (!b) return;
        campo.value = b.dataset.v;
        pintar();
      });
      cuerpo.querySelector('#ha-borrar')?.addEventListener('click', () => {
        if (!confirm(`¿Eliminar "${alimento.n}" de tus alimentos? Lo que ya registraste no cambia.`)) return;
        est().propios = est().propios.filter(a => a.id !== alimento.id);
        guardar();
        dlg.close();
        alCambiar();
      });
      pintarAtajos();
      pintar();
    },
  });
}

// Captura rápida: solo calorías (y macros si los sabes).
export function hojaRapido(fecha) {
  const html = `
    <label class="campo" for="hr-nombre"><span>Qué fue (opcional)</span>
      <span class="campo-entrada"><input id="hr-nombre" type="text" autocomplete="off" placeholder="Ej. comida en casa de mi abuela"></span></label>
    ${campoNumero({ id: 'hr-kcal', etiqueta: 'Calorías', unidad: 'kcal', decimal: false, autofocus: true })}
    <div class="campos-3">
      ${campoNumero({ id: 'hr-p', etiqueta: 'Proteína', unidad: 'g' })}
      ${campoNumero({ id: 'hr-c', etiqueta: 'Carbos', unidad: 'g' })}
      ${campoNumero({ id: 'hr-g', etiqueta: 'Grasa', unidad: 'g' })}
    </div>
    <p class="nota">Si dejas las calorías vacías, se calculan con los macros (4 · 4 · 9 kcal por gramo).</p>`;
  abrirHoja({
    titulo: 'Agregar rápido', html,
    botones: [{
      texto: 'Agregar', clase: 'principal',
      alTocar: dlg => {
        const v = id => num(dlg.querySelector(id).value);
        const p = v('#hr-p') || 0, c = v('#hr-c') || 0, g = v('#hr-g') || 0;
        let kcal = v('#hr-kcal');
        if (kcal == null) kcal = Math.round(p * 4 + c * 4 + g * 9);
        if (!kcal || kcal < 0 || kcal > 10000) { aviso('Escribe las calorías (o los macros).'); return false; }
        const nombre = dlg.querySelector('#hr-nombre').value.trim() || 'Captura rápida';
        agregar(fecha, { id: nuevoId(), t: Date.now(), rapido: true, nombre, detalle: 'captura rápida', kcal: Math.round(kcal), p, c, g, f: 0 });
      },
    }],
  });
}

// Crear un alimento propio (valores por porción, como vienen en la etiqueta).
export function hojaCrearAlimento(fecha) {
  const html = `
    <label class="campo" for="hn-nombre"><span>Nombre</span>
      <span class="campo-entrada"><input id="hn-nombre" type="text" autocomplete="off" placeholder="Ej. Barra Quest de chocolate"></span></label>
    <label class="campo" for="hn-porcion"><span>Porción</span>
      <span class="campo-entrada"><input id="hn-porcion" type="text" autocomplete="off" value="porción" placeholder="Ej. barra 60 g"></span></label>
    ${campoNumero({ id: 'hn-kcal', etiqueta: 'Calorías por porción', unidad: 'kcal', decimal: false })}
    <div class="campos-3">
      ${campoNumero({ id: 'hn-p', etiqueta: 'Proteína', unidad: 'g' })}
      ${campoNumero({ id: 'hn-c', etiqueta: 'Carbos', unidad: 'g' })}
      ${campoNumero({ id: 'hn-g', etiqueta: 'Grasa', unidad: 'g' })}
    </div>
    ${campoNumero({ id: 'hn-f', etiqueta: 'Fibra (opcional)', unidad: 'g' })}
    <p class="nota">Copia los datos de la etiqueta nutrimental. Se guarda en "Mis alimentos" solo en este teléfono.</p>`;
  abrirHoja({
    titulo: 'Crear alimento', html,
    botones: [{
      texto: 'Guardar y agregar', clase: 'principal',
      alTocar: dlg => {
        const v = id => num(dlg.querySelector(id).value);
        const n = dlg.querySelector('#hn-nombre').value.trim();
        if (!n) { aviso('Ponle nombre al alimento.'); return false; }
        const p = v('#hn-p') || 0, c = v('#hn-c') || 0, g = v('#hn-g') || 0;
        const k = v('#hn-kcal') ?? Math.round(p * 4 + c * 4 + g * 9);
        if (!k || k < 0) { aviso('Escribe las calorías por porción.'); return false; }
        const alimento = {
          id: 'u_' + nuevoId(), n, grupo: 'propio', propio: true,
          porcion: dlg.querySelector('#hn-porcion').value.trim() || 'porción',
          k, p, c, g, f: v('#hn-f') || 0,
        };
        est().propios.push(alimento);
        guardar();
        hojaAlimento(fecha, alimento);   // abre la hoja para capturar cuánto comiste
        return false;                     // (la hoja sigue abierta con el nuevo contenido)
      },
    }],
  });
}

// ---------------------------------------------------------------- medidas del día

export const MEDIDAS = {
  peso: { titulo: 'Peso', etiqueta: 'Peso en ayunas', unidad: 'kg', min: 30, max: 300, decimal: true,
    ayuda: 'Diario, en ayunas y después del baño. Lo que cuenta es el promedio de 7 días.' },
  cintura: { titulo: 'Cintura', etiqueta: 'Cintura', unidad: 'cm', min: 40, max: 200, decimal: true,
    ayuda: 'Domingo en ayunas, a la altura del ombligo.' },
  agua: { titulo: 'Agua', etiqueta: 'Total del día', unidad: 'ml', min: 0, max: 10000, decimal: false,
    ayuda: 'Meta: 3 L (3,000 ml) y 0.5 L más por cada hora de ejercicio. La orina debe verse amarillo claro.' },
  pasos: { titulo: 'Pasos', etiqueta: 'Pasos del día', unidad: 'pasos', min: 0, max: 100000, decimal: false,
    ayuda: 'Meta: 9,000–11,000. Los ves en la app Salud del iPhone.' },
  sueno: { titulo: 'Sueño', etiqueta: 'Horas dormidas anoche', unidad: 'h', min: 0, max: 24, decimal: true,
    ayuda: 'Meta: 7.5–8 h. El fin de semana procura no moverte más de 1–1.5 h de tu horario.' },
  caminata: { titulo: 'Caminata', etiqueta: 'Minutos de caminata', unidad: 'min', min: 0, max: 600, decimal: false,
    ayuda: 'Meta: 45–60 min, 4 días por semana, después de pesas o en días libres.' },
};

export function editarMedida(fecha, campo) {
  const cfg = MEDIDAS[campo];
  const actual = dia(fecha)[campo];
  const botones = [];
  if (actual != null && actual !== 0) {
    botones.push({ texto: 'Borrar', clase: 'secundario', alTocar: () => {
      const d = diaEditable(fecha);
      if (campo === 'agua') d.agua = 0; else delete d[campo];
      guardar();
      alCambiar();
    } });
  }
  botones.push({ texto: 'Guardar', clase: 'principal', alTocar: dlg => {
    const v = num(dlg.querySelector('#m-valor').value);
    if (v == null) { aviso('Escribe un número.'); return false; }
    if (v < cfg.min || v > cfg.max) { aviso(`Revisa el valor (entre ${fmt(cfg.min)} y ${fmt(cfg.max)}).`); return false; }
    diaEditable(fecha)[campo] = cfg.decimal ? Math.round(v * 10) / 10 : Math.round(v);
    guardar();
    alCambiar();
  } });
  abrirHoja({
    titulo: cfg.titulo,
    html: campoNumero({ id: 'm-valor', etiqueta: cfg.etiqueta, valor: actual || '', unidad: cfg.unidad, ayuda: cfg.ayuda, decimal: cfg.decimal, autofocus: true }),
    botones,
  });
}

export function sumarAgua(fecha, ml) {
  const d = diaEditable(fecha);
  d.agua = Math.max(0, (d.agua || 0) + ml);
  guardar();
  alCambiar();
}

export function alternarHabito(fecha, habito) {
  const d = diaEditable(fecha);
  d.habitos[habito] = !d.habitos[habito];
  guardar();
  alCambiar();
}

// ---------------------------------------------------------------- línea base

export function hojaBase() {
  const base = est().base;
  const semana0 = resumenSemana(0);
  const html = `
    <p class="nota">Tu punto de partida (semana del 5 al 8 nov). Con esto la app calcula tus metas en kilos y centímetros. Se guarda solo en este teléfono.</p>
    ${campoNumero({ id: 'b-peso', etiqueta: 'Peso de arranque', valor: base.peso ?? (semana0.peso != null ? kg(semana0.peso) : ''), unidad: 'kg', autofocus: true })}
    ${campoNumero({ id: 'b-cintura', etiqueta: 'Cintura de arranque', valor: base.cintura ?? semana0.cintura ?? '', unidad: 'cm' })}`;
  abrirHoja({
    titulo: 'Línea base', html,
    botones: [{ texto: 'Guardar', clase: 'principal', alTocar: dlg => {
      const peso = num(dlg.querySelector('#b-peso').value);
      const cintura = num(dlg.querySelector('#b-cintura').value);
      if (peso != null && (peso < 30 || peso > 300)) { aviso('Revisa el peso.'); return false; }
      if (cintura != null && (cintura < 40 || cintura > 200)) { aviso('Revisa la cintura.'); return false; }
      est().base = { peso, cintura };
      guardar();
      alCambiar();
    } }],
  });
}
