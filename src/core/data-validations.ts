export type DataValidationOperator =
  | 'between'
  | 'notBetween'
  | 'equal'
  | 'notEqual'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

export interface DataValidation {
  type: 'list' | 'whole' | 'decimal' | 'date' | 'textLength' | 'custom';
  // any[]: matches the public API contract in fixtures/parity.d.ts
  // oxlint-disable-next-line typescript/no-explicit-any
  formulae: any[];
  allowBlank?: boolean;
  operator?: DataValidationOperator;
  error?: string;
  errorTitle?: string;
  errorStyle?: string;
  prompt?: string;
  promptTitle?: string;
  showErrorMessage?: boolean;
  showInputMessage?: boolean;
}

export class DataValidations {
  model: Record<string, DataValidation | undefined>;

  constructor(model?: Record<string, DataValidation | undefined> | Record<string, unknown>) {
    this.model = (model ?? {}) as Record<string, DataValidation | undefined>;
  }

  add(address: string, validation: DataValidation): DataValidation {
    return (this.model[address] = validation);
  }

  find(address: string): DataValidation | undefined {
    return this.model[address];
  }

  remove(address: string) {
    // NB: matches original behavior exactly — sets to undefined rather than
    // deleting the key, so Object.keys(model) still includes `address`.
    this.model[address] = undefined;
  }
}

export default DataValidations;
