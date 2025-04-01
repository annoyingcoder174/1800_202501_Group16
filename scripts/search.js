
  async function searchPosts() {
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();
    const resultsContainer = document.getElementById("searchResults");

    resultsContainer.innerHTML = ""; // Clear previous results

    if (searchQuery.length === 0) {
      return; // Stop searching if input is empty
    }

    try {
      // Firestore query to search for posts where 'name' contains the search query
      const querySnapshot = await db.collection("posts").get();
      
      let results = [];

      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        if (postData.name.toLowerCase().includes(searchQuery)) {
          results.push({ id: doc.id, name: postData.name, details: postData.details });
        }
      });

      // Display search results
      results.forEach((post) => {
        let li = document.createElement("li");
        li.innerHTML = `<strong>${post.name}</strong>: ${post.details}`;
        resultsContainer.appendChild(li);
      });

    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

