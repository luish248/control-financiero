const SUPABASE_URL='https://mkjezbifyvmatfgdbesu.supabase.co';
const SUPABASE_KEY='sb_publishable_t-wH4CzgzNrS_TyWgZ-Qow_2r6MzbbL';

function getToken(request){return request.headers.get('cookie')?.match(/(?:^|;\s*)cf_access_token=([^;]+)/)?.[1]||''}
async function supa(path, options={}){
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
    ...options,
    headers:{apikey:SUPABASE_KEY,Authorization:options.authorization||'',Prefer:'return=representation',...options.headers}
  });
}

export default async function handler(request){
  const token=getToken(request);
  if(!token) return Response.json({error:'Sesión no válida.'},{status:401});
  try{
    if(request.method==='GET'){
      const r=await supa('movements?select=id,type,year,month,category,detail,amount,movement_date&order=movement_date.desc,created_at.desc',{headers:{Authorization:`Bearer ${token}`}});
      const data=await r.json().catch(()=>[]);
      return Response.json(data,{status:r.status});
    }
    if(request.method==='POST'){
      const body=await request.json();
      const date=String(body.movement_date||'');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({error:'La fecha es obligatoria.'},{status:400});
      const payload={type:body.type,year:Number(date.slice(0,4)),month:Number(date.slice(5,7)),category:String(body.category||''),detail:String(body.detail||''),amount:Number(body.amount),movement_date:date};
      if(!['ingreso','gasto'].includes(payload.type)||!payload.category||!(payload.amount>0)) return Response.json({error:'Datos de movimiento inválidos.'},{status:400});
      const r=await supa('movements',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await r.json().catch(()=>({}));
      return Response.json(Array.isArray(data)?data[0]:data,{status:r.status});
    }
    if(request.method==='DELETE'){
      const id=new URL(request.url).searchParams.get('id');
      if(!id) return Response.json({error:'Falta el id.'},{status:400});
      const r=await supa(`movements?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
      const data=await r.json().catch(()=>({}));
      return Response.json({ok:r.ok,data},{status:r.status});
    }
    return Response.json({error:'Método no permitido.'},{status:405});
  }catch(error){return Response.json({error:'No se pudo conectar con la base de datos.'},{status:500})}
}
