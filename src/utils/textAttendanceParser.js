/**
 * Intelligent parser that matches text lines like:
 * "Abi Alpa"
 * "Afifah ijin"
 * "Ahmad Sakit"
 * to actual students in the roster and auto-marks everyone else as Hadir (.)
 */
export function parseAttendanceText(rawText, studentsList = []) {
  if (!rawText || !rawText.trim() || !studentsList || studentsList.length === 0) {
    return {
      matchedAbsent: [],
      unmatchedLines: [],
      fullRosterResult: studentsList.map((s) => ({
        ...s,
        mark: '.',
        statusLabel: 'Hadir (Otomatis)'
      }))
    };
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const matchedAbsent = [];
  const unmatchedLines = [];
  const matchedStudentNos = new Set();

  lines.forEach((line) => {
    // Clean common prefixes (e.g. "1.", "-", "*", bullet points)
    const cleanLine = line.replace(/^[\d\s.\-*•\)]+/, '').trim();
    if (!cleanLine) return;

    // Detect status keyword in the line
    let detectedStatus = '';
    let statusLabel = '';
    let studentNameQuery = cleanLine;

    // Regex matchers for Sakit, Izin, Alpa
    const sakitRegex = /\b(sakit|skit|sick|s)\b/i;
    const izinRegex = /\b(ijin|izin|izn|ijn|i)\b/i;
    const alpaRegex = /\b(alpa|alpha|alp|a|bolos|tanpa keterangan|tk)\b/i;
    const hadirRegex = /\b(hadir|masuk|hdr|h)\b/i;

    if (sakitRegex.test(cleanLine)) {
      detectedStatus = 'S';
      statusLabel = 'Sakit';
      studentNameQuery = cleanLine.replace(sakitRegex, '').replace(/[:\-–]/g, '').trim();
    } else if (izinRegex.test(cleanLine)) {
      detectedStatus = 'I';
      statusLabel = 'Izin';
      studentNameQuery = cleanLine.replace(izinRegex, '').replace(/[:\-–]/g, '').trim();
    } else if (alpaRegex.test(cleanLine)) {
      detectedStatus = 'A';
      statusLabel = 'Alpa';
      studentNameQuery = cleanLine.replace(alpaRegex, '').replace(/[:\-–]/g, '').trim();
    } else if (hadirRegex.test(cleanLine)) {
      detectedStatus = '.';
      statusLabel = 'Hadir';
      studentNameQuery = cleanLine.replace(hadirRegex, '').replace(/[:\-–]/g, '').trim();
    } else {
      // Default fallback if word contains Alpa/Izin/Sakit without word boundary
      const lower = cleanLine.toLowerCase();
      if (lower.includes('alpa') || lower.includes('alpha')) {
        detectedStatus = 'A';
        statusLabel = 'Alpa';
        studentNameQuery = cleanLine.replace(/alpha|alpa/gi, '').replace(/[:\-–]/g, '').trim();
      } else if (lower.includes('ijin') || lower.includes('izin')) {
        detectedStatus = 'I';
        statusLabel = 'Izin';
        studentNameQuery = cleanLine.replace(/ijin|izin/gi, '').replace(/[:\-–]/g, '').trim();
      } else if (lower.includes('sakit')) {
        detectedStatus = 'S';
        statusLabel = 'Sakit';
        studentNameQuery = cleanLine.replace(/sakit/gi, '').replace(/[:\-–]/g, '').trim();
      }
    }

    if (!detectedStatus) {
      unmatchedLines.push({ line, reason: 'Status tidak terdeteksi (tulis Sakit, Izin, atau Alpa)' });
      return;
    }

    // Now find the matching student from roster
    const queryLower = studentNameQuery.toLowerCase().trim();
    if (!queryLower) {
      unmatchedLines.push({ line, reason: 'Nama siswa tidak ditemukan' });
      return;
    }

    // Match priority:
    // 1. Exact name match
    // 2. Starts with query (e.g. "Abi" -> "ABI RAYA RABBANI")
    // 3. Name contains query as a whole word
    // 4. Substring contains
    let matchedStudent = studentsList.find(
      (s) => s.name.toLowerCase() === queryLower
    );

    if (!matchedStudent) {
      matchedStudent = studentsList.find((s) => {
        const words = s.name.toLowerCase().split(/\s+/);
        return words.some((w) => w.startsWith(queryLower) || queryLower.startsWith(w));
      });
    }

    if (!matchedStudent) {
      matchedStudent = studentsList.find((s) =>
        s.name.toLowerCase().includes(queryLower)
      );
    }

    if (matchedStudent) {
      matchedStudentNos.add(matchedStudent.no);
      matchedAbsent.push({
        no: matchedStudent.no,
        name: matchedStudent.name,
        rawInput: line,
        status: detectedStatus,
        statusLabel
      });
    } else {
      unmatchedLines.push({
        line,
        reason: `Nama "${studentNameQuery}" tidak cocok dengan daftar siswa`
      });
    }
  });

  // Now create the full roster result:
  // "selain ditulis tersebut sudah terisi hadir"
  const fullRosterResult = studentsList.map((s) => {
    const absentRecord = matchedAbsent.find((m) => m.no === s.no);
    if (absentRecord) {
      return {
        ...s,
        mark: absentRecord.status,
        statusLabel: absentRecord.statusLabel,
        isCustomMarked: true
      };
    }
    return {
      ...s,
      mark: '.',
      statusLabel: 'Hadir (Otomatis)',
      isCustomMarked: false
    };
  });

  return {
    matchedAbsent,
    unmatchedLines,
    fullRosterResult
  };
}
