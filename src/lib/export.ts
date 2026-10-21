import ExcelJS from 'exceljs';
import type { BuildingWithNested, Camera } from './supabase';
import { CATEGORY_KEYS, CATEGORY_META, getProgress, stagesFor, type StageField } from './tracking';

const statusFill: Record<string, string> = { pending: '3F2F08', in_progress: '063A4A', complete: '073A2A' };
const statusFont: Record<string, string> = { pending: 'FBBF24', in_progress: '22D3EE', complete: '34D399' };
const dateName = () => new Date().toISOString().slice(0, 10);

export async function exportToXlsx(buildings: BuildingWithNested[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ELV Project Sysense';
  const all = buildings.flatMap((building) => building.floors.flatMap((floor) => floor.cameras));
  const summaryRows: (string | number)[][] = [['Building', 'Floor', 'Category', 'Total Items', 'Complete', 'In Progress', 'Pending', 'Completion %']];
  for (const building of buildings) for (const floor of building.floors) for (const category of CATEGORY_KEYS) {
    const items = floor.cameras.filter((item) => item.category === category);
    if (!items.length) continue;
    const progress = getProgress(items);
    summaryRows.push([building.name, floor.name, CATEGORY_META[category].label, progress.totalItems, progress.completedItems, progress.inProgressItems, progress.pendingItems, `${progress.completion}%`]);
  }
  const overall = getProgress(all);
  summaryRows.push(['OVERALL', '', '', overall.totalItems, overall.completedItems, overall.inProgressItems, overall.pendingItems, `${overall.completion}%`]);
  addSheet(workbook, 'Summary', summaryRows, ['Building', 'Floor', 'Category', 'Total Items', 'Complete', 'In Progress', 'Pending', 'Completion %']);

  for (const category of CATEGORY_KEYS) {
    const stageLabels = stagesFor(category).map((stage) => stage.label);
    const rows: (string | number)[][] = [['Building', 'Floor', 'Name', ...stageLabels, 'Remark']];
    for (const building of buildings) for (const floor of building.floors) for (const item of floor.cameras) if (item.category === category) {
      rows.push([building.name, floor.name, item.name, ...stagesFor(category).map((stage) => stageValue(item, stage.field)), item.notes ?? '']);
    }
    addSheet(workbook, CATEGORY_META[category].label, rows, rows[0].map(String), true);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `ELV_Project_Sysense_${dateName()}.xlsx`; anchor.click(); URL.revokeObjectURL(url);
}

function stageValue(item: Camera, field: StageField) { return item[field]; }
function addSheet(workbook: ExcelJS.Workbook, name: string, rows: (string | number)[][], headers: string[], colorStages = false) {
  const sheet = workbook.addWorksheet(name); sheet.addRows(rows); sheet.views = [{ state: 'frozen', ySplit: 1 }]; sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + headers.length)}1` };
  const header = sheet.getRow(1); header.font = { bold: true, color: { argb: 'FFFFFFFF' } }; header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0E7490' } }; header.alignment = { vertical: 'middle' };
  if (name === 'Summary') sheet.getRow(sheet.rowCount).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  if (colorStages) for (let row = 2; row <= sheet.rowCount; row++) for (let col = 4; col <= headers.length - 1; col++) { const cell = sheet.getCell(row, col); const value = String(cell.value ?? ''); cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusFill[value] ?? '111827' } }; cell.font = { color: { argb: statusFont[value] ?? 'CBD5E1' } }; }
  for (let col = 1; col <= headers.length; col++) { let width = headers[col - 1].length + 2; sheet.eachRow((row) => { width = Math.max(width, String(row.getCell(col).value ?? '').length + 2); }); sheet.getColumn(col).width = Math.min(width, 32); }
}
