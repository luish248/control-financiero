(function(){
  let serverMovements=[];
  let loading=false;
  const today=()=>new Date().toISOString().slice(0,10);

  function addDateField(){
    if(document.getElementById('fDate')) return;
    const month=document.getElementById('fMonth');
    if(!month||!month.parentElement) return;
    const field=document.createElement('div');
    field.className='field';
    field.innerHTML='<label>FECHA</label><input id="fDate" type="date">';
    month.parentElement.after(field);
    const date=document.getElementById('fDate');
    date.value=today();
    date.addEventListener('change',syncDateToSelectors);
    syncDateToSelectors();
  }
  function syncDateToSelectors(){
    const date=document.getElementById('fDate');
    if(!date||!date.value) return;
    const parts=date.value.split('-');
    const y=document.getElementById('fYear'),m=document.getElementById('fMonth');
    if(y&&Array.from(y.options).some(o=>o.value===parts[0])) y.value=parts[0];
    if(m) m.value=String(Number(parts[1])-1);
  }
  function syncSelectorsToDate(){
    const date=document.getElementById('fDate'),y=document.getElementById('fYear'),m=document.getElementById('fMonth');
    if(!date||!y||!m) return;
    const month=String(Number(m.value)+1).padStart(2,'0');
    date.value=`${y.value}-${month}-01`;
  }
  async function api(path,options){
    const r=await fetch(path,{credentials:'same-origin',...options});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error||'No se pudo completar la operación.');
    return data;
  }
  window.data=function(){return serverMovements.slice()};
  window.saveData=function(){return true};
  window.saveMovement=async function(){
    if(loading) return;
    const date=document.getElementById('fDate');
    const y=document.getElementById('fYear'),m=document.getElementById('fMonth');
    const category=document.getElementById('fCategory').value;
    const amount=Number(document.getElementById('fAmount').value);
    const description=selectedType==='gasto'?document.getElementById('fDescriptionSelect').value:document.getElementById('fDescription').value.trim();
    if(category==='__add__'){selectedType==='ingreso'?addIncomeCategory():addExpenseCategory();return}
    if(selectedType==='gasto'&&description==='__add__') return;
    if(!date||!date.value){alert('Selecciona una fecha.');return}
    if(!amount||amount<=0){alert('Ingresa un monto mayor que 0.');return}
    loading=true;
    try{
      await api('/api/movements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:selectedType,category,amount,detail:description,movement_date:date.value})});
      await load();
      document.getElementById('fAmount').value='';
      document.getElementById('fDescription').value='';
      if(selectedType==='gasto'&&typeof renderDescriptionField==='function') renderDescriptionField();
      if(y&&m){document.getElementById('movementYear').value=y.value;document.getElementById('year').value=y.value}
      renderRecords();renderHome();renderYearList();
      alert('Movimiento guardado correctamente en Supabase.');
    }catch(e){alert(e.message)}finally{loading=false}
  };
  window.deleteMovement=async function(id){
    if(!confirm('¿Eliminar este movimiento?')) return;
    try{await api('/api/movements?id='+encodeURIComponent(id),{method:'DELETE'});await load();renderRecords();renderHome();renderYearList();}
    catch(e){alert(e.message)}
  };
  async function load(){
    const rows=await api('/api/movements');
    serverMovements=Array.isArray(rows)?rows.map(x=>({id:x.id,year:Number(x.year),month:Number(x.month)-1,type:x.type,category:x.category,amount:Number(x.amount),description:x.detail||'',movement_date:x.movement_date||''})):[];
  }
  async function init(){
    addDateField();
    const m=document.getElementById('fMonth'),y=document.getElementById('fYear');
    if(m) m.addEventListener('change',syncSelectorsToDate);
    if(y) y.addEventListener('change',syncSelectorsToDate);
    try{await load();renderRecords();renderHome();}catch(e){console.error(e);alert('No se pudieron cargar los movimientos de Supabase. Revisa tu sesión.');}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
