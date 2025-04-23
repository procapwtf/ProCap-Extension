(function () {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [resource] = args;
    const url = typeof resource === 'string' ? resource : resource.url;

    const response = await originalFetch.apply(this, args);

    if (url.includes('/fc/gfct/')) {
      try {
        const clone = await response.clone().text();
        window.postMessage({ type: 'gfct-response', body: clone }, '*');
      } catch (err) {
        console.error('[Inject Fetch] Error:', err);
      }
    }

    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._interceptUrl = url;
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (this._interceptUrl?.includes('/fc/gfct/')) {
      this.addEventListener('load', function () {
        try {
          window.postMessage({ type: 'gfct-response', body: this.responseText }, '*');
        } catch (e) {
          console.error('[Inject XHR] Error:', e);
        }
      });
    }
    return originalSend.apply(this, args);
  };
})();
