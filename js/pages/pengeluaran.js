/* Pengeluaran Page — dengan Perbandingan Pemasukan */
Pages.pengeluaran = {
  render() {
    const el = document.getElementById('page-pengeluaran');
    const list = DB.getPengeluaran();
    const cf   = DB.getCashflow();

    // Totals pengeluaran
    const total      = list.reduce((s, p) => s + (p.nominal || 0), 0);
    const monthPfx   = new Date().toISOString().slice(0, 7);
    const monthTotal = list.filter(p => p.tanggal?.startsWith(monthPfx)).reduce((s, p) => s + (p.nominal || 0), 0);
    const monthCount = list.filter(p => p.tanggal?.startsWith(monthPfx)).length;

    // Pemasukan dari cashflow
    const totalPemasukan      = cf.filter(c => c.source_type === 'TRIP' || c.source_type === 'INCENTIVE').reduce((s, c) => s + (c.nominal || 0), 0);
    const monthPemasukan      = cf.filter(c => (c.source_type === 'TRIP' || c.source_type === 'INCENTIVE') && c.tanggal?.startsWith(monthPfx)).reduce((s, c) => s + (c.nominal || 0), 0);
    const saldoBersih         = totalPemasukan - total;
    const saldoBersihBulan    = monthPemasukan - monthTotal;
    const rasioTotal          = totalPemasukan > 0 ? Math.round((total / totalPemasukan) * 100) : 0;
    const rasioMonth          = monthPemasukan > 0 ? Math.round((monthTotal / monthPemasukan) * 100) : 0;

    // Per-kategori breakdown
    const byKat  = {};
    list.forEach(p => { byKat[p.kategori] = (byKat[p.kategori] || 0) + (p.nominal || 0); });
    const topKat = Object.entries(byKat).sort((a, b) => b[1] - a[1])[0];

    el.innerHTML = `
      <!-- Summary Strip — 4 kartu -->
      <div class="page-summary-strip" style="grid-template-columns:repeat(4,1fr)">
        <div class="mini-stat">
          <div class="mini-stat-label">Total Pengeluaran</div>
          <div class="mini-stat-val text-danger">${UI.formatRp(total)}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px">${list.length} transaksi</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Total Pemasukan</div>
          <div class="mini-stat-val text-success">${UI.formatRp(totalPemasukan)}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px">${cf.filter(c=>c.source_type==='TRIP'||c.source_type==='INCENTIVE').length} entri</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Saldo Bersih</div>
          <div class="mini-stat-val ${saldoBersih >= 0 ? 'text-success' : 'text-danger'}">${saldoBersih >= 0 ? '+' : ''}${UI.formatRp(saldoBersih)}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px">rasio ${rasioTotal}% terpakai</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Bulan Ini</div>
          <div class="mini-stat-val text-primary">${UI.formatRp(monthTotal)}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px">${monthCount} entri · ${rasioMonth}% dr pemasukan</div>
        </div>
      </div>

      <!-- Comparison Card (bulan ini) -->
      <div class="card mb-16" style="padding:20px 24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-size:0.82rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted)">Perbandingan Bulan Ini</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${new Date().toLocaleString('id-ID',{month:'long',year:'numeric'})}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px">
          <!-- Pemasukan -->
          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:16px">
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Pemasukan</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--success)">${UI.formatRp(monthPemasukan)}</div>
            <div style="margin-top:10px;height:6px;background:rgba(16,185,129,0.15);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:100%;background:linear-gradient(90deg,#10b981,#34d399);border-radius:99px;transition:width .6s ease"></div>
            </div>
          </div>
          <!-- Pengeluaran -->
          <div style="background:rgba(247,111,111,0.08);border:1px solid rgba(247,111,111,0.2);border-radius:12px;padding:16px">
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Pengeluaran</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--danger)">${UI.formatRp(monthTotal)}</div>
            <div style="margin-top:10px;height:6px;background:rgba(247,111,111,0.15);border-radius:99px;overflow:hidden">
              <div id="pngBarFill" style="height:100%;width:0%;background:linear-gradient(90deg,#f76f6f,#ff4d4d);border-radius:99px;transition:width .6s ease"></div>
            </div>
          </div>
        </div>

        <!-- Combined bar -->
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-bottom:6px">
            <span>Pengeluaran ${rasioMonth}%</span>
            <span>Tersisa ${100-rasioMonth > 0 ? 100-rasioMonth : 0}%</span>
          </div>
          <div style="height:10px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;position:relative">
            <div id="pngCombinedBar" style="height:100%;width:0%;background:${rasioMonth > 80 ? 'linear-gradient(90deg,#f76f6f,#ff4d4d)' : rasioMonth > 60 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#10b981,#34d399)'};border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1)"></div>
          </div>
        </div>

        <!-- Saldo bersih bulan ini -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
          <span style="font-size:0.8rem;color:var(--text-muted)">Saldo bersih bulan ini</span>
          <span style="font-weight:800;font-size:1rem;color:${saldoBersihBulan >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${saldoBersihBulan >= 0 ? '+' : ''}${UI.formatRp(saldoBersihBulan)}
          </span>
        </div>
      </div>

      <!-- 2-col: Form + List -->
      <div class="page-2col">
        <!-- Form -->
        <div class="card page-2col-form">
          <div class="card-title mb-16"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>Catat Pengeluaran</div>
          <form id="formPengeluaran">
            <div class="form-group">
              <label class="form-label">Tanggal</label>
              <input type="date" class="form-control" id="pngTanggal" value="${UI.todayISO()}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <select class="form-control" id="pngKategori">
                <option value="Bensin">Bensin</option>
                <option value="Pulsa/Data">Pulsa/Data</option>
                <option value="Makan">Makan</option>
                <option value="Parkir">Parkir</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nominal (Rp)</label>
              <input type="number" class="form-control" id="pngNominal" placeholder="0" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Keterangan</label>
              <input type="text" class="form-control" id="pngKet" placeholder="detail pengeluaran" />
            </div>
            <button type="submit" class="btn btn-danger btn-full"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Simpan Pengeluaran</button>
          </form>

          <!-- Breakdown per kategori -->
          ${Object.keys(byKat).length ? `
          <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px">
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:12px">Breakdown Kategori</div>
            ${Object.entries(byKat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
              <div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-size:0.8rem;font-weight:500">${k}</span>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:0.7rem;color:var(--text-muted)">${total > 0 ? Math.round((v/total)*100) : 0}%</span>
                    <span class="text-danger fw-600" style="font-size:0.82rem">${UI.formatRp(v)}</span>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill danger" style="width:${total > 0 ? Math.round((v/total)*100) : 0}%"></div>
                </div>
              </div>
            `).join('')}
          </div>` : ''}
        </div>

        <!-- List -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Riwayat Pengeluaran</div>
            <span class="text-danger fw-600">${UI.formatRp(total)}</span>
          </div>
          <div id="pengeluaranList">${this._renderList(list)}</div>
        </div>
      </div>
    `;

    // Animate bars after render
    requestAnimationFrame(() => {
      const bar = document.getElementById('pngBarFill');
      const combo = document.getElementById('pngCombinedBar');
      if (bar) bar.style.width = monthPemasukan > 0 ? Math.min(100, rasioMonth) + '%' : '0%';
      if (combo) combo.style.width = Math.min(100, rasioMonth) + '%';
    });

    document.getElementById('formPengeluaran').addEventListener('submit', e => {
      e.preventDefault();
      const tanggal    = document.getElementById('pngTanggal').value;
      const kategori   = document.getElementById('pngKategori').value;
      const nominal    = parseFloat(document.getElementById('pngNominal').value) || 0;
      const keterangan = document.getElementById('pngKet').value || kategori;
      if (!nominal) return UI.toast('Nominal wajib diisi', 'error');
      DB.insertPengeluaran({ tanggal, kategori, nominal, keterangan });
      UI.toast('Pengeluaran dicatat', 'success');
      Pages.pengeluaran.render();
    });
  },

  _renderList(list) {
    const rev = list.slice().sort((a, b) => {
      const diff = new Date(b.tanggal) - new Date(a.tanggal);
      return diff !== 0 ? diff : new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    if (!rev.length) return UI.emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>', 'Belum ada pengeluaran dicatat');
    return `<div class="table-wrap"><table>
      <thead><tr><th>Tanggal</th><th>Kategori</th><th class="text-right">Nominal</th><th>Keterangan</th><th class="text-right">Aksi</th></tr></thead>
      <tbody>
        ${rev.map((p, i) => `<tr style="animation:fadeInUp 0.2s ease ${i * 30}ms both">
          <td style="white-space:nowrap;font-size:0.82rem">${UI.formatDate(p.tanggal)}</td>
          <td><span class="badge badge-danger" style="font-size:0.68rem">${p.kategori}</span></td>
          <td class="text-right text-danger fw-600">${UI.formatRp(p.nominal)}</td>
          <td class="text-muted" style="font-size:0.78rem;max-width:150px;word-break:break-word">${p.keterangan || '-'}</td>
          <td class="text-right" style="white-space:nowrap">
            <button class="btn-icon edit" onclick="Pages.pengeluaran._edit('${p.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-icon danger" onclick="Pages.pengeluaran._delete('${p.id}')" title="Hapus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
          </td>
        </tr>`).join('')}
      </tbody>
      <tfoot><tr style="font-weight:700;border-top:2px solid var(--border)">
        <td colspan="2">TOTAL</td>
        <td class="text-right text-danger">${UI.formatRp(list.reduce((s, p) => s + (p.nominal || 0), 0))}</td>
        <td colspan="2"></td>
      </tr></tfoot>
    </table></div>`;
  },

  _edit(id) {
    const p = DB.getPengeluaran().find(x => x.id === id);
    if (!p) return;
    UI.openModal('Edit Pengeluaran', `
      <form id="formEditPng">
        <div class="form-group"><label class="form-label">Tanggal</label><input type="date" id="epTanggal" class="form-control" value="${p.tanggal}" required></div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select id="epKategori" class="form-control">
            ${['Bensin','Pulsa/Data','Makan','Parkir','Lainnya'].map(k => `<option value="${k}" ${p.kategori === k ? 'selected' : ''}>${k}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Nominal (Rp)</label><input type="number" id="epNominal" class="form-control" value="${p.nominal}" required></div>
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="epKet" class="form-control" value="${p.keterangan || ''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.pengeluaran._saveEdit('${id}')">Simpan</button>`);
  },

  _saveEdit(id) {
    const tanggal    = document.getElementById('epTanggal').value;
    const kategori   = document.getElementById('epKategori').value;
    const nominal    = parseFloat(document.getElementById('epNominal').value) || 0;
    const keterangan = document.getElementById('epKet').value || kategori;
    if (!nominal) return UI.toast('Nominal wajib diisi', 'error');
    DB.updatePengeluaran(id, { tanggal, kategori, nominal, keterangan });
    UI.closeModal();
    UI.toast('Pengeluaran diubah', 'success');
    Pages.pengeluaran.render();
  },

  _delete(id) {
    UI.confirm('Hapus pengeluaran ini?', () => {
      DB.deletePengeluaran(id);
      UI.toast('Pengeluaran dihapus', 'info');
      Pages.pengeluaran.render();
    });
  },
};
