class TypedStack {
  _type: any;
  _stack: any[];

  constructor(type: any) {
    this._type = type;
    this._stack = [];
  }

  get size() {
    return this._stack.length;
  }

  pop() {
    const tos = this._stack.pop();
    return tos || new this._type();
  }

  push(instance: any) {
    if (!(instance instanceof this._type)) {
      throw new Error('Invalid type pushed to TypedStack');
    }
    this._stack.push(instance);
  }
}

export default TypedStack;
