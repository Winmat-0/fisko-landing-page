/* ====================================
   POCKET LANDING PAGE - Main JS
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
    const isActive = toggle.classList.toggle('active');
    menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isActive);
    menu.setAttribute('aria-hidden', !isActive);
  });

  // Close mobile menu on link click
  menu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
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
    headerText = 'Oto jak rosły Twoje oszczędności z <strong>POCKET</strong> w ciągu ostatnich 6 miesięcy:';
    chartData = {
      labels: ['Lip 25', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
      values: [2820.00, 3450.80, 3880.00, 4220.50, 4950.00, 5630.40],
      color: '#0CA8B9',
      label: 'zł'
    };
  } else {
    headerText = 'W zeszłym miesiącu wydałeś na ubrania łącznie 348,79 zł. Oto rozkład:';
    chartData = {
      labels: ['Tydz. 1', 'Tydz. 2', 'Tydz. 3', 'Tydz. 4'],
      values: [89.99, 0, 159, 99.80],
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
    if (type === 'yearly') {
      drawLineChart(`chart-${type}`, chartData);
    } else {
      drawBarChart(`chart-${type}`, chartData);
    }
  });
}

// Obiekt do śledzenia aktywnych wykresów w celu przerysowania przy zmianie szerokości ekranu
const activeCharts = {};

function drawBarChart(canvasId, data) {
  activeCharts[canvasId] = data;
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
  
  // Generous padding so text doesn't clip
  const padding = { top: 30, right: 20, bottom: 35, left: 20 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  
  const barCount = data.values.length;
  // Dynamic gap depending on number of bars
  const gapRatio = barCount > 6 ? 0.3 : 0.6; // More space for bars if many
  const totalBarSpace = chartW / barCount;
  const barWidth = Math.min(totalBarSpace * (1 - gapRatio), 40);
  const barGap = totalBarSpace * gapRatio;
  
  // Center the chart horizontally
  const startX = padding.left + (chartW - (barCount * barWidth + (barCount - 1) * barGap)) / 2;

  // Add 15% headroom above max value for text
  const maxVal = Math.max(...data.values) * 1.15;

  let progress = 0;
  const animDuration = 900;
  const startTime = performance.now();

  function draw(now) {
    const elapsed = now - startTime;
    progress = Math.min(elapsed / animDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out

    ctx.clearRect(0, 0, w, h);

    // Baseline grid (bottom line)
    ctx.strokeStyle = '#2a3b4c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    // Draw bars
    data.values.forEach((val, i) => {
      // Minimum bar height so 0 values still show a tiny dot or just nothing
      const targetBarH = val > 0 ? (val / maxVal) * chartH : 0;
      const barH = targetBarH * eased;
      const x = startX + i * (barWidth + barGap);
      const y = h - padding.bottom - barH;

      if (barH > 0) {
        ctx.save();
        
        // Subtle Glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = data.color + '33';
        
        // Main Gradient bar
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, data.color);
        grad.addColorStop(1, data.color + '44'); 
        ctx.fillStyle = grad;
        
        ctx.beginPath();
        roundRect(ctx, x, y, barWidth, barH, Math.min(5, barWidth / 2));
        ctx.fill();

        // Glassy top highlight
        const highlightGrad = ctx.createLinearGradient(x, y, x, y + 6);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        roundRect(ctx, x, y, barWidth, Math.min(6, barH), Math.min(5, barWidth / 2));
        ctx.fill();

        ctx.restore();
      }

      // Value on top
      if (progress > 0.8 && val > 0) {
        ctx.fillStyle = '#ffffff';
        // Dynamic font size based on canvas width to prevent overlap
        const responsiveFontSize = Math.max(9, Math.min(12, w / 40));
        ctx.font = `600 ${responsiveFontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        // Round to whole number to save space
        const valText = `${Math.round(val)} ${data.label}`;
        ctx.fillText(valText, x + barWidth / 2, y - 8);
      }

      // Label below axis
      ctx.fillStyle = '#8899aa';
      // Dynamic font size for labels
      const labelFontSize = Math.max(8, Math.min(11, w / 45));
      ctx.font = `500 ${labelFontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(data.labels[i], x + barWidth / 2, h - padding.bottom + 16);
    });

    if (progress < 1) {
      requestAnimationFrame(draw);
    }
  }

  requestAnimationFrame(draw);
}

function drawLineChart(canvasId, data) {
  activeCharts[canvasId] = data;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  
  const padding = { top: 35, right: 30, bottom: 35, left: 30 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  
  const maxVal = Math.max(...data.values) * 1.2;
  const minVal = 0;

  let progress = 0;
  const animDuration = 1200;
  const startTime = performance.now();

  function draw(now) {
    const elapsed = now - startTime;
    progress = Math.min(elapsed / animDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    ctx.clearRect(0, 0, w, h);

    // Baseline
    ctx.strokeStyle = '#2a3b4c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    const getX = (i) => padding.left + (i / (data.values.length - 1)) * chartW;
    const getY = (val) => h - padding.bottom - (val / maxVal) * chartH * eased;

    // Draw area under line
    if (progress > 0) {
      ctx.beginPath();
      ctx.moveTo(getX(0), h - padding.bottom);
      for (let i = 0; i < data.values.length; i++) {
        ctx.lineTo(getX(i), getY(data.values[i]));
      }
      ctx.lineTo(getX(data.values.length - 1), h - padding.bottom);
      const areaGrad = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      areaGrad.addColorStop(0, data.color + '33');
      areaGrad.addColorStop(1, data.color + '00');
      ctx.fillStyle = areaGrad;
      ctx.fill();
    }

    // Draw line
    ctx.strokeStyle = data.color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < data.values.length; i++) {
      const x = getX(i);
      const y = getY(data.values[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw points and values
    if (progress > 0.8) {
      data.values.forEach((val, i) => {
        const x = getX(i);
        const y = getY(val);

        // Point
        ctx.fillStyle = data.color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label below (skip if too many points)
        const skipLabels = data.values.length > 10;
        if (!skipLabels || i % 3 === 0 || i === data.values.length - 1) {
          ctx.fillStyle = '#8899aa';
          const responsiveLabelFontSize = Math.max(8, Math.min(10, w / 45));
          ctx.font = `500 ${responsiveLabelFontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(data.labels[i], x, h - padding.bottom + 18);
        }

        // Value on top (skip if too many points to avoid overlap)
        const skipValues = data.values.length > 8;
        const valueInterval = data.values.length > 15 ? 4 : 2;
        
        if (!skipValues || i % valueInterval === 0 || i === data.values.length - 1) {
          ctx.fillStyle = '#ffffff';
          const responsiveValueFontSize = Math.max(9, Math.min(10, w / 40));
          ctx.font = `600 ${responsiveValueFontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          
          // Round to integer and show unit on all points for consistency
          const roundVal = Math.round(val);
          const valText = `${roundVal} ${data.label}`;
          
          // Zigzag (alternate y position) for better legibility on small screens
          const zigzagOffset = (i % 2 === 0) ? 12 : 24;
          ctx.fillText(valText, x, y - zigzagOffset);
        }
      });
    }

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
      const isChecked = item.classList.toggle('checked');
      item.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
      
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

// --- Waitlist Forms (Resend API) ---
function initWaitlistForms() {
  const forms = document.querySelectorAll('.waitlist-form');
  
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = form.querySelector('.waitlist-input');
      const submitBtn = form.querySelector('.waitlist-btn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoader = submitBtn.querySelector('.btn-loader');
      const messageEl = form.querySelector('.form-message');
      
      if (!emailInput.value) return;

      // Stan pobierania / wysyłki
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-block';
      messageEl.textContent = '';
      messageEl.className = 'form-message'; // reset

      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.value })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Wystąpił problem z połączeniem.');
        }

        // Sukces
        messageEl.textContent = 'Sukces! Dziękujemy za zapisanie się.';
        messageEl.style.color = 'var(--teal)';
        form.reset();
        
        // Odśwież dynamiczny licznik by podbić satysfakcję użytkownika w czasie rzeczywistym
        updateWaitlistCount();
        
      } catch (err) {
        // Obłsuga błędu HTTP
        messageEl.textContent = err.message || 'Wystąpił niespodziewany błąd.';
        messageEl.style.color = 'var(--red)';
      } finally {
        // Resetowanie kontrolki formularza
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
      }
    });
  });
}

// --- Dynamic Waitlist Counter ---
async function updateWaitlistCount() {
  const countSpan = document.getElementById('dynamic-waitlist-count');
  if (!countSpan) return;
  
  try {
    const res = await fetch('/api/waitlist-count');
    const data = await res.json();
    
    if (data.count) {
      const start = parseInt(countSpan.textContent) || 120;
      const end = data.count;
      if (start === end) return;
      
      let current = start;
      const step = end > start ? 1 : -1;
      const interval = setInterval(() => {
        current += step;
        countSpan.textContent = current;
        if (current === end) {
          clearInterval(interval);
        }
      }, 30); // Szybka animacja przewijania cyfr
    }
  } catch (err) {
    console.error('Nie udało się pobrać licznika oczekujących:', err);
  }
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
  initWaitlistForms();
  updateWaitlistCount();

  // Resize handler for charts
  window.addEventListener('resize', () => {
    // debounce redraw
    clearTimeout(window.resizeChartTimer);
    window.resizeChartTimer = setTimeout(() => {
      for (const [id, data] of Object.entries(activeCharts)) {
        drawBarChart(id, data);
      }
    }, 150);
  });
});
