# Horizon Walker — Unofficial Community Wiki

A community-created wiki for finding *Horizon Walker* information and guides. It brings together character details, skills, traits, stigmas, gifts, and other reference pages.

> This is an independent fan project and is not affiliated with the developers or publishers of *Horizon Walker*. Information comes from community spreadsheets and may be incomplete or out of date.

## About the site

The wiki includes:

- a searchable character roster with rarity filters;
- character pages with available profiles, weapons, skills, recommended traits, stigmas, gifts, and Mights;
- reference pages, including Trait 2 and Stigma tables;
- a light and dark theme, remembered by your browser.

The site is a static application built with HTML, CSS, and JavaScript. Its JSON data and images are generated from community-published Excel workbooks.

## Use the wiki

Visit the hosted site, or build it locally using the instructions below. Links to the community data sources are available in the site footer.

## Build locally

### Requirements

- Python 3;
- Bash and `curl` (to download the workbooks with `update.sh`);
- the Python dependencies listed in `requirements.txt`.

Install the dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Download the spreadsheets and build the site:

```bash
./update.sh
```

The script downloads the main, Trait 2, and Stigma spreadsheets, then creates a `build/` directory containing the JSON data, optimized images, and site files. If a download fails, it reuses the previous local copy when available. To stop the build if any download fails, run:

```bash
STRICT=1 ./update.sh
```

Preview the result locally:

```bash
cd build
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

### Build from existing workbooks

You can run the parser directly without downloading the spreadsheets:

```bash
python3 parse_sheet.py wiki.xlsx build --traits traits2.xlsx --stigma stigma.xlsx
```

The main workbook is required; the Trait 2 and Stigma workbooks are optional. The output includes `build/data/characters.json`, `build/data/pages.json`, a parsing report, and the required images in `build/img/`.

## Contributing

Contributions are welcome, including bug fixes, accessibility improvements, new features, documentation, and reports of incorrect data.

1. Open an issue describing the problem or proposal, or check whether a similar issue already exists.
2. Create a branch for your change and keep it focused.
3. Check the affected pages and data locally.
4. Open a pull request describing the change and how to verify it.

To correct game information, update the community spreadsheet that provides it whenever possible: generated data may be replaced during the next refresh. Avoid committing downloaded workbooks or the generated `build/` directory unless your change specifically requires them.

## Sources and rights

The wiki gathers information from community spreadsheets, also linked in the site footer:

- [Main wiki spreadsheet](https://docs.google.com/spreadsheets/d/1K5JaswJJOaJwt3NbxVqGrrxllj1rKI0lO91yD0tnaPI/)
- [Trait 2 spreadsheet](https://docs.google.com/spreadsheets/d/13MOd83gTIysTQEJ_BoJvioQUnpk9zxr5yhHWgj3aKSk/edit?usp=sharing)
- [Stigma spreadsheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vR-1lhboGKEa0UQDY24uE35Rxgo7AC0ZUNnnP6Ohc12j5Oj4aK9_eiewRFF9lcCynp41fmt4_YLAPWm/pubhtml)

The MIT License in this repository applies to the project code. It does not grant rights to *Horizon Walker*, its trademarks, characters, artwork, or other materials owned by their respective rights holders, or to third-party contributions in the source spreadsheets. Please refer to the relevant sources for their terms of use and attribution.

## License

The code in this repository is distributed under the MIT License. See [LICENSE](LICENSE).
