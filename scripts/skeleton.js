//---------------------------------------------------
// This function loads the parts of your skeleton 
// (navbar, footer, and other things) into html doc. 
//---------------------------------------------------
function loadSkeleton() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {                   
            // If the "user" variable is not null, then someone is logged in
            // User is signed in.
            // Do something for the user here.
            console.log($('#navbarPlaceholder').load('./text/nav_after_login.html'));
            console.log($('#footerPlaceholder').load('./text/footer.html'));
        } else {
            // No user is signed in.
            console.log($('#navbarPlaceholder').load('./text/nav_before_login.html'));
            console.log($('#footerPlaceholder').load('./text/footer.html'));
        }
    });
}
loadSkeleton(); //invoke the function

//------------------------------------------------------------------------------
// Input parameter is a string representing the collection we are reading from
//------------------------------------------------------------------------------
function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("postsCardTemplate"); // Ensure this matches your HTML template ID
    if (!cardTemplate) {
        console.error("Template with ID 'postsCardTemplate' not found.");
        return;
    }

    db.collection(collection).get()   //the collection called "posts"
        .then(allPosts => {
            allPosts.forEach(doc => { //iterate thru each doc
                var docID = doc.id;               // get the unique ID of the document
                var title = doc.data().code;       // get value of the "code" key
                var details = doc.data().details;  // get value of the "details" key
                var hikeCode = doc.data().code;    //get unique ID to each post to be used for fetching right image
                var hikeLength = doc.data().length; //gets the length field
                let newcard = cardTemplate.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

                //update title and text and image
                newcard.querySelector('.card-title').innerHTML = title;
                newcard.querySelector('.card-length').innerHTML = hikeLength + "km";
                newcard.querySelector('.card-text').innerHTML = details;
                newcard.querySelector('.card-image').src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg
                newcard.querySelector('a').href = "eachHike.html?docID=" + docID;

                //attach to gallery, Example: "posts-go-here"
                document.getElementById(collection + "-go-here").appendChild(newcard);
            });
        })
        .catch(error => {
            console.error("Error fetching documents: ", error);
        });
}

displayCardsDynamically("posts");  //input param is the name of the collection