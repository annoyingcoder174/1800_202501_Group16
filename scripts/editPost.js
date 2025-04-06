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

function getDocID() {
    const params = new URLSearchParams(window.location.search);
    return params.get("docID");
}

function loadPostForEditing() {
    const docID = getDocID();
    db.collection("posts").doc(docID).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById("name").value = data.name || "";
            document.getElementById("details").value = data.details || "";
            document.getElementById("prescription").value = data.prescription || "";
            document.getElementById("location").value = data.location || "";
            document.getElementById("price").value = data.price || "";

            if (data.type) {
                const radioButton = document.querySelector(`input[name="type"][value="${data.type}"]`);
                if (radioButton) {
                    radioButton.checked = true;
                }
            }

            if (data.image) {
                const imgElement = document.getElementById("image-goes-here");
                imgElement.src = "data:image/png;base64," + data.image; // Set the image source
                imgElement.style.display = "block"; // Ensure the image is visible
            }
        }
    });
}

function savePostUpdates() {
    const docID = getDocID(); // Get the document ID from the URL

    // Collect updated values from the form
    const updatedData = {
        name: document.getElementById("name").value,
        details: document.getElementById("details").value,
        prescription: document.getElementById("prescription").value,
        location: document.getElementById("location").value,
        price: document.getElementById("price").value,
        type: document.querySelector('input[name="type"]:checked')?.value, // Get the selected radio button value
    };

    if (ImageString) {
        updatedData.image = ImageString; // Use the new image
    }

    // Update the Firestore document
    db.collection("posts").doc(docID).update(updatedData)
        .then(() => {
            alert("Post updated successfully!");
            window.location.href = `posts.html?docID=${docID}`; // Redirect to the post view page
        })
        .catch(error => {
            console.error("Error updating post: ", error);
            alert("Failed to update the post. Please try again.");
        });
}

document.addEventListener("DOMContentLoaded", loadPostForEditing);

function deletePost() {
    const docID = getDocID(); // Get the document ID from the URL

    // Confirm the delete action with the user
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
        // Delete the Firestore document
        db.collection("posts").doc(docID).delete()
            .then(() => {
                alert("Post deleted successfully!");
                window.location.href = "main.html"; // Redirect to the homepage or another page
            })
            .catch(error => {
                console.error("Error deleting post: ", error);
                alert("Failed to delete the post. Please try again.");
            });
    }
}

// Add an event listener to the "Delete" button
document.getElementById("deletePostButton").addEventListener("click", deletePost);