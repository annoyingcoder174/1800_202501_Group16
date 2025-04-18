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
        if (!doc.exists) return;

        const data = doc.data();

        // Display product data
        document.getElementById("glassTitle").innerText = data.name || "Untitled";
        document.getElementById("glassDetails").innerText = data.details || "No description";
        document.getElementById("glassPrice").innerText = "Price: $" + (data.price || "N/A");
        document.getElementById("glassRightEye").innerText = "Right Eye: " + (data.rightEye ?? "N/A");
        document.getElementById("glassLeftEye").innerText = "Left Eye: " + (data.leftEye ?? "N/A");
        document.getElementById("glassLocation").innerText = "Location: " + (data.location || "N/A");

        // Display image
        const img = document.querySelector(".glass-img");
        img.src = data.image ? "data:image/png;base64," + data.image : "./images/placeholder.jpg";

        // Save email globally
        ownerEmail = data.email || null;

        const contactBtn = document.getElementById("contactSellerBtn");
        const addToCartBtn = document.querySelector(".cart-btn");

        firebase.auth().onAuthStateChanged(currentUser => {
            // Enable Contact Button
            if (currentUser && data.owner && data.owner !== currentUser.uid) {
                db.collection("users").doc(data.owner).get().then(userDoc => {
                    if (userDoc.exists) {
                        const sellerName = encodeURIComponent(userDoc.data().name || "Seller");
                        contactBtn.setAttribute("href", `chat.html?userId=${data.owner}&userName=${sellerName}`);
                        contactBtn.classList.remove("disabled");
                        contactBtn.innerHTML = `<i class='fa-solid fa-envelope'></i> Contact Seller`;
                    }
                });
            } else {
                contactBtn.classList.add("disabled");
                contactBtn.innerHTML = `<i class='fa-solid fa-envelope'></i> Not Available`;
            }

            // Enable "Add to Cart"
            if (addToCartBtn && currentUser) {
                addToCartBtn.addEventListener("click", () => addToCart(ID, data));
            }
        });

        // Fetch poster info
        if (data.owner) {
            db.collection("users").doc(data.owner).get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    document.getElementById("poster-name").innerText = userData.name || "Unknown";
                    const profilePic = userData.profilePic || "https://via.placeholder.com/150";
                    document.getElementById("poster-profile-pic").src = profilePic;

                    const profileURL = `eachUser.html?userId=${data.owner}`;
                    document.getElementById("poster-link").href = profileURL;
                    document.getElementById("poster-link-name").href = profileURL;
                }
            });
        }

        // Show edit button if user is owner
        firebase.auth().onAuthStateChanged(user => {
            if (user && data.owner === user.uid) {
                const editBtn = document.querySelector(".edit-btn");
                editBtn.style.display = "block";
                editBtn.addEventListener("click", () => {
                    window.location.href = `editPost.html?docID=${ID}`;
                });
                document.querySelector(".delete-btn").style.display = "block";
            }
        });

        checkIfBookmarked(ID);
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
                bookmarkRef.set({ savedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
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

function addToCart(postID, product) {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return alert("Log in first!");

        db.collection("users").doc(user.uid).collection("cart").doc(postID).set({
            name: product.name,
            price: parseFloat(product.price || 0),
            image: product.image || "",
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            showToast("✔️ Product added to cart!");
        }).catch(error => {
            showToast("❌ Failed to add to cart.");
            console.error("Error adding to cart:", error);
        });
    });
}
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}




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
function loadComments(postID) {
    const list = document.getElementById("comment-list");
    list.innerHTML = "";

    db.collection("posts").doc(postID).collection("comments")
        .orderBy("timestamp", "asc")
        .onSnapshot(snapshot => {
            list.innerHTML = "";
            snapshot.forEach(async doc => {
                const data = doc.data();
                const commentID = doc.id;

                // Fetch user info from users collection
                const userDoc = await db.collection("users").doc(data.userId).get();
                const userData = userDoc.exists ? userDoc.data() : {};
                const userName = userData.name || data.userName || "Anonymous";
                const profilePic = userData.profilePic || "https://via.placeholder.com/40";

                const commentDiv = document.createElement("div");
                commentDiv.classList.add("comment-box", "mb-3");
                commentDiv.innerHTML = `
                    <div class="d-flex align-items-start gap-3">
                        <img src="${profilePic}" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">
                        <div>
                            <p class="mb-1"><strong>${userName}</strong> 
                                <small class="text-muted">(${new Date(data.timestamp?.toDate()).toLocaleString()})</small>
                            </p>
                            <p class="mb-2">${data.text}</p>
                            <div class="d-flex align-items-center mb-2">
                                <button class="btn btn-sm btn-outline-secondary me-2" onclick="toggleCommentLike('${postID}', '${commentID}')" data-comment="${commentID}">
                                    <i class="fa-regular fa-thumbs-up"></i> <span class="like-count">0</span>
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="toggleReplyForm('${commentID}')">
                                    <i class="fa-solid fa-reply"></i> Reply
                                </button>
                            </div>
                            <div class="reply-form-container" id="reply-form-${commentID}" style="display: none;">
                                <form class="d-flex mb-2" onsubmit="submitReply(event, '${postID}', '${commentID}')">
                                    <input type="text" class="form-control me-2" placeholder="Write a reply..." required />
                                    <button type="submit" class="btn btn-sm btn-success">Reply</button>
                                </form>
                            </div>
                            <div class="replies" id="replies-${commentID}"></div>
                        </div>
                    </div>
                `;

                list.appendChild(commentDiv);

                const likeCount = commentDiv.querySelector(".like-count");
                updateCommentLikeCount(postID, commentID, likeCount);

                const repliesContainer = commentDiv.querySelector(`#replies-${commentID}`);
                if (repliesContainer) loadReplies(postID, commentID, repliesContainer);
            });
        });
}
function submitReply(event, postID, commentID) {
    event.preventDefault(); // Prevent form from reloading the page

    const form = event.target;
    const input = form.querySelector("input");
    const text = input.value.trim();

    if (!text) return;

    firebase.auth().onAuthStateChanged(async user => {
        if (!user) return alert("Please log in to reply.");

        // Fetch the latest name from Firestore
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userName = userDoc.exists ? userDoc.data().name || "User" : "User";

        db.collection("posts").doc(postID)
            .collection("comments").doc(commentID)
            .collection("replies").add({
                userId: user.uid,
                userName,
                text,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                input.value = ""; // Clear after sending
            });
    });
}



function submitComment(postID) {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return alert("Log in to comment.");
        const input = document.getElementById("comment-input");
        const text = input.value.trim();
        if (!text) return;

        db.collection("posts").doc(postID).collection("comments").add({
            userId: user.uid,
            userName: user.displayName || "User",
            text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            input.value = "";
        });
    });
}

function toggleCommentLike(postID, commentID) {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return alert("Please log in to like comments.");

        const likeRef = db.collection("posts").doc(postID)
            .collection("comments").doc(commentID)
            .collection("likes").doc(user.uid);

        likeRef.get().then(doc => {
            const icon = document.querySelector(`[data-comment="${commentID}"] i`);
            if (doc.exists) {
                likeRef.delete().then(() => {
                    if (icon) icon.classList.replace("fa-solid", "fa-regular");
                });
            } else {
                likeRef.set({ likedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
                    if (icon) icon.classList.replace("fa-regular", "fa-solid");
                });
            }
        });
    });
}

function updateCommentLikeCount(postID, commentID, element) {
    db.collection("posts").doc(postID)
        .collection("comments").doc(commentID)
        .collection("likes")
        .onSnapshot(snapshot => {
            element.textContent = snapshot.size;
        });
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
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
function replyToComment(commentID) {
    const replyText = prompt("Write your reply:");
    if (!replyText) return;

    firebase.auth().onAuthStateChanged(user => {
        if (!user) return alert("Log in to reply.");

        const postID = getDocID();

        db.collection("posts").doc(postID)
            .collection("comments").doc(commentID)
            .collection("replies")
            .add({
                userId: user.uid,
                userName: user.displayName || "User",
                text: replyText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
    });
}
function loadReplies(postID, commentID, container) {
    db.collection("posts").doc(postID)
        .collection("comments").doc(commentID)
        .collection("replies")
        .orderBy("timestamp", "asc")
        .onSnapshot(snapshot => {
            container.innerHTML = ""; // Clear before updating
            snapshot.forEach(async doc => {
                const data = doc.data();

                // Fetch user info from users collection
                const userDoc = await db.collection("users").doc(data.userId).get();
                const userData = userDoc.exists ? userDoc.data() : {};
                const userName = userData.name || data.userName || "Anonymous";
                const profilePic = userData.profilePic || "https://via.placeholder.com/40";

                const replyDiv = document.createElement("div");
                replyDiv.classList.add("d-flex", "align-items-start", "gap-3", "ms-4", "mt-3");

                replyDiv.innerHTML = `
                    <img src="${profilePic}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
                    <div class="p-2 border rounded bg-light w-100">
                        <p class="mb-1"><strong>${userName}</strong> 
                          <small class="text-muted">(${new Date(data.timestamp?.toDate()).toLocaleString()})</small></p>
                        <p class="mb-0">${data.text}</p>
                    </div>
                `;

                container.appendChild(replyDiv);
            });
        });
}
function toggleReplyForm(commentID) {
    const replyBox = document.getElementById(`reply-form-${commentID}`);
    if (replyBox) {
        replyBox.style.display = replyBox.style.display === "none" ? "block" : "none";
    }
}
