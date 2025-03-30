function displayGlassInfo() {
    let params = new URL(window.location.href);
    let ID = params.searchParams.get("docID");

    db.collection("posts")
        .doc(ID)
        .get()
        .then(doc => {
            if (doc.exists) {
                const thisPost = doc.data();
                const { name, details, price, prescription, location, email, image } = thisPost;

                // Set fields
                document.getElementById("glassTitle").innerText = name || "Untitled";
                document.getElementById("glassDetails").innerText = details || "No description provided.";
                document.getElementById("glassPrice").innerText = "Price: $" + (price || "N/A");
                document.getElementById("glassPrescription").innerText = "Prescription: " + (prescription || "N/A");
                document.getElementById("glassLocation").innerText = "Location: " + (location || "N/A");

                const img = document.querySelector(".glass-img");
                img.src = image ? "data:image/png;base64," + image : "./images/placeholder.jpg";

                const contactBtn = document.querySelector(".contact-btn");
                if (email) {
                    contactBtn.href = `mailto:${email}`;
                } else {
                    contactBtn.href = "#";
                    contactBtn.classList.add("disabled");
                    contactBtn.innerHTML = `<i class="fa-solid fa-phone"></i> Email Not Available`;
                }

                checkIfBookmarked(ID);
            } else {
                console.error("No such document!");
            }
        })
        .catch(error => {
            console.error("Error fetching document:", error);
        });
}

// Enable interactive rating with Firestore saving
function enableStarRating() {
    const stars = document.querySelectorAll(".star");
    let selectedRating = 0;
    const postID = getDocID();

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const ratingRef = db.collection("posts").doc(postID).collection("ratings").doc(user.uid);

            // Load existing rating for the user
            ratingRef.get().then(doc => {
                if (doc.exists) {
                    selectedRating = doc.data().rating;
                    updateStarDisplay(selectedRating);
                }
            });

            stars.forEach((star, index) => {
                star.addEventListener("mouseover", () => {
                    resetStars();
                    for (let i = 0; i <= index; i++) {
                        stars[i].classList.add("active");
                    }
                });

                star.addEventListener("mouseleave", () => {
                    updateStarDisplay(selectedRating);
                });

                star.addEventListener("click", () => {
                    selectedRating = index + 1;
                    ratingRef.set({
                        rating: selectedRating,
                        ratedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        console.log("Rating saved:", selectedRating);
                        updateStarDisplay(selectedRating);
                        updateAverageRating(postID); // Recalculate average
                    });
                });
            });
        }
    });
}

// Calculate and show average rating
function updateAverageRating(postID) {
    db.collection("posts").doc(postID).collection("ratings").get().then(snapshot => {
        let total = 0;
        let count = 0;

        snapshot.forEach(doc => {
            total += doc.data().rating;
            count++;
        });

        const avg = count > 0 ? (total / count).toFixed(1) : "0.0";
        document.querySelector(".average-value").innerText = `${avg} / 5`;
    });
}


// Reset all stars
function resetStars() {
    document.querySelectorAll(".star").forEach(star => {
        star.classList.remove("active");
    });
}

// Fill stars based on selected rating
function updateStarDisplay(rating) {
    resetStars();
    for (let i = 0; i < rating; i++) {
        document.querySelectorAll(".star")[i].classList.add("active");
    }
}

// Bookmark toggle
function toggleBookmark(postID) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            let userBookmarksRef = db.collection("users").doc(user.uid).collection("bookmarks");

            userBookmarksRef.doc(postID).get().then(doc => {
                if (doc.exists) {
                    userBookmarksRef.doc(postID).delete().then(() => {
                        console.log("Bookmark removed!");
                        document.getElementById("bookmark-btn").innerHTML = `<i class="fa-regular fa-bookmark"></i>`;
                    });
                } else {
                    userBookmarksRef.doc(postID).set({
                        bookmarkedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        console.log("Bookmarked!");
                        document.getElementById("bookmark-btn").innerHTML = `<i class="fa-solid fa-bookmark"></i>`;
                    });
                }
            });
        } else {
            alert("Please log in to bookmark this product.");
        }
    });
}

// Check if product is bookmarked
function checkIfBookmarked(postID) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            let userBookmarksRef = db.collection("users").doc(user.uid).collection("bookmarks");

            userBookmarksRef.doc(postID).get().then(doc => {
                document.getElementById("bookmark-btn").innerHTML = doc.exists
                    ? `<i class="fa-solid fa-bookmark"></i>`
                    : `<i class="fa-regular fa-bookmark"></i>`;
            });
        }
    });
}

// Get doc ID from URL
function getDocID() {
    let params = new URL(window.location.href);
    return params.searchParams.get("docID");
}

// Init
document.addEventListener("DOMContentLoaded", () => {
    displayGlassInfo();
    enableStarRating();
    updateAverageRating(getDocID());
});
