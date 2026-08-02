import Workbook from './core/workbook';
import ModelContainer from './core/modelcontainer';
import WorkbookWriter from './streaming/workbook-writer';
import WorkbookReader from './streaming/workbook-reader';
import * as Enums from './core/enums';

export { Workbook, ModelContainer, WorkbookWriter, WorkbookReader };

export * from './core/enums';

const ExcelJS = {
  Workbook,
  ModelContainer,
  stream: {
    xlsx: {
      WorkbookWriter,
      WorkbookReader,
    },
  },
  ...Enums,
};

export default ExcelJS;
