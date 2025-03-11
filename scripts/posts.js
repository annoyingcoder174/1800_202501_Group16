function displayHikeInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log(ID);

    // doublecheck: is your collection called "Reviews" or "reviews"?
    // spelling matters
    db.collection("posts")
        .doc(ID)
        .get()
        .then(doc => {
            thisPosts = doc.data();
            postsCode = thisPosts.code;
            postsName = doc.data().details;

            // only populate title, and image
            document.getElementById("glassName").innerHTML = postsName;
            let imgEvent = document.querySelector(".glass-img");
            imgEvent.src = "./images/" + postsCode + ".jpg";
        });
}
displayHikeInfo();