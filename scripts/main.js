// Show user name from Firebase Auth
function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            $("#name-goes-here").text(user.displayName || "User");
        } else {
            console.log("No user is logged in");
        }
    });
}
getNameFromAuth();

// Display cards based on selected filters
function displayCardsWithFilters(filters = {}) {
    const container = document.getElementById("posts-go-here");
    const cardTemplate = document.getElementById("postsCardTemplate");
    container.innerHTML = "";

    db.collection("posts").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            let match = true;

            // Filter: Type
            if (filters.types?.length && !filters.types.includes(data.category)) {
                match = false;
            }

            // Filter: Location
            if (filters.locations?.length && !filters.locations.includes(data.location)) {
                match = false;
            }

            // Filter: Price Range
            if (filters.prices?.length) {
                const price = data.price || 0;
                const priceMatch = filters.prices.some(range => {
                    const [min, max] = range.split("-").map(Number);
                    return price >= min && price <= max;
                });
                if (!priceMatch) match = false;
            }

            // Display card if all filters match
            if (match) {
                const card = cardTemplate.content.cloneNode(true);

                card.querySelector(".card-title").textContent = data.name || "Untitled";
                card.querySelector(".card-text").textContent = data.details || "No description";
                card.querySelector(".card-prescription").innerHTML = `
            Prescription: ${data.prescription ?? "N/A"}<br>
            Location: ${data.location || "Unknown"}<br>
            Last updated: ${data.last_updated?.toDate().toLocaleDateString() || "Unknown"}
          `;
                card.querySelector(".card-image").src = data.image
                    ? "data:image/png;base64," + data.image
                    : "./images/placeholder.png"; // fallback image
                card.querySelector("a").href = `posts.html?docID=${doc.id}`;

                container.appendChild(card);
            }
        });
    });
}

// Collect selected filters from UI
function applySelectedFilters() {
    const types = Array.from(document.querySelectorAll(".filter-type:checked")).map(cb => cb.value);
    const prices = Array.from(document.querySelectorAll(".filter-price:checked")).map(cb => cb.value);
    const locations = Array.from(document.querySelectorAll(".filter-location:checked")).map(cb => cb.value);

    const filters = {
        types,
        prices,
        locations
    };

    displayCardsWithFilters(filters);
}

// On page load
document.addEventListener("DOMContentLoaded", () => {
    displayCardsWithFilters(); // Default: show all

    const applyBtn = document.getElementById("applyFiltersBtn");
    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            applySelectedFilters();

            // Close filter panel (Bootstrap offcanvas)
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById("filterPanel"));
            if (offcanvas) offcanvas.hide();
        });
    }
});
