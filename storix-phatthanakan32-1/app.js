const unitIds = [
  "LN1", "LN2", "LN3",
  "LN4", "LN5", "LN6",
  "LN7", "LN8", "LN9",
  "LN10", "LN11", "LN12",
  "LN14", "LN15", "LN16",
  "LN17", "LN18", "LN19",
  "LN20", "LN21", "LN22",
  "LN23", "LN24"
];

const defaultUnits = unitIds.map((id) => {
  const number = Number(id.replace("LN", ""));
  let price = 42000;
  let type = "Standard Unit";

  if (number <= 6) {
    price = 48000;
    type = "Front Premium Unit";
  } else if (number <= 16) {
    price = 42000;
    type = "Mid Row Unit";
  }

  return {
    id,
    side: "left",
    type,
    size: "6 x 14 ม.",
    area: "106 ตร.ม.",
    price,
    status: ["LN1", "LN3", "LN5", "LN6", "LN7", "LN12", "LN14", "LN16", "LN18", "LN19", "LN23", "LN24"].includes(id) ? "reserved" : "available",
    note: "โกดังพร้อมสำนักงานและห้องน้ำในตัว"
  };
});

const statusLabels = {
  available: "ว่าง",
  reserved: "มีผู้เช่าแล้ว",
  rented: "ให้เช่าแล้ว"
};

const storageKey = "storix-phatthanakan32-1-units-v15";
const adminPassword = "2468";
const lineUrl = "https://lin.ee/n7IwEYp";
const unitGapBefore = new Set(["LN4", "LN7", "LN10", "LN14", "LN17", "LN20", "LN23"]);
let units = loadUnits();
let selectedId = "LN1";
let activeFilter = "all";

const money = new Intl.NumberFormat("th-TH");

function loadUnits() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return structuredClone(defaultUnits);

  try {
    const parsed = JSON.parse(stored);
    return defaultUnits.map((unit) => {
      const saved = parsed.find((item) => item.id === unit.id);
      return saved ? { ...unit, price: saved.price, status: saved.status } : unit;
    });
  } catch {
    return structuredClone(defaultUnits);
  }
}

function saveUnits() {
  localStorage.setItem(storageKey, JSON.stringify(units));
}

function render() {
  renderMap();
  renderStats();
  renderSelected();
  renderAdmin();
}

function renderMap() {
  const columns = {
    left: document.querySelector('[data-column="left"]'),
    right: document.querySelector('[data-column="right"]')
  };

  columns.left.innerHTML = "";
  columns.right.innerHTML = "";

  units.forEach((unit) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `unit ${unit.status}${unitGapBefore.has(unit.id) ? " gap-before" : ""}${unit.id === selectedId ? " selected" : ""}${isFiltered(unit) ? "" : " filtered-out"}`;
    button.dataset.unit = unit.id;
    button.innerHTML = `
      <span class="badge">${unit.id}</span>
      <span>
        <strong>${money.format(unit.price)} บาท/เดือน</strong>
        <small>${unit.size} · ${statusLabels[unit.status]}</small>
      </span>
    `;
    button.addEventListener("click", () => {
      selectedId = unit.id;
      render();
    });
    columns[unit.side].appendChild(button);
  });
}

function renderStats() {
  const counts = units.reduce(
    (acc, unit) => {
      acc[unit.status] += 1;
      return acc;
    },
    { available: 0, reserved: 0, rented: 0 }
  );

  document.querySelector('[data-stat="total"]').textContent = units.length;
  document.querySelector('[data-stat="available"]').textContent = counts.available;
  document.querySelector('[data-stat="reserved"]').textContent = counts.reserved + counts.rented;
}

function renderSelected() {
  const card = document.querySelector("[data-selected-card]");
  const unit = units.find((item) => item.id === selectedId) || units[0];
  const lineMessage = `สนใจสอบถามรายละเอียด Storix Warehouse พัฒนาการ 32/1 ยูนิต ${unit.id} ราคา ${money.format(unit.price)} บาท/เดือน ขนาด ${unit.size} พื้นที่ ${unit.area}`;
  card.innerHTML = `
    <p class="eyebrow">Selected Unit</p>
    <h3>${unit.id} · ${unit.type}</h3>
    <p><span class="status-pill ${unit.status}">${statusLabels[unit.status]}</span></p>
    <p><strong>${money.format(unit.price)} บาท/เดือน</strong></p>
    <p>${unit.size} · ${unit.area}</p>
    <p>${unit.note}</p>
    <a class="button primary" href="${lineUrl}" target="_blank" rel="noreferrer" data-line-message="${lineMessage}">สนใจ ${unit.id} ทาง LINE</a>
  `;
}

function renderAdmin() {
  const list = document.querySelector("[data-admin-list]");
  list.innerHTML = "";

  units.forEach((unit) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <strong>${unit.id}</strong>
      <input type="number" min="0" step="1000" value="${unit.price}" aria-label="ราคา ${unit.id}" data-admin-price="${unit.id}">
      <select aria-label="สถานะ ${unit.id}" data-admin-status="${unit.id}">
        <option value="available"${unit.status === "available" ? " selected" : ""}>ว่าง</option>
        <option value="reserved"${unit.status === "reserved" ? " selected" : ""}>มีผู้เช่าแล้ว</option>
        <option value="rented"${unit.status === "rented" ? " selected" : ""}>ให้เช่าแล้ว</option>
      </select>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("[data-admin-price]").forEach((input) => {
    input.addEventListener("change", (event) => {
      updateUnit(event.target.dataset.adminPrice, { price: Number(event.target.value) || 0 });
    });
  });

  list.querySelectorAll("[data-admin-status]").forEach((select) => {
    select.addEventListener("change", (event) => {
      updateUnit(event.target.dataset.adminStatus, { status: event.target.value });
    });
  });
}

function updateUnit(id, changes) {
  units = units.map((unit) => (unit.id === id ? { ...unit, ...changes } : unit));
  saveUnits();
  render();
}

function isFiltered(unit) {
  return activeFilter === "all" || unit.status === activeFilter;
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

document.addEventListener("click", async (event) => {
  const lineButton = event.target.closest("[data-line-message]");
  if (!lineButton) return;

  event.preventDefault();
  const message = lineButton.dataset.lineMessage;
  const targetUrl = lineButton.getAttribute("href") || lineUrl;

  if (message && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Some file:// contexts block clipboard access; still open LINE normally.
    }
  }

  window.open(targetUrl, "_blank", "noopener,noreferrer");
});

document.addEventListener("click", async (event) => {
  const shareButton = event.target.closest("[data-share]");
  if (!shareButton) return;

  event.preventDefault();

  const originalText = shareButton.dataset.originalText || shareButton.textContent;
  const url = new URL(shareButton.dataset.shareUrl || window.location.href, window.location.href).href;
  const shareData = {
    title: shareButton.dataset.shareTitle || document.title,
    text: shareButton.dataset.shareText || "",
    url
  };

  shareButton.dataset.originalText = originalText;

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      shareButton.textContent = shareButton.dataset.shareDone || originalText;
    } else {
      await navigator.clipboard.writeText(url);
      shareButton.textContent = shareButton.dataset.shareCopied || originalText;
    }
  } catch (error) {
    if (error?.name === "AbortError") return;

    try {
      await navigator.clipboard.writeText(url);
      shareButton.textContent = shareButton.dataset.shareCopied || originalText;
    } catch {
      shareButton.textContent = url;
    }
  }

  window.setTimeout(() => {
    shareButton.textContent = originalText;
  }, 1800);
});

const adminDialog = document.querySelector("[data-admin-dialog]");
const loginDialog = document.querySelector("[data-login-dialog]");
const loginForm = document.querySelector("[data-login-form]");
const passwordInput = document.querySelector("[data-admin-password-input]");
const loginError = document.querySelector("[data-login-error]");

document.querySelector("[data-open-admin]").addEventListener("click", () => {
  loginError.hidden = true;
  passwordInput.value = "";

  if (typeof loginDialog.showModal === "function") {
    loginDialog.showModal();
    passwordInput.focus();
  } else {
    loginDialog.setAttribute("open", "");
  }
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (passwordInput.value !== adminPassword) {
    loginError.hidden = false;
    passwordInput.select();
    return;
  }

  loginDialog.close();
  if (typeof adminDialog.showModal === "function") {
    adminDialog.showModal();
  } else {
    adminDialog.setAttribute("open", "");
  }
});

document.querySelectorAll("[data-close-login]").forEach((button) => {
  button.addEventListener("click", () => {
    if (typeof loginDialog.close === "function") {
      loginDialog.close();
    } else {
      loginDialog.removeAttribute("open");
    }
  });
});

const lightboxDialog = document.querySelector("[data-lightbox-dialog]");
const lightboxImage = document.querySelector("[data-lightbox-image]");

document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
  button.addEventListener("click", () => {
    lightboxImage.src = button.dataset.lightboxSrc;
    lightboxImage.alt = button.dataset.lightboxAlt || "";
    if (typeof lightboxDialog.showModal === "function") {
      lightboxDialog.showModal();
    } else {
      lightboxDialog.setAttribute("open", "");
    }
  });
});

document.querySelector("[data-lightbox-close]").addEventListener("click", () => {
  if (typeof lightboxDialog.close === "function") {
    lightboxDialog.close();
  } else {
    lightboxDialog.removeAttribute("open");
  }
});

render();
