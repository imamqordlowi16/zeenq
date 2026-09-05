// Test script to check structure of batchUpdate requests for moving title and formatting row 38
console.log('Validating Google Sheets batchUpdate syntax...');

const sheetId = 272037099;

// 1. Requests to format KEHADIRAN row (row 38, or 0-indexed ~37)
const formatKehadiranRequest = (rowIndex) => [
  // Merge A..AI
  {
    mergeCells: {
      range: {
        sheetId,
        startRowIndex: rowIndex,
        endRowIndex: rowIndex + 1,
        startColumnIndex: 0,
        endColumnIndex: 35
      },
      mergeType: 'MERGE_ALL'
    }
  },
  // Merge AJ..AK
  {
    mergeCells: {
      range: {
        sheetId,
        startRowIndex: rowIndex,
        endRowIndex: rowIndex + 1,
        startColumnIndex: 35,
        endColumnIndex: 37
      },
      mergeType: 'MERGE_ALL'
    }
  },
  // Apply borders
  {
    updateBorders: {
      range: {
        sheetId,
        startRowIndex: rowIndex,
        endRowIndex: rowIndex + 1,
        startColumnIndex: 0,
        endColumnIndex: 37
      },
      top: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      bottom: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      left: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      right: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      innerVertical: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } }
    }
  },
  // Text format: bold, centered
  {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: rowIndex,
        endRowIndex: rowIndex + 1,
        startColumnIndex: 0,
        endColumnIndex: 37
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: 9 },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE'
        }
      },
      fields: 'userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)'
    }
  }
];

console.log('Sample requests generated:', formatKehadiranRequest(37).length);
