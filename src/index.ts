import Workbook from './doc/workbook';
import ModelContainer from './doc/modelcontainer';
import WorkbookWriter from './stream/xlsx/workbook-writer';
import WorkbookReader from './stream/xlsx/workbook-reader';
import * as Enums from './doc/enums';

export { Workbook, ModelContainer, WorkbookWriter, WorkbookReader };

export * from './doc/enums';

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
