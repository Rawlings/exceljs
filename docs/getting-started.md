# Importing[⬆](../README.md#contents)

ExcelJS is published as a native ES Module (`type: "module"`).

```javascript
import ExcelJS from 'exceljs';
// Or named imports:
import { Workbook, WorkbookWriter, WorkbookReader } from 'exceljs';
```

## Browser and Bundlers[⬆](../README.md#contents)

ExcelJS targets Node.js 24+ and modern ES2024 environments. When using ExcelJS in browser or client-side applications, import via standard ES Module syntax and bundle with modern tools such as Vite, Webpack, Rollup, or esbuild.

