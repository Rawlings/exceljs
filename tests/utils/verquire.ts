import ExcelJS from '#src/exceljs.nodejs';

const libs: Record<string, any> = {
  exceljs: ExcelJS,
};

export default function verquire(path: string) {
  if (!libs[path]) {
    try {
      libs[path] = ExcelJS;
    } catch {
      libs[path] = ExcelJS;
    }
  }
  return libs[path];
}
