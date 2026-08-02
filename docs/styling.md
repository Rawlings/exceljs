# Styles[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Cells, Rows and Columns each support a rich set of styles and formats that affect how the cells are displayed.

Styles are set by assigning the following properties:

* <a href="#number-formats">numFmt</a>
* <a href="#fonts">font</a>
* <a href="#alignment">alignment</a>
* <a href="#borders">border</a>
* <a href="#fills">fill</a>

```javascript
// assign a style to a cell
ws.getCell('A1').numFmt = '0.00%';

// Apply styles to worksheet columns
ws.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32, style: { font: { name: 'Arial Black' } } },
  { header: 'D.O.B.', key: 'DOB', width: 10, style: { numFmt: 'dd/mm/yyyy' } }
];

// Set Column 3 to Currency Format
ws.getColumn(3).numFmt = '"£"#,##0.00;[Red]\-"£"#,##0.00';

// Set Row 2 to Comic Sans.
ws.getRow(2).font = { name: 'Comic Sans MS', family: 4, size: 16, underline: 'double', bold: true };
```

When a style is applied to a row or column, it will be applied to all currently existing cells in that row or column.
 Also, any new cell that is created will inherit its initial styles from the row and column it belongs to.

If a cell's row and column both define a specific style (e.g. font), the cell will use the row style over the column style.
 However if the row and column define different styles (e.g. column.numFmt and row.font), the cell will inherit the font from the row and the numFmt from the column.

Caveat: All the above properties (with the exception of numFmt, which is a string), are JS object structures.
 If the same style object is assigned to more than one spreadsheet entity, then each entity will share the same style object.
 If the style object is later modified before the spreadsheet is serialized, then all entities referencing that style object will be modified too.
 This behaviour is intended to prioritize performance by reducing the number of JS objects created.
 If you want the style objects to be independent, you will need to clone them before assigning them.
 Also, by default, when a document is read from file (or stream) if spreadsheet entities share similar styles, then they will reference the same style object too.

### Number Formats[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// display value as '1 3/5'
ws.getCell('A1').value = 1.6;
ws.getCell('A1').numFmt = '# ?/?';

// display value as '1.60%'
ws.getCell('B1').value = 0.016;
ws.getCell('B1').numFmt = '0.00%';
```

### Fonts[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript

// for the wannabe graphic designers out there
ws.getCell('A1').font = {
  name: 'Comic Sans MS',
  family: 4,
  size: 16,
  underline: true,
  bold: true
};

// for the graduate graphic designers...
ws.getCell('A2').font = {
  name: 'Arial Black',
  color: { argb: 'FF00FF00' },
  family: 2,
  size: 14,
  italic: true
};

// for the vertical align
ws.getCell('A3').font = {
  vertAlign: 'superscript'
};

// note: the cell will store a reference to the font object assigned.
// If the font object is changed afterwards, the cell font will change also...
const font = { name: 'Arial', size: 12 };
ws.getCell('A3').font = font;
font.size = 20; // Cell A3 now has font size 20!

// Cells that share similar fonts may reference the same font object after
// the workbook is read from file or stream
```

| Font Property | Description       | Example Value(s) |
| ------------- | ----------------- | ---------------- |
| name          | Font name. | 'Arial', 'Calibri', etc. |
| family        | Font family for fallback. An integer value. | 1 - Serif, 2 - Sans Serif, 3 - Mono, Others - unknown |
| scheme        | Font scheme. | 'minor', 'major', 'none' |
| charset       | Font charset. An integer value. | 1, 2, etc. |
| size          | Font size. An integer value. | 9, 10, 12, 16, etc. |
| color         | Colour description, an object containing an ARGB value. | { argb: 'FFFF0000'} |
| bold          | Font **weight** | true, false |
| italic        | Font *slope* | true, false |
| underline     | Font <u>underline</u> style | true, false, 'none', 'single', 'double', 'singleAccounting', 'doubleAccounting' |
| strike        | Font <strike>strikethrough</strike> | true, false |
| outline       | Font outline | true, false |
| vertAlign     | Vertical align | 'superscript', 'subscript'

### Alignment[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// set cell alignment to top-left, middle-center, bottom-right
ws.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
ws.getCell('B1').alignment = { vertical: 'middle', horizontal: 'center' };
ws.getCell('C1').alignment = { vertical: 'bottom', horizontal: 'right' };

// set cell to wrap-text
ws.getCell('D1').alignment = { wrapText: true };

// set cell indent to 1
ws.getCell('E1').alignment = { indent: 1 };

// set cell text rotation to 30deg upwards, 45deg downwards and vertical text
ws.getCell('F1').alignment = { textRotation: 30 };
ws.getCell('G1').alignment = { textRotation: -45 };
ws.getCell('H1').alignment = { textRotation: 'vertical' };
```

**Valid Alignment Property Values**

| horizontal       | vertical    | wrapText | shrinkToFit | indent  | readingOrder | textRotation |
| ---------------- | ----------- | -------- | ----------- | ------- | ------------ | ------------ |
| left             | top         | true     | true        | integer | rtl          | 0 to 90      |
| center           | middle      | false    | false       |         | ltr          | -1 to -90    |
| right            | bottom      |          |             |         |              | vertical     |
| fill             | distributed |          |             |         |              |              |
| justify          | justify     |          |             |         |              |              |
| centerContinuous |             |          |             |         |              |              |
| distributed      |             |          |             |         |              |              |


### Borders[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// set single thin border around A1
ws.getCell('A1').border = {
  top: {style:'thin'},
  left: {style:'thin'},
  bottom: {style:'thin'},
  right: {style:'thin'}
};

// set double thin green border around A3
ws.getCell('A3').border = {
  top: {style:'double', color: {argb:'FF00FF00'}},
  left: {style:'double', color: {argb:'FF00FF00'}},
  bottom: {style:'double', color: {argb:'FF00FF00'}},
  right: {style:'double', color: {argb:'FF00FF00'}}
};

// set thick red cross in A5
ws.getCell('A5').border = {
  diagonal: {up: true, down: true, style:'thick', color: {argb:'FFFF0000'}}
};
```

**Valid Border Styles**

* thin
* dotted
* dashDot
* hair
* dashDotDot
* slantDashDot
* mediumDashed
* mediumDashDotDot
* mediumDashDot
* medium
* double
* thick

### Fills[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// fill A1 with red darkVertical stripes
ws.getCell('A1').fill = {
  type: 'pattern',
  pattern:'darkVertical',
  fgColor:{argb:'FFFF0000'}
};

// fill A2 with yellow dark trellis and blue behind
ws.getCell('A2').fill = {
  type: 'pattern',
  pattern:'darkTrellis',
  fgColor:{argb:'FFFFFF00'},
  bgColor:{argb:'FF0000FF'}
};

// fill A3 with solid coral
ws.getCell('A3').fill = {
  type: 'pattern',
  pattern:'solid',
  fgColor:{argb:'F08080'},
};

// fill A4 with blue-white-blue gradient from left to right
ws.getCell('A4').fill = {
  type: 'gradient',
  gradient: 'angle',
  degree: 0,
  stops: [
    {position:0, color:{argb:'FF0000FF'}},
    {position:0.5, color:{argb:'FFFFFFFF'}},
    {position:1, color:{argb:'FF0000FF'}}
  ]
};


// fill A5 with red-green gradient from center
ws.getCell('A5').fill = {
  type: 'gradient',
  gradient: 'path',
  center:{left:0.5,top:0.5},
  stops: [
    {position:0, color:{argb:'FFFF0000'}},
    {position:1, color:{argb:'FF00FF00'}}
  ]
};
```

#### Pattern Fills[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Property | Required | Description |
| -------- | -------- | ----------- |
| type     | Y        | Value: 'pattern'<br/>Specifies this fill uses patterns |
| pattern  | Y        | Specifies type of pattern (see <a href="#valid-pattern-types">Valid Pattern Types</a> below) |
| fgColor  | N        | Specifies the pattern foreground color. Default is black. |
| bgColor  | N        | Specifies the pattern background color. Default is white. |

Note: If you want to fill a cell using the `solid` pattern, then you don't need to specify `bgColor`.
See example above for cell `A3` with a `solid` pattern and a coral `fgColor`.


**Valid Pattern Types**

* none
* solid
* darkGray
* mediumGray
* lightGray
* gray125
* gray0625
* darkHorizontal
* darkVertical
* darkDown
* darkUp
* darkGrid
* darkTrellis
* lightHorizontal
* lightVertical
* lightDown
* lightUp
* lightGrid
* lightTrellis

#### Gradient Fills[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Property | Required | Description |
| -------- | -------- | ----------- |
| type     | Y        | Value: 'gradient'<br/>Specifies this fill uses gradients |
| gradient | Y        | Specifies gradient type. One of ['angle', 'path'] |
| degree   | angle    | For 'angle' gradient, specifies the direction of the gradient. 0 is from the left to the right. Values from 1 - 359 rotates the direction clockwise |
| center   | path     | For 'path' gradient. Specifies the relative coordinates for the start of the path. 'left' and 'top' values range from 0 to 1 |
| stops    | Y        | Specifies the gradient colour sequence. Is an array of objects containing position and color starting with position 0 and ending with position 1. Intermediary positions may be used to specify other colours on the path. |

**Caveats**

Using the interface above it may be possible to create gradient fill effects not possible using the XLSX editor program.
For example, Excel only supports angle gradients of 0, 45, 90 and 135.
Similarly the sequence of stops may also be limited by the UI with positions [0,1] or [0,0.5,1] as the only options.
Take care with this fill to be sure it is supported by the target XLSX viewers.

### Rich Text[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Individual cells now support rich text or in-cell formatting.
 Rich text values can control the font properties of any number of sub-strings within the text value.
 See <a href="font">Fonts</a> for a complete list of details on what font properties are supported.

```javascript

ws.getCell('A1').value = {
  'richText': [
    {'font': {'size': 12,'color': {'theme': 0},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': 'This is '},
    {'font': {'italic': true,'size': 12,'color': {'theme': 0},'name': 'Calibri','scheme': 'minor'},'text': 'a'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' '},
    {'font': {'size': 12,'color': {'argb': 'FFFF6600'},'name': 'Calibri','scheme': 'minor'},'text': 'colorful'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' text '},
    {'font': {'size': 12,'color': {'argb': 'FFCCFFCC'},'name': 'Calibri','scheme': 'minor'},'text': 'with'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' in-cell '},
    {'font': {'bold': true,'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': 'format'}
  ]
};

expect(ws.getCell('A1').text).to.equal('This is a colorful text with in-cell format');
expect(ws.getCell('A1').type).to.equal(Excel.ValueType.RichText);

```

### Cell Protection[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Cell level protection can be modified using the protection property.

```javascript
ws.getCell('A1').protection = {
  locked: false,
  hidden: true,
};
```

**Supported Protection Properties**

| Property | Default | Description |
| -------- | ------- | ----------- |
| locked   | true    | Specifies whether a cell will be locked if the sheet is protected. |
| hidden   | false   | Specifies whether a cell's formula will be visible if the sheet is protected. |

## Conditional Formatting[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Conditional formatting allows a sheet to show specific styles, icons, etc
depending on cell values or any arbitrary formula.

Conditional formatting rules are added at the sheet level and will typically
cover a range of cells.

Multiple rules can be applied to a given cell range and each rule will apply
its own style.

If multiple rules affect a given cell, the rule priority value will determine
which rule wins out if competing styles collide.
The rule with the lower priority value wins.
If priority values are not specified for a given rule, ExcelJS will assign them
in ascending order.

Note: at present, only a subset of conditional formatting rules are supported.
Specifically, only the formatting rules that do not require XML rendering
inside an &lt;extLst&gt; element. This means that datasets and three specific
icon sets (3Triangles, 3Stars, 5Boxes) are not supported.

```javascript
// add a checkerboard pattern to A1:E7 based on row + col being even or odd
worksheet.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'expression',
      formulae: ['MOD(ROW()+COLUMN(),2)=0'],
      style: {fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}}},
    }
  ]
})
```

**Supported Conditional Formatting Rule Types**

| Type         | Description |
| ------------ | ----------- |
| expression   | Any custom function may be used to activate the rule. |
| cellIs       | Compares cell value with supplied formula using specified operator |
| top10        | Applies formatting to cells with values in top (or bottom) ranges |
| aboveAverage | Applies formatting to cells with values above (or below) average |
| colorScale   | Applies a coloured background to cells based on where their values lie in the range |
| iconSet      | Adds one of a range of icons to cells based on value |
| containsText | Applies formatting based on whether cell a specific text |
| timePeriod   | Applies formatting based on whether cell datetime value lies within a specified range |

### Expression[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field    | Optional | Default | Description |
| -------- | -------- | ------- | ----------- |
| type     |          |         | 'expression' |
| priority | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| formulae |          |         | array of 1 formula string that returns a true/false value. To reference the cell value, use the top-left cell address |
| style    |          |         | style structure to apply if the formula returns true |

### Cell Is[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field    | Optional | Default | Description |
| -------- | -------- | ------- | ----------- |
| type     |          |         | 'cellIs' |
| priority | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| operator |          |         | how to compare cell value with formula result |
| formulae |          |         | array of 1 formula string that returns the value to compare against each cell |
| style    |          |         | style structure to apply if the comparison returns true |

**Cell Is Operators**

| Operator    | Description |
| ----------- | ----------- |
| equal       | Apply format if cell value equals formula value |
| greaterThan | Apply format if cell value is greater than formula value |
| lessThan    | Apply format if cell value is less than formula value |
| between     | Apply format if cell value is between two formula values (inclusive) |


### Top 10[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field    | Optional | Default | Description |
| -------- | -------- | ------- | ----------- |
| type     |          |         | 'top10' |
| priority | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| rank     | Y        | 10      | specifies how many top (or bottom) values are included in the formatting |
| percent  | Y        | false   | if true, the rank field is a percentage, not an absolute |
| bottom   | Y        | false   | if true, the bottom values are included instead of the top |
| style    |          |         | style structure to apply if the comparison returns true |

### Above Average[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field         | Optional | Default | Description |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | 'aboveAverage' |
| priority      | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| aboveAverage  | Y        | false   | if true, the rank field is a percentage, not an absolute |
| style         |          |         | style structure to apply if the comparison returns true |

### Color Scale[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field         | Optional | Default | Description |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | 'colorScale' |
| priority      | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| cfvo          |          |         | array of 2 to 5 Conditional Formatting Value Objects specifying way-points in the value range |
| color         |          |         | corresponding array of colours to use at given way points |
| style         |          |         | style structure to apply if the comparison returns true |

### Icon Set[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field         | Optional | Default | Description |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | 'iconSet' |
| priority      | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| iconSet       | Y        | 3TrafficLights | name of icon set to use |
| showValue     |          | true    | Specifies whether the cells in the applied range display the icon and cell value, or the icon only |
| reverse       |          | false   | Specifies whether the icons in the icon set specified in iconSet are show in reserve order. If custom equals "true" this value must be ignored |
| custom        |          |  false  | Specifies whether a custom set of icons is used |
| cfvo          |          |         | array of 2 to 5 Conditional Formatting Value Objects specifying way-points in the value range |
| style         |          |         | style structure to apply if the comparison returns true |

### Data Bar[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field      | Optional | Default | Description |
| ---------- | -------- | ------- | ----------- |
| type       |          |         | 'dataBar' |
| priority   | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| minLength  |          | 0       | Specifies the length of the shortest data bar in this conditional formatting range |
| maxLength  |          | 100     | Specifies the length of the longest data bar in this conditional formatting range |
| showValue  |          | true    | Specifies whether the cells in the conditional formatting range display both the data bar and the numeric value or the data bar |
| gradient   |          | true    | Specifies whether the data bar has a gradient fill |
| border     |          | true    | Specifies whether the data bar has a border |
| negativeBarColorSameAsPositive  |                | true        | Specifies whether the data bar has a negative bar color that is different from the positive bar color |
| negativeBarBorderColorSameAsPositive  |          | true        | Specifies whether the data bar has a negative border color that is different from the positive border color |
| axisPosition  |       | 'auto'             | Specifies the axis position for the data bar |
| direction  |          | 'leftToRight'      | Specifies the direction of the data bar |
| cfvo          |          |         | array of 2 to 5 Conditional Formatting Value Objects specifying way-points in the value range |
| style         |          |         | style structure to apply if the comparison returns true |

### Contains Text[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field    | Optional | Default | Description |
| -------- | -------- | ------- | ----------- |
| type     |          |         | 'containsText' |
| priority | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| operator |          |         | type of text comparison |
| text     |          |         | text to search for |
| style    |          |         | style structure to apply if the comparison returns true |

**Contains Text Operators**

| Operator          | Description |
| ----------------- | ----------- |
| containsText      | Apply format if cell value contains the value specified in the 'text' field |
| containsBlanks    | Apply format if cell value contains blanks |
| notContainsBlanks | Apply format if cell value does not contain blanks |
| containsErrors    | Apply format if cell value contains errors |
| notContainsErrors | Apply format if cell value does not contain errors |

### Time Period[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field      | Optional | Default | Description |
| ---------- | -------- | ------- | ----------- |
| type       |          |         | 'timePeriod' |
| priority   | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| timePeriod |          |         | what time period to compare cell value to |
| style      |          |         | style structure to apply if the comparison returns true |

**Time Periods**

| Time Period       | Description |
| ----------------- | ----------- |
| lastWeek          | Apply format if cell value falls within the last week |
| thisWeek          | Apply format if cell value falls in this week |
| nextWeek          | Apply format if cell value falls in the next week |
| yesterday         | Apply format if cell value is equal to yesterday |
| today             | Apply format if cell value is equal to today |
| tomorrow          | Apply format if cell value is equal to tomorrow |
| last7Days         | Apply format if cell value falls within the last 7 days |
| lastMonth         | Apply format if cell value falls in last month |
| thisMonth         | Apply format if cell value falls in this month |
| nextMonth         | Apply format if cell value falls in next month |

## Outline Levels[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Excel supports outlining; where rows or columns can be expanded or collapsed depending on what level of detail the user wishes to view.

Outline levels can be defined in column setup:
```javascript
worksheet.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32 },
  { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
];
```

Or directly on the row or column
```javascript
worksheet.getColumn(3).outlineLevel = 1;
worksheet.getRow(3).outlineLevel = 1;
```

The sheet outline levels can be set on the worksheet
```javascript
// set column outline level
worksheet.properties.outlineLevelCol = 1;

// set row outline level
worksheet.properties.outlineLevelRow = 1;
```

Note: adjusting outline levels on rows or columns or the outline levels on the worksheet will incur a side effect of also modifying the collapsed property of all rows or columns affected by the property change. E.g.:
```javascript
worksheet.properties.outlineLevelCol = 1;

worksheet.getColumn(3).outlineLevel = 1;
expect(worksheet.getColumn(3).collapsed).to.be.true;

worksheet.properties.outlineLevelCol = 2;
expect(worksheet.getColumn(3).collapsed).to.be.false;
```

The outline properties can be set on the worksheet

```javascript
worksheet.properties.outlineProperties = {
  summaryBelow: false,
  summaryRight: false,
};
```

## Images[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Adding images to a worksheet is a two-step process.
First, the image is added to the workbook via the addImage() function which will also return an imageId value.
Then, using the imageId, the image can be added to the worksheet either as a tiled background or covering a cell range.

Note: As of this version, adjusting or transforming the image is not supported and images are not supported in streaming mode.

### Add Image to Workbook[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The Workbook.addImage function supports adding images by filename or by Buffer.
Note that in both cases, the extension must be specified.
Valid extension values include 'jpeg', 'png', 'gif'.

```javascript
// add image to workbook by filename
const imageId1 = workbook.addImage({
  filename: 'path/to/image.jpg',
  extension: 'jpeg',
});

// add image to workbook by buffer
const imageId2 = workbook.addImage({
  buffer: fs.readFileSync('path/to.image.png'),
  extension: 'png',
});

// add image to workbook by base64
const myBase64Image = "data:image/png;base64,iVBORw0KG...";
const imageId2 = workbook.addImage({
  base64: myBase64Image,
  extension: 'png',
});
```

### Add image background to worksheet[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Using the image id from Workbook.addImage, the background to a worksheet can be set using the addBackgroundImage function

```javascript
// set background
worksheet.addBackgroundImage(imageId1);
```

### Add image over a range[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Using the image id from Workbook.addImage, an image can be embedded within the worksheet to cover a range.
The coordinates calculated from the range will cover from the top-left of the first cell to the bottom right of the second.

```javascript
// insert an image over B2:D6
worksheet.addImage(imageId2, 'B2:D6');
```

Using a structure instead of a range string, it is possible to partially cover cells.

Note that the coordinate system used for this is zero based, so the top-left of A1 will be { col: 0, row: 0 }.
Fractions of cells can be specified by using floating point numbers, e.g. the midpoint of A1 is { col: 0.5, row: 0.5 }.

```javascript
// insert an image over part of B2:D6
worksheet.addImage(imageId2, {
  tl: { col: 1.5, row: 1.5 },
  br: { col: 3.5, row: 5.5 }
});
```

The cell range can also have the property 'editAs' which will control how the image is anchored to the cell(s)
It can have one of the following values:

| Value     | Description |
| --------- | ----------- |
| undefined | It specifies the image will be moved and sized with cells |
| oneCell   | This is the default. Image will be moved with cells but not sized |
| absolute  | Image will not be moved or sized with cells |

```javascript
ws.addImage(imageId, {
  tl: { col: 0.1125, row: 0.4 },
  br: { col: 2.101046875, row: 3.4 },
  editAs: 'oneCell'
});
```

### Add image to a cell[⬆](../README.md#contents)<!-- Link generated with jump2header -->

You can add an image to a cell and then define its width and height in pixels at 96dpi.

```javascript
worksheet.addImage(imageId2, {
  tl: { col: 0, row: 0 },
  ext: { width: 500, height: 200 }
});
```

### Add image with hyperlinks[⬆](../README.md#contents)<!-- Link generated with jump2header -->

You can add an image with hyperlinks to a cell, and defines the hyperlinks in image range.

```javascript
worksheet.addImage(imageId2, {
  tl: { col: 0, row: 0 },
  ext: { width: 500, height: 200 },
  hyperlinks: {
    hyperlink: 'http://www.somewhere.com',
    tooltip: 'http://www.somewhere.com'
  }
});
```

## Sheet Protection[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Worksheets can be protected from modification by adding a password.

```javascript
await worksheet.protect('the-password', options);
```

Worksheet protection can also be removed:

```javascript
worksheet.unprotect();
```


See <a href="#cell-protection">Cell Protection</a> for details on how
to modify individual cell protection.

**Note:** While the protect() function returns a Promise indicating
that it is async, the current implementation runs on the main
thread and will use approx 600ms on an average CPU. This can be adjusted
by setting the spinCount, which can be used to make the process either
faster or more resilient.

### Sheet Protection Options[⬆](../README.md#contents)<!-- Link generated with jump2header -->

| Field               | Default | Description |
| ------------------- | ------- | ----------- |
| selectLockedCells   | true    | Lets the user select locked cells |
| selectUnlockedCells | true    | Lets the user select unlocked cells |
| formatCells         | false   | Lets the user format cells |
| formatColumns       | false   | Lets the user format columns |
| formatRows          | false   | Lets the user format rows |
| insertRows          | false   | Lets the user insert rows |
| insertColumns       | false   | Lets the user insert columns |
| insertHyperlinks    | false   | Lets the user insert hyperlinks |
| deleteRows          | false   | Lets the user delete rows |
| deleteColumns       | false   | Lets the user delete columns |
| sort                | false   | Lets the user sort data |
| autoFilter          | false   | Lets the user filter data in tables |
| pivotTables         | false   | Lets the user use pivot tables |
| spinCount           | 100000  | The number of hash iterations performed when protecting or unprotecting |
