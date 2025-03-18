// Fetch the user data
firebase.auth().onAuthStateChanged(user => {
  if (user) {
      const userRef = db.collection('users').doc(user.uid);
      userRef.get().then(doc => {
          if (doc.exists) {
              const userData = doc.data();

              // Profile information
              document.getElementById("user-name").textContent = userData.name || "No Name";
              document.getElementById("user-location").textContent = userData.location || "Location not available";
              document.getElementById("profile-pic").src = userData.profilePic || 
                  "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-profiles/avatar-1.webp";
              document.getElementById("user-posts").textContent = userData.posts || 0;
              document.getElementById("user-sold").textContent = userData.soldCount || 0;
              document.getElementById("user-rating").textContent = userData.rating || 0;
              document.getElementById("user-bio").textContent = userData.bio || "No bio available";
          }
      }).catch(error => {
          console.error("Error fetching user data:", error);
      });
  } else {
      // Redirect to login if not authenticated
      window.location.href = "login.html";
  }
});

// Logout function
function logout() {
  firebase.auth().signOut().then(() => {
      console.log("User logged out");
      window.location.href = "login.html"; // Redirect to login after logout
  }).catch(error => {
      console.error("Error logging out:", error);
  });
}

// Logout event listener
document.getElementById("logout").addEventListener("click", logout);

  

