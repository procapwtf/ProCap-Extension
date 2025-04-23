const script = document.createElement("script");
script.src = chrome.runtime.getURL("funcaptchaRequestInterceptor.js");
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);
let gfctResponse = null;

window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.type === "gfct-response" && !gfctResponse) {
        gfctResponse = JSON.parse(event.data.body);
        chrome.runtime.sendMessage({ type: "gfct-response", data: gfctResponse });
    }
});
const urls = new Set();
document.addEventListener("DOMContentLoaded", () => {
const observer = new MutationObserver(async() => {
    const btn = document.querySelector('button[data-theme="home.verifyButton"]');
    if (btn) {
    btn.click();
    observer.disconnect();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
});

chrome.runtime.onMessage.addListener(async(msg, sender, sendResponse) => {
    if (msg.type === "rtig-image") {
        chrome.storage.local.get(["solveFuncaptcha"], (result) => {
            if (!result.solveFuncaptcha) {
                return;
            }
            chrome.runtime.sendMessage({ type: "get-gfct-response" }, (response) => {
                gfctResponse = response.gfctResponse;
            
                const cleanedUrl = decodeURI(msg.url);

                if (urls.has(cleanedUrl)) {
                    return;
                }

                urls.add(cleanedUrl);

                const rightArrow = document.querySelector("a.right-arrow");
                chrome.runtime.sendMessage({ type: "get-api-key" }, (response) => {
                    const apiKey = response.apikey;
                    if (!apiKey) return alert("❌ No API key found.");
                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", "https://api.procap.wtf/solve", true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    const body = JSON.stringify({
                        key: apiKey,
                        images: [msg.base64.split(";base64,")[1]],
                        captchaType: "funcaptchaClassification",
                        variant: gfctResponse.game_data.instruction_string
                    });

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                try {
                                const data = JSON.parse(xhr.responseText);
                                const solution = data.solution[0];
                                for (let i = 0; i < solution; i++) {
                                    rightArrow?.click();
                                }

                                document.querySelector("button.sc-nkuzb1-0.yuVdl.button")?.click();

                                } catch (e) {
                                    console.error("❌ JSON parse error:", e);
                                }
                            }
                        }
                    };

                    xhr.send(body);
                    });
            });
        });
    }
});