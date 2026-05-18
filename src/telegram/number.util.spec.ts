import { normalizeMyanmarDigits, parseMyanmarNumber } from './number.util';

describe('number util', () => {
  it('normalizes Myanmar digits to ASCII digits', () => {
    expect(normalizeMyanmarDigits('၄၃')).toBe('43');
    expect(normalizeMyanmarDigits('၇A')).toBe('7A');
  });

  it('parses Myanmar digits and common Burmese number words', () => {
    expect(parseMyanmarNumber('၁၀')).toBe(10);
    expect(parseMyanmarNumber('လေး')).toBe(4);
    expect(parseMyanmarNumber('ဆယ်')).toBe(10);
  });
});
