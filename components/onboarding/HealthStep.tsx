import React, { useState } from 'react';
import { UserProfile, HealthCondition } from '../../types';
import { Activity, FileText, UploadCloud, Loader2, FileCheck, Check, ChevronLeft } from 'lucide-react';
import { analyzeHealthReport } from '../../services/geminiService';
import { motion } from 'framer-motion';

interface Props {
    profile: UserProfile;
    onProfileChange: (profile: UserProfile) => void;
    onNext: () => void;
    onBack: () => void;
}

const HealthStep: React.FC<Props> = ({ profile, onProfileChange, onNext, onBack }) => {
    const [analyzingReport, setAnalyzingReport] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    const toggleCondition = (c: HealthCondition) => {
        onProfileChange({
            ...profile,
            conditions: profile.conditions.includes(c)
                ? profile.conditions.filter(x => x !== c)
                : [...profile.conditions, c]
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setReportError("File too large (Max 5MB)");
                return;
            }
            setReportError(null);
            setAnalyzingReport(true);
            const result = await analyzeHealthReport(file);
            onProfileChange({ ...profile, healthReportSummary: result });
            setAnalyzingReport(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="font-serif text-3xl text-[#1A4D2E] mb-2">Health Priority</h2>
                    <p className="text-[#1A4D2E]/60 font-sans text-sm">Select conditions to tailor your nutrition plan.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6 flex-1 overflow-y-auto pr-2 no-scrollbar">
                {Object.values(HealthCondition).filter(c => c !== HealthCondition.None).map((cond) => {
                    const isSelected = profile.conditions.includes(cond);
                    return (
                        <motion.button
                            key={cond}
                            onClick={() => toggleCondition(cond)}
                            whileHover={{ scale: 1.01, x: 5 }}
                            whileTap={{ scale: 0.99 }}
                            className={`
                                p-4 rounded-xl text-left transition-all duration-200 border flex justify-between items-center group
                                ${isSelected
                                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md'
                                    : 'bg-white text-[#1A4D2E] border-[#1A4D2E]/10 hover:border-blue-200 hover:bg-blue-50/50'
                                }
                            `}
                        >
                            <span className="font-medium text-lg">{cond}</span>
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center transition-colors
                                ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-300 group-hover:bg-blue-200'}
                            `}>
                                <Check size={14} strokeWidth={3} />
                            </div>
                        </motion.button>
                    )
                })}
            </div>

            {/* Health Report Upload Section */}
            <div className="mb-8">
                <div className="relative group">
                    {analyzingReport && (
                        <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
                            <Loader2 className="animate-spin mb-2 text-blue-600" />
                            <span className="font-mono text-[10px] uppercase text-blue-600 tracking-widest animate-pulse">Reading Report...</span>
                        </div>
                    )}

                    {!profile.healthReportSummary ? (
                        <label className={`
                            flex flex-col items-center justify-center w-full h-20 rounded-xl border border-dashed cursor-pointer transition-all
                            ${reportError ? 'border-red-500 bg-red-50' : 'border-[#1A4D2E]/20 bg-[#F8F5F2] hover:bg-white hover:border-blue-400'}
                        `}>
                            <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <UploadCloud size={20} className={reportError ? 'text-red-500' : 'text-[#1A4D2E]'} />
                                <span className={`font-mono text-xs uppercase ${reportError ? 'text-red-500' : 'text-[#1A4D2E]'}`}>
                                    {reportError || "Upload Lab Report (PDF/IMG)"}
                                </span>
                            </div>
                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                        </label>
                    ) : (
                        <div className="w-full bg-green-50 rounded-xl p-4 border border-green-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-xs uppercase text-green-800 flex items-center gap-1">
                                    <FileCheck size={14} /> Report Analyzed
                                </span>
                                <button onClick={() => onProfileChange({ ...profile, healthReportSummary: '' })} className="text-[10px] uppercase tracking-widest text-green-800/60 hover:text-green-800 transition-colors">Remove</button>
                            </div>
                            <textarea
                                value={profile.healthReportSummary}
                                onChange={(e) => onProfileChange({ ...profile, healthReportSummary: e.target.value })}
                                className="w-full bg-transparent font-mono text-xs text-green-900 focus:outline-none resize-none h-16"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="w-14 h-14 rounded-full border border-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] hover:bg-gray-50 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 bg-[#1A4D2E] text-[#F8F5F2] h-14 rounded-full font-mono text-sm uppercase tracking-widest font-bold shadow-xl hover:bg-[#143d24] hover:shadow-2xl hover:scale-[1.01] transition-all"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default HealthStep;
