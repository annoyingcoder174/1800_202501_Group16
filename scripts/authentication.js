// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // User successfully signed in.
        // Return type determines whether we continue the redirect automatically
        // or whether we leave that to developer to handle.
        //------------------------------------------------------------------------------------------
        // The code below is modified from default snippet provided by the FB documentation.
        //
        // If the user is a "brand new" user, then create a new "user" in your own database.
        // Assign this user with the name and email provided.
        // Before this works, you must enable "Firestore" from the firebase console.
        // The Firestore rules must allow the user to write. 
        //------------------------------------------------------------------------------------------
        var user = authResult.user;                            // get the user object from the Firebase authentication database
        if (authResult.additionalUserInfo.isNewUser) {         //if new user
            db.collection("users").doc(user.uid).set({         //write to firestore. We are using the UID for the ID in users collection
                   name: user.displayName,                    //"users" collection
                   email: user.email,                         //with authenticated user's ID (user.uid)
                   location: "",                      //optional default profile info      
                   posts: []                      //changed from empty string to empty array for posts
            }).then(function () {
                   console.log("New user added to firestore");
                   window.location.assign("main.html");       //re-direct to main.html after signup
            }).catch(function (error) {
                   console.log("Error adding new user: " + error);
            });
        } else {
            return true;
        }
            return false;
        },
      uiShown: function() {
        // The widget is rendered.
        // Hide the loader.
        document.getElementById('loader').style.display = 'none';
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: "main.html",
    signInOptions: [
      {
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        requireDisplayName: true,
        signInMethod: firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
      }
    ],
    // Terms of service url.
    tosUrl: '#',
    // Privacy policy url.
    privacyPolicyUrl: '#'
  };

  ui.start('#firebaseui-auth-container', uiConfig);
