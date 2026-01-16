import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogPosts';
import SEO from '../components/SEO';
import { ArrowLeft, Share2, Calendar, Clock } from 'lucide-react';
// Note: In a real app we'd use react-markdown here, but for now we'll render text simply

const BlogPost: React.FC = () => {
    const { slug } = useParams();
    const post = BLOG_POSTS.find(p => p.slug === slug);

    if (!post) return <div className="h-screen flex items-center justify-center font-mono">Article Not Found</div>;

    return (
        <div className="min-h-screen bg-[#F8F5F2] text-[#1A4D2E] font-sans selection:bg-[#F9C74F]">
            <SEO
                title={post.title}
                description={post.excerpt}
                type="article"
            />

            <div className="max-w-3xl mx-auto px-6 py-12">
                <nav className="flex justify-between items-center mb-12">
                    <Link to="/blog" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold opacity-50 hover:opacity-100">
                        <ArrowLeft size={14} /> Journal
                    </Link>
                    <button className="p-2 hover:bg-[#1A4D2E]/5 rounded-full"><Share2 size={18} opacity={0.6} /></button>
                </nav>

                <header className="mb-12 text-center">
                    <div className="inline-flex gap-4 font-mono text-[10px] uppercase tracking-widest font-bold opacity-40 mb-6 justify-center">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                    </div>
                    <h1 className="font-serif text-4xl md:text-5xl font-medium leading-tight mb-6">{post.title}</h1>
                    <p className="font-sans text-xl opacity-70 max-w-xl mx-auto italic font-serif text-[#1A4D2E]">{post.excerpt}</p>
                </header>

                <article className="prose prose-stone prose-lg max-w-none">
                    {/* Simple Line Render for now since we didn't install react-markdown yet to keep payload small */}
                    {post.content.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h2 key={i} className="font-serif text-3xl mt-12 mb-6">{line.replace('# ', '')}</h2>
                        if (line.startsWith('## ')) return <h3 key={i} className="font-serif text-2xl mt-10 mb-4">{line.replace('## ', '')}</h3>
                        if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-lg mt-8 mb-2 uppercase tracking-wide">{line.replace('### ', '')}</h4>
                        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc mb-2 opacity-80">{line.replace('- ', '')}</li>
                        if (line.trim() === '') return <div key={i} className="h-4"></div>
                        return <p key={i} className="mb-4 leading-relaxed opacity-90">{line}</p>
                    })}
                </article>

                <hr className="border-[#1A4D2E]/10 my-16" />

                <div className="bg-[#1A4D2E] text-[#F8F5F2] p-8 rounded-2xl text-center">
                    <h3 className="font-serif text-2xl mb-4">Enjoyed this read?</h3>
                    <p className="opacity-70 mb-8 max-w-md mx-auto">This philosophy is built into our app. Automate your meal planning today.</p>
                    <Link to="/app" className="bg-[#F9C74F] text-[#1A4D2E] px-8 py-3 rounded-full font-mono text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform">
                        Start My Plan
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
