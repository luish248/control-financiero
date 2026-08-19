const SUPABASE_URL='https://mkjezbifyvmatfgdbesu.supabase.co';
const SUPABASE_KEY='sb_publishable_t-wH4CzgzNrS_TyWgZ-Qow_2r6MzbbL';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Método no permitido.'});
  try{
    const {email,password}=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    if(!email||!password) return res.status(400).json({error:'Ingresa correo y contraseña.'});
    const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
      body:JSON.stringify({email,password})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.access_token) return res.status(401).json({error:data.error_description||data.msg||'Correo o contraseña incorrectos.'});
    const maxAge=Math.max(300,Number(data.expires_in||3600));
    res.setHeader('Set-Cookie',[
      `cf_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
      `cf_refresh_token=${data.refresh_token||''}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    ]);
    return res.status(200).json({ok:true});
  }catch(error){
    console.error(error);
    return res.status(500).json({error:'No se pudo conectar con el servicio de autenticación.'});
  }
}
