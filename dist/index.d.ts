import Workbook from './doc/workbook';
import ModelContainer from './doc/modelcontainer';
import WorkbookWriter from './stream/xlsx/workbook-writer';
import WorkbookReader from './stream/xlsx/workbook-reader';
import * as Enums from './doc/enums';
export { Workbook, ModelContainer, WorkbookWriter, WorkbookReader };
export * from './doc/enums';
declare const ExcelJS: {
    ValueType: typeof Enums.ValueType;
    FormulaType: typeof Enums.FormulaType;
    RelationshipType: typeof Enums.RelationshipType;
    DocumentType: typeof Enums.DocumentType;
    ReadingOrder: typeof Enums.ReadingOrder;
    ErrorValue: {
        readonly NotApplicable: '#N/A';
        readonly Ref: '#REF!';
        readonly Name: '#NAME?';
        readonly DivZero: '#DIV/0!';
        readonly Null: '#NULL!';
        readonly Value: '#VALUE!';
        readonly Num: '#NUM!';
    };
    default: {
        ValueType: typeof Enums.ValueType;
        FormulaType: typeof Enums.FormulaType;
        RelationshipType: typeof Enums.RelationshipType;
        DocumentType: typeof Enums.DocumentType;
        ReadingOrder: typeof Enums.ReadingOrder;
        ErrorValue: {
            readonly NotApplicable: '#N/A';
            readonly Ref: '#REF!';
            readonly Name: '#NAME?';
            readonly DivZero: '#DIV/0!';
            readonly Null: '#NULL!';
            readonly Value: '#VALUE!';
            readonly Num: '#NUM!';
        };
    };
    Workbook: typeof Workbook;
    ModelContainer: typeof ModelContainer;
    stream: {
        xlsx: {
            WorkbookWriter: typeof WorkbookWriter;
            WorkbookReader: typeof WorkbookReader;
        };
    };
};
export default ExcelJS;
