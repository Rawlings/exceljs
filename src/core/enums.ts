export enum ValueType {
  Null = 0,
  Merge = 1,
  Number = 2,
  String = 3,
  Date = 4,
  Hyperlink = 5,
  Formula = 6,
  SharedString = 7,
  RichText = 8,
  Boolean = 9,
  Error = 10,
}

export enum FormulaType {
  None = 0,
  Master = 1,
  Shared = 2,
}

export enum RelationshipType {
  None = 0,
  OfficeDocument = 1,
  Worksheet = 2,
  CalcChain = 3,
  SharedStrings = 4,
  Styles = 5,
  Theme = 6,
  Hyperlink = 7,
}

export enum DocumentType {
  Xlsx = 1,
}

export enum ReadingOrder {
  LeftToRight = 1,
  RightToLeft = 2,
}

export enum ErrorValue {
  NotApplicable = '#N/A',
  Ref = '#REF!',
  Name = '#NAME?',
  DivZero = '#DIV/0!',
  Null = '#NULL!',
  Value = '#VALUE!',
  Num = '#NUM!',
}

export enum PaperSize {
  Legal = 5,
  Executive = 7,
  A4 = 9,
  A5 = 11,
  B5 = 13,
  Envelope_10 = 20,
  Envelope_DL = 27,
  Envelope_C5 = 28,
  Envelope_B5 = 34,
  Envelope_Monarch = 37,
  Double_Japan_Postcard_Rotated = 82,
  K16_197x273_mm = 119,
}

export default {
  ValueType,
  FormulaType,
  RelationshipType,
  DocumentType,
  ReadingOrder,
  PaperSize,
  ErrorValue,
};
