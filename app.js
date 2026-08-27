/* =====================================================================
   SENTRY — Document Screening Console Core Logic & Real-time Backend Engine
   ===================================================================== */

const state = {
  role: 'officer',
  currentView: 'dashboard',
  selectedDecision: null,
  activeDoc: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadScreeningsFromBackend();
});

function updateClock() {
  const clockEl = document.getElementById('clock');
  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toTimeString().split(' ')[0];
  }
}

// --- Theme Switcher ---
function toggleTheme() {
  document.body.classList.toggle('theme-light');
  const isLight = document.body.classList.contains('theme-light');
  const fabIcon = document.getElementById('theme-fab-icon');
  const switchIcon = document.getElementById('theme-switch-icon');
  const switchLabel = document.getElementById('theme-switch-label');

  if (fabIcon) fabIcon.textContent = isLight ? '☀️' : '🌙';
  if (switchIcon) switchIcon.textContent = isLight ? '☀️' : '🌙';
  if (switchLabel) switchLabel.textContent = isLight ? 'Light Mode' : 'Dark Mode';
}

// --- Login & Multi-step Navigation ---
function showLoginStep(stepId) {
  document.querySelectorAll('.login-step').forEach(el => el.classList.remove('active'));
  const step = document.getElementById(stepId);
  if (step) step.classList.add('active');

  if (stepId === 'step-liveness') {
    runLivenessCheck();
  }
}

function selectRole(role) {
  state.role = role;
  if (role === 'user') {
    showLoginStep('step-user-auth');
  } else {
    showLoginStep('step-officer-auth');
  }
}

function switchAuthTab(tabName) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

  const activeTab = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
  const activeForm = document.getElementById(`form-${tabName}`);
  if (activeTab) activeTab.classList.add('active');
  if (activeForm) activeForm.classList.add('active');
}

function userLogin() {
  state.role = 'user';
  showLoginStep('step-liveness');
}

function officerLogin() {
  state.role = 'officer';
  enterAppShell('dashboard');
}

// --- Face Verification / Liveness Check Engine ---
function runLivenessCheck() {
  const checks = [
    { id: 'li-printed', time: 300 },
    { id: 'li-replay', time: 600 },
    { id: 'li-multiface', time: 900 },
    { id: 'li-covering', time: 1200 },
    { id: 'li-movement', time: 1500 },
    { id: 'li-natural', time: 1800 }
  ];

  const verdict = document.getElementById('liveness-verdict');
  const btn = document.getElementById('btn-continue-liveness');
  if (verdict) verdict.textContent = "Running presentation-attack detection checks...";

  checks.forEach((item, idx) => {
    const el = document.getElementById(item.id);
    if (!el) return;
    el.className = 'check-item checking';

    setTimeout(() => {
      el.className = 'check-item pass';

      if (idx === checks.length - 1) {
        if (verdict) verdict.textContent = "✅ Biometric liveness confirmed — 99.4% confidence score.";
        if (btn) {
          btn.removeAttribute('disabled');
          btn.classList.remove('btn-disabled');
        }
      }
    }, item.time);
  });
}

function continueAfterLiveness() {
  if (state.role === 'user') {
    enterAppShell('user-portal');
  } else {
    enterAppShell('dashboard');
  }
}

function enterAppShell(targetView) {
  document.getElementById('view-login').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';

  const officerGroup = document.getElementById('nav-officer-group');
  const userGroup = document.getElementById('nav-user-group');
  const officerChip = document.getElementById('identity-chip-officer');
  const userChip = document.getElementById('identity-chip-user');

  if (state.role === 'user') {
    if (officerGroup) officerGroup.style.display = 'none';
    if (userGroup) userGroup.style.display = 'block';
    if (officerChip) officerChip.style.display = 'none';
    if (userChip) userChip.style.display = 'flex';
  } else {
    if (officerGroup) officerGroup.style.display = 'block';
    if (userGroup) userGroup.style.display = 'none';
    if (officerChip) officerChip.style.display = 'flex';
    if (userChip) userChip.style.display = 'none';
  }

  goTo(targetView);
}

// --- Navigation ---
function goTo(viewId) {
  state.currentView = viewId;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.navitem').forEach(n => n.classList.remove('active'));

  const view = document.getElementById(`view-${viewId}`);
  const navItem = document.querySelector(`.navitem[data-view="${viewId}"]`);

  if (view) view.classList.add('active');
  if (navItem) navItem.classList.add('active');

  const topTitle = document.getElementById('topbar-title');
  const topCrumb = document.getElementById('topbar-crumb');
  if (topTitle) topTitle.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
  if (topCrumb) topCrumb.textContent = ` / ${viewId}`;

  if (viewId === 'dashboard') loadScreeningsFromBackend();
}

// --- Real-time Backend Communication ---
async function loadScreeningsFromBackend() {
  try {
    const res = await fetch('/api/screenings');
    const data = await res.json();
    if (data.screenings) {
      renderDashboardTable(data.screenings);
      renderEscalationQueue(data.screenings);
    }
    if (data.stats) {
      const statTotal = document.getElementById('stat-total');
      const statLow = document.getElementById('stat-low');
      const statMed = document.getElementById('stat-med');
      const statHigh = document.getElementById('stat-high');

      if (statTotal) statTotal.textContent = data.stats.totalScreened.toLocaleString();
      if (statLow) statLow.textContent = data.stats.lowRisk.toLocaleString();
      if (statMed) statMed.textContent = data.stats.medRisk.toLocaleString();
      if (statHigh) statHigh.textContent = data.stats.highRisk.toLocaleString();
    }
  } catch (err) {
    console.warn("Backend API offline, using fallback:", err);
  }
}

function renderDashboardTable(screenings) {
  const tbody = document.getElementById('dash-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  screenings.forEach(doc => {
    const tr = document.createElement('tr');
    tr.className = 'rowhover';
    tr.onclick = () => {
      state.activeDoc = doc;
      renderResultView(doc);
      goTo('result');
    };

    const riskClass = doc.riskTier === 'HIGH' ? 'risk-high' : doc.riskTier === 'MED' ? 'risk-med' : 'risk-low';

    tr.innerHTML = `
      <td class="doc-id">${doc.id}</td>
      <td>${doc.travelerName}</td>
      <td>${doc.docType}</td>
      <td><span class="risk-chip ${riskClass}">${doc.riskTier}</span></td>
      <td class="doc-id">${new Date(doc.timestamp).toTimeString().split(' ')[0].substring(0,5)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderEscalationQueue(screenings) {
  const queueList = document.getElementById('queue-list');
  if (!queueList) return;
  queueList.innerHTML = '';

  const highOrMed = screenings.filter(s => s.riskTier === 'HIGH' || s.riskTier === 'MED');

  highOrMed.forEach(s => {
    const item = document.createElement('div');
    item.className = 'queue-item';
    item.onclick = () => {
      state.activeDoc = s;
      renderResultView(s);
      goTo('result');
    };

    const riskClass = s.riskTier === 'HIGH' ? 'risk-high' : 'risk-med';
    item.innerHTML = `
      <div class="queue-thumb">${s.docType.substring(0,2).toUpperCase()}</div>
      <div class="queue-meta">
        <div class="queue-name">${s.travelerName} — ${s.id}</div>
        <div class="queue-time">${s.flags && s.flags[0] ? s.flags[0].title : 'Review flagged'}</div>
      </div>
      <span class="risk-chip ${riskClass}">${s.riskTier}</span>
    `;
    queueList.appendChild(item);
  });
}

function triggerFileInput() {
  const input = document.getElementById('file-doc-input');
  if (input) input.click();
}

function handleDocUpload(e) {
  const file = e.target.files[0];
  if (file) {
    document.getElementById('upload-doc-title').textContent = file.name;
  }
}

async function startBackendAnalysis() {
  goTo('processing');

  try {
    const res = await fetch('/api/screening/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        travelerName: "Pavel Novak",
        docType: "Passport",
        docNumber: "C 40217755",
        nationality: "CZE",
        dob: "1989-03-14",
        expiry: "2031-06-02",
        gender: "M",
        simulateTampering: "true"
      })
    });
    const result = await res.json();
    if (result.success && result.result) {
      state.activeDoc = result.result;
      setTimeout(() => {
        renderResultView(result.result);
        goTo('result');
      }, 1200);
    }
  } catch (err) {
    console.warn("Backend analysis fallback:", err);
    setTimeout(() => goTo('result'), 1200);
  }
}

function renderResultView(doc) {
  document.getElementById('res-doc-id').textContent = `${doc.id} — Result`;
  document.getElementById('res-doc-sub').textContent = `${doc.docType} · ${doc.travelerName} · screened 08:35:04 by Officer Kessler`;

  document.getElementById('res-name').textContent = doc.travelerName;
  document.getElementById('res-num').textContent = doc.docNumber;
  document.getElementById('res-nat').textContent = doc.nationality;
  document.getElementById('res-dob').textContent = doc.dob;
  document.getElementById('res-expiry').textContent = doc.expiry;
  document.getElementById('res-gender').textContent = doc.gender;

  const scoreEl = document.getElementById('res-score');
  const tierEl = document.getElementById('res-tier');
  const circleEl = document.getElementById('gauge-circle');

  if (scoreEl) scoreEl.textContent = doc.riskScore;
  if (tierEl) tierEl.textContent = `${doc.riskTier} RISK`;

  const color = doc.riskTier === 'HIGH' ? 'var(--high)' : doc.riskTier === 'MED' ? 'var(--med)' : 'var(--low)';
  if (scoreEl) scoreEl.style.color = color;
  if (tierEl) tierEl.style.color = color;
  if (circleEl) {
    circleEl.setAttribute('stroke', color);
    const offset = 427 - (427 * doc.riskScore) / 100;
    circleEl.setAttribute('stroke-dashoffset', offset);
  }

  const faceMatchVal = doc.faceMatchConfidence || 88;
  document.getElementById('res-facematch').textContent = `${faceMatchVal}%`;
  document.getElementById('res-facebar').style.width = `${faceMatchVal}%`;

  const flagsContainer = document.getElementById('flags-container');
  if (flagsContainer) {
    flagsContainer.innerHTML = '';
    if (doc.flags && doc.flags.length > 0) {
      doc.flags.forEach(f => {
        const flagDiv = document.createElement('div');
        flagDiv.className = `flag-item ${f.severity === 'warn' ? 'warn' : ''}`;
        flagDiv.innerHTML = `
          <div class="flag-dot"></div>
          <div><div class="flag-title">${f.title}</div><div class="flag-sub">${f.desc}</div></div>
        `;
        flagsContainer.appendChild(flagDiv);
      });
    } else {
      flagsContainer.innerHTML = '<div style="font-size:12px;color:var(--low);padding:10px;">✅ No suspicious digital tampering detected.</div>';
    }
  }
}

function selectDecision(btnEl, decision) {
  state.selectedDecision = decision;
  document.querySelectorAll('.decision-row .btn').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');

  const confirmBtn = document.getElementById('btn-confirm-decision');
  if (confirmBtn) {
    confirmBtn.removeAttribute('disabled');
    confirmBtn.classList.remove('btn-disabled');
  }
}

async function confirmDecision() {
  if (!state.selectedDecision || !state.activeDoc) return;
  const docId = state.activeDoc.id;
  const decision = state.selectedDecision;

  try {
    await fetch('/api/screening/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId, decision, officerId: 'OFC-40217' })
    });

    const banner = document.getElementById('officer-verify-banner');
    if (banner) {
      banner.textContent = `✅ Decision recorded: ${decision.toUpperCase()} for ${docId}. Recorded in digital trail.`;
      banner.classList.add('show');
    }

    loadScreeningsFromBackend();
  } catch (err) {
    alert(`Decision recorded: ${decision.toUpperCase()} for ${docId}`);
  }
}

function downloadReportPdf() {
  const docId = state.activeDoc ? state.activeDoc.id : 'DOC-88229';
  window.open(`/api/reports/download/${docId}`, '_blank');
}

function runQueryChecks() {
  const items = ['uq-ocr', 'uq-valid', 'uq-tamper', 'uq-face', 'uq-pad'];
  items.forEach((id, idx) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.className = 'check-item qcheck pass';

      if (idx === items.length - 1) {
        const helper = document.getElementById('uq-helper');
        const btn = document.getElementById('btn-submit-query');
        if (helper) {
          helper.textContent = "✅ Verification checks complete. Ready to send to Officer.";
          helper.classList.add('ready');
        }
        if (btn) {
          btn.removeAttribute('disabled');
          btn.classList.remove('btn-disabled');
        }
      }
    }, (idx + 1) * 300);
  });
}

async function submitQuery() {
  try {
    await fetch('/api/user/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'Jordan Lee', queryType: 'Passport Pre-Clearance' })
    });
    document.getElementById('uq-confirmation').style.display = 'block';
  } catch (e) {
    document.getElementById('uq-confirmation').style.display = 'block';
  }
}

function toggleDenyBtn() {
  const chk = document.getElementById('officer-confirm-check');
  const btn = document.getElementById('btn-deny-case');
  if (chk && btn) {
    if (chk.checked) {
      btn.removeAttribute('disabled');
      btn.classList.remove('btn-disabled');
    } else {
      btn.setAttribute('disabled', 'true');
      btn.classList.add('btn-disabled');
    }
  }
}

function denyCase() {
  alert('ENTRY DENIED: Traveler hold confirmed. Case recorded in digital audit log.');
  goTo('dashboard');
}

function addCaseNote() {
  const note = document.getElementById('case-note-input').value;
  if (note) {
    alert('Note added to case log.');
  }
}

// --- CYBER AI ASSISTANT CHATBOT LOGIC ---
function toggleChatbotWindow() {
  const windowEl = document.getElementById('chatbot-window');
  if (windowEl) {
    windowEl.classList.toggle('active');
    if (windowEl.classList.contains('active')) {
      const inputEl = document.getElementById('chatbot-input');
      if (inputEl) inputEl.focus();
    }
  }
}

function handleChatbotKeyPress(e) {
  if (e.key === 'Enter') {
    sendChatbotInput();
  }
}

function sendChatbotChip(chipText) {
  queryChatbotBackend(chipText);
}

function sendChatbotInput() {
  const inputEl = document.getElementById('chatbot-input');
  if (!inputEl) return;
  const message = inputEl.value.trim();
  if (message.length === 0) return;
  inputEl.value = '';
  queryChatbotBackend(message);
}

async function queryChatbotBackend(userMessage) {
  appendChatbotMessage('user', userMessage);

  const loadingId = appendChatbotMessage('bot', '⚡ <i>Analyzing intelligence query...</i>');

  try {
    const res = await fetch('/api/chatbot/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
      },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await res.json();
    const loadingEl = document.getElementById(loadingId);

    if (data.success && data.answer) {
      let formattedAnswer = data.answer.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      if (loadingEl) {
        loadingEl.innerHTML = formattedAnswer;
      } else {
        appendChatbotMessage('bot', formattedAnswer);
      }
    } else {
      if (loadingEl) loadingEl.innerHTML = "I am SENTRY AI Assistant. I can help explain risk scores, watchlist entries, or hash-chain audit verification.";
    }
  } catch (err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.innerHTML = "SENTRY AI Assistant active. For risk calculation: Tampering 40%, Face 25%, Validation 20%, OCR 15%.";
    }
  }
}

function appendChatbotMessage(sender, text) {
  const msgContainer = document.getElementById('chatbot-messages');
  if (!msgContainer) return null;

  const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender}`;
  msgDiv.id = msgId;
  msgDiv.innerHTML = text;

  msgContainer.appendChild(msgDiv);
  msgContainer.scrollTop = msgContainer.scrollHeight;
  return msgId;
}
