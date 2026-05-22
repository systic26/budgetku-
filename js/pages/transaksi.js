/* Transaksi Page — 2-column balanced layout */
Pages.transaksi = {

  render() {
    const el = document.getElementById('page-transaksi');
    const settings = DB.getSettings();
    const recent = DB.getTransaksi()
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 5);

    el.innerHTML = `
      <div class="trx-layout">

        <!-- LEFT: Form Input -->
        <div class="trx-left">
          <div class="card">
            <div class="card-title mb-16"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Input Transaksi Harian</div>
            <form id="formTransaksi" autocomplete="off">

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tanggal</label>
                  <input type="date" class="form-control" id="trxTanggal" value="${UI.todayISO()}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Jumlah Orderan</label>
                  <input type="number" class="form-control" id="trxOrderan" placeholder="0" min="0" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Jam Mulai</label>
                  <input type="time" class="form-control" id="trxJamMulai" />
                </div>
                <div class="form-group">
                  <label class="form-label">Jam Selesai</label>
                  <input type="time" class="form-control" id="trxJamSelesai" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Penghasilan Kotor (Trip)</label>
                <input type="number" class="form-control" id="trxPenghasilan" placeholder="0" min="0" />
                <div class="form-hint">Hanya penghasilan dari orderan trip, BELUM termasuk insentif</div>
              </div>

              <!-- INSENTIF TOGGLE -->
              <div class="toggle-group">
                <input type="checkbox" id="trxAdaInsentif" />
                <label class="toggle-label" for="trxAdaInsentif">Ada Insentif</label>
              </div>
              <div id="insentifBox" style="display:none">
                <div class="infobox info">
                  <span class="infobox-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
                  <span>Insentif masuk ke <strong>Saldo Operasional</strong> — tidak ke Dana Servis</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Nominal Insentif</label>
                  <input type="number" class="form-control" id="trxInsentif" placeholder="0" min="0" />
                </div>
              </div>

              <!-- STATUS OPERASI -->
              <div class="form-group">
                <label class="form-label">Status Operasi</label>
                <div class="radio-group">
                  <div class="radio-btn selected working" id="btnKerja" onclick="Pages.transaksi.setStatus('WORKING')">Kerja</div>
                  <div class="radio-btn off" id="btnLibur" onclick="Pages.transaksi.setStatus('OFF')">Libur</div>
                </div>
              </div>

              <div id="statusInfo"></div>

              <!-- ALOKASI PREVIEW -->
              <div id="alokasiPreview" class="infobox success">
                <span class="infobox-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span>
                <div>Alokasi Dana Servis: <strong id="alokasiNominal">${UI.formatRp(settings.alokasi_servis_harian)}</strong>
                  <span style="font-size:0.72rem;color:var(--text-muted);display:block">Berdasarkan rule aktif: Nominal Tetap ${UI.formatRp(settings.alokasi_servis_harian)}/hari kerja</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Keterangan</label>
                <input type="text" class="form-control" id="trxKeterangan" placeholder="contoh: Target tercapai, cuaca hujan, dll" />
              </div>

              <button type="submit" class="btn btn-primary btn-full" id="btnSimpan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Simpan Transaksi</button>
            </form>
          </div>
        </div>

        <!-- RIGHT: Recent History + Manual Alokasi -->
        <div class="trx-right">

          <!-- Ringkasan cepat hari ini -->
          <div class="card trx-today-card">
            <div class="card-title mb-12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Statistik Cepat</div>
            ${this._renderQuickStats()}
          </div>

          <!-- Riwayat 5 transaksi terakhir -->
          <div class="card mt-16">
            <div class="card-title mb-12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>5 Transaksi Terakhir</div>
            ${recent.length ? recent.map(t => `
              <div class="trx-recent-item">
                <div>
                  <div class="fw-600" style="font-size:0.85rem">${UI.formatDate(t.tanggal)}</div>
                  <div class="text-muted" style="font-size:0.75rem">${t.jumlah_orderan || 0} order · ${t.jam_mulai || '--'}–${t.jam_selesai || '--'}</div>
                </div>
                <div class="text-right">
                  <div class="fw-600 text-success" style="font-size:0.88rem">${UI.formatRp(t.penghasilan_kotor || 0)}</div>
                  <div style="font-size:0.72rem">${UI.badgeStatus(t.status_operasi)}</div>
                </div>
              </div>
            `).join('') : UI.emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', 'Belum ada transaksi')}
          </div>

          <!-- Manual Alokasi -->
          <div class="card mt-16">
            <div class="card-title mb-12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Alokasi Manual ke Dana Servis</div>
            <div class="infobox warning" style="margin-bottom:12px">
              <span class="infobox-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
              <span>Untuk kasus khusus. Source: <strong>MANUAL</strong>.</span>
            </div>
            <form id="formManual" autocomplete="off">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tanggal</label>
                  <input type="date" class="form-control" id="manTanggal" value="${UI.todayISO()}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nominal</label>
                  <input type="number" class="form-control" id="manNominal" placeholder="0" min="0" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Tujuan Dana</label>
                <select class="form-control" id="manTujuan">
                  <option value="DANA_SERVIS">Dana Servis</option>
                  <option value="SALDO_OPERASIONAL">Saldo Operasional</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Keterangan</label>
                <input type="text" class="form-control" id="manKeterangan" placeholder="Alasan alokasi manual" />
              </div>
              <button type="submit" class="btn btn-warning btn-full"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Simpan Alokasi Manual</button>
            </form>
          </div>

        </div>
      </div>
    `;

    this._status = 'WORKING';
    this._bindEvents();
  },

  _renderQuickStats() {
    const cf = DB.getCashflow();
    const today = UI.todayISO();
    const todayCf = cf.filter(c => c.tanggal === today);
    const income = todayCf.filter(c => c.kategori === 'PENGHASILAN').reduce((s, c) => s + (c.nominal || 0), 0);
    const servisAlloc = todayCf.filter(c => c.source_type === 'SERVIS_ALLOC').reduce((s, c) => s + (c.nominal || 0), 0);
    const trxToday = DB.getTransaksi().filter(t => t.tanggal === today);
    const settings = DB.getSettings();
    const target = settings.target_harian || 150000;
    const pct = Math.min(100, Math.round((income / target) * 100));
    const color = pct >= 100 ? 'success' : pct >= 60 ? 'warning' : 'danger';

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="background:var(--bg-base);border-radius:8px;padding:10px 12px">
          <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Pendapatan Hari Ini</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--success)">${UI.formatRp(income)}</div>
        </div>
        <div style="background:var(--bg-base);border-radius:8px;padding:10px 12px">
          <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Alokasi Servis</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--warning)">${UI.formatRp(servisAlloc)}</div>
        </div>
        <div style="background:var(--bg-base);border-radius:8px;padding:10px 12px">
          <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Status Hari Ini</div>
          <div style="font-size:0.9rem;font-weight:700">${trxToday.length ? UI.badgeStatus(trxToday[0].status_operasi) : '<span class="text-muted">Belum input</span>'}</div>
        </div>
        <div style="background:var(--bg-base);border-radius:8px;padding:10px 12px">
          <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Order Hari Ini</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--primary)">${trxToday.reduce((s,t) => s + (t.jumlah_orderan||0), 0)}</div>
        </div>
      </div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;display:flex;justify-content:space-between">
        <span>Progress Target Harian</span><span>${pct}% dari ${UI.formatRp(target)}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill ${color}" style="width:${pct}%"></div></div>
    `;
  },

  _status: 'WORKING',

  setStatus(s) {
    this._status = s;
    document.getElementById('btnKerja').className = `radio-btn${s === 'WORKING' ? ' selected working' : ''}`;
    document.getElementById('btnLibur').className = `radio-btn${s === 'OFF' ? ' selected off' : ''}`;
    const info = document.getElementById('statusInfo');
    const prev = document.getElementById('alokasiPreview');
    if (s === 'OFF') {
      info.innerHTML = '<div class="infobox warning"><span class="infobox-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M8 16h8M8 8h8"/></svg></span><span>Hari libur — tidak ada alokasi dana servis otomatis</span></div>';
      prev.style.display = 'none';
    } else {
      info.innerHTML = '';
      prev.style.display = 'flex';
    }
  },

  _bindEvents() {
    document.getElementById('trxAdaInsentif').addEventListener('change', function () {
      document.getElementById('insentifBox').style.display = this.checked ? 'block' : 'none';
    });
    document.getElementById('trxPenghasilan').addEventListener('input', () => this._updatePreview());
    document.getElementById('trxInsentif').addEventListener('input', () => this._updatePreview());
    document.getElementById('formTransaksi').addEventListener('submit', e => {
      e.preventDefault(); this._submitTransaksi();
    });
    document.getElementById('formManual').addEventListener('submit', e => {
      e.preventDefault(); this._submitManual();
    });
  },

  _updatePreview() {
    const kotor = parseFloat(document.getElementById('trxPenghasilan').value) || 0;
    const insentif = parseFloat(document.getElementById('trxInsentif')?.value) || 0;
    const trip = kotor - insentif;
    const alokasi = Engine.hitungAlokasiServis(trip);
    const el = document.getElementById('alokasiNominal');
    if (el) el.textContent = UI.formatRp(alokasi);
  },

  _submitTransaksi() {
    const tanggal = document.getElementById('trxTanggal').value;
    const jam_mulai = document.getElementById('trxJamMulai').value;
    const jam_selesai = document.getElementById('trxJamSelesai').value;
    const jumlah_orderan = parseInt(document.getElementById('trxOrderan').value) || 0;
    const adaInsentif = document.getElementById('trxAdaInsentif').checked;
    const penghasilan_trip = parseFloat(document.getElementById('trxPenghasilan').value) || 0;
    const insentif = adaInsentif ? (parseFloat(document.getElementById('trxInsentif').value) || 0) : 0;
    const keterangan = document.getElementById('trxKeterangan').value;
    const penghasilan_kotor = penghasilan_trip + insentif;

    if (!tanggal) return UI.toast('Tanggal wajib diisi', 'error');
    if (this._status === 'WORKING' && penghasilan_trip <= 0) {
      return UI.toast('Penghasilan trip harus diisi untuk hari kerja', 'error');
    }
    try {
      const result = Engine.prosesTransaksi({
        tanggal, jam_mulai, jam_selesai, jumlah_orderan,
        penghasilan_kotor, insentif, keterangan,
        status_override: this._status,
      });
      UI.toast(`Disimpan! Dana servis +${UI.formatRp(result.alokasi_servis)}`, 'success');
      document.getElementById('formTransaksi').reset();
      document.getElementById('trxTanggal').value = UI.todayISO();
      document.getElementById('insentifBox').style.display = 'none';
      this.setStatus('WORKING');
      Pages.dashboard && Pages.dashboard.render && Pages.dashboard.render();
      this.render(); // refresh recent list
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  _submitManual() {
    const tanggal = document.getElementById('manTanggal').value;
    const nominal = parseFloat(document.getElementById('manNominal').value) || 0;
    const tujuan = document.getElementById('manTujuan').value;
    const keterangan = document.getElementById('manKeterangan').value;
    if (!tanggal || !nominal) return UI.toast('Isi tanggal dan nominal', 'error');
    try {
      Engine.alokasiManual({ tanggal, nominal, tujuan, keterangan });
      UI.toast('Alokasi manual berhasil disimpan', 'success');
      document.getElementById('formManual').reset();
      document.getElementById('manTanggal').value = UI.todayISO();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },
};
