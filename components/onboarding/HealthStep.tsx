import React, { useState } from 'react';
import { UserProfile, HealthCondition } from '../../types';
import { Activity, FileText, UploadCloud, Loader2, FileCheck, Check } from 'lucide-react';
import { analyzeHealthReport } from '../../services/geminiService';

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
        <div className="animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase">
                <Activity className="w-6 h-6" strokeWidth={2.5} />
                Health Conditions
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-600">Select active conditions:</p>
            <div className="grid grid-cols-1 gap-3 mb-6">
                {Object.values(HealthCondition).filter(c => c !== HealthCondition.None).map((cond) => (
                    <button
                        key={cond}
                        onClick={() => toggleCondition(cond)}
                        className={`p-4 border-2 transition-all flex justify-between items-center font-bold uppercase text-sm ${profile.conditions.includes(cond)
                            ? 'border-ink bg-blue-100 text-ink shadow-hard-sm'
                            : 'border-ink bg-white text-ink hover:bg-gray-50'
                            }`}
                    >
                        {cond}
                        {profile.conditions.includes(cond) && <Check className="w-5 h-5" strokeWidth={3} />}
                    </button>
                ))}
            </div>

            {/* Health Report Upload Section */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                    <FileText size={16} /> Upload Health Report (Optional)
                </label>

                <div className="relative">
                    {analyzingReport && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center border-2 border-ink">
                            <Loader2 className="animate-spin mb-2" />
                            <span className="font-mono text-xs uppercase animate-pulse">Reading Report...</span>
                        </div>
                    )}

                    {!profile.healthReportSummary ? (
                        <>
                            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed ${reportError ? 'border-red-500 bg-red-50' : 'border-ink bg-gray-50'} hover:bg-white cursor-pointer transition`}>
                                <UploadCloud size={24} className={`mb-1 ${reportError ? 'text-red-500' : 'text-gray-400'}`} />
                                <span className={`font-mono text-xs uppercase ${reportError ? 'text-red-500' : 'text-gray-500'}`}>{reportError || "Scan / Upload PDF or IMG"}</span>
                                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                            </label>
                            {reportError && <p className="text-[10px] text-red-500 font-bold mt-1 text-center">{reportError}</p>}
                        </>
                    ) : (
                        <div className="w-full border-2 border-green-500 bg-green-50 p-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-xs uppercase text-green-700 flex items-center gap-1">
                                    <FileCheck size={14} /> Analysis Complete
                                </span>
                                <button onClick={() => onProfileChange({ ...profile, healthReportSummary: '' })} className="text-xs underline text-green-700">Remove</button>
                            </div>
                            <textarea
                                value={profile.healthReportSummary}
                                onChange={(e) => onProfileChange({ ...profile, healthReportSummary: e.target.value })}
                                className="w-full bg-transparent font-mono text-xs text-green-900 focus:outline-none resize-none h-20"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 bg-white border-2 border-ink text-ink py-4 font-bold uppercase hover:bg-gray-100"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 bg-brand-500 text-white border-2 border-ink py-4 font-black uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default HealthStep;
