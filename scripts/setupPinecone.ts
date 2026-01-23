
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.PINECONE_API_KEY;
const indexName = "tadkasync-main";

async function setup() {
    if (!apiKey) {
        console.error("❌ PINECONE_API_KEY not found in .env");
        process.exit(1);
    }

    const pc = new Pinecone({ apiKey });

    console.log(`Checking Pinecone index: ${indexName}...`);

    try {
        const indexes = await pc.listIndexes();
        const exists = indexes.indexes?.find(idx => idx.name === indexName);

        if (exists) {
            console.log(`✅ Index '${indexName}' already exists.`);
            console.log(exists);
        } else {
            console.log(`⚠️ Index '${indexName}' not found. Creating...`);
            await pc.createIndex({
                name: indexName,
                dimension: 768, // Gemini text-embedding-004
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log(`✅ Index '${indexName}' created successfully.`);
        }
    } catch (e) {
        console.error("❌ Error setting up Pinecone:", e);
        process.exit(1);
    }
}

setup();
