import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import Enums from '#src/core/enums';
import XmlStream from '#src/utils/stream/xml-stream';
import WorksheetXform from '#src/formats/xlsx/xml/sheet/worksheet-xform';

import SharedStringsXform from '#src/formats/xlsx/xml/strings/shared-strings-xform';
import StylesXform from '#src/formats/xlsx/xml/style/styles-xform';

import sheet10 from '#fixtures/json/sheet.1.0.json' with { type: 'json' };
import sheet11 from '#fixtures/json/sheet.1.1.json' with { type: 'json' };
import sheet13 from '#fixtures/json/sheet.1.3.json' with { type: 'json' };
import sheet14 from '#fixtures/json/sheet.1.4.json' with { type: 'json' };
import sheet20 from '#fixtures/json/sheet.2.0.json' with { type: 'json' };
import sheet21 from '#fixtures/json/sheet.2.1.json' with { type: 'json' };
import sheet31 from '#fixtures/json/sheet.3.1.json' with { type: 'json' };
import sheet40 from '#fixtures/json/sheet.4.0.json' with { type: 'json' };
import sheet50 from '#fixtures/json/sheet.5.0.json' with { type: 'json' };
import sheet51 from '#fixtures/json/sheet.5.1.json' with { type: 'json' };
import sheet53 from '#fixtures/json/sheet.5.3.json' with { type: 'json' };
import sheet54 from '#fixtures/json/sheet.5.4.json' with { type: 'json' };
import sheet61 from '#fixtures/json/sheet.6.1.json' with { type: 'json' };
import sheet63 from '#fixtures/json/sheet.6.3.json' with { type: 'json' };
import sheet70 from '#fixtures/json/sheet.7.0.json' with { type: 'json' };
import sheet71 from '#fixtures/json/sheet.7.1.json' with { type: 'json' };

function readXml(name: string): string {
  return readFileSync(new URL(`../../../../../fixtures/xml/${name}`, import.meta.url), 'utf8');
}

const fakeStyles = {
  addStyleModel(style: any, cellType: any) {
    if (cellType === Enums.ValueType.Date) {
      return 1;
    }
    if (style && style.font) {
      return 2;
    }
    return 0;
  },
  getStyleModel(id: any) {
    switch (id) {
      case 1:
        return { numFmt: 'mm-dd-yy' };
      case 2:
        return {
          font: {
            underline: true,
            size: 11,
            color: { theme: 10 },
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
        };
      default:
        return null;
    }
  },
};

const fakeHyperlinkMap = {
  B6: 'https://www.npmjs.com/package/exceljs',
};

function fixDate(model: any) {
  model.rows[3].cells[1].value = new Date(model.rows[3].cells[1].value);
  return model;
}

const expectations = [
  {
    title: 'Sheet 1',
    create: () => new WorksheetXform(),
    initialModel: fixDate(sheet10 as any),
    preparedModel: fixDate(sheet11 as any),
    xml: readXml('sheet.1.2.xml'),
    parsedModel: sheet13,
    reconciledModel: fixDate(sheet14 as any),
    tests: ['prepare', 'render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 2 - Data Validations',
    create: () => new WorksheetXform(),
    initialModel: sheet20,
    preparedModel: sheet21,
    xml: readXml('sheet.2.2.xml'),
    tests: ['prepare', 'render'],
    options: {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 3 - Empty Sheet',
    create: () => new WorksheetXform(),
    preparedModel: sheet31,
    xml: readXml('sheet.3.2.xml'),
    tests: ['render'],
    options: {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
    },
  },
  {
    title: 'Sheet 5 - Shared Formulas',
    create: () => new WorksheetXform(),
    initialModel: sheet50,
    preparedModel: sheet51,
    xml: readXml('sheet.5.2.xml'),
    parsedModel: sheet53,
    reconciledModel: sheet54,
    tests: ['prepare-render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 6 - AutoFilter',
    create: () => new WorksheetXform(),
    preparedModel: sheet61,
    xml: readXml('sheet.6.2.xml'),
    parsedModel: sheet63,
    tests: ['render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 7 - Row Breaks',
    create: () => new WorksheetXform(),
    initialModel: sheet70,
    preparedModel: sheet71,
    xml: readXml('sheet.7.2.xml'),
    tests: ['prepare', 'render'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
];

describe('WorksheetXform', () => {
  testXformHelper(expectations);

  it('hyperlinks must be after dataValidations', () => {
    const xform = new WorksheetXform();
    const model = sheet40 as any;
    const xmlStream = new XmlStream();
    const options = {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
    };
    xform.prepare(model, options);
    xform.render(xmlStream, model);

    const { xml } = xmlStream;
    const iHyperlinks = xml.indexOf('hyperlinks');
    const iDataValidations = xml.indexOf('dataValidations');
    expect(iHyperlinks).not.to.equal(-1);
    expect(iDataValidations).not.to.equal(-1);
    expect(iHyperlinks).to.be.greaterThan(iDataValidations);
  });

  it('conditionalFormattings must be before dataValidations', () => {
    const xform = new WorksheetXform();
    const model = sheet40 as any;
    const xmlStream = new XmlStream();
    const options = {
      styles: new StylesXform(true),
      hyperlinks: [],
    };
    xform.prepare(model, options);
    xform.render(xmlStream, model);

    const { xml } = xmlStream;
    const iConditionalFormatting = xml.indexOf('conditionalFormatting');
    const iDataValidations = xml.indexOf('dataValidations');
    expect(iConditionalFormatting).not.to.equal(-1);
    expect(iDataValidations).not.to.equal(-1);
    expect(iConditionalFormatting).to.be.lessThan(iDataValidations);
  });
});
