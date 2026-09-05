import React, { useState } from 'react';
import { Download, Search, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

export default function RekapView({ rekapData, isLoading }) {
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat lembar Rekapitulasi Absen...</p>
      </div>
    );
  }

  const students = rekapData?.students || [];

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const headers = [
      'No',
      'Nama Siswa',
      'Jan (S)', 'Jan (I)', 'Jan (A)',
      'Feb (S)', 'Feb (I)', 'Feb (A)',
      'Mar (S)', 'Mar (I)', 'Mar (A)',
      'Apr (S)', 'Apr (I)', 'Apr (A)',
      'Mei (S)', 'Mei (I)', 'Mei (A)',
      'Jun (S)', 'Jun (I)', 'Jun (A)',
      'Total Sakit',
      'Total Izin',
      'Total Alpa',
      'Total Ketidakhadiran'
    ];

    const rows = filtered.map((s) => [
      s.no,
      s.name,
      s.jan?.s || '', s.jan?.i || '', s.jan?.a || '',
      s.feb?.s || '', s.feb?.i || '', s.feb?.a || '',
      s.mar?.s || '', s.mar?.i || '', s.mar?.a || '',
      s.apr?.s || '', s.apr?.i || '', s.apr?.a || '',
      s.mei?.s || '', s.mei?.i || '', s.mei?.a || '',
      s.jun?.s || '', s.jun?.i || '', s.jun?.a || '',
      s.totalSakit,
      s.totalIzin,
      s.totalAlpa,
      s.totalAbsen
    ]);

    exportToCSV('Rekapitulasi_Presensi_Semester', headers, rows);
  };

  // Grand totals
  let sumSakit = 0;
  let sumIzin = 0;
  let sumAlpa = 0;
  students.forEach((s) => {
    sumSakit += s.totalSakit || 0;
    sumIzin += s.totalIzin || 0;
    sumAlpa += s.totalAlpa || 0;
  });

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rekapitulasi Absensi Semester</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
            Rangkuman akumulasi Sakit, Izin, dan Alpa per bulan selama satu semester berjalan
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          <Download size={15} />
          <span>Unduh Rekap CSV</span>
        </button>
      </div>

      {/* Summary Highlights */}
      <div className="stats-grid" style={{ marginBottom: '18px' }}>
        <div className="glass-panel stat-card sky">
          <div className="stat-icon-wrapper" style={{ background: 'var(--status-sakit-bg)', color: 'var(--status-sakit)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val">{sumSakit}</div>
            <div className="stat-label">Total Sakit Semester</div>
          </div>
        </div>

        <div className="glass-panel stat-card amber">
          <div className="stat-icon-wrapper" style={{ background: 'var(--status-izin-bg)', color: 'var(--status-izin)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val">{sumIzin}</div>
            <div className="stat-label">Total Izin Semester</div>
          </div>
        </div>

        <div className="glass-panel stat-card rose">
          <div className="stat-icon-wrapper" style={{ background: 'var(--status-alpa-bg)', color: 'var(--status-alpa)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val">{sumAlpa}</div>
            <div className="stat-label">Total Alpa Semester</div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="input-control"
            style={{ paddingLeft: '36px' }}
            placeholder="Cari siswa dalam rekap..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Rekap Table */}
      <div className="matrix-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-sticky-no">No</th>
              <th rowSpan={2} className="col-sticky-name">Nama Siswa</th>
              <th colSpan={3}>Januari</th>
              <th colSpan={3}>Februari</th>
              <th colSpan={3}>Maret</th>
              <th colSpan={3}>April</th>
              <th colSpan={3}>Mei</th>
              <th colSpan={3}>Juni</th>
              <th colSpan={3} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                Total Akumulasi
              </th>
            </tr>
            <tr>
              {/* Jan */}
              <th>S</th><th>I</th><th>A</th>
              {/* Feb */}
              <th>S</th><th>I</th><th>A</th>
              {/* Mar */}
              <th>S</th><th>I</th><th>A</th>
              {/* Apr */}
              <th>S</th><th>I</th><th>A</th>
              {/* Mei */}
              <th>S</th><th>I</th><th>A</th>
              {/* Jun */}
              <th>S</th><th>I</th><th>A</th>
              {/* Total */}
              <th style={{ color: 'var(--status-sakit)' }}>S</th>
              <th style={{ color: 'var(--status-izin)' }}>I</th>
              <th style={{ color: 'var(--status-alpa)' }}>A</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={23} style={{ padding: '30px', color: 'var(--text-muted)' }}>
                  Tidak ada data rekap yang sesuai.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.no}>
                  <td className="col-sticky-no">{s.no}</td>
                  <td className="col-sticky-name">{s.name}</td>
                  <td>{s.jan?.s || '-'}</td>
                  <td>{s.jan?.i || '-'}</td>
                  <td>{s.jan?.a || '-'}</td>
                  <td>{s.feb?.s || '-'}</td>
                  <td>{s.feb?.i || '-'}</td>
                  <td>{s.feb?.a || '-'}</td>
                  <td>{s.mar?.s || '-'}</td>
                  <td>{s.mar?.i || '-'}</td>
                  <td>{s.mar?.a || '-'}</td>
                  <td>{s.apr?.s || '-'}</td>
                  <td>{s.apr?.i || '-'}</td>
                  <td>{s.apr?.a || '-'}</td>
                  <td>{s.mei?.s || '-'}</td>
                  <td>{s.mei?.i || '-'}</td>
                  <td>{s.mei?.a || '-'}</td>
                  <td>{s.jun?.s || '-'}</td>
                  <td>{s.jun?.i || '-'}</td>
                  <td>{s.jun?.a || '-'}</td>
                  <td style={{ fontWeight: 700, color: s.totalSakit > 0 ? 'var(--status-sakit)' : 'inherit' }}>
                    {s.totalSakit || 0}
                  </td>
                  <td style={{ fontWeight: 700, color: s.totalIzin > 0 ? 'var(--status-izin)' : 'inherit' }}>
                    {s.totalIzin || 0}
                  </td>
                  <td style={{ fontWeight: 700, color: s.totalAlpa > 0 ? 'var(--status-alpa)' : 'inherit' }}>
                    {s.totalAlpa || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
