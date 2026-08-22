/* KHALID AUTH — autenticação segura via Supabase Auth */
(function(){
  const URL='https://kwuxixucspzqfhzxkimc.supabase.co';
  const KEY='sb_publishable_vsenwbLiBHSyiZrqDvhtyQ_fgiABbrh';
  const SESSION='khalidAuthSession';
  const isLogin=/\/login\.html$/i.test(location.pathname)||location.pathname.endsWith('/');
  async function api(path,options={}){
    const r=await fetch(URL+path,{...options,headers:{apikey:KEY,'Content-Type':'application/json',...(options.headers||{})}});
    const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch(e){data=text}
    if(!r.ok)throw new Error(data?.msg||data?.message||data?.error_description||'Falha na autenticação');
    return data;
  }
  function get(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch(e){return null}}
  function save(s){localStorage.setItem(SESSION,JSON.stringify(s))}
  async function refresh(s){if(!s?.refresh_token)return null;try{const x=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});save(x);return x}catch(e){localStorage.removeItem(SESSION);return null}}
  async function check(){
    if(isLogin)return true;
    let s=get();
    if(!s?.access_token){location.replace('login.html');return false}
    try{await api('/auth/v1/user',{headers:{Authorization:'Bearer '+s.access_token}});return true}
    catch(e){s=await refresh(s);if(s?.access_token)return true;location.replace('login.html');return false}
  }
  window.KhalidAuth={login:async(email,password)=>{const x=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});save(x);return x},signup:async(email,password)=>api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})}),logout:()=>{localStorage.removeItem(SESSION);location.replace('login.html')},check,session:get};
  window.KhalidAuthReady=check();
})();