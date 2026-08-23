# Getting Started & Importing[⬆](../README.md#contents)

[`@office-core/exceljs`](https://www.npmjs.com/package/@office-core/exceljs) is published to npm as a native ES Module (`type: "module"`).

## Installation

```shell
npm install @office-core/exceljs
```

## Importing

```javascript
import ExcelJS from '@office-core/exceljs';
// Or named imports:
import { Workbook, WorkbookWriter, WorkbookReader } from '@office-core/exceljs';
```

## Browser and Bundlers[⬆](../README.md#contents)

`@office-core/exceljs` targets Node.js 24+ and modern ES2024 environments. When using `@office-core/exceljs` in browser or client-side applications, import via standard ES Module syntax and bundle with modern tools such as Vite, Webpack, Rollup, or esbuild.
