var ImageFile;
var ImageString;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function listenFileSelect() {
    document.getElementById("mypic-input").addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Please select a valid image file");
                return;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                alert("Image size must be less than 5MB");
                return;
            }

            var reader = new FileReader();
            reader.onerror = () => alert("Error reading image file");

            reader.onload = function (e) {
                try {
                    ImageString = e.target.result.split(",")[1];
                    const img = document.getElementById("image-goes-here");
                    img.src = e.target.result;
                    img.style.display = "block";
                    ImageFile = file;
                } catch (err) {
                    console.error("Image processing error:", err);
                    alert("Invalid image file");
                }
            };
            reader.readAsDataURL(file);
        }
    });
}
listenFileSelect();

function savePost() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
            alert("Please sign in to create a post");
            return;
        }

        const name = document.getElementById("name").value.trim();
        const details = document.getElementById("details").value.trim();
        const price = document.getElementById("price").value.trim();
        const location = document.getElementById("location").value.trim();
        const rightEye = parseFloat(document.getElementById("rightEye").value);
        const leftEye = parseFloat(document.getElementById("leftEye").value);
        const typeElement = document.querySelector('input[name="type"]:checked');

        if (!name || !details || !price || !typeElement || !ImageString) {
            alert("Please fill all required fields and upload an image.");
            return;
        }

        const postData = {
            owner: user.uid,
            email: user.email,
            name,
            details,
            price,
            location,
            type: typeElement.value,
            image: ImageString,
            rightEye: isNaN(rightEye) ? null : rightEye,
            leftEye: isNaN(leftEye) ? null : leftEye,
            last_updated: firebase.firestore.FieldValue.serverTimestamp(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection("posts")
            .add(postData)
            .then(doc => {
                console.log("Post created:", doc.id);
                savePostIDforUser(doc.id);
            })
            .catch(error => {
                console.error("Error posting:", error);
                alert("Failed to create post");
            });
    });
}

function savePostIDforUser(postDocID) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            db.collection("users").doc(user.uid).update({
                posts: firebase.firestore.FieldValue.arrayUnion(postDocID)
            })
                .then(() => {
                    alert("Post published successfully!");
                    window.location.href = "main.html";
                })
                .catch(error => {
                    console.error("Error saving post to user:", error);
                    alert("Failed to save post ID to user profile.");
                });
        }
    });
}
