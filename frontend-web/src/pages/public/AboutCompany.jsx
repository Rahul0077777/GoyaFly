import React from 'react';
import { Link } from 'react-router-dom';

const AboutCompany = () => {
    return (
        <div className="w-full animate-fade-in">
            {/* Hero Section */}
            <div className="bg-primary-600 py-12 sm:py-20 md:py-28 lg:py-32 px-3 sm:px-4 md:px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 md:mb-8 leading-tight">We are Goyafly.com <span className="text-secondary-400">B2B</span></h1>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 font-bold leading-relaxed px-2">Pioneering the next generation of travel technology for modern agents and entrepreneurs since 2015.</p>
                </div>
                <div className="absolute top-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-white/10 rounded-full blur-3xl -mr-24 sm:-mr-32 md:-mr-48 -mt-24 sm:-mt-32 md:-mt-48"></div>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-8 sm:-mt-12 md:-mt-16 relative z-20 pb-12 sm:pb-20 md:pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
                    <div className="bg-white p-6 sm:p-10 md:p-12 lg:p-16 rounded-2xl sm:rounded-3xl md:rounded-[3rem] shadow-2xl border border-gray-100">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-4 sm:mb-6 md:mb-8">Our Mission</h2>
                        <p className="text-gray-500 leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg mb-6 sm:mb-8 font-medium">To democratize travel inventory by providing a seamless, high-margin platform for travel agents of all sizes. We believe in empowering small businesses with enterprise-grade tools.</p>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 pt-6 sm:pt-8 border-t border-gray-50">
                            <div>
                                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-black text-primary-500 mb-2">10k+</p>
                                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Agents</p>
                            </div>
                            <div>
                                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-black text-secondary-500 mb-2">500k+</p>
                                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Bookings / Year</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6 md:space-y-8">
                        <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 md:p-10 lg:p-12 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 card-hover">
                            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 md:gap-4">
                                <span className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-50 text-primary-500 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-sm sm:text-base md:text-xl">🛡️</span>
                                Reliability
                            </h3>
                            <p className="text-gray-500 font-medium leading-relaxed text-xs sm:text-sm md:text-base">99.9% uptime for our booking APIs and real-time synchronization with airline GDS systems.</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 md:p-10 lg:p-12 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 card-hover">
                            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 md:gap-4">
                                <span className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-50 text-secondary-500 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-sm sm:text-base md:text-xl">🔥</span>
                                Innovation
                            </h3>
                            <p className="text-gray-500 font-medium leading-relaxed text-xs sm:text-sm md:text-base">Continuous development of AI-driven fare prediction and automated ticketing workflows.</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 sm:mt-16 md:mt-20 text-center">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-6 sm:mb-8 italic text-gray-400 tracking-tighter px-2">"The standard by which modern B2B travel is measured."</h3>
                    <Link to="/register" className="inline-block px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 bg-gray-900 text-white font-black rounded-lg sm:rounded-xl md:rounded-[2rem] shadow-2xl hover:bg-primary-600 transition-all transform hover:scale-105 active:scale-95 text-xs sm:text-sm md:text-base tracking-widest">JOIN THE REVOLUTION</Link>
                </div>
            </div>
        </div>
    );
};

export default AboutCompany;
