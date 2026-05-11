/* Transaksi Page */
Pages.transaksi = {
  render() {
    const el = document.getElementById('page-transaksi');
    const settings = DB.getSettings();
    el.innerHTML = `
      <div style="max-width:600px;margin:0 auto">
        <div class="card">
          <div class="card-title mb-16">📝 Input Transaksi Harian</div>

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
                <span>ℹ️</span>
                <span>Insentif akan masuk ke <strong>Saldo Operasional</strong> — tidak ke Dana Servis</span>
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
                <div class="radio-btn selected working" id="btnKerja" onclick="Pages.transaksi.setStatus('WORKING')">
                  ⚡ Kerja
                </div>
                <div class="radio-btn off" id="btnLibur" onclick="Pages.transaksi.setStatus('OFF')">
                  💤 Libur
                </div>
              </div>
            </div>

            <!-- STATUS INFO -->
            <div id="statusInfo"></div>

            <!-- ALOKASI PREVIEW -->
            <div id="alokasiPreview" class="infobox success">
              <span>🔧</span>
              <div>Alokasi Dana Servis: <strong id="alokasiNominal">${UI.formatRp(settings.alokasi_servis_harian)}</strong>
              <span style="font-size:0.72rem;color:var(--text-muted);display:block">Berdasarkan rule aktif: Nominal Tetap ${UI.formatRp(settings.alokasi_servis_harian)}/hari kerja</span></div>
            </div>

            <div class="form-group">
              <label class="form-label">Keterangan</label>
              <input type="text" class="form-control" id="trxKeterangan" placeholder="contoh: Target tercapai, cuaca hujan, dll" />
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="btnSimpan">
              💾 Simpan Transaksi
            </button>
          </form>
        </div>

        <!-- MANUAL ALOKASI -->
        <div class="card mt-16">
          <div class="card-title mb-12">🔧 Alokasi Manual ke Dana Servis</div>
          <div class="infobox warning">
            <span>⚠️</span>
            <span>Gunakan ini untuk kasus khusus. Source akan tercatat sebagai <strong>MANUAL</strong>.</span>
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
            <button type="submit" class="btn btn-warning btn-full">💾 Simpan Alokasi Manual</button>
          </form>
        </div>
      </div>
    `;

    this._status = 'WORKING';
    this._bindEvents();
  },

  _status: 'WORKING',

  setStatus(s) {
    this._status = s;
    document.getElementById('btnKerja').className = `radio-btn${s === 'WORKING' ? ' selected working' : ''}`;
    document.getElementById('btnLibur').className = `radio-btn${s === 'OFF' ? ' selected off' : ''}`;
    const info = document.getElementById('statusInfo');
    const prev = document.getElementById('alokasiPreview');
    if (s === 'OFF') {
      info.innerHTML = '<div class="infobox warning"><span>💤</span><span>Hari libur — tidak ada alokasi dana servis otomatis</span></div>';
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
      e.preventDefault();
      this._submitTransaksi();
    });

    document.getElementById('formManual').addEventListener('submit', e => {
      e.preventDefault();
      this._submitManual();
    });
  },

  _updatePreview() {
    const kotor = parseFloat(document.getElementById('trxPenghasilan').value) || 0;
    const insentif = parseFloat(document.getElementById('trxInsentif').value) || 0;
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
      UI.toast(`✅ Transaksi disimpan! Dana servis +${UI.formatRp(result.alokasi_servis)}`, 'success');
      document.getElementById('formTransaksi').reset();
      document.getElementById('trxTanggal').value = UI.todayISO();
      document.getElementById('insentifBox').style.display = 'none';
      this.setStatus('WORKING');
      Pages.dashboard && Pages.dashboard.render && Pages.dashboard.render();
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
