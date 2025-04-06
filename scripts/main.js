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

    // Show loading state
    container.innerHTML = "<p class='text-center'>Loading posts...</p>";

    db.collection("posts")
        .orderBy("last_updated", "desc")
        .get()
        .then(snapshot => {
            // Clear loading state
            container.innerHTML = "";
            
            if (snapshot.empty) {
                container.innerHTML = "<p class='text-center'>No posts found.</p>";
                return;
            }

            snapshot.forEach(doc => {
                try {
                    const data = doc.data();
                    let match = true;

                    // Apply filters only if they exist and have values
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
                        const price = parseFloat(data.price) || 0;
                        const priceMatch = filters.prices.some(range => {
                            const [min, max] = range.split("-").map(Number);
                            return price >= min && (max === 0 || price <= max);
                        });
                        if (!priceMatch) match = false;
                    }

                    // Apply search only if there's a search term
                    if (searchTerm && !data.name?.toLowerCase().includes(searchTerm.toLowerCase())) match = false;

                    if (match) {
                        const card = cardTemplate.content.cloneNode(true);
                        
                        // Set card content with fallbacks for missing data
                        card.querySelector(".card-title").textContent = data.name || "Untitled";
                        
                        // Set price with proper formatting and currency
                        const priceAmount = card.querySelector(".price-amount");
                        if (priceAmount) {
                            let price = 0;
                            // Handle different price formats from Firebase
                            if (data.price !== undefined && data.price !== null) {
                                // Handle number, string, or numeric string formats
                                if (typeof data.price === 'number') {
                                    price = data.price;
                                } else if (typeof data.price === 'string') {
                                    // Remove any non-numeric characters except decimal point
                                    const cleanPrice = data.price.replace(/[^\d.-]/g, '');
                                    price = parseFloat(cleanPrice);
                                }
                                
                                // Validate the parsed price
                                if (isNaN(price) || price < 0) {
                                    price = 0;
                                    console.log(`Invalid price format for post: ${doc.id}, price: ${data.price}`);
                                }
                            }
                            
                            // Format price with proper currency formatting
                            priceAmount.textContent = price.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });

                            // Add debug log to check price parsing
                            console.log(`Post ${doc.id} - Original price: ${data.price}, Parsed price: ${price}`);
                        }
                        
                        // Fetch and set user information
                        if (data.owner_id) {  // Check for owner_id in post data
                            const userRef = db.collection("users").doc(data.owner_id);
                            userRef.get().then((userDoc) => {
                                if (userDoc.exists) {
                                    const userData = userDoc.data();
                                    console.log("Found user data:", userData); // Debug log
                                    
                                    // Set user name and make it clickable
                                    const userNameElement = card.querySelector(".user-name");
                                    if (userNameElement) {
                                        userNameElement.innerHTML = `<a href="profile.html?uid=${data.owner_id}" class="text-decoration-none user-profile-name">${userData.name || userData.displayName || "Anonymous User"}</a>`;
                                    }

                                    // Set user profile picture
                                    const userProfileImg = card.querySelector(".user-profile img");
                                    if (userProfileImg) {
                                        // Try to get profile picture URL
                                        const profilePicUrl = userData.profilePic || userData.photoURL;
                                        if (profilePicUrl) {
                                            userProfileImg.src = profilePicUrl;
                                            userProfileImg.onerror = () => {
                                                console.log("Profile image failed to load, using placeholder");
                                                userProfileImg.src = "images/profile-placeholder.png";
                                            };
                                        } else {
                                            userProfileImg.src = "images/profile-placeholder.png";
                                        }
                                    }

                                    // Set profile link
                                    const profileLink = card.querySelector(".user-profile-link");
                                    if (profileLink) {
                                        profileLink.href = `profile.html?uid=${data.owner_id}`;
                                    }
                                } else {
                                    console.log("No user document found for ID:", data.owner_id);
                                    setAnonymousUser(card);
                                }
                            }).catch((error) => {
                                console.error("Error fetching user data:", error);
                                setAnonymousUser(card);
                            });
                        } else {
                            console.log("No owner_id found in post data:", data);
                            setAnonymousUser(card);
                        }

                        // Helper function to set anonymous user info
                        function setAnonymousUser(card) {
                            const userNameElement = card.querySelector(".user-name");
                            if (userNameElement) {
                                userNameElement.innerHTML = `<span>Anonymous User</span>`;
                            }
                            
                            const userProfileImg = card.querySelector(".user-profile img");
                            if (userProfileImg) {
                                userProfileImg.src = "images/profile-placeholder.png";
                            }
                            
                            const profileLink = card.querySelector(".user-profile-link");
                            if (profileLink) {
                                profileLink.href = "#";
                            }
                        }
                        
                        card.querySelector(".location-text").textContent = data.location || "Location not specified";
                        card.querySelector(".card-text").textContent = data.details || "No description";
                        
                        card.querySelector(".card-prescription").innerHTML = `
                            Prescription: ${data.prescription || "N/A"}<br>
                            Last updated: ${data.last_updated ? data.last_updated.toDate().toLocaleDateString() : "Unknown"}
                        `;

                        // Handle image with fallback
                        const imgElement = card.querySelector(".card-image");
                        if (data.image) {
                            imgElement.src = `data:image/png;base64,${data.image}`;
                        } else {
                            imgElement.src = "./images/placeholder.png";
                        }
                        imgElement.onerror = () => {
                            imgElement.src = "./images/placeholder.png";
                        };

                        // Set up link to post details
                        const readMoreBtn = card.querySelector(".card-href");
                        if (readMoreBtn) {
                            readMoreBtn.href = `posts.html?docID=${doc.id}`;
                        }

                        // Set up like button if it exists
                        const likeBtn = card.querySelector(".like-btn");
                        if (likeBtn) {
                            likeBtn.setAttribute("data-doc-id", doc.id);
                            setupLikeListener(likeBtn, doc.id);
                        }

                        // Set up bookmark button if it exists
                        const bookmarkBtn = card.querySelector(".bookmark-btn");
                        if (bookmarkBtn) {
                            bookmarkBtn.setAttribute("data-doc-id", doc.id);
                            setupBookmarkListener(bookmarkBtn, doc.id);
                        }

                        container.appendChild(card);
                    }
                } catch (error) {
                    console.error("Error displaying post:", doc.id, error);
                }
            });

            // Show message if no posts match filters
            if (container.children.length === 0) {
                container.innerHTML = "<p class='text-center'>No posts match the selected filters.</p>";
            }
        })
        .catch(error => {
            console.error("Error getting posts:", error);
            container.innerHTML = "<p class='text-center text-danger'>Error loading posts. Please try again later.</p>";
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

// Setup bookmark button listener
function setupBookmarkListener(button, postID) {
    const icon = button.querySelector("i");

    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            button.disabled = true;
            icon.classList.remove("fa-solid");
            icon.classList.add("fa-regular");
            return;
        }

        // Check if post is bookmarked
        db.collection("users").doc(user.uid).collection("bookmarks").doc(postID).get()
            .then(doc => {
                if (doc.exists) {
                    icon.classList.remove("fa-regular");
                    icon.classList.add("fa-solid");
                } else {
                    icon.classList.remove("fa-solid");
                    icon.classList.add("fa-regular");
                }
            });

        // Toggle bookmark on click
        button.addEventListener("click", () => {
            const bookmarkRef = db.collection("users").doc(user.uid).collection("bookmarks").doc(postID);
            
            bookmarkRef.get().then(doc => {
                if (doc.exists) {
                    // Remove bookmark
                    bookmarkRef.delete().then(() => {
                        icon.classList.remove("fa-solid");
                        icon.classList.add("fa-regular");
                        showToast("Post removed from bookmarks");
                    });
                } else {
                    // Add bookmark
                    bookmarkRef.set({
                        savedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        icon.classList.remove("fa-regular");
                        icon.classList.add("fa-solid");
                        showToast("Post saved to bookmarks");
                    });
                }
            });
        });
    });
}

// Show toast message
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
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


