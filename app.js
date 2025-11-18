// Demo transactions (matched to screenshot patterns)
const transactions = [
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

function fmt(n){
  return n.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, style:'currency', currency:'USD'});
}

function renderTable(list){
  const tbody = document.querySelector("#txTable tbody");
  tbody.innerHTML = "";
  list.forEach((t,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i+1}</td>
      <td>${t.ref}</td>
      <td>${fmt(t.amount)}</td>
      <td><span class="badge ${t.type.toLowerCase()}">${t.type}</span></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById("txCount").textContent = list.length;
}

function downloadCsv(list){
  const rows = [["#", "REFERENCE", "AMOUNT", "TYPE"]];
  list.forEach((t,i)=> rows.push([i+1, t.ref, t.amount, t.type]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "transactions.csv"; a.click();
  URL.revokeObjectURL(url);
}

function addDemoTransaction(){
  const idx = transactions.length + 1;
  const isCredit = idx % 2 === 0;
  const ref = "TRXdemo" + Math.random().toString(36).slice(2,12);
  const amount = isCredit ? 100000 + Math.floor(Math.random()*1000000) : 950;
  const t = { ref, amount, type: isCredit ? "Credit" : "Debit" };
  transactions.unshift(t);
  applyFilter();
}

function applyFilter(){
  const q = document.getElementById("search").value.trim().toLowerCase();
  const filtered = transactions.filter(t=>{
    if(!q) return true;
    return t.ref.toLowerCase().includes(q) || String(t.amount).toLowerCase().includes(q);
  }).slice(0, 50);
  renderTable(filtered);
}

document.addEventListener("DOMContentLoaded", ()=>{
  renderTable(transactions);
  document.getElementById("downloadCsv").addEventListener("click", ()=> downloadCsv(transactions));
  document.getElementById("addDemo").addEventListener("click", ()=> addDemoTransaction());
  document.getElementById("search").addEventListener("input", ()=> applyFilter());
});
