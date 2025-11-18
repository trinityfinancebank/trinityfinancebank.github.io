// Robust transactions / navigation / modal script with stable event handling and persistence

const STORAGE_KEYS = {
  transactions: 'tfb_transactions_v1',
  profile: 'tfb_profile_v1',
  balance: 'tfb_balance_v1'
};

let transactions = [];
let balance = 0;

function fmt(n){
  return Number(n).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, style:'currency', currency:'USD'});
}

function loadFromStorage(){
  try{
    const tx = localStorage.getItem(STORAGE_KEYS.transactions);
    transactions = tx ? JSON.parse(tx) : [
      { ref: "TRXb96e73c741a5", amount: 950, type: "Debit" },
      { ref: "TRXa9f71f16f6d1", amount: 10200950.00, type: "Credit" },
      { ref: "TRX093aee8d2ebb", amount: 950, type: "Debit" },
      { ref: "TRX8fe0a45d176a", amount: 10200950.00, type: "Credit" },
      { ref: "TRX749ffdd2a9a5", amount: 950, type: "Debit" },
      { ref: "TRX9de8249b2ec5", amount: 10200950.00, type: "Credit" },
      { ref: "TRXad68d66d15f0", amount: 950, type: "Debit" },
      { ref: "TRXc5b2f62f3611", amount: 10200950.00, type: "Credit" },
      { ref: "TRXc5b2f62f3611", amount: 31000000.00, type: "Credit" }
    ];

    const bal = localStorage.getItem(STORAGE_KEYS.balance);
    balance = bal ? Number(bal) : 71799032.65;

    const prof = localStorage.getItem(STORAGE_KEYS.profile);
    if(prof){
      const p = JSON.parse(prof);
      const nameEl = document.getElementById('profName');
      const emailEl = document.getElementById('profEmail');
      const phoneEl = document.getElementById('profPhone');
      if(nameEl) nameEl.value = p.name || 'Steven';
      if(emailEl) emailEl.value = p.email || 'steven@example.com';
      if(phoneEl) phoneEl.value = p.phone || '(504) 499-5059';
      const profileBtn = document.getElementById('profileBtn');
      if(profileBtn) profileBtn.textContent = 'Welcome.... ' + (p.name || 'Steven');
    }
  }catch(e){
    console.error('Failed reading storage', e);
    balance = 71799032.65;
  }
}

function saveToStorage(){
  try{
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.balance, String(balance));
  }catch(e){ console.error('Failed writing storage', e); }
}

function renderPreview(){
  const tbody = document.querySelector('#txPreview tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  transactions.slice(0,5).forEach((t,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${t.ref}</td><td>${fmt(t.amount)}</td><td><span class="badge ${t.type.toLowerCase()}">${t.type}</span></td>`;
    tbody.appendChild(tr);
  });
  const txCountEl = document.getElementById('txCount');
  if(txCountEl) txCountEl.textContent = transactions.length;
}

function renderTable(list = transactions){
  const tbody = document.querySelector('#txTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  list.forEach((t,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${t.ref}</td><td>${fmt(t.amount)}</td><td><span class="badge ${t.type.toLowerCase()}">${t.type}</span></td>`;
    tbody.appendChild(tr);
  });
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=> p.classList.add('hidden'));
  const el = document.getElementById(id);
  if(el) el.classList.remove('hidden');
  window.scrollTo(0,0);
}

function downloadCsv(list){
  const rows = [["#", "REFERENCE", "AMOUNT", "TYPE"]];
  list.forEach((t,i)=> rows.push([i+1, t.ref, t.amount, t.type]));
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'transactions.csv'; a.click();
  URL.revokeObjectURL(url);
}

function applyFilter(){
  const searchEl = document.getElementById('search');
  if(!searchEl) return renderTable();
  const q = searchEl.value.trim().toLowerCase();
  const filtered = transactions.filter(t=>{
    if(!q) return true;
    return t.ref.toLowerCase().includes(q) || String(t.amount).toLowerCase().includes(q);
  });
  renderTable(filtered);
}

function addDemoTransaction(){
  const ref = 'TRXdemo' + Math.random().toString(36).slice(2,10);
  const amount = 950;
  const t = {ref, amount, type: 'Debit'};
  transactions.unshift(t);
  updateBalance(-amount);
  saveToStorage();
  renderTable(transactions);
  renderPreview();
}

function updateBalance(delta){
  balance = Number((balance + delta).toFixed(2));
  const balEl = document.getElementById('balance');
  if(balEl) balEl.textContent = fmt(balance);
  saveToStorage();
}

// Modal helpers: attach/remove listeners robustly
function showConfirmModal(details, onConfirm){
  const overlay = document.getElementById('confirmModal');
  const body = document.getElementById('confirmBody');
  if(!overlay || !body) return;
  body.innerHTML = `<p><strong>To:</strong> ${details.name} (${details.bank} — ${details.acct})</p><p><strong>Amount:</strong> ${fmt(details.amount)}</p><p><strong>Ref:</strong> ${details.ref}</p>`;
  overlay.classList.remove('hidden');

  const ok = document.getElementById('confirmOk');
  const cancel = document.getElementById('confirmCancel');

  // Handler functions (closed over so we can remove them)
  function overlayClick(e){ if(e.target === overlay) { cleanup(); } }
  function onKey(e){ if(e.key === 'Escape') cleanup(); }
  function doConfirm(){ cleanup(); onConfirm(); }
  function doCancel(){ cleanup(); }

  function cleanup(){
    overlay.classList.add('hidden');
    overlay.removeEventListener('click', overlayClick);
    document.removeEventListener('keydown', onKey);
    if(ok) ok.removeEventListener('click', doConfirm);
    if(cancel) cancel.removeEventListener('click', doCancel);
  }

  // Attach
  overlay.addEventListener('click', overlayClick);
  document.addEventListener('keydown', onKey);
  if(ok) ok.addEventListener('click', doConfirm);
  if(cancel) cancel.addEventListener('click', doCancel);
}

function handleSendValidation(){
  const name = document.getElementById('recipientName').value.trim();
  const acct = document.getElementById('recipientAccount').value.trim();
  const routing = document.getElementById('recipientRouting').value.trim();
  const bank = document.getElementById('recipientBank').value.trim();
  const amount = Number(document.getElementById('sendAmount').value);
  const ref = document.getElementById('sendRef').value.trim() || ('TRX' + Math.random().toString(36).slice(2,10));
  const msg = document.getElementById('sendMessage');
  if(msg) msg.textContent = '';

  if(!name || !acct || !routing || !bank || !amount || amount <= 0){
    if(msg) msg.textContent = 'Please fill all fields with valid values.';
    return null;
  }
  if(amount > balance){
    if(msg) msg.textContent = 'Insufficient funds for this demo transfer.';
    return null;
  }
  return {name, acct, routing, bank, amount, ref};
}

function performSend(details){
  const t = {ref: details.ref, amount: details.amount, type: 'Debit', to: `${details.bank} | ${details.acct}`};
  transactions.unshift(t);
  updateBalance(-details.amount);
  saveToStorage();
  renderTable(transactions);
  renderPreview();

  // add to recent transfers
  const rtbody = document.querySelector('#recentTransfers tbody');
  if(rtbody){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${details.ref}</td><td>${details.name}</td><td>${fmt(details.amount)}</td>`;
    rtbody.prepend(tr);
  }

  const msgEl = document.getElementById('sendMessage');
  if(msgEl) msgEl.textContent = 'Transfer simulated successfully (demo).';
  const form = document.getElementById('sendForm');
  if(form) form.reset();
}

// Initialize
window.addEventListener('DOMContentLoaded', ()=>{
  loadFromStorage();
  const balEl = document.getElementById('balance');
  if(balEl) balEl.textContent = fmt(balance);
  renderPreview();
  renderTable(transactions);

  // nav delegation: attach once to the nav container for robustness
  const bottomNav = document.querySelector('.bottom-nav');
  if(bottomNav){
    bottomNav.addEventListener('click', (e)=>{
      const btn = e.target.closest('.nav-btn');
      if(!btn) return;
      const page = btn.dataset.page;
      if(page) showPage(page);
    });
  } else {
    // fallback: attach to individual buttons
    document.querySelectorAll('.nav-btn').forEach(b=>{
      b.addEventListener('click', ()=> { if(b.dataset.page) showPage(b.dataset.page); });
    });
  }

  // view all link
  const viewAll = document.getElementById('viewAll');
  if(viewAll) viewAll.addEventListener('click', (e)=>{ e.preventDefault(); showPage('transactions-page'); });

  const backFromTx = document.getElementById('backFromTx');
  if(backFromTx) backFromTx.addEventListener('click', ()=> showPage('home-page'));

  const downloadCsvBtn = document.getElementById('downloadCsv');
  if(downloadCsvBtn) downloadCsvBtn.addEventListener('click', ()=> downloadCsv(transactions));

  const addDemoBtn = document.getElementById('addDemo');
  if(addDemoBtn) addDemoBtn.addEventListener('click', ()=> addDemoTransaction());

  const searchEl = document.getElementById('search');
  if(searchEl) searchEl.addEventListener('input', ()=> applyFilter());

  const sendBtn = document.getElementById('sendBtn');
  if(sendBtn) sendBtn.addEventListener('click', ()=>{
    const details = handleSendValidation();
    if(!details) return;
    showConfirmModal(details, ()=> performSend(details));
  });

  const profileBtn = document.getElementById('profileBtn');
  if(profileBtn) profileBtn.addEventListener('click', ()=> showPage('profile-page'));

  const saveProfileBtn = document.getElementById('saveProfile');
  if(saveProfileBtn) saveProfileBtn.addEventListener('click', (e)=>{ 
    e.preventDefault();
    const p = { name: document.getElementById('profName').value.trim(), email: document.getElementById('profEmail').value.trim(), phone: document.getElementById('profPhone').value.trim() };
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(p));
    const profileBtnEl = document.getElementById('profileBtn');
    if(profileBtnEl) profileBtnEl.textContent = 'Welcome.... ' + (p.name || 'Steven');
  });
});
