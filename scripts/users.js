const userListContainer = document.getElementById("user-list-container");
const userCardTemplate = document.getElementById("user-card-template");

function fetchUsers() {
  userListContainer.innerHTML = ""; // Clear previous list

  db.collection("users").get().then(snapshot => {
    snapshot.forEach(doc => {
      const user = doc.data();
      const userId = doc.id; // Get user ID

      // Clone the template
      const userCard = userCardTemplate.content.cloneNode(true);

      // Fill in user details
      userCard.querySelector(".profile-pic").src = user.profilePicture || "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
      userCard.querySelector(".user-name").textContent = user.name;
      userCard.querySelector(".user-posts").textContent = user.posts || "0";
      userCard.querySelector(".user-sold").textContent = user.sold || "0";
      userCard.querySelector(".user-rating").textContent = user.rating || "0.0";

      // Add event listener for profile view
      const viewButton = userCard.querySelector(".view-profile");
      viewButton.setAttribute("data-user-id", userId);
      viewButton.addEventListener("click", function () {
        window.location.href = `eachUser.html?userId=${userId}`; // Redirect to profile
      });

      // Append to user list
      userListContainer.appendChild(userCard);
    });
  }).catch(error => console.error("Error fetching users: ", error));
}

// Fetch users on page load
fetchUsers();

