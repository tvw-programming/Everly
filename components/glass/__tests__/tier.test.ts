import { pickGlassTier } from '../tier';

describe('pickGlassTier', () => {
  it('is solid for the plain style regardless of platform', () => {
    expect(pickGlassTier({ os: 'ios', liquidAvailable: true, reduceTransparency: false, style: 'plain' })).toBe('solid');
  });

  it('is solid when the user reduces transparency', () => {
    expect(pickGlassTier({ os: 'ios', liquidAvailable: true, reduceTransparency: true, style: 'glass3d' })).toBe('solid');
  });

  it('uses liquid glass on iOS 26+', () => {
    expect(pickGlassTier({ os: 'ios', liquidAvailable: true, reduceTransparency: false, style: 'glass3d' })).toBe('liquid');
  });

  it('falls back to blur on older iOS', () => {
    expect(pickGlassTier({ os: 'ios', liquidAvailable: false, reduceTransparency: false, style: 'glass3d' })).toBe('blur');
  });

  it('uses the gradient fallback on Android and web', () => {
    expect(pickGlassTier({ os: 'android', liquidAvailable: false, reduceTransparency: false, style: 'glass3d' })).toBe('gradient');
    expect(pickGlassTier({ os: 'web', liquidAvailable: false, reduceTransparency: false, style: 'gradient' })).toBe('gradient');
  });
});
