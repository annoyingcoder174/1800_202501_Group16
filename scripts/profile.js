firebase.auth().onAuthStateChanged(user => {
    if (user) {
        const userRef = db.collection('users').doc(user.uid);

        userRef.get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();

                // Basic Info
                document.getElementById("user-name").textContent = userData.name || "Unknown User";
                document.getElementById("user-location").textContent = userData.location || "Location not provided";
                document.getElementById("user-bio").textContent = userData.bio || "No bio available";

                // Avatar with fallback
                document.getElementById("profile-pic").src = userData.profilePic ||
                    "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";

                // Dynamic Stats
                loadUserPosts(user.uid);
                countUserReactions(user.uid);
                calculateAveragePostRatings(user.uid);
            }
        }).catch(error => {
            console.error("Error fetching user data:", error);
        });

    } else {
        window.location.href = "login.html";
    }
});

// 🔐 Logout
document.getElementById("logout").addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
});

// 📸 Show user’s previous posts in 3x3 Instagram-style grid
function loadUserPosts(uid) {
    db.collection("posts").where("owner", "==", uid).get().then(snapshot => {
        const posts = snapshot.docs;
        document.getElementById("user-posts").textContent = posts.length;

        const container = document.getElementById("recent-posts");
        container.innerHTML = "";

        posts.forEach(doc => {
            const data = doc.data();
            const postCard = document.createElement("div");
            postCard.className = "col-4 mb-2"; // Responsive 3x3 grid
            postCard.innerHTML = `
                <a href="posts.html?docID=${doc.id}" class="text-decoration-none">
                    <img src="data:image/png;base64,${data.image}" class="img-fluid rounded" alt="Post Image" style="aspect-ratio: 1 / 1; object-fit: cover;" />
                </a>
            `;
            container.appendChild(postCard);
        });
    });
}

// 🧡 Count all likes across the user's posts
function countUserReactions(uid) {
    db.collection("posts").where("owner", "==", uid).get().then(snapshot => {
        const postIDs = snapshot.docs.map(doc => doc.id);
        let totalLikes = 0;

        const likeFetches = postIDs.map(postID =>
            db.collection("posts").doc(postID).collection("likes").get().then(likeSnap => {
                totalLikes += likeSnap.size;
            })
        );

        Promise.all(likeFetches).then(() => {
            document.getElementById("user-reactions").textContent = totalLikes;
        });
    });
}

// ⭐ Calculate average rating from all the user's posts
function calculateAveragePostRatings(uid) {
    db.collection("posts").where("owner", "==", uid).get().then(snapshot => {
        const postDocs = snapshot.docs;
        const ratingFetches = [];

        postDocs.forEach(postDoc => {
            const postID = postDoc.id;
            const ratingsRef = db.collection("posts").doc(postID).collection("ratings");

            const fetch = ratingsRef.get().then(ratingSnap => {
                const ratings = ratingSnap.docs.map(doc => doc.data().rating);
                return ratings;
            });

            ratingFetches.push(fetch);
        });

        Promise.all(ratingFetches).then(allRatingsArrays => {
            const allRatings = allRatingsArrays.flat();
            const average = allRatings.length
                ? (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1)
                : "0.0";
            document.getElementById("user-rating").textContent = average;
        });
    });
}
