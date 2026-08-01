const ExcelJS = {
  Workbook: require('./doc/workbook'),
};

import Enums from './doc/enums';

Object.keys(Enums).forEach((key) => {
  ExcelJS[key] = Enums[key];
});

export default ExcelJS;
