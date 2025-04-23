const handledUrls = new Set();

async function fetchAndBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (
      details.url.includes("/rtig/image") &&
      !handledUrls.has(details.url)
    ) {
      handledUrls.add(details.url);

      fetchAndBase64(details.url)
        .then(base64 => {
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: "rtig-image",
                url: details.url,
                base64: base64
              }, { frameId: details.frameId });
              return true;
            }
          });
        })
        .catch(err => {
          console.error("[ProCap] Error base64ing:", err);
        });
    }
  },
  { urls: ["<all_urls>"], types: ["image", "xmlhttprequest", "other"] },
  []
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "get-api-key") {
      chrome.storage.local.get("apikey", (result) => {
        sendResponse({ apikey: result.apikey });
      });
      return true;
    }
    if (request.type === "gfct-response") {
        gfctResponse = request.data;
    }
    if (request.type === "get-gfct-response") {
        sendResponse({ gfctResponse });
    }
});

  