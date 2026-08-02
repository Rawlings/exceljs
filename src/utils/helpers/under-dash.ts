const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
const ESCAPE_REGEX = /[&<>"']/g;

const _ = {
  each(obj: any, cb: (value: any, key: any) => void): void {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(cb);
    } else {
      Object.keys(obj).forEach((key) => cb(obj[key], key));
    }
  },

  some(obj: any, cb: (value: any, key: any) => boolean): boolean {
    if (!obj) return false;
    if (Array.isArray(obj)) {
      return obj.some(cb);
    }
    return Object.keys(obj).some((key) => cb(obj[key], key));
  },

  every(obj: any, cb: (value: any, key: any) => boolean): boolean {
    if (!obj) return true;
    if (Array.isArray(obj)) {
      return obj.every(cb);
    }
    return Object.keys(obj).every((key) => cb(obj[key], key));
  },

  map<T>(obj: any, cb: (value: any, key: any) => T): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) {
      return obj.map(cb);
    }
    return Object.keys(obj).map((key) => cb(obj[key], key));
  },

  keyBy<T extends Record<string, any>>(a: T[], p: keyof T): Record<string, T> {
    if (!Array.isArray(a)) return {};
    return Object.fromEntries(a.map((v) => [v[p], v]));
  },

  isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return a === b;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      return a.every((v, i) => _.isEqual(v, b[i]));
    }

    if (typeof a === 'object') {
      if (Array.isArray(b)) return false;
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(
        (key) => Object.prototype.hasOwnProperty.call(b, key) && _.isEqual(a[key], b[key])
      );
    }

    return false;
  },

  escapeHtml(html: any): string {
    if (html === null || html === undefined) return '';
    const str = typeof html === 'string' ? html : String(html);
    return str.replace(ESCAPE_REGEX, (ch) => HTML_ESCAPES[ch]);
  },

  strcmp(a: any, b: any): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  },

  isUndefined(val: any): boolean {
    return val === undefined;
  },

  isObject(val: any): boolean {
    return typeof val === 'object' && val !== null && !Array.isArray(val);
  },

  deepMerge(...args: any[]): any {
    const target = args[0] || {};
    for (let i = 1; i < args.length; i++) {
      const source = args[i];
      if (!source) continue;
      _.each(source, (val: any, key: any) => {
        if (val === undefined) return;
        const srcVal = target[key];
        const valIsArray = Array.isArray(val);
        const valIsObj = _.isObject(val);

        if (valIsArray) {
          const clone = Array.isArray(srcVal) ? srcVal : [];
          target[key] = _.deepMerge(clone, val);
        } else if (valIsObj) {
          const clone = _.isObject(srcVal) ? srcVal : {};
          target[key] = _.deepMerge(clone, val);
        } else {
          target[key] = val;
        }
      });
    }
    return target;
  },
};

export default _;
