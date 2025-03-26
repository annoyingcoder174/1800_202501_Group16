firebase.auth().onAuthStateChanged(user => {
    if (user) {
        let userBookmarksRef = db.collection("users").doc(user.uid).collection("bookmarks");
        userBookmarksRef.get().then(snapshot => {
            if (snapshot.empty) {
                document.getElementById("bookmarkedList").innerHTML = "<p class='text-center'>No bookmarks yet.</p>";
                return;
            }

            snapshot.forEach(doc => {
                let postID = doc.id;
                db.collection("posts").doc(postID).get().then(postDoc => {
                    if (postDoc.exists) {
                        let data = postDoc.data();
                        let cardHTML = `
          <div class="col-md-4 mb-4">
            <div class="card">
              <img src="./images/${data.code}.jpg" class="card-img-top" alt="${data.details}">
              <div class="card-body">
                <h5 class="card-title">${data.details}</h5>
                <a href="posts.html?docID=${postID}" class="btn btn-primary">View Details</a>
              </div>
            </div>
          </div>
        `;
                        document.getElementById("bookmarkedList").innerHTML += cardHTML;
                    }
                });
            });
        });
    } else {
        document.getElementById("bookmarkedList").innerHTML = "<p class='text-center'>Please log in to see your bookmarks.</p>";
    }
});