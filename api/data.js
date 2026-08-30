const SUPABASE_URL='https://mkjezbifyvmatfgdbesu.supabase.co';
const SUPABASE_KEY='sb_publishable_t-wH4CzgzNrS_TyWgZ-Qow_2r6MzbbL';
const ALLOWED=new Set(['movement_categories','payments','debts','debt_installments','agricultural_lots','agricultural_campaigns','agricultural_expenses','agricultural_harvests','agricultural_sales','assets','land','machinery','vehicles','other_assets','investments','investment_operations','investment_valuations','user_settings']);
function token(request){return request.headers.get('cookie')?.match(/(?:^|;\s*)cf_access_token=([^;]+)/)?.[1]||''}
async function supa(path,options={}){return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SUPABASE_KEY,Authorization:options.authorization||'',Prefer:'return=representation',...options.headers}})}
async function userId(t){const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${t}`}});if(!r.ok)return '';const u=await r.json();return u.id||''}
export default async function handler(request){
 const t=token(request);if(!t)return Response.json({error:'Sesión no válida.'},{status:401});
 const url=new URL(request.url),table=url.searchParams.get('table')||'';if(!ALLOWED.has(table))return Response.json({error:'Tabla no permitida.'},{status:400});
 try{
  const uid=await userId(t);if(!uid)return Response.json({error:'Sesión no válida.'},{status:401});
  if(request.method==='GET'){
   const filters=[...url.searchParams.entries()].filter(([k])=>k!=='table').map(([k,v])=>`${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`);
   const q=filters.length?'?'+filters.join('&'):'?select=*';
   const r=await supa(`${table}${q.includes('select=')?q:q+'&select=*'}`,{headers:{Authorization:`Bearer ${t}`}});const d=await r.json().catch(()=>[]);return Response.json(d,{status:r.status});
  }
  if(request.method==='POST'){
   const body=await request.json();body.user_id=uid;
   const r=await supa(table,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));return Response.json(Array.isArray(d)?d[0]:d,{status:r.status});
  }
  if(request.method==='PATCH'){
   const id=url.searchParams.get('id');if(!id)return Response.json({error:'Falta el id.'},{status:400});const body=await request.json();delete body.user_id;
   const r=await supa(`${table}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));return Response.json(Array.isArray(d)?d[0]:d,{status:r.status});
  }
  if(request.method==='DELETE'){
   const id=url.searchParams.get('id');if(!id)return Response.json({error:'Falta el id.'},{status:400});const r=await supa(`${table}?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Authorization:`Bearer ${t}`}});const d=await r.json().catch(()=>({}));return Response.json({ok:r.ok,data:d},{status:r.status});
  }
  return Response.json({error:'Método no permitido.'},{status:405});
 }catch(e){return Response.json({error:'No se pudo conectar con Supabase.'},{status:500})}
}
