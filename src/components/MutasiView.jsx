import React, { useState } from 'react';
import { Users, Search, Download, UserCheck, ArrowRightLeft, Baby } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

export default function MutasiView({ mutasiData, isLoading }) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');

  if (isLoading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat data induk & mutasi siswa...</p>
      </div>
    );
  }

  const roster = mutasiData?.roster || [];

  const filtered = roster.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.induk.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (genderFilter === 'L') return s.genderCode === 'L';
    if (genderFilter === 'P') return s.genderCode === 'P';
    return true;
  });

  const handleExport = () => {
    const headers = ['No', 'Nomor Induk', 'Nama Siswa', 'Tanggal Masuk', 'L/P', 'Kelas', 'Asal Sekolah'];
    const rows = filtered.map((s) => [s.no, s.induk, s.name, s.tanggal, s.genderCode, s.kelas, s.asal]);
    exportToCSV('Buku_Induk_Mutasi_Siswa', headers, rows);
  };

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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Buku Induk & Mutasi Peserta Didik</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
            Data identitas siswa, Nomor Induk Siswa (NIS), dan rekapitulasi keadaan peserta didik
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          <Download size={15} />
          <span>Unduh Data Induk</span>
        </button>
      </div>

      {/* Roster Demographics Grid */}
      <div className="stats-grid" style={{ marginBottom: '18px' }}>
        <div className="glass-panel stat-card primary">
          <div className="stat-icon-wrapper" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{roster.length}</div>
            <div className="stat-label">Total Peserta Didik</div>
          </div>
        </div>

        <div className="glass-panel stat-card sky">
          <div className="stat-icon-wrapper" style={{ background: 'var(--status-sakit-bg)', color: 'var(--status-sakit)' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="stat-val">{mutasiData?.countLaki || 0}</div>
            <div className="stat-label">Laki-Laki (L)</div>
          </div>
        </div>

        <div className="glass-panel stat-card rose">
          <div className="stat-icon-wrapper" style={{ background: 'var(--status-alpa-bg)', color: 'var(--accent-rose)' }}>
            <Baby size={24} />
          </div>
          <div>
            <div className="stat-val">{mutasiData?.countPerempuan || 0}</div>
            <div className="stat-label">Perempuan (P)</div>
          </div>
        </div>
      </div>

      {/* Search & Gender Filter */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
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
            placeholder="Cari nama atau No Induk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${genderFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setGenderFilter('ALL')}
          >
            Semua ({roster.length})
          </button>
          <button
            className={`btn btn-sm ${genderFilter === 'L' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setGenderFilter('L')}
          >
            Laki-laki ({mutasiData?.countLaki || 0})
          </button>
          <button
            className={`btn btn-sm ${genderFilter === 'P' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setGenderFilter('P')}
          >
            Perempuan ({mutasiData?.countPerempuan || 0})
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="matrix-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>No</th>
              <th style={{ width: '120px' }}>Nomor Induk</th>
              <th style={{ textAlign: 'left' }}>Nama Peserta Didik</th>
              <th>L / P</th>
              <th>Kelas</th>
              <th>Tanggal Terdaftar</th>
              <th>Status Mutasi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', color: 'var(--text-muted)' }}>
                  Tidak ada peserta didik yang sesuai pencarian.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.no}>
                  <td>{s.no}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.induk}</span>
                  </td>
                  <td style={{ textAlign: 'left', fontWeight: 600 }}>{s.name}</td>
                  <td>
                    <span
                      className={`badge ${s.genderCode === 'L' ? 'badge-sakit' : 'badge-alpa'}`}
                      style={{ minWidth: '24px', justifyContent: 'center' }}
                    >
                      {s.genderCode}
                    </span>
                  </td>
                  <td>Kelas {s.kelas}</td>
                  <td>{s.tanggal}</td>
                  <td>
                    <span className="badge badge-hadir">Siswa Aktif</span>
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
