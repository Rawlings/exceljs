import Workbook from '#src/doc/workbook';

const ExcelJS = {
  Workbook,
};

import Enums from '#src/doc/enums';

Object.keys(Enums).forEach((key) => {
  (ExcelJS as Record<string, any>)[key] = (Enums as Record<string, any>)[key];
});

export default ExcelJS;
