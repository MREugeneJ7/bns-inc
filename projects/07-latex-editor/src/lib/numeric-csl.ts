/** Numeric citation style used for LaTeX projects declaring plain/unsrt/numeric bibliographies. */
export const NUMERIC_CSL = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" default-locale="es-ES">
  <info><title>Taller numeric bibliography</title><id>https://taller.local/styles/numeric</id><updated>2026-01-01T00:00:00+00:00</updated></info>
  <macro name="author"><names variable="author"><name and="text" delimiter=", " initialize-with=". "/><substitute><text variable="publisher"/><text variable="title"/></substitute></names></macro>
  <citation collapse="citation-number"><sort><key variable="citation-number"/></sort><layout prefix="[" suffix="]" delimiter=", "><text variable="citation-number"/></layout></citation>
  <bibliography entry-spacing="0" second-field-align="flush"><layout suffix="."><text variable="citation-number" prefix="[" suffix="] "/><group delimiter=". "><text macro="author"/><text variable="title"/><text variable="container-title" font-style="italic"/><text variable="publisher"/><date variable="issued"><date-part name="year"/></date><text variable="URL"/></group></layout></bibliography>
</style>`;
