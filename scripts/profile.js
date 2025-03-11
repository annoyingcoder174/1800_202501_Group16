// Fetch the user data
firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const userRef = db.collection('users').doc(user.uid);
      userRef.get().then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          
          // Update profile information
          document.getElementById("user-name").textContent = userData.name;
          document.getElementById("user-location").textContent = userData.location || "Location not available";
          document.getElementById("profile-pic").src = userData.profilePicURL || "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-profiles/avatar-1.webp";
          
          // Update post count, sold count, and rating
          document.getElementById("user-posts").textContent = userData.postsCount || 0;
          document.getElementById("user-sold").textContent = userData.soldCount || 0;
          document.getElementById("user-rating").textContent = userData.rating || 0;
  
          // Update bio
          document.getElementById("user-bio").textContent = userData.bio || "No bio available";
          
          // Fetch recent posts (images)
          getRecentPosts(user.uid);
        }
      });
    } else {
      // Redirect to login if not authenticated
      window.location.href = "login.html";
    }
  });
  
  // Fetch recent posts from Firestore
  function getRecentPosts(uid) {
    const postsRef = db.collection("posts").where("uid", "==", uid).orderBy("timestamp", "desc").limit(4);
    postsRef.get().then(snapshot => {
      const postsContainer = document.getElementById("recent-posts");
      snapshot.forEach(doc => {
        const postData = doc.data();
        const postImg = document.createElement("div");
        postImg.classList.add("col", "mb-2");
  
        const img = document.createElement("img");
        img.src = postData.imageURL || "https://via.placeholder.com/300"; // Default image if none exists
        img.alt = "Post image";
        img.classList.add("w-100", "rounded-3");
  
        postImg.appendChild(img);
        postsContainer.appendChild(postImg);
      });
    });
  }
  