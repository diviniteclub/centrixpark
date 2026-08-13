const cards = Array.from(document.querySelectorAll("[data-project-card]"));
const searchInput = document.querySelector("[data-project-search]");
const minInput = document.querySelector("[data-price-min]");
const maxInput = document.querySelector("[data-price-max]");
const resultText = document.querySelector("[data-filter-result]");
const statusButtons = Array.from(document.querySelectorAll("[data-status-filter]"));
const sortSelect = document.querySelector("[data-project-sort]");
const locationSelect = document.querySelector("[data-location-filter]");
const minAvailableSelect = document.querySelector("[data-min-available]");
const activeFilters = document.querySelector("[data-active-filters]");
const emptyState = document.querySelector("[data-empty-projects]");
const projectGrid = document.querySelector(".project-grid");
const money = new Intl.NumberFormat("th-TH");
const lineUrl = "https://lin.ee/n7IwEYp";
let activeStatus = "all";
let activeFeatureSlide = 0;

document.body.classList.add("has-reveal");

function numberValue(input) {
  return Number(input?.value || 0);
}

function cardNumber(card, key) {
  return Number(card.dataset[key] || 0);
}

function availabilityPercent(card) {
  const total = cardNumber(card, "totalUnits");
  return total ? Math.round((cardNumber(card, "availableUnits") / total) * 100) : 0;
}

function updateSummaryStats() {
  const knownUnitCards = cards.filter((card) => cardNumber(card, "totalUnits") > 0);
  const pricedCards = cards.filter((card) => cardNumber(card, "minPrice") > 0);
  const projectCount = cards.length;
  const totalUnits = knownUnitCards.reduce((sum, card) => sum + cardNumber(card, "totalUnits"), 0);
  const availableUnits = knownUnitCards.reduce((sum, card) => sum + cardNumber(card, "availableUnits"), 0);
  const minPrice = pricedCards.reduce((lowest, card) => {
    const price = cardNumber(card, "minPrice");
    return lowest === 0 || price < lowest ? price : lowest;
  }, 0);
  const availablePercent = totalUnits ? Math.round((availableUnits / totalUnits) * 100) : 0;

  const stats = {
    projects: projectCount,
    "total-units": totalUnits,
    "available-units": availableUnits,
    "min-price": minPrice ? money.format(minPrice) : "-"
  };

  Object.entries(stats).forEach(([key, value]) => {
    const target = document.querySelector(`[data-home-stat="${key}"]`);
    if (target) target.textContent = value;
  });

  const availabilityText = document.querySelector("[data-overall-availability]");
  if (availabilityText) {
    availabilityText.textContent = totalUnits ? `${availablePercent}%` : "-";
  }
}

function getActiveFilterLabels() {
  const labels = [];
  const query = (searchInput?.value || "").trim();
  const locationOption = locationSelect?.selectedOptions?.[0];
  const minAvailableOption = minAvailableSelect?.selectedOptions?.[0];
  const min = numberValue(minInput);
  const max = numberValue(maxInput);
  const statusButton = statusButtons.find((button) => button.dataset.statusFilter === activeStatus);

  if (query) labels.push(`ค้นหา: ${query}`);
  if (locationSelect?.value && locationSelect.value !== "all") labels.push(`ทำเล: ${locationOption?.textContent || locationSelect.value}`);
  if (activeStatus !== "all") labels.push(`สถานะ: ${statusButton?.textContent || activeStatus}`);
  if (minAvailableSelect?.value && Number(minAvailableSelect.value) > 0) labels.push(`ยูนิตว่าง: ${minAvailableOption?.textContent || minAvailableSelect.value}`);
  if (min && max) labels.push(`ราคา: ${money.format(min)}-${money.format(max)} บาท`);
  else if (min) labels.push(`ราคาเริ่มจาก ${money.format(min)} บาท`);
  else if (max) labels.push(`ราคาไม่เกิน ${money.format(max)} บาท`);

  return labels;
}

function updateActiveChips() {
  if (!activeFilters) return;
  const labels = getActiveFilterLabels();
  activeFilters.innerHTML = "";

  if (!labels.length) {
    activeFilters.hidden = true;
    return;
  }

  activeFilters.hidden = false;
  labels.forEach((label) => {
    const chip = document.createElement("span");
    chip.textContent = label;
    activeFilters.appendChild(chip);
  });
}

function updatePriceShortcuts() {
  const max = maxInput?.value || "";
  document.querySelectorAll("[data-price-max-shortcut]").forEach((button) => {
    button.classList.toggle("active", button.dataset.priceMaxShortcut === max);
  });
}

function updateResults() {
  const query = (searchInput?.value || "").trim().toLowerCase();
  const min = numberValue(minInput);
  const max = numberValue(maxInput);
  const location = locationSelect?.value || "all";
  const minAvailable = Number(minAvailableSelect?.value || 0);
  let visible = 0;

  const sortedCards = [...cards].sort((a, b) => {
    const sortBy = sortSelect?.value || "latest";
    const priceA = cardNumber(a, "minPrice") || Number.POSITIVE_INFINITY;
    const priceB = cardNumber(b, "minPrice") || Number.POSITIVE_INFINITY;
    const availableA = cardNumber(a, "availableUnits");
    const availableB = cardNumber(b, "availableUnits");
    const updatedA = cardNumber(a, "updatedOrder");
    const updatedB = cardNumber(b, "updatedOrder");

    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "available-desc") return availableB - availableA;
    if (sortBy === "availability-percent") return availabilityPercent(b) - availabilityPercent(a);
    return updatedB - updatedA;
  });

  sortedCards.forEach((card) => projectGrid?.appendChild(card));

  sortedCards.forEach((card) => {
    const text = [
      card.dataset.name,
      card.dataset.brand,
      card.dataset.location,
      card.dataset.tags
    ].join(" ").toLowerCase();
    const price = cardNumber(card, "minPrice");
    const statuses = (card.dataset.status || "").split(" ");
    const availableUnits = cardNumber(card, "availableUnits");
    const statusMatch = activeStatus === "all" || statuses.includes(activeStatus);
    const locationMatch = location === "all" || card.dataset.locationKey === location;
    const queryMatch = !query || text.includes(query);
    const minMatch = !min || price >= min || price === 0;
    const maxMatch = !max || (price > 0 && price <= max) || price === 0;
    const availableMatch = !minAvailable || availableUnits >= minAvailable;
    const show = statusMatch && locationMatch && queryMatch && minMatch && maxMatch && availableMatch;

    card.hidden = !show;
    if (show) visible += 1;
  });

  if (resultText) {
    resultText.textContent = `แสดง ${visible} จาก ${cards.length} โครงการ`;
  }

  if (emptyState) {
    emptyState.hidden = visible > 0;
  }

  updateActiveChips();
  updatePriceShortcuts();
}

function clearFilters() {
  if (searchInput) searchInput.value = "";
  if (minInput) minInput.value = "";
  if (maxInput) maxInput.value = "";
  if (locationSelect) locationSelect.value = "all";
  if (minAvailableSelect) minAvailableSelect.value = "0";
  if (sortSelect) sortSelect.value = "latest";
  activeStatus = "all";
  statusButtons.forEach((item) => item.classList.toggle("active", item.dataset.statusFilter === "all"));
  updateResults();
}

statusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.statusFilter || "all";
    statusButtons.forEach((item) => item.classList.toggle("active", item === button));
    updateResults();
  });
});

[searchInput, minInput, maxInput, locationSelect, minAvailableSelect].forEach((input) => {
  input?.addEventListener("input", updateResults);
  input?.addEventListener("change", updateResults);
});

sortSelect?.addEventListener("change", updateResults);

document.querySelectorAll("[data-price-max-shortcut]").forEach((button) => {
  button.addEventListener("click", () => {
    if (maxInput) maxInput.value = button.dataset.priceMaxShortcut || "";
    updateResults();
  });
});

document.querySelector("[data-apply-filter]")?.addEventListener("click", updateResults);

document.querySelectorAll("[data-clear-filter]").forEach((button) => {
  button.addEventListener("click", clearFilters);
});

const featureSlides = Array.from(document.querySelectorAll("[data-feature-slide]"));
const featureDots = Array.from(document.querySelectorAll("[data-feature-dot]"));
const featureSlider = document.querySelector("[data-feature-slider]");
let featureTimer;

function showFeatureSlide(index) {
  if (!featureSlides.length) return;
  activeFeatureSlide = (index + featureSlides.length) % featureSlides.length;
  featureSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeFeatureSlide);
  });
  featureDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === activeFeatureSlide);
  });
}

function startFeatureSlider() {
  if (featureSlides.length < 2) return;
  window.clearInterval(featureTimer);
  featureTimer = window.setInterval(() => {
    showFeatureSlide(activeFeatureSlide + 1);
  }, 4200);
}

featureDots.forEach((dot, index) => {
  dot.addEventListener("click", (event) => {
    event.preventDefault();
    showFeatureSlide(index);
    startFeatureSlider();
  });
});

featureSlider?.addEventListener("mouseenter", () => window.clearInterval(featureTimer));
featureSlider?.addEventListener("mouseleave", startFeatureSlider);

document.addEventListener("click", async (event) => {
  const lineButton = event.target.closest("[data-line-message]");
  if (!lineButton) return;

  event.preventDefault();
  const message = lineButton.dataset.lineMessage || "สนใจสอบถามรายละเอียดโครงการโกดังและออฟฟิศให้เช่าของ CENTRIX Park";
  const targetUrl = lineButton.getAttribute("href") || lineUrl;
  const originalText = lineButton.dataset.originalText || lineButton.textContent;
  lineButton.dataset.originalText = originalText;

  try {
    await navigator.clipboard.writeText(message);
    lineButton.textContent = "คัดลอกข้อความแล้ว";
    lineButton.classList.add("is-copied");
  } catch {
    lineButton.textContent = "เปิด LINE แล้ว";
  }

  window.open(targetUrl, "_blank", "noopener");

  window.setTimeout(() => {
    lineButton.textContent = originalText;
    lineButton.classList.remove("is-copied");
  }, 1800);
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

const revealItems = Array.from(document.querySelectorAll(".reveal-on-scroll, .home-service-strip article, .home-stats div, .overview-row"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

updateSummaryStats();
updateResults();
showFeatureSlide(0);
startFeatureSlider();
