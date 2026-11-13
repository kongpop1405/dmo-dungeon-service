// Tells build/lib/render.mjs when the page is finished, instead of the exporter
// guessing with a fixed wait: body[data-ready="1"] when every image decoded,
// body[data-error] when data or any image failed (exporter exits 1, no blank png).
(function () {
  function fail(e) {
    const msg = e && e.message ? e.message : String(e);
    document.body.dataset.error = msg;
    console.error(msg);
  }

  function imageUrls(root) {
    const urls = new Set();
    root.querySelectorAll('img[src]').forEach(img => urls.add(img.src));
    root.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      for (const m of bg.matchAll(/url\((['"]?)(.*?)\1\)/g)) {
        if (!m[2].startsWith('data:')) urls.add(m[2]);
      }
    });
    return [...urls];
  }

  function decode(url) {
    return new Promise((ok, bad) => {
      const img = new Image();
      img.onload = ok;
      img.onerror = () => bad(new Error('image not found: ' + url));
      img.src = url;
    });
  }

  // Call after the page has rendered its data.
  window.renderReady = function () {
    return Promise.all(imageUrls(document.body).map(decode))
      .then(() => { document.body.dataset.ready = '1'; })
      .catch(fail);
  };
  window.renderFail = fail;

  window.loadJson = function (url) {
    return fetch(url).then(r => {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return r.json();
    });
  };
})();
