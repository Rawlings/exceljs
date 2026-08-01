import XLSX from '../xlsx/xlsx';

export class ModelContainer {
  model: any;
  private _xlsx: any;

  constructor(model: any) {
    this.model = model;
  }

  get xlsx() {
    if (!this._xlsx) {
      this._xlsx = new XLSX(this);
    }
    return this._xlsx;
  }
}

export default ModelContainer;
