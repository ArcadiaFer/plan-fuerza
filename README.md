# Plan Fuerza

App para el iPhone (y el iPad) que acompaña el **Plan de definición y fuerza**:
contador de calorías, rutina del día con temporizador de descanso, y seguimiento
de peso, cintura y fuerza con las revisiones cada 2 semanas del plan.

Es una **PWA** (página web que se instala como app): vive en GitHub Pages, se
agrega a la pantalla de inicio desde Safari y funciona sin internet. No necesita
Mac, Xcode ni cuenta de desarrollador de Apple.

## Qué hace

| Pantalla | Para qué sirve |
|---|---|
| **Hoy** | Fase y semana del plan, calorías y macros contra tu meta, las 4 comidas del plan (un toque y quedan anotadas), peso, cintura, sueño, pasos, agua, hábitos (creatina, café antes de 13:00, táper, caminata) y el entreno que toca. |
| **Comida** | Contador de calorías: buscador con ~55 alimentos (por 100 g o por pieza), platillos de "comer fuera", captura rápida y tus alimentos propios. Guía de intercambios, regla de la mano y qué pedir en el Tec. |
| **Entreno** | La sesión del día (Torso A lun, Pierna A mar, Torso B jue, Pierna B vie). Anotas peso, reps y RIR con botones − y +; calcula e1RM, sugiere la carga según la progresión del plan y arranca el temporizador de descanso. Respeta la descarga del 21–27 dic. |
| **Progreso** | Calendario de fases, gráfica de peso (promedio de 7 días), metas del 16 dic y de marzo, e1RM de banca/sentadilla/peso muerto, revisión PDCA cada 2 semanas (la app evalúa las reglas y aplica el ajuste si quieres), calorías de mantenimiento para fiestas y el registro semanal. |
| **Plan** | Todo el PDF a la mano: metas, lista del súper y meal prep con palomitas, día tipo, rutina, progresión, técnica, suplementos, fiestas y glosario. Respaldo y restauración de datos. |

## Privacidad

- Tus datos (comidas, peso, cintura, series) se guardan **solo en tu teléfono**
  (`localStorage`). No se manda nada a internet.
- El código de este repositorio es público; por eso **no contiene tu nombre ni tus
  medidas**. La línea base (peso y cintura de arranque) se captura en la app, y las
  metas de resultado se calculan a partir de ella.
- Haz un respaldo de vez en cuando: **Plan → Tus datos → Hacer respaldo** abre la
  hoja de compartir del iPhone (Guardar en Archivos, OneDrive, AirDrop). Con
  **Restaurar** lo cargas en otro dispositivo (por ejemplo, el iPad).

## Instalar en el iPhone

1. Abre la dirección de la app en **Safari**.
2. Toca **Compartir** (el cuadro con la flecha) → **Agregar a inicio**.
3. Ábrela desde el icono: pantalla completa y funciona sin conexión.

## Estructura

```
index.html            Esqueleto: cabecera, 5 pantallas, pestañas, hoja y temporizador
css/estilos.css       Apariencia (tema oscuro, pensado para el dedo)
js/app.js             Arranque, pestañas y fecha activa
js/datos-plan.js      El plan convertido en datos (metas, comidas, rutina, reglas…)
js/alimentos.js       Base de alimentos y cálculo de calorías por cantidad
js/almacen.js         Guardar/leer en el teléfono y respaldo
js/calculos.js        Cuentas: totales, semanas, e1RM, sugerencias, revisiones
js/registro.js        Anotar comidas, medidas y línea base (hojas de captura)
js/ui.js              Piezas de interfaz: hoja inferior, avisos, formato de números
js/grafica.js         Gráficas de línea en SVG
js/temporizador.js    Descanso entre series
js/vista-*.js         Cada pantalla
sw.js                 Service worker (funcionar sin internet)
tools/generar_iconos.py   Genera los iconos (Python, solo biblioteca estándar)
```

Sin npm ni compilación: JavaScript con módulos ES que el navegador carga directo.

## Probar en la computadora

```bash
python -m http.server 8020
```

y abrir <http://localhost:8020>.

## Publicar cambios

Después de editar: `git add -A`, `git commit -m "…"` y `git push`. GitHub Pages
se actualiza en 1–3 minutos. **Si agregas un archivo nuevo**, súmalo a la lista
`ARCHIVOS` de `sw.js` y sube el número de `CACHE` (`plan-fuerza-v2`, …).

## Cambiar el plan

Todo el contenido del plan está en `js/datos-plan.js` (metas, comidas, rutina,
fechas de fases, reglas). Los valores nutrimentales de los alimentos están en
`js/alimentos.js` (por 100 g, de tablas USDA, redondeados).
