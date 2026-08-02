class TypedStack<T> {
  private _type: new (...args: any[]) => T;
  private _stack: T[];

  constructor(type: new (...args: any[]) => T) {
    this._type = type;
    this._stack = [];
  }

  get size(): number {
    return this._stack.length;
  }

  pop(): T {
    const tos = this._stack.pop();
    return tos || new this._type();
  }

  push(instance: T): void {
    if (!(instance instanceof this._type)) {
      throw new Error('Invalid type pushed to TypedStack');
    }
    this._stack.push(instance);
  }
}

export default TypedStack;
