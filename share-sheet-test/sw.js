const CACHE='html-share-sheet-test-v1';
const SHELL=new URL('./index.html',self.location.href).href;
const INDEX_PATH=new URL(SHELL).pathname;
const FOLDER_PATH=new URL('./',self.location.href).pathname;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE)
    .then(cache=>cache.add(new Request(SHELL,{cache:'reload'})))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.mode!=='navigate' || url.origin!==self.location.origin ||
     (url.pathname!==INDEX_PATH && url.pathname!==FOLDER_PATH))return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(req,{cache:'no-store'});
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put(SHELL,copy)));
      }
      return response;
    }catch(err){
      return (await caches.match(SHELL)) || Response.error();
    }
  })());
});