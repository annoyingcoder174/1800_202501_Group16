document.addEventListener("DOMContentLoaded", function () {
    const profilePicInput = document.getElementById("profile-pic");
    const profilePreview = document.getElementById("profile-preview");
    const userNameInput = document.getElementById("user-name");
    const userLocationInput = document.getElementById("user-location");
    const userBioInput = document.getElementById("user-bio");
    const editProfileForm = document.getElementById("edit-profile-form");

    let avatarBase64 = ""; // Image string like in newPost.js

    // 1. Load current user info
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const userId = user.uid;
            const userRef = firebase.firestore().collection("users").doc(userId);

            // Fetch existing data
            userRef.get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    userNameInput.value = userData.name || "";
                    userLocationInput.value = userData.location || "";
                    userBioInput.value = userData.bio || "";

                    const avatar = userData.profilePic || "";
                    profilePreview.src = avatar.startsWith("data:image")
                        ? avatar
                        : avatar || "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
                }
            });

            // 2. Handle image preview + Base64 encode
            profilePicInput.addEventListener("change", function (e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        avatarBase64 = e.target.result;
                        profilePreview.src = avatarBase64; // show preview
                    };
                    reader.readAsDataURL(file);
                }
            });

            // 3. Handle save
            editProfileForm.addEventListener("submit", function (e) {
                e.preventDefault();

                const updates = {
                    name: userNameInput.value,
                    location: userLocationInput.value,
                    bio: userBioInput.value
                };

                // Only add image if user uploaded a new one
                if (avatarBase64) {
                    updates.profilePic = avatarBase64;
                }

                userRef.update(updates).then(() => {
                    alert("Profile updated successfully!");
                    window.location.href = "profile.html";
                }).catch(error => {
                    console.error("Error updating profile:", error);
                });
            });

        } else {
            window.location.href = "login.html";
        }
    });
});
