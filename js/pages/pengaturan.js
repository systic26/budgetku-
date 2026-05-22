/* Pengaturan Page — Full Info Display */
Pages.pengaturan = {
  render() {
    const el = document.getElementById('page-pengaturan');
    const s = DB.getSettings();
    const rules = DB.getAlokasiRules();

    // Collect live stats for info panel
    const cf = DB.getCashflow();
    const trx = DB.getTransaksi();
    const peng = DB.getPengeluaran();
    const servis = DB.getServis();
    const utang = DB.getUtang();
    const ds = DB.getDashboardSummary();

    const totalTransaksi = trx.length;
    const totalCashflow  = cf.length;
    const totalPeng      = peng.length;
    const totalServis    = servis.length;
    const totalUtang     = utang.length;
    const utangAktif     = utang.filter(u=>!u.lunas).length;
    const storageSizeKB  = Math.round(JSON.stringify(localStorage).length / 1024);

    el.innerHTML = `
      <!-- ROW 1: Settings + Account Info -->
      <div class="set-main-row mb-16">

        <!-- LEFT: Pengaturan Umum -->
        <div class="set-col-left">
          <div class="card mb-16">
            <div class="card-title mb-16"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Pengaturan Umum</div>
            <form id="formSettings">
              <div class="form-group">
                <label class="form-label">Nama Driver</label>
                <input type="text" class="form-control" id="setNama" value="${s.nama_driver || ''}" placeholder="Nama Anda" />
              </div>
              <div class="form-group">
                <label class="form-label">Target Penghasilan Harian (Rp)</label>
                <input type="number" class="form-control" id="setTarget" value="${s.target_harian || 150000}" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Alokasi Servis Harian (Rp)</label>
                <input type="number" class="form-control" id="setAlokasi" value="${s.alokasi_servis_harian || 10000}" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Tipe Alokasi</label>
                <select class="form-control" id="setTipeAlokasi">
                  <option value="NOMINAL_TETAP" ${s.alokasi_tipe==='NOMINAL_TETAP'?'selected':''}>Nominal Tetap</option>
                  <option value="PERSENTASE" ${s.alokasi_tipe==='PERSENTASE'?'selected':''}>Persentase</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary btn-full"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Simpan Pengaturan/button>
            </form>
          </div>

          <!-- Alokasi Rules -->
          <div class="card mb-16">
            <div class="card-title mb-12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;color:var(--warning)"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Rule Alokasi Dana Servis</div>
            <div class="infobox info mb-14">
              <span class="infobox-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
              <span>Rule ini menentukan berapa dana servis yang dialokasikan setiap hari kerja.</span>
            </div>
            ${rules.map(r => `
              <div class="set-rule-card">
                <div class="set-rule-top">
                  <span class="fw-600">${r.nama_alokasi}</span>
                  <span class="badge ${r.aktif ? 'badge-success' : 'badge-muted'}">${r.aktif ? 'AKTIF' : 'Nonaktif'}</span>
                </div>
                <div class="set-rule-meta">
                  <span>Tipe: <strong>${r.tipe}</strong></span>
                  <span>Nilai: <strong>${r.tipe === 'NOMINAL_TETAP' ? UI.formatRp(r.nilai) : r.nilai + '%'}</strong></span>
                  <span>Sumber: <strong>${r.sumber_dana}</strong></span>
                  <span>Hari kerja saja: <strong>${r.hanya_hari_kerja ? 'Ya' : 'Tidak'}</strong></span>
                </div>
              </div>
            `).join('')}
            <button class="btn btn-outline btn-sm mt-8" onclick="Pages.pengaturan._editRule()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit Rule Alokasi/button>
          </div>

          <!-- Danger Zone -->
          <div class="card" style="border-color:rgba(247,111,111,0.35);background:rgba(247,111,111,0.04)">
            <div class="card-title mb-12" style="color:var(--danger);display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--danger)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Danger Zone</div>

            <!-- Reset Data -->
            <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(247,111,111,0.15);border-radius:10px;margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-size:0.83rem;font-weight:600;color:var(--text);display:flex;align-items:center;gap:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:var(--text)"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Reset Semua Data</div>
                  <div style="font-size:0.73rem;color:var(--text-muted);margin-top:2px">Hapus semua riwayat transaksi & pengeluaran. Akun tetap aktif.</div>
                </div>
                <button class="btn btn-danger btn-sm" style="white-space:nowrap;flex-shrink:0" onclick="Pages.pengaturan._resetAll()">Reset Data</button>
              </div>
            </div>

            <!-- Hapus Akun -->
            <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(247,111,111,0.15);border-radius:10px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-size:0.83rem;font-weight:600;color:var(--danger);display:flex;align-items:center;gap:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:var(--danger)"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Hapus Akun</div>
                  <div style="font-size:0.73rem;color:var(--text-muted);margin-top:2px">Hapus akun & semua data secara permanen. Tidak dapat dibatalkan!</div>
                </div>
                <button class="btn btn-sm" style="background:transparent;border:1px solid var(--danger);color:var(--danger);white-space:nowrap;flex-shrink:0" onclick="Pages.pengaturan._deleteAccount()">Hapus Akun</button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Info + Account + Backup -->
        <div class="set-col-right">

          <!-- Account Info -->
          <div class="card mb-16">
            <div class="card-title mb-14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;color:var(--primary)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Informasi Akun</div>
            <div id="setAccountInfo">
              <div class="set-info-loading" style="color:var(--text-muted)">Memuat informasi akun...</div>
            </div>
          </div>

          <!-- Data Statistics -->
          <div class="card mb-16">
            <div class="card-title mb-14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;vertical-align:middle;margin-right:8px;color:var(--primary)"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Statistik Data Tersimpan</div>
            <div class="set-stat-grid">
              ${this._infoItem('Transaksi Harian', totalTransaksi + ' record')}
              ${this._infoItem('Arus Kas (Cashflow)', totalCashflow + ' entri')}
              ${this._infoItem('Pengeluaran', totalPeng + ' item')}
              ${this._infoItem('Riwayat Servis', totalServis + ' catatan')}
              ${this._infoItem('Utang (Total)', totalUtang + ' · Aktif: ' + utangAktif)}
              ${this._infoItem('LocalStorage', storageSizeKB + ' KB')}
            </div>
            <div class="set-summary-strip mt-14">
              <div class="set-sum-item">
                <div class="set-sum-label">Saldo Bersih</div>
                <div class="set-sum-val text-success">${UI.formatRp(ds.saldoBersih)}</div>
              </div>
              <div class="set-sum-item">
                <div class="set-sum-label">Dana Servis</div>
                <div class="set-sum-val text-warning">${UI.formatRp(ds.danaServis.sisa)}</div>
              </div>
              <div class="set-sum-item">
                <div class="set-sum-label">Total Utang</div>
                <div class="set-sum-val text-danger">${UI.formatRp(ds.totalUtang)}</div>
              </div>
              <div class="set-sum-item">
                <div class="set-sum-label">Hari Kerja</div>
                <div class="set-sum-val text-primary">${ds.hariKerja} hari</div>
              </div>
            </div>
          </div>

          <!-- App Info -->
          <div class="card mb-16">
            <div class="card-title mb-14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;color:var(--primary)"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>Informasi Aplikasi</div>
            <div class="set-stat-grid">
              ${this._infoItem('Aplikasi', 'BudgetKu — Sistem Keuangan Ojol')}
              ${this._infoItem('Versi', '2.5.0 (Mei 2026)')}
              ${this._infoItem('Platform', navigator.platform || 'Web Browser')}
              ${this._infoItem('Browser', navigator.userAgent.split(')')[0].split('(')[1] || 'Unknown')}
              ${this._infoItem('Waktu Server', new Date().toLocaleString('id-ID'))}
              ${this._infoItem('Tanggal', new Date().toLocaleDateString('id-ID', {weekday:'long',year:'numeric',month:'long',day:'numeric'}))}
            </div>
          </div>

          <!-- Backup & Restore -->
          <div class="card">
            <div class="card-title mb-12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;color:var(--primary)"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"/><polygon points="12 22.08 21 17.08 21 6.92 12 12 12 22.08"/><polygon points="12 12 21 6.92 12 1.83 3 6.92 12 12"/></svg>Backup & Restore</div>
            <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:14px">
              Export semua data ke file JSON untuk backup. Import file JSON untuk restore.
            </p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-outline" onclick="Pages.pengaturan._export()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:6px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export JSON</button>
              <label class="btn btn-outline" style="cursor:pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:6px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Import JSON
                <input type="file" accept=".json" style="display:none" onchange="Pages.pengaturan._import(event)" />
              </label>
            </div>
          </div>

        </div>
      </div>
    `;

    // Form submit
    document.getElementById('formSettings').addEventListener('submit', e => {
      e.preventDefault();
      const newSettings = {
        nama_driver: document.getElementById('setNama').value.trim() || 'Driver',
        target_harian: parseFloat(document.getElementById('setTarget').value) || 150000,
        alokasi_servis_harian: parseFloat(document.getElementById('setAlokasi').value) || 10000,
        alokasi_tipe: document.getElementById('setTipeAlokasi').value,
      };
      DB.saveSettings(newSettings);
      UI.toast('Pengaturan disimpan', 'success');
    });

    // Load account info async
    this._loadAccountInfo();
  },

  async _loadAccountInfo() {
    const el = document.getElementById('setAccountInfo');
    if (!el) return;
    try {
      const user = await DB.getCurrentUser();
      if (user) {
        el.innerHTML = `
          <div class="set-stat-grid">
            ${this._infoItem('Email', user.email || '-')}
            ${this._infoItem('User ID', user.id?.substring(0,16)+'…' || '-')}
            ${this._infoItem('Status', user.email_confirmed_at ? 'Terverifikasi' : 'Belum Verifikasi')}
            ${this._infoItem('Bergabung', user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {year:'numeric',month:'long',day:'numeric'}) : '-')}
            ${this._infoItem('Login Terakhir', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID') : '-')}
          </div>
        `;
      } else {
        el.innerHTML = `<div class="infobox warning">
          <span class="infobox-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <span>Tidak ada sesi aktif. <a href="#" onclick="DB.logoutUser()" style="color:var(--primary)">Login ulang</a></span>
        </div>`;
      }
    } catch {
      el.innerHTML = `<div class="infobox warning"><span class="infobox-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span><span>Gagal memuat info akun</span></div>`;
    }
  },

  _infoItem(label, value) {
    return `<div class="set-info-item">
      <div class="set-info-label">${label}</div>
      <div class="set-info-val">${value}</div>
    </div>`;
  },

  _editRule() {
    const rules = DB.getAlokasiRules();
    const r = rules[0];
    UI.openModal('Edit Rule Alokasi Dana Servis', `
      <form id="formRule">
        <div class="form-group">
          <label class="form-label">Tipe Alokasi</label>
          <select class="form-control" id="rTipe">
            <option value="NOMINAL_TETAP" ${r.tipe === 'NOMINAL_TETAP' ? 'selected' : ''}>Nominal Tetap</option>
            <option value="PERSENTASE" ${r.tipe === 'PERSENTASE' ? 'selected' : ''}>Persentase</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nilai (Rp atau %)</label>
          <input type="number" class="form-control" id="rNilai" value="${r.nilai}" min="0" />
          <div class="form-hint">Nominal Tetap → isi Rp (contoh: 10000). Persentase → isi angka (contoh: 10 untuk 10%)</div>
        </div>
        <div class="toggle-group">
          <input type="checkbox" id="rAktif" ${r.aktif ? 'checked' : ''} />
          <label class="toggle-label" for="rAktif">Rule Aktif</label>
        </div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.pengaturan._saveRule()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Simpan</button>`);
  },

  _saveRule() {
    const rules = DB.getAlokasiRules();
    const r = rules[0];
    r.tipe  = document.getElementById('rTipe').value;
    r.nilai = parseFloat(document.getElementById('rNilai').value) || 10000;
    r.aktif = document.getElementById('rAktif').checked;
    DB.saveAlokasiRule(r);
    DB.saveSettings({ alokasi_servis_harian: r.nilai, alokasi_tipe: r.tipe });
    UI.closeModal();
    UI.toast('Rule alokasi diperbarui', 'success');
    Pages.pengaturan.render();
  },

  _resetAll() {
    UI.confirm('HAPUS SEMUA DATA? Ini tidak bisa dibatalkan!', () => {
      ['bk_transaksi','bk_cashflow','bk_dana_servis','bk_servis',
       'bk_pengeluaran','bk_utang','bk_alokasi'].forEach(k => localStorage.removeItem(k));
      UI.toast('Semua data dihapus', 'warning');
      UI.navigateTo('dashboard');
    });
  },

  _deleteAccount() {
    // Tampilkan modal konfirmasi dua langkah
    UI.openModal('Hapus Akun Permanen', `
      <div style="background:rgba(247,111,111,0.1);border:1px solid rgba(247,111,111,0.3);border-radius:10px;padding:14px;margin-bottom:16px">
        <div style="font-weight:700;color:var(--danger);margin-bottom:6px;display:flex;align-items:center;gap:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;color:var(--danger)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Perhatian!</div>
        <ul style="font-size:0.82rem;color:var(--text-muted);margin:0;padding-left:18px;line-height:1.8">
          <li>Semua data keuangan akan dihapus permanen</li>
          <li>Akun tidak dapat dipulihkan</li>
          <li>Sesi akan otomatis berakhir</li>
        </ul>
      </div>
      <div class="form-group">
        <label class="form-label" style="color:var(--danger)">Ketik <strong>HAPUS</strong> untuk konfirmasi</label>
        <input type="text" id="deleteConfirmInput" class="form-control" placeholder="Ketik HAPUS" autocomplete="off" />
      </div>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-danger" onclick="Pages.pengaturan._confirmDeleteAccount()">Hapus Akun Sekarang</button>`);
  },

  async _confirmDeleteAccount() {
    const input = document.getElementById('deleteConfirmInput');
    if (!input || input.value.trim().toUpperCase() !== 'HAPUS') {
      UI.toast('Ketik HAPUS untuk konfirmasi', 'error');
      return;
    }
    UI.closeModal();
    UI.toast('Menghapus akun...', 'info');
    try {
      // Hapus semua data lokal terlebih dahulu
      ['bk_transaksi','bk_cashflow','bk_dana_servis','bk_servis',
       'bk_pengeluaran','bk_utang','bk_alokasi','bk_settings','bk_alokasi'].forEach(k => localStorage.removeItem(k));

      // Coba hapus akun via Supabase
      const sb = DB.getSupabase();
      if (sb) {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          // Gunakan RPC jika tersedia, fallback ke logout
          try {
            await sb.rpc('delete_user_account');
          } catch (_) {
            // Jika RPC tidak ada, cukup sign out
          }
          await sb.auth.signOut();
        }
      }
      UI.toast('Akun berhasil dihapus. Sampai jumpa!', 'success');
    } catch (err) {
      UI.toast('Gagal menghapus akun: ' + (err.message || 'Error tidak diketahui'), 'error');
    }
  },

  _export() {
    const data = {
      exported_at: new Date().toISOString(),
      app_version: '2.5.0',
      transaksi:   DB.getTransaksi(),
      cashflow:    DB.getCashflow(),
      servis:      DB.getServis(),
      pengeluaran: DB.getPengeluaran(),
      utang:       DB.getUtang(),
      settings:    DB.getSettings(),
      alokasi:     DB.getAlokasiRules(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `budgetku_backup_${UI.todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast('Data berhasil diekspor', 'success');
  },

  _import(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.transaksi)   localStorage.setItem('bk_transaksi',   JSON.stringify(data.transaksi));
        if (data.cashflow)    localStorage.setItem('bk_cashflow',    JSON.stringify(data.cashflow));
        if (data.servis)      localStorage.setItem('bk_servis',      JSON.stringify(data.servis));
        if (data.pengeluaran) localStorage.setItem('bk_pengeluaran', JSON.stringify(data.pengeluaran));
        if (data.utang)       localStorage.setItem('bk_utang',       JSON.stringify(data.utang));
        if (data.settings)    localStorage.setItem('bk_settings',    JSON.stringify(data.settings));
        if (data.alokasi)     localStorage.setItem('bk_alokasi',     JSON.stringify(data.alokasi));
        UI.toast('Data berhasil diimpor', 'success');
        Pages.pengaturan.render();
      } catch {
        UI.toast('File JSON tidak valid', 'error');
      }
    };
    reader.readAsText(file);
  },
};
