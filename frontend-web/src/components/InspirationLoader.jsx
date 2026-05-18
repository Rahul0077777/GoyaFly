import React, { useState, useEffect } from 'react';
import { FaPlane, FaGlobeAmericas, FaCloud, FaQuoteLeft } from 'react-icons/fa';

const DESTINATIONS = [
  { 
    city: 'Paris', 
    country: 'France', 
    img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    quote: "Paris is always a good idea."
  },
  { 
    city: 'Dubai', 
    country: 'UAE', 
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    quote: "Dubai: A city that never stops dreaming."
  },
  { 
    city: 'London', 
    country: 'UK', 
    img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    quote: "When a man is tired of London, he is tired of life."
  },
  { 
    city: 'Goa', 
    country: 'India', 
    img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    quote: "Let the sea set you free."
  },
  { 
    city: 'Tokyo', 
    country: 'Japan', 
    img: 'https://images.unsplash.com/photo-1540959733332-e94e270b4d82?auto=format&fit=crop&w=800&q=80',
    quote: "Tokyo is a city of layers."
  },
  { 
    city: 'New York', 
    country: 'USA', 
    img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    quote: "The city that never sleeps."
  },
];

const SEARCH_MESSAGES = [
  "Contacting GDS Systems...",
  "Securing Best Fares...",
  "Checking Seat Availability...",
  "Analyzing Airline Routes...",
  "Optimizing Your Journey...",
  "Finalizing Fares..."
];

const InspirationLoader = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % SEARCH_MESSAGES.length);
    }, 2500);
    const quoteTimer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % DESTINATIONS.length);
    }, 4000);
    return () => {
      clearInterval(msgTimer);
      clearInterval(quoteTimer);
    };
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row min-h-[500px]">
        {/* Left Side: Inspiration Grid */}
        <div className="lg:w-3/5 p-6 bg-slate-50 relative">
          <div className="grid grid-cols-2 gap-4 h-full">
            {DESTINATIONS.slice(0, 4).map((dest, i) => (
              <div 
                key={dest.city} 
                className="relative rounded-xl overflow-hidden aspect-[4/3] group shadow-sm border border-white"
              >
                <img 
                  src={dest.img} 
                  alt={dest.city} 
                  className="w-full h-full object-cover transition-transform duration-[10000ms] ease-linear transform group-hover:scale-110"
                  style={{ animation: `kenburns ${10 + i * 2}s infinite alternate` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-3 left-4 text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{dest.country}</p>
                  <p className="text-sm font-bold">{dest.city}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Overlay Quote */}
          <div className="absolute bottom-10 left-10 right-10 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white z-20 animate-bounce-subtle">
            <FaQuoteLeft className="text-[#FF8000] text-xl mb-3 opacity-30" />
            <p className="text-slate-700 font-medium italic text-lg leading-snug">
              "{DESTINATIONS[quoteIdx].quote}"
            </p>
            <p className="text-[#FF8000] text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              Destination Inspiration
            </p>
          </div>
        </div>

        {/* Right Side: Search Status */}
        <div className="lg:w-2/5 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden bg-white">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <FaGlobeAmericas className="text-9xl text-[#1B2131]" />
          </div>

          <div className="relative mb-8">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 relative shadow-inner">
               <FaPlane className="text-[#FF8000] text-3xl transform rotate-[-45deg] animate-flight-pulse" />
            </div>
            <div className="absolute -inset-4 bg-orange-500/10 rounded-full animate-ping -z-10" />
          </div>

          <div className="space-y-4 z-10">
            <h3 className="text-[13px] font-black text-[#FF8000] uppercase tracking-[0.4em] animate-pulse">
              {SEARCH_MESSAGES[msgIndex]}
            </h3>
            <h2 className="text-2xl font-black text-[#1B2131] tracking-tighter">
              Searching for the best fares...
            </h2>
            <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[200px] mx-auto uppercase">
              Comparing 400+ airlines across global GDS nodes
            </p>
          </div>

          <div className="mt-12 w-full max-w-[280px]">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#FF8000] to-[#FF9844] rounded-full"
                style={{ width: '60%', transition: 'width 2s ease-in-out', animation: 'progress 3s infinite' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <span>SCANNING</span>
              <span>75%</span>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-50 w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
              GOYAFLY <span className="font-light">PREMIUM NODE</span>
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes kenburns {
          from { transform: scale(1); }
          to { transform: scale(1.15); }
        }
        @keyframes progress {
          0% { width: 10%; }
          50% { width: 85%; }
          100% { width: 95%; }
        }
        @keyframes flight-pulse {
          0%, 100% { transform: rotate(-45deg) scale(1); }
          50% { transform: rotate(-40deg) scale(1.1); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 4s infinite ease-in-out;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}} />
    </div>
  );
};

export default InspirationLoader;
