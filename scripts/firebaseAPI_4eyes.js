//----------------------------------------
//  Your web app's Firebase configuration
//----------------------------------------
var firebaseConfig = {
    apiKey: "AIzaSyDllNlsx2zlJPFkmlGxJ0koa8frb-wTeKU",
    authDomain: "eyecycle-6af6f.firebaseapp.com",
    projectId: "eyecycle-6af6f",
    storageBucket: "eyecycle-6af6f.firebasestorage.app",
    messagingSenderId: "975906927701",
    appId: "1:975906927701:web:8ecbb7b5af0e616ee390dc",
    measurementId: "G-NDXK4T5FXH"
};

//--------------------------------------------
// initialize the Firebase app
// initialize Firestore database if using it
//--------------------------------------------
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

firebase.auth().onAuthStateChanged(user => {
    console.log("User:", user);
});

