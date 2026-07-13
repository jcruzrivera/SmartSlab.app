export const dynamic = "force-dynamic";

// Self-contained storefront widget. Vendors drop a
// <div data-smartslab-store="slug"></div> + this script on their own site; it
// renders their live inventory inside a Shadow DOM (scoped styles, immune to
// the host page's CSS). Kept dependency-free and ES5-ish for broad support.
// NOTE: this string must not contain backticks or ${...} (it lives inside a TS
// template literal) and avoids backslash escapes (TS would process them first).
const WIDGET_JS = `(function () {
  "use strict";

  var ORIGIN = (function () {
    try {
      if (document.currentScript && document.currentScript.src) {
        return new URL(document.currentScript.src).origin;
      }
    } catch (e) {}
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf("embed.js") !== -1) {
        try { return new URL(scripts[i].src).origin; } catch (e2) {}
      }
    }
    return "https://smartslab.store";
  })();

  var STYLE =
    ":host{all:initial}" +
    "*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}" +
    ".ss-wrap{width:100%}" +
    ".ss-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}" +
    ".ss-card{display:flex;flex-direction:column;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;text-decoration:none;color:#0f172a;background:#fff;transition:box-shadow .15s,transform .15s}" +
    ".ss-card:hover{box-shadow:0 6px 20px rgba(15,23,42,.12);transform:translateY(-2px)}" +
    ".ss-img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#f1f5f9;display:block}" +
    ".ss-img--empty{display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px}" +
    ".ss-body{padding:10px 12px;display:flex;flex-direction:column;gap:4px}" +
    ".ss-name{font-size:14px;font-weight:600;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}" +
    ".ss-meta{font-size:12px;color:#64748b}" +
    ".ss-price{font-size:15px;font-weight:700;margin-top:2px}" +
    ".ss-empty{padding:32px;text-align:center;color:#64748b;font-size:14px;border:1px dashed #cbd5e1;border-radius:12px}" +
    ".ss-brand{display:inline-block;margin-top:14px;font-size:11px;color:#94a3b8;text-decoration:none}" +
    ".ss-brand:hover{color:#64748b}";

  function money(n) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency", currency: "USD", maximumFractionDigits: 0
      }).format(n);
    } catch (e) { return "$" + n; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function dims(slab) {
    var parts = [];
    if (slab.width_in && slab.height_in) {
      parts.push(slab.width_in + '" x ' + slab.height_in + '"');
    }
    if (slab.thickness_cm) { parts.push(slab.thickness_cm + " cm"); }
    return parts.join(" \\u00b7 ");
  }

  function shadowFor(host) {
    return host.shadowRoot || (host.attachShadow ? host.attachShadow({ mode: "open" }) : host);
  }

  function cardHtml(s) {
    var img = s.image_url
      ? '<img class="ss-img" src="' + esc(s.image_url) + '" alt="' + esc(s.name) + '" loading="lazy">'
      : '<div class="ss-img ss-img--empty">No photo</div>';
    var metaParts = [];
    if (s.material) { metaParts.push(esc(s.material)); }
    var d = dims(s);
    if (d) { metaParts.push(d); }
    return '<a class="ss-card" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
      img +
      '<div class="ss-body">' +
        '<div class="ss-name">' + esc(s.name) + '</div>' +
        '<div class="ss-meta">' + metaParts.join(" \\u00b7 ") + '</div>' +
        '<div class="ss-price">' + money(s.price_usd) + '</div>' +
      '</div>' +
    '</a>';
  }

  function render(host, data) {
    var root = shadowFor(host);
    var slabs = (data && data.slabs) || [];
    var cols = parseInt(host.getAttribute("data-columns") || "", 10);
    var gridStyle = cols > 0
      ? ' style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))"'
      : "";
    var cards = slabs.map(cardHtml).join("");
    var empty = '<div class="ss-empty">No slabs available right now.</div>';
    var brandUrl = (data && data.store_url) || ORIGIN;
    root.innerHTML =
      "<style>" + STYLE + "</style>" +
      '<div class="ss-wrap">' +
        '<div class="ss-grid"' + gridStyle + '>' + (cards || empty) + '</div>' +
        '<a class="ss-brand" href="' + esc(brandUrl) + '" target="_blank" rel="noopener">Powered by SmartSlab</a>' +
      "</div>";
  }

  function renderError(host) {
    var root = shadowFor(host);
    root.innerHTML =
      "<style>" + STYLE + "</style>" +
      '<div class="ss-wrap"><div class="ss-empty">Could not load inventory.</div></div>';
  }

  function init(host) {
    if (host.getAttribute("data-ss-init") === "1") { return; }
    host.setAttribute("data-ss-init", "1");
    var slug = host.getAttribute("data-smartslab-store");
    if (!slug) { return; }
    var q = "?key=" + encodeURIComponent(slug);
    var limit = host.getAttribute("data-limit");
    if (limit) { q += "&limit=" + encodeURIComponent(limit); }
    var material = host.getAttribute("data-material");
    if (material) { q += "&material=" + encodeURIComponent(material); }
    fetch(ORIGIN + "/api/v1/embed/slabs" + q)
      .then(function (r) { if (!r.ok) { throw new Error("http " + r.status); } return r.json(); })
      .then(function (data) { render(host, data); })
      .catch(function () { renderError(host); });
  }

  function boot() {
    var nodes = document.querySelectorAll("[data-smartslab-store]");
    for (var i = 0; i < nodes.length; i++) { init(nodes[i]); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
`;

export async function GET(): Promise<Response> {
  return new Response(WIDGET_JS, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
