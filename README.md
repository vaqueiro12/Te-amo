# Michel: Una aventura escrita por el destino ♡

Videojuego romántico completo en HTML, CSS y JavaScript puro. No necesita instalar paquetes ni conexión a Internet. Incluye cinco niveles jugables, plataformas, saltos, corazones, estrellas, desafíos, personajes ilustrados con poses animadas, música opcional, controles táctiles, guardado de progreso y una carta final sorpresa.

## Abrir en Visual Studio Code

1. Descomprime el ZIP.
2. Abre Visual Studio Code > Archivo > Abrir carpeta > `michel-aventura`.
3. Abre `index.html` en Chrome, o usa la extensión **Live Server** y selecciona **Open with Live Server**.
4. Pulsa «Comenzar». Usa A/D o flechas, ESPACIO para saltar, E para interactuar. En celular hay botones en pantalla.

## Personalizar

- Textos de niveles: objeto `LEVELS` al principio de `game.js`.
- Carta: constante `LETTER` al principio de `game.js`.
- Aspecto de Michel y Alexis: atlas `assets/personajes-vestido-marino.png`, con ocho poses por personaje. Michel lleva vestido negro y conserva su cabello rojizo oscuro, ojos negros y lunar junto al párpado. Alexis lleva camisa azul marino de manga larga y pantalón negro, con su lunar arriba del labio, a su derecha. `drawCharacter` selecciona las poses y ajusta ambos a la misma altura. El encuentro y los retratos usan `assets/encuentro-vestido-marino.png`; la espera con ramo usa `assets/alexis-espera-marino.png`. Instrucciones de edición y archivos anteriores: `assets/VESTUARIO.md` y `assets/ARTE.md`.
- El juego no incluye fotos privadas ni imágenes externas. El arte local se muestra en Canvas; los personajes son versiones ilustradas, no retratos idénticos. Al compartir el juego incluye la carpeta `assets`.
- Para compartirlo en Vercel: sube todos los archivos y la carpeta `assets` a un repositorio de GitHub y crea un proyecto Vercel con framework «Other» y directorio raíz del repositorio. Es un sitio estático.

**Nota:** El botón «Sí, quiero» representa una elección dentro del juego; lo importante es que Michel pueda responder libremente, también en persona. No se guarda ni envía su respuesta.

## Escenarios y animación

Cada nivel ocupa una pantalla fija, con sus propias plataformas y ambientación. Al completar el nivel se muestra una pantalla de cierre y el botón para entrar al siguiente. Las paletas están en `THEMES` y la distribución de plataformas en `makeLevel`. Incluye nubes, ondas en el agua, árboles con movimiento, mariposas, partículas y animación de personajes, sin dependencias externas.

## Retos de la aventura

Además de los corazones o estrellas, cada nivel tiene una misión obligatoria:

1. Encontrar el sobre sobre la plataforma central.
2. Tocar dos cristales para retirar la barrera y habilitar el puente sobre el agua.
3. Saltar entre plataformas de cristal que se rompen tras 850 ms y regresan después de 2,1 segundos.
4. Atrapar tres veces la estrella viajera.
5. Recuperar tres recuerdos y llegar al encuentro con Alexis.

Los objetos de misión se activan al tocarlos, también en celular. La franja superior muestra el siguiente objetivo. Cada escenario tiene un secreto opcional de 300 puntos. La bandera del suelo guarda un punto de control durante el nivel; perder vidas o continuar después de perder las tres conserva los objetos y misiones. Reiniciar el nivel o recargar la página reinicia ese estado; el avance entre niveles sigue guardándose en el navegador.

La lógica y los dibujos de las misiones están en `adventure.js`, que se carga antes de `game.js`. Para ejecutar las pruebas sin instalar dependencias: `node tests/adventure.test.cjs`. Las pruebas ejecutan la lógica con un Canvas simulado; la revisión visual se hace abriendo `index.html`.
