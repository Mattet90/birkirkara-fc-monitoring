/* ═══════════════════════════════════════════════════════════════
   RAVENNA FC – Monitoraggio Atletico 2026/27
   app.js – Logica principale
═══════════════════════════════════════════════════════════════ */

/* ─── CONFIG FOGLI GOOGLE ─── */
const RPE_SHEET_ID  = '1CgUuCPakmhgif-cIJI0PSeFqvFQy-QBFldpGfr9A1KE';
const WELL_SHEET_ID = '1pOCUqz8usBdnt18N08Nd2XjMDgaxFN2FIu2HfPKAGqY';

/* ─── ROSTER ─── */
const PLAYERS = [
  'Rossi M.','Bianchi L.','Ferrari A.','Russo G.','Esposito F.',
  'Romano D.','Colombo S.','Ricci P.','Marino T.','Greco V.',
  'Bruno C.','Gallo R.','Conti E.','Mancini A.','Fontana B.'
];

const DAYS   = ['MD+1','MD+2','MD+3','MD-3','MD-2','MD-1','MD'];
const WDIMS  = ['sleep','muscle','fatigue','stress','motivation'];
const WLBLS  = ['Sonno','Dolori','Stanchezza','Stress','Motivazione'];
const WTEXT  = ['','Ottimo','Buono','Normale','Scarso','Molto scarso','Pessimo','Pessimo'];

const PAGE_TITLES = {
  overview:'Overview', sync:'Google Forms',
  rpe:'RPE & Training Load', wellness:'Wellness',
  gps:'GPS', fc:'Frequenza Cardiaca',
  acwr:'ACWR & Indici', players:'Giocatori',
  import:'Import GPS / FC'
};

/* ─── STATO GLOBALE ─── */
const charts = {};
const syncLogs   = [];
const importLogs = [];
let connRPE  = false;
let connWell = false;
let wellInput = { sleep:0, muscle:0, fatigue:0, stress:0, motivation:0 };
let curITab = 'gps';
const parsedFiles = {};

let S = {
  rpeData:   {},   // { player: { 'MD-1': {rpe, min, tl} } }
  rpeSrc:    {},   // { player: { 'MD-1': 'live'|'manual'|'demo' } }
  fcData:    {},   // { player: {z1..z5, tl} }
  wellData:  {},   // { player: {sleep,muscle,fatigue,stress,motivation,hi} }
  wellSrc:   {},   // { player: 'live'|'manual'|'demo' }
  gpsData:   []    // [ {p, dist, dmin, hsr, v20, v25, acc, dec, nacc, vmax, rpe, min} ]
};

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function init() {
  document.getElementById('sessDate').value = new Date().toISOString().split('T')[0];
  generateDemoData();
  populateSelects();
  renderImportContent();
  renderSyncLog();
  renderImportLog();
  renderOverview();
}

function generateDemoData() {
  PLAYERS.forEach(p => {
    S.rpeData[p] = {};
    S.rpeSrc[p]  = {};
    DAYS.forEach(d => {
      const r = rv(4, 9), m = rv(45, 100);
      S.rpeData[p][d] = { rpe: rnd(r), min: Math.round(m), tl: Math.round(r * m) };
      S.rpeSrc[p][d]  = 'demo';
    });
    S.fcData[p] = {
      z5: Math.round(rv(5,15)), z4: Math.round(rv(10,25)),
      z3: Math.round(rv(8,18)), z2: Math.round(rv(3,10)), z1: Math.round(rv(0,5))
    };
    S.fcData[p].tl = S.fcData[p].z5*5 + S.fcData[p].z4*4 + S.fcData[p].z3*3 + S.fcData[p].z2*2 + S.fcData[p].z1;
    S.wellData[p] = {
      sleep: Math.round(rv(1,5)), muscle: Math.round(rv(1,5)),
      fatigue: Math.round(rv(1,5)), stress: Math.round(rv(1,4)),
      motivation: Math.round(rv(1,5))
    };
    S.wellData[p].hi = WDIMS.reduce((s,k) => s + S.wellData[p][k], 0);
    S.wellSrc[p] = 'demo';
  });
  S.gpsData = PLAYERS.map(p => ({
    p, dist: Math.round(rv(8000,14000)), dmin: rnd(rv(80,140)),
    hsr: Math.round(rv(600,2200)), v20: Math.round(rv(200,900)),
    v25: Math.round(rv(50,400)),   acc: Math.round(rv(300,900)),
    dec: Math.round(rv(300,900)),  nacc: Math.round(rv(30,80)),
    vmax: rnd(rv(25,36)),          rpe: rnd(rv(5,9)),
    min: Math.round(rv(60,95))
  }));
}

function populateSelects() {
  const opts = PLAYERS.map(p => `<option>${p}</option>`).join('');
  ['rpePlayer','wellPlayer','playerSel','inp_player','fc_player'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function rnd(v, d=1)   { return parseFloat((+v).toFixed(d)); }
function rv(a, b)      { return rnd(a + Math.random() * (b - a)); }
function destroyC(id)  { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

function getTL(p)      { return Object.values(S.rpeData[p]).reduce((s,d) => s + d.tl, 0); }
function totalTL()     { return PLAYERS.reduce((s,p) => s + getTL(p), 0); }

function getMonotony(p) {
  const tls = Object.values(S.rpeData[p]).map(d => d.tl);
  const avg = tls.reduce((a,b) => a+b, 0) / tls.length;
  const sd  = Math.sqrt(tls.reduce((s,v) => s + Math.pow(v-avg,2), 0) / tls.length) || 1;
  return rnd(avg / sd);
}
function getFatigue(p)  { return rnd(getTL(p) * getMonotony(p), 0); }
function getACWR(p) {
  const tls    = Object.values(S.rpeData[p]).map(d => d.tl);
  const acute  = tls.reduce((a,b) => a+b, 0) / 7;
  const chronic= tls.reduce((a,b) => a+b, 0) / (tls.length || 1);
  return rnd(acute / chronic);
}

function riskBadge(v) {
  if (v > 1.5) return `<span class="badge badge-red">Alto rischio</span>`;
  if (v > 1.3) return `<span class="badge badge-amber">Attenzione</span>`;
  if (v < 0.8) return `<span class="badge badge-blue">Sotto-carico</span>`;
  return `<span class="badge badge-green">Ottimale</span>`;
}
function srcTag(src) {
  if (src === 'live')   return `<span class="src-live">● live</span>`;
  if (src === 'manual') return `<span class="src-manual">● man</span>`;
  return `<span class="src-demo">● demo</span>`;
}
function hiClass(hi)   { return hi >= 25 ? 'c-red' : hi >= 18 ? 'c-amber' : 'c-green'; }
function acwrClass(v)  { return (v > 1.3 || v < 0.8) ? 'c-amber' : 'c-green'; }

/* ═══════════════════════════════════════════
   NAVIGAZIONE
═══════════════════════════════════════════ */
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[id] || id;
  closeSidebar();
  setTimeout(() => renderPage(id), 40);
}

function renderPage(id) {
  const map = {
    overview: renderOverview, sync: renderSync,
    rpe: renderRPE, wellness: renderWellness,
    gps: renderGPS, fc: renderFC,
    acwr: renderACWR, players: renderPlayer,
    import: renderImportPage
  };
  (map[id] || Function)();
}

/* ─── Mobile sidebar ─── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

/* ═══════════════════════════════════════════
   GOOGLE SHEETS SYNC
═══════════════════════════════════════════ */
function connectRPE() {
  connRPE = true;
  setDot('dotRPE', 'ok'); setDot('dotRPE2', 'ok');
  const badge = document.getElementById('rpeBadge');
  if (badge) { badge.textContent = 'Connesso'; badge.className = 'badge badge-green'; }
  const info = document.getElementById('rpeConnInfo');
  if (info) info.style.display = 'block';
  addSyncLog('RPE Forms', 'Collegato', 0, 'ok');
}
function connectWell() {
  connWell = true;
  setDot('dotWell', 'ok'); setDot('dotWell2', 'ok');
  const badge = document.getElementById('wellBadge');
  if (badge) { badge.textContent = 'Connesso'; badge.className = 'badge badge-green'; }
  const info = document.getElementById('wellConnInfo');
  if (info) info.style.display = 'block';
  addSyncLog('Wellness Forms', 'Collegato', 0, 'ok');
}

function setDot(id, state) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'sync-dot';
  if (state) el.classList.add(state);
}

async function syncAll() {
  const btn = document.getElementById('syncBtn');
  btn.innerHTML = '<i class="ti ti-refresh spin"></i> Sync...';
  btn.disabled = true;

  let rpeUpdated = 0, wellUpdated = 0;
  const md = document.getElementById('sessMD')?.value || 'MD-1';

  /* ── RPE Sheet ── */
  try {
    const url  = `https://docs.google.com/spreadsheets/d/${RPE_SHEET_ID}/gviz/tq?tqx=out:csv`;
    const resp = await fetch(url);
    if (resp.ok) {
      const txt  = await resp.text();
      const rows = Papa.parse(txt, { header:true, skipEmptyLines:true }).data;
      rows.forEach(row => {
        const keys  = Object.keys(row);
        const nome  = (row[keys[1]] || '').trim();
        const rpeV  = parseFloat(row[keys[2]]) || 0;
        if (!nome || !rpeV) return;
        const p = PLAYERS.find(pl => pl.toLowerCase() === nome.toLowerCase()) || nome;
        if (!S.rpeData[p])  S.rpeData[p]  = {};
        if (!S.rpeSrc[p])   S.rpeSrc[p]   = {};
        const gpsRow = S.gpsData.find(g => g.p === p);
        const min    = gpsRow?.min || 75;
        S.rpeData[p][md] = { rpe: rpeV, min, tl: Math.round(rpeV * min) };
        S.rpeSrc[p][md]  = 'live';
        rpeUpdated++;
      });
    }
  } catch(e) { /* foglio non raggiungibile */ }

  /* ── Wellness Sheet ── */
  try {
    const url  = `https://docs.google.com/spreadsheets/d/${WELL_SHEET_ID}/gviz/tq?tqx=out:csv`;
    const resp = await fetch(url);
    if (resp.ok) {
      const txt  = await resp.text();
      const rows = Papa.parse(txt, { header:true, skipEmptyLines:true }).data;
      rows.forEach(row => {
        const keys = Object.keys(row);
        const nome = (row[keys[1]] || '').trim();
        if (!nome) return;
        const p = PLAYERS.find(pl => pl.toLowerCase() === nome.toLowerCase()) || nome;
        if (!S.wellData[p]) S.wellData[p] = { sleep:3, muscle:3, fatigue:3, stress:3, motivation:3, hi:15 };
        S.wellData[p].sleep      = parseInt(row[keys[2]]) || S.wellData[p].sleep;
        S.wellData[p].muscle     = parseInt(row[keys[3]]) || S.wellData[p].muscle;
        S.wellData[p].fatigue    = parseInt(row[keys[4]]) || S.wellData[p].fatigue;
        S.wellData[p].stress     = parseInt(row[keys[5]]) || S.wellData[p].stress;
        S.wellData[p].motivation = parseInt(row[keys[6]]) || S.wellData[p].motivation;
        S.wellData[p].hi         = WDIMS.reduce((s,k) => s + S.wellData[p][k], 0);
        S.wellSrc[p] = 'live';
        wellUpdated++;
      });
    }
  } catch(e) { /* foglio non raggiungibile */ }

  /* ── Status ── */
  const ts = new Date().toLocaleTimeString('it-IT');
  document.getElementById('lastSync').textContent = 'Sync: ' + ts;

  addSyncLog('RPE Forms',      rpeUpdated  > 0 ? `${rpeUpdated} atleti aggiornati`    : 'Foglio vuoto',  rpeUpdated,  rpeUpdated > 0  ? 'ok' : 'wait');
  addSyncLog('Wellness Forms', wellUpdated > 0 ? `${wellUpdated} atleti aggiornati`   : 'Foglio vuoto',  wellUpdated, wellUpdated > 0 ? 'ok' : 'wait');

  btn.innerHTML = '<i class="ti ti-refresh"></i> Sincronizza';
  btn.disabled  = false;

  const activePage = document.querySelector('.page.active')?.id;
  if (activePage) renderPage(activePage);
}

function applySess() {
  const tipo = document.getElementById('sessType').value;
  const data = document.getElementById('sessDate').value;
  const md   = document.getElementById('sessMD').value;
  addSyncLog('Sessione', `${tipo} · ${data} → ${md}`, PLAYERS.length, 'ok');
  alert(`✓ Sessione impostata:\n${tipo} del ${data} assegnata a ${md}.\n\nAl prossimo Sincronizza le risposte RPE saranno attribuite a questa sessione.`);
}

function addSyncLog(fonte, stato, n, type) {
  syncLogs.unshift({ ts: new Date().toLocaleString('it-IT'), fonte, stato, n, type });
  renderSyncLog();
}
function renderSync()    { renderSyncLog(); }
function renderSyncLog() {
  const el = document.getElementById('syncLog');
  if (!el) return;
  if (!syncLogs.length) {
    el.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:14px;color:var(--gray-400)">Nessuna sincronizzazione ancora</td></tr>';
    return;
  }
  el.innerHTML = syncLogs.map(l => `
    <tr>
      <td style="font-family:'DM Mono',monospace;font-size:11px">${l.ts}</td>
      <td><strong>${l.fonte}</strong></td>
      <td>${l.n || '—'}</td>
      <td><span class="badge ${l.type==='ok'?'badge-green':l.type==='wait'?'badge-amber':'badge-red'}">${l.stato}</span></td>
    </tr>`).join('');
}

/* ═══════════════════════════════════════════
   OVERVIEW
═══════════════════════════════════════════ */
function renderOverview() {
  const tot     = totalTL();
  const avgACWR = rnd(PLAYERS.reduce((s,p) => s + getACWR(p), 0) / PLAYERS.length);
  const avgHI   = rnd(PLAYERS.reduce((s,p) => s + S.wellData[p].hi, 0) / PLAYERS.length);
  const avgRPE  = rnd(PLAYERS.reduce((s,p) =>
    s + Object.values(S.rpeData[p]).reduce((a,d) => a+d.rpe, 0) / DAYS.length, 0) / PLAYERS.length);
  const atRisk  = PLAYERS.filter(p => getACWR(p) > 1.3 || getACWR(p) < 0.8).length;
  const liveRPE = PLAYERS.filter(p => Object.values(S.rpeSrc[p]||{}).some(s => s==='live')).length;

  document.getElementById('kpiGrid').innerHTML = `
    <div class="kpi-card c-green"><div class="kpi-label">TL Totale Squadra</div><div class="kpi-value">${tot.toLocaleString()}</div><div class="kpi-sub">UA settimanale</div></div>
    <div class="kpi-card ${acwrClass(avgACWR)}"><div class="kpi-label">ACWR medio</div><div class="kpi-value">${avgACWR}</div><div class="kpi-sub">ottimale 0.8–1.3</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">RPE medio squadra</div><div class="kpi-value">${avgRPE}</div><div class="kpi-sub">scala 0–10 Foster</div></div>
    <div class="kpi-card ${hiClass(avgHI)}"><div class="kpi-label">HI medio (5 dim.)</div><div class="kpi-value">${avgHI}</div><div class="kpi-sub">/ 35 Hooper esteso</div></div>
    <div class="kpi-card ${atRisk>3?'c-red':atRisk>1?'c-amber':'c-green'}"><div class="kpi-label">Atleti a rischio</div><div class="kpi-value">${atRisk}</div><div class="kpi-sub">ACWR fuori range</div></div>
    <div class="kpi-card c-green"><div class="kpi-label">RPE live Forms</div><div class="kpi-value">${liveRPE}</div><div class="kpi-sub">/ ${PLAYERS.length} atleti</div></div>`;

  const dayTotals = DAYS.map(d => PLAYERS.reduce((s,p) => s + (S.rpeData[p][d]?.tl||0), 0));
  destroyC('tlWeekChart');
  charts.tlWeekChart = new Chart(document.getElementById('tlWeekChart'), {
    type:'bar', data:{ labels:DAYS, datasets:[{ label:'TL', data:dayTotals, backgroundColor:'#1db876', borderRadius:5 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ y:{ grid:{ color:'rgba(0,0,0,.05)' }, ticks:{ font:{ size:10 } } }, x:{ ticks:{ font:{ size:11 } } } } }
  });

  const acwrs = PLAYERS.map(p => getACWR(p));
  destroyC('acwrChart');
  charts.acwrChart = new Chart(document.getElementById('acwrChart'), {
    type:'bar', data:{ labels:PLAYERS.map(p=>p.split(' ')[0]),
      datasets:[{ label:'ACWR', data:acwrs, backgroundColor:acwrs.map(v=>v>1.3?'#ef4444':v<0.8?'#3b82f6':'#1db876'), borderRadius:4 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ y:{ min:0, max:2, ticks:{ font:{ size:10 } } }, x:{ ticks:{ font:{ size:9 } } } } }
  });

  document.getElementById('statusBody').innerHTML = PLAYERS.map(p => {
    const acwr   = getACWR(p);
    const tl     = getTL(p);
    const avgRpe = rnd(Object.values(S.rpeData[p]).reduce((s,d) => s+d.rpe, 0) / DAYS.length);
    const hasLive= Object.values(S.rpeSrc[p]||{}).some(s => s==='live');
    return `<tr>
      <td><strong>${p}</strong></td>
      <td>${srcTag(hasLive?'live':'demo')}</td>
      <td style="font-family:'DM Mono',monospace">${avgRpe}</td>
      <td style="font-family:'DM Mono',monospace">${tl}</td>
      <td style="font-family:'DM Mono',monospace">${acwr}</td>
      <td style="font-family:'DM Mono',monospace">${S.wellData[p].hi}/35</td>
      <td>${riskBadge(acwr)}</td>
    </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   RPE & TL
═══════════════════════════════════════════ */
function renderRPE() {
  const sel  = document.getElementById('rpePlayer').value || PLAYERS[0];
  const data = S.rpeData[sel];
  const tot  = getTL(sel);
  const mon  = getMonotony(sel);
  const fat  = getFatigue(sel);
  const avgR = rnd(DAYS.reduce((s,d) => s+(data[d]?.rpe||0), 0) / DAYS.length);

  document.getElementById('rpeKpi').innerHTML = `
    <div class="kpi-card c-green"><div class="kpi-label">TL Totale</div><div class="kpi-value">${tot}</div><div class="kpi-sub">UA settimanale</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">RPE medio</div><div class="kpi-value">${avgR}</div><div class="kpi-sub">0–10 Foster CR10</div></div>
    <div class="kpi-card ${mon>2?'c-amber':'c-green'}"><div class="kpi-label">Monotonia</div><div class="kpi-value">${mon}</div><div class="kpi-sub">Media / Dev.Std.</div></div>
    <div class="kpi-card ${fat>5000?'c-red':fat>3000?'c-amber':'c-green'}"><div class="kpi-label">Fatica</div><div class="kpi-value">${fat.toLocaleString()}</div><div class="kpi-sub">TL × Monotonia</div></div>`;

  destroyC('rpeChart');
  charts.rpeChart = new Chart(document.getElementById('rpeChart'), {
    type:'bar',
    data:{ labels:DAYS, datasets:[
      { label:'TL', data:DAYS.map(d=>data[d]?.tl||0), backgroundColor:'#1db876', borderRadius:4, yAxisID:'y' },
      { label:'RPE', data:DAYS.map(d=>data[d]?.rpe||0), type:'line', borderColor:'#3b82f6',
        backgroundColor:'rgba(59,130,246,.08)', tension:0.35, fill:true, yAxisID:'y1', pointRadius:4 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{
        y:  { grid:{ color:'rgba(0,0,0,.05)' }, ticks:{ font:{ size:10 } } },
        y1: { position:'right', min:0, max:10, grid:{ display:false }, ticks:{ font:{ size:10 } } },
        x:  { ticks:{ font:{ size:11 } } }
      } }
  });

  const totSquad = totalTL();
  document.getElementById('rpeTableBody').innerHTML = PLAYERS.map(p => {
    const d    = S.rpeData[p];
    const ptl  = getTL(p);
    const prpe = rnd(DAYS.reduce((s,day) => s+(d[day]?.rpe||0), 0) / DAYS.length);
    const hasL = Object.values(S.rpeSrc[p]||{}).some(s => s==='live');
    return `<tr>
      <td><strong>${p}</strong></td>
      <td>${srcTag(hasL?'live':'demo')}</td>
      ${DAYS.map(day => {
        const x   = d[day];
        const dot = (S.rpeSrc[p]?.[day]==='live') ? '<span style="color:#22c55e;font-size:9px">●</span>' : '';
        return `<td>${x?.rpe||0}${dot}<br><span style="color:var(--gray-400);font-size:10px;font-family:'DM Mono',monospace">${x?.tl||0}</span></td>`;
      }).join('')}
      <td style="font-family:'DM Mono',monospace"><strong>${ptl}</strong></td>
      <td style="font-family:'DM Mono',monospace">${prpe}</td>
      <td style="font-family:'DM Mono',monospace">${getMonotony(p)}</td>
      <td style="font-family:'DM Mono',monospace">${getFatigue(p).toLocaleString()}</td>
    </tr>`;
  }).join('');
}

function addRPE() {
  const p   = document.getElementById('inp_player').value;
  const md  = document.getElementById('inp_md').value;
  const rpe = parseFloat(document.getElementById('inp_rpe').value) || 0;
  let   min = parseInt(document.getElementById('inp_min').value)   || 0;
  if (!rpe) { alert('Inserisci il valore RPE (0–10)'); return; }
  if (!min) { const g = S.gpsData.find(g => g.p === p); min = g?.min || 75; }
  if (!S.rpeData[p]) S.rpeData[p] = {};
  if (!S.rpeSrc[p])  S.rpeSrc[p]  = {};
  S.rpeData[p][md] = { rpe, min, tl: Math.round(rpe * min) };
  S.rpeSrc[p][md]  = 'manual';
  document.getElementById('inp_rpe').value = '';
  document.getElementById('inp_min').value = '';
  document.getElementById('rpePlayer').value = p;
  renderRPE();
}

/* ═══════════════════════════════════════════
   WELLNESS
═══════════════════════════════════════════ */
function initStars() {
  WDIMS.forEach(dim => {
    const el = document.getElementById('st_' + dim);
    if (!el) return;
    el.innerHTML = [1,2,3,4,5,6,7].map(i =>
      `<span class="star" onclick="setStar('${dim}',${i})">●</span>`
    ).join('');
  });
}

function setStar(dim, val) {
  wellInput[dim] = val;
  const lbl = document.getElementById('lbl_' + dim);
  if (lbl) lbl.textContent = WTEXT[val] || '';
  document.querySelectorAll(`#st_${dim} .star`).forEach((s,i) => s.classList.toggle('on', i+1 <= val));
  const total = WDIMS.reduce((s,k) => s + (wellInput[k]||0), 0);
  const hv = document.getElementById('hooperVal');
  if (hv) hv.textContent = total || '—';
}

function saveWellness() {
  const p = document.getElementById('wellPlayer').value;
  if (!p) return;
  WDIMS.forEach(k => { if (wellInput[k]) S.wellData[p][k] = wellInput[k]; });
  S.wellData[p].hi = WDIMS.reduce((s,k) => s + S.wellData[p][k], 0);
  S.wellSrc[p] = 'manual';
  renderWellness();
}

function renderWellness() {
  const sel = document.getElementById('wellPlayer').value || PLAYERS[0];
  const lbl = document.getElementById('wellPlayerLabel');
  if (lbl) lbl.textContent = sel;
  initStars();

  const hi7 = [14,12,16,11,13,15, S.wellData[sel].hi];
  destroyC('wellChart');
  charts.wellChart = new Chart(document.getElementById('wellChart'), {
    type:'line',
    data:{ labels:['Lun','Mar','Mer','Gio','Ven','Sab','Dom'], datasets:[
      { label:'HI', data:hi7, borderColor:'#1db876', backgroundColor:'rgba(29,184,118,.08)', fill:true, tension:0.35, pointRadius:4 },
      { label:'Soglia', data:[20,20,20,20,20,20,20], borderColor:'#ef4444', borderDash:[5,3], pointRadius:0 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ y:{ min:0, max:35, ticks:{ font:{ size:10 } } }, x:{ ticks:{ font:{ size:11 } } } } }
  });

  document.getElementById('wellBody').innerHTML = PLAYERS.map(p => {
    const d  = S.wellData[p];
    const cl = d.hi>=25?'badge-red':d.hi>=18?'badge-amber':'badge-green';
    const lb = d.hi>=25?'Allerta':d.hi>=18?'Attenzione':'Buono';
    return `<tr>
      <td><strong>${p}</strong></td>
      <td>${srcTag(S.wellSrc[p]||'demo')}</td>
      <td>${d.sleep}/7</td><td>${d.muscle}/7</td><td>${d.fatigue}/7</td>
      <td>${d.stress}/7</td><td>${d.motivation}/7</td>
      <td style="font-family:'DM Mono',monospace"><strong>${d.hi}/35</strong></td>
      <td><span class="badge ${cl}">${lb}</span></td>
    </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   GPS
═══════════════════════════════════════════ */
function renderGPS() {
  const d = S.gpsData;
  const avgDist = Math.round(d.reduce((s,x) => s+x.dist, 0) / d.length);
  const avgHSR  = Math.round(d.reduce((s,x) => s+x.hsr,  0) / d.length);
  const avgVM   = rnd(d.reduce((s,x) => s+x.vmax, 0) / d.length);

  document.getElementById('gpsKpi').innerHTML = `
    <div class="kpi-card c-green"><div class="kpi-label">Distanza media</div><div class="kpi-value">${avgDist.toLocaleString()}</div><div class="kpi-sub">metri</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">HSR media &gt;16</div><div class="kpi-value">${avgHSR}</div><div class="kpi-sub">metri</div></div>
    <div class="kpi-card c-amber"><div class="kpi-label">Vel. MAX media</div><div class="kpi-value">${avgVM}</div><div class="kpi-sub">km/h</div></div>
    <div class="kpi-card c-green"><div class="kpi-label">GPS tracciati</div><div class="kpi-value">${d.length}</div><div class="kpi-sub">atleti</div></div>`;

  destroyC('gpsDistChart');
  charts.gpsDistChart = new Chart(document.getElementById('gpsDistChart'), {
    type:'bar', data:{ labels:d.map(x=>x.p.split(' ')[0]),
      datasets:[{ label:'Dist.', data:d.map(x=>x.dist), backgroundColor:'#1db876', borderRadius:3 }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ x:{ ticks:{ font:{ size:9 } }, grid:{ color:'rgba(0,0,0,.05)' } }, y:{ ticks:{ font:{ size:9 } } } } }
  });

  destroyC('gpsHSRChart');
  charts.gpsHSRChart = new Chart(document.getElementById('gpsHSRChart'), {
    type:'bar', data:{ labels:d.map(x=>x.p.split(' ')[0]),
      datasets:[
        { label:'>16km/h', data:d.map(x=>x.hsr), backgroundColor:'#3b82f6', borderRadius:3 },
        { label:'>20km/h', data:d.map(x=>x.v20), backgroundColor:'#f59e0b', borderRadius:3 }
      ]},
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ x:{ ticks:{ font:{ size:9 } } }, y:{ ticks:{ font:{ size:9 } } } } }
  });

  document.getElementById('gpsBody').innerHTML = d.map(x => `
    <tr>
      <td><strong>${x.p}</strong></td>
      <td style="font-family:'DM Mono',monospace">${(+x.dist).toLocaleString()}</td>
      <td style="font-family:'DM Mono',monospace">${rnd(+x.dmin)}</td>
      <td style="font-family:'DM Mono',monospace">${x.hsr}</td>
      <td style="font-family:'DM Mono',monospace">${x.v20}</td>
      <td style="font-family:'DM Mono',monospace">${x.v25}</td>
      <td style="font-family:'DM Mono',monospace">${x.acc}</td>
      <td style="font-family:'DM Mono',monospace">${x.dec}</td>
      <td style="font-family:'DM Mono',monospace">${x.nacc}</td>
      <td style="font-family:'DM Mono',monospace">${rnd(+x.vmax)}</td>
      <td style="font-family:'DM Mono',monospace">${rnd(+x.rpe)}</td>
      <td style="font-family:'DM Mono',monospace">${x.min}' <span style="color:var(--green);font-size:10px">→${Math.round((+x.rpe)*(+x.min))}</span></td>
    </tr>`).join('');
}

/* ═══════════════════════════════════════════
   FC
═══════════════════════════════════════════ */
function renderFC() {
  const avg = Math.round(PLAYERS.reduce((s,p) => s + S.fcData[p].tl, 0) / PLAYERS.length);
  document.getElementById('fcKpi').innerHTML = `
    <div class="kpi-card c-green"><div class="kpi-label">TL FC medio</div><div class="kpi-value">${avg}</div><div class="kpi-sub">UA Edwards</div></div>
    <div class="kpi-card c-red"><div class="kpi-label">Z5 media</div><div class="kpi-value">${Math.round(PLAYERS.reduce((s,p)=>s+S.fcData[p].z5,0)/PLAYERS.length)}'</div><div class="kpi-sub">90–100% FCmax</div></div>
    <div class="kpi-card c-amber"><div class="kpi-label">Z4 media</div><div class="kpi-value">${Math.round(PLAYERS.reduce((s,p)=>s+S.fcData[p].z4,0)/PLAYERS.length)}'</div><div class="kpi-sub">80–90% FCmax</div></div>`;

  destroyC('fcChart');
  charts.fcChart = new Chart(document.getElementById('fcChart'), {
    type:'bar',
    data:{ labels:PLAYERS.map(p=>p.split(' ')[0]), datasets:[
      { label:'Z5', data:PLAYERS.map(p=>S.fcData[p].z5), backgroundColor:'#ef4444', borderRadius:2 },
      { label:'Z4', data:PLAYERS.map(p=>S.fcData[p].z4), backgroundColor:'#f59e0b', borderRadius:2 },
      { label:'Z3', data:PLAYERS.map(p=>S.fcData[p].z3), backgroundColor:'#22c55e', borderRadius:2 },
      { label:'Z2', data:PLAYERS.map(p=>S.fcData[p].z2), backgroundColor:'#3b82f6', borderRadius:2 },
      { label:'Z1', data:PLAYERS.map(p=>S.fcData[p].z1), backgroundColor:'#a855f7', borderRadius:2 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ x:{ stacked:true, ticks:{ font:{ size:9 } } }, y:{ stacked:true, ticks:{ font:{ size:10 } }, grid:{ color:'rgba(0,0,0,.05)' } } },
      plugins:{ legend:{ display:false } } }
  });

  document.getElementById('fcBody').innerHTML = PLAYERS.map(p => {
    const d = S.fcData[p];
    return `<tr>
      <td><strong>${p}</strong></td>
      <td style="font-family:'DM Mono',monospace">${d.z5}'</td>
      <td style="font-family:'DM Mono',monospace">${d.z4}'</td>
      <td style="font-family:'DM Mono',monospace">${d.z3}'</td>
      <td style="font-family:'DM Mono',monospace">${d.z2}'</td>
      <td style="font-family:'DM Mono',monospace">${d.z1}'</td>
      <td style="font-family:'DM Mono',monospace"><strong>${d.tl} UA</strong></td>
    </tr>`;
  }).join('');
}

function addFC() {
  const p  = document.getElementById('fc_player').value;
  const z5 = +document.getElementById('fc_z5').value||0;
  const z4 = +document.getElementById('fc_z4').value||0;
  const z3 = +document.getElementById('fc_z3').value||0;
  const z2 = +document.getElementById('fc_z2').value||0;
  const z1 = +document.getElementById('fc_z1').value||0;
  S.fcData[p] = { z5,z4,z3,z2,z1, tl:z5*5+z4*4+z3*3+z2*2+z1 };
  renderFC();
}

/* ═══════════════════════════════════════════
   ACWR & INDICI
═══════════════════════════════════════════ */
function renderACWR() {
  const tot    = totalTL();
  const acwrs  = PLAYERS.map(p => getACWR(p));
  const avg    = rnd(acwrs.reduce((a,b) => a+b, 0) / acwrs.length);
  const atRisk = acwrs.filter(v => v>1.3 || v<0.8).length;

  document.getElementById('acwrKpi').innerHTML = `
    <div class="kpi-card ${acwrClass(avg)}"><div class="kpi-label">ACWR medio squadra</div><div class="kpi-value">${avg}</div><div class="kpi-sub">ottimale 0.8–1.3</div></div>
    <div class="kpi-card ${atRisk>3?'c-red':atRisk>1?'c-amber':'c-green'}"><div class="kpi-label">Atleti a rischio</div><div class="kpi-value">${atRisk}</div><div class="kpi-sub">ACWR fuori range</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">TL Totale squadra</div><div class="kpi-value">${tot.toLocaleString()}</div><div class="kpi-sub">UA settimanale</div></div>`;

  destroyC('acwrPlayerChart');
  charts.acwrPlayerChart = new Chart(document.getElementById('acwrPlayerChart'), {
    type:'bar', data:{ labels:PLAYERS.map(p=>p.split(' ')[0]),
      datasets:[{ label:'ACWR', data:acwrs,
        backgroundColor:acwrs.map(v=>v>1.3?'#ef4444':v<0.8?'#3b82f6':'#1db876'), borderRadius:4 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ y:{ min:0, max:2, ticks:{ font:{ size:10 } } }, x:{ ticks:{ font:{ size:9 } } } } }
  });

  document.getElementById('pctBars').innerHTML = PLAYERS.map(p => {
    const tl  = getTL(p);
    const pct = rnd(tl / tot * 100, 1);
    const clr = pct>10?'#ef4444':pct>7?'#f59e0b':'#1db876';
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:12px">
      <span style="min-width:85px;color:var(--gray-700)">${p}</span>
      <div class="pct-bar"><div class="pct-fill" style="width:${Math.min(pct*6,100)}%;background:${clr}"></div></div>
      <span style="min-width:90px;text-align:right;color:var(--gray-500);font-family:'DM Mono',monospace;font-size:11px">${tl} UA · ${pct}%</span>
    </div>`;
  }).join('');

  document.getElementById('acwrBody').innerHTML = PLAYERS.map(p => {
    const tl   = getTL(p);
    const pct  = rnd(tl/tot*100, 1);
    const acwr = getACWR(p);
    const mon  = getMonotony(p);
    const fat  = getFatigue(p);
    const tls  = Object.values(S.rpeData[p]).map(d => d.tl);
    const avg  = rnd(tls.reduce((a,b)=>a+b,0)/tls.length);
    const sd   = rnd(Math.sqrt(tls.reduce((s,v)=>s+Math.pow(v-avg,2),0)/tls.length));
    const ac   = rnd(tls.reduce((a,b)=>a+b,0)/7);
    const ch   = rnd(tls.reduce((a,b)=>a+b,0)/tls.length);
    return `<tr>
      <td><strong>${p}</strong></td>
      <td style="font-family:'DM Mono',monospace">${ac}</td>
      <td style="font-family:'DM Mono',monospace">${ch}</td>
      <td style="font-family:'DM Mono',monospace">${acwr}</td>
      <td style="font-family:'DM Mono',monospace">${avg}</td>
      <td style="font-family:'DM Mono',monospace">${sd}</td>
      <td style="font-family:'DM Mono',monospace">${mon}</td>
      <td style="font-family:'DM Mono',monospace">${fat.toLocaleString()}</td>
      <td style="font-family:'DM Mono',monospace">${pct}%</td>
      <td>${riskBadge(acwr)}</td>
    </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   SCHEDA GIOCATORE
═══════════════════════════════════════════ */
function renderPlayer() {
  const p    = document.getElementById('playerSel').value || PLAYERS[0];
  const tl   = getTL(p);
  const acwr = getACWR(p);
  const mon  = getMonotony(p);
  const fat  = getFatigue(p);
  const hi   = S.wellData[p].hi;
  const tot  = totalTL();
  const pct  = rnd(tl/tot*100, 1);
  const fc   = S.fcData[p];
  const d    = S.rpeData[p];
  const w    = S.wellData[p];
  const hasL = Object.values(S.rpeSrc[p]||{}).some(s=>s==='live');

  document.getElementById('playerKpi').innerHTML = `
    <div class="kpi-card c-green"><div class="kpi-label">TL Settimanale</div><div class="kpi-value">${tl}</div><div class="kpi-sub">${srcTag(hasL?'live':'demo')}</div></div>
    <div class="kpi-card ${acwrClass(acwr)}"><div class="kpi-label">ACWR</div><div class="kpi-value">${acwr}</div><div class="kpi-sub">${acwr>1.3?'⚠ Attenzione':acwr<0.8?'↑ Aumentare':'✓ Ottimale'}</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">Monotonia</div><div class="kpi-value">${mon}</div></div>
    <div class="kpi-card ${fat>5000?'c-red':fat>3000?'c-amber':'c-green'}"><div class="kpi-label">Fatica</div><div class="kpi-value">${fat.toLocaleString()}</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">% Carico squadra</div><div class="kpi-value">${pct}%</div></div>
    <div class="kpi-card ${hiClass(hi)}"><div class="kpi-label">HI (5 dim.)</div><div class="kpi-value">${hi}/35</div><div class="kpi-sub">${srcTag(S.wellSrc[p]||'demo')}</div></div>`;

  destroyC('playerTLChart');
  charts.playerTLChart = new Chart(document.getElementById('playerTLChart'), {
    type:'line', data:{ labels:DAYS,
      datasets:[{ label:'TL', data:DAYS.map(day=>d[day]?.tl||0),
        borderColor:'#1db876', backgroundColor:'rgba(29,184,118,.08)', fill:true, tension:0.4, pointRadius:4 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ y:{ ticks:{ font:{ size:10 } }, grid:{ color:'rgba(0,0,0,.05)' } }, x:{ ticks:{ font:{ size:11 } } } } }
  });

  destroyC('playerWellChart');
  charts.playerWellChart = new Chart(document.getElementById('playerWellChart'), {
    type:'radar', data:{ labels:WLBLS,
      datasets:[{ label:p, data:WDIMS.map(k=>w[k]),
        borderColor:'#1db876', backgroundColor:'rgba(29,184,118,.12)',
        pointBackgroundColor:'#1db876', pointRadius:4 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ r:{ min:0, max:7, ticks:{ stepSize:1, font:{ size:9 } },
        grid:{ color:'rgba(0,0,0,.08)' }, angleLines:{ color:'rgba(0,0,0,.08)' } } },
      plugins:{ legend:{ display:false } } }
  });

  const zColors = ['#ef4444','#f59e0b','#22c55e','#3b82f6','#a855f7'];
  document.getElementById('playerCard').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:12px">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-400);margin-bottom:10px">RPE per sessione (Foster 0–10)</div>
        ${DAYS.map(day => {
          const x   = d[day];
          const src = S.rpeSrc[p]?.[day] || 'demo';
          const dot = src==='live' ? '<span style="color:#22c55e;font-size:9px">●</span> ' : '';
          return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
            ${dot}<span style="min-width:38px;color:var(--gray-400)">${day}</span>
            <div style="flex:1;height:8px;border-radius:4px;background:var(--gray-100);overflow:hidden">
              <div style="width:${Math.min((x?.rpe||0)/10*100,100)}%;height:100%;background:#3b82f6;border-radius:4px"></div>
            </div>
            <span style="min-width:65px;text-align:right;font-family:'DM Mono',monospace;font-size:11px">${x?.rpe||0} (${x?.tl||0})</span>
          </div>`;
        }).join('')}
        <div style="margin-top:10px;font-size:11px;color:var(--gray-500)">
          Min. GPS: <strong style="font-family:'DM Mono',monospace">${S.gpsData.find(g=>g.p===p)?.min||'—'}'</strong>
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-400);margin-bottom:10px">Zone FC (Edwards) ${srcTag(S.wellSrc[p]||'demo')}</div>
        ${['z5','z4','z3','z2','z1'].map((z,i) => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
            <span style="min-width:24px;color:var(--gray-400);font-size:10px">Z${5-i}</span>
            <div style="flex:1;height:8px;border-radius:4px;background:var(--gray-100);overflow:hidden">
              <div style="width:${Math.min((fc[z]||0)/30*100,100)}%;height:100%;background:${zColors[i]};border-radius:4px"></div>
            </div>
            <span style="min-width:30px;text-align:right;font-family:'DM Mono',monospace;font-size:11px">${fc[z]||0}'</span>
          </div>`).join('')}
        <div style="margin-top:10px;font-size:11px;color:var(--gray-500)">
          TL FC: <strong style="font-family:'DM Mono',monospace">${fc.tl} UA</strong>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════
   IMPORT GPS / FC
═══════════════════════════════════════════ */
const IMPORT_CFG = {
  gps: {
    fields: ['Atleta','Dist.(m)','Dist/min','>16km/h','>20km/h','>25km/h','Acc.dist','Dec.dist','N°Acc','VelMAX','RPE','Minuti'],
    keys:   ['p','dist','dmin','hsr','v20','v25','acc','dec','nacc','vmax','rpe','min']
  },
  fc_csv: {
    fields: ['Atleta','Z5 min','Z4 min','Z3 min','Z2 min','Z1 min'],
    keys:   ['atleta','z5','z4','z3','z2','z1']
  }
};

function setITab(tab, btn) {
  curITab = tab;
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderImportContent();
}

function renderImportPage()   { renderImportContent(); renderImportLog(); }
function renderImportContent() {
  const cfg = IMPORT_CFG[curITab];
  document.getElementById('importContent').innerHTML = `
    <div style="font-size:11px;color:var(--gray-500);margin-bottom:10px">
      Colonne attese: <strong>${cfg.fields.join(' · ')}</strong>
    </div>
    <div class="drop-zone" id="dz_${curITab}" onclick="document.getElementById('fi_${curITab}').click()">
      <input type="file" id="fi_${curITab}" accept=".csv,.xlsx,.xls" onchange="handleFile(event,'${curITab}')" onclick="event.stopPropagation()">
      <div class="drop-icon"><i class="ti ti-cloud-upload"></i></div>
      <div class="drop-title">Trascina il file qui o clicca per sfogliare</div>
      <div class="drop-sub">CSV, XLSX, XLS — max 10 MB</div>
      <div class="drop-status" id="ds_${curITab}"></div>
    </div>
    <div id="colMap_${curITab}" style="display:none;margin-top:12px">
      <div style="font-size:11px;font-weight:700;color:var(--gray-600);margin-bottom:8px;text-transform:uppercase;letter-spacing:.4px">Mappa le colonne</div>
      <div id="mapRows_${curITab}"></div>
      <button class="btn btn-primary" style="margin-top:10px" onclick="applyImport('${curITab}')">
        <i class="ti ti-check"></i> Importa dati
      </button>
    </div>
    <div id="prev_${curITab}" style="display:none;margin-top:14px">
      <div style="font-size:11px;font-weight:700;color:var(--gray-600);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Anteprima (prime 5 righe)</div>
      <div class="table-wrap"><table id="prevTbl_${curITab}"></table></div>
    </div>`;

  const z = document.getElementById('dz_'+curITab);
  z.addEventListener('dragover',  e => { e.preventDefault(); z.classList.add('drag'); });
  z.addEventListener('dragleave', () => z.classList.remove('drag'));
  z.addEventListener('drop', e => {
    e.preventDefault(); z.classList.remove('drag');
    const f = e.dataTransfer.files[0]; if (f) processFile(f, curITab);
  });
}

function handleFile(e, tab) { const f = e.target.files[0]; if (f) processFile(f, tab); }

function processFile(file, tab) {
  const ext = file.name.split('.').pop().toLowerCase();
  const ds  = document.getElementById('ds_' + tab);
  const dz  = document.getElementById('dz_' + tab);
  ds.textContent = 'Lettura in corso...';
  if (ext === 'csv') {
    Papa.parse(file, { header:true, skipEmptyLines:true, complete: res => {
      if (!res.data.length) { ds.textContent = 'File vuoto'; dz.classList.add('err'); return; }
      parsedFiles[tab] = { data:res.data, cols:Object.keys(res.data[0]), name:file.name };
      onFileReady(tab, file.name);
    }});
  } else if (['xlsx','xls'].includes(ext)) {
    const r = new FileReader();
    r.onload = ev => {
      try {
        const wb   = XLSX.read(ev.target.result, { type:'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
        if (!rows.length) { ds.textContent = 'Foglio vuoto'; dz.classList.add('err'); return; }
        parsedFiles[tab] = { data:rows, cols:Object.keys(rows[0]), name:file.name };
        onFileReady(tab, file.name);
      } catch(e) { ds.textContent = 'Errore lettura Excel'; dz.classList.add('err'); }
    };
    r.readAsArrayBuffer(file);
  } else { ds.textContent = 'Formato non supportato. Usa CSV o XLSX.'; dz.classList.add('err'); }
}

function onFileReady(tab, name) {
  const { data, cols } = parsedFiles[tab];
  const cfg = IMPORT_CFG[tab];
  const dz  = document.getElementById('dz_' + tab);
  const ds  = document.getElementById('ds_' + tab);
  ds.innerHTML = `<span style="color:var(--green)">✓ ${name} — ${data.length} righe, ${cols.length} colonne</span>`;
  dz.classList.add('ok');

  const cm = document.getElementById('colMap_' + tab);
  const mr = document.getElementById('mapRows_' + tab);
  cm.style.display = 'block';
  mr.innerHTML = cfg.fields.map((f,i) => {
    const key  = cfg.keys[i];
    const opts = cols.map(c =>
      `<option ${c.toLowerCase().includes(f.split('.')[0].toLowerCase()) || c.toLowerCase()===key ? 'selected' : ''}>${c}</option>`
    ).join('');
    return `<div class="col-map-row">
      <span style="color:var(--gray-500);font-size:11px">${f}</span>
      <span style="text-align:center;color:var(--gray-400)">→</span>
      <select id="mp_${tab}_${key}">${opts}</select>
    </div>`;
  }).join('');

  const pv = document.getElementById('prev_' + tab);
  const pt = document.getElementById('prevTbl_' + tab);
  pv.style.display = 'block';
  pt.innerHTML = `
    <thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${data.slice(0,5).map(row=>`<tr>${cols.map(c=>`<td>${row[c]}</td>`).join('')}</tr>`).join('')}</tbody>`;
}

function applyImport(tab) {
  const pf = parsedFiles[tab];
  if (!pf) { alert('Nessun file caricato'); return; }
  const rows = pf.data;
  const cfg  = IMPORT_CFG[tab];

  if (tab === 'gps') {
    S.gpsData = rows.map(row => {
      const g = {};
      cfg.keys.forEach((k,i) => {
        const col = document.getElementById(`mp_gps_${k}`)?.value;
        g[k] = col ? row[col] || '' : '';
      });
      return { p:g.p, dist:+g.dist||0, dmin:+g.dmin||0, hsr:+g.hsr||0, v20:+g.v20||0,
               v25:+g.v25||0, acc:+g.acc||0, dec:+g.dec||0, nacc:+g.nacc||0,
               vmax:+g.vmax||0, rpe:+g.rpe||0, min:+g.min||0 };
    }).filter(x => x.p);
    /* Aggiorna automaticamente i minuti nel calcolo TL */
    S.gpsData.forEach(gx => {
      const p = gx.p;
      if (S.rpeData[p]) {
        DAYS.forEach(d => {
          if (S.rpeData[p][d]?.rpe) {
            S.rpeData[p][d].min = gx.min;
            S.rpeData[p][d].tl  = Math.round(S.rpeData[p][d].rpe * gx.min);
          }
        });
      }
    });
  } else if (tab === 'fc_csv') {
    rows.forEach(row => {
      const a = (row[document.getElementById('mp_fc_csv_atleta')?.value||'']||'').trim();
      if (!a) return;
      const d = {
        z5: +(row[document.getElementById('mp_fc_csv_z5')?.value]||0),
        z4: +(row[document.getElementById('mp_fc_csv_z4')?.value]||0),
        z3: +(row[document.getElementById('mp_fc_csv_z3')?.value]||0),
        z2: +(row[document.getElementById('mp_fc_csv_z2')?.value]||0),
        z1: +(row[document.getElementById('mp_fc_csv_z1')?.value]||0)
      };
      d.tl = d.z5*5 + d.z4*4 + d.z3*3 + d.z2*2 + d.z1;
      S.fcData[a] = d;
    });
  }

  importLogs.unshift({ ts:new Date().toLocaleString('it-IT'), tipo:tab==='gps'?'GPS':'FC', name:pf.name, rows:rows.length, ok:true });
  renderImportLog();
  const extra = tab==='gps' ? '\n\nI minuti GPS sono stati applicati automaticamente al calcolo TL.' : '';
  alert(`✓ ${rows.length} righe importate da "${pf.name}"${extra}`);
}

function renderImportLog() {
  const el = document.getElementById('importLog');
  if (!el) return;
  if (!importLogs.length) {
    el.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:14px;color:var(--gray-400)">Nessuna importazione ancora</td></tr>';
    return;
  }
  el.innerHTML = importLogs.map(l => `
    <tr>
      <td style="font-family:'DM Mono',monospace;font-size:11px">${l.ts}</td>
      <td>${l.tipo}</td>
      <td>${l.name}</td>
      <td style="font-family:'DM Mono',monospace">${l.rows}</td>
      <td><span class="badge ${l.ok?'badge-green':'badge-red'}">${l.ok?'OK':'Errore'}</span></td>
    </tr>`).join('');
}

/* ═══════════════════════════════════════════
   START
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);
