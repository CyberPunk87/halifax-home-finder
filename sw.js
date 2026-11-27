/* Lets the kids' check-in page open with no internet, using the copy saved on the phone. */
const CACHE='hx-kid-v1';
const PAGE=new URL('checkin.html',self.registration.scope).href;
const ICONS=['icons/checkin-180.png','icons/checkin-192.png'].map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll([PAGE,...ICONS])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  const isPage=url.pathname.endsWith('/checkin.html');
  const isIcon=/\/icons\/checkin-\d+\.png$/.test(url.pathname);
  if(!isPage&&!isIcon)return;
  const key=isPage?PAGE:req;
  e.respondWith((async()=>{
    try{
      /* online: use the fresh page (and refresh the saved copy). Slow or offline: use the saved copy. */
      const res=await Promise.race([fetch(req),new Promise((_,rej)=>setTimeout(()=>rej(new Error('slow')),5000))]);
      if(res&&res.ok){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(key,copy)))}
      return res;
    }catch(err){
      const hit=await caches.match(key);
      return hit||Response.error();
    }
  })());
});
