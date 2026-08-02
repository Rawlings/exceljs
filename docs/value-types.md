# Value Types[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The following value types are supported.

## Null Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Null

A null value indicates an absence of value and will typically not be stored when written to file (except for merged cells).
  It can be used to remove the value from a cell.

E.g.

```javascript
worksheet.getCell('A1').value = null;
```

## Merge Cell[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Merge

A merge cell is one that has its value bound to another 'master' cell.
  Assigning to a merge cell will cause the master's cell to be modified.

## Number Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Number

A numeric value.

E.g.

```javascript
worksheet.getCell('A1').value = 5;
worksheet.getCell('A2').value = 3.14159;
```

## String Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.String

A simple text string.

E.g.

```javascript
worksheet.getCell('A1').value = 'Hello, World!';
```

## Date Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Date

A date value, represented by the JavaScript Date type.

E.g.

```javascript
worksheet.getCell('A1').value = new Date(2017, 2, 15);
```

## Hyperlink Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Hyperlink

A URL with both text and link value.

E.g.
```javascript
// link to web
worksheet.getCell('A1').value = {
  text: 'www.mylink.com',
  hyperlink: 'http://www.mylink.com',
  tooltip: 'www.mylink.com'
};

// internal link
worksheet.getCell('A1').value = { text: 'Sheet2', hyperlink: '#\'Sheet2\'!A1' };
```

## Formula Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Formula

An Excel formula for calculating values on the fly.
  Note that while the cell type will be Formula, the cell may have an effectiveType value that will
  be derived from the result value.

Note that ExcelJS cannot process the formula to generate a result, it must be supplied.

Note that function semantic names must be in English and the separator must be a comma.

E.g.

```javascript
worksheet.getCell('A3').value = { formula: 'A1+A2', result: 7 };
worksheet.getCell('A3').value = { formula: 'SUM(A1,A2)', result: 7 };
```

Cells also support convenience getters to access the formula and result:

```javascript
worksheet.getCell('A3').formula === 'A1+A2';
worksheet.getCell('A3').result === 7;
```

### Shared Formula[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Shared formulae enhance the compression of the xlsx document by decreasing the repetition
of text within the worksheet xml.
The top-left cell in a range is the designated master and will hold the
formula that all the other cells in the range will derive from.
The other 'slave' cells can then refer to this master cell instead of redefining the
whole formula again.
Note that the master formula will be translated to the slave cells in the usual
Excel fashion so that references to other cells will be shifted down and
to the right depending on the slave's offset to the master.
For example: if the master cell A2 has a formula referencing A1 then
if cell B2 shares A2's formula, then it will reference B1.

A master formula can be assigned to a cell along with the slave cells in its range

```javascript
worksheet.getCell('A2').value = {
  formula: 'A1',
  result: 10,
  shareType: 'shared',
  ref: 'A2:B3'
};
```

A shared formula can be assigned to a cell using a new value form:

```javascript
worksheet.getCell('B2').value = { sharedFormula: 'A2', result: 10 };
```

This specifies that the cell B2 is a formula that will be derived from the formula in
A2 and its result is 10.

The formula convenience getter will translate the formula in A2 to what it should be in B2:

```javascript
expect(worksheet.getCell('B2').formula).to.equal('B1');
```

Shared formulae can be assigned into a sheet using the 'fillFormula' function:

```javascript
// set A1 to starting number
worksheet.getCell('A1').value = 1;

// fill A2 to A10 with ascending count starting from A1
worksheet.fillFormula('A2:A10', 'A1+1', [2,3,4,5,6,7,8,9,10]);
```

fillFormula can also use a callback function to calculate the value at each cell

```javascript
// fill A2 to A100 with ascending count starting from A1
worksheet.fillFormula('A2:A100', 'A1+1', (row, col) => row);
```

### Formula Type[⬆](../README.md#contents)<!-- Link generated with jump2header -->

To distinguish between real and translated formula cells, use the formulaType getter:

```javascript
worksheet.getCell('A3').formulaType === Enums.FormulaType.Master;
worksheet.getCell('B3').formulaType === Enums.FormulaType.Shared;
```

Formula type has the following values:

| Name                       |  Value  |
| -------------------------- | ------- |
| Enums.FormulaType.None     |   0     |
| Enums.FormulaType.Master   |   1     |
| Enums.FormulaType.Shared   |   2     |

### Array Formula[⬆](../README.md#contents)<!-- Link generated with jump2header -->

A new way of expressing shared formulae in Excel is the array formula.
In this form, the master cell is the only cell that contains any information relating to a formula.
It contains the shareType 'array' along with the range of cells it applies to and the formula that will be copied.
The rest of the cells are regular cells with regular values.

Note: array formulae are not translated in the way shared formulae are.
So if master cell A2 refers to A1, then slave cell B2 will also refer to A1.

E.g.
```javascript
// assign array formula to A2:B3
worksheet.getCell('A2').value = {
  formula: 'A1',
  result: 10,
  shareType: 'array',
  ref: 'A2:B3'
};

// it may not be necessary to fill the rest of the values in the sheet
```

The fillFormula function can also be used to fill an array formula

```javascript
// fill A2:B3 with array formula "A1"
worksheet.fillFormula('A2:B3', 'A1', [1,1,1,1], 'array');
```


## Rich Text Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.RichText

Rich, styled text.

E.g.
```javascript
worksheet.getCell('A1').value = {
  richText: [
    { text: 'This is '},
    {font: {italic: true}, text: 'italic'},
  ]
};
```

## Boolean Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Boolean

E.g.

```javascript
worksheet.getCell('A1').value = true;
worksheet.getCell('A2').value = false;
```

## Error Value[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Error

E.g.

```javascript
worksheet.getCell('A1').value = { error: '#N/A' };
worksheet.getCell('A2').value = { error: '#VALUE!' };
```

The current valid Error text values are:

| Name                           | Value       |
| ------------------------------ | ----------- |
| Excel.ErrorValue.NotApplicable | #N/A        |
| Excel.ErrorValue.Ref           | #REF!       |
| Excel.ErrorValue.Name          | #NAME?      |
| Excel.ErrorValue.DivZero       | #DIV/0!     |
| Excel.ErrorValue.Null          | #NULL!      |
| Excel.ErrorValue.Value         | #VALUE!     |
| Excel.ErrorValue.Num           | #NUM!       |
