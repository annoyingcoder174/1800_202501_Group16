// Show user name from Firebase Auth
function getNameFromAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            $("#name-goes-here").text(user.displayName || "User");
        } else {
            console.log("No user is logged in");
        }
    });
}
getNameFromAuth();

// Display posts with filters and search term
function displayCardsWithFilters(filters = {}, searchTerm = "") {
    const container = document.getElementById("posts-go-here");
    const cardTemplate = document.getElementById("postsCardTemplate");

    container.innerHTML = "<p class='text-center'>Loading posts...</p>";

    db.collection("posts")
        .orderBy("last_updated", "desc")
        .get()
        .then((snapshot) => {
            container.innerHTML = "";

            if (snapshot.empty) {
                container.innerHTML = "<p class='text-center'>No posts found.</p>";
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                let match = true;

                // Filter by type
                if (filters.types?.length && !filters.types.includes(data.type)) match = false;


                // Filter by price range
                if (filters.prices?.length) {
                    const price = parseFloat(data.price) || 0;
                    const priceMatch = filters.prices.some((range) => {
                        const [min, max] = range.split("-").map(Number);
                        return price >= min && (max === 0 || price <= max);
                    });
                    if (!priceMatch) match = false;
                }

                // Filter by location
                if (filters.locations?.length) {
                    const city = data.location;
                    const mainCities = ["Surrey", "Burnaby", "Vancouver"];
                    const isMainCity = mainCities.includes(city);
                    const includesOther = filters.locations.includes("Other");
                    const includesCity = filters.locations.includes(city);
                    if (!includesCity && !(includesOther && !isMainCity)) {
                        match = false;
                    }
                }

                // Filter by right eye and left eye prescription
                if (filters.rightEye !== null && parseFloat(data.rightEye) !== filters.rightEye) {
                    match = false;
                }
                if (filters.leftEye !== null && parseFloat(data.leftEye) !== filters.leftEye) {
                    match = false;
                }

                // Filter by search term
                if (searchTerm && !data.name?.toLowerCase().includes(searchTerm)) {
                    match = false;
                }

                if (match) {
                    const card = cardTemplate.content.cloneNode(true);

                    card.querySelector(".card-title").textContent = data.name || "Untitled";

                    // Price
                    let price = parseFloat(data.price) || 0;
                    card.querySelector(".price-amount").textContent = `$${price.toFixed(2)}`;

                    // Image
                    const img = card.querySelector(".card-image");
                    img.src = data.image ? `data:image/png;base64,${data.image}` : "./images/placeholder.png";
                    img.onerror = () => {
                        img.src = "./images/placeholder.png";
                    };

                    // Location
                    card.querySelector(".location-text").textContent = data.location || "Unknown";

                    // Description
                    card.querySelector(".card-text").textContent = data.details || "No description";

                    // Prescription
                    const rightEye = data.rightEye !== undefined ? data.rightEye : "N/A";
                    const leftEye = data.leftEye !== undefined ? data.leftEye : "N/A";
                    const lastUpdated = data.last_updated ? data.last_updated.toDate().toLocaleDateString() : "Unknown";

                    card.querySelector(".card-prescription").innerHTML = `
  Right Eye: ${rightEye}<br>
  Left Eye: ${leftEye}<br>
  Last updated: ${lastUpdated}
`;


                    // User Info
                    if (data.owner_id) {
                        db.collection("users").doc(data.owner_id).get().then((userDoc) => {
                            const userData = userDoc.data();
                            card.querySelector(".user-name").innerHTML = `<a href="profile.html?uid=${data.owner_id}" class="text-decoration-none user-profile-name">${userData?.name || "User"}</a>`;
                            card.querySelector(".user-profile img").src = userData?.profilePic || "images/profile-placeholder.png";
                            card.querySelector(".user-profile-link").href = `profile.html?uid=${data.owner_id}`;
                        });
                    }

                    // View post link
                    card.querySelector(".card-href").href = `posts.html?docID=${doc.id}`;

                    // Like & Bookmark buttons
                    const likeBtn = card.querySelector(".like-btn");
                    likeBtn.setAttribute("data-doc-id", doc.id);
                    setupLikeListener(likeBtn, doc.id);

                    const bookmarkBtn = card.querySelector(".bookmark-btn");
                    bookmarkBtn.setAttribute("data-doc-id", doc.id);
                    setupBookmarkListener(bookmarkBtn, doc.id);

                    container.appendChild(card);
                }
            });

            if (!container.children.length) {
                container.innerHTML = "<p class='text-center'>No posts match your filters.</p>";
            }
        })
        .catch((err) => {
            console.error("Error loading posts:", err);
            container.innerHTML = "<p class='text-center text-danger'>Error loading posts.</p>";
        });
}

// Filter collection function
function applySelectedFilters(searchQuery = "") {
    const types = Array.from(document.querySelectorAll(".filter-type:checked")).map((cb) => cb.value);
    const prices = Array.from(document.querySelectorAll(".filter-price:checked")).map((cb) => cb.value);
    const locations = Array.from(document.querySelectorAll(".filter-location:checked")).map((cb) => cb.value);
    const rightEye = parseFloat(document.getElementById("rightEyeInput")?.value);
    const leftEye = parseFloat(document.getElementById("leftEyeInput")?.value);

    const filters = {
        types,
        prices,
        locations,
        rightEye: isNaN(rightEye) ? null : rightEye,
        leftEye: isNaN(leftEye) ? null : leftEye,
    };

    displayCardsWithFilters(filters, searchQuery.trim().toLowerCase());
}

// Setup like button logic
function setupLikeListener(button, postID) {
    const icon = button.querySelector("i");
    const countSpan = button.querySelector(".like-count");

    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            button.disabled = true;
            icon.classList.replace("fa-solid", "fa-regular");
            return;
        }

        const likeRef = db.collection("posts").doc(postID).collection("likes").doc(user.uid);

        likeRef.get().then((doc) => {
            if (doc.exists) icon.classList.replace("fa-regular", "fa-solid");
        });

        button.addEventListener("click", () => {
            likeRef.get().then((doc) => {
                if (doc.exists) {
                    likeRef.delete().then(() => {
                        icon.classList.replace("fa-solid", "fa-regular");
                        updateLikeCount(postID, countSpan);
                    });
                } else {
                    likeRef.set({ likedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
                        icon.classList.replace("fa-regular", "fa-solid");
                        updateLikeCount(postID, countSpan);
                    });
                }
            });
        });

        updateLikeCount(postID, countSpan);
    });
}

// Like count display
function updateLikeCount(postID, element) {
    db.collection("posts").doc(postID).collection("likes").get().then((snap) => {
        element.textContent = snap.size;
    });
}

// Bookmark logic
function setupBookmarkListener(button, postID) {
    const icon = button.querySelector("i");

    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            button.disabled = true;
            icon.classList.replace("fa-solid", "fa-regular");
            return;
        }

        const ref = db.collection("users").doc(user.uid).collection("bookmarks").doc(postID);
        ref.get().then((doc) => {
            if (doc.exists) icon.classList.replace("fa-regular", "fa-solid");
        });

        button.addEventListener("click", () => {
            ref.get().then((doc) => {
                if (doc.exists) {
                    ref.delete().then(() => {
                        icon.classList.replace("fa-solid", "fa-regular");
                        showToast("Removed from bookmarks");
                    });
                } else {
                    ref.set({ savedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
                        icon.classList.replace("fa-regular", "fa-solid");
                        showToast("Saved to bookmarks");
                    });
                }
            });
        });
    });
}

// Toast helper
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// DOM loaded
document.addEventListener("DOMContentLoaded", () => {
    const applyBtn = document.getElementById("applyFiltersBtn");
    const searchInput = document.querySelector(".search-input");

    function applySearchAndFilters() {
        applySelectedFilters(searchInput.value);
    }

    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            applySearchAndFilters();
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById("filterPanel"));
            if (offcanvas) offcanvas.hide();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            applySearchAndFilters();
        });
    }

    applySearchAndFilters();
});
