# ExcelJS

A modernized drop-in replacement for the unmaintained ExcelJS package. It maintains 100% public API compatibility while refactoring internal architecture to strict TypeScript (ES2024 / Node 24+), removing legacy dependencies, and delivering a faster, lightweight, and secure spreadsheet engine for XLSX, CSV, and JSON.

# Documentation Index

Detailed documentation for ExcelJS is organized into separate guides in the [`docs`](docs/) directory:

| Guide | Description |
|---|---|
| **[Getting Started & Importing](docs/getting-started.md)** | Importing syntax, ES5 transpiled imports, polyfill instructions, and Browserify usage. |
| **[Workbook Operations](docs/workbook.md)** | Creating workbooks, setting workbook properties, calculation properties, and workbook window views. |
| **[Worksheet Operations](docs/worksheet.md)** | Adding/removing worksheets, accessing sheets, worksheet states, properties & metrics, page setup options, headers/footers, frozen & split views, and auto-filters. |
| **[Rows, Columns & Cells](docs/rows-columns-cells.md)** | Columns setup & iteration, row getters & setters, adding/inserting/splicing/duplicating rows, cell manipulation, merged cells, defined names, data validations, cell comments, and table definitions. |
| **[Styles & Formatting](docs/styling.md)** | Number formats, font specifications, alignment settings, borders, pattern & gradient fills, rich text formatting, cell protection, conditional formatting rules, outline levels, and image insertion. |
| **[File I/O & Streaming](docs/file-io.md)** | Reading/writing XLSX and CSV files with options, plus streaming `WorkbookWriter` and `WorkbookReader`. |
| **[Value Types](docs/value-types.md)** | Null, Merge, Number, String, Date, Hyperlink, Formula (Master/Shared/Array), Rich Text, Boolean, and Error value types. |
| **[Config, Caveats & Known Issues](docs/config.md)** | Dependency injection config, build artifacts caveats, and known issues. |

For a complete table of contents with all section links, see the [Documentation Table of Contents](docs/readme.md).

# Installation

```shell
npm install exceljs
```

# Contributions

Contributions are very welcome! It helps to know what features are desired or what bugs are causing pain.

If you submit a pull request for a bugfix, please add a unit test or integration test that catches the problem.

Please try to avoid modifying the package version in a PR. Versions are updated on release.

All contributions added to this library will be included in the library's MIT license.
