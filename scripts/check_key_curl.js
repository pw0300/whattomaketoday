
// Replicates the user's exact curl request but for EMBEDDINGS
const apiKey = "AIzaSyCHLKA2tmgKqLM2ogmi45gSMlQs3LA0-vI";
const url = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`;

async function test() {
    console.log("Testing Embedding via Fetch...");
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: { parts: [{ text: "Paneer is a cheese" }] }
            })
        });

        console.log("Status:", response.status);
        const data = await response.json();
        if (data.embedding) {
            console.log("✅ Success! Embedding length:", data.embedding.values.length);
        } else {
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

test();
