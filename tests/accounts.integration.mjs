// Synthetic accounts exercise the real cookie/session and database paths.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {record} from '../public/app/core.mjs';
const origin=process.env.SAKU_TEST_ORIGIN||'http://127.0.0.1:7357';
const bypass=process.env.SAKU_TEST_BYPASS;
const stamp=randomUUID();
const password=randomUUID()+'Aa!9';
let checks=0;
const pass=message=>{checks++;console.log('PASS',message);};
function client(){
  let cookie='';
  return async(path,{method='GET',body,foreignOrigin}={})=>{
    const headers={Origin:foreignOrigin||origin};
    if(cookie)headers.Cookie=cookie;
    if(bypass)headers['OAI-Sites-Authorization']=`Bearer ${bypass}`;
    if(body!==undefined)headers['Content-Type']='application/json';
    const response=await fetch(origin+path,{redirect:'manual',method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    const cookies=response.headers.getSetCookie();
    if(cookies.length){
      const jar=new Map(cookie.split('; ').filter(Boolean).map(v=>{const i=v.indexOf('=');return [v.slice(0,i),v.slice(i+1)];}));
      for(const line of cookies){const pair=line.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}
      cookie=[...jar].map(([k,v])=>`${k}=${v}`).join('; ');
    }
    return response;
  };
}
const a=client(),b=client(),anon=client();
let response=await anon('/api/wallet');assert.equal(response.status,200);assert.equal((await response.json()).user,null);
response=await anon('/api/wallet',{method:'PUT',body:{}});assert.equal(response.status,401);pass('Catatan ditutup untuk pengunjung tanpa sesi');
const emailA=`saku-test-${stamp}-a@example.test`,emailB=`saku-test-${stamp}-b@example.test`;
response=await a('/api/auth/sign-up/email',{method:'POST',body:{name:'Pelajar A',email:emailA,password}});
assert.equal(response.status,200,await response.clone().text());
assert.ok(response.headers.getSetCookie().some(v=>/httponly/i.test(v)));
if(origin.startsWith('https:'))assert.ok(response.headers.getSetCookie().some(v=>/; secure/i.test(v)));
pass('Daftar email membuat sesi dengan cookie HttpOnly');
response=await a('/api/wallet');let data=await response.json();assert.ok(data.user.id.startsWith('email:'));assert.equal(data.account,null);
const ownerA=data.user.id;
response=await a('/api/wallet',{method:'POST',body:{name:'Pelajar A',userId:'forged-owner'}});assert.equal(response.status,201);
data=await response.json();let next=record(data.account.state,{kind:'income',label:'Pemasukan uji otomatis',amount:100000,emoji:'💸'});
next=record(next,{kind:'saving',label:'Tabungan uji otomatis',amount:5000,emoji:'🐷',goalId:next.goals[0].id});
response=await a('/api/wallet',{method:'PUT',body:{state:next,revision:1,userId:'forged-owner'}});assert.equal(response.status,200);
pass('Saldo dan tabungan tersimpan dengan pemilik dari sesi server');
response=await a('/api/wallet',{method:'PUT',body:{state:next,revision:1}});assert.equal(response.status,409);pass('Versi lama tidak menimpa data terbaru');
response=await a('/api/wallet',{method:'PUT',foreignOrigin:'https://different-origin.example',body:{state:next,revision:2}});assert.ok([400,403].includes(response.status));
response=await a('/api/auth/sign-out',{method:'POST',foreignOrigin:'https://different-origin.example',body:{}});assert.ok([400,403].includes(response.status));pass('Permintaan dari origin asing ditolak');
response=await a('/api/wallet',{method:'PUT',body:{state:{...next,name:''},revision:2}});assert.equal(response.status,400);pass('Data catatan tidak valid ditolak');
response=await a('/api/auth/sign-out',{method:'POST',body:{}});assert.equal(response.status,200);
response=await a('/api/wallet');assert.equal((await response.json()).user,null);pass('Keluar mengakhiri sesi');
response=await a('/api/auth/sign-in/email',{method:'POST',body:{email:emailA,password:'deliberately-wrong-password'}});assert.equal(response.status,401);pass('Kata sandi salah ditolak');
response=await a('/api/auth/sign-in/email',{method:'POST',body:{email:emailA,password}});assert.equal(response.status,200);
response=await a('/api/wallet');data=await response.json();assert.equal(data.user.id,ownerA);assert.deepEqual(data.account.state,next);pass('Masuk kembali memulihkan catatan akun');
response=await b('/api/auth/sign-up/email',{method:'POST',body:{name:'Pelajar B',email:emailB,password}});assert.equal(response.status,200,await response.clone().text());
response=await b('/api/wallet');data=await response.json();assert.notEqual(data.user.id,ownerA);assert.equal(data.account,null);
response=await b('/api/wallet',{method:'POST',body:{name:'Pelajar B',userId:ownerA}});assert.equal(response.status,201);
response=await a('/api/wallet');assert.deepEqual((await response.json()).account.state,next);pass('Akun kedua tidak dapat memilih atau menimpa catatan akun pertama');
for(const c of [a,b]){response=await c('/api/auth/sign-out',{method:'POST',body:{}});assert.equal(response.status,200);}
console.log(`${checks} pemeriksaan integrasi akun email lulus.`);
