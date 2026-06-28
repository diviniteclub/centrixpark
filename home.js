const cards = Array.from(document.querySelectorAll("[data-project-card]"));
const searchInput = document.querySelector("[data-project-search]");
const minInput = document.querySelector("[data-price-min]");
const maxInput = document.querySelector("[data-price-max]");
const resultText = document.querySelector("[data-filter-result]");
const statusButtons = Array.from(document.querySelectorAll("[data-status-filter]"));
const sortSelect = document.querySelector("[data-project-sort]");
const projectGrid = document.querySelector(".project-grid");
const money = new Intl.NumberFormat("th-TH");
let activeStatus = "all";

document.body.classList.add("has-reveal");

function numberValue(input) {
  return Number(input?.value || 0);
}

function updateSummaryStats() {
  const knownUnitCards = cards.filter((card) => Number(card.dataset.totalUnits || 0) > 0);
  const pricedCards = cards.filter((card) => Number(card.dataset.minPrice || 0) > 0);
  const projectCount = cards.length;
  const totalUnits = knownUnitCards.reduce((sum, card) => sum + Number(card.dataset.totalUnits || 0), 0);
  const availableUnits = knownUnitCards.reduce((sum, card) => sum + Number(card.dataset.availableUnits || 0), 0);
  const minPrice = pricedCards.reduce((lowest, card) => {
    const price = Number(card.dataset.minPrice || 0);
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

function updateResults() {
  const query = (searchInput?.value || "").trim().toLowerCase();
  const min = numberValue(minInput);
  const max = numberValue(maxInput);
  let visible = 0;
  const sortedCards = [...cards].sort((a, b) => {
    const sortBy = sortSelect?.value || "latest";
    const priceA = Number(a.dataset.minPrice || 0) || Number.POSITIVE_INFINITY;
    const priceB = Number(b.dataset.minPrice || 0) || Number.POSITIVE_INFINITY;
    const availableA = Number(a.dataset.availableUnits || 0);
    const availableB = Number(b.dataset.availableUnits || 0);
    const updatedA = Number(a.dataset.updatedOrder || 0);
    const updatedB = Number(b.dataset.updatedOrder || 0);

    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "available-desc") return availableB - availableA;
    return updatedB - updatedA;
  });

  sortedCards.forEach((card) => projectGrid?.appendChild(card));

  sortedCards.forEach((card) => {
    const text = `${card.dataset.name || ""} ${card.dataset.location || ""}`.toLowerCase();
    const price = Number(card.dataset.minPrice || 0);
    const statuses = (card.dataset.status || "").split(" ");
    const statusMatch = activeStatus === "all" || statuses.includes(activeStatus);
    const queryMatch = !query || text.includes(query);
    const minMatch = !min || price >= min || price === 0;
    const maxMatch = !max || (price > 0 && price <= max) || price === 0;
    const show = statusMatch && queryMatch && minMatch && maxMatch;

    card.hidden = !show;
    if (show) visible += 1;
  });

  if (resultText) {
    resultText.textContent = `แสดง ${visible} โครงการ`;
  }
}

statusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.statusFilter || "all";
    statusButtons.forEach((item) => item.classList.toggle("active", item === button));
    updateResults();
  });
});

[searchInput, minInput, maxInput].forEach((input) => {
  input?.addEventListener("input", updateResults);
});

sortSelect?.addEventListener("change", updateResults);

document.querySelectorAll("[data-price-max-shortcut]").forEach((button) => {
  button.addEventListener("click", () => {
    if (maxInput) maxInput.value = button.dataset.priceMaxShortcut || "";
    updateResults();
  });
});

document.querySelector("[data-apply-filter]")?.addEventListener("click", updateResults);

document.querySelector("[data-clear-filter]")?.addEventListener("click", () => {
  if (searchInput) searchInput.value = "";
  if (minInput) minInput.value = "";
  if (maxInput) maxInput.value = "";
  activeStatus = "all";
  statusButtons.forEach((item) => item.classList.toggle("active", item.dataset.statusFilter === "all"));
  updateResults();
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
