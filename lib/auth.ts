import {betterAuth} from 'better-auth/minimal';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {env} from 'cloudflare:workers';
import {getDb} from '../db';
import * as schema from '../db/schema';

export function getAuth(request:Request){
  const origin=new URL(request.url).origin;
  const local=['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname);
  const runtime=env as typeof env & {BETTER_AUTH_SECRET?:string};
  const secret=runtime.BETTER_AUTH_SECRET||(local?'local-development-only-not-a-production-secret-change-me':undefined);
  if(!secret)throw new Error('Authentication configuration is unavailable.');
  return betterAuth({
    appName:'SakuPintar',baseURL:origin,basePath:'/api/auth',secret,
    database:drizzleAdapter(getDb(),{provider:'sqlite',schema,transaction:false}),
    trustedOrigins:[origin],
    emailAndPassword:{enabled:true,minPasswordLength:8,maxPasswordLength:128,requireEmailVerification:false},
    session:{expiresIn:60*60*24*7,updateAge:60*60*24},
    rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:8},'/sign-up/email':{window:60,max:5}}},
    advanced:{cookiePrefix:'sakupintar',useSecureCookies:!local,ipAddress:{ipAddressHeaders:['cf-connecting-ip']},defaultCookieAttributes:{httpOnly:true,sameSite:'lax',secure:!local}},
  });
}
export async function getWalletUser(request:Request){
  const session=await getAuth(request).api.getSession({headers:request.headers});
  return session?{userId:`email:${session.user.id}`,fullName:session.user.name,email:session.user.email}:null;
}
