import fs from 'node:fs';
import { access } from 'node:fs/promises';
import { PassThrough, Readable } from 'node:stream';
import type Workbook from '../../core/workbook';
import type Worksheet from '../../core/worksheet';

export interface FastCsvParserOptionsArgs {
  objectMode: boolean;
  delimiter: string;
  quote: string | boolean | null;
  escape: string;
  headers:
    | boolean
    | ((headers: (string | undefined | null)[]) => (string | undefined | null)[])
    | (string | undefined | null)[];
  renameHeaders: boolean;
  ignoreEmpty: boolean;
  comment: string;
  strictColumnHandling: boolean;
  discardUnmappedColumns: boolean;
  trim: boolean;
  ltrim: boolean;
  rtrim: boolean;
  encoding: BufferEncoding;
  maxRows: number;
  skipLines: number;
  skipRows: number;
}

export type QuoteColumns = boolean | boolean[] | { [s: string]: boolean };

export interface FastCsvFormatterOptionsArgs {
  objectMode: boolean;
  delimiter: string;
  rowDelimiter: string;
  quote: string | boolean;
  escape: string;
  quoteColumns: QuoteColumns;
  quoteHeaders: QuoteColumns;
  headers: null | boolean | string[];
  includeEndRowDelimiter: boolean;
  writeBOM: boolean;
  transform: (row: any, callback?: any) => any;
  alwaysWriteHeaders: boolean;
}

export interface CsvReadOptions {
  dateFormats: string[];
  encoding: string;
  map(value: any, index: number): any;
  sheetName: string;
  parserOptions: Partial<FastCsvParserOptionsArgs>;
}

export interface CsvWriteOptions {
  dateFormat: string;
  dateUTC: boolean;
  sheetName: string;
  sheetId: number;
  encoding: string;
  map(value: any, index: number): any;
  includeEmptyRows: boolean;
  formatterOptions: Partial<FastCsvFormatterOptionsArgs>;
}

async function fileExists(filename: string): Promise<boolean> {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

/* eslint-disable quote-props */
const SpecialValues: Record<string, any> = {
  true: true,
  false: false,
  '#N/A': { error: '#N/A' },
  '#REF!': { error: '#REF!' },
  '#NAME?': { error: '#NAME?' },
  '#DIV/0!': { error: '#DIV/0!' },
  '#NULL!': { error: '#NULL!' },
  '#VALUE!': { error: '#VALUE!' },
  '#NUM!': { error: '#NUM!' },
};
/* eslint-enable quote-props */

function parseCsvLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseDateNative(str: string): Date | null {
  if (!str || typeof str !== 'string') return null;
  const m = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    const d2 = new Date(`${m[3]}-${m[1]}-${m[2]}T00:00:00Z`);
    if (!Number.isNaN(d2.getTime())) return d2;
  }
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) return d;
  return null;
}

function defaultReadMap(datum: string): any {
  if (datum === '') {
    return null;
  }
  const datumNumber = Number(datum);
  if (!Number.isNaN(datumNumber) && datumNumber !== Infinity) {
    return datumNumber;
  }
  const dt = parseDateNative(datum);
  if (dt) {
    return dt;
  }
  const special = SpecialValues[datum];
  if (special !== undefined) {
    return special;
  }
  return datum;
}

function defaultWriteMap(value: any): any {
  if (value) {
    if (value.text || value.hyperlink) {
      return value.hyperlink || value.text || '';
    }
    if (value.formula || value.result) {
      return value.result || '';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (value.error) {
      return value.error;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
  }
  return value;
}

export type Csv = CSV;

export class CSV {
  workbook: Workbook;
  worksheet: Worksheet | null;

  constructor(workbook: Workbook) {
    this.workbook = workbook;
    this.worksheet = null;
  }

  async readFile(filename: string, options: Partial<CsvReadOptions> = {}): Promise<Worksheet> {
    if (!(await fileExists(filename))) {
      throw new Error(`File not found: ${filename}`);
    }
    const stream = fs.createReadStream(filename);
    const worksheet = await this.read(stream, options);
    stream.close();
    return worksheet;
  }

  read(stream: Readable, options: Partial<CsvReadOptions> = {}): Promise<Worksheet> {
    return new Promise((resolve, reject) => {
      const worksheet = this.workbook.addWorksheet(options.sheetName);
      const delimiter = options.parserOptions?.delimiter || ',';
      const map = options.map || defaultReadMap;

      let buffer = '';
      stream.on('data', (chunk: any) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.length === 0) continue;
          const parsed = parseCsvLine(line, delimiter);
          worksheet.addRow(parsed.map(map));
        }
      });

      stream.on('end', () => {
        if (buffer.length > 0) {
          const parsed = parseCsvLine(buffer, delimiter);
          worksheet.addRow(parsed.map(map));
        }
        resolve(worksheet);
      });

      stream.on('error', reject);
    });
  }

  createInputStream(): never {
    throw new Error('`CSV#createInputStream` is deprecated. You should use `CSV#read` instead.');
  }

  write(stream: NodeJS.WritableStream, options: Partial<CsvWriteOptions> = {}): Promise<void> {
    return new Promise((resolve) => {
      const worksheet = this.workbook.getWorksheet(
        options.sheetName || (options.sheetId as number)
      );
      const delimiter = options.formatterOptions?.delimiter || ',';
      const map = options.map || defaultWriteMap;

      const formatField = (field: any) => {
        const str = field === null || field === undefined ? '' : String(field);
        if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const includeEmptyRows = options.includeEmptyRows === undefined || options.includeEmptyRows;
      let lastRow = 1;

      if (worksheet) {
        worksheet.eachRow((row: any, rowNumber: number) => {
          if (includeEmptyRows) {
            while (lastRow++ < rowNumber - 1) {
              stream.write('\n');
            }
          }
          const { values } = row;
          values.shift();
          const line = values.map(map).map(formatField).join(delimiter) + '\n';
          stream.write(line);
          lastRow = rowNumber;
        });
      }

      if (typeof stream.end === 'function') {
        stream.end();
      }
      resolve(undefined);
    });
  }

  writeFile(filename: string, options: Partial<CsvWriteOptions> = {}): Promise<void> {
    const streamOptions = {
      encoding: (options.encoding || 'utf8') as BufferEncoding,
    };
    const stream = fs.createWriteStream(filename, streamOptions);
    return this.write(stream, options);
  }

  async writeBuffer(options: Partial<CsvWriteOptions> = {}): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const stream = new PassThrough();
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    await this.write(stream, options);
    return Buffer.concat(chunks);
  }
}

export default CSV;
