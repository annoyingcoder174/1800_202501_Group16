// Get userId from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get("userId");

if (userId) {
  // Fetch user data from Firestore
  db.collection("users").doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const user = doc.data();

        // User details
        document.getElementById("profile-pic").src = user.profilePicture || 
        "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
        document.getElementById("user-name").textContent = user.name || "Unknown User";
        document.getElementById("user-location").textContent = user.location || "Location not provided";
        document.getElementById("user-posts").textContent = user.posts || "0";
        document.getElementById("user-sold").textContent = user.sold || "0";
        document.getElementById("user-rating").textContent = user.rating || "0.0";
        document.getElementById("user-bio").textContent = user.bio || "No bio available";

        // Load recent posts dynamically if they exist
        const recentPostsContainer = document.getElementById("recent-posts");
        recentPostsContainer.innerHTML = "";

        if (user.recentPosts && user.recentPosts.length > 0) {
          user.recentPosts.forEach(post => {
            const postElement = document.createElement("div");
            postElement.classList.add("col-6");
            postElement.innerHTML = `
              <div class="card">
                <div class="card-body">
                  <p class="card-text">${post}</p>
                </div>
              </div>
            `;
            recentPostsContainer.appendChild(postElement);
          });
        } else {
          recentPostsContainer.innerHTML = "<p>No recent posts available.</p>";
        }
      } else {
        console.error("User not found");
      }
    })
    .catch(error => console.error("Error fetching user: ", error));
} else {
  console.error("No user ID provided in URL");
}
