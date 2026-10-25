import { contrastRatio, mix, parseHex, pickOnColor } from '../color';

describe('contrastRatio', () => {
  it('is 21 for white on black', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });

  it('is 1 for identical colours', () => {
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });
});

describe('mix', () => {
  it('blends halfway between black and white', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('returns the first colour at t=0', () => {
    expect(mix('#0ea5a8', '#FFFFFF', 0)).toBe('#0EA5A8');
  });
});

describe('parseHex', () => {
  it('parses six-digit hex', () => {
    expect(parseHex('#0ea5a8')).toEqual([14, 165, 168]);
  });

  it('expands three-digit hex', () => {
    expect(parseHex('#FFF')).toEqual([255, 255, 255]);
  });
});

describe('pickOnColor', () => {
  it('uses dark ink on amber, where white would be unreadable', () => {
    expect(pickOnColor('#F59E0B')).toBe('#0B1220');
  });

  it('uses white on indigo', () => {
    expect(pickOnColor('#6366F1')).toBe('#FFFFFF');
  });
});
