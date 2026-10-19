import {getAuth} from '../../../../lib/auth';
export const dynamic='force-dynamic';
async function handle(request:Request){
  try{
    const response=await getAuth(request).handler(request);
    response.headers.set('Cache-Control','no-store');
    return response;
  }catch{return Response.json({error:'Layanan akun belum dapat dihubungi. Coba lagi sebentar.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export const GET=handle;
export const POST=handle;
