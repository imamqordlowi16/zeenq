import { parseCSV, parseAttendanceSheet } from '../src/services/sheetParser.js';

function getStudentRowIndex(curMonth, studentNo, curStudent) {
  const isJan = curMonth.id === 'januari' || curMonth.name?.toUpperCase() === 'JANUARI';
  
  if (curStudent?.rowIndex) {
    if (isJan && curStudent.rowIndex < 4) {
      return 4 + (studentNo - 1);
    }
    return curStudent.rowIndex;
  }

  const firstRow =
    curMonth.firstStudentRowIndex ||
    curMonth.students?.[0]?.rowIndex ||
    (isJan ? 4 : ((curMonth.headerRowIndex || 39) + 1));

  const validFirstRow = (isJan && firstRow < 4) ? 4 : firstRow;
  return validFirstRow + (studentNo - 1);
}

// Test cases
console.log('Januari Student 1 (corrupted rowIndex = 3):', getStudentRowIndex({ id: 'januari' }, 1, { rowIndex: 3 }));
console.log('Januari Student 1 (no rowIndex, header = 2):', getStudentRowIndex({ id: 'januari', headerRowIndex: 2 }, 1, {}));
console.log('Januari Student 2:', getStudentRowIndex({ id: 'januari', headerRowIndex: 2 }, 2, {}));
console.log('Februari Student 1 (header = 39):', getStudentRowIndex({ id: 'februari', headerRowIndex: 39 }, 1, {}));
console.log('Februari Student 28 (header = 39):', getStudentRowIndex({ id: 'februari', headerRowIndex: 39 }, 28, {}));
console.log('Juli Student 1 (header = 219):', getStudentRowIndex({ id: 'juli', headerRowIndex: 219 }, 1, {}));
