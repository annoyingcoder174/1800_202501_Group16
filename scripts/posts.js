// Global variable to store owner's email
let ownerEmail = null;

// Helper to get post ID from URL
function getDocID() {
    const params = new URL(window.location.href);
    return params.searchParams.get("docID");
}

// Display glass information
function displayGlassInfo() {
    const ID = getDocID();
    db.collection("posts").doc(ID).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById("glassTitle").innerText = data.name || "Untitled";
            document.getElementById("glassDetails").innerText = data.details || "No description";
            document.getElementById("glassPrice").innerText = "Price: $" + (data.price || "N/A");
            document.getElementById("glassPrescription").innerText = "Prescription: " + (data.prescription || "N/A");
            document.getElementById("glassLocation").innerText = "Location: " + (data.location || "N/A");

            const img = document.querySelector(".glass-img");
            img.src = data.image ? "data:image/png;base64," + data.image : "./images/placeholder.jpg";

            // Save email globally
            ownerEmail = data.email || null;

            // Update contact button with mailto
            const contactBtn = document.querySelector(".contact-btn");
            if (ownerEmail) {
                contactBtn.setAttribute("href", `mailto:${ownerEmail}`);
                contactBtn.classList.remove("disabled");
                contactBtn.innerHTML = `<i class='fa-solid fa-envelope'></i> Contact Seller`;
            } else {
                contactBtn.setAttribute("href", "#");
                contactBtn.classList.add("disabled");
                contactBtn.innerHTML = `<i class='fa-solid fa-envelope'></i> Email Not Available`;
            }

            // Fetch poster's information
            if (data.owner) {
                db.collection("users").doc(data.owner).get().then(userDoc => {
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        document.getElementById("poster-name").innerText = userData.name || "Unknown";

                        const profilePic = userData.profilePic || "https://via.placeholder.com/150";
                        document.getElementById("poster-profile-pic").src = profilePic;

                        const profilePageURL = `eachUser.html?userId=${data.owner}`;
                        document.getElementById("poster-link").href = profilePageURL;
                        document.getElementById("poster-link-name").href = profilePageURL;
                    } else {
                        document.getElementById("poster-name").innerText = "Name: Unknown";
                        document.getElementById("poster-profile-pic").src = "https://via.placeholder.com/150";
                    }
                }).catch(error => {
                    console.error("Error fetching poster information:", error);
                });
            }

            // Show edit/delete buttons if user owns the post
            firebase.auth().onAuthStateChanged(user => {
                if (user && data.owner === user.uid) {
                    const editBtn = document.querySelector(".edit-btn");
                    editBtn.style.display = "block";
                    editBtn.addEventListener("click", () => {
                        window.location.href = `editPost.html?docID=${ID}`;
                    });
                    document.querySelector(".delete-btn").style.display = "block";
                } else {
                    document.querySelector(".edit-btn").style.display = "none";
                    document.querySelector(".delete-btn").style.display = "none";
                }
            });

            document.querySelector(".cart-btn")?.addEventListener("click", () => addToCart(ID, data));
            checkIfBookmarked(ID);
        }
    });
}

// Bookmark logic
function toggleBookmark() {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            alert("Please sign in to bookmark posts");
            return;
        }

        const postID = getDocID();
        const bookmarkRef = db.collection("users").doc(user.uid).collection("bookmarks").doc(postID);
        const bookmarkBtn = document.querySelector(".bookmark-btn i");

        bookmarkRef.get().then(doc => {
            if (doc.exists) {
                bookmarkRef.delete().then(() => {
                    bookmarkBtn.classList.remove("fa-solid");
                    bookmarkBtn.classList.add("fa-regular");
                    showToast("Post removed from bookmarks");
                });
            } else {
                bookmarkRef.set({
                    savedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    bookmarkBtn.classList.remove("fa-regular");
                    bookmarkBtn.classList.add("fa-solid");
                    showToast("Post saved to bookmarks");
                });
            }
        });
    });
}

function checkIfBookmarked(postID) {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return;
        db.collection("users").doc(user.uid).collection("bookmarks").doc(postID).get().then(doc => {
            document.getElementById("bookmark-btn").innerHTML = doc.exists ?
                "<i class='fa-solid fa-bookmark'></i>" : "<i class='fa-regular fa-bookmark'></i>";
        });
    });
}

// Cart
function addToCart(postID, product) {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return alert("Log in first!");
        db.collection("users").doc(user.uid).collection("cart").doc(postID).set({
            name: product.name,
            price: parseFloat(product.price || 0),
            image: product.image || "",
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => showToast("Product added to cart!"));
    });
}

// Rating
function enableStarRating() {
    const stars = document.querySelectorAll(".star");
    const postID = getDocID();
    let selected = 0;

    firebase.auth().onAuthStateChanged(user => {
        if (!user) return;
        const ref = db.collection("posts").doc(postID).collection("ratings").doc(user.uid);

        ref.get().then(doc => {
            if (doc.exists) {
                selected = doc.data().rating;
                updateStarDisplay(selected);
            }
        });

        stars.forEach((star, i) => {
            star.addEventListener("mouseover", () => {
                resetStars();
                for (let j = 0; j <= i; j++) stars[j].classList.add("active");
            });

            star.addEventListener("mouseleave", () => updateStarDisplay(selected));

            star.addEventListener("click", () => {
                selected = i + 1;
                ref.set({ rating: selected, ratedAt: firebase.firestore.FieldValue.serverTimestamp() });
                updateStarDisplay(selected);
                updateAverageRating(postID);
            });
        });
    });
}

function updateStarDisplay(rating) {
    const stars = document.querySelectorAll(".star");
    resetStars();
    for (let i = 0; i < rating; i++) stars[i].classList.add("active");
}

function resetStars() {
    document.querySelectorAll(".star").forEach(star => star.classList.remove("active"));
}

function updateAverageRating(postID) {
    db.collection("posts").doc(postID).collection("ratings").get().then(snapshot => {
        let sum = 0;
        snapshot.forEach(doc => sum += doc.data().rating);
        const avg = snapshot.size ? (sum / snapshot.size).toFixed(1) : "0.0";
        document.querySelector(".average-value").innerText = `${avg} / 5`;
    });
}

// Comments logic stays unchanged...

document.addEventListener("DOMContentLoaded", () => {
    const postID = getDocID();
    displayGlassInfo();
    enableStarRating();
    updateAverageRating(postID);
    loadComments(postID);

    document.getElementById("comment-form").addEventListener("submit", e => {
        e.preventDefault();
        submitComment(postID);
    });
});

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
