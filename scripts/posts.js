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
            
            // Fetch poster's information
            if (data.owner) {
                db.collection("users").doc(data.owner).get().then(userDoc => {
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        document.getElementById("poster-name").innerText = userData.name || "Unknown";

                        const profilePic = userData.profilePic || "https://via.placeholder.com/150";
                        document.getElementById("poster-profile-pic").src = profilePic;

                        // Set the links to the poster's profile page
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

            //Checks if a user a logged in and if the post is theirs
            firebase.auth().onAuthStateChanged(user => {
                if (user && data.owner === user.uid) {
                    // Post belongs to the user
                    const editBtn = document.querySelector(".edit-btn");
                    editBtn.style.display = "block"; // Show edit button
            
                    // Add click event to redirect to the edit page
                    editBtn.addEventListener("click", () => {
                        window.location.href = `editPost.html?docID=${ID}`;
                    });
            
                    document.querySelector(".delete-btn").style.display = "block"; // Show delete button
                } else {
                    // Post does not belong to the user
                    document.querySelector(".edit-btn").style.display = "none";
                    document.querySelector(".delete-btn").style.display = "none";
                }
            });

            const contactBtn = document.querySelector(".contact-btn");
            if (data.email) {
                contactBtn.href = "mailto:" + data.email;
            } else {
                contactBtn.href = "#";
                contactBtn.classList.add("disabled");
                contactBtn.innerHTML = "<i class='fa-solid fa-phone'></i> Email Not Available";
            }

            document.querySelector(".cart-btn").addEventListener("click", () => addToCart(ID, data));
            checkIfBookmarked(ID);

            // Check if the post belongs to the current user
           
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

        const bookmarkRef = db.collection("users").doc(user.uid).collection("bookmarks").doc(ID);
        const bookmarkBtn = document.querySelector(".bookmark-btn i");

        bookmarkRef.get().then(doc => {
            if (doc.exists) {
                // Remove bookmark
                bookmarkRef.delete().then(() => {
                    bookmarkBtn.classList.remove("fa-solid");
                    bookmarkBtn.classList.add("fa-regular");
                    showToast("Post removed from bookmarks");
                });
            } else {
                // Add bookmark
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

// Comments
function submitComment(postID) {
    const input = document.getElementById("comment-input");
    const text = input.value.trim();
    if (!text) return;

    firebase.auth().onAuthStateChanged(user => {
        if (!user) return alert("Login required.");
        db.collection("posts").doc(postID).collection("comments").add({
            text,
            userID: user.uid,
            userName: user.displayName || "Anonymous",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            input.value = "";
            loadComments(postID);
        });
    });
}

function loadComments(postID) {
    const section = document.getElementById("comment-list");
    section.innerHTML = "";

    db.collection("posts").doc(postID).collection("comments")
        .orderBy("timestamp", "desc")
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const comment = doc.data();
                const time = comment.timestamp?.toDate().toLocaleString() || "Unknown";

                const card = document.createElement("div");
                card.className = "card mb-2";

                // Fetch latest user name & avatar from their profile
                db.collection("users").doc(comment.userID).get().then(userDoc => {
                    const userName = userDoc.exists ? userDoc.data().name || "User" : "User";
                    const avatar = userDoc.exists && userDoc.data().profilePic
                        ? userDoc.data().profilePic
                        : "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";

                    card.innerHTML = `
              <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                  <img src="${avatar}" alt="Avatar" class="comment-avatar">
                  <div>
                    <h6 class="card-subtitle mb-0 text-muted">${userName}</h6>
                    <small class="text-muted">${time}</small>
                  </div>
                </div>
                <p class="card-text">${comment.text}</p>
                <div class="d-flex gap-2 align-items-center">
                  <button class="btn btn-sm btn-outline-secondary like-comment-btn" data-id="${doc.id}">
                    <i class="fa-regular fa-thumbs-up"></i> <span class="like-count">0</span>
                  </button>
                  <button class="btn btn-sm btn-outline-primary reply-btn" data-id="${doc.id}">Reply</button>
                </div>
                <div class="replies mt-2" id="replies-${doc.id}"></div>
                <div class="reply-form mt-2" style="display:none;">
                  <input type="text" class="form-control form-control-sm reply-input" placeholder="Write a reply..." />
                  <button class="btn btn-sm btn-primary mt-1 submit-reply" data-id="${doc.id}">Post Reply</button>
                </div>
              </div>
            `;

                    section.appendChild(card);

                    setupLikeComment(postID, doc.id, card.querySelector(".like-comment-btn"));
                    setupReplyFeature(postID, doc.id, card);
                    loadReplies(postID, doc.id);
                });
            });
        });
}

function setupLikeComment(postID, commentID, btn) {
    const icon = btn.querySelector("i");
    const countSpan = btn.querySelector(".like-count");

    firebase.auth().onAuthStateChanged(user => {
        if (!user) return;
        const ref = db.collection("posts").doc(postID).collection("comments")
            .doc(commentID).collection("likes").doc(user.uid);

        ref.get().then(doc => {
            icon.classList.toggle("fa-solid", doc.exists);
            icon.classList.toggle("fa-regular", !doc.exists);
        });

        btn.addEventListener("click", () => {
            ref.get().then(doc => {
                if (doc.exists) {
                    ref.delete().then(() => {
                        icon.classList.remove("fa-solid");
                        icon.classList.add("fa-regular");
                        updateCommentLikeCount(postID, commentID, countSpan);
                    });
                } else {
                    ref.set({ likedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
                        icon.classList.add("fa-solid");
                        icon.classList.remove("fa-regular");
                        updateCommentLikeCount(postID, commentID, countSpan);
                    });
                }
            });
        });

        updateCommentLikeCount(postID, commentID, countSpan);
    });
}

function updateCommentLikeCount(postID, commentID, el) {
    db.collection("posts").doc(postID).collection("comments")
        .doc(commentID).collection("likes").get().then(snap => {
            el.textContent = snap.size;
        });
}

// Reply system
function setupReplyFeature(postID, commentID, card) {
    const replyBtn = card.querySelector(".reply-btn");
    const form = card.querySelector(".reply-form");
    const input = form.querySelector(".reply-input");
    const submitBtn = form.querySelector(".submit-reply");

    replyBtn.addEventListener("click", () => {
        form.style.display = form.style.display === "none" ? "block" : "none";
    });

    submitBtn.addEventListener("click", () => {
        const replyText = input.value.trim();
        if (!replyText) return;

        firebase.auth().onAuthStateChanged(user => {
            if (!user) return alert("Log in first.");
            db.collection("posts").doc(postID).collection("comments")
                .doc(commentID).collection("replies").add({
                    text: replyText,
                    userID: user.uid,
                    userName: user.displayName || "Anonymous",
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    input.value = "";
                    loadReplies(postID, commentID);
                });
        });
    });
}

function loadReplies(postID, commentID) {
    const container = document.getElementById(`replies-${commentID}`);
    if (!container) return;

    container.innerHTML = "";
    db.collection("posts").doc(postID).collection("comments")
        .doc(commentID).collection("replies")
        .orderBy("timestamp", "asc")
        .get().then(snapshot => {
            snapshot.forEach(doc => {
                const data = doc.data();
                const time = data.timestamp?.toDate().toLocaleString() || "Time unknown";
                const replyDiv = document.createElement("div");
                replyDiv.className = "border rounded p-2 mb-1 bg-light";
                replyDiv.innerHTML = `<strong>${data.userName}</strong> <small>${time}</small><br>${data.text}`;
                container.appendChild(replyDiv);
            });
        });
}

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

// Check if post is bookmarked
function checkBookmarkStatus() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const bookmarkRef = db.collection("users").doc(user.uid).collection("bookmarks").doc(ID);
            const bookmarkBtn = document.querySelector(".bookmark-btn i");

            bookmarkRef.get().then(doc => {
                if (doc.exists) {
                    bookmarkBtn.classList.remove("fa-regular");
                    bookmarkBtn.classList.add("fa-solid");
                }
            });
        }
    });
}

// Contact seller
function contactSeller() {
    const sellerID = document.querySelector("[data-owner-id]").getAttribute("data-owner-id");
    window.location.href = `message.html?userId=${sellerID}`;
}

// Initialize post details
function initializePost() {
    displayGlassInfo();
    checkBookmarkStatus();
    setupComments();
}

// Call initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePost);


