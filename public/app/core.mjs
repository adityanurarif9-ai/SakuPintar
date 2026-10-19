export const key = 'sakupintar.web.v1';
export const categories = [
  {id:'kantin', name:'Kantin', emoji:'🍜', amount:10000, color:'peach'},
  {id:'ongkos', name:'Ongkos', emoji:'🚌', amount:5000, color:'blue'},
  {id:'buku', name:'Fotokopi / Buku', emoji:'✏️', amount:2000, color:'purple'},
  {id:'jajan', name:'Jajan Sore', emoji:'🧋', amount:8000, color:'pink'},
];
export const lessons = [
  {id:'needs', emoji:'🧠', title:'Kebutuhan atau keinginan?', subtitle:'Belajar menentukan prioritas', text:'Kebutuhan mendukung kegiatan pentingmu, seperti makan, ongkos pulang, dan buku. Keinginan boleh dipenuhi setelah kebutuhan aman.', question:'Uangmu tinggal Rp10.000. Mana yang didahulukan?', answers:['Ongkos pulang sekolah','Minuman yang sedang viral','Stiker baru'], correct:0, why:'Betul! Pastikan kebutuhan perjalanan pulang terpenuhi dulu.'},
  {id:'saving', emoji:'🐷', title:'Menyusun target tabungan', subtitle:'Impian besar, langkah kecil', text:'Tabungan membantu mewujudkan target. Sisihkan nominal yang masuk akal setelah mempertimbangkan kebutuhan harianmu.', question:'Cara sehat menabung untuk sepatu baru adalah…', answers:['Tidak makan seharian','Sisihkan sedikit secara rutin','Meminjam uang tanpa rencana'], correct:1, why:'Tepat! Sedikit secara rutin lebih baik daripada mengorbankan kebutuhan penting.'},
  {id:'budget', emoji:'📝', title:'Membaca pengeluaran', subtitle:'Catatan kecil yang berguna', text:'Catatan pengeluaran membantumu melihat pola. Kamu bisa memilih pengeluaran yang dikurangi tanpa harus berhenti bersenang-senang.', question:'Apa gunanya mencatat jajan setiap hari?', answers:['Supaya uang otomatis bertambah','Supaya bisa membandingkan teman','Mengetahui ke mana uang pergi'], correct:2, why:'Benar! Dari catatan, kamu bisa menyusun rencana yang lebih pas.'},
];
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const addDays = (date, n) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()+n); return dayKey(d); };
export const dateGap = (a,b) => Math.round((Date.parse(`${a}T00:00:00Z`)-Date.parse(`${b}T00:00:00Z`))/86400000);
export const money = n => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const initialState = () => ({version:1, name:'Pelajar', entries:[], goals:[{id:'futsal',name:'Sepatu futsal baru',emoji:'👟',target:250000}], nextPayday:addDays(dayKey(),7), interval:7, completed:[]});
export const balance = s => s.entries.reduce((sum,e) => sum + (e.kind === 'income' ? e.amount : -e.amount),0);
export const goalSaved = (s,id) => s.entries.filter(e => e.kind === 'saving' && e.goalId === id).reduce((sum,e)=>sum+e.amount,0);
export const totalSaved = s => s.entries.filter(e=>e.kind==='saving').reduce((sum,e)=>sum+e.amount,0);
export const savingDays = s => new Set(s.entries.filter(e=>e.kind==='saving').map(e=>dayKey(new Date(e.date))));
export const xp = s => savingDays(s).size*25 + s.completed.length*10;
export const todayEntries = (s, now=new Date()) => s.entries.filter(e=>dayKey(new Date(e.date))===dayKey(now));
export const spent = es => es.filter(e=>e.kind==='expense').reduce((sum,e)=>sum+e.amount,0);
export function validAmount(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n<=0 || n>100000000) throw Error('Isi nominal bulat Rp1 sampai Rp100.000.000.');
  return n;
}
export function record(s, draft, now=new Date()) {
  const amount = validAmount(draft.amount);
  if (!['income','expense','saving'].includes(draft.kind)) throw Error('Jenis catatan tidak dikenal.');
  if (draft.kind !== 'income' && amount > balance(s)) throw Error('Saldo jajanmu belum cukup. Catat uang saku masuk dulu, ya.');
  if (draft.kind==='saving') {
    const goal = s.goals.find(g=>g.id===draft.goalId);
    if (!goal) throw Error('Celengan tidak ditemukan.');
    if (amount > goal.target-goalSaved(s,goal.id)) throw Error('Nominal melebihi sisa target impianmu.');
  }
  const next = structuredClone(s);
  next.entries.unshift({id:uid(),kind:draft.kind,label:String(draft.label).slice(0,70),emoji:draft.emoji||'💸',amount,date:now.toISOString(),category:draft.category||'lain',goalId:draft.goalId||null});
  if (draft.kind==='income' && next.nextPayday<=dayKey(now)) next.nextPayday=addDays(dayKey(now),next.interval);
  return next;
}
export function validateState(s) {
  if (!s || s.version!==1 || typeof s.name!=='string' || !s.name.trim() || s.name.length>30 || !Array.isArray(s.entries) || !Array.isArray(s.goals) || !s.goals.length || ![1,7].includes(s.interval) || !Array.isArray(s.completed)) throw Error('Format data tidak sesuai.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.nextPayday) || !Number.isFinite(Date.parse(s.nextPayday)) || dayKey(new Date(`${s.nextPayday}T12:00:00`))!==s.nextPayday) throw Error('Tanggal tidak valid.');
  const ids=new Set();
  for (const g of s.goals) { validAmount(g.target); if(typeof g.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(g.id)||ids.has(g.id)||typeof g.name!=='string'||!g.name.trim()||g.name.length>50||typeof g.emoji!=='string') throw Error('Data impian tidak valid.'); ids.add(g.id); }
  const txIds=new Set();
  for (const e of s.entries) {
    validAmount(e.amount);
    if(typeof e.id!=='string'||txIds.has(e.id)||!['income','expense','saving'].includes(e.kind)||!Number.isFinite(Date.parse(e.date))||typeof e.label!=='string'||typeof e.emoji!=='string'||(e.kind==='saving'&&!ids.has(e.goalId))) throw Error('Data transaksi tidak valid.');
    txIds.add(e.id);
  }
  if(balance(s)<0||s.goals.some(g=>goalSaved(s,g.id)>g.target)||new Set(s.completed).size!==s.completed.length||s.completed.some(id=>!lessons.some(l=>l.id===id))) throw Error('Perhitungan data tidak valid.');
  return s;
}
export function commit(storage,next) {
  validateState(next);
  try { storage.setItem(key,JSON.stringify(next)); } catch { throw Error('Penyimpanan perangkat tidak tersedia atau penuh. Perubahan belum disimpan.'); }
  return next;
}
