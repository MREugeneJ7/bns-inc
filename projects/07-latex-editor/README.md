# TALLER — editor y proyectos LaTeX

Next.js App Router, PostgreSQL y Drizzle. Ocho salidas: PDF, LaTeX, ODT, RTF, HTML, EPUB, Markdown y TXT.

## Dependencias del servidor

```sh
bash scripts/bootstrap-tex.sh
npx drizzle-kit push
npm run build
```

La imagen del servidor debe incluir estas dependencias; no se instalan paquetes al ejecutar documentos de usuarios. `latexmk`, pdfLaTeX, XeLaTeX, LuaLaTeX, BibTeX, Biber, Pandoc y Poppler están declarados en el script. TeX se ejecuta sin shell escape. `latexmk -norc` no lee scripts de construcción subidos.

## Proyectos ZIP

Usar **Importar ZIP / Drive** en el explorador. Se comprueba la firma, no la extensión, por lo que un ZIP renombrado a JPG también funciona. Un enlace público de Google Drive es otra vía. Límite: 30 MB comprimidos / 80 MB extraídos / 1500 archivos; se rechazan rutas absolutas, `..` y enlaces simbólicos.

Se conserva cada entrada original, byte por byte, en `project_files.original` (base64 en PostgreSQL). Los textos editables tienen su propia fila en `documents`; nunca se sobrescriben los originales. Las imágenes y recursos permanecen en sus rutas. Elegir principal y motor en **Configurar**.

Los ajustes de compatibilidad se proponen, no se aplican al importar: archivo de idioma antiguo que oculta Babel, anclas frágiles en títulos y `&` sin escapar en campos bibliográficos. El usuario puede aplicarlos o revertirlos individualmente. La copia original sigue descargable.

## Un proyecto, ocho exportadores

- **PDF**: `latexmk` sobre archivos originales/editados, con bibliografía, índices y pasadas hasta estabilizar referencias. El visor muestra las páginas del PDF, no una reconstrucción HTML.
- **LaTeX**: en proyectos importados entrega ZIP con todos los fuentes, recursos, principal/motor y registro de compatibilidad. En documentos simples entrega `.tex` exacto.
- **ODT, HTML, RTF, EPUB, MD, TXT**: Pandoc con el árbol de recursos, citas y bibliografía. Para preámbulos que Pandoc no entiende se intenta una proyección de lectura simplificada exclusivamente en el directorio temporal y se registra un aviso. Nunca se altera el PDF o el proyecto por esa proyección.
- ODT conserva el idioma de Babel y la alineación por imagen. HTML es UTF-8, autocontenido y usa MathML con centrado por ecuación display. RTF conserva proporciones/alineación e incrusta ecuaciones compuestas por TeX. Markdown y texto plano no conservan maquetación; los enlaces relativos de imágenes de Markdown se resuelven con los recursos del ZIP LaTeX.

**Pandoc no es un motor LaTeX**: portadas personalizadas, flotantes, paginación, estilos de paquetes y tablas complejas pueden diferir en las conversiones editables. El informe de cada descarga lo indica. El PDF y el ZIP LaTeX son la referencia de fidelidad, no se promete equivalencia píxel a píxel entre formatos.

Los archivos exportados se sirven mediante URLs reales de `/api/files/...` y una bandeja de descarga compatible con el iframe (guardar en disco, enlace directo, copiar texto). Caducidad: 6 horas.

## Validación

```sh
npx tsx --test tests/*.test.ts
TEST_TFM_ZIP=/ruta/al/tfm.zip npx tsx --test tests/*.test.ts
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run build
```

La prueba opcional de TFM utiliza un archivo local; no se incluye el documento personal del usuario en el código ni en las fixtures. Valida los ocho formatos, la presencia de tablas, imágenes, citas y bibliografía, además de conservar los originales.
