/* ═══════════════════════════════════════════════════════════════
   BIRKIRKARA FC – Monitoraggio Atletico 2026/27
   app.js v2.0 – Roster Management + Google Forms Sync
═══════════════════════════════════════════════════════════════ */

const RPE_CSV_PUBLIC = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4YuMaExxKAj4GzR3x4rGvvMd7aBb9nI6TmkvBo0udVbWjXLT9IedUK08BfklRjbmj-lyoxo3WWz6G/pub?gid=2015047575&single=true&output=csv';
const WELL_CSV_PUBLIC = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgLyLQTm45a4a9270zTzc8he5EdkCn0BIUzkki4pUTqoWn-1_WXN69XibHe78_Kmzi38GjPp7nWDZS/pub?gid=261355929&single=true&output=csv';

/* ─── ROSTER ─── */
let ROSTER = [
  {id:1,  photo:null, nome:'Mark',    cognome:'Agius',     numero:1,  ruolo:'POR', dob:'1994-03-15', naz:'Maltese',   altezza:188, peso:82, piede:'Destro',   stato:'Disponibile', note:'Capitano'},
  {id:2,  photo:null, nome:'Joseph',  cognome:'Borg',      numero:3,  ruolo:'DC',  dob:'1997-07-22', naz:'Maltese',   altezza:183, peso:78, piede:'Destro',   stato:'Disponibile', note:''},
  {id:3,  photo:null, nome:'Kurt',    cognome:'Zammit',    numero:5,  ruolo:'DC',  dob:'1999-11-08', naz:'Maltese',   altezza:185, peso:80, piede:'Sinistro', stato:'Disponibile', note:''},
  {id:4,  photo:null, nome:'Ryan',    cognome:'Camenzuli', numero:2,  ruolo:'TER', dob:'2000-04-30', naz:'Maltese',   altezza:176, peso:72, piede:'Destro',   stato:'Disponibile', note:''},
  {id:5,  photo:null, nome:'Stefan',  cognome:'Pace',      numero:6,  ruolo:'TER', dob:'1998-09-14', naz:'Maltese',   altezza:178, peso:74, piede:'Sinistro', stato:'In recupero', note:'Affaticamento coscia'},
  {id:6,  photo:null, nome:'James',   cognome:'Muscat',    numero:8,  ruolo:'MED', dob:'1996-01-25', naz:'Maltese',   altezza:180, peso:76, piede:'Destro',   stato:'Disponibile', note:''},
  {id:7,  photo:null, nome:'Luke',    cognome:'Farrugia',  numero:10, ruolo:'TRA', dob:'2001-06-12', naz:'Maltese',   altezza:174, peso:70, piede:'Destro',   stato:'Disponibile', note:''},
  {id:8,  photo:null, nome:'Carlo',   cognome:'Mamo',      numero:7,  ruolo:'ALA', dob:'2002-02-18', naz:'Maltese',   altezza:172, peso:68, piede:'Sinistro', stato:'Disponibile', note:''},
  {id:9,  photo:null, nome:'Dylan',   cognome:'Grima',     numero:11, ruolo:'ALA', dob:'2003-08-05', naz:'Maltese',   altezza:170, peso:67, piede:'Destro',   stato:'Disponibile', note:''},
  {id:10,  photo:null, nome:'Andre',   cognome:'Prates',    numero:9,  ruolo:'ATT', dob:'1995-12-20', naz:'Brasiliana',altezza:182, peso:79, piede:'Destro',   stato:'Disponibile', note:''},
  {id:11,  photo:null, nome:'Nicolas', cognome:'Gauci',     numero:4,  ruolo:'CC',  dob:'2000-03-07', naz:'Maltese',   altezza:179, peso:75, piede:'Entrambi', stato:'Disponibile', note:''},
  {id:12,  photo:null, nome:'Matthew', cognome:'Bartolo',   numero:14, ruolo:'DC',  dob:'1999-10-11', naz:'Maltese',   altezza:186, peso:81, piede:'Destro',   stato:'Infortunato', note:'Lesione ginocchio'},
  {id:13,  photo:null, nome:'Ethan',   cognome:'Debono',    numero:15, ruolo:'MEZ', dob:'2004-05-23', naz:'Maltese',   altezza:176, peso:71, piede:'Sinistro', stato:'Disponibile', note:''},
  {id:14,  photo:null, nome:'Paul',    cognome:'Fenech',    numero:17, ruolo:'MED', dob:'1997-08-16', naz:'Maltese',   altezza:181, peso:77, piede:'Destro',   stato:'Disponibile', note:''},
  {id:15,  photo:null, nome:'Alex',    cognome:'Spiteri',   numero:22, ruolo:'POR', dob:'2001-01-09', naz:'Maltese',   altezza:190, peso:84, piede:'Destro',   stato:'Disponibile', note:'Secondo portiere'},
];
let rosterIdCounter = 16;
let editingPlayerId = null;
let rosterView = 'cards';

const RUOLO_COLOR = {
  POR:'#7c3aed', DC:'#1d4ed8', TER:'#0891b2',
  CC:'#00A878',  MEZ:'#00A878', MED:'#006B4D',
  ALA:'#c9a010', TRA:'#d97706', ATT:'#dc2626', SEC:'#991b1b'
};
const STATUS_BADGE = {
  'Disponibile': 'badge-green',
  'Infortunato': 'badge-red',
  'Squalificato':'badge-amber',
  'In recupero': 'badge-yellow'
};

function PLAYERS() { return ROSTER.map(p => p.cognome + ' ' + p.nome.charAt(0) + '.'); }

const DAYS   = ['MD+1','MD+2','MD+3','MD-3','MD-2','MD-1','MD'];
const WDIMS  = ['sleep','muscle','fatigue','stress','motivation'];
const WLBLS  = ['Sonno','Dolori','Stanchezza','Stress','Motivazione'];
const WTEXT  = ['','Ottimo','Buono','Normale','Scarso','Molto scarso','Pessimo','Pessimo'];

const PAGE_TITLES = {
  overview:'Overview', sync:'Google Forms', roster:'Gestione Rosa',
  rpe:'RPE & Training Load', wellness:'Wellness',
  gps:'GPS', fc:'Frequenza Cardiaca',
  acwr:'ACWR & Indici', players:'Schede Atleti', import:'Import GPS / FC'
};

/* ─── STATO ─── */
const charts = {};
const syncLogs = [], importLogs = [];
let connRPE = false, connWell = false;
let wellInput = {sleep:0,muscle:0,fatigue:0,stress:0,motivation:0};
let curITab = 'gps';
const parsedFiles = {};

let S = { rpeData:{}, rpeSrc:{}, fcData:{}, wellData:{}, wellSrc:{}, gpsData:[] };

/* ─── INIT ─── */
function init() {
  document.getElementById('sessDate').value = new Date().toISOString().split('T')[0];
  if(document.getElementById('sessMinutes')) document.getElementById('sessMinutes').addEventListener('input', renderMinOverrideGrid);
  const hasSaved = loadAll();
  if (!hasSaved) {
    // Prima apertura: genera dati demo
    generateDemoData();
    saveAll();
  } else {
    // Assicura che i giocatori della rosa abbiano dati di monitoraggio
    PLAYERS().forEach(p => {
      if (!S.rpeData[p]) { S.rpeData[p] = {}; S.rpeSrc[p] = {}; DAYS.forEach(d => { S.rpeData[p][d]={rpe:0,min:0,tl:0}; S.rpeSrc[p][d]='demo'; }); }
      if (!S.fcData[p])   S.fcData[p]  = {z5:0,z4:0,z3:0,z2:0,z1:0,tl:0};
      if (!S.wellData[p]) { S.wellData[p]={sleep:3,muscle:3,fatigue:3,stress:3,motivation:3,hi:15}; S.wellSrc[p]='demo'; }
    });
  }
  populateSelects();
  renderRoster();
  renderRosterKpi();
  renderImportContent();
  renderSyncLog();
  renderImportLog();
  renderOverview();
}

function generateDemoData() {
  PLAYERS().forEach(p => {
    S.rpeData[p] = {};
    S.rpeSrc[p]  = {};
    DAYS.forEach(d => {
      const r = rv(4,9), m = rv(45,100);
      S.rpeData[p][d] = {rpe:rnd(r), min:Math.round(m), tl:Math.round(r*m)};
      S.rpeSrc[p][d]  = 'demo';
    });
    S.fcData[p] = {
      z5:Math.round(rv(5,15)), z4:Math.round(rv(10,25)),
      z3:Math.round(rv(8,18)), z2:Math.round(rv(3,10)), z1:Math.round(rv(0,5))
    };
    S.fcData[p].tl = S.fcData[p].z5*5+S.fcData[p].z4*4+S.fcData[p].z3*3+S.fcData[p].z2*2+S.fcData[p].z1;
    S.wellData[p] = {sleep:Math.round(rv(1,5)),muscle:Math.round(rv(1,5)),fatigue:Math.round(rv(1,5)),stress:Math.round(rv(1,4)),motivation:Math.round(rv(1,5))};
    S.wellData[p].hi = WDIMS.reduce((s,k) => s+S.wellData[p][k], 0);
    S.wellSrc[p] = 'demo';
  });
  S.gpsData = PLAYERS().map(p => ({
    p, dist:Math.round(rv(8000,14000)), dmin:rnd(rv(80,140)),
    hsr:Math.round(rv(600,2200)), v20:Math.round(rv(200,900)),
    v25:Math.round(rv(50,400)),   acc:Math.round(rv(300,900)),
    dec:Math.round(rv(300,900)),  nacc:Math.round(rv(30,80)),
    vmax:rnd(rv(25,36)),          rpe:rnd(rv(5,9)), min:Math.round(rv(60,95))
  }));
}

function populateSelects() {
  const opts = PLAYERS().map(p => `<option>${p}</option>`).join('');
  ['rpePlayer','wellPlayer','playerSel','inp_player','fc_player'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

/* ─── HELPERS ─── */
function rnd(v,d=1) { return parseFloat((+v).toFixed(d)); }
function rv(a,b)    { return rnd(a + Math.random()*(b-a)); }
function destroyC(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }
function getTL(p)     { return Object.values(S.rpeData[p]||{}).reduce((s,d)=>s+d.tl,0); }
function totalTL()    { return PLAYERS().reduce((s,p)=>s+getTL(p),0); }
function getMonotony(p) {
  const tls = Object.values(S.rpeData[p]||{}).map(d=>d.tl);
  const avg = tls.reduce((a,b)=>a+b,0)/tls.length;
  const sd  = Math.sqrt(tls.reduce((s,v)=>s+Math.pow(v-avg,2),0)/tls.length)||1;
  return rnd(avg/sd);
}
function getFatigue(p) { return rnd(getTL(p)*getMonotony(p),0); }
function getACWR(p) {
  const tls = Object.values(S.rpeData[p]||{}).map(d=>d.tl);
  return rnd((tls.reduce((a,b)=>a+b,0)/7) / (tls.reduce((a,b)=>a+b,0)/tls.length||1));
}
function riskBadge(v) {
  if (v>1.5) return `<span class="badge badge-red">Alto rischio</span>`;
  if (v>1.3) return `<span class="badge badge-amber">Attenzione</span>`;
  if (v<0.8) return `<span class="badge badge-blue">Sotto-carico</span>`;
  return `<span class="badge badge-green">Ottimale</span>`;
}
function srcTag(src) {
  if (src==='live')   return `<span class="src-live">● live</span>`;
  if (src==='manual') return `<span class="src-manual">● man</span>`;
  return `<span class="src-demo">● demo</span>`;
}

/* ─── NAVIGAZIONE ─── */
function showPage(id, btn) {
  try {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    const el = document.getElementById(id);
    if (!el) { console.error('Pagina non trovata: ' + id); return; }
    el.classList.add('active');
    if (btn) btn.classList.add('active');
    const titleEl = document.getElementById('topbarTitle');
    if (titleEl) titleEl.textContent = PAGE_TITLES[id] || id;
    closeSidebar();
    setTimeout(()=>renderPage(id), 40);
  } catch(e) {
    console.error('showPage error:', e);
  }
}
function renderPage(id) {
  const map = {
    overview:renderOverview, sync:renderSync,
    roster:()=>{renderRoster();renderRosterKpi();},
    rpe:renderRPE, wellness:renderWellness,
    gps:renderGPS, fc:renderFC,
    acwr:renderACWR, players:renderPlayer, import:renderImportPage
  };
  try {
    (map[id] || function(){})();
  } catch(e) {
    console.error('Errore render pagina ' + id + ':', e);
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div style="padding:24px;color:#dc2626"><i class="ti ti-alert-circle" style="font-size:24px"></i><br><strong>Errore caricamento pagina.</strong><br><small>' + e.message + '</small><br><br><button class="btn btn-primary" onclick="clearAll()">Reset dati e ricarica</button></div>';
  }
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

/* ═══════════════════════════════════════════
   GESTIONE ROSA
═══════════════════════════════════════════ */


/* ═══════════════════════════════════════════
   PERSISTENZA LOCALE (localStorage)
═══════════════════════════════════════════ */
const LS = {
  ROSTER:   'bkk_roster',
  RPE:      'bkk_rpe',
  RPE_SRC:  'bkk_rpesrc',
  FC:       'bkk_fc',
  WELL:     'bkk_well',
  WELL_SRC: 'bkk_wellsrc',
  GPS:      'bkk_gps',
  ID_CTR:   'bkk_id_ctr',
};

function saveAll() {
  try {
    localStorage.setItem(LS.ROSTER,   JSON.stringify(ROSTER));
    localStorage.setItem(LS.RPE,      JSON.stringify(S.rpeData));
    localStorage.setItem(LS.RPE_SRC,  JSON.stringify(S.rpeSrc));
    localStorage.setItem(LS.FC,       JSON.stringify(S.fcData));
    localStorage.setItem(LS.WELL,     JSON.stringify(S.wellData));
    localStorage.setItem(LS.WELL_SRC, JSON.stringify(S.wellSrc));
    localStorage.setItem(LS.GPS,      JSON.stringify(S.gpsData));
    localStorage.setItem(LS.ID_CTR,   String(rosterIdCounter));
    localStorage.setItem('bkk_version', APP_VERSION);
  } catch(e) {
    console.warn('localStorage write error:', e);
  }
}

const APP_VERSION = '2.1';
function loadAll() {
  try {
    // Version check: se la versione è diversa resetta tutto
    const savedVersion = localStorage.getItem('bkk_version');
    if (savedVersion && savedVersion !== APP_VERSION) {
      console.log('Versione cambiata (' + savedVersion + ' → ' + APP_VERSION + '), reset localStorage');
      Object.values(LS).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('bkk_version');
      return false;
    }
    const savedRoster = localStorage.getItem(LS.ROSTER);
    if (savedRoster) {
      ROSTER = JSON.parse(savedRoster);
      console.log('✓ Rosa caricata: ' + ROSTER.length + ' giocatori');
    }
    const savedIdCtr = localStorage.getItem(LS.ID_CTR);
    if (savedIdCtr) rosterIdCounter = parseInt(savedIdCtr) || 16;

    const savedRpe = localStorage.getItem(LS.RPE);
    if (savedRpe) S.rpeData = JSON.parse(savedRpe);

    const savedRpeSrc = localStorage.getItem(LS.RPE_SRC);
    if (savedRpeSrc) S.rpeSrc = JSON.parse(savedRpeSrc);

    const savedFc = localStorage.getItem(LS.FC);
    if (savedFc) S.fcData = JSON.parse(savedFc);

    const savedWell = localStorage.getItem(LS.WELL);
    if (savedWell) S.wellData = JSON.parse(savedWell);

    const savedWellSrc = localStorage.getItem(LS.WELL_SRC);
    if (savedWellSrc) S.wellSrc = JSON.parse(savedWellSrc);

    const savedGps = localStorage.getItem(LS.GPS);
    if (savedGps) S.gpsData = JSON.parse(savedGps);

    return !!savedRoster; // true = dati esistenti trovati
  } catch(e) {
    console.warn('localStorage read error:', e);
    return false;
  }
}


/* ═══════════════════════════════════════════
   SISTEMA RESET GRANULARE
   Permette di cancellare dati per singola sezione
   o singolo giocatore senza perdere tutto
═══════════════════════════════════════════ */

function showResetPanel() {
  // Crea il pannello modal di reset se non esiste
  let panel = document.getElementById('resetPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'resetPanel';
    panel.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:300;align-items:center;justify-content:center;';
    panel.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:24px;width:90%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.25);max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #fef3c7">
          <span style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#006B4D">🗑 Gestione Dati</span>
          <button onclick="document.getElementById('resetPanel').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:22px;color:#a3a3a3;line-height:1">×</button>
        </div>

        <!-- Reset per sezione -->
        <div style="margin-bottom:20px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#637870;margin-bottom:10px">Cancella dati per sezione</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <button class="btn" onclick="resetSection('rpe')" style="justify-content:flex-start;gap:8px;border-color:#e5e5e5">
              <i class="ti ti-activity" style="color:#00A878"></i> RPE & Training Load
            </button>
            <button class="btn" onclick="resetSection('wellness')" style="justify-content:flex-start;gap:8px;border-color:#e5e5e5">
              <i class="ti ti-heart-rate-monitor" style="color:#00A878"></i> Wellness
            </button>
            <button class="btn" onclick="resetSection('gps')" style="justify-content:flex-start;gap:8px;border-color:#e5e5e5">
              <i class="ti ti-map-pin" style="color:#00A878"></i> GPS
            </button>
            <button class="btn" onclick="resetSection('fc')" style="justify-content:flex-start;gap:8px;border-color:#e5e5e5">
              <i class="ti ti-heart" style="color:#00A878"></i> Frequenza Cardiaca
            </button>
          </div>
        </div>

        <!-- Reset RPE singolo giocatore -->
        <div style="margin-bottom:20px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#637870;margin-bottom:8px">Cancella RPE di un giocatore</div>
          <div style="display:flex;gap:8px">
            <select id="resetPlayerSel" style="flex:1;padding:7px 10px;border:1.5px solid #e5e5e5;border-radius:7px;font-size:12px"></select>
            <select id="resetDaySel" style="padding:7px 10px;border:1.5px solid #e5e5e5;border-radius:7px;font-size:12px">
              <option value="all">Tutti i giorni</option>
              <option>MD+1</option><option>MD+2</option><option>MD+3</option>
              <option>MD-3</option><option>MD-2</option><option>MD-1</option><option>MD</option>
            </select>
            <button class="btn btn-danger btn-sm" onclick="resetPlayerRPE()">Cancella</button>
          </div>
        </div>

        <!-- Reset Wellness singolo giocatore -->
        <div style="margin-bottom:20px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#637870;margin-bottom:8px">Cancella Wellness di un giocatore</div>
          <div style="display:flex;gap:8px">
            <select id="resetWellPlayerSel" style="flex:1;padding:7px 10px;border:1.5px solid #e5e5e5;border-radius:7px;font-size:12px"></select>
            <button class="btn btn-danger btn-sm" onclick="resetPlayerWellness()">Cancella</button>
          </div>
        </div>

        <!-- Reset totale -->
        <div style="border-top:1px solid #f5f5f5;padding-top:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#637870;margin-bottom:8px">Reset completo</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <button class="btn btn-danger" onclick="resetAllData()" style="font-size:12px">
              <i class="ti ti-database-off"></i> Cancella tutti i dati
            </button>
            <button class="btn btn-danger" onclick="resetEverything()" style="font-size:12px">
              <i class="ti ti-refresh-alert"></i> Reset completo app
            </button>
          </div>
          <div style="font-size:10px;color:#a3a3a3;margin-top:6px">Reset completo app cancella anche la rosa e riparte da zero</div>
        </div>

        <!-- Log operazioni -->
        <div id="resetLog" style="margin-top:12px;font-size:11px;color:#00A878;min-height:20px"></div>
      </div>`;
    document.body.appendChild(panel);
  }

  // Popola i select con i giocatori
  const opts = PLAYERS().map(p => `<option>${p}</option>`).join('');
  const rSel  = document.getElementById('resetPlayerSel');
  const wSel  = document.getElementById('resetWellPlayerSel');
  if (rSel) rSel.innerHTML = opts;
  if (wSel) wSel.innerHTML = opts;

  panel.style.display = 'flex';
}

function logReset(msg) {
  const el = document.getElementById('resetLog');
  if (el) el.innerHTML = '<i class="ti ti-check" style="color:var(--green-ok)"></i> ' + msg;
}

function resetSection(section) {
  const labels = {rpe:'RPE & TL', wellness:'Wellness', gps:'GPS', fc:'Frequenza Cardiaca'};
  if (!confirm('Cancellare tutti i dati ' + (labels[section]||section) + '? Questa operazione è irreversibile.')) return;

  switch(section) {
    case 'rpe':
      PLAYERS().forEach(p => {
        S.rpeData[p] = {};
        S.rpeSrc[p]  = {};
        DAYS.forEach(d => { S.rpeData[p][d] = {rpe:0, min:0, tl:0}; S.rpeSrc[p][d] = 'demo'; });
      });
      break;
    case 'wellness':
      PLAYERS().forEach(p => {
        S.wellData[p] = {sleep:3, muscle:3, fatigue:3, stress:3, motivation:3, hi:15};
        S.wellSrc[p]  = 'demo';
      });
      break;
    case 'gps':
      S.gpsData = [];
      break;
    case 'fc':
      PLAYERS().forEach(p => { S.fcData[p] = {z5:0,z4:0,z3:0,z2:0,z1:0,tl:0}; });
      break;
  }
  saveAll();
  logReset('Dati ' + (labels[section]||section) + ' cancellati.');
  const ap = document.querySelector('.page.active')?.id;
  if (ap) setTimeout(() => renderPage(ap), 100);
}

function resetPlayerRPE() {
  const p   = document.getElementById('resetPlayerSel')?.value;
  const day = document.getElementById('resetDaySel')?.value;
  if (!p) return;
  if (!confirm('Cancellare RPE di ' + p + (day==='all' ? ' (tutti i giorni)' : ' - ' + day) + '?')) return;

  if (!S.rpeData[p]) S.rpeData[p] = {};
  if (!S.rpeSrc[p])  S.rpeSrc[p]  = {};

  if (day === 'all') {
    DAYS.forEach(d => { S.rpeData[p][d] = {rpe:0,min:0,tl:0}; S.rpeSrc[p][d] = 'demo'; });
    logReset('RPE di ' + p + ' (tutti i giorni) cancellati.');
  } else {
    S.rpeData[p][day] = {rpe:0, min:0, tl:0};
    S.rpeSrc[p][day]  = 'demo';
    logReset('RPE di ' + p + ' - ' + day + ' cancellato.');
  }
  saveAll();
  const ap = document.querySelector('.page.active')?.id;
  if (ap) setTimeout(() => renderPage(ap), 100);
}

function resetPlayerWellness() {
  const p = document.getElementById('resetWellPlayerSel')?.value;
  if (!p) return;
  if (!confirm('Cancellare dati Wellness di ' + p + '?')) return;
  S.wellData[p] = {sleep:3, muscle:3, fatigue:3, stress:3, motivation:3, hi:15};
  S.wellSrc[p]  = 'demo';
  saveAll();
  logReset('Wellness di ' + p + ' cancellato.');
  const ap = document.querySelector('.page.active')?.id;
  if (ap) setTimeout(() => renderPage(ap), 100);
}

function resetAllData() {
  if (!confirm('Cancellare TUTTI i dati (RPE, Wellness, GPS, FC)?\nLa rosa dei giocatori verrà mantenuta.')) return;
  PLAYERS().forEach(p => {
    S.rpeData[p]  = {};
    S.rpeSrc[p]   = {};
    DAYS.forEach(d => { S.rpeData[p][d]={rpe:0,min:0,tl:0}; S.rpeSrc[p][d]='demo'; });
    S.fcData[p]   = {z5:0,z4:0,z3:0,z2:0,z1:0,tl:0};
    S.wellData[p] = {sleep:3,muscle:3,fatigue:3,stress:3,motivation:3,hi:15};
    S.wellSrc[p]  = 'demo';
  });
  S.gpsData = [];
  saveAll();
  logReset('Tutti i dati cancellati. Rosa mantenuta.');
  setTimeout(() => renderPage('overview'), 200);
}

function resetEverything() {
  if (!confirm('Reset COMPLETO dell\'app?\nVerranno cancellati tutti i dati E la rosa dei giocatori.\n\nSei sicuro?')) return;
  Object.values(LS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('bkk_version');
  location.reload();
}

function clearAll() { showResetPanel(); }

function exportData() {
  const data = {
    roster:   ROSTER,
    rpeData:  S.rpeData,
    rpeSrc:   S.rpeSrc,
    fcData:   S.fcData,
    wellData: S.wellData,
    wellSrc:  S.wellSrc,
    gpsData:  S.gpsData,
    exportedAt: new Date().toISOString(),
    version: '2.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `birkirkara-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.roster) throw new Error('File non valido');
        ROSTER       = data.roster;
        S.rpeData    = data.rpeData  || {};
        S.rpeSrc     = data.rpeSrc   || {};
        S.fcData     = data.fcData   || {};
        S.wellData   = data.wellData || {};
        S.wellSrc    = data.wellSrc  || {};
        S.gpsData    = data.gpsData  || [];
        rosterIdCounter = Math.max(...ROSTER.map(p=>p.id), 15) + 1;
        saveAll();
        populateSelects();
        renderRoster(); renderRosterKpi(); renderOverview();
        alert(`✓ Backup ripristinato: ${ROSTER.length} giocatori caricati.`);
      } catch(err) {
        alert('Errore lettura file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ─── PHOTO MANAGEMENT ─── */
let currentPhotoB64 = null;

function previewPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Immagine troppo grande. Max 5 MB.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    currentPhotoB64 = e.target.result; // data:image/...;base64,...
    updatePhotoPreview(currentPhotoB64);
  };
  reader.readAsDataURL(file);
}

function updatePhotoPreview(src) {
  const wrap = document.getElementById('m_foto_preview_wrap');
  if (!wrap) return;
  if (src) {
    wrap.innerHTML = `<img src="${src}" class="photo-preview" alt="Foto giocatore">`;
  } else {
    wrap.innerHTML = `<div class="photo-preview-placeholder" id="m_foto_placeholder"><i class="ti ti-camera" aria-hidden="true"></i></div>`;
  }
}

function resetPhotoPreview() {
  currentPhotoB64 = null;
  updatePhotoPreview(null);
  const inp = document.getElementById('m_foto_input');
  if (inp) inp.value = '';
}

function openModal(id=null) {
  editingPlayerId = id;
  document.getElementById('modalTitle').textContent = id!==null ? 'Modifica Giocatore' : 'Aggiungi Giocatore';
  if (id !== null) {
    const p = ROSTER.find(x=>x.id===id);
    if (!p) return;
    document.getElementById('m_nome').value    = p.nome;
    document.getElementById('m_cognome').value = p.cognome;
    document.getElementById('m_numero').value  = p.numero;
    document.getElementById('m_ruolo').value   = p.ruolo;
    document.getElementById('m_dob').value     = p.dob;
    document.getElementById('m_naz').value     = p.naz;
    document.getElementById('m_altezza').value = p.altezza;
    document.getElementById('m_peso').value    = p.peso;
    document.getElementById('m_piede').value   = p.piede;
    document.getElementById('m_stato').value   = p.stato;
    document.getElementById('m_note').value    = p.note;
    // Carica foto esistente
    currentPhotoB64 = p.photo || null;
    updatePhotoPreview(currentPhotoB64);
  } else {
    ['m_nome','m_cognome','m_numero','m_dob','m_naz','m_altezza','m_peso','m_note'].forEach(i=>{ document.getElementById(i).value=''; });
    document.getElementById('m_ruolo').value=''; document.getElementById('m_piede').value='Destro'; document.getElementById('m_stato').value='Disponibile';
    resetPhotoPreview();
  }
  document.getElementById('playerModal').classList.add('open');
}

function closeModal() {
  document.getElementById('playerModal').classList.remove('open');
  editingPlayerId = null;
  resetPhotoPreview();
}

function savePlayer() {
  const nome    = document.getElementById('m_nome').value.trim();
  const cognome = document.getElementById('m_cognome').value.trim();
  if (!nome||!cognome) { alert('Nome e Cognome sono obbligatori'); return; }
  const player = {
    id: editingPlayerId ?? rosterIdCounter++,
    photo: currentPhotoB64,
    nome, cognome,
    numero:  parseInt(document.getElementById('m_numero').value)||0,
    ruolo:   document.getElementById('m_ruolo').value,
    dob:     document.getElementById('m_dob').value,
    naz:     document.getElementById('m_naz').value,
    altezza: parseInt(document.getElementById('m_altezza').value)||0,
    peso:    parseInt(document.getElementById('m_peso').value)||0,
    piede:   document.getElementById('m_piede').value,
    stato:   document.getElementById('m_stato').value,
    note:    document.getElementById('m_note').value,
  };
  if (editingPlayerId !== null) {
    const idx = ROSTER.findIndex(x=>x.id===editingPlayerId);
    if (idx>=0) ROSTER[idx] = player;
  } else {
    ROSTER.push(player);
    const key = player.cognome+' '+player.nome.charAt(0)+'.';
    S.rpeData[key]  = {}; S.rpeSrc[key] = {};
    DAYS.forEach(d=>{ S.rpeData[key][d]={rpe:0,min:0,tl:0}; S.rpeSrc[key][d]='demo'; });
    S.fcData[key]   = {z5:0,z4:0,z3:0,z2:0,z1:0,tl:0};
    S.wellData[key] = {sleep:3,muscle:3,fatigue:3,stress:3,motivation:3,hi:15};
    S.wellSrc[key]  = 'demo';
  }
  saveAll();
  closeModal();
  populateSelects();
  renderRoster();
  renderRosterKpi();
}

function deletePlayer(id) {
  if (!confirm('Eliminare questo giocatore dalla rosa?')) return;
  ROSTER = ROSTER.filter(x=>x.id!==id);
  saveAll();
  populateSelects();
  renderRoster();
  renderRosterKpi();
}

function setRosterView(view, btn) {
  rosterView = view;
  document.querySelectorAll('#roster .tab-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('rosterCards').style.display = view==='cards'?'grid':'none';
  document.getElementById('rosterTable').style.display = view==='table'?'block':'none';
}

function renderRosterKpi() {
  const el = document.getElementById('rosterKpi');
  if (!el) return;
  const tot  = ROSTER.length;
  const disp = ROSTER.filter(p=>p.stato==='Disponibile').length;
  const inj  = ROSTER.filter(p=>p.stato==='Infortunato').length;
  const rec  = ROSTER.filter(p=>p.stato==='In recupero'||p.stato==='Squalificato').length;
  const roles= [...new Set(ROSTER.map(p=>p.ruolo))].length;
  el.innerHTML = `
    <div class="kpi-card c-primary"><div class="kpi-label">Totale rosa</div><div class="kpi-value">${tot}</div><div class="kpi-sub">giocatori</div></div>
    <div class="kpi-card c-green"><div class="kpi-label">Disponibili</div><div class="kpi-value">${disp}</div><div class="kpi-sub">pronti</div></div>
    <div class="kpi-card c-red"><div class="kpi-label">Infortunati</div><div class="kpi-value">${inj}</div><div class="kpi-sub">fuori rosa</div></div>
    <div class="kpi-card c-amber"><div class="kpi-label">In recupero</div><div class="kpi-value">${rec}</div><div class="kpi-sub">limitati</div></div>
    <div class="kpi-card c-yellow"><div class="kpi-label">Ruoli</div><div class="kpi-value">${roles}</div><div class="kpi-sub">reparti coperti</div></div>`;
}

function renderRoster() {
  const search = (document.getElementById('rosterSearch')?.value||'').toLowerCase();
  const ruoloF = document.getElementById('rosterRuolo')?.value||'';
  const statoF = document.getElementById('rosterStato')?.value||'';
  const filtered = ROSTER.filter(p => {
    const nm = !search||(p.nome+' '+p.cognome).toLowerCase().includes(search);
    const rl = !ruoloF||p.ruolo===ruoloF;
    const st = !statoF||p.stato===statoF;
    return nm&&rl&&st;
  }).sort((a,b)=>a.numero-b.numero);

  const cardsEl = document.getElementById('rosterCards');
  if (cardsEl) {
    if (!filtered.length) {
      cardsEl.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--gray-400)"><i class="ti ti-user-off" style="font-size:32px;display:block;margin-bottom:8px"></i>Nessun giocatore trovato</div>';
    } else {
      cardsEl.innerHTML = filtered.map(p=>{
        const init = (p.nome.charAt(0)+p.cognome.charAt(0)).toUpperCase();
        const col  = RUOLO_COLOR[p.ruolo]||'#637870';
        const sb   = STATUS_BADGE[p.stato]||'badge-gray';
        const age  = p.dob ? Math.floor((Date.now()-new Date(p.dob))/(365.25*86400000)) : '—';
        const avatarHtml = p.photo
          ? `<img src="${p.photo}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ${col};flex-shrink:0" alt="${p.nome}">`
          : `<div class="player-avatar" style="background:linear-gradient(135deg,${col} 0%,${col}bb 100%)">${init}</div>`;
        return `<div class="player-card">
          <span class="player-num">${p.numero||'—'}</span>
          <div class="player-card-top">
            ${avatarHtml}
            <div><div class="player-name">${p.cognome} ${p.nome}</div><div class="player-role">${p.ruolo||'—'} · ${age} anni</div></div>
          </div>
          <div class="player-info">
            <span class="player-tag pos">${p.ruolo||'—'}</span>
            <span class="player-tag">${p.piede}</span>
            ${p.naz?`<span class="player-tag">${p.naz}</span>`:''}
            ${p.altezza?`<span class="player-tag">${p.altezza}cm</span>`:''}
            ${p.peso?`<span class="player-tag">${p.peso}kg</span>`:''}
          </div>
          ${p.note?`<div style="font-size:10px;color:var(--gray-500);margin-bottom:8px;font-style:italic">${p.note}</div>`:''}
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="badge ${sb}">${p.stato}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm" onclick="openModal(${p.id})" title="Modifica"><i class="ti ti-pencil"></i></button>
              <button class="btn btn-sm btn-danger" onclick="deletePlayer(${p.id})" title="Elimina"><i class="ti ti-trash"></i></button>
            </div>
          </div>
        </div>`;
      }).join('');
    }
  }

  const tableEl = document.getElementById('rosterTableBody');
  if (tableEl) {
    tableEl.innerHTML = filtered.map(p=>{
      const sb = STATUS_BADGE[p.stato]||'badge-gray';
      const col= RUOLO_COLOR[p.ruolo]||'#637870';
      return `<tr>
        <td style="font-family:'DM Mono',monospace;font-weight:600">${p.numero||'—'}</td>
        <td><strong>${p.cognome} ${p.nome}</strong></td>
        <td><span style="background:${col}22;color:${col};font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${p.ruolo||'—'}</span></td>
        <td style="font-family:'DM Mono',monospace">${p.dob||'—'}</td>
        <td>${p.naz||'—'}</td>
        <td style="font-family:'DM Mono',monospace">${p.altezza?p.altezza+'cm':'—'}</td>
        <td style="font-family:'DM Mono',monospace">${p.peso?p.peso+'kg':'—'}</td>
        <td>${p.piede||'—'}</td>
        <td><span class="badge ${sb}">${p.stato}</span></td>
        <td style="color:var(--gray-500);font-style:italic;font-size:11px;max-width:120px;overflow:hidden;text-overflow:ellipsis">${p.note||'—'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm" onclick="openModal(${p.id})"><i class="ti ti-pencil"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deletePlayer(${p.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  }
}

/* chiudi modal con ESC o click fuori */
document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });

/* ═══════════════════════════════════════════
   GOOGLE SHEETS SYNC
═══════════════════════════════════════════ */
function connectRPE() {
  connRPE=true;
  ['dotRPE','dotRPE2'].forEach(id=>{const el=document.getElementById(id);if(el)el.className='sync-dot ok';});
  const b=document.getElementById('rpeBadge'); if(b){b.textContent='Connesso';b.className='badge badge-green';}
  const i=document.getElementById('rpeConnInfo'); if(i)i.style.display='block';
  addSyncLog('RPE Forms','Collegato',0,'ok');
}
function connectWell() {
  connWell=true;
  ['dotWell','dotWell2'].forEach(id=>{const el=document.getElementById(id);if(el)el.className='sync-dot ok';});
  const b=document.getElementById('wellBadge'); if(b){b.textContent='Connesso';b.className='badge badge-green';}
  const i=document.getElementById('wellConnInfo'); if(i)i.style.display='block';
  addSyncLog('Wellness Forms','Collegato',0,'ok');
}

/* ─── CORS-safe CSV fetch ─── */
async function fetchCSV(url) {
  // Prova diretta prima (a volte funziona con CORS headers di Google)
  try {
    const r = await fetch(url, {mode:'cors'});
    if (r.ok) { const t = await r.text(); if (t && t.length > 10) return t; }
  } catch(e) {}
  // Fallback: proxy allorigins per bypassare CORS
  try {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const r = await fetch(proxy);
    if (r.ok) { const d = await r.json(); return d.contents || ''; }
  } catch(e) {}
  // Fallback 2: corsproxy.io
  try {
    const proxy2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const r = await fetch(proxy2);
    if (r.ok) return await r.text();
  } catch(e) {}
  return null;
}

function matchPlayer(rawName) {
  const raw = rawName.toLowerCase().trim().replace(/\s+/g,' ');
  // 1. Match esatto
  let p = PLAYERS().find(pl => pl.toLowerCase().replace('.','').trim() === raw);
  if (p) return p;
  // 2. Match per ogni parola del nome (lunghezza > 2)
  const rawParts = raw.split(' ').filter(x=>x.length>2);
  p = PLAYERS().find(pl => {
    const plParts = pl.toLowerCase().replace('.','').split(' ').filter(x=>x.length>2);
    // Almeno due parole in comune O una parola lunga >4 in comune
    const matches = plParts.filter(pp => rawParts.some(rp => pp.includes(rp)||rp.includes(pp)));
    return matches.length >= 1 && (matches.length >= 2 || matches.some(m=>m.length>4));
  });
  if (p) return p;
  // 3. Match cognome (prima parola del nome raw contro prima parola del player)
  p = PLAYERS().find(pl => {
    const plFirst = pl.toLowerCase().split(' ')[0];
    const rawFirst = raw.split(' ')[0];
    return plFirst === rawFirst && plFirst.length > 3;
  });
  return p || rawName;
}

async function syncAll() {
  const btn = document.getElementById('syncBtn');
  btn.innerHTML = '<i class="ti ti-refresh spin"></i> Sync...';
  btn.disabled = true;
  let rpeU = 0;
  const md = document.getElementById('sessMD')?.value || 'MD-1';
  const sessMinGlobal = parseInt(document.getElementById('sessMinutes')?.value) || 75;

  try {
    const csvText = await fetchCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vR4YuMaExxKAj4GzR3x4rGvvMd7aBb9nI6TmkvBo0udVbWjXLT9IedUK08BfklRjbmj-lyoxo3WWz6G/pub?gid=2015047575&single=true&output=csv');
    if (csvText) {
      const rows = Papa.parse(csvText, {header:true, skipEmptyLines:true}).data;
      rows.forEach(row => {
        const keys = Object.keys(row);
        const rawName = (row[keys[1]] || '').trim();
        const rpeV = parseFloat(row[keys[2]]) || 0;
        if (!rawName || !rpeV) return;
        const p = matchPlayer(rawName);
        if (!S.rpeData[p]) S.rpeData[p] = {};
        if (!S.rpeSrc[p])  S.rpeSrc[p]  = {};
        const override = parseInt(document.getElementById('min_override_' + p.replace(/[^a-z0-9]/gi,'_'))?.value) || 0;
        const gpsRow = S.gpsData.find(g => g.p === p);
        const min = override || gpsRow?.min || sessMinGlobal;
        S.rpeData[p][md] = {rpe: rpeV, min, tl: Math.round(rpeV * min)};
        S.rpeSrc[p][md] = 'live';
        rpeU++;
      });
      console.log('RPE sync: ' + rpeU + ' atleti aggiornati');
    }
  } catch(e) { console.error('RPE sync error:', e); }

  // Wellness: import manuale tramite drop zone CSV nella tab Google Forms
  saveAll();
  document.getElementById('lastSync').textContent = 'Sync: ' + new Date().toLocaleTimeString('it-IT');
  addSyncLog('RPE Forms', rpeU > 0 ? rpeU + ' atleti aggiornati' : 'Foglio vuoto', rpeU, rpeU > 0 ? 'ok' : 'wait');
  btn.innerHTML = '<i class="ti ti-refresh"></i> Sincronizza';
  btn.disabled = false;
  const activePage = document.querySelector('.page.active')?.id;
  if (activePage) renderPage(activePage);
}

function applySess() {
  const tipo = document.getElementById('sessType').value;
  const data = document.getElementById('sessDate').value;
  const md   = document.getElementById('sessMD').value;
  const min  = document.getElementById('sessMinutes')?.value||75;
  addSyncLog('Sessione', `${tipo} · ${data} · ${min}' → ${md}`, PLAYERS().length, 'ok');
  // Aggiorna immediatamente i minuti nei TL esistenti di questo MD (senza sovrascrivere override)
  PLAYERS().forEach(p => {
    const override = parseInt(document.getElementById('min_override_'+p.replace(/[^a-z0-9]/gi,'_'))?.value)||0;
    if (S.rpeData[p]?.[md] && !override) {
      const gpsRow = S.gpsData.find(g=>g.p===p);
      const newMin = gpsRow?.min || parseInt(min) || 75;
      S.rpeData[p][md].min = newMin;
      S.rpeData[p][md].tl  = Math.round(S.rpeData[p][md].rpe * newMin);
    }
  });
  saveAll();
  alert(`✓ Sessione impostata:\n${tipo} del ${data}\nDurata: ${min} minuti → ${md}\n\nPremi Sincronizza per caricare le risposte RPE.`);
}
function addSyncLog(fonte,stato,n,type) {
  syncLogs.unshift({ts:new Date().toLocaleString('it-IT'),fonte,stato,n,type});
  renderSyncLog();
}

/* ─── OVERRIDE MINUTI PER GIOCATORE ─── */
function renderMinOverrideGrid() {
  const grid = document.getElementById('minOverrideGrid');
  if (!grid) return;
  const globalMin = document.getElementById('sessMinutes')?.value || 75;
  grid.innerHTML = ROSTER.sort((a,b)=>a.numero-b.numero).map(p => {
    const key = (p.cognome+' '+p.nome.charAt(0)+'.').replace(/[^a-z0-9]/gi,'_');
    const gpsRow = S.gpsData.find(g => g.p === p.cognome+' '+p.nome.charAt(0)+'.');
    const gpsMin = gpsRow?.min || '';
    const col = RUOLO_COLOR[p.ruolo]||'#637870';
    return `<div style="display:flex;align-items:center;gap:6px;background:var(--white);border:1px solid var(--gray-200);border-radius:7px;padding:6px 8px">
      <div style="width:28px;height:28px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0">${(p.nome.charAt(0)+p.cognome.charAt(0)).toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:600;color:var(--gray-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.cognome} ${p.nome}</div>
        <div style="font-size:9px;color:var(--gray-400)">${gpsMin ? 'GPS: ' + gpsMin + '\'' : 'No GPS · Default: ' + globalMin + '\''}</div>
      </div>
      <input type="number" id="min_override_${key}" min="1" max="180" placeholder="${gpsMin||globalMin}"
        style="width:52px;font-size:12px;padding:3px 5px;border:1.5px solid var(--gray-200);border-radius:5px;text-align:center;font-family:'DM Mono',monospace"
        title="Override minuti per ${p.nome} ${p.cognome}">
    </div>`;
  }).join('');
}


/* ═══════════════════════════════════════════
   IMPORT WELLNESS DA CSV MANUALE
═══════════════════════════════════════════ */
function handleWellnessImport(event) {
  const file = event.target?.files?.[0] || event;
  if (!file) return;
  const dz = document.getElementById('dz_wellness_forms');
  const ds = document.getElementById('ds_wellness_forms');
  if (ds) ds.textContent = 'Lettura...';

  const processRows = (rows) => {
    if (!rows || !rows.length) {
      if (ds) ds.innerHTML = '<span style="color:var(--red)">File vuoto o formato non riconosciuto</span>';
      if (dz) dz.classList.add('err');
      return;
    }
    let updated = 0;
    const preview = [];
    rows.forEach(row => {
      const keys = Object.keys(row);
      if (keys.length < 3) return;
      const rawName = (row[keys[1]] || '').toString().trim();
      if (!rawName) return;
      const p = matchPlayer(rawName);
      const v = (i) => { const n=parseInt(row[keys[i]]); return (n>=1&&n<=7)?n:null; };
      if (!S.wellData[p]) S.wellData[p]={sleep:3,muscle:3,fatigue:3,stress:3,motivation:3,hi:15};
      const s=v(2); if(s!==null) S.wellData[p].sleep      = s;
      const d=v(3); if(d!==null) S.wellData[p].muscle     = d;
      const f=v(4); if(f!==null) S.wellData[p].fatigue    = f;
      const t=v(5); if(t!==null) S.wellData[p].stress     = t;
      const m=v(6); if(m!==null) S.wellData[p].motivation = m;
      S.wellData[p].hi = WDIMS.reduce((s,k)=>s+S.wellData[p][k],0);
      S.wellSrc[p] = 'live';
      updated++;
      preview.push({ nome:rawName, p, d:S.wellData[p] });
    });
    if (!updated) {
      if (ds) ds.innerHTML = '<span style="color:var(--red)">Nessun dato valido. Controlla le colonne.</span>';
      if (dz) dz.classList.add('err'); return;
    }
    saveAll();
    if (dz) { dz.classList.remove('err'); dz.classList.add('ok'); }
    if (ds) ds.innerHTML = `<span style="color:var(--green-ok)">✓ ${updated} atleti importati da "${file.name}"</span>`;
    const badge=document.getElementById('wellBadge');
    if(badge){badge.textContent=`✓ ${updated} atleti · ${new Date().toLocaleTimeString('it-IT')}`;badge.className='badge badge-green';}
    ['dotWell','dotWell2'].forEach(id=>{const el=document.getElementById(id);if(el)el.className='sync-dot ok';});
    // Preview
    const prevDiv=document.getElementById('wellImportPreview');
    const prevTbl=document.getElementById('wellPreviewTable');
    if(prevDiv&&prevTbl){
      prevDiv.style.display='block';
      prevTbl.innerHTML=`<thead><tr><th>Nome foglio</th><th>Abbinato</th><th>Sonno</th><th>Dolori</th><th>Stanch.</th><th>Stress</th><th>Motiv.</th><th>HI/35</th></tr></thead><tbody>${
        preview.map(r=>{
          const cl=r.d.hi>=25?'badge-red':r.d.hi>=18?'badge-amber':'badge-green';
          return `<tr><td style="font-size:10px;color:var(--gray-500)">${r.nome}</td><td><strong>${r.p}</strong></td><td style="text-align:center">${r.d.sleep}</td><td style="text-align:center">${r.d.muscle}</td><td style="text-align:center">${r.d.fatigue}</td><td style="text-align:center">${r.d.stress}</td><td style="text-align:center">${r.d.motivation}</td><td><span class="badge ${cl}">${r.d.hi}/35</span></td></tr>`;
        }).join('')
      }</tbody>`;
    }
    addSyncLog('Wellness CSV',''+updated+' atleti aggiornati',updated,'ok');
    const ap=document.querySelector('.page.active')?.id;
    if(ap) renderPage(ap);
  };

  const ext = file.name.split('.').pop().toLowerCase();
  if (ext==='csv') {
    Papa.parse(file,{header:true,skipEmptyLines:true,complete:res=>processRows(res.data)});
  } else if(['xlsx','xls'].includes(ext)) {
    const reader=new FileReader();
    reader.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];processRows(XLSX.utils.sheet_to_json(ws,{defval:''}));}catch(e){if(ds)ds.textContent='Errore Excel';}};
    reader.readAsArrayBuffer(file);
  }
}

function setupWellnessDZ() {
  const dzone=document.getElementById('dz_wellness_forms');
  if(!dzone) return;
  dzone.addEventListener('dragover', e=>{e.preventDefault();dzone.classList.add('drag');});
  dzone.addEventListener('dragleave',()=>dzone.classList.remove('drag'));
  dzone.addEventListener('drop',e=>{
    e.preventDefault();dzone.classList.remove('drag');
    const f=e.dataTransfer.files[0];
    if(f) handleWellnessImport(f);
  });
}

function renderSync() { renderSyncLog(); renderMinOverrideGrid(); setupWellnessDZ(); }
function renderSyncLog() {
  const el=document.getElementById('syncLog'); if(!el)return;
  if(!syncLogs.length){el.innerHTML='<tr><td colspan="4" style="text-align:center;padding:14px;color:var(--gray-400)">Nessuna sincronizzazione ancora</td></tr>';return;}
  el.innerHTML=syncLogs.map(l=>`<tr><td style="font-family:'DM Mono',monospace;font-size:11px">${l.ts}</td><td><strong>${l.fonte}</strong></td><td>${l.n||'—'}</td><td><span class="badge ${l.type==='ok'?'badge-green':l.type==='wait'?'badge-amber':'badge-red'}">${l.stato}</span></td></tr>`).join('');
}

/* ═══════════════════════════════════════════
   OVERVIEW
═══════════════════════════════════════════ */
function renderOverview() {
  const tot=totalTL();
  const avgACWR=rnd(PLAYERS().reduce((s,p)=>s+getACWR(p),0)/PLAYERS().length);
  const avgHI=rnd(PLAYERS().reduce((s,p)=>s+(S.wellData[p]?.hi||0),0)/PLAYERS().length);
  const avgRPE=rnd(PLAYERS().reduce((s,p)=>s+Object.values(S.rpeData[p]||{}).reduce((a,d)=>a+d.rpe,0)/DAYS.length,0)/PLAYERS().length);
  const atRisk=PLAYERS().filter(p=>getACWR(p)>1.3||getACWR(p)<0.8).length;
  const liveRPE=PLAYERS().filter(p=>Object.values(S.rpeSrc[p]||{}).some(s=>s==='live')).length;
  document.getElementById('kpiGrid').innerHTML=`
    <div class="kpi-card c-primary"><div class="kpi-label">TL Totale Squadra</div><div class="kpi-value">${tot.toLocaleString()}</div><div class="kpi-sub">UA settimanale</div></div>
    <div class="kpi-card ${(avgACWR>1.3||avgACWR<0.8)?'c-amber':'c-primary'}"><div class="kpi-label">ACWR medio</div><div class="kpi-value">${avgACWR}</div><div class="kpi-sub">ottimale 0.8–1.3</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">RPE medio</div><div class="kpi-value">${avgRPE}</div><div class="kpi-sub">0–10 Foster</div></div>
    <div class="kpi-card ${avgHI>25?'c-red':avgHI>18?'c-amber':'c-primary'}"><div class="kpi-label">HI medio (5 dim.)</div><div class="kpi-value">${avgHI}</div><div class="kpi-sub">/ 35</div></div>
    <div class="kpi-card ${atRisk>3?'c-red':atRisk>1?'c-amber':'c-green'}"><div class="kpi-label">A rischio</div><div class="kpi-value">${atRisk}</div><div class="kpi-sub">ACWR fuori range</div></div>
    <div class="kpi-card c-green"><div class="kpi-label">RPE live</div><div class="kpi-value">${liveRPE}</div><div class="kpi-sub">/ ${PLAYERS().length} atleti</div></div>`;
  const playerCount = PLAYERS().length || 1;
  const dayTotals=DAYS.map(d=>{
    const vals = PLAYERS().map(p=>S.rpeData[p]?.[d]?.tl||0).filter(v=>v>0);
    return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
  });
  destroyC('tlWeekChart');
  charts.tlWeekChart=new Chart(document.getElementById('tlWeekChart'),{type:'bar',data:{labels:DAYS,datasets:[{label:'TL medio',data:dayTotals,backgroundColor:'#00A878',borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'rgba(0,0,0,.05)'},ticks:{font:{size:10}}},x:{ticks:{font:{size:11}}}}}});
  const acwrs=PLAYERS().map(p=>getACWR(p));
  destroyC('acwrChart');
  charts.acwrChart=new Chart(document.getElementById('acwrChart'),{type:'bar',data:{labels:PLAYERS().map(p=>p.split(' ')[0]),datasets:[{label:'ACWR',data:acwrs,backgroundColor:acwrs.map(v=>v>1.3?'#dc2626':v<0.8?'#1d4ed8':'#00A878'),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:2,ticks:{font:{size:10}}},x:{ticks:{font:{size:9}}}}}});
  document.getElementById('statusBody').innerHTML=PLAYERS().map(p=>{
    const acwr=getACWR(p); const tl=getTL(p);
    const avgRpe=rnd(Object.values(S.rpeData[p]||{}).reduce((s,d)=>s+d.rpe,0)/DAYS.length);
    const hasL=Object.values(S.rpeSrc[p]||{}).some(s=>s==='live');
    const rp=ROSTER.find(r=>r.cognome+' '+r.nome.charAt(0)+'.'===p);
    const ruoloP=rp?.ruolo||'—'; const statoP=rp?.stato||'—';
    const col=RUOLO_COLOR[ruoloP]||'#637870';
    const sb=STATUS_BADGE[statoP]||'badge-gray';
    const rp2=ROSTER.find(r=>r.cognome+' '+r.nome.charAt(0)+'.'===p);
    const thumbHtml = rp2?.photo
      ? `<img src="${rp2.photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--primary);margin-right:6px;vertical-align:middle" alt="">`
      : `<span style="display:inline-flex;width:28px;height:28px;border-radius:50%;background:var(--primary);align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--yellow);margin-right:6px;vertical-align:middle;flex-shrink:0">${(rp2?.nome?.charAt(0)||p.charAt(0))+(rp2?.cognome?.charAt(0)||'')}</span>`;
    return `<tr><td style="white-space:nowrap">${thumbHtml}<strong>${p}</strong></td>
      <td><span style="background:${col}22;color:${col};font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${ruoloP}</span></td>
      <td><span class="badge ${sb}">${statoP}</span></td>
      <td>${srcTag(hasL?'live':'demo')}</td>
      <td style="font-family:'DM Mono',monospace">${avgRpe}</td>
      <td style="font-family:'DM Mono',monospace">${tl}</td>
      <td style="font-family:'DM Mono',monospace">${acwr}</td>
      <td style="font-family:'DM Mono',monospace">${S.wellData[p]?.hi||0}/35</td>
      <td>${riskBadge(acwr)}</td></tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   RPE & TL
═══════════════════════════════════════════ */
function renderRPE() {
  const sel=document.getElementById('rpePlayer').value||PLAYERS()[0];
  const data=S.rpeData[sel]||{};
  const tot=getTL(sel); const mon=getMonotony(sel); const fat=getFatigue(sel);
  const avgR=rnd(DAYS.reduce((s,d)=>s+(data[d]?.rpe||0),0)/DAYS.length);
  document.getElementById('rpeKpi').innerHTML=`
    <div class="kpi-card c-primary"><div class="kpi-label">TL Totale</div><div class="kpi-value">${tot}</div><div class="kpi-sub">UA sett.</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">RPE medio</div><div class="kpi-value">${avgR}</div><div class="kpi-sub">0–10 Foster</div></div>
    <div class="kpi-card ${mon>2?'c-amber':'c-primary'}"><div class="kpi-label">Monotonia</div><div class="kpi-value">${mon}</div></div>
    <div class="kpi-card ${fat>5000?'c-red':fat>3000?'c-amber':'c-primary'}"><div class="kpi-label">Fatica</div><div class="kpi-value">${fat.toLocaleString()}</div><div class="kpi-sub">TL×Monotonia</div></div>`;
  destroyC('rpeChart');
  charts.rpeChart=new Chart(document.getElementById('rpeChart'),{type:'bar',data:{labels:DAYS,datasets:[{label:'TL',data:DAYS.map(d=>data[d]?.tl||0),backgroundColor:'#00A878',borderRadius:4,yAxisID:'y'},{label:'RPE',data:DAYS.map(d=>data[d]?.rpe||0),type:'line',borderColor:'#F5C518',backgroundColor:'rgba(245,197,24,.08)',tension:0.35,fill:true,yAxisID:'y1',pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'rgba(0,0,0,.05)'},ticks:{font:{size:10}}},y1:{position:'right',min:0,max:10,grid:{display:false},ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
  const totSquad=totalTL();
  document.getElementById('rpeTableBody').innerHTML=PLAYERS().map(p=>{
    const d=S.rpeData[p]||{}; const ptl=getTL(p);
    const prpe=rnd(DAYS.reduce((s,day)=>s+(d[day]?.rpe||0),0)/DAYS.length);
    const hasL=Object.values(S.rpeSrc[p]||{}).some(s=>s==='live');
    const rp2=ROSTER.find(r=>r.cognome+' '+r.nome.charAt(0)+'.'===p);
    const thumbHtml = rp2?.photo
      ? `<img src="${rp2.photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--primary);margin-right:6px;vertical-align:middle" alt="">`
      : `<span style="display:inline-flex;width:28px;height:28px;border-radius:50%;background:var(--primary);align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--yellow);margin-right:6px;vertical-align:middle;flex-shrink:0">${(rp2?.nome?.charAt(0)||p.charAt(0))+(rp2?.cognome?.charAt(0)||'')}</span>`;
    return `<tr><td style="white-space:nowrap">${thumbHtml}<strong>${p}</strong></td><td>${srcTag(hasL?'live':'demo')}</td>
      ${DAYS.map(day=>{const x=d[day];const dot=(S.rpeSrc[p]?.[day]==='live')?'<span style="color:#16a34a;font-size:9px">●</span>':'';return `<td>${x?.rpe||0}${dot}<br><span style="color:var(--gray-400);font-size:10px;font-family:'DM Mono',monospace">${x?.tl||0}</span></td>`;}).join('')}
      <td style="font-family:'DM Mono',monospace"><strong>${ptl}</strong></td>
      <td style="font-family:'DM Mono',monospace">${prpe}</td>
      <td style="font-family:'DM Mono',monospace">${getMonotony(p)}</td>
      <td style="font-family:'DM Mono',monospace">${getFatigue(p).toLocaleString()}</td></tr>`;
  }).join('');
}
function addRPE() {
  const p=document.getElementById('inp_player').value;
  const md=document.getElementById('inp_md').value;
  const rpe=parseFloat(document.getElementById('inp_rpe').value)||0;
  let min=parseInt(document.getElementById('inp_min').value)||0;
  if(!rpe){alert('Inserisci il valore RPE');return;}
  if(!min){const g=S.gpsData.find(g=>g.p===p);min=g?.min||75;}
  if(!S.rpeData[p])S.rpeData[p]={};
  if(!S.rpeSrc[p])S.rpeSrc[p]={};
  S.rpeData[p][md]={rpe,min,tl:Math.round(rpe*min)}; S.rpeSrc[p][md]='manual';
  saveAll();
  document.getElementById('inp_rpe').value=''; document.getElementById('inp_min').value='';
  document.getElementById('rpePlayer').value=p; renderRPE();
}

/* ═══════════════════════════════════════════
   WELLNESS
═══════════════════════════════════════════ */
function initStars() {
  WDIMS.forEach(dim=>{
    const el=document.getElementById('st_'+dim); if(!el)return;
    el.innerHTML=[1,2,3,4,5,6,7].map(i=>`<span class="star" onclick="setStar('${dim}',${i})">●</span>`).join('');
  });
}
function setStar(dim,val) {
  wellInput[dim]=val;
  const lbl=document.getElementById('lbl_'+dim); if(lbl)lbl.textContent=WTEXT[val]||'';
  document.querySelectorAll(`#st_${dim} .star`).forEach((s,i)=>s.classList.toggle('on',i+1<=val));
  const t=WDIMS.reduce((s,k)=>s+(wellInput[k]||0),0);
  const hv=document.getElementById('hooperVal'); if(hv)hv.textContent=t||'—';
}
function saveWellness() {
  const p=document.getElementById('wellPlayer').value; if(!p)return;
  WDIMS.forEach(k=>{if(wellInput[k])S.wellData[p][k]=wellInput[k];});
  S.wellData[p].hi=WDIMS.reduce((s,k)=>s+S.wellData[p][k],0);
  S.wellSrc[p]='manual';
  saveAll();
  renderWellness();
}
function renderWellness() {
  const sel=document.getElementById('wellPlayer').value||PLAYERS()[0];
  const lbl=document.getElementById('wellPlayerLabel'); if(lbl)lbl.textContent=sel;
  initStars();
  const hi7=[14,12,16,11,13,15,S.wellData[sel]?.hi||14];
  destroyC('wellChart');
  charts.wellChart=new Chart(document.getElementById('wellChart'),{type:'line',data:{labels:['Lun','Mar','Mer','Gio','Ven','Sab','Dom'],datasets:[{label:'HI',data:hi7,borderColor:'#00A878',backgroundColor:'rgba(0,168,120,.08)',fill:true,tension:0.35,pointRadius:4},{label:'Soglia',data:[20,20,20,20,20,20,20],borderColor:'#dc2626',borderDash:[5,3],pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:35,ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
  document.getElementById('wellBody').innerHTML=PLAYERS().map(p=>{
    const d=S.wellData[p]||{hi:0}; const cl=d.hi>=25?'badge-red':d.hi>=18?'badge-amber':'badge-green';
    const lb=d.hi>=25?'Allerta':d.hi>=18?'Attenzione':'Buono';
    const rp2=ROSTER.find(r=>r.cognome+' '+r.nome.charAt(0)+'.'===p);
    const thumbHtml = rp2?.photo
      ? `<img src="${rp2.photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--primary);margin-right:6px;vertical-align:middle" alt="">`
      : `<span style="display:inline-flex;width:28px;height:28px;border-radius:50%;background:var(--primary);align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--yellow);margin-right:6px;vertical-align:middle;flex-shrink:0">${(rp2?.nome?.charAt(0)||p.charAt(0))+(rp2?.cognome?.charAt(0)||'')}</span>`;
    return `<tr><td style="white-space:nowrap">${thumbHtml}<strong>${p}</strong></td><td>${srcTag(S.wellSrc[p]||'demo')}</td><td>${d.sleep||0}/7</td><td>${d.muscle||0}/7</td><td>${d.fatigue||0}/7</td><td>${d.stress||0}/7</td><td>${d.motivation||0}/7</td><td style="font-family:'DM Mono',monospace"><strong>${d.hi||0}/35</strong></td><td><span class="badge ${cl}">${lb}</span></td></tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   GPS
═══════════════════════════════════════════ */
function renderGPS() {
  const d=S.gpsData;
  const avgDist=Math.round(d.reduce((s,x)=>s+x.dist,0)/d.length);
  const avgHSR=Math.round(d.reduce((s,x)=>s+x.hsr,0)/d.length);
  const avgVM=rnd(d.reduce((s,x)=>s+x.vmax,0)/d.length);
  document.getElementById('gpsKpi').innerHTML=`
    <div class="kpi-card c-primary"><div class="kpi-label">Distanza media</div><div class="kpi-value">${avgDist.toLocaleString()}</div><div class="kpi-sub">metri</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">HSR media &gt;16</div><div class="kpi-value">${avgHSR}</div><div class="kpi-sub">metri</div></div>
    <div class="kpi-card c-yellow"><div class="kpi-label">Vel MAX media</div><div class="kpi-value">${avgVM}</div><div class="kpi-sub">km/h</div></div>
    <div class="kpi-card c-green"><div class="kpi-label">GPS tracciati</div><div class="kpi-value">${d.length}</div></div>`;
  destroyC('gpsDistChart');
  charts.gpsDistChart=new Chart(document.getElementById('gpsDistChart'),{type:'bar',data:{labels:d.map(x=>x.p.split(' ')[0]),datasets:[{label:'Dist.',data:d.map(x=>x.dist),backgroundColor:'#00A878',borderRadius:3}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{size:9}},grid:{color:'rgba(0,0,0,.05)'}},y:{ticks:{font:{size:9}}}}}});
  destroyC('gpsHSRChart');
  charts.gpsHSRChart=new Chart(document.getElementById('gpsHSRChart'),{type:'bar',data:{labels:d.map(x=>x.p.split(' ')[0]),datasets:[{label:'>16km/h',data:d.map(x=>x.hsr),backgroundColor:'#F5C518',borderRadius:3},{label:'>20km/h',data:d.map(x=>x.v20),backgroundColor:'#006B4D',borderRadius:3}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{size:9}}},y:{ticks:{font:{size:9}}}}}});
  document.getElementById('gpsBody').innerHTML=d.map(x=>`<tr><td><strong>${x.p}</strong></td><td style="font-family:'DM Mono',monospace">${(+x.dist).toLocaleString()}</td><td style="font-family:'DM Mono',monospace">${rnd(+x.dmin)}</td><td style="font-family:'DM Mono',monospace">${x.hsr}</td><td style="font-family:'DM Mono',monospace">${x.v20}</td><td style="font-family:'DM Mono',monospace">${x.v25}</td><td style="font-family:'DM Mono',monospace">${x.acc}</td><td style="font-family:'DM Mono',monospace">${x.dec}</td><td style="font-family:'DM Mono',monospace">${x.nacc}</td><td style="font-family:'DM Mono',monospace">${rnd(+x.vmax)}</td><td style="font-family:'DM Mono',monospace">${rnd(+x.rpe)}</td><td style="font-family:'DM Mono',monospace">${x.min}' <span style="color:var(--primary);font-size:10px">→${Math.round((+x.rpe)*(+x.min))}</span></td></tr>`).join('');
}

/* ═══════════════════════════════════════════
   FC
═══════════════════════════════════════════ */
function renderFC() {
  const avg=Math.round(PLAYERS().reduce((s,p)=>s+(S.fcData[p]?.tl||0),0)/PLAYERS().length);
  document.getElementById('fcKpi').innerHTML=`
    <div class="kpi-card c-primary"><div class="kpi-label">TL FC medio</div><div class="kpi-value">${avg}</div><div class="kpi-sub">UA Edwards</div></div>
    <div class="kpi-card c-red"><div class="kpi-label">Z5 media</div><div class="kpi-value">${Math.round(PLAYERS().reduce((s,p)=>s+(S.fcData[p]?.z5||0),0)/PLAYERS().length)}'</div></div>
    <div class="kpi-card c-yellow"><div class="kpi-label">Z4 media</div><div class="kpi-value">${Math.round(PLAYERS().reduce((s,p)=>s+(S.fcData[p]?.z4||0),0)/PLAYERS().length)}'</div></div>`;
  destroyC('fcChart');
  charts.fcChart=new Chart(document.getElementById('fcChart'),{type:'bar',data:{labels:PLAYERS().map(p=>p.split(' ')[0]),datasets:[{label:'Z5',data:PLAYERS().map(p=>S.fcData[p]?.z5||0),backgroundColor:'#dc2626',borderRadius:2},{label:'Z4',data:PLAYERS().map(p=>S.fcData[p]?.z4||0),backgroundColor:'#F5C518',borderRadius:2},{label:'Z3',data:PLAYERS().map(p=>S.fcData[p]?.z3||0),backgroundColor:'#00A878',borderRadius:2},{label:'Z2',data:PLAYERS().map(p=>S.fcData[p]?.z2||0),backgroundColor:'#1d4ed8',borderRadius:2},{label:'Z1',data:PLAYERS().map(p=>S.fcData[p]?.z1||0),backgroundColor:'#7c3aed',borderRadius:2}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true,ticks:{font:{size:9}}},y:{stacked:true,ticks:{font:{size:10}},grid:{color:'rgba(0,0,0,.05)'}}},plugins:{legend:{display:false}}}});
  document.getElementById('fcBody').innerHTML=PLAYERS().map(p=>{const d=S.fcData[p]||{};const rp2=ROSTER.find(r=>r.cognome+' '+r.nome.charAt(0)+'.'===p);
    const thumbHtml = rp2?.photo
      ? `<img src="${rp2.photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--primary);margin-right:6px;vertical-align:middle" alt="">`
      : `<span style="display:inline-flex;width:28px;height:28px;border-radius:50%;background:var(--primary);align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--yellow);margin-right:6px;vertical-align:middle;flex-shrink:0">${(rp2?.nome?.charAt(0)||p.charAt(0))+(rp2?.cognome?.charAt(0)||'')}</span>`;
    return `<tr><td style="white-space:nowrap">${thumbHtml}<strong>${p}</strong></td><td style="font-family:'DM Mono',monospace">${d.z5||0}'</td><td style="font-family:'DM Mono',monospace">${d.z4||0}'</td><td style="font-family:'DM Mono',monospace">${d.z3||0}'</td><td style="font-family:'DM Mono',monospace">${d.z2||0}'</td><td style="font-family:'DM Mono',monospace">${d.z1||0}'</td><td style="font-family:'DM Mono',monospace"><strong>${d.tl||0} UA</strong></td></tr>`;}).join('');
}
function addFC() {
  const p=document.getElementById('fc_player').value;
  const z5=+document.getElementById('fc_z5').value||0,z4=+document.getElementById('fc_z4').value||0,z3=+document.getElementById('fc_z3').value||0,z2=+document.getElementById('fc_z2').value||0,z1=+document.getElementById('fc_z1').value||0;
  S.fcData[p]={z5,z4,z3,z2,z1,tl:z5*5+z4*4+z3*3+z2*2+z1};
  saveAll();
  renderFC();
}

/* ═══════════════════════════════════════════
   ACWR & INDICI
═══════════════════════════════════════════ */
function renderACWR() {
  const tot=totalTL(); const acwrs=PLAYERS().map(p=>getACWR(p));
  const avg=rnd(acwrs.reduce((a,b)=>a+b,0)/acwrs.length);
  const atRisk=acwrs.filter(v=>v>1.3||v<0.8).length;
  document.getElementById('acwrKpi').innerHTML=`
    <div class="kpi-card ${(avg>1.3||avg<0.8)?'c-amber':'c-primary'}"><div class="kpi-label">ACWR medio</div><div class="kpi-value">${avg}</div><div class="kpi-sub">ottimale 0.8–1.3</div></div>
    <div class="kpi-card ${atRisk>3?'c-red':atRisk>1?'c-amber':'c-green'}"><div class="kpi-label">A rischio</div><div class="kpi-value">${atRisk}</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">TL Totale</div><div class="kpi-value">${tot.toLocaleString()}</div><div class="kpi-sub">UA squadra</div></div>`;
  destroyC('acwrPlayerChart');
  charts.acwrPlayerChart=new Chart(document.getElementById('acwrPlayerChart'),{type:'bar',data:{labels:PLAYERS().map(p=>p.split(' ')[0]),datasets:[{label:'ACWR',data:acwrs,backgroundColor:acwrs.map(v=>v>1.3?'#dc2626':v<0.8?'#1d4ed8':'#00A878'),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:2,ticks:{font:{size:10}}},x:{ticks:{font:{size:9}}}}}});
  document.getElementById('pctBars').innerHTML=PLAYERS().map(p=>{
    const tl=getTL(p); const pct=rnd(tl/tot*100,1);
    const clr=pct>10?'#dc2626':pct>7?'#F5C518':'#00A878';
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:12px"><span style="min-width:85px;color:var(--gray-700)">${p}</span><div class="pct-bar"><div class="pct-fill" style="width:${Math.min(pct*6,100)}%;background:${clr}"></div></div><span style="min-width:90px;text-align:right;color:var(--gray-500);font-family:'DM Mono',monospace;font-size:11px">${tl} UA · ${pct}%</span></div>`;
  }).join('');
  document.getElementById('acwrBody').innerHTML=PLAYERS().map(p=>{
    const tl=getTL(p); const pct=rnd(tl/tot*100,1); const acwr=getACWR(p);
    const mon=getMonotony(p); const fat=getFatigue(p);
    const tls=Object.values(S.rpeData[p]||{}).map(d=>d.tl);
    const avg2=rnd(tls.reduce((a,b)=>a+b,0)/tls.length);
    const sd=rnd(Math.sqrt(tls.reduce((s,v)=>s+Math.pow(v-avg2,2),0)/tls.length));
    const ac=rnd(tls.reduce((a,b)=>a+b,0)/7); const ch=rnd(tls.reduce((a,b)=>a+b,0)/tls.length);
    const rp2=ROSTER.find(r=>r.cognome+' '+r.nome.charAt(0)+'.'===p);
    const thumbHtml = rp2?.photo
      ? `<img src="${rp2.photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--primary);margin-right:6px;vertical-align:middle" alt="">`
      : `<span style="display:inline-flex;width:28px;height:28px;border-radius:50%;background:var(--primary);align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--yellow);margin-right:6px;vertical-align:middle;flex-shrink:0">${(rp2?.nome?.charAt(0)||p.charAt(0))+(rp2?.cognome?.charAt(0)||'')}</span>`;
    return `<tr><td style="white-space:nowrap">${thumbHtml}<strong>${p}</strong></td><td style="font-family:'DM Mono',monospace">${ac}</td><td style="font-family:'DM Mono',monospace">${ch}</td><td style="font-family:'DM Mono',monospace">${acwr}</td><td style="font-family:'DM Mono',monospace">${avg2}</td><td style="font-family:'DM Mono',monospace">${sd}</td><td style="font-family:'DM Mono',monospace">${mon}</td><td style="font-family:'DM Mono',monospace">${fat.toLocaleString()}</td><td style="font-family:'DM Mono',monospace">${pct}%</td><td>${riskBadge(acwr)}</td></tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   SCHEDA GIOCATORE
═══════════════════════════════════════════ */
function renderPlayer() {
  const p=document.getElementById('playerSel').value||PLAYERS()[0];
  const tl=getTL(p); const acwr=getACWR(p); const mon=getMonotony(p);
  const fat=getFatigue(p); const hi=S.wellData[p]?.hi||0;
  const tot=totalTL(); const pct=rnd(tl/tot*100,1);
  const fc=S.fcData[p]||{}; const d=S.rpeData[p]||{}; const w=S.wellData[p]||{};
  const hasL=Object.values(S.rpeSrc[p]||{}).some(s=>s==='live');
  const rp=ROSTER.find(r=>r.cognome+' '+r.nome.charAt(0)+'.'===p);
  document.getElementById('playerKpi').innerHTML=`
    <div class="kpi-card c-primary"><div class="kpi-label">TL Settimanale</div><div class="kpi-value">${tl}</div><div class="kpi-sub">${srcTag(hasL?'live':'demo')}</div></div>
    <div class="kpi-card ${(acwr>1.3||acwr<0.8)?'c-amber':'c-primary'}"><div class="kpi-label">ACWR</div><div class="kpi-value">${acwr}</div><div class="kpi-sub">${acwr>1.3?'⚠ Attenzione':acwr<0.8?'↑ Aumentare':'✓ Ottimale'}</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">Monotonia</div><div class="kpi-value">${mon}</div></div>
    <div class="kpi-card ${fat>5000?'c-red':fat>3000?'c-amber':'c-primary'}"><div class="kpi-label">Fatica</div><div class="kpi-value">${fat.toLocaleString()}</div></div>
    <div class="kpi-card c-blue"><div class="kpi-label">% Carico</div><div class="kpi-value">${pct}%</div></div>
    <div class="kpi-card ${hi>25?'c-red':hi>18?'c-amber':'c-primary'}"><div class="kpi-label">HI (5 dim.)</div><div class="kpi-value">${hi}/35</div></div>`;
  destroyC('playerTLChart');
  charts.playerTLChart=new Chart(document.getElementById('playerTLChart'),{type:'line',data:{labels:DAYS,datasets:[{label:'TL',data:DAYS.map(day=>d[day]?.tl||0),borderColor:'#00A878',backgroundColor:'rgba(0,168,120,.08)',fill:true,tension:0.4,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{font:{size:10}},grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{font:{size:11}}}}}});
  destroyC('playerWellChart');
  charts.playerWellChart=new Chart(document.getElementById('playerWellChart'),{type:'radar',data:{labels:WLBLS,datasets:[{label:p,data:WDIMS.map(k=>w[k]||0),borderColor:'#00A878',backgroundColor:'rgba(0,168,120,.12)',pointBackgroundColor:'#00A878',pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,scales:{r:{min:0,max:7,ticks:{stepSize:1,font:{size:9}},grid:{color:'rgba(0,0,0,.08)'},angleLines:{color:'rgba(0,0,0,.08)'}}},plugins:{legend:{display:false}}}});
  const zColors=['#dc2626','#F5C518','#00A878','#1d4ed8','#7c3aed'];
  const photoHtml = rp?.photo
    ? `<img src="${rp.photo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary);box-shadow:0 4px 12px rgba(0,168,120,.2);flex-shrink:0" alt="${rp?.nome}">`
    : `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary) 0%,var(--primary-d) 100%);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:var(--yellow);border:3px solid var(--yellow);flex-shrink:0">${(rp?.nome?.charAt(0)||'?')+(rp?.cognome?.charAt(0)||'?')}</div>`;
  const rosterInfo = rp ? `<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;padding:14px;background:var(--primary-l);border-radius:10px;border:1px solid #9fe7d0">
    ${photoHtml}
    <div style="flex:1">
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--primary-d)">${rp.cognome} ${rp.nome}</div>
      <div style="font-size:12px;color:var(--gray-500);margin-bottom:8px">#${rp.numero} · ${rp.ruolo} · ${rp.naz}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span style="background:#00A87822;color:#006B4D;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${rp.ruolo}</span>
        ${rp.altezza?`<span style="background:#e0f7f1;color:#006B4D;font-size:10px;padding:2px 7px;border-radius:20px">${rp.altezza}cm · ${rp.peso}kg</span>`:''}
        ${rp.piede?`<span style="background:#e0f7f1;color:#006B4D;font-size:10px;padding:2px 7px;border-radius:20px">Piede ${rp.piede}</span>`:''}
        <span class="badge ${STATUS_BADGE[rp.stato]||'badge-gray'}">${rp.stato}</span>
      </div>
    </div>
  </div>` : '';
  const _unusedRosterInfo = rp ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
    <span style="background:#00A87822;color:#006B4D;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${rp.ruolo}</span>
    <span style="background:#e0f7f1;color:#006B4D;font-size:10px;padding:2px 7px;border-radius:20px">#${rp.numero}</span>
    ${rp.naz?`<span style="background:#e0f7f1;color:#006B4D;font-size:10px;padding:2px 7px;border-radius:20px">${rp.naz}</span>`:''}
    ${rp.altezza?`<span style="background:#e0f7f1;color:#006B4D;font-size:10px;padding:2px 7px;border-radius:20px">${rp.altezza}cm · ${rp.peso}kg</span>`:''}
    <span class="badge ${STATUS_BADGE[rp.stato]||'badge-gray'}">${rp.stato}</span>
  </div>` : '';
  document.getElementById('playerCard').innerHTML=`
    ${rosterInfo}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:12px">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-400);margin-bottom:10px">RPE per sessione</div>
        ${DAYS.map(day=>{const x=d[day];const src=S.rpeSrc[p]?.[day]||'demo';const dot=src==='live'?'<span style="color:#16a34a;font-size:9px">● </span>':'';return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">${dot}<span style="min-width:38px;color:var(--gray-400)">${day}</span><div style="flex:1;height:8px;border-radius:4px;background:var(--gray-100);overflow:hidden"><div style="width:${Math.min((x?.rpe||0)/10*100,100)}%;height:100%;background:#F5C518;border-radius:4px"></div></div><span style="min-width:65px;text-align:right;font-family:'DM Mono',monospace;font-size:11px">${x?.rpe||0} (${x?.tl||0})</span></div>`;}).join('')}
        <div style="margin-top:10px;font-size:11px;color:var(--gray-500)">Min. GPS: <strong style="font-family:'DM Mono',monospace">${S.gpsData.find(g=>g.p===p)?.min||'—'}'</strong></div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-400);margin-bottom:10px">Zone FC (Edwards)</div>
        ${['z5','z4','z3','z2','z1'].map((z,i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><span style="min-width:24px;color:var(--gray-400);font-size:10px">Z${5-i}</span><div style="flex:1;height:8px;border-radius:4px;background:var(--gray-100);overflow:hidden"><div style="width:${Math.min((fc[z]||0)/30*100,100)}%;height:100%;background:${zColors[i]};border-radius:4px"></div></div><span style="min-width:30px;text-align:right;font-family:'DM Mono',monospace;font-size:11px">${fc[z]||0}'</span></div>`).join('')}
        <div style="margin-top:10px;font-size:11px;color:var(--gray-500)">TL FC: <strong style="font-family:'DM Mono',monospace">${fc.tl||0} UA</strong></div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════
   IMPORT GPS / FC
═══════════════════════════════════════════ */
const IMPORT_CFG = {
  gps:    {fields:['Atleta','Dist.(m)','Dist/min','>16km/h','>20km/h','>25km/h','Acc.dist','Dec.dist','N°Acc','VelMAX','RPE','Minuti'], keys:['p','dist','dmin','hsr','v20','v25','acc','dec','nacc','vmax','rpe','min']},
  fc_csv: {fields:['Atleta','Z5 min','Z4 min','Z3 min','Z2 min','Z1 min'], keys:['atleta','z5','z4','z3','z2','z1']}
};

function setITab(tab,btn) {
  curITab=tab;
  document.querySelectorAll('.tab-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); renderImportContent();
}
function renderImportPage() { renderImportContent(); renderImportLog(); }
function renderImportContent() {
  const cfg=IMPORT_CFG[curITab];
  document.getElementById('importContent').innerHTML=`
    <div style="font-size:11px;color:var(--gray-500);margin-bottom:10px">Colonne attese: <strong>${cfg.fields.join(' · ')}</strong></div>
    <div class="drop-zone" id="dz_${curITab}" onclick="document.getElementById('fi_${curITab}').click()">
      <input type="file" id="fi_${curITab}" accept=".csv,.xlsx,.xls" onchange="handleFile(event,'${curITab}')" onclick="event.stopPropagation()">
      <div class="drop-icon"><i class="ti ti-cloud-upload"></i></div>
      <div class="drop-title">Trascina il file o clicca per sfogliare</div>
      <div class="drop-sub">CSV, XLSX, XLS</div>
      <div class="drop-status" id="ds_${curITab}"></div>
    </div>
    <div id="colMap_${curITab}" style="display:none;margin-top:12px">
      <div style="font-size:11px;font-weight:700;color:var(--gray-600);margin-bottom:8px">Mappa le colonne</div>
      <div id="mapRows_${curITab}"></div>
      <button class="btn btn-primary" style="margin-top:10px" onclick="applyImport('${curITab}')"><i class="ti ti-check"></i> Importa</button>
    </div>
    <div id="prev_${curITab}" style="display:none;margin-top:14px">
      <div style="font-size:11px;font-weight:700;color:var(--gray-500);margin-bottom:6px">Anteprima</div>
      <div class="table-wrap"><table id="prevTbl_${curITab}"></table></div>
    </div>`;
  const z=document.getElementById('dz_'+curITab);
  z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('drag');});
  z.addEventListener('dragleave',()=>z.classList.remove('drag'));
  z.addEventListener('drop',e=>{e.preventDefault();z.classList.remove('drag');const f=e.dataTransfer.files[0];if(f)processFile(f,curITab);});
}
function handleFile(e,tab){const f=e.target.files[0];if(f)processFile(f,tab);}
function processFile(file,tab) {
  const ext=file.name.split('.').pop().toLowerCase();
  const ds=document.getElementById('ds_'+tab); const dz=document.getElementById('dz_'+tab);
  ds.textContent='Lettura...';
  if(ext==='csv'){
    Papa.parse(file,{header:true,skipEmptyLines:true,complete:res=>{
      if(!res.data.length){ds.textContent='File vuoto';dz.classList.add('err');return;}
      parsedFiles[tab]={data:res.data,cols:Object.keys(res.data[0]),name:file.name};
      onFileReady(tab,file.name);
    }});
  } else if(['xlsx','xls'].includes(ext)){
    const r=new FileReader();
    r.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:''});if(!rows.length){ds.textContent='Vuoto';return;}parsedFiles[tab]={data:rows,cols:Object.keys(rows[0]),name:file.name};onFileReady(tab,file.name);}catch(e){ds.textContent='Errore Excel';dz.classList.add('err');}};
    r.readAsArrayBuffer(file);
  } else {ds.textContent='Usa CSV o XLSX';dz.classList.add('err');}
}
function onFileReady(tab,name) {
  const {data,cols}=parsedFiles[tab]; const cfg=IMPORT_CFG[tab];
  const dz=document.getElementById('dz_'+tab); const ds=document.getElementById('ds_'+tab);
  ds.innerHTML=`<span style="color:var(--primary)">✓ ${name} — ${data.length} righe</span>`; dz.classList.add('ok');
  const cm=document.getElementById('colMap_'+tab); const mr=document.getElementById('mapRows_'+tab);
  cm.style.display='block';
  mr.innerHTML=cfg.fields.map((f,i)=>{const key=cfg.keys[i];const opts=cols.map(c=>`<option ${c.toLowerCase().includes(f.split('.')[0].toLowerCase())||c.toLowerCase()===key?'selected':''}>${c}</option>`).join('');return `<div class="col-map-row"><span style="color:var(--gray-500);font-size:11px">${f}</span><span style="text-align:center;color:var(--gray-400)">→</span><select id="mp_${tab}_${key}">${opts}</select></div>`;}).join('');
  const pv=document.getElementById('prev_'+tab); const pt=document.getElementById('prevTbl_'+tab);
  pv.style.display='block';
  pt.innerHTML=`<thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${data.slice(0,5).map(row=>`<tr>${cols.map(c=>`<td>${row[c]}</td>`).join('')}</tr>`).join('')}</tbody>`;
}
function applyImport(tab) {
  const pf=parsedFiles[tab]; if(!pf){alert('Nessun file');return;}
  const rows=pf.data; const cfg=IMPORT_CFG[tab];
  if(tab==='gps'){
    S.gpsData=rows.map(row=>{const g={};cfg.keys.forEach((k,i)=>{const col=document.getElementById(`mp_gps_${k}`)?.value;g[k]=col?row[col]||'':'';});return{p:g.p,dist:+g.dist||0,dmin:+g.dmin||0,hsr:+g.hsr||0,v20:+g.v20||0,v25:+g.v25||0,acc:+g.acc||0,dec:+g.dec||0,nacc:+g.nacc||0,vmax:+g.vmax||0,rpe:+g.rpe||0,min:+g.min||0};}).filter(x=>x.p);
    S.gpsData.forEach(gx=>{const p=gx.p;if(S.rpeData[p])DAYS.forEach(d=>{if(S.rpeData[p][d]?.rpe){S.rpeData[p][d].min=gx.min;S.rpeData[p][d].tl=Math.round(S.rpeData[p][d].rpe*gx.min);}});});
  } else if(tab==='fc_csv'){
    rows.forEach(row=>{const a=(row[document.getElementById('mp_fc_csv_atleta')?.value||'']||'').trim();if(!a)return;const d={z5:+(row[document.getElementById('mp_fc_csv_z5')?.value]||0),z4:+(row[document.getElementById('mp_fc_csv_z4')?.value]||0),z3:+(row[document.getElementById('mp_fc_csv_z3')?.value]||0),z2:+(row[document.getElementById('mp_fc_csv_z2')?.value]||0),z1:+(row[document.getElementById('mp_fc_csv_z1')?.value]||0)};d.tl=d.z5*5+d.z4*4+d.z3*3+d.z2*2+d.z1;S.fcData[a]=d;});
  }
  saveAll();
  importLogs.unshift({ts:new Date().toLocaleString('it-IT'),tipo:tab==='gps'?'GPS':'FC',name:pf.name,rows:rows.length,ok:true});
  renderImportLog();
  alert(`✓ ${rows.length} righe importate da "${pf.name}"`);
}
function renderImportLog() {
  const el=document.getElementById('importLog'); if(!el)return;
  if(!importLogs.length){el.innerHTML='<tr><td colspan="5" style="text-align:center;padding:14px;color:var(--gray-400)">Nessuna importazione ancora</td></tr>';return;}
  el.innerHTML=importLogs.map(l=>`<tr><td style="font-family:'DM Mono',monospace;font-size:11px">${l.ts}</td><td>${l.tipo}</td><td>${l.name}</td><td style="font-family:'DM Mono',monospace">${l.rows}</td><td><span class="badge ${l.ok?'badge-green':'badge-red'}">${l.ok?'OK':'Errore'}</span></td></tr>`).join('');
}

/* ─── BOOT ─── */
document.addEventListener('DOMContentLoaded', init);
