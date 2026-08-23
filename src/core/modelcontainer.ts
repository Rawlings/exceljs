import { XLSX } from '../formats/xlsx/xlsx';

export class ModelContainer {
  model: unknown;
  private _xlsx: XLSX | undefined;

  constructor(model: unknown) {
    this.model = model;
  }

  get xlsx(): XLSX {
    this._xlsx ??= new XLSX(this);
    return this._xlsx;
  }
}

export default ModelContainer;
