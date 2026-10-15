# Sistema de diseño · FPPT

Referencia visual para todas las pantallas. La versión en vivo, con los componentes
funcionando, está en **`/componentes`** (con el servidor encendido: <http://localhost:3000/componentes>).

## 1. Experiencia de usuario (UX)

**Objetivo principal del usuario:** subir los archivos de su proyecto para que queden guardados,
y consultar proyectos de años anteriores como guía.

**Flujo principal:**
Inicio → Ingresar / Crear cuenta → Subir proyecto (datos + ZIP) → Mis proyectos (pendiente) →
un docente lo aprueba → aparece en Proyectos y en el Inicio.

**Arquitectura de la información:**

| Sección | Qué contiene |
|---|---|
| Inicio | Presentación, destacados y recientes, cómo funciona |
| Proyectos | Muro de tarjetas con búsqueda y filtros → Detalle con árbol de archivos |
| Subir proyecto | Formulario y ZIP (requiere cuenta) |
| Sobre FPPT | Problema, propuesta, objetivos y equipo |
| Ayuda | Preguntas frecuentes y contacto |
| Ingresar | Login y registro |
| Panel | Solo docentes y admin: revisión de proyectos y usuarios |

**Decisiones tomadas a partir del mapa de empatía:**
- Botones con texto claro, sin íconos sueltos que no se entiendan.
- Mensajes de éxito y error en lenguaje simple.
- Barra de progreso al subir archivos.
- Pocos pasos para subir un proyecto.
- Páginas livianas (sin librerías pesadas) para las computadoras lentas de la escuela.

## 2. Identidad visual

- **Nombre:** FPPT · Falta de Preservación de Proyectos TIC.
- **Logo:** carpeta azul con un tilde naranja: los proyectos quedan guardados y a salvo.
  Archivos: `public/img/logo-fppt.png` (completo) y `public/img/icono-fppt.png` (solo la carpeta, para la barra y la pestaña).
- **Personalidad:** confiable, clara, moderna, escolar, colaborativa.
- **Estilo visual:** moderno y limpio: fondos claros, bordes redondeados, sombras suaves y mucho aire.
  Transmite orden (lo contrario al problema de archivos mezclados y perdidos) y es fácil de usar
  para estudiantes de 14 a 18 años con experiencia tecnológica intermedia.
- **Recursos gráficos:** ilustraciones simples de la marca como portada genérica según la materia
  (`public/img/portadas/`), el logo de la ET20 en el pie de página, y más adelante capturas
  reales de cada proyecto. No se usan fotos con derechos de autor.

## 3. Paleta de colores · regla 60-30-10

| Uso | Color | Hex | Variable CSS |
|---|---|---|---|
| **60%**: fondos | Fondo general | `#F7FAFC` | `--fondo` |
| | Celeste | `#E8F3FA` | `--celeste` |
| | Crema | `#FFF1E7` | `--crema` |
| **30%**: marca | Azul FPPT | `#326080` | `--azul` |
| | Azul noche (logo, pie) | `#123C5C` | `--azul-noche` |
| **10%**: acento | Naranja (tilde del logo) | `#E8871E` | `--naranja` |
| | Naranja oscuro (texto naranja) | `#A35A0A` | `--naranja-oscuro` |
| Texto | Tinta | `#1B2733` | `--tinta` |
| | Tinta suave | `#52606D` | `--tinta-suave` |
| Estados | Éxito / Error / Aviso | `#276B43` / `#B3261E` / `#8A5A00` | `--exito` / `--error` / `--aviso` |

**Justificación:** los azules salen del logo y del diseño original de Figma y transmiten
confianza y orden. El celeste y la crema suavizan la interfaz para que no sea fría. El naranja,
tomado del tilde del logo, se usa poco y solo para llamar la atención (destacados, pasos, foco
del teclado).

**Contraste (accesibilidad WCAG AA, mínimo 4.5:1):** todas las combinaciones de texto cumplen.

| Combinación | Contraste |
|---|---|
| Texto blanco sobre azul (botón primario) | 6.7 : 1 |
| Tinta sobre naranja (botón de acento, "Destacado") | 5.7 : 1 |
| Naranja oscuro sobre celeste (sobretítulos) | 4.6 : 1 |
| Tinta suave sobre fondo | 6.2 : 1 |
| Texto del pie sobre azul noche | 8.8 : 1 |

> El naranja claro (`#E8871E`) **nunca** lleva texto blanco encima: no se leería bien.

## 4. Tipografía

- **Principal: Plus Jakarta Sans** (400, 500, 600, 700, 800). Moderna, redondeada y muy legible
  en pantalla. Se sirve desde el propio servidor (paquete `@fontsource/plus-jakarta-sans`),
  así funciona aunque la escuela no tenga internet.
- **Respaldo:** la fuente del sistema (`system-ui`, Segoe UI, Roboto).

| Elemento | Tamaño | Peso |
|---|---|---|
| Título 1 | 2 a 3.1 rem (se adapta a la pantalla) | 800 |
| Título 2 | 1.4 a 1.9 rem | 700 |
| Título 3 | 1.15 rem | 700 |
| Texto | 1 rem (16 px) | 400 |
| Botones, etiquetas, menú | 0.78 a 1 rem | 600 a 800 |

## 5. Componentes

| Componente | Clase CSS | Por qué |
|---|---|---|
| Botón primario | `.boton .boton--primario` | Acción principal de cada pantalla (una sola por pantalla). |
| Botón secundario | `.boton .boton--secundario` | Acciones alternativas sin competir con la principal. |
| Botón de acento | `.boton .boton--acento` | "Guardar proyecto": el botón grande y visible que pedía el usuario. |
| Botón de peligro | `.boton .boton--peligro` | Eliminar: se distingue para evitar errores. |
| Campo de formulario | `.campo` (+ `.campo--error`) | Etiqueta siempre visible, ayuda debajo y error en rojo con texto explicativo. |
| Alertas | `.alerta--exito / --error / --aviso` | Confirmación visual clara después de cada acción. |
| Barra de progreso | `.progreso` | Muestra el avance al subir el ZIP. |
| Etiquetas | `.etiqueta` (+ `--exito / --aviso / --gris`) | Materia y estado del proyecto de un vistazo. |
| Tarjeta de proyecto | `.tarjeta` | Muro del inicio: portada, materia, curso, nombre y descripción corta. Toda la tarjeta es clickeable. |
| Barra de navegación | `.cabecera`, `.navegacion` | Fija arriba, solo texto. En celulares se abre con el botón "Menú". |
| Preguntas frecuentes | `.pregunta` (`<details>`) | Se abren y cierran sin JavaScript. |

**Medidas comunes:** bordes redondeados de 14 px (tarjetas) y 8 px (campos), botones en forma de
píldora de 46 px de alto (fáciles de tocar), ancho máximo del contenido de 1200 px.

## 6. Justificación final

Las decisiones se basan en el análisis del usuario y en los principios de UX/UI trabajados:
**consistencia** (los mismos componentes y colores en todo el sitio, definidos una sola vez como
variables CSS), **jerarquía visual** (una acción principal por pantalla, títulos grandes y pesos
tipográficos claros), **accesibilidad** (contraste AA, foco visible con el teclado y textos en
los botones) y **simplicidad** (pocos pasos, mensajes claros y páginas livianas). Así la
interfaz es coherente durante todo el desarrollo y responde a las frustraciones detectadas en
el mapa de empatía: interfaces confusas y pérdida de archivos.
