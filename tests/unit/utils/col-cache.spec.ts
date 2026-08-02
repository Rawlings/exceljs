import colCache from '#src/utils/data/col-cache';

describe('colCache', () => {
  it('converts numbers to letters', () => {
    expect(colCache.n2l(1)).to.equal('A');
    expect(colCache.n2l(26)).to.equal('Z');
    expect(colCache.n2l(27)).to.equal('AA');
    expect(colCache.n2l(702)).to.equal('ZZ');
    expect(colCache.n2l(703)).to.equal('AAA');
  });

  it('converts letters to numbers', () => {
    expect(colCache.l2n('A')).to.equal(1);
    expect(colCache.l2n('Z')).to.equal(26);
    expect(colCache.l2n('AA')).to.equal(27);
    expect(colCache.l2n('ZZ')).to.equal(702);
    expect(colCache.l2n('AAA')).to.equal(703);
  });

  it('throws when out of bounds', () => {
    expect(() => {
      colCache.n2l(0);
    }).to.throw(Error);
    expect(() => {
      colCache.n2l(-1);
    }).to.throw(Error);
    expect(() => {
      colCache.n2l(16385);
    }).to.throw(Error);

    expect(() => {
      colCache.l2n('');
    }).to.throw(Error);
    expect(() => {
      colCache.l2n('AAAA');
    }).to.throw(Error);
    expect(() => {
      colCache.l2n('16385');
    }).to.throw(Error);
  });

  it('validates addresses properly', () => {
    expect(colCache.validateAddress('A1')).to.be.ok;
    expect(colCache.validateAddress('AA10')).to.be.ok;
    expect(colCache.validateAddress('ABC100000')).to.be.ok;

    expect(() => {
      colCache.validateAddress('A');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('1');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('1A');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('A1A');
    }).to.throw(Error);
  });

  it('decodes addresses properly', () => {
    expect(colCache.decodeAddress('A1')).to.deep.equal({
      address: 'A1',
      col: 1,
      row: 1,
      $col$row: '$A$1',
    });
    expect(colCache.decodeAddress('B2')).to.deep.equal({
      address: 'B2',
      col: 2,
      row: 2,
      $col$row: '$B$2',
    });
  });

  it('decodes ranges properly', () => {
    expect(colCache.decode('A1:B2')).to.deep.equal({
      top: 1,
      left: 1,
      bottom: 2,
      right: 2,
      tl: 'A1',
      br: 'B2',
      dimensions: 'A1:B2',
    });
  });
});
