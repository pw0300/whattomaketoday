// api/pinecone.js
// Vercel Serverless Function Proxy for Pinecone

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, payload } = req.body; // action: 'upsert' | 'query'

    const apiKey = process.env.PINECONE_API_KEY;
    const indexHost = process.env.PINECONE_INDEX_HOST; // e.g., https://index-name-project.svc.env.pinecone.io

    if (!apiKey || !indexHost) {
        return res.status(500).json({ error: 'Server misconfiguration: Missing Pinecone Credentials' });
    }

    try {
        let endpoint = '';
        if (action === 'upsert') endpoint = `${indexHost}/vectors/upsert`;
        else if (action === 'query') endpoint = `${indexHost}/query`;
        else return res.status(400).json({ error: 'Invalid action' });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pinecone API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error("Pinecone Proxy Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
