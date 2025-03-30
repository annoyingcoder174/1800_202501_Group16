firebase.auth().onAuthStateChanged(user => {
    if (user) {
        const cartRef = db.collection("users").doc(user.uid).collection("cart");
        const cartContainer = document.getElementById("cart-items");

        let subtotal = 0;

        cartRef.get().then(snapshot => {
            if (snapshot.empty) {
                cartContainer.innerHTML = `<p class="text-center">Your cart is empty.</p>`;
                return;
            }

            snapshot.forEach(doc => {
                const item = doc.data();
                const postID = doc.id;
                const price = parseFloat(item.price || 0);
                subtotal += price;

                const card = document.createElement("div");
                card.className = "col";
                card.innerHTML = `
            <div class="card mb-3">
              <div class="row g-0 align-items-center">
                <div class="col-md-4">
                  <img src="${item.image ? "data:image/png;base64," + item.image : "./images/placeholder.png"}" 
                       class="img-fluid rounded-start" alt="${item.name}">
                </div>
                <div class="col-md-7">
                  <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text">Price: $${price.toFixed(2)}</p>
                  </div>
                </div>
                <div class="col-md-1 text-end pe-3">
                  <button class="btn btn-sm btn-danger" onclick="removeFromCart('${postID}')">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
                cartContainer.appendChild(card);
            });

            // Calculate tax + total
            const tax = subtotal * 0.1;
            const total = subtotal + tax;
            document.getElementById("subtotal").textContent = subtotal.toFixed(2);
            document.getElementById("tax").textContent = tax.toFixed(2);
            document.getElementById("total").textContent = total.toFixed(2);
        });
    } else {
        window.location.href = "login.html";
    }
});

// Function to remove item from cart
function removeFromCart(postID) {
    const user = firebase.auth().currentUser;
    if (user) {
        db.collection("users")
            .doc(user.uid)
            .collection("cart")
            .doc(postID)
            .delete()
            .then(() => {
                // Refresh page after deletion
                location.reload();
            })
            .catch(error => {
                console.error("Error removing item:", error);
            });
    }
}
