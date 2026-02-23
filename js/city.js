// ============ CITY SEARCH FUNCTIONALITY ============

async function initializeCitySearch() {
  const citySearchInput = document.getElementById("city-search-input");
  const cityResults = document.getElementById("city-results");

  if (!citySearchInput || !cityResults) return;

  citySearchInput.addEventListener("input", async () => {
    const city = citySearchInput.value.trim();
    
    if (city.length < 2) {
      cityResults.innerHTML = "";
      return;
    }

    try {
      const attractions = await searchAttractions(city);

      cityResults.innerHTML = "";

      if (attractions.length === 0) {
        cityResults.innerHTML = `<p class="text-gray-500">No attractions found</p>`;
        return;
      }

      attractions.forEach(item => {
        cityResults.innerHTML += `
          <div class="p-6 bg-gray-50 rounded-lg border">
            <img src="${item.image || "https://placehold.co/600x400"}"
                 class="rounded-md w-full h-32 object-cover">
            <h3 class="text-xl font-semibold mt-4">${item.name}</h3>
            <p class="text-sm text-gray-500">${item.category}</p>
            <p class="text-sm mt-2">${item.description}</p>
          </div>
        `;
      });
    } catch (err) {
      console.error("City search error:", err);
      cityResults.innerHTML = `<p class="text-red-500">Error searching attractions</p>`;
    }
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", initializeCitySearch);
