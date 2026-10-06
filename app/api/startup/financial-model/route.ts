import { NextRequest, NextResponse } from 'next/server';
import modelData from '@/lib/data/startupFinancialModel.json';
import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'base';

    // If json file exists on disk, read it directly for freshest data
    const jsonPath = path.join(process.cwd(), 'lib/data/startupFinancialModel.json');
    let data = modelData;
    if (fs.existsSync(jsonPath)) {
      try {
        const fileContent = fs.readFileSync(jsonPath, 'utf8');
        data = JSON.parse(fileContent);
      } catch {
        data = modelData;
      }
    }

    if (scenario === 'bull') {
      const bullFactor = data.scenarios.factors.bull;
      const adjustedMonthly = data.monthly.map((m) => ({
        ...m,
        revenue: Math.round(m.revenue * bullFactor.traffic * bullFactor.conversion * 100) / 100,
        grossProfit: Math.round(m.grossProfit * bullFactor.traffic * bullFactor.conversion * 100) / 100,
        cashEnding: Math.round(m.cashEnding * 1.15 * 100) / 100,
      }));
      return NextResponse.json({
        ...data,
        activeScenario: 'bull',
        monthly: adjustedMonthly,
      });
    }

    if (scenario === 'bear') {
      const bearFactor = data.scenarios.factors.bear;
      const adjustedMonthly = data.monthly.map((m) => ({
        ...m,
        revenue: Math.round(m.revenue * bearFactor.traffic * bearFactor.conversion * 100) / 100,
        grossProfit: Math.round(m.grossProfit * bearFactor.traffic * bearFactor.conversion * 100) / 100,
        cashEnding: Math.round(m.cashEnding * 0.85 * 100) / 100,
      }));
      return NextResponse.json({
        ...data,
        activeScenario: 'bear',
        monthly: adjustedMonthly,
      });
    }

    return NextResponse.json({
      ...data,
      activeScenario: 'base',
    });
  } catch (error) {
    console.error('Failed to load financial model:', error);
    return NextResponse.json(
      { error: 'Failed to load financial model', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts/parseFinancialModel.py');
    await execFileAsync('python3', [scriptPath]);

    const jsonPath = path.join(process.cwd(), 'lib/data/startupFinancialModel.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const freshData = JSON.parse(fileContent);

    return NextResponse.json({
      success: true,
      data: freshData,
    });
  } catch (error) {
    console.error('Failed to reparse financial model:', error);
    return NextResponse.json(
      { error: 'Failed to reparse model', details: String(error) },
      { status: 500 }
    );
  }
}
