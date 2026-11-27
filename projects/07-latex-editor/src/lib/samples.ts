export interface SampleDoc {
  title: string;
  source: string;
}

export const SAMPLES: SampleDoc[] = [
  {
    title: "Notas sobre la composición tipográfica",
    source: `% Notas de taller — fuente LaTeX
\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[spanish]{babel}
\\usepackage{lmodern}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{hyperref}

\\title{Notas sobre la composición tipográfica}
\\author{Marina Cifuentes · Taller de edición}
\\date{14 de marzo de 2026}

\\begin{document}
\\maketitle

La composición tipográfica no es un adorno añadido al texto: es la disciplina
que decide cómo se lee. Una página bien compuesta \\emph{desaparece} ante el
lector, y esa invisibilidad es el resultado de cientos de decisiones
verificables.

\\section{El ojo y el blanco}

El blanco activo de una página ---sus márgenes, el interlineado, el aire entre
párrafos--- pesa tanto como la tinta. Cuando el blanco se comprime, el texto
se vuelve un muro; cuando se dispersa, la lectura pierde el hilo.

\\begin{quote}
Componer es repartir el blanco con la misma atención con la que se reparte la
tinta. El tipógrafo que solo mira las letras ha visto media página.
\\end{quote}

\\section{Medidas de trabajo}

El cuerpo del texto se relaciona con el ancho de columna mediante la longitud
media de línea. Una regla clásica fija entre 60 y 75 caracteres por línea:

\\begin{equation}
  L = \\frac{W}{0.5\\,c_{m}}
\\end{equation}

donde $L$ es el número de caracteres por línea, $W$ el ancho útil de la
columna en milímetros y $c_m$ el ancho medio del carácter.

\\subsection{Ajuste y espaciado}

El ajuste justificado obliga a repartir el espacio entre palabras. Cuando el
interlineado $t$ y el cuerpo $b$ se relacionan por $t = 1.45\\,b$, la página
mantiene el gris tipográfico uniforme.

\\begin{itemize}
  \\item El interlineado nunca baja de $1.35\\,b$ en textos largos.
  \\item Los márgenes exteriores superan a los interiores en al menos un 25\\%.
  \\item Las cifras deben alinearse por columna, no por ancho de caja.
\\end{itemize}

\\section{La prueba de imprenta}

Antes de tirar la edición completa se imprime una prueba: papel barato, tinta
de sobra y un lápiz rojo para anotar. La corrección sobre prueba impresa
detecta fallos que la pantalla disimula.

\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=0.62\\textwidth]{images/plate.jpg}
  \\caption{Componedor, cuña y husillo de prensa. Lámina de taller, grabado a
  buril sobre papel verjurado.}
\\end{figure}

\\subsection{Lista de comprobación}

\\begin{enumerate}
  \\item Colisiones de viudas y huérfanas en la última página de cada capítulo.
  \\item Espacios dobles tras el punto final.
  \\item Coherencia de las comillas: latinas de apertura y cierre, nunca rectas.
  \\item Referencias cruzadas sin resolver.
\\end{enumerate}

\\end{document}
`,
  },
  {
    title: "Ecuaciones de Maxwell en medios materiales",
    source: `% Apuntes de clase — electromagnetismo
\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[spanish]{babel}
\\usepackage{lmodern}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{hyperref}

\\title{Ecuaciones de Maxwell en medios materiales}
\\author{Álvaro Rendón}
\\date{Marzo de 2026}

\\begin{document}
\\maketitle

En un medio material, los campos electromagnéticos inducen respuestas
macroscópicas que se recogen en los campos de polarización $\\mathbf{P}$ y de
magnetización $\\mathbf{M}$. Las ecuaciones de Maxwell toman entonces la forma:

\\begin{align}
  \\nabla \\cdot \\mathbf{D} &= \\rho_f \\\\
  \\nabla \\cdot \\mathbf{B} &= 0 \\\\
  \\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
  \\nabla \\times \\mathbf{H} &= \\mathbf{J}_f + \\frac{\\partial \\mathbf{D}}{\\partial t}
\\end{align}

\\section{Medios lineales, isotrópicos y homogéneos}

Para un medio dieléctrico lineal se cumple $\\mathbf{D} = \\varepsilon
\\mathbf{E}$ y $\\mathbf{B} = \\mu \\mathbf{H}$, de modo que la permitividad
$\\varepsilon$ y la permeabilidad $\\mu$ son escalares constantes.

\\begin{equation}
  v = \\frac{1}{\\sqrt{\\varepsilon \\mu}} = \\frac{c}{n}
\\end{equation}

\\section{Condiciones de frontera}

\\begin{itemize}
  \\item La componente normal de $\\mathbf{D}$ salta en $\\sigma_f$.
  \\item La componente tangencial de $\\mathbf{E}$ es continua.
  \\item La componente normal de $\\mathbf{B}$ siempre es continua.
\\end{itemize}

\\begin{quote}
La electrodinámica de los medios materiales no es un añadido a la teoría del
vacío: es su forma completa. Lo que llamamos vacío es simplemente el caso
límite $\\varepsilon \\to \\varepsilon_0$, $\\mu \\to \\mu_0$.
\\end{quote}

\\end{document}
`,
  },
  {
    title: "Acta del taller de edición — 14 de marzo",
    source: `% Acta de sesión
\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[spanish]{babel}
\\usepackage{lmodern}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{hyperref}

\\title{Acta del taller de edición}
\\author{Secretaría del taller}
\\date{14 de marzo de 2026}

\\begin{document}
\\maketitle

Se reúne el taller a las 10:00 en la sala de pruebas para revisar el estado de
la edición de primavera y fijar el calendario de cierre.

\\section{Orden del día}

\\begin{enumerate}
  \\item Cierre de la maqueta del cuaderno primero.
  \\item Prueba de impresión y corrección sobre papel.
  \\item Reparto de las revisiones finales.
  \\item Fechas de entrega a imprenta.
\\end{enumerate}

\\section{Acuerdos}

\\begin{itemize}
  \\item Se acepta el cuerpo de 11~pt con interlineado de 1.45 para el texto
  corrido.
  \\item Las láminas se reproducen a una tinta, con filete de 0.5~pt.
  \\item El cierre de la maqueta se fija para el \\textbf{28 de marzo}.
\\end{itemize}

\\section{Observaciones}

La corrección de pruebas se hará siempre sobre papel impreso y con lápiz rojo;
las anotaciones al margen se recogen en el siguiente punto del acta.

\\begin{quote}
Ningún texto entra en imprenta sin haber pasado dos veces por la prueba de
papel. Una en la pantalla no cuenta.
\\end{quote}

\\subsection{Pendientes}

\\begin{itemize}
  \\item Confirmar disponibilidad de la papelera verjurada de 90~g.
  \\item Revisar la numeración de las figuras del cuaderno segundo.
  \\item Enviar el índice de materias a la biblioteca central.
\\end{itemize}

\\end{document}
`,
  },
];
