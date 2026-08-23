# Config[⬆](../README.md#contents)<!-- Link generated with jump2header -->

ExcelJS natively targets Node.js 24+ and ES2024 environments using standard JavaScript `Promise` objects for all asynchronous operations. Legacy promise library configuration options (such as Bluebird dependency injection) are obsolete and no longer required or supported.

# Caveats[⬆](../README.md#contents)<!-- Link generated with jump2header -->

## Dist Folder[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Source code is compiled with TypeScript into standard ES Modules (`type: "module"`) in the `dist/` directory.

Main package entrypoints specified in `package.json`:
- `import`: `./dist/index.js`
- `types`: `./dist/index.d.ts`

When consuming ExcelJS in browser or bundler environments, import via standard ES module syntax or rely on modern bundlers (such as Vite, Webpack, Rollup, or esbuild).

# Known Issues[⬆](../README.md#contents)<!-- Link generated with jump2header -->

## Splice vs Merge[⬆](../README.md#contents)<!-- Link generated with jump2header -->

If a `spliceRows` or `spliceColumns` operation intersects or affects a merged cell range, the merged cell group coordinates may not be adjusted automatically. When splicing worksheets containing merged cells, verify or re-apply merged ranges after splicing.
