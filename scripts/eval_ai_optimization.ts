import 'dotenv/config';
import { secureGenerate, generateEmbedding, generateNewDishes } from '../services/geminiService';
import { embeddingCache, requestCoalescer, selectModel } from '../services/aiOptimizationService';
import { performance } from 'perf_hooks';

// Polyfill for fetch if needed (though usually available in Node 18+)
// if (!global.fetch) ...

const runBenchmark = async () => {
    console.log('\n🚀 Starting AI Optimization Benchmark...\n');
    console.log('='.repeat(50));

    // 1. Model Configuration Check
    console.log('\n[1] Verifying Model Selection (2026 Strategy)');
    const tasks = ['feed', 'cook', 'enrich', 'analyze'];
    tasks.forEach(task => {
        const config = selectModel(task as any);
        console.log(`   - Task '${task}': \t${config.model} \t(Tokens: ${config.maxOutputTokens})`);
    });

    // 2. Embedding Cache Latency Test
    console.log('\n[2] Embedding Cache Latency Test');
    const testText = "Authentic Butter Chicken with warm spices";

    // Cold Start
    const start1 = performance.now();
    await generateEmbedding(testText);
    const time1 = performance.now() - start1;
    console.log(`   - Cold Embed: \t${time1.toFixed(2)}ms`);

    // Warm Cache
    const start2 = performance.now();
    await generateEmbedding(testText);
    const time2 = performance.now() - start2;
    console.log(`   - Cached Embed: \t${time2.toFixed(2)}ms`);

    const saving = ((time1 - time2) / time1) * 100;
    console.log(`   - Improvement: \t${saving.toFixed(1)}% faster`);

    // 3. Request Coalescing test (Standard Generation)
    console.log('\n[3] Request Coalescing (Concurrent Generation)');
    const prompt = "Generate a vegetarian pasta dish";
    const schema = { type: "object", properties: { name: { type: "string" } } };

    console.log('   - Firing 3 concurrent requests...');
    const start3 = performance.now();

    // We mock the fetch inside secureGenerate via coalescer behavior observation
    // Real API calls will happen, but we want to see if they return identical objects/time

    const promises = [
        secureGenerate(prompt, schema, 'feed'),
        secureGenerate(prompt, schema, 'feed'),
        secureGenerate(prompt, schema, 'feed')
    ];

    await Promise.all(promises);
    const time3 = performance.now() - start3;

    const stats = requestCoalescer.getStats();
    console.log(`   - Total Time: \t${time3.toFixed(2)}ms`);
    console.log(`   - Coalesced Calls: \t${stats.coalesced}`);
    console.log(`   - Unique Calls: \t${stats.unique}`);
    console.log(`   - Efficiency: \t${stats.savingsRate}% load reduction`);

    // 4. Semantic Deduplication Simulation
    console.log('\n[4] Semantic Deduplication Check');
    // Note: This requires Pinecone to be reachable and populated. 
    // We'll simulate a generation request that should trigger dedup logic if similar item exists.

    const mockProfile = {
        dietaryPreference: 'Vegetarian',
        allergens: [],
        cuisines: ['Italian'],
        conditions: []
    };

    console.log('   - Requesting new dishes (Dedup logic active)...');
    try {
        const start4 = performance.now();
        const dishes = await generateNewDishes(1, mockProfile as any, 'Explorer', 'test-user-id');
        const time4 = performance.now() - start4;

        console.log(`   - Generated ${dishes.length} dishes in ${time4.toFixed(2)}ms`);
        if (dishes.length > 0) {
            console.log(`   - Dish: ${dishes[0].name} (${dishes[0].id})`);
        }
    } catch (e) {
        console.warn("   - Skipped (requires Pinecone/Env setup):", e.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Benchmark Complete');
};

runBenchmark().catch(console.error);
