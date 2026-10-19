import {and,eq} from 'drizzle-orm';
import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {walletAccounts} from '../../../db/schema';
import {initialState,validateState} from '../../../public/app/core.mjs';

export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function readBody(request:Request){
  if(request.headers.get('origin')!==new URL(request.url).origin)throw new Error('origin');
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('format');
  const raw=await request.text();if(raw.length>1000000)throw new Error('size');return JSON.parse(raw);
}
export async function GET(){
  const user=await getChatGPTUser();if(!user)return json({user:null,account:null});
  try{
    const row=await getDb().select().from(walletAccounts).where(eq(walletAccounts.userId,user.userId)).get();
    return json({user:{id:user.userId,name:user.fullName,email:user.email},account:row?{state:JSON.parse(row.snapshot),revision:row.revision}:null});
  }catch{return json({error:'Akun belum dapat dimuat. Silakan coba lagi.'},503);}
}
export async function POST(request:Request){
  const user=await getChatGPTUser();if(!user)return json({error:'Silakan masuk dengan akun ChatGPT.'},401);
  let body;try{body=await readBody(request);}catch{return json({error:'Permintaan tidak valid.'},400);}
  const name=typeof body.name==='string'?body.name.trim():'';
  if(!name||name.length>30)return json({error:'Nama panggilan harus 1–30 karakter.'},400);
  try{
    const state=initialState();state.name=name;const now=new Date().toISOString();
    const inserted=await getDb().insert(walletAccounts).values({userId:user.userId,snapshot:JSON.stringify(state),revision:1,createdAt:now,updatedAt:now}).onConflictDoNothing().returning({userId:walletAccounts.userId}).get();
    if(!inserted)return json({error:'Akun SakuPintar kamu sudah ada. Pilih Masuk.'},409);
    return json({account:{state,revision:1}},201);
  }catch{return json({error:'Pendaftaran belum berhasil. Coba lagi sebentar.'},503);}
}
export async function PUT(request:Request){
  const user=await getChatGPTUser();if(!user)return json({error:'Sesi berakhir. Masuk lagi untuk menyimpan.'},401);
  let body;try{body=await readBody(request);}catch{return json({error:'Permintaan tidak valid.'},400);}
  if(!Number.isSafeInteger(body.revision)||body.revision<1)return json({error:'Versi catatan tidak valid.'},400);
  try{validateState(body.state);}catch{return json({error:'Format catatan tidak valid.'},400);}
  try{
    const row=await getDb().update(walletAccounts).set({snapshot:JSON.stringify(body.state),revision:body.revision+1,updatedAt:new Date().toISOString()}).where(and(eq(walletAccounts.userId,user.userId),eq(walletAccounts.revision,body.revision))).returning({revision:walletAccounts.revision}).get();
    if(!row)return json({error:'Catatan berubah di perangkat lain. Unduh cadangan lokal lalu muat ulang sebelum melanjutkan.'},409);
    return json({revision:row.revision});
  }catch{return json({error:'Belum tersambung ke server. Salinan lokal tetap tersimpan.'},503);}
}
