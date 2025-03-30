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
                    : "./images/placeholder.png";
                card.querySelector("a").href = `posts.html?docID=${doc.id}`;

                // ❤️ Like button setup
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
    displayCardsWithFilters();

    const applyBtn = document.getElementById("applyFiltersBtn");
    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            applySelectedFilters();

            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById("filterPanel"));
            if (offcanvas) offcanvas.hide();
        });
    }
});
