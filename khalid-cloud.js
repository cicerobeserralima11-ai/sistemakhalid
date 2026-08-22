/* KHALID CLOUD SYNC v1.0 — sincroniza dados entre celular e notebook. */
(function(){
  const SUPABASE_URL='https://kwuxixucspzqfhzxkimc.supabase.co';
  const SUPABASE_KEY='sb_publishable_vsenwbLiBHSyiZrqDvhtyQ_fgiABbrh';
  const TABLES={
    sistemaKhalidCondominios:'condominios',
    sistemaKhalidInspecoes:'inspecoes',
    sistemaKhalidOcorrencias:'ocorrencias',
    khalidTreinamentos:'treinamentos'
  };
  const headers={'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=representation'};
  const originalSet=Storage.prototype.setItem;
  let syncing=false;
  function read(k){try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
  function write(k,v){originalSet.call(localStorage,k,JSON.stringify(v));}
  function iso(v){if(!v)return new Date().toISOString();const d=new Date(v);return isNaN(d)?new Date().toISOString():d.toISOString()}
  function fp(x){return String(x.id||x.numero||[x.nome,x.endereco,x.data,x.data_inspecao,x.data_ocorrencia,x.titulo,x.colaborador_nome,x.colaborador,x.curso].filter(Boolean).join('|')).trim()}
  function toCloud(k,x){
    if(k==='sistemaKhalidCondominios')return {id:x.id&&/^[0-9a-f-]{36}$/i.test(String(x.id))?x.id:undefined,nome:x.nome||x.name||'',endereco:x.endereco||'',circuito:x.circuito||'',ordem:x.ordem??null,latitude:x.latitude??null,longitude:x.longitude??null,ativo:x.ativo!==false};
    if(k==='sistemaKhalidInspecoes')return {id:x.id&&/^[0-9a-f-]{36}$/i.test(String(x.id))?x.id:undefined,condominio_nome:x.condominio_nome||x.condominio||'',data_inspecao:iso(x.data_inspecao||x.data||x.created_at),inspetor:x.inspetor||x.supervisor||'Khalid',resultado:x.resultado||x.status||'',observacoes:x.observacoes||'',itens:x.itens||{}};
    if(k==='sistemaKhalidOcorrencias')return {id:x.id&&/^[0-9a-f-]{36}$/i.test(String(x.id))?x.id:undefined,condominio_nome:x.condominio_nome||x.condominio||'',data_ocorrencia:iso(x.data_ocorrencia||x.data||x.created_at),categoria:x.categoria||x.tipo||'',titulo:x.titulo||x.assunto||'',descricao:x.descricao||x.relato||'',providencias:x.providencias||'',responsavel:x.responsavel||x.inspetor||'Khalid',prioridade:x.prioridade||x.gravidade||'',status:x.status||'aberta'};
    if(k==='khalidTreinamentos')return {id:x.id&&/^[0-9a-f-]{36}$/i.test(String(x.id))?x.id:undefined,colaborador_nome:x.colaborador_nome||x.colaborador||x.nome||'',re:x.re||x.RE||'',condominio_nome:x.condominio_nome||x.condominio||'',curso:x.curso||x.tipo||'Treinamento',carga_horaria:x.carga_horaria||x.horas||null,instrutor:x.instrutor||'',data_treinamento:x.data_treinamento||x.data||null,status:x.status||'Concluído',conteudo:x.conteudo||[],observacoes:x.observacoes||x.obs||''};
  }
  function fromCloud(k,x){
    if(k==='sistemaKhalidCondominios')return {...x};
    if(k==='sistemaKhalidInspecoes')return {...x,id:x.id,data:x.data_inspecao};
    if(k==='sistemaKhalidOcorrencias')return {...x,id:x.id,data:x.data_ocorrencia};
    if(k==='khalidTreinamentos')return {...x,id:x.id,colaborador:x.colaborador_nome,condominio:x.condominio_nome,re:x.re,horas:x.carga_horaria,data:x.data_treinamento,obs:x.observacoes};
  }
  async function req(table,method,body){const r=await fetch(SUPABASE_URL+'/rest/v1/'+table,{method,headers,...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw new Error(await r.text());return r.status===204?[]:r.json()}
  async function syncKey(k){
    const table=TABLES[k],local=read(k);if(!table)return;
    const cloud=await req(table,'GET');const fingerprints=new Set(cloud.map(fp));
    for(const x of local){if(fingerprints.has(fp(x)))continue;const p=toCloud(k,x);if(!p)continue;delete p.id;try{await req(table,'POST',p)}catch(e){console.warn('KHALID CLOUD upload',table,e)}}
    const fresh=await req(table,'GET');const merged=new Map(local.map(x=>[fp(x),x]));for(const x of fresh)merged.set(fp(x),fromCloud(k,x));write(k,Array.from(merged.values()));
  }
  async function syncAll(){if(syncing)return;syncing=true;try{for(const k of Object.keys(TABLES))await syncKey(k);originalSet.call(localStorage,'khalidCloudLastSync',new Date().toISOString());window.dispatchEvent(new CustomEvent('khalid-cloud-synced'))}catch(e){console.warn('KHALID CLOUD indisponível:',e)}finally{syncing=false}}
  Storage.prototype.setItem=function(k,v){originalSet.call(this,k,v);if(!syncing&&TABLES[k])Promise.resolve().then(()=>syncKey(k)).catch(e=>console.warn('KHALID CLOUD',e))};
  window.KhalidCloud={syncAll,syncKey,url:SUPABASE_URL};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncAll);else syncAll();
  setInterval(syncAll,60000);
})();
