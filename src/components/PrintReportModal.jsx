import React from 'react';
import { X, Printer, Download } from 'lucide-react';

export default function PrintReportModal({ isOpen, onClose, monthData, sheetTitle }) {
  if (!isOpen || !monthData) return null;

  const { name: monthName, students, dayNumbers, stats, signatures } = monthData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '960px',
          width: '95vw',
          maxHeight: '92vh',
          background: '#ffffff',
          color: '#000000',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>
              Pratinjau Format Cetak Resmi Laporan Kehadiran
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div
          id="printable-report"
          style={{
            padding: '10px',
            fontSize: '9pt',
            fontFamily: 'serif, Times, "Times New Roman"'
          }}
        >
          {/* Document Header */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
              DAFTAR HADIR PESERTA DIDIK BULAN {monthName}
            </h2>
            <h3 style={{ fontSize: '11pt', fontWeight: 700, margin: '2px 0 0 0' }}>
              TAHUN AJARAN 2026/2027 — KELAS 2C
            </h3>
            <p style={{ fontSize: '9pt', color: '#444', margin: '2px 0 0 0' }}>
              SDN PULO 01 KECAMATAN KEBAYORAN BARU
            </p>
          </div>

          {/* Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1.5px solid #000',
              textAlign: 'center',
              fontSize: '8pt'
            }}
          >
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ border: '1px solid #000', padding: '4px', width: '24px' }}>NO</th>
                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>
                  NAMA PESERTA DIDIK
                </th>
                {dayNumbers.map((d) => (
                  <th key={d} style={{ border: '1px solid #000', padding: '2px', width: '18px' }}>
                    {d}
                  </th>
                ))}
                <th style={{ border: '1px solid #000', padding: '2px', width: '22px' }}>S</th>
                <th style={{ border: '1px solid #000', padding: '2px', width: '22px' }}>I</th>
                <th style={{ border: '1px solid #000', padding: '2px', width: '22px' }}>A</th>
                <th style={{ border: '1px solid #000', padding: '2px', width: '28px' }}>JML</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.no}>
                  <td style={{ border: '1px solid #000', padding: '3px' }}>{s.no}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>
                    {s.name}
                  </td>
                  {dayNumbers.map((d) => {
                    const mark = s.days[d];
                    return (
                      <td key={d} style={{ border: '1px solid #000', padding: '1px' }}>
                        {mark === '.' ? '•' : mark || ''}
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{s.sakit || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{s.izin || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{s.alpa || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>
                    {(s.sakit || 0) + (s.izin || 0) + (s.alpa || 0) || '0'}
                  </td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr style={{ background: '#f9f9f9', fontWeight: 'bold' }}>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                  JUMLAH TOTAL:
                </td>
                <td colSpan={dayNumbers.length} style={{ border: '1px solid #000' }}>
                  Rata-rata Kehadiran: {stats.effectiveAttendanceRate}
                </td>
                <td style={{ border: '1px solid #000' }}>{stats.totalSakit}</td>
                <td style={{ border: '1px solid #000' }}>{stats.totalIzin}</td>
                <td style={{ border: '1px solid #000' }}>{stats.totalAlpa}</td>
                <td style={{ border: '1px solid #000' }}>
                  {stats.totalSakit + stats.totalIzin + stats.totalAlpa}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Official Signatures */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '28px',
              padding: '0 20px',
              fontSize: '9pt'
            }}
          >
            <div style={{ textAlign: 'center', width: '220px' }}>
              <div>Mengetahui,</div>
              <div style={{ fontWeight: 'bold' }}>Kepala Sekolah</div>
              <div style={{ height: '50px' }} />
              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                {signatures.kepalaSekolah}
              </div>
              <div>NIP. {signatures.nipKepala}</div>
            </div>

            <div style={{ textAlign: 'center', width: '220px' }}>
              <div>Jakarta, {signatures.dateString}</div>
              <div style={{ fontWeight: 'bold' }}>Guru Kelas 2C</div>
              <div style={{ height: '50px' }} />
              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                {signatures.guruKelas}
              </div>
              <div>NIP. {signatures.nipGuru}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
