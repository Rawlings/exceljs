import Workbook from '#src/models/workbook';
import ModelContainer from '#src/models/modelcontainer';
import WorkbookWriter from '#src/stream/xlsx/workbook-writer';
import WorkbookReader from '#src/stream/xlsx/workbook-reader';
import * as Enums from '#src/models/enums';

export { Workbook, ModelContainer, WorkbookWriter, WorkbookReader };

export * from '#src/models/enums';

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
