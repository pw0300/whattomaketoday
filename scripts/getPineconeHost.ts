
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.PINECONE_API_KEY;

async function getHost() {
    if (!apiKey) {
        console.error("No API KEY");
        return;
    }
    const pc = new Pinecone({ apiKey });
    const index = await pc.describeIndex('tadkasync-main');
    console.log("HOST=" + index.host);
}

getHost();
