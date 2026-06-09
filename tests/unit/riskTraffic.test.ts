import { describe, expect, test } from 'vitest';

import {
  computeStudyRisk,
  computeFinanceRisk,
  computeBodyRisk,
  computeFocusRisk,
  computeRiskLights,
  computeControlScore,
  pickNextStep,
} from '@/lib/dashboard/riskTraffic';

describe('computeStudyRisk', () => {
  test('on_track → green', () => {
    expect(computeStudyRisk('on_track', 9).level).toBe('green');
  });
  test('tight → amber', () => {
    expect(computeStudyRisk('tight', 5).level).toBe('amber');
  });
  test('at_risk → red mit Detail', () => {
    const r = computeStudyRisk('at_risk', 9);
    expect(r.level).toBe('red');
    expect(r.detail).toBe('Prüfung in 9d');
  });
  test('kein Ziel → unknown', () => {
    expect(computeStudyRisk(null, null).level).toBe('unknown');
  });
});

describe('computeFinanceRisk', () => {
  test('kein Check-in → unknown', () => {
    expect(computeFinanceRisk(null).level).toBe('unknown');
    expect(computeFinanceRisk({}).level).toBe('unknown');
  });
  test('nicht clean → red', () => {
    expect(computeFinanceRisk({ clean: false }).level).toBe('red');
  });
  test('hoher Drang → amber', () => {
    expect(computeFinanceRisk({ clean: true, gamblingRisk: 4 }).level).toBe('amber');
  });
  test('clean + kein Drang → green', () => {
    expect(computeFinanceRisk({ clean: true, gamblingRisk: 1 }).level).toBe('green');
  });
});

describe('computeBodyRisk', () => {
  test('kein Check-in → unknown', () => {
    expect(computeBodyRisk({}).level).toBe('unknown');
  });
  test('kein Gym + wenig Schlaf → red', () => {
    expect(computeBodyRisk({ gym: false, sleep: 1 }).level).toBe('red');
  });
  test('Gym + guter Schlaf → green', () => {
    expect(computeBodyRisk({ gym: true, sleep: 3 }).level).toBe('green');
  });
});

describe('computeFocusRisk', () => {
  test('kein Signal → unknown', () => {
    expect(computeFocusRisk({}, null).level).toBe('unknown');
  });
  test('hoher Fokus + volle Erfüllung → green', () => {
    expect(computeFocusRisk({ focus: 3 }, 1).level).toBe('green');
  });
  test('niedriger Fokus + keine Erfüllung → red', () => {
    expect(computeFocusRisk({ focus: 1 }, 0).level).toBe('red');
  });
});

describe('computeControlScore', () => {
  test('ignoriert unknown, mittelt fills', () => {
    const lights = computeRiskLights({
      trajectoryStatus: 'on_track',
      daysUntilExam: 10,
      responses: { clean: true, gamblingRisk: 1, gym: true, sleep: 3, focus: 3 },
      fulfillmentRate: 1,
    });
    const score = computeControlScore(lights);
    expect(score).toBeGreaterThan(80);
  });
  test('alles unknown → 50', () => {
    const lights = computeRiskLights({});
    expect(computeControlScore(lights)).toBe(50);
  });
});

describe('pickNextStep', () => {
  test('wählt die rote Domain', () => {
    const lights = computeRiskLights({
      trajectoryStatus: 'at_risk',
      daysUntilExam: 9,
      responses: { clean: true, gamblingRisk: 1, gym: true, sleep: 3, focus: 3 },
      fulfillmentRate: 1,
    });
    const step = pickNextStep(lights);
    expect(step?.domain).toBe('study');
    expect(step?.href).toBe('/uni/courses');
  });
  test('alles grün → null', () => {
    const lights = computeRiskLights({
      trajectoryStatus: 'on_track',
      daysUntilExam: 30,
      responses: { clean: true, gamblingRisk: 1, gym: true, sleep: 3, focus: 3 },
      fulfillmentRate: 1,
    });
    expect(pickNextStep(lights)).toBeNull();
  });
});
