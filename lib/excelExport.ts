import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ColumnDef {
  header: string;
  key: string;
  width?: number;
  format?: string; // 'currency' | 'percentage' | undefined
}

export const generateExcelReport = async (
  reportTitle: string,
  worksheetName: string,
  columns: ColumnDef[],
  data: any[],
  subtitle?: string
) => {
  // 1. Create a new Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SOLVEX System';
  workbook.created = new Date();

  // 2. Add a Worksheet
  const worksheet = workbook.addWorksheet(worksheetName, {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'landscape' } // 9 = A4
  });

  // 5. Setup Columns (without writing automatic headers to row 1)
  worksheet.columns = columns.map(col => ({
    key: col.key,
    width: col.width || 20,
    style: { font: { name: 'Calibri', size: 11 } }
  }));

  // Clear any auto-generated headers in Row 1 (in case ExcelJS did something)
  // But since we didn't provide 'header' property in column defs, it shouldn't write anything.
  
  // 3. Add Title Row (Row 1) - Re-doing this after columns setup to be safe
  const titleRow = worksheet.getRow(1);
  titleRow.values = [reportTitle]; // Set value for first cell
  titleRow.height = 30;
  
  // Merge A1:E1 (or adjusted to column count)
  const mergeEndCol = Math.max(columns.length, 5);
  worksheet.mergeCells(1, 1, 1, mergeEndCol);
  
  // Style Title
  const titleCell = titleRow.getCell(1);
  titleCell.font = {
    name: 'Calibri',
    size: 16,
    bold: true,
    color: { argb: 'FF000000' } // Black
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // 4. Add Metadata Row (Row 2)
  const dateRow = worksheet.getRow(2);
  dateRow.values = [subtitle || `Fecha de Exportación: ${new Date().toLocaleDateString()}`];
  dateRow.height = 20;
  worksheet.mergeCells(2, 1, 2, mergeEndCol);
  const dateCell = dateRow.getCell(1);
  dateCell.font = { italic: true, size: 11, color: { argb: 'FF555555' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 5. Add Header Row (Row 4) manually
  const headerRow = worksheet.getRow(4);
  headerRow.values = columns.map(col => col.header); // Set header text
  
  // Style Header Row
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' } // Slate-900
    };
    cell.font = {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: 'FFFFFFFF' } // White
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  // 6. Add Data Rows (starting Row 5)
  data.forEach((item) => {
    // Construct row based on keys
    const rowValues: any[] = [];
    columns.forEach(col => {
        rowValues.push(item[col.key]);
    });
    const row = worksheet.addRow(rowValues);
    
    // Style Data Cells
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Apply Borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };

      // Apply Number Formats based on column definition
      const colDef = columns[colNumber - 1];
      if (colDef && colDef.format === 'currency') {
        cell.numFmt = '"$"#,##0.00';
      } else if (colDef && colDef.format === 'percentage') {
        cell.numFmt = '0.00%';
      }
      
      // Alignment
      if (colDef && (colDef.format === 'currency' || colDef.format === 'percentage' || typeof cell.value === 'number')) {
         cell.alignment = { horizontal: 'right' };
      } else {
         cell.alignment = { horizontal: 'left' };
      }
    });
  });

  // 7. Write Buffer and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Reporte_SOLVEX_${dateStr}.xlsx`;
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Ensure we're in browser environment before saving
  if (typeof window !== 'undefined') {
    // Dynamic import to avoid SSR issues if necessary, but we are in client component usually
    const FileSaver = require('file-saver');
    FileSaver.saveAs(blob, fileName);
  }
};

