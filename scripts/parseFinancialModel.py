#!/usr/bin/env python3
import json
import os
import zipfile
import xml.etree.ElementTree as ET

def parse_full_model(xlsx_path):
    if not os.path.exists(xlsx_path):
        raise FileNotFoundError(f"Financial model not found at {xlsx_path}")

    z = zipfile.ZipFile(xlsx_path)
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        sst = ET.fromstring(z.read('xl/sharedStrings.xml'))
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for si in sst.findall('.//main:si', ns):
            text = ''.join(t.text for t in si.findall('.//main:t', ns) if t.text)
            shared_strings.append(text)

    def get_sheet_cells(sheet_idx):
        sheet_path = f'xl/worksheets/sheet{sheet_idx}.xml'
        if sheet_path not in z.namelist():
            return {}
        sheet_data = ET.fromstring(z.read(sheet_path))
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        cells = {}
        for r in sheet_data.findall('.//main:row', ns):
            for c in r.findall('main:c', ns):
                cell_ref = c.attrib.get('r')
                val = c.find('main:v', ns)
                cell_val = val.text if val is not None else ''
                if c.attrib.get('t') == 's' and cell_val.isdigit():
                    cell_val = shared_strings[int(cell_val)]
                cells[cell_ref] = cell_val
        return cells

    # Sheet 2: Assumptions
    # Sheet 3: P&L
    # Sheet 6: Unit Economics
    # Sheet 8: DCF
    assumptions = get_sheet_cells(2)
    pnl = get_sheet_cells(3)
    ue = get_sheet_cells(6)
    dcf = get_sheet_cells(8)

    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    col_letters = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']

    monthly = []
    for m, col in zip(months, col_letters):
        organic_traffic = float(pnl.get(f'{col}5', 0) or 0)
        paid_traffic = float(pnl.get(f'{col}6', 0) or 0)
        total_traffic = float(pnl.get(f'{col}7', 0) or 0)
        total_orders = float(pnl.get(f'{col}14', 0) or 0)
        aov = float(pnl.get(f'{col}15', 0) or 0)
        rev = float(pnl.get(f'{col}18', 0) or 0)
        gp = float(pnl.get(f'{col}20', 0) or 0)
        gp_margin = float(pnl.get(f'{col}21', 0) or 0)
        cm = float(pnl.get(f'{col}28', 0) or 0)
        cm_margin = float(pnl.get(f'{col}29', 0) or 0)
        burn = float(ue.get(f'{col}27', 0) or 0)
        cash = float(ue.get(f'{col}28', 0) or 0)
        runway = float(ue.get(f'{col}29', 0) or 0)
        cac = float(ue.get(f'{col}10', 0) or 0)
        ltv = float(ue.get(f'{col}21', 0) or 0)
        payback = float(ue.get(f'{col}23', 0) or 0)

        monthly.append({
            'month': m,
            'organicTraffic': int(round(organic_traffic)),
            'paidTraffic': int(round(paid_traffic)),
            'totalTraffic': int(round(total_traffic)),
            'totalOrders': int(round(total_orders)),
            'aov': round(aov, 2),
            'revenue': round(rev, 2),
            'grossProfit': round(gp, 2),
            'grossMargin': round(gp_margin * 100, 1),
            'contributionMargin': round(cm, 2),
            'contributionMarginPct': round(cm_margin * 100, 1),
            'netBurn': round(burn, 2),
            'cashEnding': round(cash, 2),
            'runwayMonths': round(runway, 1),
            'cac': round(cac, 2),
            'ltv': round(ltv, 2),
            'ltvCacRatio': round(ltv / cac, 2) if cac > 0 else 0,
            'paybackMonths': round(payback, 1)
        })

    # 5-Year DCF Projection
    dcf_years = []
    year_cols = ['D', 'E', 'F', 'G']
    year_labels = ['Y1 (Actual)', 'Y2 (Est.)', 'Y3 (Est.)', 'Y4 (Est.)']
    for y_col, y_lbl in zip(year_cols, year_labels):
        dcf_years.append({
            'year': y_lbl,
            'revenue': round(float(dcf.get(f'{y_col}20', 0) or 0), 2),
            'ebitda': round(float(dcf.get(f'{y_col}21', 0) or 0), 2),
            'ebitdaMargin': round(float(dcf.get(f'{y_col}22', 0) or 0) * 100, 1),
            'fcf': round(float(dcf.get(f'{y_col}30', 0) or 0), 2),
            'pvFcf': round(float(dcf.get(f'{y_col}33', 0) or 0), 2),
        })

    result = {
        'modelName': 'PRISM STARTUP — INVESTMENT GRADE FINANCIAL MODEL',
        'sourceFile': 'Startup-IB-Financial-Model.xlsx',
        'lastUpdated': '2026-10-06T01:40:00Z',
        'kpis': {
            'fy2022Revenue': round(float(pnl.get('P18', 0) or 0), 2),
            'fy2022GrossProfit': round(float(pnl.get('P20', 0) or 0), 2),
            'fy2022GrossMargin': round((float(pnl.get('P20', 0) or 0) / float(pnl.get('P18', 1) or 1)) * 100, 1),
            'fy2022ContributionMargin': round(float(pnl.get('P28', 0) or 0), 2),
            'startingCash': 50000.0,
            'currentCash': monthly[0]['cashEnding'], # Jan
            'projectedDecCash': monthly[-1]['cashEnding'],
            'initialBurnRate': monthly[0]['netBurn'],
            'initialRunwayMonths': monthly[0]['runwayMonths'],
            'breakevenMonth': 'Jul', # net burn becomes 0
            'enterpriseValueEbitda': round(float(dcf.get('D42', 0) or 0), 2),
            'enterpriseValueGordon': round(float(dcf.get('D43', 0) or 0), 2),
            'terminalValue': round(float(dcf.get('D37', 0) or 0), 2),
            'wacc': round(float(dcf.get('D14', 0) or 0) * 100, 1),
            'exitMultiple': float(dcf.get('D16', 0) or 0),
        },
        'scenarios': {
            'active': 1,
            'factors': {
                'base': {'traffic': 1.0, 'conversion': 1.0, 'cogs': 1.0},
                'bull': {'traffic': 1.25, 'conversion': 1.1, 'cogs': 0.95},
                'bear': {'traffic': 0.75, 'conversion': 0.9, 'cogs': 1.1}
            }
        },
        'monthly': monthly,
        'dcf': {
            'years': dcf_years,
            'sumPvFcf': round(float(dcf.get('D36', 0) or 0), 2),
            'pvTerminalValue': round(float(dcf.get('D39', 0) or 0), 2),
            'impliedEnterpriseValue': round(float(dcf.get('D42', 0) or 0), 2)
        }
    }
    return result

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    xlsx_path = os.path.join(base_dir, 'Startup-IB-Financial-Model.xlsx')
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib/data/startupFinancialModel.json'))

    data = parse_full_model(xlsx_path)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Successfully generated {output_path} with {len(data['monthly'])} monthly periods.")
