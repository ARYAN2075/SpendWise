const API = "https://spendwise-production-8c27.up.railway.app";

function setToken(t)  { localStorage.setItem("token", t) }
function getToken()   { return localStorage.getItem("token") }
function logout()     { localStorage.removeItem("token"); navigate("/") }

const app = document.getElementById("app")

function navigate(p) { location.hash = p; render() }

function render() {
  const r = location.hash.slice(1) || "/"
  if (r === "/")          landing()
  if (r === "/login")     login()
  if (r === "/signup")    signup()
  if (r === "/dashboard") dashboard()
}

// ── Currency formatter (Indian system, ₹) ──────────────────────
function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return "₹0"
  const abs = Math.abs(n)
  if (abs >= 10000000) return `₹${(abs / 10000000).toFixed(2)} Cr`
  if (abs >= 100000)   return `₹${(abs / 100000).toFixed(2)} L`
  if (abs >= 1000)     return `₹${(abs / 1000).toFixed(1)}K`
  return `₹${abs.toLocaleString('en-IN')}`
}

// ── Today's date string ────────────────────────────────────────
function today() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Active nav helper ──────────────────────────────────────────
function setActive(id) {
  document.querySelectorAll('.nav').forEach(n => n.classList.remove('active'))
  const el = document.getElementById(id)
  if (el) el.classList.add('active')
}

// ============================================================
// LANDING
// ============================================================
function landing() {
  app.innerHTML = `
    <div class="landing">
      <nav class="l-nav">
        <div class="l-logo">Spend<span>Wise</span></div>
        <div class="l-nav-links">
          <button class="btn-secondary" onclick="navigate('/login')">Sign in</button>
          <button class="btn-primary"   onclick="navigate('/signup')">Get started</button>
        </div>
      </nav>

      <div class="l-hero">
        <div class="l-label">Personal Finance Tracker</div>
        <h1 class="l-title">Know where every<br><span class="accent">rupee</span> goes.</h1>
        <p class="l-sub">A clean, focused dashboard to track income, expenses, and balance. No noise — just your numbers.</p>
        <div class="l-actions">
          <button class="btn-primary"   onclick="navigate('/signup')">Create account</button>
          <button class="btn-secondary" onclick="navigate('/login')">Sign in</button>
        </div>
      </div>

      <div class="l-footer-strip">
        <div class="l-stat">
          <div class="l-stat-val">10+</div>
          <div class="l-stat-lbl">Categories</div>
        </div>
        <div class="l-stat">
          <div class="l-stat-val">₹∞</div>
          <div class="l-stat-lbl">Tracked</div>
        </div>
        <div class="l-stat">
          <div class="l-stat-val">2</div>
          <div class="l-stat-lbl">Chart views</div>
        </div>
      </div>
    </div>
  `
}

// ============================================================
// SIGNUP
// ============================================================
function signup() {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-box">
        <div class="auth-logo">Spend<span>Wise</span></div>
        <div class="auth-title">Create account</div>
        <div class="auth-hint">Start tracking your finances today.</div>
        <div class="field">
          <label class="field-label">Email address</label>
          <input id="email" type="email" placeholder="you@example.com">
        </div>
        <div class="field">
          <label class="field-label">Password</label>
          <input id="password" type="password" placeholder="Min. 8 characters">
        </div>
        <div id="auth-error" style="color:#f75f5f;font-size:13px;margin-top:4px;display:none;"></div>
        <button class="auth-submit" onclick="register()">Create account</button>
      </div>
    </div>
  `
}

async function register() {
  const email    = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const errEl    = document.getElementById("auth-error")
  errEl.style.display = "none"

  if (!email || !password) {
    errEl.textContent = "Please fill in all fields."
    errEl.style.display = "block"
    return
  }

  try {
    const res = await fetch(API + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      errEl.textContent = data.detail || "Registration failed. Please try again."
      errEl.style.display = "block"
      return
    }
    navigate("/login")
  } catch (err) {
    errEl.textContent = "Network error. Please check your connection."
    errEl.style.display = "block"
  }
}

// ============================================================
// LOGIN
// ============================================================
function login() {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-box">
        <div class="auth-logo">Spend<span>Wise</span></div>
        <div class="auth-title">Welcome back</div>
        <div class="auth-hint">Sign in to your dashboard.</div>
        <div class="field">
          <label class="field-label">Email address</label>
          <input id="email" type="email" placeholder="you@example.com">
        </div>
        <div class="field">
          <label class="field-label">Password</label>
          <input id="password" type="password" placeholder="••••••••">
        </div>
        <div id="auth-error" style="color:#f75f5f;font-size:13px;margin-top:4px;display:none;"></div>
        <button class="auth-submit" onclick="loginUser()">Sign in</button>
      </div>
    </div>
  `
}

async function loginUser() {
  const email    = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const errEl    = document.getElementById("auth-error")
  errEl.style.display = "none"

  if (!email || !password) {
    errEl.textContent = "Please fill in all fields."
    errEl.style.display = "block"
    return
  }

  try {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      errEl.textContent = data.detail || "Invalid email or password."
      errEl.style.display = "block"
      return
    }

    const data = await res.json()
    if (!data.access_token) {
      errEl.textContent = "Login failed. No token received."
      errEl.style.display = "block"
      return
    }

    setToken(data.access_token)
    navigate("/dashboard")
  } catch (err) {
    errEl.textContent = "Network error. Please check your connection."
    errEl.style.display = "block"
  }
}

// ============================================================
// DASHBOARD SHELL
// ============================================================
function dashboard() {
  // ── Auth guard: redirect to login if no token ──
  if (!getToken()) {
    navigate("/login")
    return
  }

  app.innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="sb-header">
          <div class="sb-logo">Spend<span>Wise</span></div>
        </div>

        <div class="sb-body">
          <div class="sb-section">Main</div>

          <div class="nav" id="nav-overview" onclick="loadDashboard()">
            <div class="nav-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1.5"/>
                <rect x="14" y="3" width="7" height="5" rx="1.5"/>
                <rect x="14" y="12" width="7" height="9" rx="1.5"/>
                <rect x="3" y="16" width="7" height="5" rx="1.5"/>
              </svg>
            </div>
            Overview
          </div>

          <div class="nav" id="nav-add" onclick="addTransaction()">
            <div class="nav-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8"  y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            Add Transaction
          </div>
        </div>

        <div class="sb-footer">
          <div class="nav nav-danger" onclick="logout()">
            <div class="nav-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            Sign out
          </div>
        </div>
      </aside>

      <div class="main" id="main"></div>
    </div>
  `
  loadDashboard()
}

// ============================================================
// LOAD DASHBOARD (with error handling + auth guard)
// ============================================================
async function loadDashboard() {
  setActive('nav-overview')
  const main = document.getElementById("main")
  if (!main) return

  // Show loading state
  main.innerHTML = `
    <div style="padding:2rem;color:#8b949e;display:flex;align-items:center;gap:10px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Loading overview...
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg) } }</style>
  `

  try {
    const headers = { Authorization: "Bearer " + getToken() }
    const [sRes, tRes] = await Promise.all([
      fetch(API + "/analytics/summary", { headers }),
      fetch(API + "/transactions/",     { headers })
    ])

    // Token expired or invalid → redirect to login
    if (sRes.status === 401 || tRes.status === 401) {
      logout()
      return
    }

    if (!sRes.ok || !tRes.ok) {
      throw new Error(`Server error: ${sRes.status} / ${tRes.status}`)
    }

    const summary = await sRes.json()
    const tx      = await tRes.json()

    main.innerHTML = `
      <div class="rise-in">

        <div class="pg-head">
          <div>
            <div class="pg-title">Overview</div>
            <div class="pg-sub">${today()}</div>
          </div>
        </div>

        <div class="cards">
          <div class="card c-income">
            <div class="card-tag">Total income</div>
            <div class="card-val">${fmt(summary.total_income)}</div>
          </div>
          <div class="card c-expense">
            <div class="card-tag">Total expenses</div>
            <div class="card-val">${fmt(summary.total_expense)}</div>
          </div>
          <div class="card c-balance">
            <div class="card-tag">Net balance</div>
            <div class="card-val">${fmt(summary.balance)}</div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-panel">
            <div class="chart-panel-title">Income vs Expenses</div>
            <div class="chart-panel-sub">Allocation breakdown</div>
            <canvas id="financeChart"></canvas>
          </div>
          <div class="chart-panel">
            <div class="chart-panel-title">By Category</div>
            <div class="chart-panel-sub">Spending distribution</div>
            <canvas id="categoryChart"></canvas>
          </div>
        </div>

        <div class="tx-panel">
          <div class="tx-panel-head">
            <div class="tx-panel-title">Transactions</div>
            <div class="tx-badge">${Array.isArray(tx) ? tx.length : 0} records</div>
          </div>

          ${!Array.isArray(tx) || tx.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <div class="empty-msg">No transactions yet. Add one to get started.</div>
            </div>
          ` : `
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${tx.map(t => `
                <tr>
                  <td><span class="td-amount ${t.type}">${t.type === 'income' ? '+' : '−'} ${fmt(t.amount)}</span></td>
                  <td><span class="td-pill ${t.type}">${t.type}</span></td>
                  <td><span class="td-cat">${t.category}</span></td>
                  <td><span class="td-desc">${t.description || '—'}</span></td>
                  <td><button class="btn-del" onclick="deleteTx(${t.id})">Delete</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          `}
        </div>

      </div>
    `

    createCharts(summary, tx)

  } catch (err) {
    console.error("Dashboard load error:", err)
    main.innerHTML = `
      <div style="padding:2rem;">
        <div style="color:#f75f5f;font-size:15px;margin-bottom:8px;">⚠️ Failed to load overview.</div>
        <div style="color:#8b949e;font-size:13px;margin-bottom:16px;">${err.message || "An unexpected error occurred."}</div>
        <button class="btn-primary" onclick="loadDashboard()">Try again</button>
      </div>
    `
  }
}

// ============================================================
// CHARTS
// ============================================================
function createCharts(summary, tx) {
  const legendCfg = {
    labels: {
      color: '#8b949e',
      font: { family: "'IBM Plex Mono', monospace", size: 11 },
      padding: 16,
      usePointStyle: true,
      pointStyle: 'circle',
      boxWidth: 8, boxHeight: 8
    }
  }
  const tooltipCfg = {
    backgroundColor: '#1c2333',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    titleColor: '#e6edf3',
    bodyColor: '#8b949e',
    titleFont: { family: "'Syne', sans-serif", size: 13, weight: '600' },
    bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
    padding: 12,
    callbacks: { label: ctx => `  ${fmt(ctx.raw)}` }
  }

  const financeEl = document.getElementById("financeChart")
  const categoryEl = document.getElementById("categoryChart")
  if (!financeEl || !categoryEl) return

  new Chart(financeEl, {
    type: "doughnut",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        data: [summary.total_income || 0, summary.total_expense || 0],
        backgroundColor: ["rgba(61,214,140,0.8)", "rgba(247,95,95,0.8)"],
        borderColor: "#161b22",
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      cutout: '70%',
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: legendCfg, tooltip: { ...tooltipCfg } }
    }
  })

  const cats = {}
  if (Array.isArray(tx)) {
    tx.forEach(t => {
      if (!cats[t.category]) cats[t.category] = 0
      cats[t.category] += t.amount
    })
  }

  const palette = [
    'rgba(79,142,247,0.85)',
    'rgba(61,214,140,0.85)',
    'rgba(247,95,95,0.85)',
    'rgba(167,139,250,0.85)',
    'rgba(245,158,11,0.85)',
    'rgba(244,114,182,0.85)',
    'rgba(52,211,153,0.85)',
    'rgba(251,146,60,0.85)',
    'rgba(94,234,212,0.85)',
    'rgba(148,163,184,0.85)'
  ]

  new Chart(categoryEl, {
    type: "pie",
    data: {
      labels: Object.keys(cats),
      datasets: [{
        data: Object.values(cats),
        backgroundColor: palette,
        borderColor: "#161b22",
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: legendCfg, tooltip: { ...tooltipCfg } }
    }
  })
}

// ============================================================
// ADD TRANSACTION
// ============================================================
function addTransaction() {
  setActive('nav-add')

  document.getElementById("main").innerHTML = `
    <div class="rise-in">
      <div class="pg-head">
        <div>
          <div class="pg-title">Add Transaction</div>
          <div class="pg-sub">Record a new entry</div>
        </div>
      </div>

      <div class="form-wrap">
        <div class="form-panel">

          <div class="field">
            <label class="field-label">Amount (₹)</label>
            <input id="amount" type="number" placeholder="0.00" min="0" step="0.01">
          </div>

          <div class="form-grid-2">
            <div class="field">
              <label class="field-label">Type</label>
              <select id="type">
                <option value="income">↑ Income</option>
                <option value="expense">↓ Expense</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Category</label>
              <select id="category">
                <option value="Salary">💰 Salary</option>
                <option value="Freelance">💻 Freelance</option>
                <option value="Investment">📈 Investment</option>
                <option value="Gift">🎁 Gift</option>
                <option value="Food">🍔 Food</option>
                <option value="Transport">🚗 Transport</option>
                <option value="Shopping">🛒 Shopping</option>
                <option value="Bills">💡 Bills</option>
                <option value="Entertainment">🎬 Entertainment</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label class="field-label">Description</label>
            <input id="description" placeholder="Optional note">
          </div>

          <div id="form-error" style="color:#f75f5f;font-size:13px;margin-top:4px;display:none;"></div>
          <button class="form-submit" onclick="saveTransaction()">Save transaction</button>
        </div>
      </div>
    </div>
  `
}

async function saveTransaction() {
  const amount      = parseFloat(document.getElementById("amount").value)
  const type        = document.getElementById("type").value
  const category    = document.getElementById("category").value
  const description = document.getElementById("description").value
  const errEl       = document.getElementById("form-error")
  errEl.style.display = "none"

  if (!amount || amount <= 0) {
    errEl.textContent = "Please enter a valid amount."
    errEl.style.display = "block"
    return
  }

  try {
    const res = await fetch(API + "/transactions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken()
      },
      body: JSON.stringify({ amount, type, category, description })
    })

    if (res.status === 401) { logout(); return }
    if (!res.ok) throw new Error(`Server error: ${res.status}`)

    loadDashboard()
  } catch (err) {
    errEl.textContent = "Failed to save transaction. Please try again."
    errEl.style.display = "block"
    console.error("Save error:", err)
  }
}

async function deleteTx(id) {
  try {
    const res = await fetch(API + "/transactions/" + id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + getToken() }
    })
    if (res.status === 401) { logout(); return }
    loadDashboard()
  } catch (err) {
    console.error("Delete error:", err)
  }
}

window.addEventListener("hashchange", render)
render()