import ExcelJS from '#src/index';

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
