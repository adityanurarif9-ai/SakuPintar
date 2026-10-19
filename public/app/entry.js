import {brand,icon} from './icons.js';
import {loadAccount,registerAccount,onAccountStatus,hasPending,syncAccount} from './account.js';

const root=document.querySelector('#auth-root');
// The first release cached a static shell. Retire that cache during migration;
// user records in localStorage are retained for the explicit import action.
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(registrations=>Promise.all(registrations.filter(registration=>{
    const url=new URL(registration.active?.scriptURL||registration.waiting?.scriptURL||location.href);
    return url.origin===location.origin&&['/sw.js','/app/sw.js'].includes(url.pathname);
  }).map(registration=>registration.unregister()))).catch(()=>{});
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let account=null,user=null,launched=false,fetching=false;
const signIn=path=>`/signin-with-chatgpt?return_to=${encodeURIComponent(`/app/#${path}`)}`;
const supportSvg=`<svg class="auth-illustration" viewBox="0 0 520 410" role="img" aria-label="Ilustrasi rencana tabungan di buku catatan"><defs><pattern id="ruled" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M0 31.5h32" stroke="#dedfce" stroke-width=".7"/></pattern></defs><g transform="translate(55 34) rotate(-7 190 160)"><rect x="9" y="17" width="329" height="326" rx="12" fill="#123528" opacity=".09"/><rect width="329" height="326" rx="9" fill="#faf9f1"/><rect x="24" y="72" width="278" height="229" fill="url(#ruled)"/><path d="M49 0v326" stroke="#dda18c" stroke-width=".8" opacity=".6"/><text x="71" y="52" font-family="Georgia,serif" font-size="26" fill="#254637">Rencana kecilku.</text><text x="71" y="108" font-family="Arial,sans-serif" font-size="13" fill="#788674">TARGET BULAN INI</text><text x="71" y="142" font-family="Arial,sans-serif" font-size="18" fill="#294934">Sepatu buat latihan</text><path d="M74 174h192" stroke="#d6dece" stroke-width="9" stroke-linecap="round"/><path d="M74 174h133" stroke="#688953" stroke-width="9" stroke-linecap="round"/><text x="71" y="209" font-family="Arial,sans-serif" font-size="12" fill="#8a9682">Satu langkah lagi, setiap hari.</text><path d="m73 246 6 6 12-13m-18 39 6 6 12-13" stroke="#628051" fill="none" stroke-width="2"/><text x="105" y="251" font-family="Arial,sans-serif" font-size="12" fill="#657b5d">Catat pengeluaran</text><text x="105" y="283" font-family="Arial,sans-serif" font-size="12" fill="#657b5d">Sisihkan uang saku</text></g><g transform="rotate(11 400 275)"><rect x="309" y="211" width="173" height="125" rx="10" fill="#183d2e"/><path d="M309 238h173" stroke="#315541"/><circle cx="443" cy="237" r="6" fill="#d2e7a1"/><text x="326" y="271" font-family="Arial,sans-serif" font-size="9" fill="#a8bea2">KEBIASAAN YANG TUMBUH</text><text x="326" y="301" font-family="Georgia,serif" font-size="24" fill="#e9f1d3">Pelan. Konsisten.</text></g><g transform="translate(373 75)"><circle cx="30" cy="30" r="30" fill="#dbc49c"/><circle cx="30" cy="30" r="24" fill="none" stroke="#b49c74" stroke-width="1"/><text x="30" y="38" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="#8f7853">Rp</text></g></svg>`;
function authView(error=''){
  const signup=location.hash==='#daftar';document.body.classList.add('auth-mode');
  root.innerHTML=`<div class="auth-layout"><section class="auth-story">${brand()}<div class="auth-story-copy"><p class="auth-kicker">UNTUK HAL YANG KAMU INGINKAN.</p><h1>Uang saku hari ini.<br>Rencana buat nanti.</h1><p>Kenali pengeluaranmu. Sisihkan untuk impianmu.<br>Mulai dari yang kecil, dengan caramu sendiri.</p></div>${supportSvg}<div class="auth-story-foot"><span>CATAT. SISIHKAN. WUJUDKAN.</span><span>SAKUPINTAR / 2026</span></div></section><section class="auth-form-side"><div class="auth-top-link">${signup?'Sudah punya akun?':'Baru di sini?'} <a href="#${signup?'masuk':'daftar'}">${signup?'Masuk':'Buat akun'} ${icon('arrow')}</a></div><div class="auth-form-wrap"><div class="auth-step">${signup?'01 — MULAI DARI SINI':'RUANG PRIBADIMU'}</div><h2>${signup?'Bikin ruangmu sendiri.':'Selamat datang kembali.'}</h2><p class="auth-description">${signup?'Satu akun untuk uang saku dan semua impianmu.':'Masuk untuk melanjutkan catatan dan rencana tabunganmu.'}</p><div class="auth-tabs"><a href="#masuk" class="${signup?'':'selected'}">Masuk</a><a href="#daftar" class="${signup?'selected':''}">Daftar</a></div>${signup&&user&&!account?`<form id="signup-form"><div class="verified-account">${icon('check')}<div><strong>Akun ChatGPT terhubung</strong><span>${esc(user.email)}</span></div></div><div class="form-group"><label for="signup-name">Mau dipanggil siapa?</label><input id="signup-name" name="name" autocomplete="nickname" maxlength="30" required placeholder="Nama panggilan kamu" value="${esc(sessionStorage.getItem('saku.nickname')||'')}"></div><button class="auth-submit" type="submit">Buat akun SakuPintar ${icon('arrow')}</button><p class="auth-helper">Profil dan catatanmu disimpan terpisah dari pengguna lain.</p></form>`:user&&account?`<div class="returning-account"><span class="returning-avatar">${esc(account.state.name.slice(0,1).toUpperCase())}</span><div><strong>${esc(account.state.name)}</strong><span>${esc(user.email)}</span></div>${icon('check')}</div><button class="auth-submit" data-account-action="enter">${signup?'Akunmu sudah ada — lanjut masuk':'Masuk ke SakuPintar'} ${icon('arrow')}</button><a class="switch-account" href="/signout-with-chatgpt?return_to=%2Fapp%2F%23masuk" target="_top">Gunakan akun lain</a>`:user&&!signup?`<div class="verified-account">${icon('check')}<div><strong>Akun ChatGPT terhubung</strong><span>${esc(user.email)}</span></div></div><p class="auth-helper">Kamu belum punya profil SakuPintar. Buat profil dulu untuk mulai mencatat.</p><a class="auth-submit" href="#daftar">Buat profil SakuPintar ${icon('arrow')}</a>`:`${signup?'<div class="form-group"><label for="draft-name">Nama panggilan</label><input id="draft-name" autocomplete="nickname" maxlength="30" placeholder="Nama panggilan kamu"></div>':''}<a class="auth-submit" data-account-action="provider" href="${signIn(signup?'daftar':'lanjut')}" target="_top"><span class="provider-mark">${icon('lock')}</span>${signup?'Daftar dengan ChatGPT':'Masuk dengan ChatGPT'} ${icon('arrow')}</a><div class="auth-divider"><span>AKUNMU, TETAP AMAN</span></div><p class="auth-helper">Gunakan akun ChatGPT untuk ${signup?'mendaftar':'masuk'}. SakuPintar tidak meminta atau menyimpan password ChatGPT kamu.</p>`}<p class="auth-error" id="auth-error" role="alert">${esc(error)}</p>${error?'<button class="auth-retry" data-account-action="retry">Coba hubungkan lagi</button>':''}<div class="auth-note">${icon('wallet')}<p>Catatan uang saku, tabungan, dan progres belajarmu ada di satu tempat.</p></div></div><div class="auth-form-foot">SakuPintar <span>Uang saku, tertata.</span></div></section></div>`;
}
async function enter(){
  if(!account)return;document.body.classList.remove('auth-mode');
  if(!launched){const app=await import('./app.js');app.startApp(account.state);launched=true;}
  if(['#masuk','#daftar','#lanjut',''].includes(location.hash))location.hash='beranda';
  await syncAccount();
}
async function boot(){
  if(fetching)return;fetching=true;
  try{const result=await loadAccount();user=result.user;account=result.account;
    if(account&&!['#masuk','#daftar'].includes(location.hash))await enter();else authView();
  }catch(error){authView(error.message);}finally{fetching=false;}
}
onAccountStatus(status=>{
  const messages={saved:'Tersimpan di akunmu',saving:'Menyimpan catatan…',pending:'Menunggu sinkronisasi',offline:'Offline · tersimpan di perangkat',conflict:'Perlu menyelaraskan catatan',expired:'Sesi berakhir · masuk lagi'};
  const target=document.querySelector('#account-sync');if(target)target.textContent=messages[status]||'Terhubung ke akunmu';
  document.body.dataset.sync=status;
});
root.addEventListener('submit',async event=>{
  if(event.target.id!=='signup-form')return;event.preventDefault();
  const button=event.target.querySelector('button');button.disabled=true;button.textContent='Menyiapkan akun…';
  try{const name=new FormData(event.target).get('name');const result=await registerAccount(String(name));user=result.user;account=result.account;sessionStorage.removeItem('saku.nickname');await enter();}
  catch(error){document.querySelector('#auth-error').textContent=error.message;button.disabled=false;button.innerHTML=`Buat akun SakuPintar ${icon('arrow')}`;}
});
document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-account-action]');if(!target)return;
  const action=target.dataset.accountAction;
  if(action==='provider'){const draft=document.querySelector('#draft-name');if(draft?.value)sessionStorage.setItem('saku.nickname',draft.value.trim());}
  if(action==='enter'){event.preventDefault();await enter();}
  if(action==='retry'){event.preventDefault();await boot();}
  if(action==='logout'&&hasPending()){
    event.preventDefault();await syncAccount();
    if(hasPending()){const toast=document.querySelector('#toast');toast.textContent='Catatan belum tersinkron. Sambungkan internet dan unduh cadangan sebelum keluar.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),5000);return;}
    window.location.assign(target.href);
  }
});
window.addEventListener('hashchange',()=>{
  if(['#masuk','#daftar'].includes(location.hash)){authView();}
  else if(account){document.body.classList.remove('auth-mode');}
  else authView();
});
await boot();
