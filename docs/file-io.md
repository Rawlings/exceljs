# File I/O[⬆](../README.md#contents)<!-- Link generated with jump2header -->

## XLSX[⬆](../README.md#contents)<!-- Link generated with jump2header -->

### Reading XLSX[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Options supported when reading XLSX files.

| Field            |  Required   |    Type     |Description  |
| ---------------- | ----------- | ----------- | ----------- |
| ignoreNodes      |     N       |  Array      | A list of node names to ignore while loading the XLSX document. Improves performance in some situations. <br/> Available: `sheetPr`, `dimension`, `sheetViews `, `sheetFormatPr`, `cols `, `sheetData`, `autoFilter `, `mergeCells `, `rowBreaks`, `hyperlinks `, `pageMargins`, `dataValidations`, `pageSetup`, `headerFooter `, `printOptions `, `picture`, `drawing`, `sheetProtection`, `tableParts `, `conditionalFormatting`, `extLst`,|

```javascript
// read from a file
const workbook = new Excel.Workbook();
await workbook.xlsx.readFile(filename);
// ... use workbook


// read from a stream
const workbook = new Excel.Workbook();
await workbook.xlsx.read(stream);
// ... use workbook


// load from buffer
const workbook = new Excel.Workbook();
await workbook.xlsx.load(data);
// ... use workbook


// using additional options
const workbook = new Excel.Workbook();
await workbook.xlsx.load(data, {
  ignoreNodes: [
    'dataValidations' // ignores the workbook's Data Validations
  ],
});
// ... use workbook
```

### Writing XLSX[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// write to a file
const workbook = createAndFillWorkbook();
await workbook.xlsx.writeFile(filename);

// write to a stream
await workbook.xlsx.write(stream);

// write to a new buffer
const buffer = await workbook.xlsx.writeBuffer();
```

## CSV[⬆](../README.md#contents)<!-- Link generated with jump2header -->

### Reading CSV[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Options supported when reading CSV files.

| Field            |  Required   |    Type     |Description  |
| ---------------- | ----------- | ----------- | ----------- |
| dateFormats      |     N       |  Array      | Specify the date encoding format of dayjs. |
| map              |     N       |  Function   | Custom Array.prototype.map() callback function for processing data. |
| sheetName        |     N       |  String     | Specify worksheet name. |
| parserOptions    |     N       |  Object     | [parseOptions options](https://c2fo.github.io/fast-csv/docs/parsing/options)  @fast-csv/format module to write csv data. |

```javascript
// read from a file
const workbook = new Excel.Workbook();
const worksheet = await workbook.csv.readFile(filename);
// ... use workbook or worksheet


// read from a stream
const workbook = new Excel.Workbook();
const worksheet = await workbook.csv.read(stream);
// ... use workbook or worksheet


// read from a file with European Dates
const workbook = new Excel.Workbook();
const options = {
  dateFormats: ['DD/MM/YYYY']
};
const worksheet = await workbook.csv.readFile(filename, options);
// ... use workbook or worksheet


// read from a file with custom value parsing
const workbook = new Excel.Workbook();
const options = {
  map(value, index) {
    switch(index) {
      case 0:
        // column 1 is string
        return value;
      case 1:
        // column 2 is a date
        return new Date(value);
      case 2:
        // column 3 is JSON of a formula value
        return JSON.parse(value);
      default:
        // the rest are numbers
        return parseFloat(value);
    }
  },
  // https://c2fo.github.io/fast-csv/docs/parsing/options
  parserOptions: {
    delimiter: '\t',
    quote: false,
  },
};
const worksheet = await workbook.csv.readFile(filename, options);
// ... use workbook or worksheet
```

The CSV parser uses [fast-csv](https://www.npmjs.com/package/fast-csv) to read the CSV file.
The formatterOptions in the options passed to the above write function will be passed to the @fast-csv/format module to write csv data.
 Please refer to the fast-csv README.md for details.

Dates are parsed using the npm module [dayjs](https://www.npmjs.com/package/dayjs).
 If a dateFormats array is not supplied, the following dateFormats are used:

* 'YYYY-MM-DD\[T\]HH:mm:ss'
* 'MM-DD-YYYY'
* 'YYYY-MM-DD'

Please refer to the [dayjs CustomParseFormat plugin](https://github.com/iamkun/dayjs/blob/HEAD/docs/en/Plugin.md#customparseformat) for details on how to structure a dateFormat.

### Writing CSV[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Options supported when writing to a CSV file.

| Field            |  Required   |    Type     | Description |
| ---------------- | ----------- | ----------- | ----------- |
| dateFormat       |     N       |  String     | Specify the date encoding format of dayjs. |
| dateUTC          |     N       |  Boolean    | Specify whether ExcelJS uses `dayjs.utc ()` to convert time zone for parsing dates. |
| encoding         |     N       |  String     | Specify file encoding format. (Only applies to `.writeFile`.) |
| includeEmptyRows |     N       |  Boolean    | Specifies whether empty rows can be written. |
| map              |     N       |  Function   | Custom Array.prototype.map() callback function for processing row values. |
| sheetName        |     N       |  String     | Specify worksheet name. |
| sheetId          |     N       |  Number     | Specify worksheet ID. |
| formatterOptions |     N       |  Object     | [formatterOptions options](https://c2fo.github.io/fast-csv/docs/formatting/options/) @fast-csv/format module to write csv data. |

```javascript

// write to a file
const workbook = createAndFillWorkbook();
await workbook.csv.writeFile(filename);

// write to a stream
// Be careful that you need to provide sheetName or
// sheetId for correct import to csv.
await workbook.csv.write(stream, { sheetName: 'Page name' });

// write to a file with European Date-Times
const workbook = new Excel.Workbook();
const options = {
  dateFormat: 'DD/MM/YYYY HH:mm:ss',
  dateUTC: true, // use utc when rendering dates
};
await workbook.csv.writeFile(filename, options);


// write to a file with custom value formatting
const workbook = new Excel.Workbook();
const options = {
  map(value, index) {
    switch(index) {
      case 0:
        // column 1 is string
        return value;
      case 1:
        // column 2 is a date
        return dayjs(value).format('YYYY-MM-DD');
      case 2:
        // column 3 is a formula, write just the result
        return value.result;
      default:
        // the rest are numbers
        return value;
    }
  },
  // https://c2fo.github.io/fast-csv/docs/formatting/options
  formatterOptions: {
    delimiter: '\t',
    quote: false,
  },
};
await workbook.csv.writeFile(filename, options);

// write to a new buffer
const buffer = await workbook.csv.writeBuffer();
```

The CSV parser uses [fast-csv](https://www.npmjs.com/package/fast-csv) to write the CSV file.
 The formatterOptions in the options passed to the above write function will be passed to the @fast-csv/format module to write csv data.
 Please refer to the fast-csv README.md for details.

Dates are formatted using the npm module [dayjs](https://www.npmjs.com/package/dayjs).
 If no dateFormat is supplied, dayjs.ISO_8601 is used.
 When writing a CSV you can supply the boolean dateUTC as true to have ExcelJS parse the date without automatically
 converting the timezone using `dayjs.utc()`.

## Streaming I/O[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The File I/O documented above requires that an entire workbook is built up in memory before the file can be written.
 While convenient, it can limit the size of the document due to the amount of memory required.

A streaming writer (or reader) processes the workbook or worksheet data as it is generated,
 converting it into file form as it goes. Typically this is much more efficient on memory as the final
 memory footprint and even intermediate memory footprints are much more compact than with the document version,
 especially when you consider that the row and cell objects are disposed once they are committed.

The interface to the streaming workbook and worksheet is almost the same as the document versions with a few minor practical differences:

* Once a worksheet is added to a workbook, it cannot be removed.
* Once a row is committed, it is no longer accessible since it will have been dropped from the worksheet.
* unMergeCells() is not supported.

Note that it is possible to build the entire workbook without committing any rows.
 When the workbook is committed, all added worksheets (including all uncommitted rows) will be automatically committed.
 However in this case, little will have been gained over the Document version.

### Streaming XLSX[⬆](../README.md#contents)<!-- Link generated with jump2header -->

#### Streaming XLSX Writer[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The streaming XLSX workbook writer is available in the ExcelJS.stream.xlsx namespace.

The constructor takes an optional options object with the following fields:

| Field            | Description |
| ---------------- | ----------- |
| stream           | Specifies a writable stream to write the XLSX workbook to. |
| filename         | If stream not specified, this field specifies the path to a file to write the XLSX workbook to. |
| useSharedStrings | Specifies whether to use shared strings in the workbook. Default is `false`. |
| useStyles        | Specifies whether to add style information to the workbook. Styles can add some performance overhead. Default is `false`. |
| zip              | [Zip options](https://www.archiverjs.com/global.html#ZipOptions) that ExcelJS internally passes to [Archiver](https://github.com/archiverjs/node-archiver). Default is `undefined`. |

If neither stream nor filename is specified in the options, the workbook writer will create a StreamBuf object
 that will store the contents of the XLSX workbook in memory.
 This StreamBuf object, which can be accessed via the property workbook.stream, can be used to either
 access the bytes directly by stream.read() or to pipe the contents to another stream.

```javascript
// construct a streaming XLSX workbook writer with styles and shared strings
const options = {
  filename: './streamed-workbook.xlsx',
  useStyles: true,
  useSharedStrings: true
};
const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
```

In general, the interface to the streaming XLSX writer is the same as the Document workbook (and worksheets)
 described above, in fact the row, cell and style objects are the same.

However there are some differences...

**Construction**

As seen above, the WorkbookWriter will typically require the output stream or file to be specified in the constructor.

**Committing Data**

When a worksheet row is ready, it should be committed so that the row object and contents can be freed.
 Typically this would be done as each row is added...

```javascript
worksheet.addRow({
   id: i,
   name: theName,
   etc: someOtherDetail
}).commit();
```

The reason the WorksheetWriter does not commit rows as they are added is to allow cells to be merged across rows:

```javascript
worksheet.mergeCells('A1:B2');
worksheet.getCell('A1').value = 'I am merged';
worksheet.getCell('C1').value = 'I am not';
worksheet.getCell('C2').value = 'Neither am I';
worksheet.getRow(2).commit(); // now rows 1 and two are committed.
```

As each worksheet is completed, it must also be committed:

```javascript
// Finished adding data. Commit the worksheet
worksheet.commit();
```

To complete the XLSX document, the workbook must be committed. If any worksheet in a workbook are uncommitted,
 they will be committed automatically as part of the workbook commit.

```javascript
// Finished the workbook.
await workbook.commit();
// ... the stream has been written
```

#### Streaming XLSX Reader[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The streaming XLSX workbook reader is available in the ExcelJS.stream.xlsx namespace.

The constructor takes a required input argument and an optional options argument:

| Argument              | Description |
| --------------------- | ----------- |
| input (required)      | Specifies the name of the file or the readable stream from which to read the XLSX workbook. |
| options (optional)    | Specifies how to handle the event types occuring during the read parsing. |
| options.entries       | Specifies whether to emit entries (`'emit'`) or not (`'ignore'`). Default is `'emit'`. |
| options.sharedStrings | Specifies whether to cache shared strings (`'cache'`), which inserts them into the respective cell values, or whether to emit them (`'emit'`) or ignore them (`'ignore'`), in both of which case the cell value will be a reference to the shared string's index. Default is `'cache'`. |
| options.hyperlinks    | Specifies whether to cache hyperlinks (`'cache'`), which inserts them into their respective cells, whether to emit them (`'emit'`) or whether to ignore them (`'ignore'`). Default is `'cache'`. |
| options.styles        | Specifies whether to cache styles (`'cache'`), which inserts them into their respective rows and cells, or whether to ignore them (`'ignore'`). Default is `'cache'`. |
| options.worksheets    | Specifies whether to emit worksheets (`'emit'`) or not (`'ignore'`). Default is `'emit'`. |

```js
const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx');
for await (const worksheetReader of workbookReader) {
  for await (const row of worksheetReader) {
    // ...
  }
}
```

Please note that `worksheetReader` returns an array of rows rather than each row individually for performance reasons: https://github.com/nodejs/node/issues/31979

##### Iterating over all events[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Events on workbook are 'worksheet', 'shared-strings' and 'hyperlinks'. Events on worksheet are 'row' and 'hyperlinks'.

```js
const options = {
  sharedStrings: 'emit',
  hyperlinks: 'emit',
  worksheets: 'emit',
};
const workbook = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx', options);
for await (const {eventType, value} of workbook.parse()) {
  switch (eventType) {
    case 'shared-strings':
      // value is the shared string
    case 'worksheet':
      // value is the worksheetReader
    case 'hyperlinks':
      // value is the hyperlinksReader
  }
}
```

##### Readable stream[⬆](../README.md#contents)<!-- Link generated with jump2header -->

While we strongly encourage to use async iteration, we also expose a streaming interface for backwards compatibility.

```js
const options = {
  sharedStrings: 'emit',
  hyperlinks: 'emit',
  worksheets: 'emit',
};
const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx', options);
workbookReader.read();

workbookReader.on('worksheet', worksheet => {
  worksheet.on('row', row => {
  });
});

workbookReader.on('shared-strings', sharedString => {
  // ...
});

workbookReader.on('hyperlinks', hyperlinksReader => {
  // ...
});

workbookReader.on('end', () => {
  // ...
});
workbookReader.on('error', (err) => {
  // ...
});
```
