function displayGlassInfo() {
    let params = new URL(window.location.href);
    let ID = params.searchParams.get("docID");
    console.log(ID);

    db.collection("posts")
        .doc(ID)
        .get()
        .then(doc => {
            if (doc.exists) {
                let thisPosts = doc.data();
                let postsCode = thisPosts.code;
                let postsName = thisPosts.details;
                let ownerEmail = thisPosts.email; // Ensure email exists in Firebase

                document.getElementById("glassName").innerHTML = postsName;
                let imgEvent = document.querySelector(".glass-img");
                imgEvent.src = "./images/" + postsCode + ".jpg";

                // Update Contact Button
                let contactBtn = document.querySelector(".contact-btn");
                if (ownerEmail) {
                    contactBtn.href = `mailto:${ownerEmail}`;
                } else {
                    contactBtn.href = "#";
                    contactBtn.classList.add("disabled");
                    contactBtn.innerHTML = `<i class="fa-solid fa-phone"></i> Email Not Available`;
                }

                // Check and update bookmark status
                checkIfBookmarked(ID);
            } else {
                console.error("No such document!");
            }
        })
        .catch(error => {
            console.error("Error fetching document: ", error);
        });
}

// Function to enable star rating
function enableStarRating() {
    const stars = document.querySelectorAll(".star");
    let selectedRating = 0;

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
            localStorage.setItem("selectedRating", selectedRating);
            console.log("User rated:", selectedRating);
            updateStarDisplay(selectedRating);
        });
    });

    let storedRating = localStorage.getItem("selectedRating");
    if (storedRating) {
        selectedRating = parseInt(storedRating);
        updateStarDisplay(selectedRating);
    }
}

// Function to reset stars
function resetStars() {
    document.querySelectorAll(".star").forEach(star => {
        star.classList.remove("active");
    });
}

// Function to update stars display
function updateStarDisplay(rating) {
    resetStars();
    for (let i = 0; i < rating; i++) {
        document.querySelectorAll(".star")[i].classList.add("active");
    }
}

// Function to toggle bookmarks
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
                    userBookmarksRef.doc(postID).set({ bookmarkedAt: firebase.firestore.FieldValue.serverTimestamp() })
                        .then(() => {
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

// Function to check if a product is already bookmarked
function checkIfBookmarked(postID) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            let userBookmarksRef = db.collection("users").doc(user.uid).collection("bookmarks");

            userBookmarksRef.doc(postID).get().then(doc => {
                if (doc.exists) {
                    document.getElementById("bookmark-btn").innerHTML = `<i class="fa-solid fa-bookmark"></i>`;
                } else {
                    document.getElementById("bookmark-btn").innerHTML = `<i class="fa-regular fa-bookmark"></i>`;
                }
            });
        }
    });
}

// Helper function to get docID from URL
function getDocID() {
    let params = new URL(window.location.href);
    return params.searchParams.get("docID");
}

// Initialize functions on page load
document.addEventListener("DOMContentLoaded", () => {
    displayGlassInfo();
    enableStarRating();
});
