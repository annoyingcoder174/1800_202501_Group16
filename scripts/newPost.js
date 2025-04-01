var ImageFile;
var ImageString;  // Properly declare ImageString
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB max size

function listenFileSelect() {
    // listen for file selection
    document.getElementById("mypic-input").addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file (PNG, JPG, JPEG, GIF)');
                return;
            }

            // Check file size
            if (file.size > MAX_IMAGE_SIZE) {
                alert('Image size should be less than 5MB');
                return;
            }

            var reader = new FileReader();
            
            reader.onerror = function() {
                console.error('Error reading file');
                alert('Error reading the image file. Please try again.');
            };

            // When file reading is complete, save it as global variable, 
            // and display it on the page
            reader.onload = function (e) {
                try {
                    ImageString = e.target.result.split(',')[1]; // Extract Base64 data
                    var imgElement = document.getElementById("image-goes-here");
                    imgElement.src = e.target.result; // Use the complete data URL
                    imgElement.style.display = 'block'; // Make sure image is visible
                    ImageFile = file; // Save the file object
                } catch (error) {
                    console.error('Error processing image:', error);
                    alert('Error processing the image. Please try another image.');
                }
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
            var name = document.getElementById("name").value;
            var details = document.getElementById("details").value;
            var prescription = document.getElementById("prescription").value;
            var location = document.getElementById("location").value;
            var price = document.getElementById("price").value;

            // Validate required fields
            if (!name || !details || !price) {
                alert("Please fill in all required fields (Title, Description, and Price)");
                return;
            }

            // Check if image was uploaded
            if (!ImageString) {
                alert("Please select an image for your post");
                return;
            }

            // Create post data
            const postData = {
                owner: user.uid,
                name: name,
                email: user.email,
                details: details,
                prescription: prescription || "",
                price: price,
                location: location || "",
                image: ImageString,
                last_updated: firebase.firestore.FieldValue.serverTimestamp(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save to Firestore
            db.collection("posts").add(postData)
                .then(doc => {
                    console.log("Post created with ID:", doc.id);
                    savePostIDforUser(doc.id);
                })
                .catch(error => {
                    console.error("Error creating post:", error);
                    alert("Error creating post: " + error.message);
                });
        } else {
            // No user is signed in.
            console.log("Error, no user signed in");
            alert("Please sign in to create a post");
        }
    });
}

//--------------------------------------------
//saves the post ID for the user, in an array
function savePostIDforUser(postDocID) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            db.collection("users").doc(user.uid).update({
                posts: firebase.firestore.FieldValue.arrayUnion(postDocID)
            })
                .then(() => {
                    console.log("Post saved to user's document!");
                    // ✅ Show success message
                    alert("Your product has been posted successfully!");
                    // ✅ Redirect to main.html
                    window.location.href = "main.html";
                })
                .catch(error => {
                    console.error("Error writing document: ", error);
                    alert("Something went wrong while saving your post.");
                });
        }
    });
}
