import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { fetchCloudState } from '../../services/firebaseService';
import { AppState } from '../../types';
import { X, RefreshCw, Database, Smartphone } from 'lucide-react';

const FirebaseStatus: React.FC = () => {
    const { currentUser, getAppState } = useStore();
    const [cloudState, setCloudState] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const localState = getAppState();

    const checkCloud = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await fetchCloudState(currentUser.uid);
            setCloudState(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) checkCloud();
    }, [open, currentUser]);

    if (!currentUser) return null;

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg z-[100] font-mono text-xs hover:bg-red-700 transition"
                title="Debug Firebase"
            >
                <Database size={20} />
            </button>
        );
    }

    const getDiff = () => {
        if (!cloudState) return "No Cloud Data";

        const diffs: string[] = [];

        // Profile
        if (JSON.stringify(localState.profile) !== JSON.stringify(cloudState.profile)) {
            diffs.push("Profile Mismatch");
        }

        // Dishes
        if (localState.approvedDishes.length !== cloudState.approvedDishes.length) {
            diffs.push(`Dishes Count: Local(${localState.approvedDishes.length}) vs Cloud(${cloudState.approvedDishes.length})`);
        }

        // Pantry
        if (localState.pantryStock.length !== (cloudState.pantryStock?.length || 0)) {
            diffs.push(`Pantry Count: Local(${localState.pantryStock.length}) vs Cloud(${cloudState.pantryStock?.length || 0})`);
        }

        return diffs.length > 0 ? diffs.join(", ") : "✅ SYNCED";
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-8 flex items-center justify-center">
            <div className="bg-white w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl rounded-lg overflow-hidden border-4 border-ink">
                <div className="bg-ink text-white p-4 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-xl uppercase flex items-center gap-2">
                        <Database className="text-brand-500" /> Firebase Sync Debugger
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={checkCloud} className="p-2 hover:bg-white/10 rounded">
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-gray-100 border-b border-gray-300 font-mono text-xs flex justify-between items-center">
                    <span>UID: {currentUser.uid}</span>
                    <span className="font-bold bg-white px-2 py-1 rounded border border-gray-300">
                        STATUS: {getDiff()}
                    </span>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Local State */}
                    <div className="flex-1 border-r border-gray-300 flex flex-col">
                        <div className="bg-blue-50 p-2 border-b border-blue-200 font-bold text-blue-800 text-xs uppercase flex items-center gap-2">
                            <Smartphone size={16} /> Local State
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="text-[10px] font-mono">{JSON.stringify(localState, null, 2)}</pre>
                        </div>
                    </div>

                    {/* Cloud State */}
                    <div className="flex-1 flex flex-col">
                        <div className="bg-orange-50 p-2 border-b border-orange-200 font-bold text-orange-800 text-xs uppercase flex items-center gap-2">
                            <Database size={16} /> Cloud State
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                            ) : (
                                <pre className="text-[10px] font-mono">{JSON.stringify(cloudState, null, 2)}</pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirebaseStatus;
