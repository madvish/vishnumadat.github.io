// ============================================
// Main JavaScript — Riddhi Kharote Website
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollEffects();
  initIntersectionObserver();
  initSkillBars();
  initContactForm();
  initPortfolioFilters();
});

// --- Navigation ---
function initNavigation() {
  const nav = document.getElementById('main-nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  
  if (!nav) return;

  // Scroll effect for nav
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });

  // Mobile toggle
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
      document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
    });

    // Close on link click
    links.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Set active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// --- Scroll Effects ---
function initScrollEffects() {
  // Parallax-like effect for hero
  const heroBg = document.querySelector('.hero-bg-pattern');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scroll = window.scrollY;
      if (scroll < window.innerHeight) {
        heroBg.style.transform = `translateY(${scroll * 0.3}px)`;
      }
    }, { passive: true });
  }
}

// --- Intersection Observer for reveal animations ---
function initIntersectionObserver() {
  const revealElements = document.querySelectorAll('.reveal');
  
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

// --- Skill Bars Animation ---
function initSkillBars() {
  const skillBars = document.querySelectorAll('.skill-bar-fill');
  
  if (skillBars.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  skillBars.forEach(bar => observer.observe(bar));
}

// --- Portfolio Filters ---
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  if (filterBtns.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      portfolioCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 400);
        }
      });
    });
  });
}

// --- Contact Form (Telegram Integration) ---
function initContactForm() {
  const form = document.getElementById('contact-form');
  
  if (!form) return;

  const TELEGRAM_BOT_TOKEN = '8924691763:AAGymPp9Zb2IOnJ16y3ddZMeLBDYnhGnDW0';
  const TELEGRAM_CHAT_ID = '5033051057';

  // Helper to escape HTML special characters for Telegram HTML parse_mode
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('.btn-primary');
    const originalHTML = submitBtn.innerHTML;
    
    // Gather form data
    const name = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email-input').value.trim() || 'Not provided';
    const subjectEl = form.querySelector('#contact-subject');
    const subject = subjectEl.options[subjectEl.selectedIndex]?.text || 'Not specified';
    const message = form.querySelector('#contact-message').value.trim();

    // Build a formatted Telegram message using HTML parse_mode (more robust than Markdown)
    const text = "\uD83D\uDCEC <b>New Contact Form Submission</b>\n\n\uD83D\uDC64 <b>Name:</b> " + escapeHTML(name) + "\n\uD83D\uDCE7 <b>Email:</b> " + escapeHTML(email) + "\n\uD83D\uDCCC <b>Subject:</b> " + escapeHTML(subject) + "\n\n\uD83D\uDCAC <b>Message:</b>\n" + escapeHTML(message);

    // Show sending state
    submitBtn.innerHTML = '<span>Sending...</span>';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        submitBtn.innerHTML = '<span>\u2713 Message Sent!</span>';
        submitBtn.style.background = '#3A5A40';
        submitBtn.style.opacity = '1';
        form.reset();
      } else {
        console.error('Telegram API error:', data);
        throw new Error(data.description || 'Telegram API returned an error');
      }
    } catch (error) {
      submitBtn.innerHTML = '<span>\u2715 Failed to send</span>';
      submitBtn.style.background = '#8B0000';
      submitBtn.style.opacity = '1';
      console.error('Contact form error:', error);
    }

    setTimeout(() => {
      submitBtn.innerHTML = originalHTML;
      submitBtn.style.background = '';
      submitBtn.disabled = false;
    }, 3000);
  });
}

// --- Smooth counter animation for stats ---
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    
    const current = Math.floor(start + (target - start) * eased);
    element.textContent = current + '+';
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// Animate stats when visible
const statNumbers = document.querySelectorAll('.stat-number');
if (statNumbers.length > 0) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.textContent);
        if (!isNaN(target)) {
          animateCounter(entry.target, target);
        }
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(stat => statsObserver.observe(stat));
}


