firebase.auth().onAuthStateChanged(currentUser => {
    if (!currentUser) return;

    const messageList = document.getElementById("message-list");
    const currentUID = currentUser.uid;

    db.collection("messages").get().then(snapshot => {
        snapshot.forEach(doc => {
            const chatRoomId = doc.id;

            // Check if current user is involved in this chat
            if (!chatRoomId.includes(currentUID)) return;

            // Get partner UID
            const [uid1, uid2] = chatRoomId.split("_");
            const partnerId = uid1 === currentUID ? uid2 : uid1;

            // Fetch partner info
            db.collection("users").doc(partnerId).get().then(userDoc => {
                if (!userDoc.exists) return;

                const userData = userDoc.data();
                const name = userData.name || "Unknown User";

                // Display chat preview
                const div = document.createElement("div");
                div.className = "col-12 mb-3";
                div.innerHTML = `
            <div class="card py-3 px-4">
              <a href="chat.html?userId=${partnerId}&userName=${encodeURIComponent(name)}" class="text-dark text-decoration-none">
                <div class="d-flex justify-content-between align-items-center">
                  <strong>${name}</strong>
                  <small>Tap to chat</small>
                </div>
              </a>
            </div>
          `;
                messageList.appendChild(div);
            });
        });

        if (snapshot.empty) {
            messageList.innerHTML = "<p class='text-muted'>No recent conversations.</p>";
        }
    }).catch(error => {
        console.error("Error fetching messages:", error);
        messageList.innerHTML = `<p class="text-danger">Error loading conversations.</p>`;
    });
});
