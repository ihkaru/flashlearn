import type { SlideNoteItem } from '../types/interactive';

export interface HtmlArtifactAuditResult {
  safe: boolean;
  errors: string[];
  warnings: string[];
  byteSize: number;
  slideCount: number;
  lang: string;
  extractedNotes: SlideNoteItem[];
}

const ALLOWED_EXTERNAL_SCRIPT_HOSTS = new Set([
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
]);

const MAX_ARTIFACT_BYTES = 2 * 1024 * 1024; // 2 MB cap (images should live in MediaVault)
const MAX_BASE64_IMAGE_BYTES = 250 * 1024; // Warn if >250KB inline base64 images

/**
 * Deterministically audits an HTML deck or micro-sim artifact before storage.
 * Rejects unauthorized remote scripts and extracts slide metadata without executing JS.
 */
export function auditHtmlArtifactSafety(rawHtml: string): HtmlArtifactAuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const byteSize = new TextEncoder().encode(rawHtml).byteLength;

  if (!rawHtml || rawHtml.trim().length < 20) {
    errors.push('HTML artifact is empty or truncated.');
  }

  if (byteSize > MAX_ARTIFACT_BYTES) {
    errors.push(`HTML artifact exceeds 2MB limit (${byteSize} bytes). Move media assets to MediaVault.`);
  }

  // Check remote script origins
  const scriptSrcRegex = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptSrcRegex.exec(rawHtml)) !== null) {
    const src = match[1].trim();
    if (/^https?:\/\//i.test(src)) {
      try {
        const host = new URL(src).hostname.toLowerCase();
        if (!ALLOWED_EXTERNAL_SCRIPT_HOSTS.has(host)) {
          errors.push(`Disallowed external script host "${host}". Use self-contained assets or approved CDN.`);
        }
      } catch {
        errors.push(`Malformed script src URL: "${src}".`);
      }
    }
  }

  // Detect base64 image bloat
  const base64Matches = rawHtml.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g) || [];
  const totalBase64Bytes = base64Matches.reduce((acc, s) => acc + s.length, 0);
  if (totalBase64Bytes > MAX_BASE64_IMAGE_BYTES) {
    warnings.push(
      `Detected ${Math.round(totalBase64Bytes / 1024)}KB of inline base64 images. Upload images to MediaVault instead.`
    );
  }

  const langMatch = rawHtml.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i);
  const lang = langMatch ? langMatch[1] : 'id';

  const slideTags = rawHtml.match(/<section\b[^>]*class\s*=\s*["'][^"']*\bslide\b[^"']*["'][^>]*>/gi) || [];
  const slideCount = slideTags.length;

  const extractedNotes = extractSlideMetadataFromHtml(rawHtml, slideTags);

  return {
    safe: errors.length === 0,
    errors,
    warnings,
    byteSize,
    slideCount,
    lang,
    extractedNotes,
  };
}

function extractSlideMetadataFromHtml(rawHtml: string, slideTags: string[]): SlideNoteItem[] {
  // Prefer explicit JSON block if authored: <script type="application/json" id="flashlearn-slide-notes">
  const jsonTagMatch = rawHtml.match(
    /<script[^>]*id=["']flashlearn-slide-notes["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (jsonTagMatch) {
    try {
      const parsed = JSON.parse(jsonTagMatch[1].trim());
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, idx: number) => ({
          id: String(item.id || `slide-${idx + 1}`),
          index: typeof item.index === 'number' ? item.index : idx,
          title: String(item.title || `Slide ${idx + 1}`),
          section: item.section ? String(item.section) : undefined,
          purpose: item.purpose ? String(item.purpose) : undefined,
          talk: Array.isArray(item.talk) ? item.talk.map(String) : [],
          transition: item.transition ? String(item.transition) : undefined,
          linkedStepId: item.linkedStepId ? String(item.linkedStepId) : undefined,
        }));
      }
    } catch {
      // Fall through to lightweight regex metadata extraction
    }
  }

  // Fallback: extract slide IDs cleanly from section tags without executing JS
  return slideTags.map((tag, idx) => {
    const idMatch = tag.match(/data-slide-id\s*=\s*["']([^"']+)["']/i);
    return {
      id: idMatch ? idMatch[1] : `slide-${idx + 1}`,
      index: idx,
      title: idMatch ? idMatch[1].replace(/[-_]+/g, ' ') : `Slide ${idx + 1}`,
      talk: [],
    };
  });
}

export interface SandboxedDeckBridgeOptions {
  initialSlide?: number;
  forceLowPower?: boolean;
  hideInternalChrome?: boolean;
}

/**
 * Wraps any static HTML presentation or micro-sim with FlashLearn's MIT-authored
 * generic sandbox bridge so it runs safely inside <iframe sandbox="allow-scripts">
 * (opaque origin, NO allow-same-origin):
 * 1. Polyfills window.localStorage in-memory when opaque sandbox throws SecurityError.
 * 2. Enables low-power mode automatically on mobile to prevent WebGL battery drain.
 * 3. Synchronizes slide index via postMessage (flashlearn:deck:goto / flashlearn:deck:state).
 */
export function buildSandboxedDeckHtml(
  rawHtml: string,
  options: SandboxedDeckBridgeOptions = {}
): string {
  const initialSlide = Math.max(0, Math.floor(options.initialSlide ?? 0));
  const forceLowPower = options.forceLowPower === true;
  const hideChrome = options.hideInternalChrome === true;

  const bridgeHeadScript = `<script data-flashlearn-bridge="1">
(function(){
  try { window.localStorage.getItem('__fl_probe'); } catch (e) {
    var mem = Object.create(null);
    var safeStorage = {
      getItem: function(k){ return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function(k, v){ mem[String(k)] = String(v); },
      removeItem: function(k){ delete mem[String(k)]; },
      clear: function(){ mem = Object.create(null); },
      key: function(i){ return Object.keys(mem)[i] || null; },
      get length(){ return Object.keys(mem).length; }
    };
    try { Object.defineProperty(window, 'localStorage', { value: safeStorage, configurable: true }); } catch (defErr) { console.debug('[fl-bridge] localStorage redefine skipped', defErr); }
    try { Object.defineProperty(window, 'sessionStorage', { value: safeStorage, configurable: true }); } catch (defErr) { console.debug('[fl-bridge] sessionStorage redefine skipped', defErr); }
  }
  if (${forceLowPower ? 'true' : 'false'}) {
    try { window.localStorage.setItem('guizang-ppt-low-power', '1'); } catch (lpErr) { console.debug('[fl-bridge] low-power flag skipped', lpErr); }
  }
})();
</script>${
    hideChrome
      ? '<style data-flashlearn-bridge-css="1">#hint,.ppt-hint,#nav-dots{opacity:0.45!important}</style>'
      : ''
  }`;

  const bridgeFootScript = `<script data-flashlearn-bridge-runtime="1">
(function(){
  function getSlides(){ return Array.prototype.slice.call(document.querySelectorAll('section.slide')); }
  function detectIndex(slides){
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].classList.contains('active') || slides[i].classList.contains('is-active')) return i;
    }
    var deck = document.getElementById('deck');
    if (deck && deck.style && deck.style.transform) {
      var m = deck.style.transform.match(/-?(\\d+(?:\\.\\d+)?)vw/);
      if (m) return Math.round(parseFloat(m[1]) / 100);
    }
    return 0;
  }
  var lastIdx = -1;
  function emitState(){
    var slides = getSlides();
    var idx = detectIndex(slides);
    if (idx === lastIdx && slides.length > 0) return;
    lastIdx = idx;
    var active = slides[idx];
    var notes = Array.isArray(window.__SPEAKER_NOTES__) ? window.__SPEAKER_NOTES__ : null;
    window.parent.postMessage({
      __flashlearnDeck: 1,
      type: 'state',
      index: idx,
      total: slides.length,
      slideId: active ? (active.getAttribute('data-slide-id') || ('slide-' + (idx + 1))) : null,
      notes: notes
    }, '*');
  }
  function navigateTo(targetIndex){
    var slides = getSlides();
    if (!slides.length) return;
    var clamped = Math.max(0, Math.min(slides.length - 1, Number(targetIndex) || 0));
    if (typeof window.go === 'function') {
      try { window.go(clamped, { force: true }); } catch (navErr) { console.debug('[fl-bridge] deck go() error', navErr); }
    } else {
      var cur = detectIndex(slides);
      var diff = clamped - cur;
      var key = diff > 0 ? 'ArrowRight' : 'ArrowLeft';
      for (var step = 0; step < Math.abs(diff); step++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
      }
    }
    setTimeout(emitState, 40);
  }
  window.addEventListener('message', function(e){
    if (e.source !== window.parent || !e.data || e.data.__flashlearnDeck !== 1) return;
    if (e.data.type === 'goto') navigateTo(e.data.index);
    if (e.data.type === 'low-power' && typeof window.__setLowPowerMode === 'function') {
      try { window.__setLowPowerMode(Boolean(e.data.enabled), { persist: false }); } catch (lpErr) { console.debug('[fl-bridge] low-power toggle skipped', lpErr); }
    }
    if (e.data.type === 'ping') { lastIdx = -1; emitState(); }
  });
  window.addEventListener('load', function(){
    if (${forceLowPower ? 'true' : 'false'} && typeof window.__setLowPowerMode === 'function') {
      try { window.__setLowPowerMode(true, { persist: false }); } catch (lpErr) { console.debug('[fl-bridge] init low-power skipped', lpErr); }
    }
    if (${initialSlide} > 0) navigateTo(${initialSlide});
    setTimeout(emitState, 60);
    var deckEl = document.getElementById('deck') || document.body;
    if (typeof MutationObserver !== 'undefined' && deckEl) {
      new MutationObserver(function(){ emitState(); }).observe(deckEl, {
        attributes: true, subtree: true, attributeFilter: ['class', 'style']
      });
    }
  });
})();
</script>`;

  let output = rawHtml;
  if (/<head\b[^>]*>/i.test(output)) {
    output = output.replace(/<head\b[^>]*>/i, (m) => `${m}\n${bridgeHeadScript}`);
  } else {
    output = `${bridgeHeadScript}\n${output}`;
  }

  if (/<\/body>/i.test(output)) {
    output = output.replace(/<\/body>/i, `${bridgeFootScript}\n</body>`);
  } else {
    output = `${output}\n${bridgeFootScript}`;
  }

  return output;
}
