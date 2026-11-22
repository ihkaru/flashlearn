export interface SimpleSlideDef {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  bullets: string[];
  theme: 'dark' | 'light' | 'accent';
}

/**
 * Generates a clean, self-contained MIT-authored 16:9 HTML slide deck
 * compatible with FlashLearn's generic sandboxed deck bridge.
 */
export function buildCleanVisualDeckHtml(deckTitle: string, slides: SimpleSlideDef[]): string {
  const sections = slides
    .map((s, idx) => {
      const items = s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('');
      return `<section class="slide ${s.theme}${idx === 0 ? ' active' : ''}" data-slide-id="${escapeHtml(s.id)}">
  <div class="inner">
    <div class="kicker">${escapeHtml(s.kicker)}</div>
    <h1>${escapeHtml(s.title)}</h1>
    <p class="lead">${escapeHtml(s.lead)}</p>
    ${items ? `<ul class="pts">${items}</ul>` : ''}
  </div>
</section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(deckTitle)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;font-family:Inter,system-ui,-apple-system,sans-serif;background:#0f172a;color:#0f172a}
#deck{display:flex;width:${slides.length * 100}vw;height:100vh;transition:transform .28s ease}
.slide{width:100vw;height:100vh;flex:0 0 100vw;display:flex;align-items:center;padding:7vh 8vw}
.slide.light{background:#f8fafc;color:#0f172a}
.slide.dark{background:#0f172a;color:#f8fafc}
.slide.accent{background:#0f766e;color:#ffffff}
.inner{max-width:84vw;display:flex;flex-direction:column;gap:2.4vh}
.kicker{font-size:clamp(12px,1.5vw,16px);font-weight:700;text-transform:uppercase;letter-spacing:.12em;opacity:.78}
h1{font-size:clamp(22px,4.4vw,56px);font-weight:800;line-height:1.12;letter-spacing:-.02em}
.lead{font-size:clamp(14px,2vw,24px);line-height:1.45;opacity:.9;max-width:68ch}
.pts{list-style:none;display:grid;gap:1.4vh;margin-top:1vh}
.pts li{font-size:clamp(13px,1.7vw,20px);line-height:1.4;padding-left:1.2em;position:relative;opacity:.92}
.pts li::before{content:"";position:absolute;left:0;top:.52em;width:.45em;height:.45em;background:currentColor;opacity:.7}
</style>
</head>
<body>
<div id="deck">${sections}</div>
<script>
(function(){
  var deck=document.getElementById('deck');
  var slides=Array.prototype.slice.call(document.querySelectorAll('section.slide'));
  var cur=0;
  function go(n){
    cur=Math.max(0,Math.min(slides.length-1,Number(n)||0));
    deck.style.transform='translate3d(-'+(cur*100)+'vw,0,0)';
    slides.forEach(function(el,i){el.classList.toggle('active',i===cur);});
  }
  window.go=go;
  window.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'||e.key==='PageDown')go(cur+1);
    if(e.key==='ArrowLeft'||e.key==='PageUp')go(cur-1);
  });
})();
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
