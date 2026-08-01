import Workbook from './doc/workbook';
import ModelContainer from './doc/modelcontainer';
import WorkbookWriter from './stream/xlsx/workbook-writer';
import WorkbookReader from './stream/xlsx/workbook-reader';
import Enums from './doc/enums';

const ExcelJS: Record<string, any> = {
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
