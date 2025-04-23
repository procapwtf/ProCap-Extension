document.addEventListener("DOMContentLoaded", () => {
  const apiKey = localStorage.getItem("apikey");
  chrome.storage.local.set({ apikey: apiKey }, ()=>{});
  console.log(apiKey)
  const loginSection = document.getElementById("login-section");
  const mainSection = document.getElementById("main-section");

  if (!apiKey) {
    loginSection.classList.remove("hidden");
  } else {
    mainSection.classList.remove("hidden");
    loadAccountInfo(apiKey);
  }

  document.getElementById("save-apikey").addEventListener("click", () => {
    const key = document.getElementById("apikey-input").value.trim();
    if (key) {
      localStorage.setItem("apikey", key);
      chrome.storage.local.set({ apikey: apiKey }, ()=>{});
      location.reload();
    }
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
      document.getElementById(`${tab.dataset.tab}-tab`).classList.remove("hidden");
    });
  });

  document.getElementById("go-dashboard").addEventListener("click", () => {
    window.open("http://dash.procap.wtf/", "_blank");
  });
  document.getElementById("open-dashboard").addEventListener("click", () => {
    window.open("http://dash.procap.wtf/", "_blank");
  });

  document.getElementById("topup-button").addEventListener("click", async () => {
    const amount = parseFloat(document.getElementById("topup-amount").value);
    if (!amount || amount <= 0) return alert("Enter a valid amount.");

    const key = localStorage.getItem("apikey");
    const payload = {
      key: key,
      quantity: amount,
      product: "balance"
    };

    try {
      const res = await fetch("http://api.procap.wtf/orders/createInvoice", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        window.open(data.invoice, "_blank");
      } else {
        alert("Failed to create invoice.");
      }
    } catch (e) {
      alert("Error creating invoice.");
    }
  });
  const toggleCheckbox = document.getElementById("toggle-funcaptcha");
  chrome.storage.local.get(["solveFuncaptcha"], (result) => {
    toggleCheckbox.checked = result.solveFuncaptcha || false;
  });

  toggleCheckbox.addEventListener("change", () => {
    chrome.storage.local.set({ solveFuncaptcha: toggleCheckbox.checked });
  });

});

async function loadAccountInfo(apiKey) {
  const infoEl = document.getElementById("account-info");
  try {
    const res = await fetch("https://api.procap.wtf/users/getUser", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({
          key: apiKey,
          showTasks: true,
          limit: false
      })
    });
    const data = await res.json();
    infoEl.innerHTML = `
      <p><strong>Balance:</strong> $${data.balance.toFixed(2)}</p>
      <p><strong>Solved:</strong> ${data.solved}</p>
      <p><strong>Threads:</strong> ${data.usedThreads}/${data.threads}</p>
      <p><strong>Suspended:</strong> ${data.suspended ? "Yes" : "No"}</p>
    `;
  } catch (err) {
    infoEl.innerHTML = "Failed to load account info.";
  }
}
