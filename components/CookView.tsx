
import React, { useState, useEffect } from 'react';
import { DayPlan, Dish } from '../types';
import { ChefHat, AlertCircle, CheckCircle2, Flame, Clock, Users, ArrowRight, Timer, Terminal } from 'lucide-react';

const CookView: React.FC = () => {
    const [plan, setPlan] = useState<DayPlan[]>([]);
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const data = params.get('data');
            if (data) {
                const decodedString = decodeURIComponent(atob(data));
                const decoded = JSON.parse(decodedString);
                setPlan(decoded);
            }
        } catch (e) {
            console.error("Failed to load kitchen data", e);
        }
    }, []);

    const todayIndex = new Date().getDay() - 1;
    const safeTodayIndex = todayIndex < 0 ? 0 : todayIndex;

    const displayPlan = activeTab === 'today'
        ? plan[safeTodayIndex]
        : plan[(safeTodayIndex + 1) % 7];

    const toggleStep = (id: string) => {
        const next = new Set(completedSteps);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCompletedSteps(next);
    };

    if (!displayPlan) {
        return (
            <div className="h-screen bg-ink text-white flex flex-col items-center justify-center p-8 text-center">
                <Terminal size={64} className="mb-4 text-brand-500 animate-pulse" />
                <h1 className="text-3xl font-black uppercase tracking-tighter">Connecting Terminal...</h1>
                <p className="font-mono text-xs opacity-50 mt-4 uppercase">Waiting for House Manager Broadcast</p>
            </div>
        );
    }

    const MealCard = ({ title, dish }: { title: string, dish: Dish | null }) => {
        if (!dish) return null;

        const totalSteps = dish.instructions.length;
        const doneSteps = dish.instructions.filter((_, i) => completedSteps.has(`${dish.id}-step-${i}`)).length;
        const progress = Math.round((doneSteps / totalSteps) * 100);

        return (
            <div className="bg-white text-ink mb-16 border-4 border-ink shadow-[12px_12px_0px_0px_#18181b] rounded-none overflow-hidden">
                {/* Tactical Header */}
                <div className="bg-ink text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Flame className="text-brand-500" size={20} />
                        <span className="font-mono text-sm font-black uppercase tracking-widest">{title}</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 font-mono text-xs font-black uppercase">
                            <Users size={14} className="text-brand-500" /> {dish.servings || 1}
                        </div>
                        <div className={`px-3 py-1 font-mono text-[10px] font-black uppercase ${progress === 100 ? 'bg-brand-500' : 'bg-gray-700'}`}>
                            {progress}% Done
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h2 className="text-6xl font-black uppercase leading-[0.85] mb-6 tracking-tighter border-b-8 border-ink pb-4">{dish.localName || dish.name}</h2>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-gray-100 p-4 border-2 border-ink">
                            <span className="font-mono text-[10px] uppercase font-bold text-gray-500 block mb-1">Cuisine</span>
                            <span className="font-black uppercase text-sm">{dish.cuisine}</span>
                        </div>
                        <div className="bg-gray-100 p-4 border-2 border-ink">
                            <span className="font-mono text-[10px] uppercase font-bold text-gray-500 block mb-1">Type</span>
                            <span className="font-black uppercase text-sm">{dish.type}</span>
                        </div>
                    </div>

                    {dish.userNotes && (
                        <div className="bg-yellow-300 border-4 border-ink p-6 mb-10 relative overflow-hidden">
                            <AlertCircle className="absolute -right-4 -top-4 opacity-10" size={80} />
                            <span className="font-mono text-[10px] font-black uppercase block mb-2 text-ink/60">House Manager Protocol:</span>
                            <p className="font-black text-2xl uppercase leading-tight">"{dish.userNotes}"</p>
                        </div>
                    )}

                    {/* Mise En Place Section */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="font-black uppercase text-2xl tracking-tighter">1. MISE EN PLACE</h3>
                            <div className="flex-1 h-1 bg-ink opacity-10"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dish.ingredients.map((ing, i) => (
                                <div key={i} className="flex justify-between items-center border-4 border-ink p-4 bg-paper font-black uppercase text-xl">
                                    <span>{ing.name}</span>
                                    <span className="bg-ink text-white px-3 py-1 text-sm">{ing.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* EXECUTION SECTION */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="font-black uppercase text-2xl tracking-tighter">2. SERVICE EXECUTION</h3>
                            <div className="flex-1 h-1 bg-ink opacity-10"></div>
                        </div>
                        <div className="space-y-6">
                            {dish.instructions.map((step, i) => {
                                const stepId = `${dish.id}-step-${i}`;
                                const isDone = completedSteps.has(stepId);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => toggleStep(stepId)}
                                        className={`flex gap-6 p-8 border-4 transition-all cursor-pointer relative ${isDone ? 'bg-gray-100 border-gray-300 opacity-40' : 'bg-white border-ink hover:bg-brand-50'}`}
                                    >
                                        <div className="shrink-0 pt-1">
                                            {isDone ? <CheckCircle2 size={40} className="text-brand-500" strokeWidth={3} /> : <div className="w-10 h-10 border-4 border-ink rounded-full" />}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-mono text-[10px] font-black text-gray-400 uppercase mb-2 block">Step 0{i + 1}</span>
                                            <p className={`text-3xl font-black leading-none uppercase tracking-tighter ${isDone ? 'line-through' : ''}`}>{step}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-paper pb-40">
            {/* Terminal Header */}
            <div className="sticky top-0 z-40 bg-ink border-b-8 border-brand-500 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-500 p-2 border-2 border-white">
                        <ChefHat size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-black uppercase tracking-tighter text-3xl leading-none">KITCHEN TERMINAL</h1>
                        <p className="text-brand-500 font-mono text-[10px] font-black uppercase tracking-[0.3em] mt-1">
                            ACTIVE ROTATION: {displayPlan?.day}
                        </p>
                    </div>
                </div>

                <div className="flex bg-white/5 border-2 border-white/20 p-1">
                    <button
                        onClick={() => setActiveTab('today')}
                        className={`px-8 py-3 font-black text-xs uppercase transition-all ${activeTab === 'today' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Service: Today
                    </button>
                    <button
                        onClick={() => setActiveTab('tomorrow')}
                        className={`px-8 py-3 font-black text-xs uppercase transition-all ${activeTab === 'tomorrow' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Service: Tomorrow
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto mt-10">
                {!displayPlan.lunch && !displayPlan.dinner && (
                    <div className="py-40 text-center opacity-10 flex flex-col items-center">
                        <Timer size={120} strokeWidth={1} />
                        <p className="font-black text-5xl uppercase mt-8">Standby Mode</p>
                    </div>
                )}
                <MealCard title="LUNCH SERVICE" dish={displayPlan?.lunch} />
                <MealCard title="DINNER SERVICE" dish={displayPlan?.dinner} />
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-ink p-4 flex justify-center border-t-4 border-brand-500 z-50">
                <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.5em] font-black">
                    TadkaSync Tactical Feed // Operational Intelligence Level 2.6
                </p>
            </div>
        </div>
    );
};

export default CookView;
