// eslint-disable-next-line no-control-regex
const xmlDecodeRegex = /[<>&'"\x7F\x00-\x08\x0B-\x0C\x0E-\x1F]/;

const utils = {
  dateToExcel(d: Date | string | number, date1904?: boolean): number {
    const dt = d instanceof Date ? d : new Date(d);
    return 25569 + dt.getTime() / (24 * 3600 * 1000) - (date1904 ? 1462 : 0);
  },

  excelToDate(v: number, date1904?: boolean): Date {
    const millisecondSinceEpoch = Math.round(
      (v - 25569 + (date1904 ? 1462 : 0)) * 24 * 3600 * 1000
    );
    return new Date(millisecondSinceEpoch);
  },

  parsePath(filepath: string): { path: string; name: string } {
    const last = filepath.lastIndexOf('/');
    return {
      path: filepath.substring(0, last),
      name: filepath.substring(last + 1),
    };
  },

  getRelsPath(filepath: string): string {
    const path = utils.parsePath(filepath);
    return `${path.path}/_rels/${path.name}.rels`;
  },

  xmlEncode(text: any): string {
    if (text === null || text === undefined) return '';
    const str = typeof text === 'string' ? text : String(text);
    const regexResult = xmlDecodeRegex.exec(str);
    if (!regexResult) return str;

    let result = '';
    let escape = '';
    let lastIndex = 0;
    let i = regexResult.index;
    for (; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      switch (charCode) {
        case 34: // "
          escape = '&quot;';
          break;
        case 38: // &
          escape = '&amp;';
          break;
        case 39: // '
          escape = '&apos;';
          break;
        case 60: // <
          escape = '&lt;';
          break;
        case 62: // >
          escape = '&gt;';
          break;
        case 127:
          escape = '';
          break;
        default: {
          if (charCode <= 31 && (charCode <= 8 || (charCode >= 11 && charCode !== 13))) {
            escape = '';
            break;
          }
          continue;
        }
      }
      if (lastIndex !== i) result += str.substring(lastIndex, i);
      lastIndex = i + 1;
      if (escape) result += escape;
    }
    if (lastIndex !== i) return result + str.substring(lastIndex, i);
    return result;
  },

  xmlEncodeText(text: any): string {
    if (text === null || text === undefined) return '';
    const str = typeof text !== 'string' ? String(text) : text;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  xmlDecode(text: string): string {
    if (!text) return '';
    return text.replace(/&([a-z]*);/g, (c: string) => {
      switch (c) {
        case '&lt;':
          return '<';
        case '&gt;':
          return '>';
        case '&amp;':
          return '&';
        case '&apos;':
          return "'";
        case '&quot;':
          return '"';
        default:
          return c;
      }
    });
  },

  validInt(value: any): number {
    const i = parseInt(value, 10);
    return !Number.isNaN(i) ? i : 0;
  },

  isDateFmt(fmt: string): boolean {
    if (!fmt) return false;
    // remove all chars inside quotes and []
    const cleaned = fmt.replace(/\[[^\]]*]/g, '').replace(/"[^"]*"/g, '');
    return /[ymdhMsb]+/.test(cleaned);
  },

  parseBoolean(value: any): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
  },

  *range(start: number, stop: number, step = 1): Generator<number> {
    const compareOrder =
      step > 0 ? (a: number, b: number) => a < b : (a: number, b: number) => a > b;
    for (let value = start; compareOrder(value, stop); value += step) {
      yield value;
    }
  },

  toSortedArray<T>(values: Iterable<T>): T[] {
    const result = Array.from(values);
    if (result.every((item) => Number.isFinite(item as unknown as number))) {
      return result.sort((a, b) => (a as unknown as number) - (b as unknown as number));
    }
    return result.sort();
  },

  objectFromProps(props: string[], value: any = null): Record<string, any> {
    return Object.fromEntries(props.map((property) => [property, value]));
  },
};

export default utils;
