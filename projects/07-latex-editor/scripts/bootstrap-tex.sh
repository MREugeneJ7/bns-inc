#!/usr/bin/env bash
set -euo pipefail
# Reproducible runtime dependencies for native LaTeX projects and all 8 exports.
if command -v latexmk >/dev/null && command -v pandoc >/dev/null && kpsewhich bera.sty >/dev/null; then
  echo 'TeX/Pandoc ready'; exit 0
fi
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  texlive-latex-base texlive-latex-recommended texlive-latex-extra texlive-science \
  texlive-fonts-recommended texlive-fonts-extra texlive-lang-spanish texlive-xetex texlive-luatex \
  lmodern latexmk biber pandoc poppler-utils
