## Add a Worksheet[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
const sheet = workbook.addWorksheet('My Sheet');
```

Use the second parameter of the addWorksheet function to specify options for the worksheet.

For Example:

```javascript
// create a sheet with red tab colour
const sheet = workbook.addWorksheet('My Sheet', {properties:{tabColor:{argb:'FFC0000'}}});

// create a sheet where the grid lines are hidden
const sheet = workbook.addWorksheet('My Sheet', {views: [{showGridLines: false}]});

// create a sheet with the first row and column frozen
const sheet = workbook.addWorksheet('My Sheet', {views:[{state: 'frozen', xSplit: 1, ySplit:1}]});

// Create worksheets with headers and footers
const sheet = workbook.addWorksheet('My Sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});

// create new sheet with pageSetup settings for A4 - landscape
const worksheet =  workbook.addWorksheet('My Sheet', {
  pageSetup:{paperSize: 9, orientation:'landscape'}
});
```

## Remove a Worksheet[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Use the worksheet `id` to remove the sheet from workbook.

For Example:

```javascript
// Create a worksheet
const sheet = workbook.addWorksheet('My Sheet');

// Remove the worksheet using worksheet id
workbook.removeWorksheet(sheet.id)
```

## Access Worksheets[⬆](../README.md#contents)<!-- Link generated with jump2header -->
```javascript
// Iterate over all sheets
// Note: workbook.worksheets.forEach will still work but this is better
workbook.eachSheet(function(worksheet, sheetId) {
  // ...
});

// fetch sheet by name
const worksheet = workbook.getWorksheet('My Sheet');

// fetch sheet by id
// INFO: Be careful when using it!
// It tries to access to `worksheet.id` field. Sometimes (really very often) workbook has worksheets with id not starting from 1.
// For instance It happens when any worksheet has been deleted.
// It's much more safety when you assume that ids are random. And stop to use this function.
// If you need to access all worksheets in a loop please look to the next example.
const worksheet = workbook.getWorksheet(1);

// access by `worksheets` array:
workbook.worksheets[0]; //the first one;

```

It's important to know that `workbook.getWorksheet(1) != Workbook.worksheets[0]` and `workbook.getWorksheet(1) != Workbook.worksheets[1]`,
because `workbook.worksheets[0].id` may have any value.

## Worksheet State[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// make worksheet visible
worksheet.state = 'visible';

// make worksheet hidden
worksheet.state = 'hidden';

// make worksheet hidden from 'hide/unhide' dialog
worksheet.state = 'veryHidden';
```

## Worksheet Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Worksheets support a property bucket to allow control over some features of the worksheet.

```javascript
// create new sheet with properties
const worksheet = workbook.addWorksheet('sheet', {properties:{tabColor:{argb:'FF00FF00'}}});

// create a new sheet writer with properties
const worksheetWriter = workbookWriter.addWorksheet('sheet', {properties:{outlineLevelCol:1}});

// adjust properties afterwards (not supported by worksheet-writer)
worksheet.properties.outlineLevelCol = 2;
worksheet.properties.defaultRowHeight = 15;
```

**Supported Properties**

| Name             | Default    | Description |
| ---------------- | ---------- | ----------- |
| tabColor         | undefined  | Color of the tabs |
| outlineLevelCol  | 0          | The worksheet column outline level |
| outlineLevelRow  | 0          | The worksheet row outline level |
| defaultRowHeight | 15         | Default row height |
| defaultColWidth  | (optional) | Default column width |
| dyDescent        | 55         | TBD |

### Worksheet Metrics[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Some new metrics have been added to Worksheet...

| Name              | Description |
| ----------------- | ----------- |
| rowCount          | The total row size of the document. Equal to the row number of the last row that has values. |
| actualRowCount    | A count of the number of rows that have values. If a mid-document row is empty, it will not be included in the count. |
| columnCount       | The total column size of the document. Equal to the maximum cell count from all of the rows |
| actualColumnCount | A count of the number of columns that have values. |


## Page Setup[⬆](../README.md#contents)<!-- Link generated with jump2header -->

All properties that can affect the printing of a sheet are held in a pageSetup object on the sheet.

```javascript
// create new sheet with pageSetup settings for A4 - landscape
const worksheet =  workbook.addWorksheet('sheet', {
  pageSetup:{paperSize: 9, orientation:'landscape'}
});

// create a new sheet writer with pageSetup settings for fit-to-page
const worksheetWriter = workbookWriter.addWorksheet('sheet', {
  pageSetup:{fitToPage: true, fitToHeight: 5, fitToWidth: 7}
});

// adjust pageSetup settings afterwards
worksheet.pageSetup.margins = {
  left: 0.7, right: 0.7,
  top: 0.75, bottom: 0.75,
  header: 0.3, footer: 0.3
};

// Set Print Area for a sheet
worksheet.pageSetup.printArea = 'A1:G20';

// Set multiple Print Areas by separating print areas with '&&'
worksheet.pageSetup.printArea = 'A1:G10&&A11:G20';

// Repeat specific rows on every printed page
worksheet.pageSetup.printTitlesRow = '1:3';

// Repeat specific columns on every printed page
worksheet.pageSetup.printTitlesColumn = 'A:C';
```

**Supported pageSetup settings**

| Name                  | Default       | Description |
| --------------------- | ------------- | ----------- |
| margins               |               | Whitespace on the borders of the page. Units are inches. |
| orientation           | 'portrait'    | Orientation of the page - i.e. taller (portrait) or wider (landscape) |
| horizontalDpi         | 4294967295    | Horizontal Dots per Inch. Default value is -1 |
| verticalDpi           | 4294967295    | Vertical Dots per Inch. Default value is -1 |
| fitToPage             |               | Whether to use fitToWidth and fitToHeight or scale settings. Default is based on presence of these settings in the pageSetup object - if both are present, scale wins (i.e. default will be false) |
| pageOrder             | 'downThenOver'| Which order to print the pages - one of ['downThenOver', 'overThenDown'] |
| blackAndWhite         | false         | Print without colour |
| draft                 | false         | Print with less quality (and ink) |
| cellComments          | 'None'        | Where to place comments - one of ['atEnd', 'asDisplayed', 'None'] |
| errors                | 'displayed'   | Where to show errors - one of ['dash', 'blank', 'NA', 'displayed'] |
| scale                 | 100           | Percentage value to increase or reduce the size of the print. Active when fitToPage is false |
| fitToWidth            | 1             | How many pages wide the sheet should print on to. Active when fitToPage is true  |
| fitToHeight           | 1             | How many pages high the sheet should print on to. Active when fitToPage is true  |
| paperSize             |               | What paper size to use (see below) |
| showRowColHeaders     | false         | Whether to show the row numbers and column letters |
| showGridLines         | false         | Whether to show grid lines |
| firstPageNumber       |               | Which number to use for the first page |
| horizontalCentered    | false         | Whether to center the sheet data horizontally |
| verticalCentered      | false         | Whether to center the sheet data vertically |

**Example Paper Sizes**

| Name                          | Value     |
| ----------------------------- | --------- |
| Letter                        | undefined |
| Legal                         |  5        |
| Executive                     |  7        |
| A3                            |  8        |
| A4                            |  9        |
| A5                            |  11       |
| B5 (JIS)                      |  13       |
| Envelope #10                  |  20       |
| Envelope DL                   |  27       |
| Envelope C5                   |  28       |
| Envelope B5                   |  34       |
| Envelope Monarch              |  37       |
| Double Japan Postcard Rotated |  82       |
| 16K 197x273 mm                |  119      |

## Headers and Footers[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Here's how to add headers and footers.
The added content is mainly text, such as time, introduction, file information, etc., and you can set the style of the text.
In addition, you can set different texts for the first page and even page.

Note: Images are not currently supported.

```javascript

// Create worksheets with headers and footers
var sheet = workbook.addWorksheet('sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});
// Create worksheets with headers and footers
var worksheetWriter = workbookWriter.addWorksheet('sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});
// Set footer (default centered), result: "Page 2 of 16"
worksheet.headerFooter.oddFooter = "Page &P of &N";

// Set the footer (default centered) to bold, resulting in: "Page 2 of 16"
worksheet.headerFooter.oddFooter = "Page &P of &N";

// Set the left footer to 18px and italicize. Result: "Page 2 of 16"
worksheet.headerFooter.oddFooter = "&LPage &P of &N";

// Set the middle header to gray Aril, the result: "52 exceljs"
worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"52 exceljs";

// Set the left, center, and right text of the footer. Result: “Exceljs” in the footer left. “demo.xlsx” in the footer center. “Page 2” in the footer right
worksheet.headerFooter.oddFooter = "&Lexceljs&C&F&RPage &P";

// Add different header & footer for the first page
worksheet.headerFooter.differentFirst = true;
worksheet.headerFooter.firstHeader = "Hello Exceljs";
worksheet.headerFooter.firstFooter = "Hello World"
```

**Supported headerFooter settings**

| Name              | Default   | Description |
| ----------------- | --------- | ----------- |
| differentFirst    | false     | Set the value of differentFirst as true, which indicates that headers/footers for first page are different from the other pages |
| differentOddEven  | false     | Set the value of differentOddEven as true, which indicates that headers/footers for odd and even pages are different |
| oddHeader         | null      | Set header string for odd(default) pages, could format the string |
| oddFooter         | null      | Set footer string for odd(default) pages, could format the string |
| evenHeader        | null      | Set header string for even pages, could format the string |
| evenFooter        | null      | Set footer string for even pages, could format the string |
| firstHeader       | null      | Set header string for the first page, could format the string |
| firstFooter       | null      | Set footer string for the first page, could format the string |

**Script Commands**

| Commands     | Description |
| ------------ | ----------- |
| &L           | Set position to the left |
| &C           | Set position to the center |
| &R           | Set position to the right |
| &P           | The current page number |
| &N           | The total number of pages |
| &D           | The current date |
| &T           | The current time |
| &G           | A picture |
| &A           | The worksheet name |
| &F           | The file name |
| &B           | Make text bold |
| &I           | Italicize text |
| &U           | Underline text |
| &"font name" | font name, for example &"Aril" |
| &font size   | font size, for example 12 |
| &KHEXCode    | font color, for example &KCCCCCC |

## Worksheet Views[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Worksheets now support a list of views, that control how Excel presents the sheet:

* frozen - where a number of rows and columns to the top and left are frozen in place. Only the bottom right section will scroll
* split - where the view is split into 4 sections, each semi-independently scrollable.

Each view also supports various properties:

| Name              | Default   | Description |
| ----------------- | --------- | ----------- |
| state             | 'normal'  | Controls the view state - one of normal, frozen or split |
| rightToLeft       | false     | Sets the worksheet view's orientation to right-to-left |
| activeCell        | undefined | The currently selected cell |
| showRuler         | true      | Shows or hides the ruler in Page Layout |
| showRowColHeaders | true      | Shows or hides the row and column headers (e.g. A1, B1 at the top and 1,2,3 on the left |
| showGridLines     | true      | Shows or hides the gridlines (shown for cells where borders have not been defined) |
| zoomScale         | 100       | Percentage zoom to use for the view |
| zoomScaleNormal   | 100       | Normal zoom for the view |
| style             | undefined | Presentation style - one of pageBreakPreview or pageLayout. Note pageLayout is not compatible with frozen views |

### Frozen Views[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Frozen views support the following extra properties:

| Name              | Default   | Description |
| ----------------- | --------- | ----------- |
| xSplit            | 0         | How many columns to freeze. To freeze rows only, set this to 0 or undefined |
| ySplit            | 0         | How many rows to freeze. To freeze columns only, set this to 0 or undefined |
| topLeftCell       | special   | Which cell will be top-left in the bottom-right pane. Note: cannot be a frozen cell. Defaults to first unfrozen cell |

```javascript
worksheet.views = [
  {state: 'frozen', xSplit: 2, ySplit: 3, topLeftCell: 'G10', activeCell: 'A1'}
];
```

### Split Views[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Split views support the following extra properties:

| Name              | Default   | Description |
| ----------------- | --------- | ----------- |
| xSplit            | 0         | How many points from the left to place the splitter. To split vertically, set this to 0 or undefined |
| ySplit            | 0         | How many points from the top to place the splitter. To split horizontally, set this to 0 or undefined  |
| topLeftCell       | undefined | Which cell will be top-left in the bottom-right pane. |
| activePane        | undefined | Which pane will be active - one of topLeft, topRight, bottomLeft and bottomRight |

```javascript
worksheet.views = [
  {state: 'split', xSplit: 2000, ySplit: 3000, topLeftCell: 'G10', activeCell: 'A1'}
];
```

## Auto filters[⬆](../README.md#contents)<!-- Link generated with jump2header -->

It is possible to apply an auto filter to your worksheet.

```javascript
worksheet.autoFilter = 'A1:C1';
```

While the range string is the standard form of the autoFilter, the worksheet will also support the
following values:

```javascript
// Set an auto filter from A1 to C1
worksheet.autoFilter = {
  from: 'A1',
  to: 'C1',
}

// Set an auto filter from the cell in row 3 and column 1
// to the cell in row 5 and column 12
worksheet.autoFilter = {
  from: {
    row: 3,
    column: 1
  },
  to: {
    row: 5,
    column: 12
  }
}

// Set an auto filter from D3 to the
// cell in row 7 and column 5
worksheet.autoFilter = {
  from: 'D3',
  to: {
    row: 7,
    column: 5
  }
}
```
