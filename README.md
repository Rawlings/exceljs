# @office-core/exceljs

[![npm version](https://img.shields.io/npm/v/@office-core/exceljs.svg?style=flat-square&color=cb3837&logo=npm)](https://www.npmjs.com/package/@office-core/exceljs)
[![npm downloads](https://img.shields.io/npm/dm/@office-core/exceljs.svg?style=flat-square)](https://www.npmjs.com/package/@office-core/exceljs)
[![CI](https://img.shields.io/github/actions/workflow/status/Rawlings/exceljs/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/Rawlings/exceljs/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D24.0.0-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A modern, high-performance evolution of ExcelJS published as [`@office-core/exceljs`](https://www.npmjs.com/package/@office-core/exceljs), carrying forward its battle-tested standard into contemporary Node.js and TypeScript environments.

- Preserves full public API parity across all workbook, worksheet, styling, and streaming operations.
- Re-architected with strict TypeScript and modern runtime standards, eliminating legacy shims and loose typing.
- Significantly leaner dependency footprint, powered by high-speed parsing and modern compression primitives.
- Optimized for high-throughput data processing and low memory overhead during large streaming jobs.
- Backed by rigorous parity verification and active maintenance for demanding production workloads.

# Documentation Index

Detailed documentation for `@office-core/exceljs` is organized into separate guides in the [`docs`](docs/) directory:

| Guide | Description |
|---|---|
| **[Getting Started & Importing](docs/getting-started.md)** | Importing syntax, ES Module usage, and browser/bundler integration. |
| **[Workbook Operations](docs/workbook.md)** | Creating workbooks, setting workbook properties, calculation properties, and workbook window views. |
| **[Worksheet Operations](docs/worksheet.md)** | Adding/removing worksheets, accessing sheets, worksheet states, properties & metrics, page setup options, headers/footers, frozen & split views, and auto-filters. |
| **[Rows, Columns & Cells](docs/rows-columns-cells.md)** | Columns setup & iteration, row getters & setters, adding/inserting/splicing/duplicating rows, cell manipulation, merged cells, defined names, data validations, cell comments, and table definitions. |
| **[Styles & Formatting](docs/styling.md)** | Number formats, font specifications, alignment settings, borders, pattern & gradient fills, rich text formatting, cell protection, conditional formatting rules, outline levels, and image insertion. |
| **[File I/O & Streaming](docs/file-io.md)** | Reading/writing XLSX and CSV files with options, plus streaming `WorkbookWriter` and `WorkbookReader`. |
| **[Value Types](docs/value-types.md)** | Null, Merge, Number, String, Date, Hyperlink, Formula (Master/Shared/Array), Rich Text, Boolean, and Error value types. |
| **[Config, Caveats & Known Issues](docs/config.md)** | Dependency injection config, build artifacts caveats, and known issues. |

For a complete table of contents with all section links, see the [Documentation Table of Contents](docs/README.md).

# Installation

Install via [npm](https://www.npmjs.com/package/@office-core/exceljs):

```shell
npm install @office-core/exceljs
```

# Contributions

Contributions are very welcome! It helps to know what features are desired or what bugs are causing pain.

If you submit a pull request for a bugfix, please add a unit test or integration test that catches the problem.

Please try to avoid modifying the package version in a PR. Versions are updated on release.

All contributions added to this library will be included in the library's MIT license.
