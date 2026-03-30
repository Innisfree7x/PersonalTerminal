import { describe, expect, it } from 'vitest';
import {
  buildTrajectoryProofInsight,
  formatTrajectoryProofDateLabel,
  getTrajectoryProofStatusTone,
} from '@/components/features/marketing/trajectoryProof';

describe('trajectoryProof', () => {
  it('formatiert ISO-Datum als deutsches Label', () => {
    expect(formatTrajectoryProofDateLabel('2027-03-01')).toBe('01.03.2027');
  });

  it('gibt bei ungueltigem Datum den Ursprungswert zurueck', () => {
    expect(formatTrajectoryProofDateLabel('kein-datum')).toBe('kein-datum');
  });

  it('erklaert on_track konkret mit Kapazitaet und Startfenster', () => {
    expect(buildTrajectoryProofInsight('on_track', 18, '09.11.2026')).toContain('18h pro Woche');
    expect(buildTrajectoryProofInsight('on_track', 18, '09.11.2026')).toContain('09.11.2026');
  });

  it('erklaert tight als enges Startfenster', () => {
    expect(buildTrajectoryProofInsight('tight', 18, '09.11.2026')).toContain('wird es eng');
  });

  it('erklaert at_risk als bereits zu spaet', () => {
    expect(buildTrajectoryProofInsight('at_risk', 18, '09.11.2026')).toContain('bereits zu spaet');
  });

  it('liefert konsistente Status-Farbtoene', () => {
    expect(getTrajectoryProofStatusTone('on_track')).toBe('text-emerald-400');
    expect(getTrajectoryProofStatusTone('tight')).toBe('text-primary');
    expect(getTrajectoryProofStatusTone('at_risk')).toBe('text-red-400');
  });
});
