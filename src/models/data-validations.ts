export class DataValidations {
  model: Record<string, any>;

  constructor(model?: Record<string, any>) {
    this.model = model || {};
  }

  add(address: string, validation: any) {
    return (this.model[address] = validation);
  }

  find(address: string) {
    return this.model[address];
  }

  remove(address: string) {
    this.model[address] = undefined;
  }
}

export default DataValidations;
