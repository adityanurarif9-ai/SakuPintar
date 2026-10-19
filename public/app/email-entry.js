import {brand,icon} from './icons.js';
import {supportSvg} from './auth-art.js';
import {loadAccount,registerAccount,onAccountStatus,hasPending,syncAccount} from './account.js';

const root=document.querySelector('#auth-root');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let account=null,user=null,launched=false,fetching=false;

function authView(error=''){
  const signup=location.hash==='#daftar';document.body.classList.add('auth-mode');
  root.innerHTML=`<div class="auth-layout"><section class="auth-story">${brand()}<div class="auth-story-copy"><p class="auth-kicker">UANG SAKU, TERTATA.</p><h1>Lebih tahu uangmu.<br>Lebih dekat impianmu.</h1><p>Catat yang keluar. Sisihkan yang tersisa.<br>Mulai rencana kecilmu dari sini.</p></div>${supportSvg}<div class="auth-story-foot"><span>CATAT · SISIHKAN · WUJUDKAN</span><span>SAKUPINTAR</span></div></section><section class="auth-form-side"><div class="auth-top-link">${signup?'Sudah punya akun?':'Baru di sini?'} <a href="#${signup?'masuk':'daftar'}">${signup?'Masuk':'Buat akun'} ${icon('arrow')}</a></div><div class="auth-form-wrap"><div class="auth-step">AKUN SAKUPINTAR</div><h2>${signup?'Mulai dari akunmu.':'Selamat datang kembali.'}</h2><p class="auth-description">${signup?'Buat akun untuk mencatat uang saku dan menyimpan rencana tabunganmu.':'Masuk dengan email dan kata sandi untuk melanjutkan catatanmu.'}</p><div class="auth-tabs"><a href="#masuk" class="${signup?'':'selected'}">Masuk</a><a href="#daftar" class="${signup?'selected':''}">Daftar</a></div><form id="email-auth-form">${signup?'<div class="form-group"><label for="auth-name">Nama panggilan</label><input id="auth-name" name="name" autocomplete="nickname" maxlength="30" placeholder="Nama panggilanmu" required></div>':''}<div class="form-group"><label for="auth-email">Email</label><input id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="nama@email.com" required></div><div class="form-group"><label for="auth-password">Kata sandi</label><div class="password-input"><input id="auth-password" name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" minlength="8" maxlength="128" placeholder="${signup?'Buat kata sandi':'Masukkan kata sandi'}" required><button type="button" class="password-toggle" data-account-action="toggle-password" aria-label="Tampilkan kata sandi" aria-pressed="false">Lihat</button></div>${signup?'<p class="password-note">Gunakan minimal 8 karakter.</p>':''}</div>${signup?'<div class="form-group"><label for="auth-confirm">Ulangi kata sandi</label><input id="auth-confirm" name="confirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" placeholder="Masukkan kata sandi sekali lagi" required></div>':''}<p class="auth-error" id="auth-error" role="alert">${esc(error)}</p><button class="auth-submit" type="submit">${signup?'Buat akun SakuPintar':'Masuk'} ${icon('arrow')}</button></form><div class="auth-note">${icon('lock')}<p>Catatan hanya dapat dibuka setelah kamu masuk ke akunmu.</p></div></div><div class="auth-form-foot"><span>SakuPintar</span><span>Uang saku, tertata.</span></div></section></div>`;
}
async function ensureWallet(result){
  if(result.user&&!result.account){
    try{return await registerAccount((result.user.name||'Pelajar').slice(0,30));}
    catch{const retried=await loadAccount();if(!retried.account)throw Error('Akun berhasil masuk, tetapi catatan belum dapat dimuat. Coba masuk lagi.');return retried;}
  }
  return result;
}
async function enter(){
  if(!account)return;document.body.classList.remove('auth-mode');
  if(!launched){const app=await import('./app.js');app.startApp(account.state);launched=true;}
  if(['#masuk','#daftar','#lanjut',''].includes(location.hash))location.hash='beranda';
  await syncAccount();
}
async function boot(){
  if(fetching)return;fetching=true;
  try{const result=await ensureWallet(await loadAccount());user=result.user;account=result.account;
    if(account&&!['#masuk','#daftar'].includes(location.hash))await enter();else authView();
  }catch(error){authView(error.message);}finally{fetching=false;}
}
async function authRequest(path,body){
  const response=await fetch(`/api/auth/${path}`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!response.ok){
    if(response.status===429)throw Error('Terlalu banyak percobaan. Tunggu satu menit, lalu coba lagi.');
    if(response.status>=500)throw Error('Layanan akun belum dapat dihubungi. Coba lagi sebentar.');
    const detail=await response.json().catch(()=>({}));
    if(['USER_ALREADY_EXISTS','USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'].includes(detail.code))throw Error('Email sudah terdaftar. Silakan masuk.');
    if(detail.code==='INVALID_EMAIL')throw Error('Periksa kembali alamat emailmu.');
    throw Error(path==='sign-in/email'?'Email atau kata sandi belum cocok.':'Pendaftaran belum berhasil. Periksa email dan kata sandi, lalu coba lagi.');
  }
  return response.json();
}
root.addEventListener('submit',async event=>{
  if(event.target.id!=='email-auth-form')return;event.preventDefault();
  const form=event.target,data=new FormData(form),signup=location.hash==='#daftar';
  const password=String(data.get('password')),email=String(data.get('email')).trim();
  if(signup&&password!==data.get('confirm')){document.querySelector('#auth-error').textContent='Kedua kata sandi belum sama.';return;}
  const name=String(data.get('name')||'').trim();
  if(signup&&!name){document.querySelector('#auth-error').textContent='Isi nama panggilanmu dahulu.';return;}
  const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent=signup?'Membuat akun…':'Sedang masuk…';
  try{
    await authRequest(signup?'sign-up/email':'sign-in/email',signup?{email,password,name}:{email,password});
    form.reset();const result=await ensureWallet(await loadAccount());user=result.user;account=result.account;
    if(!account)throw Error('Sesi belum terbentuk. Coba masuk kembali.');
    // A fresh document clears the previous account's in-memory dashboard state.
    location.replace('/app/#beranda');location.reload();
  }catch(error){
    const errorBox=document.querySelector('#auth-error');if(errorBox)errorBox.textContent=error.message;
    button.disabled=false;button.innerHTML=`${signup?'Buat akun SakuPintar':'Masuk'} ${icon('arrow')}`;
  }
});
onAccountStatus(status=>{
  const messages={saved:'Tersimpan di akunmu',saving:'Menyimpan catatan…',pending:'Menunggu sinkronisasi',offline:'Offline · tersimpan di perangkat',conflict:'Perlu menyelaraskan catatan',expired:'Sesi berakhir · masuk lagi'};
  const target=document.querySelector('#account-sync');if(target)target.textContent=messages[status]||'Terhubung ke akunmu';document.body.dataset.sync=status;
});
document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-account-action]');if(!target)return;
  if(target.dataset.accountAction==='toggle-password'){
    const input=document.querySelector('#auth-password'),show=input.type==='password';input.type=show?'text':'password';target.textContent=show?'Tutup':'Lihat';target.setAttribute('aria-pressed',String(show));target.setAttribute('aria-label',show?'Sembunyikan kata sandi':'Tampilkan kata sandi');return;
  }
  if(target.dataset.accountAction==='logout'){
    event.preventDefault();target.setAttribute('aria-disabled','true');
    try{
      if(hasPending()){await syncAccount();if(hasPending())throw Error('Catatan belum tersinkron. Sambungkan internet atau unduh cadangan sebelum keluar.');}
      await authRequest('sign-out',{});location.replace('/app/#masuk');location.reload();
    }catch(error){const toast=document.querySelector('#toast');toast.textContent=error.message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),5000);target.removeAttribute('aria-disabled');}
  }
});
window.addEventListener('hashchange',()=>{
  if(['#masuk','#daftar'].includes(location.hash))authView();
  else if(account)document.body.classList.remove('auth-mode');else authView();
});
await boot();
