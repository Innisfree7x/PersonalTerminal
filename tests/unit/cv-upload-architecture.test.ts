import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CV upload architecture guardrails', () => {
  it('uses server upload endpoint instead of direct browser storage write', () => {
    const filePath = path.resolve(process.cwd(), 'components/features/career/CvUpload.tsx');
    const source = fs.readFileSync(filePath, 'utf8');

    expect(source).toContain("fetch('/api/cv/upload'");
    expect(source).not.toContain('supabaseBrowser.storage');
    expect(source).not.toContain(".storage\n          .from(");
  });
});
