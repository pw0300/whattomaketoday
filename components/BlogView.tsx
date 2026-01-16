import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogPost, getBlogPosts } from '../services/blogService';
import { ArrowLeft, Clock, Eye, Share2, Tag, Bookmark } from 'lucide-react';

interface Props {
    onBack?: () => void;
}

const BlogView: React.FC<Props> = ({ onBack }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        const data = await getBlogPosts();
        setPosts(data);
        setLoading(false);
    };

    if (selectedPost) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col bg-paper overflow-y-auto"
            >
                {/* Article Header */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 py-3">
                    <button onClick={() => setSelectedPost(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors font-display font-medium text-sm flex items-center gap-1 text-ink-light">
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full text-ink-light"><Bookmark size={18} /></button>
                        <button className="p-2 hover:bg-gray-100 rounded-full text-ink-light"><Share2 size={18} /></button>
                    </div>
                </div>

                {/* Article Content */}
                <article className="px-6 py-8 max-w-2xl mx-auto w-full pb-32">
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedPost.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-3xl font-display font-black text-ink mb-4 leading-tight">{selectedPost.title}</h1>
                        <p className="text-lg text-ink-light font-serif italic mb-6 leading-relaxed opacity-80">{selectedPost.excerpt}</p>

                        <div className="flex items-center justify-between border-y border-gray-100 py-4 mb-8">
                            <div className="flex items-center gap-3">
                                <img src={selectedPost.author.avatar} alt={selectedPost.author.name} className="w-10 h-10 rounded-full border border-gray-100" />
                                <div>
                                    <div className="text-xs font-bold text-ink uppercase tracking-wide">{selectedPost.author.name}</div>
                                    <div className="text-[10px] text-gray-500 font-medium">{selectedPost.date} · {selectedPost.readTime}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                                <Eye size={12} /> {selectedPost.views.toLocaleString()}
                            </div>
                        </div>

                        <div className="rounded-2xl overflow-hidden shadow-lg mb-8">
                            <img src={selectedPost.coverImage} className="w-full h-64 object-cover" alt="Cover" />
                        </div>
                    </div>

                    <div
                        className="prose prose-zinc prose-headings:font-display prose-p:font-serif prose-p:text-lg prose-p:leading-8 prose-img:rounded-xl max-w-none text-ink-light"
                        dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                    />

                    <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                        <p className="font-display font-bold text-ink mb-4">Enjoyed this?</p>
                        <button className="px-6 py-3 bg-ink text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                            Subscribe to {selectedPost.author.name}
                        </button>
                    </div>
                </article>
            </motion.div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            <div className="px-6 pt-6 pb-2">
                <h2 className="text-3xl font-display font-black text-ink tracking-tight mb-2">The Journal</h2>
                <p className="text-sm text-ink-light font-medium opacity-60">High-impact guides for your kitchen.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-32">
                {loading ? (
                    <div className="flex justify-center p-8"><span className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>
                ) : (
                    <div className="grid gap-6 py-4">
                        {posts.map((post, i) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setSelectedPost(post)}
                                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-premium transition-all cursor-pointer border border-gray-100"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={post.title} />
                                    <div className="absolute top-4 left-4">
                                        <span className="px-2 py-1 bg-white/90 backdrop-blur text-ink text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                                            {post.tags[0]}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <Clock size={10} /> {post.readTime}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-display font-bold text-ink mb-2 leading-tight group-hover:text-brand-600 transition-colors">{post.title}</h3>
                                    <p className="text-sm text-ink-light opacity-70 line-clamp-2 mb-4 font-normal">{post.excerpt}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <img src={post.author.avatar} className="w-6 h-6 rounded-full" alt="Author" />
                                            <span className="text-[10px] font-bold uppercase text-gray-500">{post.author.name}</span>
                                        </div>
                                        <span className="text-[10px] text-brand-500 font-bold uppercase group-hover:translate-x-1 transition-transform">Read Now →</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {/* Marketing / SEO Filler */}
                        <div className="p-6 text-center text-ink-light opacity-50 text-xs font-mono">
                            <p>Showing 4 of 50+ Articles</p>
                            <p className="mt-2">SEO Optimized Content Engine Active</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogView;
