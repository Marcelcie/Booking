document.addEventListener("DOMContentLoaded", () => {
  const priceRange = document.getElementById("priceRange");
  const priceRangeValue = document.getElementById("priceRangeValue");

  if (priceRange && priceRangeValue) {
    priceRange.addEventListener("input", () => {
      priceRangeValue.textContent = `${priceRange.value} zł`;
    });
  }

  const pills = document.querySelectorAll(".pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(btn => btn.classList.remove("active"));
      pill.classList.add("active");
    });
  });

  const viewButtons = document.querySelectorAll(".view-btn");
  const offersResults = document.getElementById("offersResults");

  viewButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      viewButtons.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      const viewType = btn.dataset.view;

      if (offersResults) {
        offersResults.classList.remove("list-view", "grid-view");
        offersResults.classList.add(`${viewType}-view`);
      }
    });
  });
});