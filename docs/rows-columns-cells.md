## Columns[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// Add column headers and define column keys and widths
// Note: these column structures are a workbook-building convenience only,
// apart from the column width, they will not be fully persisted.
worksheet.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32 },
  { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
];

// Access an individual columns by key, letter and 1-based column number
const idCol = worksheet.getColumn('id');
const nameCol = worksheet.getColumn('B');
const dobCol = worksheet.getColumn(3);

// set column properties

// Note: will overwrite cell value C1
dobCol.header = 'Date of Birth';

// Note: this will overwrite cell values C1:C2
dobCol.header = ['Date of Birth', 'A.K.A. D.O.B.'];

// from this point on, this column will be indexed by 'dob' and not 'DOB'
dobCol.key = 'dob';

dobCol.width = 15;

// Hide the column if you'd like
dobCol.hidden = true;

// set an outline level for columns
worksheet.getColumn(4).outlineLevel = 0;
worksheet.getColumn(5).outlineLevel = 1;

// columns support a readonly field to indicate the collapsed state based on outlineLevel
expect(worksheet.getColumn(4).collapsed).to.equal(false);
expect(worksheet.getColumn(5).collapsed).to.equal(true);

// iterate over all current cells in this column
dobCol.eachCell(function(cell, rowNumber) {
  // ...
});

// iterate over all current cells in this column including empty cells
dobCol.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
  // ...
});

// add a column of new values
worksheet.getColumn(6).values = [1,2,3,4,5];

// add a sparse column of values
worksheet.getColumn(7).values = [,,2,3,,5,,7,,,,11];

// cut one or more columns (columns to the right are shifted left)
// If column properties have been defined, they will be cut or moved accordingly
// Known Issue: If a splice causes any merged cells to move, the results may be unpredictable
worksheet.spliceColumns(3,2);

// remove one column and insert two more.
// Note: columns 4 and above will be shifted right by 1 column.
// Also: If the worksheet has more rows than values in the column inserts,
//  the rows will still be shifted as if the values existed
const newCol3Values = [1,2,3,4,5];
const newCol4Values = ['one', 'two', 'three', 'four', 'five'];
worksheet.spliceColumns(3, 1, newCol3Values, newCol4Values);

```

## Rows[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// Get a row object. If it doesn't already exist, a new empty one will be returned
const row = worksheet.getRow(5);

// Get multiple row objects. If it doesn't already exist, new empty ones will be returned
const rows = worksheet.getRows(5, 2); // start, length (>0, else undefined is returned)

// Get the last editable row in a worksheet (or undefined if there are none)
const row = worksheet.lastRow;

// Set a specific row height
row.height = 42.5;

// make row hidden
row.hidden = true;

// set an outline level for rows
worksheet.getRow(4).outlineLevel = 0;
worksheet.getRow(5).outlineLevel = 1;

// rows support a readonly field to indicate the collapsed state based on outlineLevel
expect(worksheet.getRow(4).collapsed).to.equal(false);
expect(worksheet.getRow(5).collapsed).to.equal(true);


row.getCell(1).value = 5; // A5's value set to 5
row.getCell('name').value = 'Zeb'; // B5's value set to 'Zeb' - assuming column 2 is still keyed by name
row.getCell('C').value = new Date(); // C5's value set to now

// Get a row as a sparse array
// Note: interface change: worksheet.getRow(4) ==> worksheet.getRow(4).values
row = worksheet.getRow(4).values;
expect(row[5]).toEqual('Kyle');

// assign row values by contiguous array (where array element 0 has a value)
row.values = [1,2,3];
expect(row.getCell(1).value).toEqual(1);
expect(row.getCell(2).value).toEqual(2);
expect(row.getCell(3).value).toEqual(3);

// assign row values by sparse array  (where array element 0 is undefined)
const values = []
values[5] = 7;
values[10] = 'Hello, World!';
row.values = values;
expect(row.getCell(1).value).toBeNull();
expect(row.getCell(5).value).toEqual(7);
expect(row.getCell(10).value).toEqual('Hello, World!');

// assign row values by object, using column keys
row.values = {
  id: 13,
  name: 'Thing 1',
  dob: new Date()
};

// Insert a page break below the row
row.addPageBreak();

// Iterate over all rows that have values in a worksheet
worksheet.eachRow(function(row, rowNumber) {
  console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
});

// Iterate over all rows (including empty rows) in a worksheet
worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
  console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
});

// Iterate over all non-null cells in a row
row.eachCell(function(cell, colNumber) {
  console.log('Cell ' + colNumber + ' = ' + cell.value);
});

// Iterate over all cells in a row (including empty cells)
row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
  console.log('Cell ' + colNumber + ' = ' + cell.value);
});

// Commit a completed row to stream
row.commit();

// row metrics
const rowSize = row.cellCount;
const numValues = row.actualCellCount;
```

## Add Rows[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// Add a couple of Rows by key-value, after the last current row, using the column keys
worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
worksheet.addRow({id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});

// Add a row by contiguous Array (assign to columns A, B & C)
worksheet.addRow([3, 'Sam', new Date()]);

// Add a row by sparse Array (assign to columns A, E & I)
const rowValues = [];
rowValues[1] = 4;
rowValues[5] = 'Kyle';
rowValues[9] = new Date();
worksheet.addRow(rowValues);

// Add a row with inherited style
// This new row will have same style as last row
// And return as row object
const newRow = worksheet.addRow(rowValues, 'i');

// Add an array of rows
const rows = [
  [5,'Bob',new Date()], // row by array
  {id:6, name: 'Barbara', dob: new Date()}
];
// add new rows and return them as array of row objects
const newRows = worksheet.addRows(rows);

// Add an array of rows with inherited style
// These new rows will have same styles as last row
// and return them as array of row objects
const newRowsStyled = worksheet.addRows(rows, 'i');
```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| value/s    | The new row/s values |  |
| style            | 'i' for inherit from row above, 'i+' to include empty cells, 'n' for none | *'n'* |

## Handling Individual Cells[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
const cell = worksheet.getCell('C3');

// Modify/Add individual cell
cell.value = new Date(1968, 5, 1);

// query a cell's type
expect(cell.type).toEqual(Excel.ValueType.Date);

// use string value of cell
myInput.value = cell.text;

// use html-safe string for rendering...
const html = '<div>' + cell.html + '</div>';

```

## Merged Cells[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// merge a range of cells
worksheet.mergeCells('A4:B5');

// ... merged cells are linked
worksheet.getCell('B5').value = 'Hello, World!';
expect(worksheet.getCell('B5').value).toBe(worksheet.getCell('A4').value);
expect(worksheet.getCell('B5').master).toBe(worksheet.getCell('A4'));

// ... merged cells share the same style object
expect(worksheet.getCell('B5').style).toBe(worksheet.getCell('A4').style);
worksheet.getCell('B5').style.font = myFonts.arial;
expect(worksheet.getCell('A4').style.font).toBe(myFonts.arial);

// unmerging the cells breaks the style links
worksheet.unMergeCells('A4');
expect(worksheet.getCell('B5').style).not.toBe(worksheet.getCell('A4').style);
expect(worksheet.getCell('B5').style.font).not.toBe(myFonts.arial);

// merge by top-left, bottom-right
worksheet.mergeCells('K10', 'M12');

// merge by start row, start column, end row, end column (equivalent to K10:M12)
worksheet.mergeCells(10,11,12,13);
```

## Insert Rows[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
insertRow(pos, value, style = 'n')
insertRows(pos, values, style = 'n')

// Insert a couple of Rows by key-value, shifting down rows every time
worksheet.insertRow(1, {id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
worksheet.insertRow(1, {id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});

// Insert a row by contiguous Array (assign to columns A, B & C)
worksheet.insertRow(1, [3, 'Sam', new Date()]);

// Insert a row by sparse Array (assign to columns A, E & I)
var rowValues = [];
rowValues[1] = 4;
rowValues[5] = 'Kyle';
rowValues[9] = new Date();
// insert new row and return as row object
const insertedRow = worksheet.insertRow(1, rowValues);

// Insert a row, with inherited style
// This new row will have same style as row on top of it
// And return as row object
const insertedRowInherited = worksheet.insertRow(1, rowValues, 'i');

// Insert a row, keeping original style
// This new row will have same style as it was previously
// And return as row object
const insertedRowOriginal = worksheet.insertRow(1, rowValues, 'o');

// Insert an array of rows, in position 1, shifting down current position 1 and later rows by 2 rows
var rows = [
  [5,'Bob',new Date()], // row by array
  {id:6, name: 'Barbara', dob: new Date()}
];
// insert new rows and return them as array of row objects
const insertedRows = worksheet.insertRows(1, rows);

// Insert an array of rows, with inherited style
// These new rows will have same style as row on top of it
// And return them as array of row objects
const insertedRowsInherited = worksheet.insertRows(1, rows, 'i');

// Insert an array of rows, keeping original style
// These new rows will have same style as it was previously in 'pos' position
const insertedRowsOriginal = worksheet.insertRows(1, rows, 'o');

```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| pos          | Row number where you want to insert, pushing down all rows from there |  |
| value/s    | The new row/s values |  |
| style            | 'i' for inherit from row above, , 'i+' to include empty cells, 'o' for original style, 'o+' to include empty cells, 'n' for none | *'n'* |

## Splice[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// Cut one or more rows (rows below are shifted up)
// Known Issue: If a splice causes any merged cells to move, the results may be unpredictable
worksheet.spliceRows(4, 3);

// remove one row and insert two more.
// Note: rows 4 and below will be shifted down by 1 row.
const newRow3Values = [1, 2, 3, 4, 5];
const newRow4Values = ['one', 'two', 'three', 'four', 'five'];
worksheet.spliceRows(3, 1, newRow3Values, newRow4Values);

// Cut one or more cells (cells to the right are shifted left)
// Note: this operation will not affect other rows
row.splice(3, 2);

// remove one cell and insert two more (cells to the right of the cut cell will be shifted right)
row.splice(4, 1, 'new value 1', 'new value 2');
```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| start    | Starting point to splice from |  |
| count    | Number of rows/cells to remove |  |
| ...inserts            | New row/cell values to insert |  |

## Duplicate a Row[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
duplicateRow(start, amount = 1, insert = true)

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('duplicateTest');
ws.getCell('A1').value = 'One';
ws.getCell('A2').value = 'Two';
ws.getCell('A3').value = 'Three';
ws.getCell('A4').value = 'Four';

// This line will duplicate the row 'One' twice but it will replace rows 'Two' and 'Three'
// if third param was true so it would insert 2 new rows with the values and styles of row 'One'
ws.duplicateRow(1,2,false);
```

| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| start          | Row number you want to duplicate (first in excel is 1) |  |
| amount    | The times you want to duplicate the row | 1 |
| insert            | *true* if you want to insert new rows for the duplicates, or *false* if you want to replace them | *true* |



## Defined Names[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Individual cells (or multiple groups of cells) can have names assigned to them.
 The names can be used in formulas and data validation (and probably more).

```javascript
// assign (or get) a name for a cell (will overwrite any other names that cell had)
worksheet.getCell('A1').name = 'PI';
expect(worksheet.getCell('A1').name).to.equal('PI');

// assign (or get) an array of names for a cell (cells can have more than one name)
worksheet.getCell('A1').names = ['thing1', 'thing2'];
expect(worksheet.getCell('A1').names).to.have.members(['thing1', 'thing2']);

// remove a name from a cell
worksheet.getCell('A1').removeName('thing1');
expect(worksheet.getCell('A1').names).to.have.members(['thing2']);
```

## Data Validations[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Cells can define what values are valid or not and provide prompting to the user to help guide them.

Validation types can be one of the following:

| Type       | Description |
| ---------- | ----------- |
| list       | Define a discrete set of valid values. Excel will offer these in a dropdown for easy entry |
| whole      | The value must be a whole number |
| decimal    | The value must be a decimal number |
| textLength | The value may be text but the length is controlled |
| custom     | A custom formula controls the valid values |

For types other than list or custom, the following operators affect the validation:

| Operator              | Description |
| --------------------  | ----------- |
| between               | Values must lie between formula results |
| notBetween            | Values must not lie between formula results |
| equal                 | Value must equal formula result |
| notEqual              | Value must not equal formula result |
| greaterThan           | Value must be greater than formula result |
| lessThan              | Value must be less than formula result |
| greaterThanOrEqual    | Value must be greater than or equal to formula result |
| lessThanOrEqual       | Value must be less than or equal to formula result |

```javascript
// Specify list of valid values (One, Two, Three, Four).
// Excel will provide a dropdown with these values.
worksheet.getCell('A1').dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: ['"One,Two,Three,Four"']
};

// Specify list of valid values from a range.
// Excel will provide a dropdown with these values.
worksheet.getCell('A1').dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: ['$D$5:$F$5']
};

// Specify Cell must be a whole number that is not 5.
// Show the user an appropriate error message if they get it wrong
worksheet.getCell('A1').dataValidation = {
  type: 'whole',
  operator: 'notEqual',
  showErrorMessage: true,
  formulae: [5],
  errorStyle: 'error',
  errorTitle: 'Five',
  error: 'The value must not be Five'
};

// Specify Cell must be a decimal number between 1.5 and 7.
// Add 'tooltip' to help guid the user
worksheet.getCell('A1').dataValidation = {
  type: 'decimal',
  operator: 'between',
  allowBlank: true,
  showInputMessage: true,
  formulae: [1.5, 7],
  promptTitle: 'Decimal',
  prompt: 'The value must between 1.5 and 7'
};

// Specify Cell must be have a text length less than 15
worksheet.getCell('A1').dataValidation = {
  type: 'textLength',
  operator: 'lessThan',
  showErrorMessage: true,
  allowBlank: true,
  formulae: [15]
};

// Specify Cell must be have be a date before 1st Jan 2016
worksheet.getCell('A1').dataValidation = {
  type: 'date',
  operator: 'lessThan',
  showErrorMessage: true,
  allowBlank: true,
  formulae: [new Date(2016,0,1)]
};
```

## Cell Comments[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Add old style comment to a cell

```javascript
// plain text note
worksheet.getCell('A1').note = 'Hello, ExcelJS!';

// colourful formatted note
ws.getCell('B1').note = {
  texts: [
    {'font': {'size': 12, 'color': {'theme': 0}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': 'This is '},
    {'font': {'italic': true, 'size': 12, 'color': {'theme': 0}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'a'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' '},
    {'font': {'size': 12, 'color': {'argb': 'FFFF6600'}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'colorful'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' text '},
    {'font': {'size': 12, 'color': {'argb': 'FFCCFFCC'}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'with'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' in-cell '},
    {'font': {'bold': true, 'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': 'format'},
  ],
  margins: {
    insetmode: 'custom',
    inset: [0.25, 0.25, 0.35, 0.35]
  },
  protection: {
    locked: True,
    lockText: False
  },
  editAs: 'twoCells',
};
```

### Cell Comments Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The following table defines the properties supported by cell comments.

| Field     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| texts     | Y        |               | The text of the comment |
| margins | N        | {}  | Determines the value of margins for automatic or custom cell comments
| protection   | N        | {} | Specifying the lock status of objects and object text using protection attributes |
| editAs   | N        | 'absolute' | Use the 'editAs' attribute to specify how the annotation is anchored to the cell  |

### Cell Comments Margins

Determine the page margin setting mode of the cell annotation, automatic or custom mode.

```javascript
ws.getCell('B1').note.margins = {
  insetmode: 'custom',
  inset: [0.25, 0.25, 0.35, 0.35]
}
```

### Supported Margins Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Property     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| insetmode     | N        |    'auto'           | Determines whether comment margins are set automatically and the value is 'auto' or 'custom' |
| inset | N        | [0.13, 0.13, 0.25, 0.25]  | Whitespace on the borders of the comment. Units are centimeter. Direction is left, top, right, bottom |

Note: This  ```inset``` setting takes effect only when the value of ```insetmode``` is 'custom'.

### Cell Comments Protection

Specifying the lock status of objects and object text using protection attributes.

```javascript
ws.getCell('B1').note.protection = {
  locked: 'False',
  lockText: 'False',
};
```

### Supported Protection Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Property     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| locked     | N        |    'True'           | This element specifies that the object is locked when the sheet is protected |
| lockText | N        | 'True'  | This element specifies that the text of the object is locked |

Note: Locked objects are valid only when the worksheet is protected.

### Cell Comments EditAs[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The cell comments can also have the property 'editAs' which will control how the comments is anchored to the cell(s).
It can have one of the following values:

```javascript
ws.getCell('B1').note.editAs = 'twoCells';
```

| Value     | Description |
| --------- | ----------- |
| twoCells | It specifies that the size and position of the note varies with cells |
| oneCells   | It specifies that the size of the note is fixed and the position changes with the cell |
| absolute  | This is the default. Comments will not be moved or sized with cells |

## Tables[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Tables allow for in-sheet manipulation of tabular data.

To add a table to a worksheet, define a table model and call addTable:

```javascript
// add a table to a sheet
ws.addTable({
  name: 'MyTable',
  ref: 'A1',
  headerRow: true,
  totalsRow: true,
  style: {
    theme: 'TableStyleDark3',
    showRowStripes: true,
  },
  columns: [
    {name: 'Date', totalsRowLabel: 'Totals:', filterButton: true},
    {name: 'Amount', totalsRowFunction: 'sum', filterButton: false},
  ],
  rows: [
    [new Date('2019-07-20'), 70.10],
    [new Date('2019-07-21'), 70.60],
    [new Date('2019-07-22'), 70.10],
  ],
});
```

Note: Adding a table to a worksheet will modify the sheet by placing
headers and row data to the sheet.
Any data on the sheet covered by the resulting table (including headers and
totals) will be overwritten.

### Table Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The following table defines the properties supported by tables.

| Table Property | Description       | Required | Default Value |
| -------------- | ----------------- | -------- | ------------- |
| name           | The name of the table | Y |    |
| displayName    | The display name of the table | N | name |
| ref            | Top left cell of the table | Y |   |
| headerRow      | Show headers at top of table | N | true |
| totalsRow      | Show totals at bottom of table | N | false |
| style          | Extra style properties | N | {} |
| columns        | Column definitions | Y |   |
| rows           | Rows of data | Y |   |

### Table Style Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The following table defines the properties supported within the table
style property.

| Style Property     | Description       | Required | Default Value |
| ------------------ | ----------------- | -------- | ------------- |
| theme              | The colour theme of the table | N |  'TableStyleMedium2'  |
| showFirstColumn    | Highlight the first column (bold) | N |  false  |
| showLastColumn     | Highlight the last column (bold) | N |  false  |
| showRowStripes     | Alternate rows shown with background colour | N |  false  |
| showColumnStripes  | Alternate rows shown with background colour | N |  false  |

### Table Column Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The following table defines the properties supported within each table
column.

| Column Property    | Description       | Required | Default Value |
| ------------------ | ----------------- | -------- | ------------- |
| name               | The name of the column, also used in the header | Y |    |
| filterButton       | Switches the filter control in the header | N |  false  |
| totalsRowLabel     | Label to describe the totals row (first column) | N | 'Total' |
| totalsRowFunction  | Name of the totals function | N | 'none' |
| totalsRowFormula   | Optional formula for custom functions | N |   |

### Totals Functions[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The following table list the valid values for the totalsRowFunction property
defined by columns. If any value other than 'custom' is used, it is not
necessary to include the associated formula as this will be inserted
by the table.

| Totals Functions   | Description       |
| ------------------ | ----------------- |
| none               | No totals function for this column |
| average            | Compute average for the column |
| countNums          | Count the entries that are numbers |
| count              | Count of entries |
| max                | The maximum value in this column |
| min                | The minimum value in this column |
| stdDev             | The standard deviation for this column |
| var                | The variance for this column |
| sum                | The sum of entries for this column |
| custom             | A custom formula. Requires an associated totalsRowFormula value. |

### Table Style Themes[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Valid theme names follow the following pattern:

* "TableStyle[Shade][Number]"

Shades, Numbers can be one of:

* Light, 1-21
* Medium, 1-28
* Dark, 1-11

For no theme, use the value null.

Note: custom table themes are not supported by exceljs yet.

### Modifying Tables[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Tables support a set of manipulation functions that allow data to be
added or removed and some properties to be changed. Since many of these
operations may have on-sheet effects, the changes must be committed
once complete.

All index values in the table are zero based, so the first row number
and first column number is 0.

**Adding or Removing Headers and Totals**

```javascript
const table = ws.getTable('MyTable');

// turn header row on
table.headerRow = true;

// turn totals row off
table.totalsRow = false;

// commit the table changes into the sheet
table.commit();
```

**Relocating a Table**

```javascript
const table = ws.getTable('MyTable');

// table top-left move to D4
table.ref = 'D4';

// commit the table changes into the sheet
table.commit();
```

**Adding and Removing Rows**

```javascript
const table = ws.getTable('MyTable');

// remove first two rows
table.removeRows(0, 2);

// insert new rows at index 5
table.addRow([new Date('2019-08-05'), 5, 'Mid'], 5);

// append new row to bottom of table
table.addRow([new Date('2019-08-10'), 10, 'End']);

// commit the table changes into the sheet
table.commit();
```

**Adding and Removing Columns**

```javascript
const table = ws.getTable('MyTable');

// remove second column
table.removeColumns(1, 1);

// insert new column (with data) at index 1
table.addColumn(
  {name: 'Letter', totalsRowFunction: 'custom', totalsRowFormula: 'ROW()', totalsRowResult: 6, filterButton: true},
  ['a', 'b', 'c', 'd'],
  2
);

// commit the table changes into the sheet
table.commit();
```

**Change Column Properties**

```javascript
const table = ws.getTable('MyTable');

// Get Column Wrapper for second column
const column = table.getColumn(1);

// set some properties
column.name = 'Code';
column.filterButton = true;
column.style = {font:{bold: true, name: 'Comic Sans MS'}};
column.totalsRowLabel = 'Totals';
column.totalsRowFunction = 'custom';
column.totalsRowFormula = 'ROW()';
column.totalsRowResult = 10;

// commit the table changes into the sheet
table.commit();
```
