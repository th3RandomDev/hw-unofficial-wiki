#!/usr/bin/env python3
"""
Parse the Horizon Walker wiki workbook (.xlsx) into JSON + optimized WebP images.

Usage:  python scripts/parse_sheet.py <input.xlsx> <output_dir>

Output:
  <output_dir>/data/characters.json   one record per character
  <output_dir>/data/pages.json        standalone tabs (Demigod, Trait, Tier List, ...)
  <output_dir>/data/report.txt        parse report (what was / wasn't found)
  <output_dir>/img/*.webp             optimized, content-hashed images

Design notes
- Sections inside a character block are found by their LABELS ("Stigma",
  "Trait to Get", "Skill (Priority to Lv6)", "Grade :") instead of fixed cell
  addresses, so small layout shifts by the sheet owner don't break parsing.
- Anything that can't be assigned to a section lands in `extra`, so no text is lost.
- Images are matched to sections by their anchor cell (row, col).
"""
import argparse

from wiki_parser.builder import main


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("xlsx")
    ap.add_argument("out")
    ap.add_argument("--traits", help="Trait 2 workbook (optional)")
    ap.add_argument("--stigma", help="Stigma workbook (optional)")
    args = ap.parse_args()
    main(args.xlsx, args.out, args.traits, args.stigma)
