#!/usr/bin/env bash
# Downloads the three community sheets, rebuilds ./build, and copies index.html into it.
cd "$(dirname "$0")" || exit 1

declare -A SHEETS=(
  [wiki.xlsx]="https://docs.google.com/spreadsheets/d/1K5JaswJJOaJwt3NbxVqGrrxllj1rKI0lO91yD0tnaPI/export?format=xlsx"
  [traits2.xlsx]="https://docs.google.com/spreadsheets/d/13MOd83gTIysTQEJ_BoJvioQUnpk9zxr5yhHWgj3aKSk/export?format=xlsx"
  [stigma.xlsx]="https://docs.google.com/spreadsheets/d/e/2PACX-1vR-1lhboGKEa0UQDY24uE35Rxgo7AC0ZUNnnP6Ohc12j5Oj4aK9_eiewRFF9lcCynp41fmt4_YLAPWm/pub?output=xlsx"
)

for f in wiki.xlsx traits2.xlsx stigma.xlsx; do
  echo "Downloading $f ..."
  # an .xlsx is a zip file, so it must start with "PK"; anything else is an error/login page
  if curl -fsSL --retry 2 -o "$f.tmp" "${SHEETS[$f]}" && head -c 2 "$f.tmp" | grep -q PK; then
    mv "$f.tmp" "$f"
  else
    rm -f "$f.tmp"
    if [ "${STRICT:-0}" = 1 ]; then
      echo "Error: could not download $f. Stopping so the live site is not replaced." >&2
      exit 1
    fi
    echo "Warning: could not download $f. Using the previous copy if there is one." >&2
  fi
done

PY=python3
[ -x .venv/bin/python ] && PY=.venv/bin/python

extra=()
[ -f traits2.xlsx ] && extra+=(--traits traits2.xlsx)
[ -f stigma.xlsx ]  && extra+=(--stigma stigma.xlsx)

echo "Parsing..."
"$PY" parse_sheet.py wiki.xlsx build "${extra[@]}" || exit 1

[ -f index.html ] && cp index.html build/index.html
echo "Done. To preview: cd build && python3 -m http.server 8000"
