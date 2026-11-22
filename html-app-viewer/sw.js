// Offline shell shared by the permanent Creator and installed HTML apps.
// The Creator always requests fresh code while online and falls back offline.
const CACHE_NAME='html-home-app-viewer-shell-v3';
const SHELL_URL=new URL('./index.html',self.location.href).href;
const CREATOR_URL=new URL('./creator.html',self.location.href).href;
const SHELL_PATH=new URL(SHELL_URL).pathname;
const CREATOR_PATH=new URL(CREATOR_URL).pathname;
const ROOT_PATH=new URL('./',self.location.href).pathname;

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll([
      new Request(SHELL_URL,{cache:'reload'}),
      new Request(CREATOR_URL,{cache:'reload'})
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys
      .filter(key=>key.startsWith('html-home-app-viewer-shell-')&&key!==CACHE_NAME)
      .map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  const isShell=url.pathname===SHELL_PATH||url.pathname===ROOT_PATH;
  const isCreator=url.pathname===CREATOR_PATH;
  // The creator.html bootstrap fetches index.html through fetch(), not a
  // navigation, so allow the same network-first offline fallback for it.
  if(!isShell&&!isCreator)return;
  if(request.mode!=='navigate' && url.pathname!==SHELL_PATH)return;
  const fallback=isCreator?CREATOR_URL:SHELL_URL;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE_NAME)
          .then(cache=>cache.put(fallback,copy)).catch(()=>{}));
      }
      return response;
    }catch(error){
      const cache=await caches.open(CACHE_NAME);
      return (await cache.match(fallback))||Response.error();
    }
  })());
});
