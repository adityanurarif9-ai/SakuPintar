import {key,validateState} from './core.mjs';
let user=null,revision=0,dirty=false,pending=null,syncing=false,conflict=false,inFlight=null;
let listener=()=>{};
const scope=()=>`${key}:account:${user.id}`;
const cacheKey=()=>`${scope()}:cache`;
const notify=status=>listener(status);
export const onAccountStatus=fn=>{listener=fn;};
export const currentUser=()=>user;
export const hasPending=()=>dirty;
export const isConflicted=()=>conflict;
export async function loadAccount(){
  const response=await fetch('/api/wallet',{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw Error('Akun belum dapat dimuat. Periksa koneksi, lalu coba lagi.');
  const data=await response.json();user=data.user;
  if(!user)return {user:null,account:null};
  if(!data.account)return {user,account:null};
  revision=data.account.revision;
  let cached=null;try{cached=JSON.parse(localStorage.getItem(cacheKey())||'null');}catch{}
  if(cached?.dirty){
    validateState(cached.state);
    if(cached.revision!==revision){conflict=true;notify('conflict');return {user,account:{state:cached.state},conflict:true};}
    pending=cached.state;dirty=true;notify('pending');return {user,account:{state:cached.state}};
  }
  validateState(data.account.state);
  localStorage.setItem(cacheKey(),JSON.stringify({state:data.account.state,revision,dirty:false}));return data;
}
export const accountStorage={
  setItem(_key,raw){
    if(!user)throw Error('Silakan masuk dahulu.');
    if(conflict)throw Error('Unduh cadangan lokal lalu muat ulang untuk menyelesaikan perbedaan catatan.');
    const next=JSON.parse(raw);localStorage.setItem(cacheKey(),JSON.stringify({state:next,revision,dirty:true}));
    pending=next;dirty=true;notify('pending');
  },
  getItem(){if(!user)return null;const cached=JSON.parse(localStorage.getItem(cacheKey())||'null');return cached?JSON.stringify(cached.state):null;},
};
export async function syncAccount(){
  if(!dirty||syncing||!user||conflict)return;
  syncing=true;notify('saving');
  try{
    while(pending){
      const snapshot=pending;pending=null;inFlight=snapshot;
      const response=await fetch('/api/wallet',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:snapshot,revision})});
      if(!response.ok){pending=pending||snapshot;if(response.status===409){conflict=true;notify('conflict');}else notify(response.status===401?'expired':'offline');return;}
      const result=await response.json();revision=result.revision;inFlight=null;
      if(pending)localStorage.setItem(cacheKey(),JSON.stringify({state:pending,revision,dirty:true}));
      else{localStorage.setItem(cacheKey(),JSON.stringify({state:snapshot,revision,dirty:false}));dirty=false;}
    }
    notify('saved');
  }catch{pending=pending||inFlight;notify('offline');}finally{inFlight=null;syncing=false;}
}
export async function registerAccount(name){
  const response=await fetch('/api/wallet',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
  const body=await response.json();if(!response.ok)throw Error(body.error||'Pendaftaran belum berhasil.');return loadAccount();
}
export function useServerCopy(){if(!user)return;localStorage.removeItem(cacheKey());location.reload();}
window.addEventListener('online',()=>syncAccount());
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
