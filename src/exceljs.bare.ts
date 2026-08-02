// this bundle is built without polyfill leaving apps the freedom to add their own
import Workbook from '#src/doc/workbook';

const ExcelJS = {
  Workbook,
};

// Object.assign mono-fill
import Enums from '#src/doc/enums';

Object.keys(Enums).forEach((key) => {
  (ExcelJS as Record<string, any>)[key] = (Enums as Record<string, any>)[key];
});

export default ExcelJS;
