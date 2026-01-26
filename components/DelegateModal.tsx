import React, { useState, useEffect } from 'react';
import { UserProfile, DayPlan } from '../types'; // Adjust path if needed
import { generateCookInstructions } from '../services/geminiService'; // Adjust path
import { X, MessageCircle, Mic, Volume2, Copy, Check } from 'lucide-react';

interface Props {
    plan: DayPlan[];
    userProfile?: UserProfile;
    onClose: () => void;
}

const DelegateModal: React.FC<Props> = ({ plan, userProfile, onClose }) => {
    const [language, setLanguage] = useState('Hindi');
    const [instructions, setInstructions] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        generateBrief();
    }, [language]);

    const generateBrief = async () => {
        setLoading(true);
        try {
            // Updated to pass userProfile for allergy safety
            const text = await generateCookInstructions(plan, userProfile);
            if (!text) console.error("DelegateModal: generateCookInstructions returned null/empty");
            setInstructions(text || "Could not generate instructions.");
        } catch (e) {
            console.error("DelegateModal Error:", e);
            setInstructions("Error generating instructions.");
        } finally {
            setLoading(false);
        }
    };

    const handleSpeak = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(instructions);
            // Try to find a Hindi voice if selected
            if (language === 'Hindi') {
                const voices = window.speechSynthesis.getVoices();
                const hindiVoice = voices.find(v => v.lang.includes('hi'));
                if (hindiVoice) utterance.voice = hindiVoice;
            }
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Text-to-Speech not supported in this browser.");
        }
    };

    const handleWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(instructions)}`;
        window.open(url, '_blank');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(instructions);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-paper w-full max-w-md rounded-2xl shadow-2xl border-2 border-ink overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-ink text-white p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <Mic size={20} className="text-brand-300" />
                        <h2 className="font-black uppercase tracking-wide text-lg">Cook Delegate</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full text-white/70 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-2 shrink-0">
                    {['Hindi', 'English', 'Marathi'].map(lang => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border-2 transition-all ${language === lang
                                ? 'bg-brand-500 text-white border-brand-600 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-brand-200'
                                }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1 overflow-y-auto min-h-0 bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-400">
                            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-mono text-xs uppercase animate-pulse">Translating to {language}...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm">
                                {instructions}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0 space-y-3">

                    {/* Secondary Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSpeak}
                            disabled={loading || !instructions}
                            className="flex-1 bg-white border border-gray-300 text-gray-600 py-2.5 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                        >
                            <Volume2 size={16} />
                            Read Aloud
                        </button>

                        <button
                            onClick={handleCopy}
                            disabled={loading || !instructions}
                            className="flex-1 bg-white border border-gray-300 text-gray-600 py-2.5 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                    {/* Primary Action */}
                    <button
                        onClick={handleWhatsApp}
                        disabled={loading || !instructions}
                        className="w-full bg-[#25D366] text-white py-3.5 font-bold uppercase rounded-xl flex items-center justify-center gap-2 hover:brightness-105 transition shadow-hard-sm active:shadow-none active:translate-y-0.5 border-2 border-[#128C7E]"
                    >
                        <MessageCircle size={22} fill="currentColor" />
                        Send to Cook (WhatsApp)
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DelegateModal;
