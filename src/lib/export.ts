import * as XLSX from 'xlsx';
import type { BuildingWithNested } from './supabase';

function calcRow(total: number, completed: number) {
  const pending = total - completed;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 1000) / 10;
  return { total, completed, pending, pct };
}

export function exportToXlsx(buildings: BuildingWithNested[]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Cable Tracking
  let totalPoints = 0;
  let totalCompleted = 0;
  const rows: (string | number)[][] = [];
  rows.push(['Floor', 'Total Points', 'Completed', 'Pending', 'Completion %']);
  for (const b of buildings) {
    for (const f of b.floors) {
      const c = calcRow(f.cameras.length, f.cameras.filter((x) => x.status === 'complete').length);
      rows.push([`${b.name} — ${f.name}`, c.total, c.completed, c.pending, `${c.pct}%`]);
      totalPoints += c.total;
      totalCompleted += c.completed;
    }
  }
  const site = calcRow(totalPoints, totalCompleted);
  rows.push(['TOTAL SITE', site.total, site.completed, site.pending, `${site.pct}%`]);
  const ws1 = XLSX.utils.aoa_to_sheet(rows);
  ws1['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Cable Tracking');

  // Sheet 2: Point Lists
  const completed: string[] = [];
  const pending: string[] = [];
  for (const b of buildings) {
    for (const f of b.floors) {
      for (const c of f.cameras) {
        if (c.status === 'complete') completed.push(c.name);
        else pending.push(c.name);
      }
    }
  }
  const maxLen = Math.max(completed.length, pending.length, 1);
  const plRows: (string)[][] = [['COMPLETED CAMERA POINTS', 'PENDING CAMERA POINTS']];
  for (let i = 0; i < maxLen; i++) {
    plRows.push([completed[i] ?? '', pending[i] ?? '']);
  }
  const ws2 = XLSX.utils.aoa_to_sheet(plRows);
  ws2['!cols'] = [{ wch: 40 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Point Lists');

  // Sheet 3: Instructions
  const instr: string[][] = [
    ['Camera Cable Pulling Tracker — Instructions'],
    [''],
    ['1. Use the dashboard at the top of the app to see site-wide totals and overall completion.'],
    ['2. The Floor-wise table lists every camera by building and floor. Use the search bar to find a specific camera, the All/Pending/Complete filter to narrow the list, and the dropdown on each row to change its status.'],
    ['3. Manage buildings, floors, and cameras using the Add/Edit/Delete buttons.'],
    ['4. Attach a floor drawing to any floor, then drop camera pins on the Floor Plan view to mark where each camera sits on the drawing.'],
    ['5. Click "Export Data" to download this workbook.'],
    [''],
    ['Sheet Guide:'],
    ['  - Cable Tracking: floor-by-floor summary with a total site row at the bottom.'],
    ['  - Point Lists: every completed and pending camera point, one per cell.'],
    ['  - Instructions: this sheet.'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(instr);
  ws3['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Instructions');

  XLSX.writeFile(wb, 'camera-cable-tracking.xlsx');
}

// recompute totals helper used by the UI
export function computeSiteTotals(buildings: BuildingWithNested[]) {
  let total = 0;
  let completed = 0;
  for (const b of buildings) {
    for (const f of b.floors) {
      total += f.cameras.length;
      completed += f.cameras.filter((c) => c.status === 'complete').length;
    }
  }
  return { total, completed, pending: total - completed, pct: total === 0 ? 0 : Math.round((completed / total) * 1000) / 10 };
}

export function computeFloorTotal(floor: { cameras: { status: string }[] }) {
  const total = floor.cameras.length;
  const completed = floor.cameras.filter((c) => c.status === 'complete').length;
  return { total, completed, pending: total - completed, pct: total === 0 ? 0 : Math.round((completed / total) * 1000) / 10 };
}
