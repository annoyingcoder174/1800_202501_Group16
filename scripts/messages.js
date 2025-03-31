firebase.auth().onAuthStateChanged(currentUser => {
  if (!currentUser) return;

  const currentUID = currentUser.uid;
  const messageList = document.getElementById("message-list");
  messageList.innerHTML = "";

  db.collection("messages").get().then(snapshot => {
    if (snapshot.empty) {
      messageList.innerHTML = "<p class='text-muted'>No conversations yet.</p>";
      return;
    }

    const chatPromises = [];

    snapshot.forEach(doc => {
      const chatRoomId = doc.id;

      if (!chatRoomId.includes(currentUID)) return;

      const [uid1, uid2] = chatRoomId.split("_");
      const partnerId = uid1 === currentUID ? uid2 : uid1;

      const chatPromise = db
        .collection("messages")
        .doc(chatRoomId)
        .collection("chats")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get()
        .then(chatSnapshot => {
          if (chatSnapshot.empty) return;

          const lastMessage = chatSnapshot.docs[0].data();
          const text = lastMessage.text || "[No message]";
          const time = lastMessage.timestamp?.toDate();
          const timeLabel = time
            ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : "";

          return db.collection("users").doc(partnerId).get().then(userDoc => {
            if (!userDoc.exists) return;

            const user = userDoc.data();
            const userName = user.name || "Unknown User";

            const chatItem = document.createElement("a");
            chatItem.href = `chat.html?userId=${partnerId}&userName=${encodeURIComponent(userName)}`;
            chatItem.className = "d-block text-decoration-none text-dark border-bottom p-3";

            chatItem.innerHTML = `
              <div class="d-flex justify-content-between align-items-center">
                <strong>${userName}</strong>
                <small class="text-muted">${timeLabel}</small>
              </div>
              <div class="text-muted text-truncate">${text}</div>
            `;

            messageList.appendChild(chatItem);
          });
        });

      chatPromises.push(chatPromise);
    });

    return Promise.all(chatPromises);
  }).catch(error => {
    console.error("Error loading messages:", error);
    messageList.innerHTML = `<p class="text-danger">Failed to load messages.</p>`;
  });
});
