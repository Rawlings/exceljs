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

### 6. Type Safety: Banning `any` (enforced via `.oxlintrc.json` → `typescript/no-explicit-any: "error"`)

This rule is on repo-wide. Below is what we learned actually fixing the ~900 pre-existing violations — read before touching another file with `any` in it.

#### Where `any` is genuinely out of scope (do not attempt file-by-file)
- **`src/formats/xlsx/xml/base-xform.ts`**: `model`/`_model`/`map` are deliberately `any`. ~115 xform subclasses each store a different, freely-accessed model shape through this single base class. Typing it requires typing the base class *and every subclass* in one coordinated pass — not a per-file fix. The file has a comment explaining this; don't remove it without doing that full pass.
- **`src/core/internal-types.ts`**: forward-declared `*Like` interfaces (`CellLike`, `RowLike`, `ColumnLike`, `WorksheetLike`, `WorkbookLike`) bridging the circular Cell↔Row↔Column↔Worksheet↔Workbook reference graph. Tried tightening `any`→cross-referenced types here once: it cascaded ~80 new errors across `worksheet.ts`, `row.ts`, `table.ts`, `column.ts`, `cell.ts`, `workbook.ts`, because the *concrete* classes' real method signatures aren't structurally compatible with each other (that incompatibility is exactly why `any` was used as the bridge). Reverted. Same "type the whole circular/polymorphic unit together" problem as base-xform.ts. Leave it.
- Rule of thumb: if a file's own comments say "intentionally `any` because N subclasses/callers depend on this shape," believe it and skip it — verify by trying, but revert fast (within one file's edit) if the ripple leaves the boundary file you're working on.

#### Where it's a normal file-by-file fix (the common case)
Everywhere else, `any` was just unaudited code. Fix pattern:
1. Find or define the real model/options interface for that xform/module (many already exist as `export interface XModel` next to sibling xforms — grep before inventing a new one).
2. Two ends of the same pipeline (e.g. `prepare()`/write-path vs. `reconcile()`/read-path options) are often **not** the same shape even though they reuse field names (e.g. `comments` is a fresh array being built during `prepare()` but a lookup hash during `reconcile()`). Split into two option interfaces rather than forcing one union.
3. Run `npm run typecheck` and `npm run lint` after every file — fix ripple immediately, don't batch multiple files unverified.

#### The recurring TS gotcha at file boundaries
Two independently-defined interfaces describing the *same runtime object* from two different files (e.g. `xlsx.ts`'s `ParseWorksheetModel` vs. `worksheet-xform.ts`'s `WorksheetXformModel`) are usually **not structurally assignable** even when compatible in practice, because:
- Neither has a `[key: string]: unknown` index signature (adding one to both isn't always possible/desirable), and TS requires matching index signatures for that kind of cross-assignment, OR
- One side's optional field graph doesn't line up 1:1 (e.g. `columns: TableColumnModel[]` vs `columns: Record<string, unknown>[]`).

Fix: cast at the call site with a short comment, not by weakening either type back to `any`:
```ts
worksheetXform.reconcile(
  worksheet as unknown as WorksheetXformModel,
  sheetOptions as unknown as Parameters<typeof worksheetXform.reconcile>[1] // grabs the type without needing it exported
);
```
`Parameters<typeof someInstance.someMethod>[n]` is a clean way to reference a non-exported parameter type instead of exporting one more interface just for a cast.

#### Public API is the hard boundary — verify, don't assume
- `src/temp.d.ts` (pre-refactor reference types, not compiled/imported — will be deleted) and `fixtures/parity.d.ts` (compiled against `src/index.ts` in `tests/unit/type-parity-ast.spec.ts`) are both **source-of-truth for the public API shape**, not just docs. If a public-facing option/type is declared `any` there on purpose (e.g. `CsvReadOptions.map(value: any, index): any` — mirrors fast-csv's own loose typing), keep it `any` at that exact boundary with a `// oxlint-disable-next-line typescript/no-explicit-any` + comment explaining why, rather than narrowing it — narrowing a public contract is a breaking change even if it looks like a strict improvement.
- **Always run `npx vitest run tests/unit/type-parity-ast.spec.ts` after touching anything that could affect public exports.** It diffs `src/index.ts`'s actual exported shape against `fixtures/parity.d.ts` 1:1 (property names, optionality, enum values). `npm run typecheck` passing does NOT catch a required property silently becoming optional — only this test does.

#### Process notes
- Only `npm run typecheck`, `npm run lint`, and `npx vitest run tests/unit/type-parity-ast.spec.ts` are approved verification commands in this workflow — no ad-hoc scripts/one-off node invocations even for quick checks.
- Before editing a file, check whether its current typecheck errors are pre-existing (unrelated background/other-session drift) vs. ones you just introduced: `git diff --stat <file>` — if it shows changes you didn't make this turn, the errors in it aren't yours to fix as part of this task.

