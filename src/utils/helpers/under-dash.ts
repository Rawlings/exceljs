const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
const ESCAPE_REGEX = /[&<>"']/g;

type Dict<T> = Record<string, T>;

export interface EachFn {
  <T>(obj: T[] | null | undefined, cb: (value: T, key: number) => void): void;
  <T>(obj: Dict<T> | null | undefined, cb: (value: T, key: string) => void): void;
}

export interface SomeFn {
  <T>(obj: T[] | null | undefined, cb: (value: T, key: number) => boolean): boolean;
  <T>(obj: Dict<T> | null | undefined, cb: (value: T, key: string) => boolean): boolean;
}

export interface EveryFn {
  <T>(obj: T[] | null | undefined, cb: (value: T, key: number) => boolean): boolean;
  <T>(obj: Dict<T> | null | undefined, cb: (value: T, key: string) => boolean): boolean;
}

export interface MapFn {
  <T, R>(obj: T[] | null | undefined, cb: (value: T, key: number) => R): R[];
  <T, R>(obj: Dict<T> | null | undefined, cb: (value: T, key: string) => R): R[];
}

const each: EachFn = ((obj: unknown, cb: (value: unknown, key: unknown) => void): void => {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach(cb);
  } else {
    Object.keys(obj as Dict<unknown>).forEach((key) => cb((obj as Dict<unknown>)[key], key));
  }
}) as EachFn;

const some: SomeFn = ((obj: unknown, cb: (value: unknown, key: unknown) => boolean): boolean => {
  if (!obj) return false;
  if (Array.isArray(obj)) {
    return obj.some(cb);
  }
  return Object.keys(obj as Dict<unknown>).some((key) => cb((obj as Dict<unknown>)[key], key));
}) as SomeFn;

const every: EveryFn = ((obj: unknown, cb: (value: unknown, key: unknown) => boolean): boolean => {
  if (!obj) return true;
  if (Array.isArray(obj)) {
    return obj.every(cb);
  }
  return Object.keys(obj as Dict<unknown>).every((key) => cb((obj as Dict<unknown>)[key], key));
}) as EveryFn;

const map: MapFn = ((obj: unknown, cb: (value: unknown, key: unknown) => unknown): unknown[] => {
  if (!obj) return [];
  if (Array.isArray(obj)) {
    return obj.map(cb);
  }
  return Object.keys(obj as Dict<unknown>).map((key) => cb((obj as Dict<unknown>)[key], key));
}) as MapFn;

const _ = {
  each,
  some,
  every,
  map,

  keyBy<T extends Record<string, unknown>>(a: T[], p: keyof T): Record<string, T> {
    if (!Array.isArray(a)) return {};
    return Object.fromEntries(a.map((v) => [v[p], v])) as Record<string, T>;
  },

  isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return a === b;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      return a.every((v, i) => _.isEqual(v, b[i]));
    }

    if (typeof a === 'object') {
      if (Array.isArray(b)) return false;
      const objA = a as Record<string, unknown>;
      const objB = b as Record<string, unknown>;
      const keysA = Object.keys(objA);
      const keysB = Object.keys(objB);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => Object.hasOwn(objB, key) && _.isEqual(objA[key], objB[key]));
    }

    return false;
  },

  escapeHtml(html: unknown): string {
    if (html === null || html === undefined) return '';
    const str = typeof html === 'string' ? html : String(html);
    return str.replace(ESCAPE_REGEX, (ch) => HTML_ESCAPES[ch]);
  },

  strcmp(a: unknown, b: unknown): number {
    if ((a as string) < (b as string)) return -1;
    if ((a as string) > (b as string)) return 1;
    return 0;
  },

  isUndefined(val: unknown): boolean {
    return val === undefined;
  },

  isObject(val: unknown): boolean {
    return typeof val === 'object' && val !== null && !Array.isArray(val);
  },

  deepMerge<T = unknown>(...args: unknown[]): T {
    const target = (args[0] || {}) as Record<string, unknown>;
    for (let i = 1; i < args.length; i++) {
      const source = args[i];
      if (!source) continue;
      for (const [key, val] of Object.entries(source as Dict<unknown>)) {
        if (val === undefined) continue;
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
      }
    }
    return target as T;
  },
};

export default _;
