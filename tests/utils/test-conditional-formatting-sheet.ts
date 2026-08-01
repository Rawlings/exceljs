import tools from './tools';
import conditionalFormattingData from './data/conditional-formatting.json';

const self: any = {
  conditionalFormattings: tools.fix(conditionalFormattingData),
  getConditionalFormatting(type: string) {
    return self.conditionalFormattings[type] || null;
  },
  addSheet(wb: any) {
    const ws = wb.addWorksheet('conditional-formatting');
    const { types } = self.conditionalFormattings;
    types.forEach((type: string) => {
      const conditionalFormatting = self.getConditionalFormatting(type);
      if (conditionalFormatting) {
        ws.addConditionalFormatting(conditionalFormatting);
      }
    });
  },

  checkSheet(wb: any) {
    const ws = wb.getWorksheet('conditional-formatting');
    expect(ws).toBeDefined();
    expect(ws.conditionalFormattings).toBeDefined();
    (ws.conditionalFormattings && ws.conditionalFormattings).forEach((item: any) => {
      const type = item.rules && item.rules[0].type;
      const conditionalFormatting = self.getConditionalFormatting(type);
      expect(item).to.have.property('ref');
      expect(item).to.have.property('rules');
      expect(self.conditionalFormattings[type]).to.have.property('ref');
      expect(self.conditionalFormattings[type]).to.have.property('rules');
      expect(item.ref).to.deep.equal(conditionalFormatting.ref);
      expect(item.rules.length).to.equal(conditionalFormatting.rules.length);
    });
  },
};

export default self;
