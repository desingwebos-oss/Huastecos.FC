# 🔦 Helena, Cazadora de Misterios

Juego kawaii de misterio y escape: 4 escenarios, un monstruo que patrulla, linterna, escondites y quiz del impostor.
Hecho con **Phaser 3** y empaquetado como **PWA** (instalable y funciona sin internet).

## Estructura
```
index.html            pantallas (inicio, niveles, ayuda, juego)
css/style.css         estilos
js/data.js            niveles (mapas P C K H E #)
js/game.js            escena Phaser: gráficos, luz, partículas, IA
js/main.js            UI, controles, progreso guardado
sw.js · manifest.webmanifest · icons/   PWA
.github/workflows/pages.yml             deploy automático
```

## Probar en local
```bash
npm start        # o: python3 -m http.server 8080
```
(El service worker requiere http://localhost, no `file://`.)

## Publicar en GitHub Pages
```bash
git init && git add . && git commit -m "Helena v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/helena-cazadora.git
git push -u origin main
```
Luego en GitHub: **Settings → Pages → Source: GitHub Actions**. Abre la URL en el celular y elige **Agregar a pantalla de inicio**.

## Notas
- Phaser se carga desde cdnjs (v3.80.1) y el service worker lo guarda en caché tras la primera visita. Para hospedarlo tú mismo: descarga `phaser.min.js` a `vendor/` y cambia la etiqueta `<script>` en `index.html`.
- Al publicar cambios sube `CACHE = 'helena-v1'` en `sw.js` a `v2`, `v3`…
- Añadir niveles: agrega un objeto a `LEVELS` en `js/data.js` (mapa de 20 columnas).
