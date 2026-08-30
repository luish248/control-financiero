import { next } from '@vercel/functions';

const SUPABASE_URL='https://mkjezbifyvmatfgdbesu.supabase.co';
const SUPABASE_KEY='sb_publishable_t-wH4CzgzNrS_TyWgZ-Qow_2r6MzbbL';

export default async function middleware(request){
  const {pathname}=new URL(request.url);

  if(pathname==='/logout'){
    const headers=new Headers({'Location':new URL('/login.html?session=closed',request.url).toString()});
    headers.append('Set-Cookie','cf_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    headers.append('Set-Cookie','cf_refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    return new Response(null,{status:302,headers});
  }

  if(pathname==='/login.html'||pathname==='/lhg-logo.svg'||pathname==='/favicon.ico'||pathname.startsWith('/api/')) return next();

  const token=request.headers.get('cookie')?.match(/(?:^|;\s*)cf_access_token=([^;]+)/)?.[1];
  if(!token) return Response.redirect(new URL('/login.html',request.url),302);

  try{
    const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
    if(response.ok) return next();
  }catch(error){}

  const url=new URL('/login.html',request.url);
  url.searchParams.set('session','expired');
  const headers=new Headers({'Location':url.toString()});
  headers.append('Set-Cookie','cf_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  headers.append('Set-Cookie','cf_refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return new Response(null,{status:302,headers});
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
