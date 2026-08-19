const SUPABASE_URL='https://mkjezbifyvmatfgdbesu.supabase.co';
const SUPABASE_KEY='sb_publishable_t-wH4CzgzNrS_TyWgZ-Qow_2r6MzbbL';

export default {
  async fetch(request){
    if(request.method!=='POST') return Response.json({error:'Método no permitido.'},{status:405});
    try{
      const {email,password}=await request.json();
      if(!email||!password) return Response.json({error:'Ingresa correo y contraseña.'},{status:400});
      const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
        body:JSON.stringify({email,password})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.access_token) return Response.json({error:data.error_description||data.msg||'Correo o contraseña incorrectos.'},{status:401});
      const maxAge=Math.max(300,Number(data.expires_in||3600));
      const headers=new Headers({'Content-Type':'application/json'});
      headers.append('Set-Cookie',`cf_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
      if(data.refresh_token) headers.append('Set-Cookie',`cf_refresh_token=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
      return new Response(JSON.stringify({ok:true}),{status:200,headers});
    }catch(error){
      console.error(error);
      return Response.json({error:'No se pudo conectar con el servicio de autenticación.'},{status:500});
    }
  }
};
