import React from 'react';

const ContactSupport = () => {
    return (
        <div className="w-full animate-fade-in flex flex-col items-center">
             <div className="w-full bg-gray-50 py-12 sm:py-18 md:py-24 lg:py-32 px-3 sm:px-4 md:px-6 text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 sm:mb-6">System <span className="text-primary-500">Support</span></h1>
                <p className="text-gray-500 font-bold max-w-xl mx-auto leading-relaxed text-xs sm:text-sm md:text-base px-2">Need assistance with a booking or technical issue? Our global helpdesk is active 24/7 to keep your business running smoothly.</p>
            </div>

            <div className="max-w-6xl w-full px-3 sm:px-4 md:px-6 lg:px-8 -mt-6 sm:-mt-8 md:-mt-12 pb-12 sm:pb-20 md:pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                    {/* Quick Stats */}
                    <div className="bg-primary-600 p-6 sm:p-8 md:p-10 lg:p-12 rounded-xl sm:rounded-2xl md:rounded-3xl lg:rounded-[3rem] text-white flex flex-col justify-center shadow-2xl shadow-primary-600/30">
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3 opacity-60">Average Desk Response</p>
                        <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 sm:mb-8 md:mb-10 leading-none">4m 12s</p>
                        <div className="space-y-3 sm:space-y-4 md:space-y-6">
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                                <span className="text-lg sm:text-xl">📞</span>
                                <p className="font-bold text-xs sm:text-sm md:text-base lg:text-lg">1800-GOYA-FLY</p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                                <span className="text-lg sm:text-xl">✉️</span>
                                <p className="font-bold text-xs sm:text-sm md:text-base lg:text-lg">support@goyafly.com</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2 bg-white p-6 sm:p-8 md:p-10 lg:p-12 rounded-xl sm:rounded-2xl md:rounded-3xl lg:rounded-[3.5rem] shadow-2xl border border-gray-100">
                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-gray-900 mb-6 sm:mb-8 md:mb-10">Direct Support Inquiry</h3>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                            <div>
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase mb-2 sm:mb-3 tracking-widest mx-1 md:mx-2">Full Name</label>
                                <input type="text" className="w-full p-3 sm:p-4 md:p-5 bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-xs sm:text-sm md:text-base" placeholder="Agent Name" />
                            </div>
                            <div>
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase mb-2 sm:mb-3 tracking-widest mx-1 md:mx-2">Agency ID</label>
                                <input type="text" className="w-full p-3 sm:p-4 md:p-5 bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-xs sm:text-sm md:text-base" placeholder="GF-8821" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-gray-400 uppercase mb-2 sm:mb-3 tracking-widest mx-1 md:mx-2">Message Description</label>
                                <textarea className="w-full p-3 sm:p-4 md:p-5 bg-gray-50 border-0 rounded-lg sm:rounded-xl md:rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-xs sm:text-sm md:text-base min-h-[120px] sm:min-h-[140px] md:min-h-[150px]" placeholder="How can we help you today?"></textarea>
                            </div>
                            <div className="md:col-span-2">
                                <button className="w-full py-3 sm:py-4 md:py-5 lg:py-6 bg-gray-900 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl hover:bg-primary-500 transition-all text-xs sm:text-sm md:text-base tracking-widest transform active:scale-[0.98] hover:scale-105">SEND SUPPORT TICKET</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactSupport;
