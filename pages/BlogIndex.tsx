import React from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogPosts';
import SEO from '../components/SEO';
import { ArrowLeft } from 'lucide-react';

const BlogIndex: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#F8F5F2] text-[#1A4D2E] font-sans p-6 md:p-12">
            <SEO
                title="Journal | TadkaSync"
                description="Insights on mindful cooking, kitchen efficiency, and Indian vegetarian nutrition."
            />

            <header className="max-w-4xl mx-auto mb-16">
                <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold opacity-50 hover:opacity-100 mb-8">
                    <ArrowLeft size={14} /> Back Home
                </Link>
                <h1 className="font-serif text-5xl md:text-6xl font-medium text-[#1A4D2E] mb-6">Kitchen Journal.</h1>
                <p className="font-sans text-xl opacity-70">Essays on nutrition, automation, and the art of modern home cooking.</p>
            </header>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {BLOG_POSTS.map(post => (
                    <Link key={post.slug} to={`/blog/${post.slug}`} className="group block">
                        <article className="bg-white border border-[#1A4D2E]/10 p-8 rounded-2xl h-full transition-all group-hover:border-[#1A4D2E]/30 group-hover:bg-[#F9C74F]/10">
                            <div className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">{post.date} • {post.readTime}</div>
                            <h2 className="font-serif text-2xl font-bold mb-3 leading-tight group-hover:underline decoration-[#1A4D2E]/30 underline-offset-4">{post.title}</h2>
                            <p className="font-sans text-sm opacity-70 line-clamp-3 leading-relaxed">{post.excerpt}</p>

                            <div className="mt-6 flex flex-wrap gap-2">
                                {post.tags.map(tag => (
                                    <span key={tag} className="border border-[#1A4D2E]/10 px-2 py-1 rounded-md text-[10px] font-mono uppercase bg-transparent text-[#1A4D2E]/60">{tag}</span>
                                ))}
                            </div>
                        </article>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BlogIndex;
