
import React from 'react';
import { X, ShieldCheck, LogIn, Loader2, Globe, CloudSync, Database } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onClose: () => void;
  loading: boolean;
}

const AuthOverlay: React.FC<Props> = ({ onLogin, onClose, loading }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-ink/90 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-paper w-full max-w-sm border-2 border-ink shadow-[12px_12px_0px_0px_#22c55e] p-8 relative overflow-hidden rounded-xl">
                
                {/* Background Pattern */}
                <div className="absolute -top-10 -right-10 opacity-5 rotate-12">
                    <Database size={200} />
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors">
                    <X size={24} />
                </button>

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-brand-500 border-2 border-ink flex items-center justify-center mb-6 shadow-hard-sm rounded-lg">
                        <CloudSync className="text-white" size={32} />
                    </div>

                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none text-ink">Global OS Sync</h2>
                    <p className="font-mono text-[10px] text-gray-500 mb-8 uppercase tracking-widest leading-relaxed">
                        Bridge the gap between House Manager & Kitchen Cook with persistent cloud state.
                    </p>

                    <div className="space-y-4">
                        <button 
                            onClick={onLogin}
                            disabled={loading}
                            className="w-full bg-white border-2 border-ink py-4 px-6 flex items-center justify-between font-black uppercase text-sm shadow-hard hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 rounded-lg group"
                        >
                            <span className="flex items-center gap-3">
                                {loading ? <Loader2 className="animate-spin text-brand-500" size={18} /> : <LogIn size={18} className="group-hover:text-brand-600" />}
                                {loading ? 'Reconciling Data...' : 'Sync with Google'}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-brand-500 animate-ping' : 'bg-brand-500'}`} />
                        </button>

                        <div className="bg-gray-100 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                            <h4 className="font-mono text-[9px] font-black uppercase mb-2 text-gray-400">Migration Protocol</h4>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                                    <ShieldCheck size={12} className="text-brand-500" /> Auto-Merge Swiped Dishes
                                </li>
                                <li className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                                    <ShieldCheck size={12} className="text-brand-500" /> Real-time Cook Update
                                </li>
                                <li className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                                    <ShieldCheck size={12} className="text-brand-500" /> Cross-Device Inventory
                                </li>
                            </ul>
                        </div>

                        <p className="text-[9px] font-mono text-gray-400 text-center uppercase mt-6 leading-relaxed">
                            Sign in to enable 256-bit encrypted data persistence.
                        </p>
                    </div>

                    <div className="mt-10 pt-6 border-t border-ink/10 flex items-center justify-center gap-2 opacity-30">
                        <span className="font-mono text-[8px] uppercase font-black">Household System v2.5.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthOverlay;
