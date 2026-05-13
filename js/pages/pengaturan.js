/* Pengaturan Page */
Pages.pengaturan = {
  render() {
    const el = document.getElementById('page-pengaturan');
    const s = DB.getSettings();
    const rules = DB.getAlokasiRules();

    el.innerHTML = `
      <div class="grid-2">
        <!-- Settings Form -->
        <div>
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
              <button type="submit" class="btn btn-primary">💾 Simpan Pengaturan</button>
            </form>
          </div>

          <!-- Alokasi Rules -->
          <div class="card mb-16">
            <div class="card-title mb-16">🔧 Rule Alokasi Dana Servis</div>
            <div class="infobox info mb-16">
              <span>ℹ️</span>
              <span>Rule ini menentukan berapa dana servis yang dialokasikan setiap hari kerja. Insentif TIDAK masuk ke dana servis.</span>
            </div>
            ${rules.map(r => `
              <div style="padding:12px;background:var(--bg-base);border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <span class="fw-600">${r.nama_alokasi}</span>
                  <span class="badge ${r.aktif ? 'badge-success' : 'badge-muted'}">${r.aktif ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div style="font-size:0.78rem;color:var(--text-muted)">
                  Tipe: <strong>${r.tipe}</strong> · Nilai: <strong>${r.tipe === 'NOMINAL_TETAP' ? UI.formatRp(r.nilai) : r.nilai + '%'}</strong>
                  · Sumber: <strong>${r.sumber_dana}</strong>
                  · Hanya hari kerja: <strong>${r.hanya_hari_kerja ? 'Ya' : 'Tidak'}</strong>
                </div>
              </div>
            `).join('')}
            <button class="btn btn-outline btn-sm" onclick="Pages.pengaturan._editRule()">✏️ Edit Rule Alokasi</button>
          </div>

          <!-- Danger Zone -->
          <div class="card" style="border-color:rgba(247,111,111,0.3)">
            <div class="card-title mb-12" style="color:var(--danger)">⚠️ Danger Zone</div>
            <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px">Hapus semua data. Tindakan ini tidak dapat dibatalkan.</p>
            <button class="btn btn-danger btn-sm" onclick="Pages.pengaturan._resetAll()">🗑 Reset Semua Data</button>
          </div>
        </div>

        <!-- Export / Import -->
        <div class="card">
          <div class="card-title mb-12">📦 Backup & Restore</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="Pages.pengaturan._export()">⬇️ Export JSON</button>
            <label class="btn btn-outline btn-sm" style="cursor:pointer">
              ⬆️ Import JSON
              <input type="file" accept=".json" style="display:none" onchange="Pages.pengaturan._import(event)" />
            </label>
          </div>
        </div>
      </div>
    `;

    document.getElementById('formSettings').addEventListener('submit', e => {
      e.preventDefault();
      DB.saveSettings({
        nama_driver: document.getElementById('setNama').value,
        target_harian: parseFloat(document.getElementById('setTarget').value) || 150000,
      });
      UI.toast('Pengaturan disimpan ✅', 'success');
    });
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
          <div class="form-hint">Jika Nominal Tetap: isi Rp (misal 10000). Jika Persentase: isi angka (misal 10 untuk 10%)</div>
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
    r.tipe = document.getElementById('rTipe').value;
    r.nilai = parseFloat(document.getElementById('rNilai').value) || 10000;
    r.aktif = document.getElementById('rAktif').checked;
    DB.saveAlokasiRule(r);
    // Sync settings
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
      Pages.dashboard.render();
      UI.navigateTo('dashboard');
    });
  },

  _export() {
    const data = {
      exported_at: new Date().toISOString(),
      transaksi: DB.getTransaksi(),
      cashflow: DB.getCashflow(),
      servis: DB.getServis(),
      pengeluaran: DB.getPengeluaran(),
      utang: DB.getUtang(),
      settings: DB.getSettings(),
      alokasi: DB.getAlokasiRules(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
        if (data.transaksi) localStorage.setItem('bk_transaksi', JSON.stringify(data.transaksi));
        if (data.cashflow) localStorage.setItem('bk_cashflow', JSON.stringify(data.cashflow));
        if (data.servis) localStorage.setItem('bk_servis', JSON.stringify(data.servis));
        if (data.pengeluaran) localStorage.setItem('bk_pengeluaran', JSON.stringify(data.pengeluaran));
        if (data.utang) localStorage.setItem('bk_utang', JSON.stringify(data.utang));
        if (data.settings) localStorage.setItem('bk_settings', JSON.stringify(data.settings));
        if (data.alokasi) localStorage.setItem('bk_alokasi', JSON.stringify(data.alokasi));
        UI.toast('Data berhasil diimpor ✅', 'success');
        Pages.pengaturan.render();
      } catch {
        UI.toast('File JSON tidak valid', 'error');
      }
    };
    reader.readAsText(file);
  },
};
