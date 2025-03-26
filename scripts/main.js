// Show user name from Firebase Auth
function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            $("#name-goes-here").text(user.displayName || "User");
        } else {
            console.log("No user is logged in");
        }
    });
}
getNameFromAuth();

function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("postsCardTemplate"); // Ensure this matches your HTML template ID
    if (!cardTemplate) {
        console.error("Template with ID 'postsCardTemplate' not found.");
        return;
    }

    db.collection(collection).get()   //the collection called "posts"
        .then(allPosts => {
            allPosts.forEach(doc => { //iterate thru each doc

                var title = doc.data().name;       // get value of the "code" key
                var details = doc.data().details;  // get value of the "details" key
                var postCode = doc.data().code;    //get unique ID to each post to be used for fetching right image
                let newcard = cardTemplate.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

                //update title and text and image
                newcard.querySelector('.card-title').innerHTML = title;
                newcard.querySelector('.card-text').innerHTML = details;
                newcard.querySelector('.card-image').src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg
                newcard.querySelector('a').href = "posts.html?docID=" + docID;

                //attach to gallery, Example: "posts-go-here"
                document.getElementById(collection + "-go-here").appendChild(newcard);
            });
        })
        .catch(error => {
            console.error("Error fetching documents: ", error);
        });
}
displayCardsDynamically("posts"); //invoke the function

// Display cards based on selected filters
function displayCardsWithFilters(filters = {}) {
    const container = document.getElementById("posts-go-here");
    const cardTemplate = document.getElementById("postsCardTemplate");
    container.innerHTML = "";

    db.collection("posts").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            let match = true;

            // Filter: Type
            if (filters.types?.length && !filters.types.includes(data.category)) {
                match = false;
            }

            // Filter: Location
            if (filters.locations?.length && !filters.locations.includes(data.location)) {
                match = false;
            }

            // Filter: Price Range
            if (filters.prices?.length) {
                const price = data.price || 0;
                const priceMatch = filters.prices.some(range => {
                    const [min, max] = range.split("-").map(Number);
                    return price >= min && price <= max;
                });
                if (!priceMatch) match = false;
            }

            // Display card if all filters match
            if (match) {
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
                    : "./images/placeholder.png"; // fallback image
                card.querySelector("a").href = `posts.html?docID=${doc.id}`;

                container.appendChild(card);
            }
        });
    });
}

// Collect selected filters from UI
function applySelectedFilters() {
    const types = Array.from(document.querySelectorAll(".filter-type:checked")).map(cb => cb.value);
    const prices = Array.from(document.querySelectorAll(".filter-price:checked")).map(cb => cb.value);
    const locations = Array.from(document.querySelectorAll(".filter-location:checked")).map(cb => cb.value);

    const filters = {
        types,
        prices,
        locations
    };

    displayCardsWithFilters(filters);
}

// On page load
document.addEventListener("DOMContentLoaded", () => {
    displayCardsWithFilters(); // Default: show all

    const applyBtn = document.getElementById("applyFiltersBtn");
    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            applySelectedFilters();

            // Close filter panel (Bootstrap offcanvas)
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById("filterPanel"));
            if (offcanvas) offcanvas.hide();
        });
    }
});
