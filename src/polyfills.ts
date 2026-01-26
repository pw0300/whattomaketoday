import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
    window.global = window;
    window.Buffer = Buffer;
    window.process = {
        env: { NODE_ENV: import.meta.env.MODE },
        version: '',
        nextTick: (cb: Function) => setTimeout(cb, 0),
        platform: 'browser',
        cwd: () => '/',
    } as any;
    console.log('[Polyfills] Loaded');
}
