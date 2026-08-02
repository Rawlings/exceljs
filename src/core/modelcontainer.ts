import XLSX from '../formats/xlsx/xlsx';
import type Workbook from './workbook';

export class ModelContainer {
  model: unknown;
  private _xlsx: XLSX | undefined;

  constructor(model: unknown) {
    this.model = model;
  }

  get xlsx(): XLSX {
    if (!this._xlsx) {
      // ModelContainer stands in for a Workbook here: XLSX only ever reads
      // `.model` off what it's given (see xlsx.ts's write()/load()), which
      // this class also exposes.
      this._xlsx = new XLSX(this as unknown as Workbook);
    }
    return this._xlsx;
  }
}

export default ModelContainer;
