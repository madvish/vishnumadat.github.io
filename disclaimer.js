// ============================================
//  Disclaimer & Acknowledgement System
//  Central Configuration + Access Control
// ============================================

(function () {
  'use strict';

  // ──────────────────────────────────────────
  //  CENTRAL CONFIGURATION — update here only
  // ──────────────────────────────────────────
  const DISCLOSURE_VERSION = '2026-10-16-v1';
  const APPLICATION_VERSION = '1.0.0';
  const STORAGE_KEY_PREFIX = 'vm_portfolio_';
  // ──────────────────────────────────────────
  //  TELEGRAM NOTIFICATION CONFIGURATION
  // ──────────────────────────────────────────
  const TELEGRAM_BOT_TOKEN = '8924691763:AAGymPp9Zb2IOnJ16y3ddZMeLBDYnhGnDW0';
  const TELEGRAM_CHAT_ID = '5033051057';

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
        '⚖️ <b>Portfolio Disclaimer Acknowledged</b>\n\n' +
        '🆔 <b>Visitor ID:</b> <code>' + escapeHTML(record.visitor_id) + '</code>\n' +
        '🕒 <b>Time (IST):</b> ' + escapeHTML(localTime) + '\n' +
        '📄 <b>Page:</b> Model Portfolio\n' +
        '📌 <b>Version:</b> ' + escapeHTML(record.disclosure_version) + '\n' +
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
      console.log('Disclaimer Telegram acknowledgement sent:', data);
      return data;
    } catch (e) {
      console.warn('Telegram notification dispatch error:', e);
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
      // Generate a random pseudonymous ID — no PII
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
  //  DISCLAIMER MODAL — HTML + behaviour
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

            <p>By selecting the acknowledgement below, you confirm that you have read and understood this notice and acknowledge the hypothetical and educational nature of the portfolio.</p>

            <p>This acknowledgement does not waive any rights that cannot legally be waived, exclude liability where such exclusion is prohibited by law, or replace any registration or compliance requirement under applicable law.</p>
          </div>

          <div class="disclaimer-meta">
            <span>Disclosure version: <strong>${DISCLOSURE_VERSION}</strong></span>
            <span>·</span>
            <a href="disclaimer.html" class="disclaimer-full-link" id="disclaimer-full-link">Read full disclosure →</a>
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

          <div id="disclaimer-error" class="disclaimer-error" role="alert" aria-live="polite" style="display:none;">
            We couldn't record your acknowledgement. Please try again.
          </div>
        </div>
      </div>
    `;

    return overlay;
  }

  function showDisclaimerModal(onSuccess) {
    const overlay = buildDisclaimerModal();
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Fade in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    const checkbox = document.getElementById('disclaimer-checkbox');
    const continueBtn = document.getElementById('disclaimer-continue-btn');
    const errorEl = document.getElementById('disclaimer-error');

    // Checkbox → enable/disable button
    checkbox.addEventListener('change', () => {
      continueBtn.disabled = !checkbox.checked;
    });

    // Continue button
    continueBtn.addEventListener('click', async () => {
      if (!checkbox.checked) return;

      errorEl.style.display = 'none';
      continueBtn.disabled = true;
      continueBtn.textContent = 'Recording…';

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
      // Do NOT allow Escape to dismiss — user must acknowledge
    });

    // Focus the checkbox on open
    setTimeout(() => checkbox.focus(), 400);
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

    // Reprompt disclaimer at every visit
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
  //  PUBLIC API (for other scripts if needed)
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
