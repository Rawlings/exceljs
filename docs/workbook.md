# Workbook Operations

## Create a Workbook[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
const workbook = new ExcelJS.Workbook();
```

## Set Workbook Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
workbook.creator = 'Me';
workbook.lastModifiedBy = 'Her';
workbook.created = new Date(1985, 8, 30);
workbook.modified = new Date();
workbook.lastPrinted = new Date(2016, 9, 27);
```

```javascript
// Set workbook dates to 1904 date system
workbook.properties.date1904 = true;
```

## Set Calculation Properties[⬆](../README.md#contents)<!-- Link generated with jump2header -->

```javascript
// Force workbook calculation on load
workbook.calcProperties.fullCalcOnLoad = true;
```

## Workbook Views[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The Workbook views controls how many separate windows Excel will open when viewing the workbook.

```javascript
workbook.views = [
  {
    x: 0, y: 0, width: 10000, height: 20000,
    firstSheet: 0, activeTab: 1, visibility: 'visible'
  }
]
```
