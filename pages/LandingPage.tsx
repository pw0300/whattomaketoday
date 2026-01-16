import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, ChefHat, Instagram, Star, Zap } from 'lucide-react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import HowItWorks from '../components/marketing/HowItWorks';
import LoadingScreen from '../components/ui/LoadingScreen';

const LandingPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="min-h-screen bg-[#F8F5F2] text-[#1A4D2E] font-sans selection:bg-[#F9C74F] selection:text-[#1A4D2E] relative">
            <AnimatePresence>
                {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
            </AnimatePresence>

            <SEO
                title="Automate Your Kitchen"
                description="The first intelligent sous-chef for Indian vegetarians. Stop asking 'What to cook?'."
            />

            {/* Noise Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-40 bg-[#F8F5F2]/80 backdrop-blur-md border-b border-[#1A4D2E]/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="font-serif text-2xl font-black tracking-tighter">TadkaSync.</div>
                    <div className="flex gap-6 items-center">
                        <Link to="/blog" className="hidden md:block font-mono text-xs uppercase tracking-widest font-bold hover:text-[#F9C74F] transition-colors">Journal</Link>
                        <Link to="/app" className="bg-[#1A4D2E] text-[#F8F5F2] px-5 py-2 rounded-full font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#143d24] transition-all flex items-center gap-2">
                            Launch App <Zap size={14} fill="currentColor" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 border border-[#1A4D2E]/20 rounded-full px-4 py-1 mb-8 bg-white"
                    >
                        <Star size={12} fill="#F9C74F" className="text-[#F9C74F]" />
                        <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Voted #1 Meal Planner for Desi Homes</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-serif text-6xl md:text-8xl font-medium leading-[0.9] text-[#1A4D2E] mb-8"
                    >
                        Respect your <br />
                        <span className="italic text-[#F9C74F]">ingredients.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-xl text-[#1A4D2E]/70 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Decision fatigue is real. TadkaSync uses AI to curate your weekly menu based on your health goals, pantry stock, and cravings.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col md:flex-row gap-4 justify-center items-center"
                    >
                        <Link to="/app" className="w-full md:w-auto bg-[#1A4D2E] text-[#F8F5F2] px-8 py-4 rounded-full font-mono text-sm font-bold uppercase tracking-wider hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2">
                            Start Free Trial <ArrowRight size={16} />
                        </Link>
                        <span className="font-mono text-[10px] uppercase text-[#1A4D2E]/50">No credit card required</span>
                    </motion.div>
                </div>

                {/* Abstract Visuals */}
                <div className="absolute top-1/2 left-10 w-64 h-64 bg-[#F9C74F]/20 rounded-full blur-3xl -z-10 animate-pulse" />
                <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#1A4D2E]/10 rounded-full blur-3xl -z-10" />
            </section>

            {/* How It Works Interactive Pipeline */}
            <section className="py-20 bg-[#fff] border-y border-[#1A4D2E]/5">
                <div className="text-center mb-12">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#1A4D2E]/50">The Pipeline</span>
                    <h2 className="font-serif text-4xl mt-2 text-[#1A4D2E]">From Cravings to Plating.</h2>
                </div>
                <HowItWorks />
            </section>

            {/* Social Proof Marquee */}
            <div className="bg-[#1A4D2E] text-[#F8F5F2] py-4 overflow-hidden whitespace-nowrap">
                <div className="inline-block animate-marquee">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <span key={i} className="mx-8 font-mono text-sm font-bold uppercase tracking-widest opacity-50">
                            Planning 10,000+ Meals Weekly  •  Saved ₹5 Lakhs in Grocery Waste  •  PCOS Friendly  •
                        </span>
                    ))}
                </div>
            </div>

            {/* Feature Bento Grid */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="mb-16">
                    <h2 className="font-serif text-4xl text-[#1A4D2E] mb-4">The Operating System <br />for your Kitchen.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
                    {/* Big Card */}
                    <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-8 border border-[#1A4D2E]/10 shadow-sm relative overflow-hidden group hover:shadow-xl transition-shadow duration-500">
                        <div className="absolute top-8 right-8 bg-[#F8F5F2] p-2 rounded-full border border-[#1A4D2E]/10">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-serif text-3xl mb-4 relative z-10">AI-Powered <br />Curation</h3>
                        <p className="text-[#1A4D2E]/60 max-w-sm mb-8 relative z-10">
                            Our 'Chef's Brain' engine understands flavor profiles. It knows that if you have *Methi*, you might want *Thepla* or *Aloo Methi*, but definitely not *Pizza*.
                        </p>
                        <div className="w-full h-64 bg-[#F8F5F2] rounded-xl border border-[#1A4D2E]/5 relative overflow-hidden flex items-center justify-center">
                            {/* Detailed Mock Recipe Card */}
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-[#1A4D2E]/10 w-64 rotate-3 group-hover:rotate-0 transition-transform duration-500 scale-90">

                                <div className="h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-[#1A4D2E]/20">
                                        <ChefHat size={32} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-start mb-2">
                                    <div className="h-4 w-3/4 bg-[#1A4D2E]/10 rounded mb-1"></div>
                                    <div className="h-4 w-8 bg-[#F9C74F] rounded-full"></div>
                                </div>
                                <div className="h-3 w-1/2 bg-[#1A4D2E]/5 rounded mb-3"></div>

                                <div className="flex gap-2">
                                    <div className="h-6 w-12 bg-green-50 rounded border border-green-100"></div>
                                    <div className="h-6 w-12 bg-red-50 rounded border border-red-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Card 1 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-[#1A4D2E] text-[#F8F5F2] rounded-3xl p-8 relative overflow-hidden"
                    >
                        <ChefHat size={32} className="mb-4 text-[#F9C74F]" />
                        <h3 className="font-serif text-2xl mb-2">Pantry Aware</h3>
                        <p className="opacity-70 text-sm">We track what you have, so you buy only what you need. Zero waste.</p>
                    </motion.div>

                    {/* Side Card 2 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-[#F9C74F] text-[#1A4D2E] rounded-3xl p-8 relative overflow-hidden"
                    >
                        <Check size={32} className="mb-4" />
                        <h3 className="font-serif text-2xl mb-2">Health First</h3>
                        <p className="opacity-80 text-sm">PCOS, Diabetes, or just 'Trying to eat clean'. We filter the noise.</p>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-[#1A4D2E] text-[#F8F5F2] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                />
                <div className="max-w-3xl mx-auto relative z-10">
                    <h2 className="font-serif text-5xl mb-8">Ready to reclaim your time?</h2>
                    <p className="text-xl opacity-70 mb-12">Join 2,000+ home chefs who have automated their daily struggle.</p>
                    <Link to="/app" className="bg-[#F8F5F2] text-[#1A4D2E] px-10 py-5 rounded-full font-mono text-sm font-bold uppercase tracking-wider hover:bg-white hover:scale-105 transition-all shadow-xl inline-flex items-center gap-2">
                        Get Started Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#143d24] text-[#F8F5F2]/40 py-12 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="font-serif text-xl text-[#F8F5F2]">TadkaSync.</div>
                    <div className="flex gap-8 font-mono text-xs uppercase tracking-widest">
                        <Link to="/blog" className="hover:text-[#F9C74F]">Journal</Link>
                        <a href="#" className="hover:text-[#F9C74F]">Manifesto</a>
                        <a href="#" className="hover:text-[#F9C74F]">Login</a>
                    </div>
                    <div className="flex gap-4">
                        <Instagram size={20} />
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
