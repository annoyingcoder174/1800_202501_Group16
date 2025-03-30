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
        }
    });
}

// Bookmark logic
function toggleBookmark(postID) {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return alert("Please log in to bookmark.");
        const ref = db.collection("users").doc(user.uid).collection("bookmarks").doc(postID);
        ref.get().then(doc => {
            if (doc.exists) {
                ref.delete();
                document.getElementById("bookmark-btn").innerHTML = "<i class='fa-regular fa-bookmark'></i>";
            } else {
                ref.set({ bookmarkedAt: firebase.firestore.FieldValue.serverTimestamp() });
                document.getElementById("bookmark-btn").innerHTML = "<i class='fa-solid fa-bookmark'></i>";
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
        }).then(() => alert("Product added to cart!"));
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
        .get().then(snapshot => {
            snapshot.forEach(doc => {
                const comment = doc.data();
                const time = comment.timestamp?.toDate().toLocaleString() || "Unknown";
                const card = document.createElement("div");
                card.className = "card mb-2";
                card.innerHTML = `
                  <div class="card-body">
                    <h6 class="card-subtitle mb-1 text-muted">${comment.userName} <small>${time}</small></h6>
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
