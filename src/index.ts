import Workbook from '#src/core/workbook';
import ModelContainer from '#src/core/modelcontainer';
import WorkbookWriter from '#src/streaming/workbook-writer';
import WorkbookReader from '#src/streaming/workbook-reader';
import * as Enums from '#src/core/enums';

export { Workbook, ModelContainer, WorkbookWriter, WorkbookReader };

export * from '#src/core/enums';

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
