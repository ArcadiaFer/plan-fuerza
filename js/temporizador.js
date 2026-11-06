// =====================================================================
// temporizador.js — Cuenta regresiva del descanso entre series.
// ---------------------------------------------------------------------
// Al guardar una serie arranca una barra fija abajo con el descanso del
// ejercicio. Se guarda la HORA EN QUE TERMINA (no los segundos que faltan):
// así, si bloqueas el teléfono o cambias de app, al volver marca bien.
// Al llegar a cero suena un pitido (si el teléfono no está en silencio) y
// la barra parpadea; luego cuenta el tiempo de más (+0:15).
// =====================================================================

const CLAVE = 'plan-fuerza:temporizador';
let actual = null;        // { fin: milisegundos, total: segundos, nombre }
let reloj = null;         // el setInterval que repinta la barra
let sono = false;         // para no pitar dos veces
let audio = null;         // AudioContext (se crea con un toque, como exige iOS)

const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function iniciarTemporizador(segundos, nombre) {
  prepararAudio();
  actual = { fin: Date.now() + segundos * 1000, total: segundos, nombre };
  sono = false;
  guardar();
  arrancar();
}

export function detenerTemporizador() {
  actual = null;
  clearInterval(reloj);
  localStorage.removeItem(CLAVE);
  pintar();
}

function ajustar(segundos) {
  if (!actual) return;
  actual.fin += segundos * 1000;
  actual.total = Math.max(1, actual.total + segundos);
  if (actual.fin > Date.now()) sono = false;
  guardar();
  pintar();
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(actual)); } catch { /* sin espacio: no pasa nada */ }
}

function arrancar() {
  clearInterval(reloj);
  reloj = setInterval(pintar, 250);
  pintar();
}

function pintar() {
  const el = document.getElementById('temporizador');
  if (!actual) {
    el.hidden = true;
    document.body.classList.remove('con-temporizador');
    return;
  }
  const resta = Math.round((actual.fin - Date.now()) / 1000);
  el.hidden = false;
  document.body.classList.add('con-temporizador');
  el.querySelector('.tm-nombre').textContent = actual.nombre;
  el.querySelector('.tm-tiempo').textContent = resta >= 0 ? mmss(resta) : `+${mmss(-resta)}`;
  const avance = Math.max(0, Math.min(1, 1 - resta / actual.total));
  el.querySelector('.tm-avance').style.transform = `scaleX(${avance})`;
  el.classList.toggle('listo', resta <= 0);
  if (resta <= 0 && !sono) { sono = true; pitido(); }
  if (resta < -180) detenerTemporizador();       // 3 min después se quita solo
}

// iOS solo deja sonar audio si el AudioContext nació de un toque del usuario.
function prepararAudio() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch { audio = null; }
}

function pitido() {
  navigator.vibrate?.([200, 100, 200]);           // Android; el iPhone lo ignora
  if (!audio) return;
  const t0 = audio.currentTime;
  for (const retraso of [0, 0.25, 0.5]) {
    const osc = audio.createOscillator(), vol = audio.createGain();
    osc.frequency.value = 880;
    osc.connect(vol);
    vol.connect(audio.destination);
    vol.gain.setValueAtTime(0.0001, t0 + retraso);
    vol.gain.exponentialRampToValueAtTime(0.35, t0 + retraso + 0.02);
    vol.gain.exponentialRampToValueAtTime(0.0001, t0 + retraso + 0.18);
    osc.start(t0 + retraso);
    osc.stop(t0 + retraso + 0.2);
  }
}

// Se llama una vez al abrir la app: conecta los botones y recupera un descanso en curso.
export function prepararTemporizador() {
  document.getElementById('temporizador').addEventListener('click', ev => {
    const b = ev.target.closest('[data-tm]');
    if (!b) return;
    if (b.dataset.tm === 'x') detenerTemporizador();
    else ajustar(Number(b.dataset.tm));
  });
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (guardado && guardado.fin > Date.now() - 180000) {
      actual = guardado;
      sono = guardado.fin <= Date.now();
      arrancar();
    }
  } catch { /* nada guardado */ }
}
