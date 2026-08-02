import Workbook from '#src/doc/workbook';
import ModelContainer from '#src/doc/modelcontainer';
import WorkbookWriter from '#src/stream/xlsx/workbook-writer';
import WorkbookReader from '#src/stream/xlsx/workbook-reader';
import Enums from '#src/doc/enums';

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
