import fs from 'fs';
import path from 'path';

// This would ideally be shared with the app, but for script simplicity we redefine or import if module allows
// For now, mirroring the routes we know exist.

const BASE_URL = 'https://tadkasync.com'; // Replace with actual domain

const ROUTES = [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/app', changefreq: 'always', priority: 0.9 },
    { path: '/login', changefreq: 'monthly', priority: 0.5 },
];

const MOCK_BLOG_SLUGS = [
    '10-pantry-staples-indian-cooking',
    'zero-waste-kitchen-hacks',
    'science-of-tadka',
    'meal-prep-sunday'
];

const generateSitemap = () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${ROUTES.map(route => `
    <url>
        <loc>${BASE_URL}${route.path}</loc>
        <changefreq>${route.changefreq}</changefreq>
        <priority>${route.priority}</priority>
    </url>`).join('')}
    ${MOCK_BLOG_SLUGS.map(slug => `
    <url>
        <loc>${BASE_URL}/blog/${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`).join('')}
</urlset>`;

    const publicPath = path.resolve(__dirname, '../public/sitemap.xml');
    // Ensure public dir exists
    // fs.mkdirSync(path.dirname(publicPath), { recursive: true });

    fs.writeFileSync(publicPath, sitemap);
    console.log(`✅ Sitemap generated at ${publicPath}`);
};

generateSitemap();
