// ============================================
//  Disclaimer & Access Control System
//  Password Protection + Acknowledgement + Alerts
// ============================================

(function () {
  'use strict';

  // ──────────────────────────────────────────
  //  CENTRAL CONFIGURATION
  // ──────────────────────────────────────────
  const DISCLOSURE_VERSION = '2026-10-16-v1';
  const APPLICATION_VERSION = '1.0.0';
  const STORAGE_KEY_PREFIX = 'vm_portfolio_';

  // Telegram Notifications
  const TELEGRAM_BOT_TOKEN = '8924691763:AAGymPp9Zb2IOnJ16y3ddZMeLBDYnhGnDW0';
  const TELEGRAM_CHAT_ID = '5033051057';

  // Model Portfolio Password Protection
  // Password: Virtualportvish$23@
  const PORTFOLIO_PASSWORD_PLAIN = 'Virtualportvish$23@';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Robust input cleaner: removes accidental prefixes, zero-width chars, hidden BOMs, non-breaking spaces
  function cleanPasswordInput(str) {
    if (!str) return '';
    return String(str)
      .replace(/^password\s*:\s*/i, '')
      .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g, '')
      .trim();
  }

  // Verifies password: exact match or case-insensitive match (for mobile keyboard differences)
  function verifyPassword(input) {
    if (!input) return false;
    const clean = cleanPasswordInput(input);
    if (clean === PORTFOLIO_PASSWORD_PLAIN) return true;
    if (clean.toLowerCase() === PORTFOLIO_PASSWORD_PLAIN.toLowerCase()) return true;
    return false;
  }

  async function sendTelegramAcknowledgement(record) {
    try {
      const now = new Date();
      const localTime = now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
      const userAgent = (navigator.userAgent || 'Unknown').slice(0, 150);

      const text =
        '🔓 <b>Model Portfolio Unlocked</b>\n\n' +
        '🔑 <b>Status:</b> Password Verified\n' +
        '🆔 <b>Visitor ID:</b> <code>' + escapeHTML(record.visitor_id) + '</code>\n' +
        '🕒 <b>Time (IST):</b> ' + escapeHTML(localTime) + '\n' +
        '📄 <b>Page:</b> Model Portfolio\n' +
        '📌 <b>Disclaimer Version:</b> ' + escapeHTML(record.disclosure_version) + '\n' +
        '🌐 <b>URL:</b> ' + escapeHTML(window.location.href) + '\n' +
        '📱 <b>Device:</b> <code>' + escapeHTML(userAgent) + '</code>';

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'HTML',
        }),
        keepalive: true,
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) clearTimeout(timeoutId);
      const data = await res.json();
      console.log('Telegram portfolio unlock alert sent:', data);
      return data;
    } catch (e) {
      console.warn('Telegram unlock notification dispatch error:', e);
      return null;
    }
  }

  async function sendTelegramFailedAttempt(enteredPassword) {
    try {
      const now = new Date();
      const localTime = now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
      const userAgent = (navigator.userAgent || 'Unknown').slice(0, 150);
      const visitorId = getOrCreateVisitorId();

      const text =
        '🚫 <b>Failed Portfolio Password Attempt</b>\n\n' +
        '🔑 <b>Entered:</b> <code>' + escapeHTML(enteredPassword ? String(enteredPassword).slice(0, 60) : '(empty)') + '</code>\n' +
        '🆔 <b>Visitor ID:</b> <code>' + escapeHTML(visitorId) + '</code>\n' +
        '🕒 <b>Time (IST):</b> ' + escapeHTML(localTime) + '\n' +
        '📄 <b>Page:</b> Model Portfolio\n' +
        '🌐 <b>URL:</b> ' + escapeHTML(window.location.href) + '\n' +
        '📱 <b>Device:</b> <code>' + escapeHTML(userAgent) + '</code>';

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'HTML',
        }),
        keepalive: true,
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) clearTimeout(timeoutId);
      const data = await res.json();
      console.log('Telegram failed attempt alert sent:', data);
      return data;
    } catch (e) {
      console.warn('Telegram failed attempt notification dispatch error:', e);
      return null;
    }
  }

  const STORAGE_KEYS = {
    acknowledgements: STORAGE_KEY_PREFIX + 'acknowledgements',
    visitorId: STORAGE_KEY_PREFIX + 'visitor_id',
  };

  // ──────────────────────────────────────────
  //  VISITOR IDENTIFIER (pseudonymous)
  // ──────────────────────────────────────────
  function getOrCreateVisitorId() {
    let id = null;
    try {
      id = localStorage.getItem(STORAGE_KEYS.visitorId);
    } catch (e) { /* storage unavailable */ }
    if (!id) {
      id = 'v_' + generateUUID();
      try {
        localStorage.setItem(STORAGE_KEYS.visitorId, id);
      } catch (e) { /* storage unavailable */ }
    }
    return id;
  }

  // ──────────────────────────────────────────
  //  ACKNOWLEDGEMENT RECORDS
  // ──────────────────────────────────────────
  function getAcknowledgements() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.acknowledgements);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* corrupt or unavailable */ }
    return [];
  }

  function saveAcknowledgement(record) {
    const records = getAcknowledgements();
    records.push(record);
    try {
      localStorage.setItem(STORAGE_KEYS.acknowledgements, JSON.stringify(records));
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasAcknowledgedCurrentVersion() {
    const records = getAcknowledgements();
    return records.some(
      (r) => r.disclosure_version === DISCLOSURE_VERSION && r.acknowledged === true
    );
  }

  function createAcknowledgementRecord(pageContext) {
    return {
      id: generateUUID(),
      disclosure_version: DISCLOSURE_VERSION,
      acknowledged_at: new Date().toISOString(),
      visitor_id: getOrCreateVisitorId(),
      acknowledged: true,
      page_context: pageContext || window.location.pathname,
      application_version: APPLICATION_VERSION,
      created_at: new Date().toISOString(),
    };
  }

  // ──────────────────────────────────────────
  //  DISCLAIMER & PASSWORD MODAL
  // ──────────────────────────────────────────
  function buildDisclaimerModal() {
    const overlay = document.createElement('div');
    overlay.id = 'disclaimer-overlay';
    overlay.className = 'disclaimer-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'disclaimer-heading');
    overlay.setAttribute('aria-describedby', 'disclaimer-body');

    overlay.innerHTML = `
      <div class="disclaimer-modal" id="disclaimer-modal">
        <div class="disclaimer-modal-inner">
          <div class="disclaimer-accent-line"></div>

          <div class="disclaimer-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01"/>
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>

          <h2 id="disclaimer-heading" class="disclaimer-heading">
            Important Notice — Virtual Equity Portfolio
          </h2>

          <div id="disclaimer-body" class="disclaimer-body">
            <p>This website displays a hypothetical equity portfolio maintained for educational and investment-research demonstration purposes.</p>

            <p>The portfolio may contain simulated holdings, transactions, portfolio weights and performance figures. These do not necessarily represent actual investments or achievable investment returns.</p>

            <p>The information is not tailored to your financial circumstances, investment objectives or risk tolerance. It should not be relied upon as personalised investment advice.</p>

            <p>Equity investments involve market, liquidity, valuation and other risks, including the possible loss of capital. Hypothetical and historical performance have inherent limitations and do not guarantee future results.</p>

            <p>By entering the access password and confirming the acknowledgement below, you verify that you have read and understood this notice and acknowledge the hypothetical and educational nature of the portfolio.</p>

            <p>This acknowledgement does not waive any rights that cannot legally be waived, exclude liability where such exclusion is prohibited by law, or replace any registration or compliance requirement under applicable law.</p>
          </div>

          <div class="disclaimer-meta">
            <span>Disclosure version: <strong>${DISCLOSURE_VERSION}</strong></span>
            <span>·</span>
            <a href="disclaimer.html" class="disclaimer-full-link" id="disclaimer-full-link">Read full disclosure →</a>
          </div>

          <div class="disclaimer-password-wrap">
            <label for="disclaimer-password-input" class="disclaimer-password-label">
              Portfolio Access Password
            </label>
            <div class="disclaimer-input-container">
              <input
                type="password"
                id="disclaimer-password-input"
                class="disclaimer-password-input"
                placeholder="Enter access password"
                autocomplete="current-password"
                spellcheck="false"
              />
              <button
                type="button"
                id="disclaimer-toggle-pw"
                class="disclaimer-toggle-pw"
                aria-label="Toggle password visibility"
                title="Show/Hide Password"
              >
                <svg id="eye-icon-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg id="eye-icon-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="disclaimer-checkbox-wrap">
            <label for="disclaimer-checkbox" class="disclaimer-label" id="disclaimer-label">
              <input type="checkbox" id="disclaimer-checkbox" class="disclaimer-checkbox" />
              <span class="disclaimer-checkmark" aria-hidden="true"></span>
              <span class="disclaimer-label-text">I have read and understood the notice above and acknowledge the hypothetical and educational nature of this portfolio.</span>
            </label>
          </div>

          <button type="button" id="disclaimer-continue-btn" class="btn btn-primary disclaimer-continue-btn" disabled aria-describedby="disclaimer-label">
            Continue to Portfolio
          </button>

          <div id="disclaimer-error" class="disclaimer-error" role="alert" aria-live="polite" style="display:none;"></div>
        </div>
      </div>
    `;

    return overlay;
  }

  function showDisclaimerModal(onSuccess) {
    // Remove any stale overlay first
    const existing = document.getElementById('disclaimer-overlay');
    if (existing) {
      existing.remove();
    }

    const overlay = buildDisclaimerModal();
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Fade in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    const passwordInput = overlay.querySelector('#disclaimer-password-input');
    const togglePwBtn = overlay.querySelector('#disclaimer-toggle-pw');
    const eyeShow = overlay.querySelector('#eye-icon-show');
    const eyeHide = overlay.querySelector('#eye-icon-hide');
    const checkbox = overlay.querySelector('#disclaimer-checkbox');
    const continueBtn = overlay.querySelector('#disclaimer-continue-btn');
    const errorEl = overlay.querySelector('#disclaimer-error');

    // Toggle password visibility
    if (togglePwBtn && passwordInput) {
      togglePwBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        if (eyeShow && eyeHide) {
          eyeShow.style.display = isPassword ? 'none' : 'block';
          eyeHide.style.display = isPassword ? 'block' : 'none';
        }
      });
    }

    // Enable button only when password entered AND checkbox checked
    function checkInputs() {
      const hasPassword = passwordInput && cleanPasswordInput(passwordInput.value).length > 0;
      const isChecked = checkbox && checkbox.checked;
      continueBtn.disabled = !(hasPassword && isChecked);
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        errorEl.style.display = 'none';
        checkInputs();
      });
      passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!checkbox.checked) {
            checkbox.checked = true;
            checkInputs();
          }
          if (!continueBtn.disabled) {
            continueBtn.click();
          }
        }
      });
    }

    if (checkbox) {
      checkbox.addEventListener('change', () => {
        checkInputs();
      });
      checkbox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !continueBtn.disabled) {
          e.preventDefault();
          continueBtn.click();
        }
      });
    }

    // Continue button validation & submission
    continueBtn.addEventListener('click', async () => {
      if (continueBtn.disabled) return;

      const rawValue = passwordInput ? passwordInput.value : '';
      const clean = cleanPasswordInput(rawValue);

      if (!clean) {
        errorEl.textContent = 'Please enter the access password.';
        errorEl.style.display = 'block';
        if (passwordInput) passwordInput.focus();
        return;
      }

      if (!checkbox.checked) {
        errorEl.textContent = 'Please acknowledge the disclaimer notice above.';
        errorEl.style.display = 'block';
        return;
      }

      errorEl.style.display = 'none';
      continueBtn.disabled = true;
      continueBtn.textContent = 'Verifying…';

      const isValid = verifyPassword(clean);

      if (!isValid) {
        // Send alert about failed attempt in background
        sendTelegramFailedAttempt(rawValue);

        errorEl.textContent = 'Incorrect password. Please contact Vishnu for access.';
        errorEl.style.display = 'block';
        continueBtn.disabled = false;
        continueBtn.textContent = 'Continue to Portfolio';
        if (passwordInput) {
          passwordInput.focus();
          passwordInput.select();
        }
        return;
      }

      // Valid password
      continueBtn.textContent = 'Unlocking…';
      const record = createAcknowledgementRecord('model-portfolio');
      saveAcknowledgement(record);

      // Await Telegram notification dispatch
      try {
        await sendTelegramAcknowledgement(record);
      } catch (err) {
        console.warn('Telegram send failed:', err);
      }

      // Allow access and dismiss modal
      overlay.classList.remove('visible');
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
        if (typeof onSuccess === 'function') onSuccess();
      }, 350);
    });

    // Keyboard: trap focus inside modal
    const focusableEls = overlay.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableEls[0];
    const lastFocusable = focusableEls[focusableEls.length - 1];

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
      // Do NOT allow Escape to dismiss — user must unlock
    });

    // Focus password field on open
    setTimeout(() => {
      if (passwordInput) passwordInput.focus();
    }, 400);
  }

  // ──────────────────────────────────────────
  //  ACCESS CONTROL for model-portfolio page
  // ──────────────────────────────────────────
  function gateModelPortfolio() {
    // Only runs on model-portfolio.html
    const isModelPortfolioPage =
      window.location.pathname.endsWith('model-portfolio.html') ||
      window.location.pathname.endsWith('model-portfolio');

    if (!isModelPortfolioPage) return;

    // Reprompt password + disclaimer at every visit
    hidePortfolioContent();
    showDisclaimerModal(() => {
      revealPortfolioContent();
    });
  }

  function hidePortfolioContent() {
    const content = document.getElementById('model-portfolio-content');
    if (content) {
      content.style.display = 'none';
      content.setAttribute('aria-hidden', 'true');
    }
  }

  function revealPortfolioContent() {
    const content = document.getElementById('model-portfolio-content');
    if (content) {
      content.style.display = '';
      content.removeAttribute('aria-hidden');
      content.style.opacity = '0';
      requestAnimationFrame(() => {
        content.style.transition = 'opacity 0.5s ease';
        content.style.opacity = '1';
      });
    }
  }

  // ──────────────────────────────────────────
  //  PUBLIC API
  // ──────────────────────────────────────────
  window.VMDisclaimer = {
    DISCLOSURE_VERSION: DISCLOSURE_VERSION,
    APPLICATION_VERSION: APPLICATION_VERSION,
    hasAcknowledgedCurrentVersion: hasAcknowledgedCurrentVersion,
    getAcknowledgements: getAcknowledgements,
    getVisitorId: getOrCreateVisitorId,
    showDisclaimerModal: showDisclaimerModal,
    gateModelPortfolio: gateModelPortfolio,
  };

  // ──────────────────────────────────────────
  //  INIT
  // ──────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', gateModelPortfolio);
  } else {
    gateModelPortfolio();
  }
})();
