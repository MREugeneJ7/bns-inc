# PostLens

Dashboard de LinkedIn con Excel, distribución agregada y grupos semánticos por embeddings.

## Qué es y qué no es IA

- El parseo del Excel, las sumas, las medias ponderadas y el resumen numérico son código determinista. Los grupos y la matriz usan embeddings neuronales `Xenova/multilingual-e5-small` con coseno, no Bag of Words ni TF-IDF. No usan una LLM generativa.
- Los textos verificados se codifican en un **Web Worker dedicado** (`src/lib/embed.worker.ts`) con el prefijo `passage: `, `pooling: 'mean'` y `normalize: true`. Intenta WebGPU (`fp16`), libera la sesión GPU al acabar para dejar VRAM libre a WebLLM, y cae automáticamente a WASM (`q8`, monohilo seguro en iframes) si WebGPU falla o no está disponible. Los vectores ya calculados se cachean en sesión para no recalcular posts previos. Si también falla WASM, se muestra el error y nunca se fabrican grupos léxicos.
- La app se despliega como HTML estático único (sin backend en el servidor). El runtime `@huggingface/transformers@3.8.1` se carga bajo demanda desde jsDelivr y los pesos desde Hugging Face; los textos se procesan localmente en tu navegador usando Web Workers (embeddings y CPU/WASM).
- **Subida múltiple asíncrona**: puedes arrastrar o seleccionar varios Excel/CSV a la vez. Se guardan sus estadísticas inmediatamente, se evita duplicar URLs/IDs, se importan los textos en paralelo (concurrencia acotada) y se encola la titulación con la LLM en segundo plano aunque cambies de pestaña. Si algún post no se encuentra o falla su título, aparece un aviso persistente con acciones para reintentar o pegar el texto manualmente.
- Las plantillas orientativas de publicaciones también son código. Están identificadas como **sin IA** y plegadas.
- Los títulos, nombres de grupos, análisis, propuestas y preguntas etiquetados **LLM** solo se muestran después de recibir una respuesta de un modelo. Se indica motor y modelo; los errores no se sustituyen por plantillas. Cada grupo puede renombrarse o reintentarse por separado.
- El modo automático prueba en orden: Prompt API de Chrome (si está disponible, fuera de iframes restringidos) → **WebGPU (WebLLM)** con `Qwen 2.5 0.5B` (o el modelo elegido: Qwen 2.5 1.5B, Llama 3.2 1B, SmolLM2 360M, seleccionando `q4f16_1` o `q4f32_1` según soporte `shader-f16`, con ventana de 2048 tokens y reintento ante reinicio de GPU) → respaldo `Xenova/LaMini-Flan-T5-77M` en Web Worker CPU/WASM (~98 MB, calidad básica).
- **Ollama opcional y configurable**: si deseas delegar la carga LLM a tu propio servidor local o en red (con `OLLAMA_ORIGINS=*`), elige Ollama e indica modelo y URL (por defecto `http://localhost:11434`). El modo automático nunca sondea localhost ni usa APIs remotas sin tu elección.

## Procedencia de los textos

La importación pide exclusivamente la URL del post, directamente o mediante Jina Reader (HTML) y AllOrigins. No usa buscadores ni una LLM. Los lectores reciben la URL pública; no reciben el Excel ni cookies de LinkedIn.

No se acepta el bloque más largo de la página. LinkedIn suele exportar URLs con `share-<ID>` o `ugcPost-<ID>` mientras su página canónica y JSON-LD usan `activity-<ID>`: el extractor acepta el puente explícito entre ambos IDs en el contenedor principal (`data-attributed-urn` ↔ `data-activity-urn`) o la coincidencia exacta de autor y slug al pasar de `share`/`ugcPost` a `activity`. Sigue descartando `related-posts__crosslink`, comentarios, recomendaciones, metadescripciones genéricas y páginas de otro post. Si no hay evidencia suficiente, se devuelve un fallo y el texto permanece pendiente.

La coincidencia de ID comprueba la identidad declarada en el HTML, **no es una prueba criptográfica de autenticidad del proveedor**. El editor permite revisar el original, el proveedor, método, ID y fecha, y confirmar/corregir el texto manualmente.

Los textos de versiones anteriores sin procedencia se conservan pero se marcan **sin verificar**. No participan en grupos ni prompts hasta reimportarlos o confirmarlos. Las estadísticas del Excel se conservan. Se guarda una copia anterior a esta migración en localStorage.

Los registros con IDs de la antigua demo automática (`demo-*`) no se cargan como posts personales. La demo ahora solo se abre explícitamente y no sobrescribe tus datos.

El alcance agregado es una suma de los alcances por post, no usuarios únicos globales. Los porcentajes son ponderaciones aproximadas de las categorías publicadas por LinkedIn, que no son un desglose completo.

## Desarrollo y pruebas

```bash
npm run dev
npx tsc --noEmit
npx tsx --test tests/trust.test.ts
npm run build
```

Pruebas de interfaz con un adaptador de Chrome controlado (verifican conexión y estados de error, no calidad de una LLM real):

```bash
APP_URL=http://localhost:5173 node tests/browser-ui.mjs
```

Prueba opcional con **el modelo CPU real**, sin simular inferencia; requiere red para su primera descarga:

```bash
APP_URL=http://localhost:5173 node tests/browser-model.mjs
npm run preview -- --port 4173
PRODUCTION_URL=http://localhost:4173 node tests/browser-production.mjs
```

Los tests de extracción usan HTML adversarial de prueba. No demuestran que LinkedIn permita leer cualquier post público: CORS, bloqueos, cambios de HTML o errores de los lectores pueden impedir la importación. En ese caso se exige revisión o pegado manual, sin inventar un cuerpo.
