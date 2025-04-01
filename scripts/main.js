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

// Display cards based on selected filters and search term
function displayCardsWithFilters(filters = {}, searchTerm = "") {
    const container = document.getElementById("posts-go-here");
    const cardTemplate = document.getElementById("postsCardTemplate");

    // Clear all previous cards before rendering new ones
    container.innerHTML = "";

    db.collection("posts")
        .orderBy("timestamp", "desc") // Sort by timestamp in descending order (newest first)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const data = doc.data();
                let match = true;

                // Apply filters
                if (filters.types?.length && !filters.types.includes(data.category)) match = false;
                if (filters.locations?.length) {
                    const mainCities = ["Surrey", "Burnaby", "Vancouver"];
                    const isMainCity = mainCities.includes(data.location);
                    const includesOther = filters.locations.includes("Other");
                    const includesSpecific = filters.locations.includes(data.location);

                    if (!includesSpecific && !(includesOther && !isMainCity)) {
                        match = false;
                    }
                }

                if (filters.prices?.length) {
                    const price = data.price || 0;
                    const priceMatch = filters.prices.some(range => {
                        const [min, max] = range.split("-").map(Number);
                        return price >= min && price <= max;
                    });
                    if (!priceMatch) match = false;
                }

                // Apply search
                if (searchTerm && !data.name?.toLowerCase().includes(searchTerm)) match = false;

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
                        : "./images/placeholder.png";
                    card.querySelector("a").href = `posts.html?docID=${doc.id}`;

                    const likeBtn = card.querySelector(".like-btn");
                    if (likeBtn) {
                        likeBtn.setAttribute("data-doc-id", doc.id);
                        setupLikeListener(likeBtn, doc.id);
                    }

                    container.appendChild(card);
                }
            });
        });
}


// Collect selected filters from UI and apply search query
function applySelectedFilters(searchQuery = "") {
    const types = Array.from(document.querySelectorAll(".filter-type:checked")).map(cb => cb.value);
    const prices = Array.from(document.querySelectorAll(".filter-price:checked")).map(cb => cb.value);
    const locations = Array.from(document.querySelectorAll(".filter-location:checked")).map(cb => cb.value);

    const filters = {
        types,
        prices,
        locations
    };

    displayCardsWithFilters(filters, searchQuery);
}

// Setup like button listener
function setupLikeListener(button, postID) {
    const icon = button.querySelector("i");
    const countSpan = button.querySelector(".like-count");

    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            button.disabled = true;
            icon.classList.remove("fa-solid");
            icon.classList.add("fa-regular");
            return;
        }

        const likeRef = db.collection("posts").doc(postID).collection("likes").doc(user.uid);

        // Check current like state
        likeRef.get().then(doc => {
            if (doc.exists) {
                icon.classList.remove("fa-regular");
                icon.classList.add("fa-solid");
            } else {
                icon.classList.remove("fa-solid");
                icon.classList.add("fa-regular");
            }
        });

        // Toggle like on click
        button.addEventListener("click", () => {
            likeRef.get().then(doc => {
                if (doc.exists) {
                    likeRef.delete().then(() => {
                        icon.classList.remove("fa-solid");
                        icon.classList.add("fa-regular");
                        updateLikeCount(postID, countSpan);
                    });
                } else {
                    likeRef.set({ likedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
                        icon.classList.remove("fa-regular");
                        icon.classList.add("fa-solid");
                        updateLikeCount(postID, countSpan);
                    });
                }
            });
        });

        // Initial count
        updateLikeCount(postID, countSpan);
    });
}

// Count total likes
function updateLikeCount(postID, element) {
    db.collection("posts").doc(postID).collection("likes").get().then(snapshot => {
        element.textContent = snapshot.size;
    });
}

// On page load
document.addEventListener("DOMContentLoaded", () => {
    const applyBtn = document.getElementById("applyFiltersBtn");
    const searchInput = document.querySelector(".search-input");

    function applySearchAndFilters() {
        const types = Array.from(document.querySelectorAll(".filter-type:checked")).map(cb => cb.value);
        const prices = Array.from(document.querySelectorAll(".filter-price:checked")).map(cb => cb.value);
        const locations = Array.from(document.querySelectorAll(".filter-location:checked")).map(cb => cb.value);
        const searchTerm = searchInput.value.trim().toLowerCase();

        const filters = { types, prices, locations };
        displayCardsWithFilters(filters, searchTerm);
    }

    // Button: Apply filters
    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            applySearchAndFilters();

            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById("filterPanel"));
            if (offcanvas) offcanvas.hide();
        });
    }

    // Input: Live search
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            applySearchAndFilters();
        });
    }

    // Initial render
    applySearchAndFilters();
});


