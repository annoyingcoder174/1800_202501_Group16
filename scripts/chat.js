firebase.auth().onAuthStateChanged(currentUser => {
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const partnerId = params.get("userId");
    const partnerName = decodeURIComponent(params.get("userName"));

    if (!partnerId || !partnerName) {
        alert("Missing user info.");
        return;
    }

    // Show partner's name in chat header
    document.getElementById("chat-recipient-name").textContent = partnerName;

    const chatRoomId = getChatRoomId(currentUser.uid, partnerId);
    const chatRoomRef = db.collection("messages").doc(chatRoomId);
    const chatsRef = chatRoomRef.collection("chats").orderBy("timestamp");

    // Listen for messages
    chatsRef.onSnapshot(snapshot => {
        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = "";

        snapshot.forEach(doc => {
            const msg = doc.data();
            const div = document.createElement("div");

            div.className = msg.sender === currentUser.uid ? "text-end my-2" : "text-start my-2";
            div.innerHTML = `
          <div class="d-inline-block p-2 rounded ${msg.sender === currentUser.uid ? 'bg-primary text-white' : 'bg-light'}">
            ${msg.text}
          </div>
        `;

            chatBox.appendChild(div);
        });

        // Auto-scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Send button logic
    document.getElementById("sendBtn").addEventListener("click", () => {
        const input = document.getElementById("messageInput");
        const text = input.value.trim();
        if (!text) return;

        const timestamp = firebase.firestore.FieldValue.serverTimestamp();

        // Ensure the parent document exists
        chatRoomRef.set({ active: true }, { merge: true });

        // Add message to subcollection
        chatRoomRef.collection("chats").add({
            text,
            sender: currentUser.uid,
            receiver: partnerId,
            timestamp
        }).then(() => {
            input.value = "";
        }).catch(error => {
            console.error("Error sending message:", error);
        });
    });
});

// Consistent chat room ID (sorted by UID)
function getChatRoomId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}
