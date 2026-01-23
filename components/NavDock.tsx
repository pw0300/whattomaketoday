import React from 'react';
import { Layers, LayoutGrid, ClipboardList, Package, User, BookOpen } from 'lucide-react';
import { AppView } from '../types';

interface Props {
    view: AppView;
    setView: (view: AppView) => void;
}

const NavDock: React.FC<Props> = ({ view, setView }) => {
    return (
        <div className="fixed bottom-8 left-0 w-full flex justify-center z-50 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-xl px-2 py-2 rounded-full shadow-premium border border-white/40 flex gap-2 pointer-events-auto transform transition-transform hover:scale-[1.02] duration-500">
                {[
                    { v: AppView.Swipe, l: 'Discover', i: Layers },
                    { v: AppView.Planner, l: 'Plan', i: LayoutGrid },
                    { v: AppView.Shopping, l: 'Shop', i: ClipboardList },
                    { v: AppView.Journal, l: 'Journal', i: BookOpen },
                    { v: AppView.Pantry, l: 'Pantry', i: Package },
                    { v: AppView.Profile, l: 'Me', i: User },
                ].map(item => {
                    const isActive = view === item.v;
                    return (
                        <button
                            key={item.v}
                            onClick={() => setView(item.v)}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                setView(item.v);
                            }}
                            className={`
                relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group
                ${isActive ? 'bg-gradient-brand text-white shadow-lg shadow-orange-500/30 ring-2 ring-white scale-110' : 'text-ink-light hover:bg-gray-100 hover:text-ink hover:scale-105'}
              `}
                            title={item.l}
                        >
                            <item.i size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                            {isActive && (
                                <span className="absolute -bottom-8 bg-black/80 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {item.l}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default NavDock;
