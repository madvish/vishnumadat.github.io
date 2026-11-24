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
    lastUpdatedEl.textContent = data.generated_at_ist;
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
    const cycleDateStr = m.cycle_high_date ? `<span class="cycle-subdate">${m.cycle_high_date}</span>` : '';
    const thisVal = formatVal(m.this_value, isPrice);
    const lastVal = formatVal(m.last_value, isPrice);
    const baseVal = formatVal(m.base_value, isPrice);

    const changeVal = formatChange(m.change, isPrice);
    const ytdVal = formatChange(m.ytd, isPrice);

    const changeClass = getPolarityClass(m.change, m.polarity);
    const ytdClass = getPolarityClass(m.ytd, m.polarity);
    const staleTag = m.stale ? '<span class="stale-tag">STALE</span>' : '';

    html += `
      <tr>
        <td class="col-metric">${m.label} ${staleTag}</td>
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
        <td class="num-cell">${m.updated}</td>
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
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
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
          label: 'This Week',
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
          label: 'Base (1-Jan)',
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
          label: 'This Week',
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
          label: 'Base (1-Jan)',
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
