var ImageFile;
function listenFileSelect() {
    // listen for file selection
   document.getElementById("mypic-input").addEventListener('change', function (e) {
        file = e.target.files[0];
        if (file) {
            var reader = new FileReader(); // Create a FileReader to read the file

            // When file reading is complete, save it as global variable, 
            // and display it on the page
            reader.onload = function (e) {
                ImageString = e.target.result.split(',')[1]; // Extract Base64 data
                var imgElement = document.getElementById("image-goes-here");
                imgElement.src = "data:image/png;base64," + ImageString;
            };

            // Read the file as a Data URL (Base64 encoding)
            reader.readAsDataURL(file);
        }
    })
}
listenFileSelect();

function savePost() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in.
            // Do something for the user here. 
            var name = document.getElementById("name").value;
            var details = document.getElementById("details").value;
            var prescription = document.getElementById("prescription").value;
            var location = document.getElementById("location").value;

            db.collection("posts").add({
                owner: user.uid,
                name: name,
                details: details,
                prescription: prescription,
                location: location,
                image: ImageString,    //save the image!
                last_updated: firebase.firestore.FieldValue
                    .serverTimestamp() //current system time
            }).then(doc => {
                savePostIDforUser(doc.id);
                console.log(doc.id);
                uploadPic(doc.id);
                
            })
        } else {
            // No user is signed in.
                          console.log("Error, no user signed in");
        }
    });
}

//--------------------------------------------
//saves the post ID for the user, in an array
//--------------------------------------------
function savePostIDforUser(postDocID) {
    firebase.auth().onAuthStateChanged(user => {
          console.log("user id is: " + user.uid);
          console.log("postdoc id is: " + postDocID);
          db.collection("users").doc(user.uid).update({
                myposts: firebase.firestore.FieldValue.arrayUnion(postDocID)
          })
          .then(() =>{
                console.log("5. Saved to user's document!");
                window.location.href = "main.html";
           })
           .catch((error) => {
                console.error("Error writing document: ", error);
           });
    })
}