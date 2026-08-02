class SharedStrings {
  private _values: unknown[];
  private _totalRefs: number;
  private _hash: Map<string, number>;

  constructor() {
    this._values = [];
    this._totalRefs = 0;
    this._hash = new Map<string, number>();
  }

  get count() {
    return this._values.length;
  }

  get values() {
    return this._values;
  }

  get totalRefs() {
    return this._totalRefs;
  }

  getString(index: number): unknown {
    return this._values[index];
  }

  add(value: unknown): number {
    const key = typeof value === 'object' ? JSON.stringify(value) : String(value);
    let index = this._hash.get(key);
    if (index === undefined) {
      index = this._values.length;
      this._hash.set(key, index);
      this._values.push(value);
    }
    this._totalRefs++;
    return index;
  }
}

export default SharedStrings;
