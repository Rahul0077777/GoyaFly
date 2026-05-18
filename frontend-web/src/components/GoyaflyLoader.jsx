import React, { useState, useEffect } from 'react';

const LOADING_STEPS = [
    "Contacting GDS Systems...",
    "Finding Lowest Fares...",
    "Verifying Seat Availability...",
    "Securing Agent Markup...",
    "Optimizing Your Choice..."
];

const GoyaflyLoader = () => {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[400px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
            {/* Background Subtle Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />

            {/* Pulsing Icon */}
            <div className="relative mb-12">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 animate-pulse">
                    <svg className="w-10 h-10 text-[#eb5a0c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div className="absolute -inset-4 bg-orange-500/10 rounded-full animate-ping -z-10" />
            </div>

            {/* Flight Animation Track */}
            <div className="w-full max-w-md h-px bg-dashed border-t-2 border-dashed border-slate-200 relative mb-16">
                <div className="absolute -top-4 left-0 animate-flight-web">
                    <svg className="w-8 h-8 text-[#eb5a0c] transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </div>
            </div>

            {/* Status Text with Fade Effect */}
            <div className="text-center z-10">
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest mb-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2">
                    {LOADING_STEPS[stepIndex]}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                    GOYAFLY <span className="font-light">TRAVELS</span>
                </p>
            </div>

            {/* Skeleton Background Cards */}
            <div className="w-full mt-16 space-y-4 opacity-40">
                {[1, 2].map((i) => (
                    <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-50 animate-pulse" />
                ))}
            </div>
        </div>
    );
};

export default GoyaflyLoader;
