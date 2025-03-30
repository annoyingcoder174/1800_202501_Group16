firebase.auth().onAuthStateChanged(user => {
    if (user) {
        const container = document.getElementById("posts-go-here");
        const cardTemplate = document.getElementById("postsCardTemplate");

        const userBookmarksRef = db.collection("users").doc(user.uid).collection("bookmarks");

        userBookmarksRef.get().then(snapshot => {
            if (snapshot.empty) {
                container.innerHTML = "<p class='text-center'>No bookmarks yet.</p>";
                return;
            }

            snapshot.forEach(doc => {
                const postID = doc.id;

                db.collection("posts").doc(postID).get().then(postDoc => {
                    if (postDoc.exists) {
                        const data = postDoc.data();
                        const card = cardTemplate.content.cloneNode(true);

                        card.querySelector(".card-title").textContent = data.name || "Untitled";
                        card.querySelector(".card-text").textContent = data.details || "No description";
                        card.querySelector(".card-prescription").innerHTML = `
                Prescription: ${data.prescription ?? "N/A"}<br>
                Location: ${data.location || "Unknown"}<br>
                Last updated: ${data.last_updated?.toDate().toLocaleDateString() || "Unknown"}
              `;
                        card.querySelector(".card-image").src = data.image
                            ? "data:image/png;base64," + data.image
                            : "./images/placeholder.png";

                        card.querySelector("a").href = `posts.html?docID=${postID}`;

                        container.appendChild(card);
                    }
                });
            });
        });
    } else {
        document.getElementById("posts-go-here").innerHTML = "<p class='text-center'>Please log in to see your bookmarks.</p>";
    }
});
