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

    // Show partner's name in header
    document.getElementById("chat-recipient-name").textContent = partnerName;

    const messagesRef = db.collection("messages")
        .doc(getChatRoomId(currentUser.uid, partnerId))
        .collection("chats")
        .orderBy("timestamp");

    messagesRef.onSnapshot(snapshot => {
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

        // Scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Send message
    document.getElementById("sendBtn").addEventListener("click", () => {
        const input = document.getElementById("messageInput");
        const text = input.value.trim();
        if (!text) return;

        db.collection("messages")
            .doc(getChatRoomId(currentUser.uid, partnerId))
            .collection("chats")
            .add({
                text,
                sender: currentUser.uid,
                receiver: partnerId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                input.value = "";
            });
    });
});

function getChatRoomId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}
