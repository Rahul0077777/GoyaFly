import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

/**
 * PageHeader Component
 * Standardizes the header across all agent portal pages with SEO and Breadcrumbs.
 */
const PageHeader = ({ title, subtitle, breadcrumbs = [], icon }) => {
    return (
        <>
            <Helmet>
                <title>{title} | Goyafly B2B</title>
                <meta property="og:title" content={`${title} | Goyafly B2B`} />
            </Helmet>

            <div className="bg-[#0f172a] pt-12 pb-32 px-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 transition-all duration-500 animate-fade-in">
                    
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 mb-6">
                        <Link to="/agent/dashboard" className="text-[10px] font-black text-slate-500 hover:text-primary-400 uppercase tracking-[0.2em] transition-colors">Dashboard</Link>
                        {breadcrumbs.map((bc, idx) => (
                            <React.Fragment key={idx}>
                                <span className="text-slate-700 text-[10px]">/</span>
                                {bc.link ? (
                                    <Link to={bc.link} className="text-[10px] font-black text-slate-500 hover:text-primary-400 uppercase tracking-[0.2em] transition-colors">{bc.label}</Link>
                                ) : (
                                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">{bc.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                {icon && <span className="text-3xl">{icon}</span>}
                                <h1 className="text-white text-5xl font-black tracking-tighter animate-slide-up">{title}</h1>
                            </div>
                            {subtitle && (
                                <p className="text-slate-500 text-sm font-medium max-w-xl leading-relaxed uppercase tracking-tight opacity-80 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Background Detail */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full -mr-64 -mt-64 blur-3xl"></div>
            </div>
        </>
    );
};

export default PageHeader;
