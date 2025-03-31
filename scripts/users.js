const userListContainer = document.getElementById("user-list-container");
const userCardTemplate = document.getElementById("user-card-template");

function fetchUsers() {
  userListContainer.innerHTML = ""; // Clear previous list

  db.collection("users").get().then(snapshot => {
    snapshot.forEach(doc => {
      const user = doc.data();
      const userId = doc.id;

      const userCard = userCardTemplate.content.cloneNode(true);

      // Profile picture
      const profileImg = userCard.querySelector(".profile-pic");
      if (user.profilePicture) {
        profileImg.src = user.profilePicture;
      } else {
        profileImg.style.display = "none"; // Hide if not available
      }

      // Name
      userCard.querySelector(".user-name").textContent = user.name || "Unnamed";

      // Hide stats block (Posts, Reactions, Rating)
      const statsBlock = userCard.querySelector(".user-stats");
      if (statsBlock) statsBlock.style.display = "none";

      // View profile button
      const viewButton = userCard.querySelector(".view-profile");
      viewButton.setAttribute("data-user-id", userId);
      viewButton.addEventListener("click", () => {
        window.location.href = `eachUser.html?userId=${userId}`;
      });

      userListContainer.appendChild(userCard);
    });
  }).catch(error => {
    console.error("Error fetching users: ", error);
  });
}

// Fetch users on page load
fetchUsers();
