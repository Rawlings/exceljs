export interface DataValidationModel {
  type: string;
  formulae?: string[];
  allowBlank?: boolean;
  showInputMessage?: boolean;
  promptTitle?: string;
  prompt?: string;
  showErrorMessage?: boolean;
  errorStyle?: string;
  errorTitle?: string;
  error?: string;
  operator?: string;
}

export class DataValidations {
  model: Record<string, DataValidationModel | undefined>;

  constructor(model?: Record<string, DataValidationModel | undefined>) {
    this.model = model || {};
  }

  add(address: string, validation: DataValidationModel): DataValidationModel {
    return (this.model[address] = validation);
  }

  find(address: string): DataValidationModel | undefined {
    return this.model[address];
  }

  remove(address: string) {
    // NB: matches original behavior exactly — sets to undefined rather than
    // deleting the key, so Object.keys(model) still includes `address`.
    this.model[address] = undefined;
  }
}

export default DataValidations;
