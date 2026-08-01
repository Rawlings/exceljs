// this bundle is built without polyfill leaving apps the freedom to add their own
const ExcelJS = {
  Workbook: require('./doc/workbook'),
};

// Object.assign mono-fill
import Enums from './doc/enums';

Object.keys(Enums).forEach((key) => {
  ExcelJS[key] = Enums[key];
});

export default ExcelJS;
