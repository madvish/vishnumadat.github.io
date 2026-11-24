/**
 * Market Dashboard JavaScript
 * Handles tab navigation, JSON data fetching, dynamic table generation,
 * polarity styling, CSV downloads, and Chart.js yield curve visualization.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDashboardTabs();
  loadMarketData();
});

let marketDataPayload = null;
let yieldCurveChart = null;
let gsecCurveChart = null;

// US-related tickers and shortforms full form lookup (light grey italic subtitle)
const US_FULL_FORMS = {
  // US Rates & Slopes
  'ust_1m': '1-Month US Treasury Bill',
  'ust_2m': '2-Month US Treasury Bill',
  'ust_3m': '3-Month US Treasury Bill',
  'ust_4m': '4-Month US Treasury Bill',
  'ust_6m': '6-Month US Treasury Bill',
  'ust_1y': '1-Year US Treasury Bill',
  'ust_2y': '2-Year US Treasury Note',
  'ust_3y': '3-Year US Treasury Note',
  'ust_5y': '5-Year US Treasury Note',
  'ust_7y': '7-Year US Treasury Note',
  'ust_10y': '10-Year US Treasury Note',
  'ust_20y': '20-Year US Treasury Bond',
  'ust_30y': '30-Year US Treasury Bond',
  'slope_2s10s': 'US Treasury 10Y minus 2Y Yield Spread',
  'slope_3m10y': 'US Treasury 10Y minus 3M Yield Spread',

  // US Equities & ETFs
  'us_kre': 'SPDR S&P Regional Banking ETF',
  'us_dxy': 'Intercontinental Exchange U.S. Dollar Index',
  'us_xlu': 'Utilities Select Sector SPDR Fund',
  'us_iyr': 'iShares U.S. Real Estate ETF',
  'us_xlp': 'Consumer Staples Select Sector SPDR Fund',
  'us_spy': 'SPDR S&P 500 ETF Trust',
  'us_iwm': 'iShares Russell 2000 ETF',
  'us_qqq': 'Invesco QQQ Trust (Nasdaq-100)',
  'us_tlt': 'iShares 20+ Year Treasury Bond ETF',
  'fed_futures': '30-Day Federal Funds Futures (CME: ZQ)',

  // US Real / TIPS / Breakevens
  'real_5y': '5-Year Treasury Inflation-Protected Security',
  'real_7y': '7-Year Treasury Inflation-Protected Security',
  'real_10y': '10-Year Treasury Inflation-Protected Security',
  'real_20y': '20-Year Treasury Inflation-Protected Security',
  'real_30y': '30-Year Treasury Inflation-Protected Security',
  'real_f5y5y': 'Forward 5-Year, 5-Year Real Rate',
  'be_5y': '5-Year Breakeven Inflation Rate',
  'be_7y': '7-Year Breakeven Inflation Rate',
  'be_10y': '10-Year Breakeven Inflation Rate',
  'be_20y': '20-Year Breakeven Inflation Rate',
  'be_30y': '30-Year Breakeven Inflation Rate',
  'be_f5y5y': 'Forward 5-Year, 5-Year Breakeven Inflation Rate',

  // US Credit OAS & Mortgage
  'oas_ig': 'Investment Grade Option-Adjusted Spread (ICE BofA)',
  'oas_aa': 'AA-Rated Corporate Option-Adjusted Spread',
  'oas_bbb': 'BBB-Rated Corporate Option-Adjusted Spread',
  'oas_hy': 'High Yield Corporate Option-Adjusted Spread (ICE BofA)',
  'oas_bb': 'BB-Rated High Yield Option-Adjusted Spread',
  'oas_ccc': 'CCC & Lower High Yield Option-Adjusted Spread',
  'mortgage_30y': 'Freddie Mac Primary Mortgage Market Survey 30Y Fixed',
  'mortgage_spread': '30Y Conventional Mortgage Spread vs 10Y US Treasury',

  // MBS / Agency REITs
  'mbs_mbb': 'iShares MBS ETF (Mortgage-Backed Securities)',
  'mbs_agnc': 'AGNC Investment Corp (Agency Mortgage REIT)',
  'mbs_nly': 'Annaly Capital Management (Agency Mortgage REIT)',

  // US Traded Commodities
  'cmd_gold': 'COMEX Gold Futures (GC)',
  'cmd_silver': 'COMEX Silver Futures (SI)',
  'cmd_copper': 'COMEX Copper Futures (HG)',
  'cmd_aluminum': 'London Metal Exchange Aluminum Cash/Futures',
  'cmd_zinc': 'Global Zinc Futures (ZN)',
  'cmd_platinum': 'NYMEX Platinum Futures (PL)',
  'cmd_palladium': 'NYMEX Palladium Futures (PA)',
  'cmd_wti': 'West Texas Intermediate Light Sweet Crude (NYMEX: CL)',
  'cmd_brent': 'ICE Brent Crude Oil Futures (BZ)',
  'cmd_natgas': 'Henry Hub Natural Gas Futures (NYMEX: NG)',
  'cmd_gasoline': 'Reformulated Blendstock for Oxygenate Blending (NYMEX: RB)',
  'cmd_heatingoil': 'NYMEX Heating Oil Futures (HO)',
  'cmd_wheat': 'Chicago Board of Trade Wheat Futures (CBOT: ZW)',
  'cmd_corn': 'Chicago Board of Trade Corn Futures (CBOT: ZC)',
  'cmd_soybeans': 'Chicago Board of Trade Soybean Futures (CBOT: ZS)',
  'cmd_soyoil': 'Chicago Board of Trade Soybean Oil Futures (CBOT: ZL)',
  'cmd_coffee': "ICE Coffee 'C' Arabica Futures (KC)",
  'cmd_sugar': 'ICE Sugar No. 11 World Raw Sugar (SB)',
  'cmd_cotton': 'ICE Cotton No. 2 Futures (CT)',
  'cmd_livecattle': 'Chicago Mercantile Exchange Live Cattle Futures (CME: LE)',
  'cmd_leanhogs': 'Chicago Mercantile Exchange Lean Hogs Futures (CME: HE)',

  // Global Markets Tab (US Assets, Global Tickers & FX)
  'gm_spx': "Standard & Poor's 500 Index",
  'gm_ndx': 'Nasdaq-100 Technology Index',
  'gm_us10y': 'United States 10-Year Treasury Benchmark Note',
  'gm_move': 'Merrill Lynch Option Volatility Estimate (US Bond Volatility)',
  'gm_dxy': 'Intercontinental Exchange U.S. Dollar Index',
  'gm_gold': 'Gold Spot / COMEX Continuous ($/oz)',
  'gm_brent': 'ICE Brent Crude Oil Futures ($/bbl)',
  'gm_btcusd': 'Bitcoin Crypto Asset in US Dollars',
  'gm_usdinr': 'United States Dollar / Indian Rupee',
  'gm_eurusd': 'Euro / United States Dollar',
  'gm_gbpusd': 'British Pound Sterling / United States Dollar',
  'gm_usdchf': 'United States Dollar / Swiss Franc',
  'gm_usdjpy': 'United States Dollar / Japanese Yen',
  'gm_usdcad': 'United States Dollar / Canadian Dollar',
  'gm_audusd': 'Australian Dollar / United States Dollar',
  'gm_usdcny': 'United States Dollar / Chinese Yuan Renminbi',

  // Tab 5 Cross Market Spreads
  'cross_10y_spread': '10Y Indian Government Bond vs 10Y US Treasury Note',
  'fed_funds_target': 'Federal Reserve Policy Target Rate (Upper Limit)',
  'cross_repo_fed_spread': 'RBI Policy Repo Rate vs US Fed Funds Rate'
};

// --- Tab Switching ---
function initDashboardTabs() {
  const tabs = document.querySelectorAll('.md-tab');
  const panes = document.querySelectorAll('.md-tab-pane');

  function activateTab(tabId) {
    tabs.forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    // Lazy re-render or resize charts if active tab has chart
    if (tabId === 'tab-us-rates' && yieldCurveChart) {
      setTimeout(() => yieldCurveChart.resize(), 50);
    }
    if (tabId === 'tab-india-rates' && gsecCurveChart) {
      setTimeout(() => gsecCurveChart.resize(), 50);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      activateTab(targetId);
      window.location.hash = targetId.replace('tab-', '');
    });
  });

  // Handle URL hash on initial load
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const candidateTab = document.querySelector(`.md-tab[data-tab="tab-${hash}"]`);
    if (candidateTab) {
      activateTab(`tab-${hash}`);
    }
  }
}

// --- Data Fetching ---
async function loadMarketData() {
  const lastUpdatedEl = document.getElementById('md-last-updated');
  const statusBadgeEl = document.getElementById('md-status-badge');

  try {
    const res = await fetch('data/market/latest.json?v=' + Date.now());
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to load latest market data`);
    }

    marketDataPayload = await res.json();
    renderDashboard(marketDataPayload);

  } catch (err) {
    console.warn('[MarketDashboard] Could not fetch latest.json:', err);
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = 'Pending first automated pipeline run';
    }
    if (statusBadgeEl) {
      statusBadgeEl.className = 'md-badge md-badge-stale';
      statusBadgeEl.textContent = '○ Awaiting Data';
    }
  }
}

// --- Dashboard Rendering ---
function renderDashboard(data) {
  const lastUpdatedEl = document.getElementById('md-last-updated');
  const statusBadgeEl = document.getElementById('md-status-badge');

  if (lastUpdatedEl && data.generated_at_ist) {
    lastUpdatedEl.textContent = formatDateTime(data.generated_at_ist);
  }

  if (statusBadgeEl && data.summary) {
    if (data.summary.missing > 0 && data.summary.ok === 0) {
      statusBadgeEl.className = 'md-badge md-badge-error';
      statusBadgeEl.textContent = '● Incomplete';
    } else if (data.summary.stale > 0) {
      statusBadgeEl.className = 'md-badge md-badge-stale';
      statusBadgeEl.textContent = `● ${data.summary.stale} Stale`;
    } else {
      statusBadgeEl.className = 'md-badge md-badge-ok';
      statusBadgeEl.textContent = '● Live';
    }
  }

  // Map sections by id for fast lookup
  const sectionsMap = {};
  if (data.tabs) {
    data.tabs.forEach(tab => {
      if (tab.sections) {
        tab.sections.forEach(sec => {
          sectionsMap[sec.id] = sec;
        });
      }
    });
  }

  // Render Global Markets sections
  renderSectionTable('sec-global-india', sectionsMap['global_india']);
  renderSectionTable('sec-global-macro', sectionsMap['global_macro']);
  renderSectionTable('sec-global-forex', sectionsMap['global_forex']);

  // Render US Rates sections
  renderSectionTable('sec-par-rates', sectionsMap['par_rates']);
  renderSectionTable('sec-par-yields', sectionsMap['par_yields']);
  renderSectionTable('sec-slopes', sectionsMap['slopes']);
  renderSectionTable('sec-us-equity', sectionsMap['us_equity']);

  // Render US Real / Credit / Cmdty sections
  renderSectionTable('sec-real-yields', sectionsMap['real_yields']);
  renderSectionTable('sec-breakevens', sectionsMap['breakevens']);
  renderSectionTable('sec-credit-oas', sectionsMap['credit_oas']);
  renderSectionTable('sec-housing', sectionsMap['housing']);
  renderSectionTable('sec-metals', sectionsMap['metals']);
  renderSectionTable('sec-energy', sectionsMap['energy']);
  renderSectionTable('sec-global-agri', sectionsMap['global_agri']);
  renderSectionTable('sec-mortgage-reits', sectionsMap['mortgage_reits']);

  // Render India Rates & Equity sections
  renderSectionTable('sec-in-policy', sectionsMap['in_policy']);
  renderSectionTable('sec-in-gsec-yields', sectionsMap['in_gsec_yields']);
  renderSectionTable('sec-in-slopes', sectionsMap['in_slopes']);
  renderSectionTable('sec-in-equity', sectionsMap['in_equity']);

  // Render India Real / Credit / Cmdty sections
  renderSectionTable('sec-in-real-yields', sectionsMap['in_real_yields']);
  renderSectionTable('sec-in-credit-spreads', sectionsMap['in_credit_spreads']);
  renderSectionTable('sec-in-housing-reits', sectionsMap['in_housing_reits']);
  renderSectionTable('sec-in-mcx-metals', sectionsMap['in_mcx_metals']);
  renderSectionTable('sec-in-energy', sectionsMap['in_energy']);
  renderSectionTable('sec-in-ncdex-agri', sectionsMap['in_ncdex_agri']);

  // Render India Flows & Macro sections
  renderSectionTable('sec-in-cross-market', sectionsMap['in_cross_market']);
  renderSectionTable('sec-in-flows', sectionsMap['in_flows']);
  renderSectionTable('sec-in-valuation', sectionsMap['in_valuation']);
  renderSectionTable('sec-in-macro', sectionsMap['in_macro']);

  // Render Data Health Table
  renderDataHealthTable(data);

  // Render Yield Curve Charts
  renderYieldCurveChart(sectionsMap['par_rates'], sectionsMap['par_yields']);
  renderGSecCurveChart(sectionsMap['in_gsec_yields']);

  // Setup CSV exports
  initCsvExports(sectionsMap);
}

// --- Section Table Generator ---
function renderSectionTable(containerId, sectionData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!sectionData || !sectionData.metrics || sectionData.metrics.length === 0) {
    container.innerHTML = '<div style="padding: 1rem; color: var(--color-text-muted); font-size: 0.85rem;">No data available.</div>';
    return;
  }

  const isPrice = sectionData.display_type === 'price';
  const metrics = sectionData.metrics;

  // Sample dates from first populated metric for column headers
  let thisDate = 'This Week';
  let lastDate = 'Last Week';
  let baseDate = 'Base';

  for (const m of metrics) {
    if (m.this_date) { thisDate = formatDate(m.this_date); }
    if (m.last_date) { lastDate = formatDate(m.last_date); }
    if (m.base_date) { baseDate = formatDate(m.base_date); }
    if (m.this_date && m.last_date) break;
  }

  // Dynamic w/w Change and YTD header labels & units
  const isBps = sectionData.unit === 'bps';
  const chgTitle = 'w/w Change';
  const chgSub = isPrice ? '%' : (isBps ? 'bps' : 'pp');
  const ytdTitle = 'YTD Change';
  const ytdSub = isPrice ? '%' : (isBps ? 'bps' : 'pp');

  let html = `
    <table class="md-table" role="table">
      <thead>
        <tr>
          <th class="col-metric" scope="col">Metric</th>
          <th scope="col">
            <span class="th-title">Cycle High</span>
            <span class="th-sub">Since 2023</span>
          </th>
          <th class="col-this-th" scope="col">
            <span class="th-title">This Week</span>
            <span class="th-sub">${thisDate}</span>
          </th>
          <th scope="col">
            <span class="th-title">Last Week</span>
            <span class="th-sub">${lastDate}</span>
          </th>
          <th scope="col">
            <span class="th-title">${chgTitle}</span>
            <span class="th-sub">${chgSub}</span>
          </th>
          <th class="col-base-th" scope="col">
            <span class="th-title">Base</span>
            <span class="th-sub">${baseDate}</span>
          </th>
          <th scope="col">
            <span class="th-title">${ytdTitle}</span>
            <span class="th-sub">${ytdSub}</span>
          </th>
        </tr>
      </thead>
      <tbody>
  `;

  metrics.forEach(m => {
    const cycleVal = formatVal(m.cycle_high, isPrice);
    const cycleDateStr = m.cycle_high_date ? `<span class="cycle-subdate">${formatDate(m.cycle_high_date)}</span>` : '';
    const thisVal = formatVal(m.this_value, isPrice);
    const lastVal = formatVal(m.last_value, isPrice);
    const baseVal = formatVal(m.base_value, isPrice);

    const changeVal = formatChange(m.change, isPrice);
    const ytdVal = formatChange(m.ytd, isPrice);

    const changeClass = getPolarityClass(m.change, m.polarity);
    const ytdClass = getPolarityClass(m.ytd, m.polarity);
    const staleTag = m.stale ? '<span class="stale-tag">STALE</span>' : '';
    const fullForm = m.full_name || US_FULL_FORMS[m.id];
    const fullFormHtml = fullForm ? `<span class="metric-full-form">${fullForm}</span>` : '';

    html += `
      <tr>
        <td class="col-metric"><span class="metric-title">${m.label}</span> ${staleTag}${fullFormHtml}</td>
        <td class="num-cell">${cycleVal}${cycleDateStr}</td>
        <td class="num-cell col-this-td">${thisVal}</td>
        <td class="num-cell">${lastVal}</td>
        <td class="num-cell ${changeClass}">${changeVal}</td>
        <td class="num-cell col-base-td">${baseVal}</td>
        <td class="num-cell ${ytdClass}">${ytdVal}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// --- Data Health Table Generator ---
function renderDataHealthTable(data) {
  const container = document.getElementById('sec-health-table');
  if (!container || !data.tabs) return;

  let allMetrics = [];
  data.tabs.forEach(tab => {
    if (tab.sections) {
      tab.sections.forEach(sec => {
        if (sec.metrics) {
          sec.metrics.forEach(m => {
            allMetrics.push({
              tab: tab.label,
              section: sec.label,
              metric: m.label,
              source: m.source || '–',
              updated: m.updated || '–',
              status: m.status || 'unknown',
              stale: m.stale
            });
          });
        }
      });
    }
  });

  let html = `
    <table class="md-table" role="table">
      <thead>
        <tr>
          <th class="col-metric" scope="col">Category</th>
          <th class="col-metric" scope="col">Metric</th>
          <th scope="col">Source / Series</th>
          <th scope="col">Latest Observation</th>
          <th scope="col">Freshness</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  allMetrics.forEach(m => {
    let badgeClass = 'md-badge-ok';
    let statusText = 'Fresh';

    if (m.status === 'stale' || m.stale) {
      badgeClass = 'md-badge-stale';
      statusText = 'Stale';
    } else if (m.status === 'missing') {
      badgeClass = 'md-badge-error';
      statusText = 'No Data';
    }

    html += `
      <tr>
        <td class="col-metric">${m.tab}</td>
        <td class="col-metric"><strong>${m.metric}</strong></td>
        <td><code>${m.source}</code></td>
        <td class="num-cell">${formatDate(m.updated)}</td>
        <td><span class="md-badge ${badgeClass}">${statusText}</span></td>
        <td>${m.status.toUpperCase()}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// --- Polarity Cell Formatter ---
function getPolarityClass(val, polarity) {
  if (val === null || val === undefined || isNaN(val) || val === 0) {
    return '';
  }

  if (polarity === 'down_good') {
    // negative is good (green), positive is bad (pink)
    return val < 0 ? 'cell-good' : 'cell-bad';
  } else if (polarity === 'up_good') {
    // positive is good (green), negative is bad (pink)
    return val > 0 ? 'cell-good' : 'cell-bad';
  }
  return '';
}

// --- Helpers ---
function formatVal(v, isPrice) {
  if (v === null || v === undefined || isNaN(v)) return '–';
  return isPrice ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2);
}

function formatChange(v, isPrice) {
  if (v === null || v === undefined || isNaN(v)) return '–';
  const prefix = v > 0 ? '+' : '';
  const formatted = v.toFixed(2);
  return isPrice ? `${prefix}${formatted}%` : `${prefix}${formatted}`;
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === '–' || dateStr === '-') return '–';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [, yyyy, mm, dd] = m;
    return `${dd}/${mm}/${yyyy}`;
  }
  return dateStr;
}

function formatDateTime(str) {
  if (!str) return 'Pending automated pipeline run';
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  if (m) {
    const [, yyyy, mm, dd, rest] = m;
    return `${dd}/${mm}/${yyyy}${rest}`;
  }
  return str;
}

// --- Chart.js Yield Curve ---
function renderYieldCurveChart(parRatesSec, parYieldsSec) {
  const canvas = document.getElementById('chart-ust-curve');
  if (!canvas || typeof Chart === 'undefined') return;

  const maturities = ['1M', '2M', '3M', '4M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];
  const metricMap = {};

  const collect = (sec) => {
    if (sec && sec.metrics) {
      sec.metrics.forEach(m => {
        metricMap[m.label] = m;
      });
    }
  };

  collect(parRatesSec);
  collect(parYieldsSec);

  let thisDate = '';
  let baseDate = '';
  for (const k of maturities) {
    if (metricMap[k]) {
      if (metricMap[k].this_date && !thisDate) thisDate = formatDate(metricMap[k].this_date);
      if (metricMap[k].base_date && !baseDate) baseDate = formatDate(metricMap[k].base_date);
    }
  }
  const thisLabel = thisDate ? `This Week (${thisDate})` : 'This Week';
  const baseLabel = baseDate ? `Base (${baseDate})` : 'Base';

  const thisVals = maturities.map(m => metricMap[m] ? metricMap[m].this_value : null);
  const baseVals = maturities.map(m => metricMap[m] ? metricMap[m].base_value : null);

  if (yieldCurveChart) {
    yieldCurveChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  yieldCurveChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: maturities,
      datasets: [
        {
          label: thisLabel,
          data: thisVals,
          borderColor: '#8B6F47',
          backgroundColor: 'rgba(139, 111, 71, 0.1)',
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 4,
          pointBackgroundColor: '#8B6F47',
          fill: false,
        },
        {
          label: baseLabel,
          data: baseVals,
          borderColor: '#1C2A3A',
          borderDash: [5, 5],
          borderWidth: 1.8,
          tension: 0.25,
          pointRadius: 3,
          pointBackgroundColor: '#1C2A3A',
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 14,
            font: { family: "'Inter', sans-serif", size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ? ctx.parsed.y.toFixed(2) + '%' : '–'}`
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: 'Yield (%)', font: { size: 11 } },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 } },
          grid: { color: 'rgba(26, 22, 18, 0.06)' }
        },
        x: {
          ticks: { font: { family: "'Inter', sans-serif", size: 11, weight: '500' } },
          grid: { display: false }
        }
      }
    }
  });
}

// --- Chart.js G-Sec Yield Curve ---
function renderGSecCurveChart(gsecSec) {
  const canvas = document.getElementById('chart-gsec-curve');
  if (!canvas || typeof Chart === 'undefined') return;

  const maturities = ['1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '15Y', '20Y', '30Y'];
  const metricMap = {};

  if (gsecSec && gsecSec.metrics) {
    gsecSec.metrics.forEach(m => {
      // Map '10Y G-Sec (Benchmark)' -> '10Y'
      const labelClean = m.label.split(' ')[0].trim();
      metricMap[labelClean] = m;
    });
  }

  let thisDate = '';
  let baseDate = '';
  for (const k of maturities) {
    if (metricMap[k]) {
      if (metricMap[k].this_date && !thisDate) thisDate = formatDate(metricMap[k].this_date);
      if (metricMap[k].base_date && !baseDate) baseDate = formatDate(metricMap[k].base_date);
    }
  }
  const thisLabel = thisDate ? `This Week (${thisDate})` : 'This Week';
  const baseLabel = baseDate ? `Base (${baseDate})` : 'Base';

  const thisVals = maturities.map(m => metricMap[m] ? metricMap[m].this_value : null);
  const baseVals = maturities.map(m => metricMap[m] ? metricMap[m].base_value : null);

  if (gsecCurveChart) {
    gsecCurveChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  gsecCurveChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: maturities,
      datasets: [
        {
          label: thisLabel,
          data: thisVals,
          borderColor: '#8B6F47',
          backgroundColor: 'rgba(139, 111, 71, 0.1)',
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 4,
          pointBackgroundColor: '#8B6F47',
          fill: false,
        },
        {
          label: baseLabel,
          data: baseVals,
          borderColor: '#1C2A3A',
          borderDash: [5, 5],
          borderWidth: 1.8,
          tension: 0.25,
          pointRadius: 3,
          pointBackgroundColor: '#1C2A3A',
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 14,
            font: { family: "'Inter', sans-serif", size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ? ctx.parsed.y.toFixed(2) + '%' : '–'}`
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: 'Yield (%)', font: { size: 11 } },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 } },
          grid: { color: 'rgba(26, 22, 18, 0.06)' }
        },
        x: {
          ticks: { font: { family: "'Inter', sans-serif", size: 11, weight: '500' } },
          grid: { display: false }
        }
      }
    }
  });
}

// --- CSV Export ---
function initCsvExports(sectionsMap) {
  document.querySelectorAll('.md-btn-csv').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const exportTarget = btn.getAttribute('data-export');
      const tableWrapper = document.getElementById(exportTarget);
      if (!tableWrapper) return;

      const table = tableWrapper.querySelector('table');
      if (!table) return;

      let csvContent = '';
      const rows = table.querySelectorAll('tr');

      rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = [];
        cols.forEach(col => {
          let text = col.innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""').trim();
          rowData.push(`"${text}"`);
        });
        csvContent += rowData.join(',') + '\r\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${exportTarget}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
}
