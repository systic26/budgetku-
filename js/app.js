/**
 * APP — Main application bootstrap & event bindings
 */

/* ===== CLEAR LEGACY AUTH DATA (one-time reset) ===== */
(function clearLegacyAuth() {
  const migrated = localStorage.getItem('bk_migrated_supabase_auth_v1');
  if (!migrated) {
    ['bk_users', 'bk_current_user'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('bk_migrated_supabase_auth_v1', '1');
  }
}());

/* ===== THEME MANAGEMENT ===== */
function initTheme() {
  const saved = localStorage.getItem('bk_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = saved === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bk_theme', next);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
}

/* ===== AUTH FLOW ===== */
function showApp(user) {
  document.getElementById('auth-wrapper').style.display = 'none';
  document.getElementById('app-wrapper').style.display = 'block';

  // Set nama driver dari metadata Supabase
  const fullName = user.user_metadata?.full_name || user.email || 'Driver';
  const settings = DB.getSettings();
  if (settings.nama_driver === 'Driver') {
    DB.saveSettings({ nama_driver: fullName });
  }

  UI.navigateTo('dashboard');
}

function showLogin() {
  document.getElementById('auth-wrapper').style.display = 'flex';
  document.getElementById('app-wrapper').style.display = 'none';
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
  document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('logUser').value.trim();
    const pass  = document.getElementById('logPass').value;
    btn.disabled = true;
    btn.textContent = 'Masuk...';
    try {
      await DB.loginUser(email, pass);
      // onAuthStateChange akan otomatis panggil showApp()
      document.getElementById('formLogin').reset();
    } catch (err) {
      UI.toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });

  // Register
  document.getElementById('formRegister').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const name  = document.getElementById('regName').value.trim();
    const email = document.getElementById('regUser').value.trim();
    const pass  = document.getElementById('regPass').value;
    btn.disabled = true;
    btn.textContent = 'Mendaftar...';
    try {
      await DB.registerUser(email, pass, name);
      UI.toast('Pendaftaran Berhasil! Silakan login dengan email & password kamu.', 'success');
      document.getElementById('formRegister').reset();
      document.getElementById('showLogin').click();
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Daftar Akun';
    }
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', async () => {
    await DB.logoutUser();
    UI.toast('Logout Berhasil', 'info');
    // onAuthStateChange akan otomatis panggil showLogin()
  });

  // Listen perubahan sesi dari Supabase (login, logout, refresh token)
  const sb = DB.getSupabase();
  if (sb) {
    sb.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        showApp(session.user);
      } else {
        showLogin();
      }
    });
  }
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // ===== PREMIUM CLOCK =====
  let _colonVisible = true;
  function updateTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    _colonVisible = !_colonVisible;

    const hhEl = document.getElementById('sbHH');
    const mmEl = document.getElementById('sbMM');
    const ssEl = document.getElementById('sbSS');
    const colon = document.getElementById('sbColon');
    const dateEl = document.getElementById('sbDate');

    if (hhEl) hhEl.textContent = hh;
    if (mmEl) mmEl.textContent = mm;
    if (ssEl) ssEl.textContent = ss;
    if (colon) colon.style.opacity = _colonVisible ? '1' : '0.3';
    if (dateEl) {
      const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
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

  // Init Auth — onAuthStateChange di bindAuthEvents() otomatis handle initial session
  bindAuthEvents();

  // Init Theme
  initTheme();
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
});
