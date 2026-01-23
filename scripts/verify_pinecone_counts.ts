
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.PINECONE_API_KEY;
const indexName = "tadkasync-main";

async function verify() {
    if (!apiKey) {
        console.error("No Pinecone API Key");
        return;
    }
    const pc = new Pinecone({ apiKey });
    const index = pc.index(indexName);

    try {
        const stats = await index.describeIndexStats();
        console.log("Index Stats:", JSON.stringify(stats, null, 2));

        const total = stats.totalRecordCount;
        console.log(`\n✅ Total Vectors in Index: ${total}`);

        if (total > 0 && stats.namespaces) {
            console.log("\nNamespaces:");
            for (const [ns, info] of Object.entries(stats.namespaces)) {
                console.log(`- ${ns}: ${info.recordCount} records`);
            }
        }

    } catch (e) {
        console.error("Verification failed:", e);
    }
}

verify();
