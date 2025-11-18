// Transactions and multi-page navigation demo with localStorage persistence and confirmation modal

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
      document.getElementById('profName').value = p.name || 'Steven';
      document.getElementById('profEmail').value = p.email || 'steven@example.com';
      document.getElementById('profPhone').value = p.phone || '(504) 499-5059';
      document.getElementById('profileBtn').textContent = 'Welcome.... ' + (p.name || 'Steven');
    }
  }catch(e){
    console.error('Failed reading storage', e);
    // fall back to defaults
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
  tbody.innerHTML = '';
  transactions.slice(0,5).forEach((t,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${t.ref}</td><td>${fmt(t.amount)}</td><td><span class="badge ${t.type.toLowerCase()}">${t.type}</span></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('txCount').textContent = transactions.length;
}

function renderTable(list = transactions){
  const tbody = document.querySelector('#txTable tbody');
  tbody.innerHTML = '';
  list.forEach((t,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${t.ref}</td><td>${fmt(t.amount)}</td><td><span class="badge ${t.type.toLowerCase()}">${t.type}</span></td>`;
    tbody.appendChild(tr);
  });
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=> p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
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
  const q = document.getElementById('search').value.trim().toLowerCase();
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
  document.getElementById('balance').textContent = fmt(balance);
  saveToStorage();
}

// Confirmation modal flow
function showConfirmModal(details, onConfirm){
  const overlay = document.getElementById('confirmModal');
  const body = document.getElementById('confirmBody');
  body.innerHTML = `<p><strong>To:</strong> ${details.name} (${details.bank} — ${details.account})</p><p><strong>Amount:</strong> ${fmt(details.amount)}</p><p><strong>Ref:</strong> ${details.ref}</p>`;
  overlay.classList.remove('hidden');
  const ok = document.getElementById('confirmOk');
  const cancel = document.getElementById('confirmCancel');

  function cleanup(){
    overlay.classList.add('hidden');
    ok.removeEventListener('click', doConfirm);
    cancel.removeEventListener('click', doCancel);
  }
  function doConfirm(){ cleanup(); onConfirm(); }
  function doCancel(){ cleanup(); }

  ok.addEventListener('click', doConfirm);
  cancel.addEventListener('click', doCancel);
}

function handleSendValidation(){
  const name = document.getElementById('recipientName').value.trim();
  const acct = document.getElementById('recipientAccount').value.trim();
  const routing = document.getElementById('recipientRouting').value.trim();
  const bank = document.getElementById('recipientBank').value.trim();
  const amount = Number(document.getElementById('sendAmount').value);
  const ref = document.getElementById('sendRef').value.trim() || ('TRX' + Math.random().toString(36).slice(2,10));
  const msg = document.getElementById('sendMessage');
  msg.textContent = '';

  if(!name || !acct || !routing || !bank || !amount || amount <= 0){
    msg.textContent = 'Please fill all fields with valid values.';
    return null;
  }
  if(amount > balance){
    msg.textContent = 'Insufficient funds for this demo transfer.';
    return null;
  }
  return {name, acct, routing, bank, amount, ref};
}

function performSend(details){
  const t = {ref: details.ref, amount: details.amount, type: 'Debit', to: \\`${details.bank} | ${details.acct}\`};
  transactions.unshift(t);
  updateBalance(-details.amount);
  saveToStorage();
  renderTable(transactions);
  renderPreview();

  // add to recent transfers
  const rtbody = document.querySelector('#recentTransfers tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${details.ref}</td><td>${details.name}</td><td>${fmt(details.amount)}</td>`;
  rtbody.prepend(tr);

  document.getElementById('sendMessage').textContent = 'Transfer simulated successfully (demo).';
  document.getElementById('sendForm').reset();
}

// init
window.addEventListener('DOMContentLoaded', ()=>{
  loadFromStorage();
  document.getElementById('balance').textContent = fmt(balance);
  renderPreview();
  renderTable(transactions);

  // nav buttons
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.addEventListener('click', ()=> showPage(b.dataset.page));
  });

  // view all
  document.getElementById('viewAll').addEventListener('click', (e)=>{ e.preventDefault(); showPage('transactions-page'); });
  document.getElementById('backFromTx').addEventListener('click', ()=> showPage('home-page'));

  document.getElementById('downloadCsv').addEventListener('click', ()=> downloadCsv(transactions));
  document.getElementById('addDemo').addEventListener('click', ()=> addDemoTransaction());
  document.getElementById('search').addEventListener('input', ()=> applyFilter());

  document.getElementById('sendBtn').addEventListener('click', ()=>{
    const details = handleSendValidation();
    if(!details) return;
    showConfirmModal(details, ()=> performSend(details));
  });

  document.getElementById('profileBtn').addEventListener('click', ()=> showPage('profile-page'));
  document.getElementById('saveProfile').addEventListener('click', (e)=>{ 
    e.preventDefault();
    const p = { name: document.getElementById('profName').value.trim(), email: document.getElementById('profEmail').value.trim(), phone: document.getElementById('profPhone').value.trim() };
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(p));
    document.getElementById('profileBtn').textContent = 'Welcome.... ' + (p.name || 'Steven');
  });

});