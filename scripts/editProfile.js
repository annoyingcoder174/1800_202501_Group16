document.addEventListener("DOMContentLoaded", function () {
    const profilePicInput = document.getElementById("profile-pic");
    const profilePreview = document.getElementById("profile-preview");
    const userNameInput = document.getElementById("user-name");
    const userLocationInput = document.getElementById("user-location");
    const userBioInput = document.getElementById("user-bio");
    const editProfileForm = document.getElementById("edit-profile-form");

    let avatarBase64 = "";

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const userRef = firebase.firestore().collection("users").doc(user.uid);

            userRef.get().then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    userNameInput.value = data.name || "";
                    userLocationInput.value = data.location || "";
                    userBioInput.value = data.bio || "";

                    profilePreview.src = data.profilePic || "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
                }
            });

            profilePicInput.addEventListener("change", e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        avatarBase64 = e.target.result;
                        profilePreview.src = avatarBase64;
                    };
                    reader.readAsDataURL(file);
                }
            });

            editProfileForm.addEventListener("submit", function (e) {
                e.preventDefault();

                const updates = {
                    name: userNameInput.value,
                    location: userLocationInput.value,
                    bio: userBioInput.value
                };
                if (avatarBase64) {
                    updates.profilePic = avatarBase64;
                }

                userRef.update(updates).then(() => {
                    const toast = new bootstrap.Toast(document.getElementById("profile-toast"));
                    toast.show();
                    setTimeout(() => {
                        window.location.href = "profile.html";
                    }, 2000);
                }).catch(err => {
                    console.error("Failed to update profile:", err);
                });
            });

        } else {
            window.location.href = "login.html";
        }
    });
});
