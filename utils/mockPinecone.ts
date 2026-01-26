// Mock Pinecone SDK for browser environment
// This prevents bundling of Node-specific dependencies (like 'require', 'fs', 'https') 
// which cause crashes in Vite/Rollup builds for the client.

export class Pinecone {
    constructor(config: any) {
        console.warn("[Pinecone] Mock SDK initialized. This should not happen in browser logic explicitly.");
    }

    index(name: string) {
        return {
            query: async () => ({ matches: [] }),
            upsert: async () => { },
            namespace: (ns: string) => ({
                query: async () => ({ matches: [] }),
                upsert: async () => { }
            })
        };
    }
}
