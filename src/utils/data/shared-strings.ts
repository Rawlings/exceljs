class SharedStrings {
  private _values: any[];
  private _totalRefs: number;
  private _hash: Record<string, number>;

  constructor() {
    this._values = [];
    this._totalRefs = 0;
    this._hash = Object.create(null);
  }

  get count(): number {
    return this._values.length;
  }

  get values(): any[] {
    return this._values;
  }

  get totalRefs(): number {
    return this._totalRefs;
  }

  getString(index: number): any {
    return this._values[index];
  }

  add(value: any): number {
    const key = typeof value === 'object' ? JSON.stringify(value) : String(value);
    let index = this._hash[key];
    if (index === undefined) {
      index = this._values.length;
      this._hash[key] = index;
      this._values.push(value);
    }
    this._totalRefs++;
    return index;
  }
}

export default SharedStrings;
