/* ====================================
   FISKO LANDING PAGE — Main JS
   ==================================== */

// --- Scroll Reveal (IntersectionObserver) ---
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));
}

// --- Navbar scroll effect ---
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('open');
  });

  // Close mobile menu on link click
  menu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('open');
    });
  });
}

// --- Counter Animation ---
function initCounters() {
  const counters = document.querySelectorAll('.hero-stat-number');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);

    el.textContent = prefix + formatNumber(current) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// --- Chat Demo ---
function initChatDemo() {
  const prompts = document.querySelectorAll('.chat-prompt-btn');
  const messagesContainer = document.getElementById('chatMessages');

  prompts.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.prompt;
      // Disable all prompts
      prompts.forEach(b => b.disabled = true);

      // Add user message
      const userText = btn.textContent.trim();
      addMessage(messagesContainer, 'user', userText);

      // Show typing indicator
      setTimeout(() => {
        const typingEl = addTypingIndicator(messagesContainer);

        // Remove typing, show response
        setTimeout(() => {
          typingEl.remove();
          if (type === 'yearly') {
            addChartMessage(messagesContainer, 'yearly');
          } else if (type === 'clothing') {
            addChartMessage(messagesContainer, 'clothing');
          }
        }, 1800);
      }, 600);
    });
  });
}

function addMessage(container, role, text) {
  const msg = document.createElement('div');
  msg.className = `chat-message ${role}`;
  msg.innerHTML = `<div class="chat-bubble">${text}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addTypingIndicator(container) {
  const msg = document.createElement('div');
  msg.className = 'chat-message assistant';
  msg.innerHTML = `
    <div class="chat-bubble">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return msg;
}

function addChartMessage(container, type) {
  const msg = document.createElement('div');
  msg.className = 'chat-message assistant';

  let headerText, chartData;

  if (type === 'yearly') {
    headerText = 'Oto zestawienie Twoich wydatków za zeszły rok w skali miesięcznej:';
    chartData = {
      labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
      values: [980, 1120, 870, 1340, 950, 1100, 1250, 890, 1050, 1180, 1420, 1560],
      color: '#0CA8B9',
      label: 'zł'
    };
  } else {
    headerText = 'W zeszłym miesiącu wydałeś na ubrania łącznie 347,80 zł. Oto rozkład:';
    chartData = {
      labels: ['Tydzień 1', 'Tydzień 2', 'Tydzień 3', 'Tydzień 4'],
      values: [89, 0, 159, 99.80],
      color: '#34b88a',
      label: 'zł'
    };
  }

  msg.innerHTML = `
    <div class="chat-bubble">
      ${headerText}
      <div class="chat-bubble-chart">
        <canvas id="chart-${type}" width="400" height="180"></canvas>
      </div>
    </div>
  `;

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;

  // Draw chart on next frame
  requestAnimationFrame(() => {
    drawBarChart(`chart-${type}`, chartData);
  });
}

function drawBarChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Set canvas pixel dimensions
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const barCount = data.values.length;
  const barGap = Math.max(4, chartW * 0.03);
  const barWidth = (chartW - barGap * (barCount + 1)) / barCount;
  const maxVal = Math.max(...data.values) * 1.15;

  // Animate bars
  let progress = 0;
  const animDuration = 800;
  const startTime = performance.now();

  function draw(now) {
    const elapsed = now - startTime;
    progress = Math.min(elapsed / animDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    ctx.clearRect(0, 0, w, h);

    // Draw bars
    data.values.forEach((val, i) => {
      const barH = (val / maxVal) * chartH * eased;
      const x = padding.left + barGap + i * (barWidth + barGap);
      const y = padding.top + chartH - barH;

      // Gradient bar
      const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
      grad.addColorStop(0, data.color);
      grad.addColorStop(1, data.color + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      roundRect(ctx, x, y, barWidth, barH, 4);
      ctx.fill();

      // Value on top
      if (progress > 0.8) {
        ctx.fillStyle = '#c8d4e0';
        ctx.font = `${Math.max(8, barWidth * 0.28)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        const valText = val >= 100 ? Math.round(val).toString() : val.toFixed(0);
        ctx.fillText(valText, x + barWidth / 2, y - 4);
      }

      // Label below
      ctx.fillStyle = '#667788';
      ctx.font = `${Math.max(7, barWidth * 0.26)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(data.labels[i], x + barWidth / 2, padding.top + chartH + 16);
    });

    if (progress < 1) {
      requestAnimationFrame(draw);
    }
  }

  requestAnimationFrame(draw);
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// --- Smooth scroll for anchor links ---
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const navHeight = document.getElementById('navbar').offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// --- Parallax on hero ---
function initParallax() {
  const hero = document.getElementById('hero');
  const phone = hero?.querySelector('.device');
  const glow1 = hero?.querySelector('.hero-glow-1');
  const glow2 = hero?.querySelector('.hero-glow-2');

  if (!hero) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroH = hero.offsetHeight;

    if (scrollY < heroH) {
      const ratio = scrollY / heroH;
      if (phone) phone.style.transform = `translateY(${ratio * 30}px)`;
      if (glow1) glow1.style.transform = `translate(${ratio * -20}px, ${ratio * 20}px)`;
      if (glow2) glow2.style.transform = `translate(${ratio * 15}px, ${ratio * -15}px)`;
    }
  });
}

// --- Planner items animation ---
function initPlannerAnimation() {
  const items = document.querySelectorAll('.screen-planner-item');
  const featureCards = document.querySelectorAll('.planner-feature-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger animation for planner items
        items.forEach((item, i) => {
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
          }, i * 120);
        });
        // Stagger for feature cards
        featureCards.forEach((card, i) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, i * 150 + 300);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  // Set initial state
  items.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
    item.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  });

  featureCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  });

  const plannerSection = document.getElementById('planner-demo');
  if (plannerSection) observer.observe(plannerSection);
}

// --- Planner interactive checkboxes ---
function initPlannerInteraction() {
  const items = document.querySelectorAll('[data-planner-interactive]');
  const countEl = document.getElementById('plannerCount');
  let totalItems = items.length;
  let checkedCount = 0;

  items.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
      
      // Count unchecked
      checkedCount = document.querySelectorAll('.screen-planner-item.checked').length;
      const remaining = totalItems - checkedCount;
      
      if (countEl) {
        countEl.textContent = remaining > 0
          ? `${remaining} produkt${remaining === 1 ? '' : remaining < 5 ? 'y' : 'ów'} do kupienia`
          : '✅ Wszystko kupione!';
      }

      // Hide hint after first click
      const hint = document.querySelector('.screen-planner-hint');
      if (hint) hint.style.display = 'none';
    });
  });
}

// --- Init all ---
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initNavbar();
  initCounters();
  initChatDemo();
  initSmoothScroll();
  initParallax();
  initPlannerAnimation();
  initPlannerInteraction();
});
