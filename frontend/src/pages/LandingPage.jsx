import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import AboutTimeline from '../components/AboutTimeline';

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#0A0A0A', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar />
      <HeroSection />
      <AboutTimeline />
    </div>
  );
}
