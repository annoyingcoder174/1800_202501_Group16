firebase.auth().onAuthStateChanged(authUser => {
  if (!authUser) {
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");

  if (!userId) {
    alert("No user ID provided.");
    return;
  }

  const userRef = db.collection("users").doc(userId);

  userRef.get().then(doc => {
    if (doc.exists) {
      const user = doc.data();

      // User info
      document.getElementById("user-name").textContent = user.name || "Unknown User";
      document.getElementById("user-location").textContent = user.location || "Unknown";
      document.getElementById("user-bio").textContent = user.bio || "No bio available";
      document.getElementById("profile-pic").src = user.profilePic ||
        "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";

      // Redirect to chat with userId and userName
      document.getElementById("messageBtn").addEventListener("click", () => {
        window.location.href = `chat.html?userId=${userId}&userName=${encodeURIComponent(user.name || "Unknown")}`;
      });

      loadPosts(userId);
      countReactions(userId);
      calculateRating(userId);
    } else {
      alert("User not found.");
    }
  }).catch(error => {
    console.error("Error loading user:", error);
  });
});


// Load user posts
function loadPosts(uid) {
  db.collection("posts").where("owner", "==", uid).get().then(snapshot => {
    document.getElementById("user-posts").textContent = snapshot.size;
    const container = document.getElementById("recent-posts");
    container.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const post = document.createElement("div");
      post.className = "col-4 mb-2";
      post.innerHTML = `
        <a href="posts.html?docID=${doc.id}" class="text-decoration-none">
          <img src="data:image/png;base64,${data.image}" class="img-fluid rounded" style="aspect-ratio: 1/1; object-fit: cover;">
        </a>
      `;
      container.appendChild(post);
    });
  });
}

// Load total reactions
function countReactions(uid) {
  db.collection("posts").where("owner", "==", uid).get().then(snapshot => {
    let totalLikes = 0;
    const fetches = snapshot.docs.map(doc =>
      db.collection("posts").doc(doc.id).collection("likes").get().then(likeSnap => {
        totalLikes += likeSnap.size;
      })
    );
    Promise.all(fetches).then(() => {
      document.getElementById("user-reactions").textContent = totalLikes;
    });
  });
}

// Load rating
function calculateRating(uid) {
  db.collection("posts").where("owner", "==", uid).get().then(snapshot => {
    const ratingFetches = snapshot.docs.map(doc =>
      db.collection("posts").doc(doc.id).collection("ratings").get().then(ratingSnap => {
        return ratingSnap.docs.map(r => r.data().rating);
      })
    );
    Promise.all(ratingFetches).then(ratingArrays => {
      const allRatings = ratingArrays.flat();
      const avg = allRatings.length
        ? (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1)
        : "0.0";
      document.getElementById("user-rating").textContent = avg;
    });
  });
}
