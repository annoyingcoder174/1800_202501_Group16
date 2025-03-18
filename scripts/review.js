// Select all elements with the class name "star" and store them in the "stars" variable
const stars = document.querySelectorAll('.star');

// Iterate through each star element
stars.forEach((star, index) => {
    // Add a click event listener to the current star
    star.addEventListener('click', () => {
        // Fill in clicked star and stars before it
        for (let i = 0; i <= index; i++) {
            // Change the text content of stars to 'star' (filled)
            document.getElementById(`star${i + 1}`).textContent = 'star';
        }
    });
});

var postsDocID = localStorage.getItem("postsDocID");    //visible to all functions on this page

function getPostName(id) {
    db.collection("posts")
      .doc(id)
      .get()
      .then((thisPost) => {
        var postName = thisPost.data().details;
        document.getElementById("postName").innerHTML = postName;
          });
}

getPostName(postsDocID);

function writeReview() {
    console.log("inside write review");
    let postTitle = document.getElementById("title").value;
    let postDescribed = document.getElementById('input[name="described"]:checked').value;
    let postCommunication = document.getElementById("communication").value;
    let postDescription = document.getElementById("description").value;
    let postRecommend = document.querySelector('input[name="recommend"]:checked').value;

    // Get the star rating
		// Get all the elements with the class "star" and store them in the 'stars' variable
    const stars = document.querySelectorAll('.star');
		// Initialize a variable 'hikeRating' to keep track of the rating count
    let postRating = 0;
		// Iterate through each element in the 'stars' NodeList using the forEach method
    stars.forEach((star) => {
				// Check if the text content of the current 'star' element is equal to the string 'star'
        if (star.textContent === 'star') {
						// If the condition is met, increment the 'hikeRating' by 1
            postRating++;
        }
    });

    console.log(postTitle, postDescribed, postCommunication, postDescription, postRecommend, hikeRating);

    var user = firebase.auth().currentUser;
    if (user) {
        var currentUser = db.collection("users").doc(user.uid);
        var userID = user.uid;

        // Get the document for the current user.
        db.collection("reviews").add({
            postDocID: postDocID,
            userID: userID,
            title: postTitle,
            described: postDescribed,
            communication: postCommunication,
            description: postDescription,
            recommend: postRecommend,
            rating: postRating, // Include the rating in the review
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            window.location.href = "thanks.html"; // Redirect to the thanks page
        });
    } else {
        console.log("No user is signed in");
        window.location.href = 'review.html';
    }
}