import XLSX from '../formats/xlsx/xlsx';

export class ModelContainer {
  model: unknown;
  private _xlsx: XLSX | undefined;

  constructor(model: unknown) {
    this.model = model;
  }

  get xlsx(): XLSX {
    if (!this._xlsx) {
      this._xlsx = new XLSX(this as any);
    }
    return this._xlsx;
  }
}

export default ModelContainer;
