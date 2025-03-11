function getNameFromAuth() {
    firebase.auth().onAuthStateChanged(user => {
        // Check if a user is signed in:
        if (user) {
            // Do something for the currently logged-in user here: 
            console.log(user.uid); //print the uid in the browser console
            console.log(user.displayName);  //print the user name in the browser console
            userName = user.displayName;

            //method #1:  insert with JS
            //document.getElementById("name-goes-here").innerText = userName;    

            //method #2:  insert using jquery
            $("#name-goes-here").text(userName); //using jquery

            //method #3:  insert using querySelector
            //document.querySelector("#name-goes-here").innerText = userName

        } else {
            // No user is signed in.
            console.log("No user is logged in");
        }
    });
}
getNameFromAuth(); //run the function

function writeGlasses() {
    //define a variable for the collection you want to create in Firestore to populate data
    var postsRef = db.collection("posts");

    postsRef.add({
        code: "posts01",
        details: "Rayban sunglasses",
        geolocation: [49.2827, -123.1207], // Example location (Vancouver)
        location: "Surrey",
        owner: "userID123",  // Replace with actual user ID dynamically
        prescription: -3,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    });
    postsRef.add({
        code: "posts02",
        details: "Black Retro-Vintage Flexible Round Eyeglasses",
        geolocation: [49.2827, -123.1207], // Example location (Vancouver)
        location: "Burnaby",
        owner: "userID123",  // Replace with actual user ID dynamically
        prescription: -3,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    });
    postsRef.add({
        code: "posts03",
        details: "Square glasses sunglasses",
        geolocation: [49.2827, -123.1207], // Example location (Vancouver)
        location: "Vancouver",
        owner: "userID123",  // Replace with actual user ID dynamically
        prescription: -3,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    });
    postsRef.add({
        code: "glasses01",
        details: "Rayban sunglasses",
        geolocation: [49.2827, -123.1207], // Example location (Vancouver)
        location: "Surrey",
        owner: "userID123",  // Replace with actual user ID dynamically
        prescription: -3,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    });
}

//------------------------------------------------------------------------------
// Input parameter is a string representing the collection we are reading from
//------------------------------------------------------------------------------
function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("postsCardTemplate"); // Retrieve the HTML element with the ID "hikeCardTemplate" and store it in the cardTemplate variable. 

    db.collection(collection).get()   //the collection called "hikes"
        .then(allPosts => {
            //var i = 1;  //Optional: if you want to have a unique ID for each hike
            allPosts.forEach(doc => { //iterate thru each doc
                var docID = doc.id;               // get the unique ID of the document
                var title = doc.data().code;       // get value of the "name" key
                var details = doc.data().details;  // get value of the "details" key
                var postsCode = doc.data().code;    //get unique ID to each hike to be used for fetching right image
                var hikeLength = doc.data().length; //gets the length field
                let newcard = cardTemplate.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

                //update title and text and image
                newcard.querySelector('.card-title').innerHTML = title;
                newcard.querySelector('.card-length').innerHTML = hikeLength + "km";
                newcard.querySelector('.card-text').innerHTML = details;
                newcard.querySelector('.card-image').src = `./images/${postsCode}.jpg`; //Example: NV01.jpg
                newcard.querySelector('a').href = "posts.html?docID=" + docID;

                //Optional: give unique ids to all elements for future use
                // newcard.querySelector('.card-title').setAttribute("id", "ctitle" + i);
                // newcard.querySelector('.card-text').setAttribute("id", "ctext" + i);
                // newcard.querySelector('.card-image').setAttribute("id", "cimage" + i);

                //attach to gallery, Example: "hikes-go-here"
                document.getElementById(collection + "-go-here").appendChild(newcard);

                //i++;   //Optional: iterate variable to serve as unique ID
            })
        })
}

displayCardsDynamically("posts");  //input param is the name of the collection
