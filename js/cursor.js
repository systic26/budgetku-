/* ============================================================
   BudgetKu — Cursor Trail + Ripple + Swipe Engine
   ============================================================ */

(function initInteractions() {

  /* ===== 1. CUSTOM CURSOR TRAIL ===== */
  const dot   = document.getElementById('cursorDot');
  const trail = document.getElementById('cursorTrail');
  if (!dot || !trail) return;

  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let tx = mx, ty = my;
  let visible = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!visible) {
      dot.style.opacity = '1'; trail.style.opacity = '1';
      visible = true;
    }
    // Dot follows instantly
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });

  // Trail follows with lag
  (function animTrail() {
    tx += (mx - tx) * 0.14;
    ty += (my - ty) * 0.14;
    trail.style.transform = `translate(${tx}px, ${ty}px)`;
    requestAnimationFrame(animTrail);
  })();

  // Hover detection
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('button, a, .card-link, .nav-item, .db-hm-cell.clickable, input, select, [role=button], .btn, .db-quick-btn');
    dot.classList.toggle('cursor-hover', !!el);
    trail.classList.toggle('cursor-hover', !!el);
  });

  // Click burst
  document.addEventListener('mousedown', e => {
    dot.classList.add('cursor-click');
    trail.classList.add('cursor-click');
    spawnBurst(e.clientX, e.clientY, 'click');
  });
  document.addEventListener('mouseup', () => {
    dot.classList.remove('cursor-click');
    trail.classList.remove('cursor-click');
  });

  // Hide on leave
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0'; trail.style.opacity = '0'; visible = false;
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1'; trail.style.opacity = '1'; visible = true;
  });

  function spawnBurst(x, y, type) {
    const b = document.createElement('div');
    b.className = `cursor-burst ${type}`;
    b.style.cssText = `left:${x}px;top:${y}px`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 700);
  }

  /* ===== 2. BUTTON RIPPLE WAVE ===== */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn, .nav-item, .stat-card.card-link, .db-quick-btn, .db-hm-cell.clickable');
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

  /* ===== 3. SWIPEABLE / DRAGGABLE SCROLL ===== */
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
    el.addEventListener('mouseup', () => { isDown = false; el.classList.remove('is-dragging'); });
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
        makeSwipeable(document.getElementById('dbChartStrip'));
      }, 50);
    };
  }

  /* ===== 4. PAGE TRANSITION ANIMATION ===== */
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
          main.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          main.style.opacity = '1';
          main.style.transform = 'translateY(0)';
          setTimeout(() => { main.style.transition = ''; }, 300);
        }, 120);
      } else {
        _navigateTo.call(UI, page);
      }
    };
  }

})();
