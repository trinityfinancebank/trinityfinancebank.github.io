// Transactions and multi-page navigation demo

let transactions = [
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

let balance = 71799032.65; // match screenshot

function fmt(n){
  return n.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, style:'currency', currency:'USD'});
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

function renderTable(list){
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
  renderTable(transactions);
  renderPreview();
  updateBalance(-amount);
}

function updateBalance(delta){
  balance = Number((balance + delta).toFixed(2));
  document.getElementById('balance').textContent = fmt(balance);
}

function handleSend(){
  const name = document.getElementById('recipientName').value.trim();
  const acct = document.getElementById('recipientAccount').value.trim();
  const routing = document.getElementById('recipientRouting').value.trim();
  const bank = document.getElementById('recipientBank').value.trim();
  const amount = Number(document.getElementById('sendAmount').value);
  const ref = document.getElementById('sendRef').value.trim() || ('TRX' + Math.random().toString(36).slice(2,10));
  const msg = document.getElementById('sendMessage');

  if(!name || !acct || !routing || !bank || !amount || amount <= 0){
    msg.textContent = 'Please fill all fields with valid values.';
    return;
  }
  if(amount > balance){
    msg.textContent = 'Insufficient funds for this demo transfer.';
    return;
  }

  // simulate bank-to-bank transfer: create a Debit transaction
  const t = {ref, amount, type: 'Debit', to: `${bank} | ${acct}`};
  transactions.unshift(t);
  updateBalance(-amount);
  renderTable(transactions);
  renderPreview();

  // add to recent transfers
  const rtbody = document.querySelector('#recentTransfers tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${ref}</td><td>${name}</td><td>${fmt(amount)}</td>`;
  rtbody.prepend(tr);

  msg.textContent = 'Transfer simulated successfully (demo).';
  document.getElementById('sendForm').reset();
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  // initial render
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

  document.getElementById('sendBtn').addEventListener('click', ()=> handleSend());
  document.getElementById('profileBtn').addEventListener('click', ()=> showPage('profile-page'));
  document.getElementById('saveProfile').addEventListener('click', (e)=>{ e.preventDefault(); document.getElementById('profileBtn').textContent = 'Welcome.... ' + document.getElementById('profName').value; });
});