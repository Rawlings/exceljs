# ExcelJS

[![Build Status](https://github.com/exceljs/exceljs/actions/workflows/tests.yml/badge.svg?branch=master&event=push)](https://github.com/exceljs/exceljs/actions/workflows/tests.yml)

Read, manipulate and write spreadsheet data and styles to XLSX and JSON.

Reverse engineered from Excel spreadsheet files as a project.

# Translations

* [中文文档](README_zh.md)

# Installation

```shell
npm install exceljs
```

# Contributions

Contributions are very welcome! It helps me know what features are desired or what bugs are causing the most pain.

I have just one request; If you submit a pull request for a bugfix, please add a unit-test or integration-test (in the spec folder) that catches the problem.
 Even a PR that just has a failing test is fine - I can analyse what the test is doing and fix the code from that.

Note: Please try to avoid modifying the package version in a PR.
Versions are updated on release and any change will most likely result in merge collisions.

To be clear, all contributions added to this library will be included in the library's MIT licence.

### Let's chat together:

[![SiemaTeam](https://discordapp.com/api/guilds/976854442009825321/widget.png?style=banner2)](https://discord.gg/siema)

# Contents

<ul>
  <li><a href="docs/getting-started.md#importing">Importing</a></li>
  <li>
    <a href="docs/workbook.md">Interface</a>
    <ul>
      <li><a href="docs/workbook.md#create-a-workbook">Create a Workbook</a></li>
      <li><a href="docs/workbook.md#set-workbook-properties">Set Workbook Properties</a></li>
      <li><a href="docs/workbook.md#workbook-views">Workbook Views</a></li>
      <li><a href="docs/worksheet.md#add-a-worksheet">Add a Worksheet</a></li>
      <li><a href="docs/worksheet.md#remove-a-worksheet">Remove a Worksheet</a></li>
      <li><a href="docs/worksheet.md#access-worksheets">Access Worksheets</a></li>
      <li><a href="docs/worksheet.md#worksheet-state">Worksheet State</a></li>
      <li><a href="docs/worksheet.md#worksheet-properties">Worksheet Properties</a></li>
      <li><a href="docs/worksheet.md#page-setup">Page Setup</a></li>
      <li><a href="docs/worksheet.md#headers-and-footers">Headers and Footers</a></li>
      <li>
        <a href="docs/worksheet.md#worksheet-views">Worksheet Views</a>
        <ul>
          <li><a href="docs/worksheet.md#frozen-views">Frozen Views</a></li>
          <li><a href="docs/worksheet.md#split-views">Split Views</a></li>
        </ul>
      </li>
      <li><a href="docs/worksheet.md#auto-filters">Auto Filters</a></li>
      <li><a href="docs/rows-columns-cells.md#columns">Columns</a></li>
      <li><a href="docs/rows-columns-cells.md#rows">Rows</a>
        <ul>
          <li><a href="docs/rows-columns-cells.md#add-rows">Add Rows</a></li>
          <li><a href="docs/rows-columns-cells.md#handling-individual-cells">Handling Individual Cells</a></li>
          <li><a href="docs/rows-columns-cells.md#merged-cells">Merged Cells</a></li>
          <li><a href="docs/rows-columns-cells.md#insert-rows">Insert Rows</a></li>
          <li><a href="docs/rows-columns-cells.md#splice">Splice</a></li>
          <li><a href="docs/rows-columns-cells.md#duplicate-a-row">Duplicate Row</a></li>
        </ul>
      </li>
      <li><a href="docs/rows-columns-cells.md#defined-names">Defined Names</a></li>
      <li><a href="docs/rows-columns-cells.md#data-validations">Data Validations</a></li>
      <li><a href="docs/rows-columns-cells.md#cell-comments">Cell Comments</a></li>
      <li><a href="docs/rows-columns-cells.md#tables">Tables</a></li>
      <li><a href="docs/styling.md#styles">Styles</a>
        <ul>
          <li><a href="docs/styling.md#number-formats">Number Formats</a></li>
          <li><a href="docs/styling.md#fonts">Fonts</a></li>
          <li><a href="docs/styling.md#alignment">Alignment</a></li>
          <li><a href="docs/styling.md#borders">Borders</a></li>
          <li><a href="docs/styling.md#fills">Fills</a></li>
          <li><a href="docs/styling.md#rich-text">Rich Text</a></li>
        </ul>
      </li>
      <li><a href="docs/styling.md#conditional-formatting">Conditional Formatting</a></li>
      <li><a href="docs/styling.md#outline-levels">Outline Levels</a></li>
      <li><a href="docs/styling.md#images">Images</a></li>
      <li><a href="docs/styling.md#sheet-protection">Sheet Protection</a></li>
      <li><a href="docs/file-io.md#file-io">File I/O</a>
        <ul>
          <li><a href="docs/file-io.md#xlsx">XLSX</a>
            <ul>
              <li><a href="docs/file-io.md#reading-xlsx">Reading XLSX</a></li>
              <li><a href="docs/file-io.md#writing-xlsx">Writing XLSX</a></li>
            </ul>
          </li>
          <li><a href="docs/file-io.md#csv">CSV</a>
            <ul>
              <li><a href="docs/file-io.md#reading-csv">Reading CSV</a></li>
              <li><a href="docs/file-io.md#writing-csv">Writing CSV</a></li>
            </ul>
          </li>
          <li><a href="docs/file-io.md#streaming-io">Streaming I/O</a>
            <ul>
              <li><a href="docs/file-io.md#streaming-xlsx">Streaming XLSX</a></li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </li>
  <li><a href="docs/file-io.md#browser">Browser</a></li>
  <li>
    <a href="docs/value-types.md#value-types">Value Types</a>
    <ul>
      <li><a href="docs/value-types.md#null-value">Null Value</a></li>
      <li><a href="docs/value-types.md#merge-cell">Merge Cell</a></li>
      <li><a href="docs/value-types.md#number-value">Number Value</a></li>
      <li><a href="docs/value-types.md#string-value">String Value</a></li>
      <li><a href="docs/value-types.md#date-value">Date Value</a></li>
      <li><a href="docs/value-types.md#hyperlink-value">Hyperlink Value</a></li>
      <li>
        <a href="docs/value-types.md#formula-value">Formula Value</a>
        <ul>
          <li><a href="docs/value-types.md#shared-formula">Shared Formula</a></li>
          <li><a href="docs/value-types.md#formula-type">Formula Type</a></li>
          <li><a href="docs/value-types.md#array-formula">Array Formula</a></li>
        </ul>
      </li>
      <li><a href="docs/value-types.md#rich-text-value">Rich Text Value</a></li>
      <li><a href="docs/value-types.md#boolean-value">Boolean Value</a></li>
      <li><a href="docs/value-types.md#error-value">Error Value</a></li>
    </ul>
  </li>
  <li><a href="docs/config.md#config">Config</a></li>
  <li><a href="docs/config.md#known-issues">Known Issues</a></li>
</ul>

# Documentation Index

Detailed documentation for ExcelJS is organized into separate guides in the [`docs`](docs/) directory:

- 🚀 **[Getting Started & Importing](docs/getting-started.md)**: Importing syntax, ES5 transpiled imports, polyfill instructions, and Browserify usage.
- 📘 **[Workbook Operations](docs/workbook.md)**: Creating workbooks, setting workbook properties, calculation properties, and workbook window views.
- 📄 **[Worksheet Operations](docs/worksheet.md)**: Adding/removing worksheets, accessing sheets, worksheet states, properties & metrics, page setup options, headers/footers, frozen & split views, and auto-filters.
- 📊 **[Rows, Columns & Cells](docs/rows-columns-cells.md)**: Columns setup & iteration, row getters & setters, adding/inserting/splicing/duplicating rows, cell manipulation, merged cells, defined names, data validations, cell comments, and table definitions.
- 🎨 **[Styles & Formatting](docs/styling.md)**: Number formats, font specifications, alignment settings, borders, pattern & gradient fills, rich text formatting, cell protection, conditional formatting rules, outline levels, and image insertion.
- 💾 **[File I/O & Streaming](docs/file-io.md)**: Reading/writing XLSX and CSV files with options, plus streaming `WorkbookWriter` and `WorkbookReader`.
- 🔣 **[Value Types](docs/value-types.md)**: Null, Merge, Number, String, Date, Hyperlink, Formula (Master/Shared/Array), Rich Text, Boolean, and Error value types.
- ⚙️ **[Config, Caveats & Known Issues](docs/config.md)**: Dependency injection config, build artifacts caveats, and known issues.

