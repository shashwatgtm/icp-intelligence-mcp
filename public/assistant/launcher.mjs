// Small entry point. Load the panel after the page, or on an explicit opening click.
let loading;
function loadPanel(){return loading??=import('./panel.mjs');}
function idle(){requestAnimationFrame(()=>requestAnimationFrame(()=>{if('requestIdleCallback' in window)window.requestIdleCallback(()=>loadPanel(),{timeout:500});else setTimeout(()=>loadPanel(),0);}));}
if(document.readyState!=='loading')idle();else document.addEventListener('DOMContentLoaded',idle,{once:true});
document.addEventListener('click',event=>{
 const link=event.target.closest?.('a[data-helix-panel],a[href="/assistant/"],a[href="/assistant"]');
 if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();
 loadPanel().then(()=>document.dispatchEvent(new Event('helix:open'))).catch(()=>location.assign(link.dataset.helixPanel!==undefined?link.href:'/lets-get-started/'));
});
