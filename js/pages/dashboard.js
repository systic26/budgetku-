/* Dashboard Page — Enhanced Analytics */
window.Pages = window.Pages || {};
Pages.dashboard = {
  _calYear: new Date().getFullYear(),
  _calMonth: new Date().getMonth(),

  navigateCalendar(dir) {
    this._calMonth += dir;
    if (this._calMonth > 11) { this._calMonth = 0; this._calYear++; }
    if (this._calMonth < 0)  { this._calMonth = 11; this._calYear--; }
    this._rerenderCalendar();
  },

  goCalendarToday() {
    this._calYear  = new Date().getFullYear();
    this._calMonth = new Date().getMonth();
    this._rerenderCalendar();
  },

  setCalYear(y) {
    this._calYear = parseInt(y);
    this._rerenderCalendar();
  },

  _rerenderCalendar() {
    const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const y = this._calYear, m = this._calMonth;
    const now = new Date();
    const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();

    // Update title
    const titleEl = document.getElementById('dbCalTitle');
    if (titleEl) titleEl.innerHTML = `&#x1F5D3;&#xFE0F; ${MONTHS[m]} ${y}`;

    // Today button visibility
    const todayBtn = document.getElementById('dbCalTodayBtn');
    if (todayBtn) todayBtn.style.display = isCurrentMonth ? 'none' : 'inline-flex';

    // Update year select
    const yearSel = document.getElementById('dbCalYear');
    if (yearSel) yearSel.value = y;

    // Re-render grid
    const settings = DB.getSettings();
    const target = settings.target_harian || 150000;
    const heatmap = this._getMonthHeatmap(y, m);
    this._renderHeatmap('dbHeatmap', heatmap, target, y, m);
  },


  render() {
    const el = document.getElementById('page-dashboard');
    const s = DB.getDashboardSummary();
    const ds = s.danaServis;
    const dsPct = ds.masuk > 0 ? Math.round((ds.keluar / ds.masuk) * 100) : 0;
    const rasio = s.rasioUtang;
    const rasioDisplay = isFinite(rasio) ? rasio.toFixed(2) : '∞';
    const debtWarn = rasio > 1.0;
    const settings = DB.getSettings();
    const target = settings.target_harian || 150000;
    const week = this._getWeekComparison();
    const last30 = this._getLast30();
    if (!this._calInitialized) {
      this._calYear  = new Date().getFullYear();
      this._calMonth = new Date().getMonth();
      this._calInitialized = true;
    }
    const heatmap = this._getMonthHeatmap(this._calYear, this._calMonth);
    const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const ringPct = Math.min(100, Math.round(((s.todayIncome||0)/target)*100));
    const ringOffset = 201 - Math.min(201, Math.round(((s.todayIncome||0)/target)*201));
    const ringColor = s.todayIncome>=target?'var(--success)':s.todayIncome>=target*0.6?'var(--warning)':'var(--danger)';

    el.innerHTML = `
      ${debtWarn ? `<div class="alert-debt mb-24"><div class="alert-debt-icon">&#x1F6A8;</div><div class="alert-debt-text">Rasio Utang/Bersih ${rasioDisplay}&times; &mdash; Utang melebihi saldo bersih!</div></div>` : ''}

      <div class="db-stat-strip" id="dbStatStrip">
        ${statCard('primary','&#x1F4B0;','Saldo Kotor', s.saldoKotor,
          `<div class="stat-breakdown"><div class="breakdown-row"><span class="breakdown-label">Trip</span><span class="breakdown-val text-primary">${UI.formatRp(s.tripIncome)}</span></div><div class="breakdown-row"><span class="breakdown-label">Insentif</span><span class="breakdown-val text-primary">${UI.formatRp(s.insentifIncome)}</span></div></div>`,
          'riwayat', 0)}
        ${statCard('success','&#x2705;','Saldo Bersih', s.saldoBersih,
          `<div class="stat-meta">Setelah pengeluaran &amp; alokasi servis</div>`,
          'laporan', 1)}
        ${statCard('warning','&#x1F527;','Dana Servis', ds.sisa,
          `<div class="progress-wrap"><div class="progress-labels"><span>Terpakai ${dsPct}%</span><span>${UI.formatRp(ds.masuk)} terkumpul</span></div><div class="progress-bar"><div class="progress-fill ${dsPct>80?'danger':'warning'}" style="width:${Math.min(dsPct,100)}%"></div></div></div>`,
          'servis', 2)}
        ${statCard('danger','&#x1F3E6;','Total Utang', s.totalUtang,
          `<div class="stat-meta">Rasio: ${rasioDisplay}&times;</div>`,
          'utang', 3)}
      </div>

      <div class="db-main-layout">
        <div class="db-main-col">
          <div class="card db-line-card-xl">
            <div class="db-line-title">&#x1F4C8; TREN PENDAPATAN 30 HARI TERAKHIR</div>
            <div class="db-line-meta-v2">
              <span>Total: <strong class="text-success">${UI.formatRp(last30.total)}</strong></span>
              <span>Rata-rata: <strong class="text-primary">${UI.formatRp(last30.avg)}</strong>/hari</span>
              <span>Terbaik: <strong class="text-warning">${UI.formatRp(last30.max)}</strong></span>
            </div>
            <div id="dbLineChart" class="db-line-chart-wrap"></div>
          </div>

          <div class="card db-cal-card">
            <div class="db-cal-header">
              <div class="db-cal-nav">
                <button class="db-cal-nav-btn" onclick="Pages.dashboard.navigateCalendar(-1)" title="Bulan sebelumnya">&#x25C0;</button>
                <div class="db-cal-title-wrap">
                  <span class="card-title" id="dbCalTitle">&#x1F5D3;&#xFE0F; ${MONTHS[this._calMonth]} ${this._calYear}</span>
                  <button class="db-cal-today-btn" id="dbCalTodayBtn" onclick="Pages.dashboard.goCalendarToday()" style="display:${this._calYear===new Date().getFullYear()&&this._calMonth===new Date().getMonth()?'none':'inline-flex'}">Hari Ini</button>
                </div>
                <button class="db-cal-nav-btn" onclick="Pages.dashboard.navigateCalendar(1)" title="Bulan berikutnya">&#x25B6;</button>
              </div>
              <select class="db-cal-year-sel" id="dbCalYear" onchange="Pages.dashboard.setCalYear(this.value)">
                ${Array.from({length:8},(_,i)=>new Date().getFullYear()-3+i).map(yr=>`<option value="${yr}" ${yr===this._calYear?'selected':''}>${yr}</option>`).join('')}
              </select>
            </div>
            <div class="db-cal-day-headers">
              ${['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=>`<div class="db-cal-dh">${d}</div>`).join('')}
            </div>
            <div class="db-cal-grid" id="dbHeatmap"></div>
            <div class="db-cal-holiday-list" id="dbHolidayList"></div>
          </div>

          <div class="card">
            <div class="card-title mb-12">&#x1F4C8; Statistik Operasional</div>
            <div id="dbStatRows"></div>
          </div>

          <div class="section-header">
            <div class="section-title">&#x1F4CB; Transaksi Terbaru</div>
            <button class="btn btn-outline btn-sm" onclick="UI.navigateTo('riwayat')">Lihat Semua</button>
          </div>
          <div class="card">${renderRecentTransaksi()}</div>
        </div>

        <div class="db-right-panel">
          <div class="card db-rp-card">
            <div class="db-rp-label">&#x1F4C6; PERBANDINGAN MINGGU</div>
            <div class="db-rp-week-row">
              <div class="db-rp-week-item">
                <div class="db-rp-week-label">Minggu Ini</div>
                <div class="db-rp-week-val text-success">${UI.formatRp(week.thisWeek)}</div>
                <div class="db-rp-week-days">${week.thisWDays} hari kerja</div>
              </div>
              <div class="db-rp-week-badge ${week.delta>=0?'up':'down'}">${week.delta>=0?'&#x25B2;':'&#x25BC;'} ${Math.abs(week.deltaPct)}%</div>
              <div class="db-rp-week-item" style="text-align:right">
                <div class="db-rp-week-label">Minggu Lalu</div>
                <div class="db-rp-week-val text-muted">${UI.formatRp(week.lastWeek)}</div>
                <div class="db-rp-week-days">${week.lastWDays} hari kerja</div>
              </div>
            </div>
          </div>

          <div class="card db-rp-card">
            <div class="db-rp-label">&#x1F3AF; TARGET HARIAN HARI INI</div>
            <div class="db-rp-target-body">
              <div class="db-rp-ring-wrap">
                <svg viewBox="0 0 80 80" class="db-rp-ring">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="7"/>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="${ringColor}" stroke-width="7" stroke-linecap="round" stroke-dasharray="201" stroke-dashoffset="${ringOffset}" transform="rotate(-90 40 40)" style="transition:stroke-dashoffset 1s ease"/>
                </svg>
                <div class="db-rp-ring-pct">${ringPct}%</div>
              </div>
              <div class="db-rp-target-nums">
                <div class="db-rp-target-label">Pendapatan Hari Ini</div>
                <div class="db-rp-target-amt" style="color:${s.todayIncome>=target?'var(--success)':'var(--text-primary)'}">${UI.formatRp(s.todayIncome||0)}</div>
                <div class="db-rp-target-goal">Target: ${UI.formatRp(target)}</div>
                <div class="db-rp-target-status ${s.todayIncome>=target?'text-success':'text-warning'}">
                  ${s.todayIncome>=target?'&#x2705; Target Tercapai!':'&#x26A1; Kurang '+UI.formatRp(target-(s.todayIncome||0))}
                </div>
              </div>
            </div>
          </div>

          <div class="card db-rp-card db-rp-distrib-card">
            <div class="db-rp-label">&#x1F4CA; DISTRIBUSI PENGHASILAN</div>
            <div id="pieChart"></div>
          </div>
        </div>
      </div>
    `;

    UI.renderPieChart('pieChart', [
      { label: 'Trip', value: s.tripIncome, color: 'var(--primary)' },
      { label: 'Insentif', value: s.insentifIncome, color: 'var(--purple)' },
    ]);
    this._renderLineChart('dbLineChart', last30.data);
    this._renderHeatmap('dbHeatmap', heatmap, target, this._calYear, this._calMonth);

    const statRowsEl = document.getElementById('dbStatRows');
    if (statRowsEl) {
      const rows = [
        { label: 'Margin Bersih', val: s.marginBersih.toFixed(2)+'%', c: s.marginBersih>=30?'success':'warning' },
        { label: 'Rata-rata/Hari', val: UI.formatRp(s.rataRataPendapatan), c: 'primary' },
        { label: 'Hari Kerja', val: s.hariKerja+' hari', c: 'success' },
        { label: 'Total Alokasi Servis', val: UI.formatRp(s.alokasiServis), c: 'warning' },
        { label: 'Total Pengeluaran', val: UI.formatRp(s.totalPengeluaran), c: 'danger' },
        { label: 'Rasio Utang/Bersih', val: rasioDisplay+'×', c: parseFloat(rasio)>1?'danger':'success' },
      ];
      statRowsEl.innerHTML = rows.map(r=>`<div class="db-stat-row-item"><span class="label">${r.label}</span><span class="val text-${r.c}">${r.val}</span></div>`).join('');
    }
  },

  _getLast30() {
    const cf = DB.getCashflow();
    const now = new Date();
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const val = cf.filter(c => c.tanggal === dStr && c.kategori === 'PENGHASILAN').reduce((s,c) => s+(c.nominal||0), 0);
      data.push({ date: dStr, label: d.getDate()+'', value: val, isToday: i===0 });
    }
    const nonZero = data.filter(d => d.value > 0);
    return {
      data,
      total: data.reduce((s,d) => s+d.value, 0),
      max: Math.max(...data.map(d => d.value), 0),
      avg: nonZero.length ? Math.round(data.reduce((s,d) => s+d.value,0)/nonZero.length) : 0,
    };
  },

  _getWeekComparison() {
    const cf = DB.getCashflow();
    const now = new Date();
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const thisMonStart = new Date(now); thisMonStart.setDate(now.getDate() - dow); thisMonStart.setHours(0,0,0,0);
    const lastMonStart = new Date(thisMonStart); lastMonStart.setDate(thisMonStart.getDate() - 7);
    const lastSunEnd = new Date(thisMonStart); lastSunEnd.setDate(thisMonStart.getDate() - 1); lastSunEnd.setHours(23,59,59,999);

    const income = cf.filter(c => c.kategori === 'PENGHASILAN');
    const thisW = income.filter(c => { const d = new Date(c.tanggal+'T00:00:00'); return d >= thisMonStart && d <= now; });
    const lastW = income.filter(c => { const d = new Date(c.tanggal+'T00:00:00'); return d >= lastMonStart && d <= lastSunEnd; });
    const thisTotal = thisW.reduce((s,c) => s+(c.nominal||0), 0);
    const lastTotal = lastW.reduce((s,c) => s+(c.nominal||0), 0);
    const delta = thisTotal - lastTotal;
    const deltaPct = lastTotal > 0 ? Math.round((delta / lastTotal) * 100) : (thisTotal > 0 ? 100 : 0);
    return {
      thisWeek: thisTotal, lastWeek: lastTotal,
      delta, deltaPct,
      thisWDays: new Set(thisW.map(c=>c.tanggal)).size,
      lastWDays: new Set(lastW.map(c=>c.tanggal)).size,
    };
  },

  _getHoliday(dateStr) {
    // Indonesian national + religious holidays 2025-2027
    const H = {
      // 2025
      '2025-01-01': 'Tahun Baru Masehi',
      '2025-01-27': 'Isra Miraj',
      '2025-01-29': 'Tahun Baru Imlek',
      '2025-03-29': 'Hari Raya Nyepi',
      '2025-03-31': 'Idul Fitri 1 Syawal',
      '2025-04-01': 'Idul Fitri 2 Syawal',
      '2025-04-18': 'Wafat Yesus Kristus',
      '2025-04-20': 'Paskah',
      '2025-05-01': 'Hari Buruh Internasional',
      '2025-05-12': 'Kenaikan Isa Almasih',
      '2025-05-13': 'Cuti Bersama Waisak',
      '2025-05-29': 'Hari Raya Waisak',
      '2025-06-01': 'Hari Lahir Pancasila',
      '2025-06-06': 'Idul Adha 1446 H',
      '2025-06-27': 'Tahun Baru Islam 1447 H',
      '2025-08-17': 'HUT Kemerdekaan RI ke-80',
      '2025-09-05': 'Maulid Nabi Muhammad SAW',
      '2025-12-25': 'Hari Raya Natal',
      '2025-12-26': 'Cuti Bersama Natal',
      // 2026
      '2026-01-01': 'Tahun Baru Masehi',
      '2026-01-16': 'Isra Miraj 1447 H',
      '2026-02-17': 'Tahun Baru Imlek 2577',
      '2026-03-20': 'Idul Fitri 1 Syawal 1447 H',
      '2026-03-21': 'Idul Fitri 2 Syawal 1447 H',
      '2026-03-22': 'Cuti Bersama Idul Fitri',
      '2026-03-23': 'Cuti Bersama Idul Fitri',
      '2026-04-03': 'Wafat Yesus Kristus',
      '2026-04-05': 'Hari Raya Nyepi',
      '2026-05-01': 'Hari Buruh Internasional',
      '2026-05-14': 'Kenaikan Isa Almasih',
      '2026-05-25': 'Idul Adha 1447 H',
      '2026-06-01': 'Hari Lahir Pancasila',
      '2026-06-04': 'Hari Raya Waisak',
      '2026-06-16': 'Tahun Baru Islam 1448 H',
      '2026-08-17': 'HUT Kemerdekaan RI ke-81',
      '2026-08-26': 'Maulid Nabi Muhammad SAW',
      '2026-12-25': 'Hari Raya Natal',
      // 2027
      '2027-01-01': 'Tahun Baru Masehi',
      '2027-03-10': 'Idul Fitri 1448 H',
      '2027-05-01': 'Hari Buruh Internasional',
      '2027-06-01': 'Hari Lahir Pancasila',
      '2027-08-17': 'HUT Kemerdekaan RI ke-82',
      '2027-12-25': 'Hari Raya Natal',
    };
    return H[dateStr] || null;
  },

  _getMonthHeatmap(y, m) {
    const cf = DB.getCashflow();
    const now = new Date();
    if (y === undefined) { y = now.getFullYear(); m = now.getMonth(); }
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const map = {};
    cf.filter(c => c.tanggal && c.tanggal.startsWith(`${y}-${String(m+1).padStart(2,'0')}`))
      .forEach(c => {
        const d = parseInt(c.tanggal.split('-')[2]);
        if (c.kategori === 'PENGHASILAN') map[d] = (map[d]||0) + (c.nominal||0);
      });
    const result = [];
    const firstDay = new Date(y, m, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const holiday = this._getHoliday(dStr);
      const isToday = y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
      result.push({ day: d, value: map[d]||0, isToday, holiday });
    }
    return result;
  },

  _renderLineChart(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const max = Math.max(...data.map(d => d.value), 1);
    const W = 700, H = 260, padL = 50, padR = 12, padT = 14, padB = 28;
    const cW = W - padL - padR, cH = H - padT - padB;
    const pts = data.map((d, i) => ({
      x: padL + (i / (data.length - 1)) * cW,
      y: padT + cH - (d.value / max) * cH,
      ...d
    }));

    let path = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i-1].x + pts[i].x) / 2;
      path += ` C${cx.toFixed(1)},${pts[i-1].y.toFixed(1)} ${cx.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    const fillPath = path + ` L${pts[pts.length-1].x},${padT+cH} L${pts[0].x},${padT+cH} Z`;

    const gridLines = [0.25, 0.5, 0.75, 1.0].map(pct => {
      const gy = padT + cH - pct * cH;
      const gv = Math.round(max * pct);
      const gLabel = gv >= 1000000 ? (gv/1000000).toFixed(1)+'jt' : gv >= 1000 ? (gv/1000).toFixed(0)+'k' : gv;
      return `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W-padR}" y2="${gy.toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="3,4"/>
              <text x="${padL-6}" y="${(gy+4).toFixed(1)}" text-anchor="end" font-size="9" fill="rgba(136,146,176,0.8)" font-family="Inter,sans-serif">${gLabel}</text>`;
    }).join('');

    const labels = data.map((d,i) => (i % 5 === 0 || d.isToday) ?
      `<text x="${pts[i].x.toFixed(1)}" y="${H-2}" text-anchor="middle" font-size="9" fill="${d.isToday?'var(--primary)':'rgba(136,146,176,0.7)'}" font-family="Inter,sans-serif" font-weight="${d.isToday?'700':'400'}">${d.label}</text>` : '').join('');

    const todayPt = pts.find(p => p.isToday);
    const todayDot = todayPt ? `
      <circle cx="${todayPt.x.toFixed(1)}" cy="${todayPt.y.toFixed(1)}" r="8" fill="var(--success)" fill-opacity="0.18"/>
      <circle cx="${todayPt.x.toFixed(1)}" cy="${todayPt.y.toFixed(1)}" r="4.5" fill="var(--success)" stroke="var(--bg-card)" stroke-width="2"/>` : '';

    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="280" preserveAspectRatio="none" style="display:block;overflow:visible">
        <defs>
          <linearGradient id="lineGradV2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.5"/>
            <stop offset="55%" stop-color="var(--primary)" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.01"/>
          </linearGradient>
          <filter id="lineGlowV2" x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        ${gridLines}
        <path d="${fillPath}" fill="url(#lineGradV2)"/>
        <path d="${path}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#lineGlowV2)"/>
        ${todayDot}
        ${labels}
      </svg>`;
  },

  _renderHeatmap(containerId, cells, target, cy, cm) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const now = new Date();
    const y = cy !== undefined ? cy : now.getFullYear();
    const m = cm !== undefined ? cm : now.getMonth();

    // Build cells
    el.innerHTML = cells.map((c, i) => {
      if (!c) return `<div class="db-cal-cell empty"></div>`;
      const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(c.day).padStart(2,'0')}`;
      const cellDate = new Date(dStr+'T00:00:00');
      const isFuture = cellDate > now && !c.isToday;
      const dayOfWeek = (i % 7); // 0=Mon...6=Sun
      const isSun = dayOfWeek === 6;
      const pct = target > 0 ? Math.min(1, c.value / target) : 0;
      const hasIncome = c.value > 0;
      const incomeColor = pct>=1 ? 'var(--success)' : pct>=0.5 ? 'var(--warning)' : 'var(--primary)';

      let cellClass = 'db-cal-cell';
      if (c.isToday) cellClass += ' cal-today';
      if (c.holiday) cellClass += ' cal-holiday';
      if (isSun && !c.isToday) cellClass += ' cal-sun';
      if (!isFuture) cellClass += ' cal-clickable';
      if (isFuture) cellClass += ' cal-future';

      return `<div class="${cellClass}"
        ${!isFuture ? `onclick="Pages.dashboard._showDayDetail('${dStr}')"` : ''}
        style="${hasIncome ? `background:linear-gradient(135deg,${incomeColor}22,${incomeColor}0a)` : ''}; animation-delay:${i*8}ms">
        <span class="db-cal-num">${c.day}</span>
        ${c.holiday ? '<span class="db-cal-hday-dot"></span>' : ''}
        ${hasIncome ? `<span class="db-cal-income">${UI.formatRp(c.value).replace('Rp','').replace('.000','k')}</span>` : ''}
      </div>`;
    }).join('');

    // Holiday list below
    listEl.innerHTML = `
      <div class="db-cal-hday-header">
        <div class="db-cal-hday-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:15px;height:15px;vertical-align:middle;margin-right:8px;color:var(--warning)"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Hari Libur ${holidays.length ? `(${holidays.length})` : 'Bulan Ini'}</div>
        <a class="db-gcal-link" href="${gcalMonthUrl}" target="_blank" rel="noopener">
          <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" width="14" height="14" style="vertical-align:middle;margin-right:4px"/>
          Google Calendar
        </a>
      </div>
      ${holidays.length ? `
      <div class="db-cal-hday-items">
        ${holidays.map(c => {
          const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(c.day).padStart(2,'0')}`;
          return `<div class="db-cal-hday-item" onclick="Pages.dashboard._showDayDetail('${dStr}')">
            <span class="db-cal-hday-num">${c.day}</span>
            <span class="db-cal-hday-name">${c.holiday}</span>
            <span class="db-cal-hday-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:middle;color:var(--text-muted)"><polyline points="9 18 15 12 9 6"/></svg></span>
          </div>`;
        }).join('')}
      </div>` : `<div class="db-cal-hday-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--success);vertical-align:middle;margin-right:6px"><polyline points="20 6 9 17 4 12"/></svg>Tidak ada hari libur bulan ini</div>`}
    `;
  },

  _showDayDetail(dateStr) {
    const cf   = DB.getCashflow().filter(c => c.tanggal === dateStr);
    const trxs = DB.getTransaksi().filter(t => t.tanggal === dateStr);
    const peng = DB.getPengeluaran ? DB.getPengeluaran().filter(p => p.tanggal === dateStr) : [];
    const serv = DB.getServis().filter(s => s.tanggal === dateStr);
    const holiday = this._getHoliday(dateStr);

    const income = cf.filter(c=>c.kategori==='PENGHASILAN').reduce((s,c)=>s+(c.nominal||0),0);
    const pengeluaran = cf.filter(c=>c.kategori==='PENGELUARAN').reduce((s,c)=>s+(c.nominal||0),0);
    const alokasi = cf.filter(c=>c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+(c.nominal||0),0);
    const net = income - pengeluaran - alokasi;

    const d = new Date(dateStr+'T00:00:00');
    const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const dateFormatted = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    // Build timeline events
    const events = [];
    if (holiday) {
      events.push({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--warning)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        label: holiday,
        detail: 'Hari Libur Nasional / Hari Besar',
        color: 'warning',
        time: ''
      });
    }
    trxs.forEach(t => {
      const isWork = t.status_operasi === 'WORKING';
      events.push({
        icon: isWork
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--success)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--text-muted)"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
        label: isWork ? 'Hari Kerja' : 'Hari Libur',
        detail: isWork ? `${t.jumlah_orderan||0} order · ${t.jam_mulai||'--'}–${t.jam_selesai||'--'}` : 'Tidak ada aktivitas',
        color: isWork ? 'success' : 'muted',
        time: t.jam_mulai||''
      });
    });
    cf.filter(c=>c.source_type==='TRIP').forEach(c => {
      events.push({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--success)"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
        label: 'Penghasilan Trip',
        detail: '+' + UI.formatRp(c.nominal),
        color: 'success',
        time: ''
      });
    });
    cf.filter(c=>c.source_type==='INCENTIVE').forEach(c => {
      events.push({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--primary)"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
        label: 'Insentif Diterima',
        detail: '+' + UI.formatRp(c.nominal),
        color: 'primary',
        time: ''
      });
    });
    cf.filter(c=>c.source_type==='SERVIS_ALLOC').forEach(c => {
      events.push({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--warning)"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
        label: 'Alokasi Dana Servis',
        detail: UI.formatRp(c.nominal) + ' dialokasikan',
        color: 'warning',
        time: ''
      });
    });
    peng.forEach(p => {
      events.push({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--danger)"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/><path d="M17 9H7"/></svg>`,
        label: p.kategori || 'Pengeluaran',
        detail: '-' + UI.formatRp(p.nominal) + (p.keterangan ? ' · ' + p.keterangan : ''),
        color: 'danger',
        time: ''
      });
    });
    serv.forEach(s => {
      events.push({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;color:var(--warning)"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
        label: 'Servis: ' + s.nama_servis,
        detail: '-' + UI.formatRp(s.biaya) + (s.keterangan ? ' · ' + s.keterangan : ''),
        color: 'warning',
        time: ''
      });
    });

    const noData = events.length === 0;
    const gcalDayUrl = `https://calendar.google.com/calendar/r/day/${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
    const gcalNewUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${dateStr.replace(/-/g,'')}/${dateStr.replace(/-/g,'')}&text=BudgetKu+${dateStr}&details=Pendapatan:+${UI.formatRp(income)}`;

    UI.openModal(`${dateFormatted}`,
      `${holiday ? `<div class="day-holiday-banner">
        <span style="font-size:1.3rem;display:inline-flex;align-items:center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--warning)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>
        <div><div style="font-weight:700;font-size:0.88rem;color:#f5c842">${holiday}</div><div style="font-size:0.7rem;color:var(--text-muted)">Hari Libur Nasional Indonesia</div></div>
      </div>` : ''}
      <div class="day-detail-summary">
        <div class="day-sum-item"><span class="text-muted">PENGHASILAN</span><span class="text-success fw-700">${income>0?'+':''} ${UI.formatRp(income)}</span></div>
        <div class="day-sum-item"><span class="text-muted">PENGELUARAN</span><span class="text-danger fw-700">${pengeluaran>0?'-':''} ${UI.formatRp(pengeluaran)}</span></div>
        <div class="day-sum-item"><span class="text-muted">ALOKASI SERVIS</span><span class="text-warning fw-700">${UI.formatRp(alokasi)}</span></div>
        <div class="day-sum-item"><span class="text-muted">NET</span><span class="fw-700 ${net>=0?'text-success':'text-danger'}">${net>=0?'+':''} ${UI.formatRp(net)}</span></div>
      </div>
      <div class="day-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;color:var(--primary)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>Kronologi Hari Ini</div>
      ${noData
        ? `<div class="day-empty">Tidak ada aktivitas tercatat hari ini</div>`
        : `<div class="day-timeline">
          ${events.map(ev=>`
            <div class="day-tl-item">
              <div class="day-tl-dot bg-${ev.color}"></div>
              <div class="day-tl-content">
                <div class="day-tl-icon">${ev.icon}</div>
                <div>
                  <div class="fw-600" style="font-size:0.85rem">${ev.label}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted)">${ev.detail}</div>
                </div>
              </div>
            </div>`).join('')}
          </div>`}
      <!-- Google Calendar row -->
      <div class="day-gcal-row">
        <a class="day-gcal-btn" href="${gcalDayUrl}" target="_blank" rel="noopener">
          <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" width="16" height="16"/>
          Lihat di Google Calendar
        </a>
        <a class="day-gcal-btn secondary" href="${gcalNewUrl}" target="_blank" rel="noopener">
          + Tambah Event ke Google Calendar
        </a>
      </div>`,
      `<button class="btn btn-outline" onclick="UI.closeModal()">Tutup</button>
       <button class="btn btn-primary" onclick="UI.closeModal();UI.navigateTo('transaksi')">+ Input Transaksi</button>`
    );
  },

  _editTransaksi(id) {
    const t = DB.getTransaksiById(id);
    if (!t) return;
    UI.openModal('Edit Transaksi', `
      <form id="formEditTrx">
        <div class="form-group"><label class="form-label">Tanggal</label><input type="date" id="etTanggal" class="form-control" value="${t.tanggal}" required></div>
        <div class="form-group"><label class="form-label">Jumlah Orderan</label><input type="number" id="etOrderan" class="form-control" value="${t.jumlah_orderan}" required></div>
        <div class="form-group"><label class="form-label">Penghasilan Kotor (Rp)</label><input type="number" id="etKotor" class="form-control" value="${t.penghasilan_kotor}" required></div>
        <div class="form-group"><label class="form-label">Insentif (Rp)</label><input type="number" id="etInsentif" class="form-control" value="${t.insentif}"></div>
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="etKet" class="form-control" value="${t.keterangan||''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.dashboard._saveEditTransaksi('${id}')">Simpan</button>`);
  },

  _saveEditTransaksi(id) {
    const tanggal = document.getElementById('etTanggal').value;
    const jumlah_orderan = parseInt(document.getElementById('etOrderan').value)||0;
    const penghasilan_kotor = parseFloat(document.getElementById('etKotor').value)||0;
    const insentif = parseFloat(document.getElementById('etInsentif').value)||0;
    const keterangan = document.getElementById('etKet').value;
    const orig = DB.getTransaksiById(id);
    DB.deleteTransaksi(id);
    Engine.prosesTransaksi({ tanggal, jam_mulai: orig?.jam_mulai||'', jam_selesai: orig?.jam_selesai||'', jumlah_orderan, penghasilan_kotor, insentif, keterangan, status_override: jumlah_orderan > 0 ? 'WORKING' : 'OFF' });
    UI.closeModal(); UI.toast('Transaksi berhasil diubah', 'success'); Pages.dashboard.render();
  },

  _deleteTransaksi(id) {
    UI.confirm('Hapus transaksi ini?', () => { DB.deleteTransaksi(id); UI.toast('Transaksi dihapus','info'); Pages.dashboard.render(); });
  }
};

function statCard(type, icon, label, value, extra='', navTo='', delay=0) {
  const animStyle = `animation: fadeInUp 0.4s ease both; animation-delay: ${delay*60}ms`;
  return `<div class="stat-card ${type}${navTo?' card-link':''}"
    ${navTo?`onclick="UI.navigateTo('${navTo}')" role="button" tabindex="0"`:''}  
    style="${animStyle}${navTo?';cursor:pointer':''}">
    ${navTo?`<div class="stat-nav-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>`:''}
    <div class="stat-icon">${icon}</div>
    <div class="stat-label">${label}</div>
    <div class="stat-value ${type}">${UI.formatRp(value)}</div>
    ${extra}
  </div>`;
}
function statRow(label, value, colorClass='') {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:0.82rem;color:var(--text-secondary)">${label}</span>
    <span style="font-size:0.88rem;font-weight:700" class="text-${colorClass}">${value}</span>
  </div>`;
}
function renderRecentTransaksi() {
  const list = DB.getTransaksi().slice().sort((a,b) => {
    const diff = new Date(b.tanggal)-new Date(a.tanggal);
    return diff!==0?diff:new Date(b.created_at||0)-new Date(a.created_at||0);
  }).slice(0,8);
  if (!list.length) return UI.emptyState('­ƒô¡','Belum ada transaksi. Mulai catat hari ini!');
  return `<div class="table-wrap"><table>
    <thead><tr>
      <th>Tanggal</th><th>Status</th><th>Orderan</th>
      <th>Penghasilan</th><th>Insentif</th><th>Alokasi Servis</th>
      <th style="text-align:right">Aksi</th>
    </tr></thead>
    <tbody>
      ${list.map(t => {
        const cf = DB.getCashflow().filter(c => c.transaksi_id===t.id);
        const alok = cf.filter(c=>c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+c.nominal,0);
        return `<tr>
          <td>${UI.formatDate(t.tanggal)}</td>
          <td>${UI.badgeStatus(t.status_operasi)}</td>
          <td>${t.jumlah_orderan||0}</td>
          <td class="text-success fw-600">${UI.formatRp(t.penghasilan_trip||t.penghasilan_kotor)}</td>
          <td class="text-primary fw-600">${t.insentif>0?UI.formatRp(t.insentif):'<span class="text-muted">-</span>'}</td>
          <td class="text-warning">${alok>0?UI.formatRp(alok):'<span class="text-muted">-</span>'}</td>
          <td style="text-align:right">
            <button class="btn-icon edit" onclick="Pages.dashboard._editTransaksi('${t.id}')">Ô£Å´©Å</button>
            <button class="btn-icon danger" onclick="Pages.dashboard._deleteTransaksi('${t.id}')">­ƒùæ</button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}
