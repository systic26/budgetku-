/**
 * APP — Main application bootstrap & event bindings
 */

/* ===== CLEAR ALL DEMO DATA (one-time reset) ===== */
(function clearDemoData() {
  // Hapus semua data demo agar user bisa mulai dari awal
  const cleared = localStorage.getItem('bk_cleared_v1');
  if (!cleared) {
    ['bk_transaksi','bk_cashflow','bk_dana_servis','bk_servis',
     'bk_pengeluaran','bk_utang', 'bk_current_user'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('bk_cleared_v1', '1');
  }
}());

/* ===== AUTH FLOW ===== */
function checkAuth() {
  const user = DB.getCurrentUser();
  const authWrapper = document.getElementById('auth-wrapper');
  const appWrapper = document.getElementById('app-wrapper');
  
  if (!user) {
    authWrapper.style.display = 'flex';
    appWrapper.style.display = 'none';
  } else {
    authWrapper.style.display = 'none';
    appWrapper.style.display = 'block';
    
    // Set nama driver default jika belum diset
    const settings = DB.getSettings();
    if (settings.nama_driver === 'Driver') {
        DB.saveSettings({nama_driver: user.fullName});
    }
    
    // Render initial page
    UI.navigateTo('dashboard');
  }
}

function bindAuthEvents() {
  // Toggle forms
  document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('registerFormContainer').style.display = 'block';
  });
  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerFormContainer').style.display = 'none';
    document.getElementById('loginFormContainer').style.display = 'block';
  });

  // Login
  document.getElementById('formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('logUser').value;
    const p = document.getElementById('logPass').value;
    try {
      DB.loginUser(u, p);
      UI.toast('Login Berhasil', 'success');
      document.getElementById('formLogin').reset();
      checkAuth();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  });

  // Register
  document.getElementById('formRegister').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const u = document.getElementById('regUser').value;
    const p = document.getElementById('regPass').value;
    try {
      DB.registerUser(u, p, name);
      UI.toast('Pendaftaran Berhasil! Silakan Login.', 'success');
      document.getElementById('formRegister').reset();
      document.getElementById('showLogin').click();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', () => {
    DB.logoutUser();
    UI.toast('Logout Berhasil', 'info');
    checkAuth();
  });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Set current date and time (realtime)
  function updateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('currentDate').innerHTML = 
      `${dateStr} <br><span style="font-size:1.15rem;font-weight:700;color:var(--primary);margin-top:4px;display:inline-block">${timeStr}</span>`;
  }
  updateTime();
  setInterval(updateTime, 1000);

  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      UI.navigateTo(item.dataset.page);
    });
  });

  // Hamburger menu
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
  });
  document.getElementById('sidebarClose').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  });
  document.getElementById('overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  });

  // Quick add button
  document.getElementById('quickAddBtn').addEventListener('click', () => UI.navigateTo('transaksi'));

  // Modal close
  document.getElementById('modalClose').addEventListener('click', UI.closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('modalBackdrop')) UI.closeModal();
  });

  // Init Auth
  bindAuthEvents();
  checkAuth();
});
