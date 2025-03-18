document.addEventListener("DOMContentLoaded", function () {
    const profilePicInput = document.getElementById("profile-pic");
    const userNameInput = document.getElementById("user-name");
    const userLocationInput = document.getElementById("user-location");
    const userBioInput = document.getElementById("user-bio");
    const editProfileForm = document.getElementById("edit-profile-form");

    // Initialize Firebase
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;
            const userRef = firebase.firestore().collection("users").doc(userId);

            // Fetch user data
            userRef.get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    userNameInput.value = userData.name || "";
                    userLocationInput.value = userData.location || "";
                    userBioInput.value = userData.bio || "";
                }
            });

            // Handle form submission
            editProfileForm.addEventListener("submit", function (e) {
                e.preventDefault();
                userRef.update({
                    name: userNameInput.value,
                    location: userLocationInput.value,
                    bio: userBioInput.value
                }).then(() => {
                    alert("Profile updated successfully!");
                    window.location.href = "profile.html";
                }).catch((error) => {
                    console.error("Error updating profile: ", error);
                });
            });

            // Handle profile picture upload
            profilePicInput.addEventListener("change", function (event) {
                const file = event.target.files[0];
                if (file) {
                    const storageRef = firebase.storage().ref("profile_pictures/" + userId);
                    storageRef.put(file).then(() => {
                        storageRef.getDownloadURL().then((url) => {
                            userRef.update({ profilePic: url });
                        });
                    }).catch((error) => {
                        console.error("Error uploading profile picture: ", error);
                    });
                }
            });
        } else {
            window.location.href = "login.html";
        }
    });
});
