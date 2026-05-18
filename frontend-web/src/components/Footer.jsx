import React from 'react';
import { Link } from 'react-router-dom';
import goyaflyLogo from '../assets/goyafly_logo.png';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white rounded-2xl p-2 shadow-lg inline-block">
                <img src={goyaflyLogo} alt="Goyafly" className="h-14 w-auto object-contain" style={{ maxWidth: '200px' }} />
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              India's premier B2B travel technology platform, empowering travel agents with cutting-edge inventory and seamless booking solutions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                📘
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                🐦
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                💼
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
               <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Join Network</Link></li>
              <li><Link to="/admin/login" className="text-gray-500 hover:text-red-400 transition-colors text-xs font-black uppercase tracking-widest mt-4 inline-block italic">👑 Admin Access</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Flight Bookings</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Hotel Reservations</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Bus & Train Tickets</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Visa Assistance</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Travel Insurance</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2026 Goyafly Pvt Ltd. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/about" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link to="/about" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;