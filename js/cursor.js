/* ============================================================
   BudgetKu — Ripple + Swipe Engine (no cursor trail)
   ============================================================ */

(function initInteractions() {

  /* ===== 1. BUTTON RIPPLE WAVE ===== */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn, .nav-item, .stat-card, .db-quick-btn, .db-cal-cell.cal-clickable, .db-cal-hday-item');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
    `;
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

  /* ===== 2. SWIPEABLE / DRAGGABLE SCROLL ===== */
  function makeSwipeable(el) {
    if (!el) return;
    let isDown = false, startX, scrollLeft;

    el.addEventListener('mousedown', e => {
      isDown = true;
      el.classList.add('is-dragging');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });
    el.addEventListener('mouseleave', () => { isDown = false; el.classList.remove('is-dragging'); });
    el.addEventListener('mouseup',    () => { isDown = false; el.classList.remove('is-dragging'); });
    el.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    });

    // Touch support
    let touchStartX = 0, touchScrollLeft = 0;
    el.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = el.scrollLeft;
    }, { passive: true });
    el.addEventListener('touchmove', e => {
      const dx = e.touches[0].pageX - touchStartX;
      el.scrollLeft = touchScrollLeft - dx;
    }, { passive: true });
  }

  // Apply swipeable to stat cards strip
  const statStrip = document.getElementById('dbStatStrip');
  if (statStrip) makeSwipeable(statStrip);

  // Re-apply on dashboard render
  const origRender = window.Pages?.dashboard?.render;
  if (origRender) {
    window.Pages.dashboard.render = function() {
      origRender.call(this);
      setTimeout(() => {
        makeSwipeable(document.getElementById('dbStatStrip'));
      }, 50);
    };
  }

  /* ===== 3. PAGE TRANSITION ANIMATION ===== */
  const origNav = window.UI?.navigateTo;
  if (origNav) {
    const _navigateTo = origNav;
    UI.navigateTo = function(page) {
      const main = document.getElementById('main');
      if (main) {
        main.style.opacity = '0';
        main.style.transform = 'translateY(6px)';
        setTimeout(() => {
          _navigateTo.call(UI, page);
          main.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
          main.style.opacity = '1';
          main.style.transform = 'translateY(0)';
          setTimeout(() => { main.style.transition = ''; }, 280);
        }, 110);
      } else {
        _navigateTo.call(UI, page);
      }
    };
  }

})();
