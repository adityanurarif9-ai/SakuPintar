// Uses only the starter's loopback-only simulated identity, never real credentials.
import assert from 'node:assert/strict';
import {initialState,record} from '../public/app/core.mjs';
const origin='http://127.0.0.1:7357';
const request=(path,options={})=>fetch(origin+path,{redirect:'manual',...options});
const counters=[];
function pass(message){counters.push(message);console.log('PASS',message);}
const anonymous=await request('/api/wallet');
assert.equal(anonymous.status,200);assert.equal((await anonymous.json()).user,null);pass('Pengunjung anonim belum memiliki sesi');
const denied=await request('/api/wallet',{method:'PUT',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({state:initialState(),revision:1})});
assert.equal(denied.status,401);pass('Penulisan tanpa sesi ditolak');
const signin=await request('/signin-with-chatgpt?return_to=/app/');
const cookie=signin.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie,'Local mock sign-in must issue its development cookie');
let res=await request('/api/wallet',{headers:{Cookie:cookie}});let data=await res.json();
assert.equal(data.user.id,'local_seedy');
if(!data.account){res=await request('/api/wallet',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({name:'Akun Uji',userId:'client-cannot-choose-owner'})});assert.equal(res.status,201);pass('Pendaftaran membuat profil untuk identitas server');}
else pass('Profil uji yang sudah ada dipakai kembali');
res=await request('/api/wallet',{headers:{Cookie:cookie}});data=await res.json();assert.ok(data.account);
const revision=data.account.revision;
let next=record(data.account.state,{kind:'income',label:'Pemasukan uji otomatis',amount:100000,emoji:'💸'});
next=record(next,{kind:'saving',label:'Tabungan uji otomatis',amount:5000,emoji:'🐷',goalId:next.goals[0].id});
res=await request('/api/wallet',{method:'PUT',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({state:next,revision,userId:'client-cannot-choose-owner'})});
assert.equal(res.status,200);assert.equal((await res.json()).revision,revision+1);pass('Catatan valid tersimpan di akun yang sedang masuk');
res=await request('/api/wallet',{method:'PUT',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({state:next,revision})});assert.equal(res.status,409);pass('Versi lama ditolak agar tidak menimpa perubahan perangkat lain');
res=await request('/api/wallet',{method:'PUT',headers:{Cookie:cookie,Origin:'https://different-origin.example','Content-Type':'application/json'},body:JSON.stringify({state:next,revision:revision+1})});assert.ok([400,403].includes(res.status));pass('Permintaan tulis dari origin lain ditolak');
res=await request('/api/wallet',{method:'PUT',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({state:{...next,name:''},revision:revision+1})});assert.equal(res.status,400);pass('Catatan tidak valid ditolak di server');
res=await request('/api/wallet',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({name:'Akun ganda'})});assert.equal(res.status,409);pass('Pendaftaran profil ganda ditolak');
res=await request('/signout-with-chatgpt?return_to=/app/');const expiredCookie=res.headers.get('set-cookie')?.split(';')[0];assert.ok(expiredCookie);
res=await request('/api/wallet',{headers:{Cookie:expiredCookie}});assert.equal((await res.json()).user,null);pass('Keluar menghapus sesi pengembangan');
const signBack=await request('/signin-with-chatgpt?return_to=/app/');const again=signBack.headers.get('set-cookie')?.split(';')[0];
res=await request('/api/wallet',{headers:{Cookie:again}});const restored=await res.json();assert.deepEqual(restored.account.state,next);pass('Masuk kembali memulihkan catatan akun dari database');
console.log(`${counters.length} pemeriksaan integrasi akun lulus.`);
