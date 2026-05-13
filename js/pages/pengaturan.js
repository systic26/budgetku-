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
            <div class="card-title mb-16">⚙️ Pengaturan Umum</div>
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
              <button type="submit" class="btn btn-primary btn-full">💾 Simpan Pengaturan</button>
            </form>
          </div>

          <!-- Alokasi Rules -->
          <div class="card mb-16">
            <div class="card-title mb-12">🔧 Rule Alokasi Dana Servis</div>
            <div class="infobox info mb-14">
              <span>ℹ️</span>
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
            <button class="btn btn-outline btn-sm mt-8" onclick="Pages.pengaturan._editRule()">✏️ Edit Rule Alokasi</button>
          </div>

          <!-- Danger Zone -->
          <div class="card" style="border-color:rgba(247,111,111,0.3)">
            <div class="card-title mb-8" style="color:var(--danger)">⚠️ Danger Zone</div>
            <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px">Hapus semua data. Tindakan ini tidak dapat dibatalkan.</p>
            <button class="btn btn-danger btn-sm" onclick="Pages.pengaturan._resetAll()">🗑 Reset Semua Data</button>
          </div>
        </div>

        <!-- RIGHT: Info + Account + Backup -->
        <div class="set-col-right">

          <!-- Account Info -->
          <div class="card mb-16">
            <div class="card-title mb-14">👤 Informasi Akun</div>
            <div id="setAccountInfo">
              <div class="set-info-loading">⏳ Memuat informasi akun…</div>
            </div>
          </div>

          <!-- Data Statistics -->
          <div class="card mb-16">
            <div class="card-title mb-14">📊 Statistik Data Tersimpan</div>
            <div class="set-stat-grid">
              ${this._infoItem('📝 Transaksi Harian', totalTransaksi + ' record')}
              ${this._infoItem('💳 Arus Kas (Cashflow)', totalCashflow + ' entri')}
              ${this._infoItem('💸 Pengeluaran', totalPeng + ' item')}
              ${this._infoItem('🔧 Riwayat Servis', totalServis + ' catatan')}
              ${this._infoItem('🏦 Utang (Total)', totalUtang + ' · Aktif: ' + utangAktif)}
              ${this._infoItem('💾 LocalStorage', storageSizeKB + ' KB')}
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
            <div class="card-title mb-14">📱 Informasi Aplikasi</div>
            <div class="set-stat-grid">
              ${this._infoItem('🛵 Aplikasi', 'BudgetKu — Sistem Keuangan Ojol')}
              ${this._infoItem('🔢 Versi', '2.5.0 (Mei 2026)')}
              ${this._infoItem('💻 Platform', navigator.platform || 'Web Browser')}
              ${this._infoItem('🌐 Browser', navigator.userAgent.split(')')[0].split('(')[1] || 'Unknown')}
              ${this._infoItem('⏰ Waktu Server', new Date().toLocaleString('id-ID'))}
              ${this._infoItem('🗓️ Tanggal', new Date().toLocaleDateString('id-ID', {weekday:'long',year:'numeric',month:'long',day:'numeric'}))}
            </div>
          </div>

          <!-- Backup & Restore -->
          <div class="card">
            <div class="card-title mb-12">📦 Backup & Restore</div>
            <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:14px">
              Export semua data ke file JSON untuk backup. Import file JSON untuk restore.
            </p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-outline" onclick="Pages.pengaturan._export()">⬇️ Export JSON</button>
              <label class="btn btn-outline" style="cursor:pointer">
                ⬆️ Import JSON
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
      UI.toast('Pengaturan disimpan ✅', 'success');
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
            ${this._infoItem('📧 Email', user.email || '-')}
            ${this._infoItem('🆔 User ID', user.id?.substring(0,16)+'…' || '-')}
            ${this._infoItem('✅ Status', user.email_confirmed_at ? 'Terverifikasi' : 'Belum Verifikasi')}
            ${this._infoItem('📅 Bergabung', user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {year:'numeric',month:'long',day:'numeric'}) : '-')}
            ${this._infoItem('🔄 Login Terakhir', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID') : '-')}
          </div>
        `;
      } else {
        el.innerHTML = `<div class="infobox warning">
          <span>⚠️</span>
          <span>Tidak ada sesi aktif. <a href="#" onclick="DB.logoutUser()" style="color:var(--primary)">Login ulang</a></span>
        </div>`;
      }
    } catch {
      el.innerHTML = `<div class="infobox warning"><span>⚠️</span><span>Gagal memuat info akun</span></div>`;
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
        <button class="btn btn-primary" onclick="Pages.pengaturan._saveRule()">💾 Simpan</button>`);
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
    UI.toast('Rule alokasi diperbarui ✅', 'success');
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
    UI.toast('Data berhasil diekspor ✅', 'success');
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
        UI.toast('Data berhasil diimpor ✅', 'success');
        Pages.pengaturan.render();
      } catch {
        UI.toast('File JSON tidak valid ❌', 'error');
      }
    };
    reader.readAsText(file);
  },
};
