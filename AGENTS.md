# AGENTS.md - ExcelJS Modernization Guidelines (2026 Standards)

## Core Philosophy
We are modernizing ExcelJS with **0 breaking changes** to the public API or downstream consumers. We are migrating the codebase to modern TypeScript (ES2024 / Node 24+ native standards) while removing legacy bloat, dead code, and obsolete patterns.

---

## Technical Stack & Standards (2026)

1. **Language & Environment**:
   - TypeScript (strict mode targeting `ES2024`).
   - Node.js `24+` native capabilities (`fs/promises`, native `fetch`, built-in utilities).

2. **Module Architecture & System**:
   - Use clean **ES Module semantics** (`import` / `export`) throughout `src/`.
   - **DO NOT mix CommonJS and ESM exports**: Avoid anti-patterns like dual-exporting `export default ClassName; module.exports = ClassName;` in the same file.
   - For backwards-compatible CommonJS entrypoints, handle module bundling via build tools (e.g. `tsup`, `esbuild`, or `rollup`), NOT by polluting TypeScript source files with legacy `module.exports`.

3. **Tooling & Quality**:
   - **oxlint** for linting with strict category rules (`"correctness": "error"`, `"suspicious": "error"`, `"perf": "error"`).
   - **oxfmt** for code formatting (`npm run format`).
   - **vitest** for unit and integration testing (`npm run test`).
   - **tsc** for strict type checking (`npm run typecheck`).

---

## Mandatory Rules & Guidelines

### 1. No Dual / Mixed Module Exports
- **BAD**:
  ```ts
  export default CSV;
  module.exports = CSV;
  ```
- **GOOD**:
  ```ts
  export default CSV;
  // OR named exports:
  export { CSV };
  ```

### 2. Modern Native Node APIs
- Use `fs/promises` (`access`, `readFile`, `writeFile`, `mkdir`) over sync methods or legacy custom promise wrappers (such as `utils.fs.exists`).
- Prefer native `Date`, `BigInt`, and `Array.from` over legacy helper wrappers or `new Array(size).fill(...)`.

### 3. Strict Code & Architecture Organization
- **No Data / Mock JSON Files in `src/`**: All sample JSON, mock XML, theme definitions, or analysis data must live in root `fixtures/` (e.g. `fixtures/doc-data/`).
- **No Dead Code**: Instantly eliminate unused files, empty placeholders, or abandoned work-in-progress scripts (e.g. `line-buffer.js`, `stream-converter.js`).
- **No Sparse Arrays for Cell Values**: Avoid unexpected sparse array commas in test suites or cell mappings.

### 4. Verification Workflow
Before declaring any task or step complete, ALWAYS ensure:
1. `npm run typecheck` passes cleanly without compiler errors.
2. `npm run lint` passes cleanly with 0 errors.
3. `npm run format` has been executed.

### 5. Public API Scope & Refactoring Boundaries

#### WHAT YOU CANNOT DO (Strict Prohibitions):
- ❌ **DO NOT modify top-level public API exports or package entrypoints**:
  - Main entry points in `package.json` (`exports`, `main`, `module`, `types`) must remain intact.
  - Publicly exported top-level exports in `src/index.ts` / `src/index.d.ts` (`Workbook`, `ModelContainer`, `WorkbookWriter`, `WorkbookReader`, `Enums`, `export default ExcelJS`) MUST NOT be deleted, renamed, or break signatures.
- ❌ **DO NOT alter public instance methods or interface signatures**:
  - Any method or property declared on `Workbook`, `Worksheet`, `Row`, `Column`, `Cell`, `WorkbookWriter`, or `WorkbookReader` in `src/index.d.ts` is public API. Changing parameters, return types, or public method behavior is strictly forbidden.
- ❌ **DO NOT introduce breaking changes to downstream consumer code**:
  - Existing external code consuming `const wb = new ExcelJS.Workbook()` or `import { WorkbookWriter } from 'exceljs'` must work identically without modifications.

#### WHAT YOU CAN DO (Allowed Modernization & Refactoring):
- ✅ **DO refactor internal modules freely**:
  - Everything inside `src/utils/*`, `src/xlsx/xform/*`, `src/csv/*`, and non-exported helper files is internal implementation detail.
  - You may rename, split, rewrite, combine, or modernize internal functions/classes as long as top-level public API signatures and behaviors remain 100% backwards compatible.
- ✅ **DO replace legacy code with native ES2024 / Node 24+ APIs**:
  - Replace custom legacy promise wrappers, lodash-like helpers, or sync filesystem code with native Node APIs (`fs/promises`, native `fetch`, native `BigInt`, `Array.from`, etc.).
- ✅ **DO delete internal dead code and unused files**:
  - Safely remove unused internal files, abandoned helpers, dead utility scripts, or legacy shims not exposed in the public API.
- ✅ **DO convert internal code to modern TypeScript**:
  - Upgrade internal files to strict TypeScript, add explicit types, and remove implicit `any` annotations.


