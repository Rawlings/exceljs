import Workbook from './doc/workbook';

const ExcelJS = {
  Workbook,
};

import Enums from './doc/enums';

Object.keys(Enums).forEach((key) => {
  (ExcelJS as Record<string, any>)[key] = (Enums as Record<string, any>)[key];
});

export default ExcelJS;
