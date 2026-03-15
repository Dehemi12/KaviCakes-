async function main() {
    try {
        console.log("Fetching Master Data from API...");
        const response = await fetch('http://localhost:5000/api/public/cakes/master-data');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        console.log("Categories received:");
        if (data && data.categories) {
            console.log(JSON.stringify(data.categories, null, 2));
        } else {
            console.log("No categories found in response");
        }
    } catch (error) {
        console.error("Error fetching API:", error.message);
    }
}

main();
