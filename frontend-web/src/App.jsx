import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Home from './pages/public/Home';
import AgentLogin from './pages/public/AgentLogin';
import AdminLogin from './pages/public/AdminLogin';
import AgentRegister from './pages/public/AgentRegister';
import AboutCompany from './pages/public/AboutCompany';
import ContactSupport from './pages/public/ContactSupport';
import Dashboard from './pages/agent/Dashboard';
import FlightSearch from './pages/agent/FlightSearch';
import Wallet from './pages/agent/Wallet';
import BookingHistory from './pages/agent/BookingHistory';
import EarningsReport from './pages/agent/EarningsReport';
import VisaInsurance from './pages/agent/VisaInsurance';
import BusTrainSearch from './pages/agent/BusTrainSearch';
import { HotelSearch, BusSearch, TrainSearch } from './pages/agent/GenericSearchComponents';
import OTBApply from './pages/public/OTBApply';
import OTBStatus from './pages/public/OTBStatus';
import AdminDashboard from './pages/admin/AdminDashboard';
import AgentManager from './pages/admin/AgentManager';
import BookingManager from './pages/admin/BookingManager';
import CommissionSetup from './pages/admin/CommissionSetup';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import OfferManager from './pages/admin/OfferManager';
import AgentProfile from './pages/agent/AgentProfile';
import Ledger from './pages/agent/Ledger';
import MarkupSetup from './pages/agent/MarkupSetup';
import Holidays from './pages/agent/Holidays';
import Notifications from './pages/agent/Notifications';
import Tickets from './pages/agent/Tickets';
import PromotionManager from './pages/admin/PromotionManager';
import SubAgentManager from './pages/admin/SubAgentManager';

import GlobalSettings from './pages/admin/GlobalSettings';
import OTBManager from './pages/admin/OTBManager';
import HolidayManager from './pages/admin/HolidayManager';
import VisaManager from './pages/admin/VisaManager';
import RefundManager from './pages/admin/RefundManager';
import RescheduleManager from './pages/admin/RescheduleManager';
import PostBookingManager from './pages/admin/PostBookingManager';
import Checkout from './pages/agent/Checkout';
import ServiceCheckout from './pages/agent/ServiceCheckout';
import OTBAgent from './pages/agent/OTBAgent';
import MyRefunds from './pages/agent/MyRefunds';
import FlightCancellation from './pages/agent/FlightCancellation';
import FlightReschedule from './pages/agent/FlightReschedule';
import GroupFares from './pages/agent/GroupFares';
import KycStatusCheck from './pages/agent/KycStatusCheck';
import FixedDepartureSearch from './pages/agent/FixedDepartureSearch';
import FixedDepartureBookingForm from './pages/agent/FixedDepartureBookingForm';
import FixedDepartureHistory from './pages/agent/FixedDepartureHistory';

import FixedDepartureManager from './pages/admin/FixedDepartureManager';
import FixedDepartureBookingManager from './pages/admin/FixedDepartureBookingManager';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatWidget from './components/AIChatWidget';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function GlobalMarquee() {
  const { pathname } = useLocation();
  const showMarquee = pathname === '/' || pathname === '/register';

  if (!showMarquee) return null;

  return (
    <div className="flex flex-col bg-[#1D4171] overflow-hidden py-3.5 border-b border-white/10 relative z-40 shadow-2xl w-full min-w-0">
       <div className="flex animate-marquee whitespace-nowrap gap-40 items-center w-full min-w-0">
          <span className="flex-shrink-0 text-[#F07E21] font-black text-xs md:text-xl uppercase tracking-[0.4em] italic drop-shadow-sm whitespace-nowrap">🚀 GOYAFLY.COM: THE FUTURE OF B2B TRAVEL IS HERE</span>
          <span className="flex-shrink-0 text-white font-bold text-[10px] md:text-lg tracking-wide opacity-90 whitespace-nowrap">
             Empowering 15,000+ travel professionals with India's most advanced, GDS-integrated ecosystem for instant ticketing, worldwide net-fares, and ultra-secure wallet settlements. 
          </span>
          <span className="flex-shrink-0 text-[#48A0D4] font-black text-xs md:text-xl uppercase tracking-[0.4em] italic whitespace-nowrap">💎 PREMIUM SME FARES & EXCLUSIVE JET DEALS LIVE</span>
          <span className="flex-shrink-0 text-white/80 font-bold text-[10px] md:text-lg tracking-wide opacity-70 whitespace-nowrap">
             Unlock massive margins with our proprietary fare matching engine. Instant refunds, automated status polling, and one-click ticket generation ready for your business. 
          </span>
          <span className="flex-shrink-0 text-[#F07E21] font-black text-xs md:text-xl uppercase tracking-[0.4em] italic whitespace-nowrap">🛡️ 24/7 PRIORITY PARTNER SUPPORT & INSTANT KYC</span>
          <span className="flex-shrink-0 text-[#F07E21] font-black text-xs md:text-xl uppercase tracking-[0.4em] italic whitespace-nowrap">🚀 GOYAFLY.COM: THE FUTURE OF B2B TRAVEL IS HERE</span>
       </div>
    </div>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-[#f4f7fe] dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300 w-full min-w-0 overflow-x-hidden">
      <Navbar />
      <GlobalMarquee />
      <div className="flex flex-1 w-full min-w-0 overflow-x-hidden">
        <Routes>
          {/* Public Routes - No Sidebar */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AgentLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<AgentRegister />} />
          <Route path="/about" element={<AboutCompany />} />
          <Route path="/contact" element={<ContactSupport />} />
          <Route path="/otb/apply" element={<OTBApply />} />
          <Route path="/otb/status" element={<OTBStatus />} />

          {/* Agent Routes - With Sidebars */}
          <Route path="/agent/*" element={
            <ProtectedRoute requiredRole="agent">
              <div className="flex w-full min-w-0 overflow-x-hidden">
                <Sidebar type="agent" />
                <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="flight-search" element={<FlightSearch />} />
                  <Route path="wallet" element={<Wallet />} />
                  <Route path="history" element={<BookingHistory />} />
                  <Route path="visa-insurance" element={<VisaInsurance />} />
                  <Route path="surface-transport" element={<BusTrainSearch />} />
                  <Route path="hotel-search" element={<HotelSearch />} />
                  <Route path="bus-search" element={<BusSearch />} />
                  <Route path="train-search" element={<TrainSearch />} />
                  <Route path="profile" element={<AgentProfile />} />
                  <Route path="ledger" element={<Ledger />} />
                  <Route path="markup" element={<MarkupSetup />} />
                  <Route path="holidays" element={<Holidays />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="tickets" element={<Tickets />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="checkout-service" element={<ServiceCheckout />} />
                  <Route path="otb" element={<OTBAgent />} />
                  <Route path="my-refunds" element={<MyRefunds />} />
                  <Route path="group-fares" element={<GroupFares />} />
                  <Route path="earnings" element={<EarningsReport />} />
                  <Route path="kyc-status" element={<KycStatusCheck />} />
                  <Route path="fixed-departure-search" element={<FixedDepartureSearch />} />
                  <Route path="fixed-departure-book" element={<FixedDepartureBookingForm />} />
                  <Route path="fixed-departure-history" element={<FixedDepartureHistory />} />
                </Routes>
              </main>
            </div>
            </ProtectedRoute>
          } />

          {/* Admin Routes - With Sidebars */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <div className="flex w-full min-w-0 overflow-x-hidden">
                <Sidebar type="admin" />
                <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="agents" element={<AgentManager />} />
                  <Route path="bookings" element={<BookingManager />} />
                  <Route path="commissions" element={<CommissionSetup />} />
                  <Route path="reports" element={<ReportsAnalytics />} />
                  <Route path="offers" element={<OfferManager />} />
                  <Route path="promotions" element={<PromotionManager />} />
                  <Route path="sub-agents" element={<SubAgentManager />} />

                  <Route path="otb" element={<OTBManager />} />
                  <Route path="holidays" element={<HolidayManager />} />
                  <Route path="visas" element={<VisaManager />} />
                  <Route path="refunds" element={<PostBookingManager />} />
                  <Route path="reschedules" element={<PostBookingManager />} />
                  <Route path="requests" element={<PostBookingManager />} />
                  <Route path="settings" element={<GlobalSettings />} />
                  <Route path="fixed-departure-inventory" element={<FixedDepartureManager />} />
                  <Route path="fixed-departure-bookings" element={<FixedDepartureBookingManager />} />
                </Routes>
              </main>
            </div>
            </ProtectedRoute>
          } />

          <Route path="/book/flights/flight_cancellation/:id" element={
            <ProtectedRoute requiredRole="agent">
              <FlightCancellation />
            </ProtectedRoute>
          } />

          <Route path="/book/flights/flight_reschedule/:id" element={
            <ProtectedRoute requiredRole="agent">
              <FlightReschedule />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
      <AIChatWidget />
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AppContent />
      </Router>
    </HelmetProvider>
  );
}

export default App;