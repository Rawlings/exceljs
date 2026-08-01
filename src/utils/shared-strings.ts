class SharedStrings {
  _values: any[];
  _totalRefs: number;
  _hash: any;

  constructor() {
    this._values = [];
    this._totalRefs = 0;
    this._hash = Object.create(null);
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

  getString(index: any) {
    return this._values[index];
  }

  add(value: any) {
    let index = this._hash[value];
    if (index === undefined) {
      index = this._hash[value] = this._values.length;
      this._values.push(value);
    }
    this._totalRefs++;
    return index;
  }
}

export default SharedStrings;
