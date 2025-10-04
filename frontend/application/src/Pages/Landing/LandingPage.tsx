import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lightbulb, Sparkles, Zap, Users, LineChart, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Navigation links
const navLinks = [
  { label: 'Home', href: '#hero' },
  { label: 'Overview', href: '#overview' },
  { label: 'Features', href: '#features' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'Contact', href: '#footer' }
];

// Overview slides data
const overviewSlides = [
  {
    title: 'Smart Data Collection',
    description: 'Advanced sensors capture real-time light intensity data across Balanga City, creating a comprehensive illumination map.',
    image: 'https://i.imgur.com/tWdJYVx.png' // Replace with actual image URL or import local image
  },
  {
    title: 'Interactive Mapping',
    description: 'Visualize street segment illumination levels across all barangays to identify areas falling below safety thresholds.',
    image: 'https://i.imgur.com/B9MKg60.png' // Replace with actual image URL or import local image
  },
  {
    title: 'AI-Powered Analytics',
    description: 'Machine learning algorithms identify patterns and predict maintenance needs before they become critical issues.',
    image: 'https://i.imgur.com/JsJJNWn.png' // Replace with actual image URL or import local image
  }
];

// Features data
const features = [
  {
    title: 'Real-Time Monitoring',
    description: 'Continuous data collection and monitoring of city-wide street illumination.',
    icon: <Zap className="h-6 w-6 text-yellow-400" />
  },
  {
    title: 'Automated Alerts',
    description: 'Instant notifications when street lighting falls below safety thresholds.',
    icon: <Sun className="h-6 w-6 text-yellow-400" />
  },
  {
    title: 'Data-Driven Decisions',
    description: 'Objective measurements enable precise resource allocation and planning.',
    icon: <LineChart className="h-6 w-6 text-yellow-400" />
  },
  {
    title: 'Enhanced Public Safety',
    description: 'Improved lighting promotes safer streets and reduces crime potential.',
    icon: <Users className="h-6 w-6 text-yellow-400" />
  }
];

// Benefits statements
const benefitStatements = [
  'Replace manual observation with objective, real-time data collection',
  'Enhance citizen safety through intelligent street illumination monitoring',
  'Support Smart City goals with data-driven decision making',
  'Prioritize repairs and maintenance based on actual needs',
  'Improve response time to lighting issues across all barangays'
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  
  // Refs for scroll animations
  const overviewRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // Update scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className="relative min-h-screen bg-[#121212] text-white overflow-hidden">
      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes rotateGlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .animate-from-left {
          opacity: 0;
          transform: translateX(-30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .animate-from-left.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .animate-from-right {
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .animate-from-right.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .animate-scale {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .animate-scale.visible {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[#121212] z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,216,20,0.15),_transparent_50%)] z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,216,20,0.1),_transparent_50%)] z-0" />
      
      {/* Animated background elements */}
      <div className="absolute top-40 right-[20%] h-64 w-64 rounded-full bg-yellow-500/5 blur-3xl animate-[glowPulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-40 left-[15%] h-64 w-64 rounded-full bg-yellow-500/5 blur-3xl animate-[glowPulse_12s_ease-in-out_infinite_1s]" />

      {/* Fixed Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-yellow-900/30 bg-[#121212]/90 backdrop-blur-lg">
        <div className="mx-auto w-full max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
          {/* City Branding */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-900/20">
              <Lightbulb className="h-7 w-7 text-[#121212]" />
              <span className="absolute inset-0 rounded-xl border border-yellow-300/30" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-yellow-400">City of Balanga</span>
              <span className="text-lg font-semibold text-white">LIWANAG Project</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 lg:flex">
            {navLinks.map((link) => (
              <a 
                key={link.label} 
                href={link.href} 
                className="transition-colors duration-200 hover:text-yellow-400"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Login Button */}
          <button
            onClick={() => navigate('/app/dashboard')}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black shadow-md transition-all duration-200 hover:-translate-y-[1px] hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-600/20"
          >
            Login
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col">
        {/* Hero Section - Full Width background only, no card-like appearance */}
        <section id="hero" className="relative overflow-hidden w-full h-screen bg-[#1a1a1a] border-b border-yellow-900/20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-yellow-500/5" />

          <div className="relative mx-auto w-full h-screen max-w-6xl grid gap-10 px-4 sm:px-6 md:px-12 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8 motion-safe:animate-[fadeInUp_1s_ease-out]">
              {/* Main Title */}
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-yellow-300">
                <Sparkles className="h-3 w-3" />
                Smart City Initiative
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl">
                  <span className="text-yellow-400">LIWANAG</span>
                </h1>
                <h2 className="text-xl font-medium text-yellow-300 sm:text-2xl">
                  Lighting Intelligence With Automated Navigation for Analytics and Governance
                </h2>
              </div>

              {/* Tagline */}
              <p className="max-w-2xl text-xl leading-relaxed text-slate-300 sm:text-2xl">
                Revolutionizing Balanga City's street lighting through data-driven intelligence and automated monitoring systems.
              </p>

              {/* Key Points */}
              <div className="grid gap-4 text-slate-200">
                {benefitStatements.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-400" />
                    <p>{benefit}</p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-8 py-4 text-base font-semibold text-black shadow-lg transition-all duration-200 hover:-translate-y-[2px] hover:bg-yellow-400 hover:shadow-xl hover:shadow-yellow-600/20"
                >
                  Request Access
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-transparent px-8 py-4 text-base font-semibold text-yellow-400 transition-all duration-200 hover:-translate-y-[2px] hover:border-yellow-400 hover:text-yellow-300"
                >
                  View Platform
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative flex items-center justify-center motion-safe:animate-[gentleFloat_6s_ease-in-out_infinite]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400/20 via-transparent to-yellow-400/10 blur-3xl" />
              <div className="relative aspect-square w-full max-w-sm">
                <div className="absolute inset-0 rounded-full border-[20px] border-yellow-400/5 animate-[rotateGlow_120s_linear_infinite]" />
                <div className="absolute inset-8 rounded-full border-[15px] border-yellow-400/10 animate-[rotateGlow_90s_linear_infinite_reverse]" />
                <div className="absolute inset-16 rounded-full border-[8px] border-yellow-400/20 animate-[rotateGlow_60s_linear_infinite]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-2xl animate-[glowPulse_3s_ease-in-out_infinite]">
                    <Lightbulb className="absolute inset-0 m-auto h-12 w-12 text-[#121212]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Overview Section - Full Width background only */}
        <section 
          id="overview" 
          ref={overviewRef} 
          className="w-full bg-[#242424]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 py-20">
            <div className={`mb-12 text-center animate-on-scroll ${
              scrollY > (overviewRef.current?.offsetTop || 0) - window.innerHeight * 0.8 ? 'visible' : ''
            }`}>
              <span className="inline-block rounded-full bg-yellow-400/10 px-4 py-1.5 text-sm font-medium text-yellow-400">
                About
              </span>
              <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
                Overview
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-xl text-slate-300">
                How LIWANAG transforms street lighting management in Balanga City through
                innovative technology and data-driven solutions.
              </p>
            </div>

            {/* Overview Content - With UI mockups instead of icons */}
            <div className="grid gap-8 md:grid-cols-3">
              {overviewSlides.map((slide, index) => (
                <div
                  key={slide.title}
                  className={`flex flex-col items-center text-center animate-on-scroll ${
                    scrollY > (overviewRef.current?.offsetTop || 0) - window.innerHeight * 0.7 + index * 100 ? 'visible' : ''
                  }`}
                  style={{ transitionDelay: `${index * 0.2}s` }}
                >
                  {/* UI Mockup Image */}
                  <div className="mb-6 w-full max-w-[240px] rounded-lg overflow-hidden shadow-xl transform transition-transform hover:scale-105">
                    <div className="bg-[#1a1a1a] p-1 rounded-t-lg flex items-center">
                      <div className="flex gap-1.5 ml-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <div className="bg-[#2a2a2a] overflow-hidden">
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full object-cover aspect-[4/3] hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="mb-4 text-xl font-bold text-white">
                    {slide.title}
                  </h3>
                  <p className="text-base leading-relaxed text-slate-300">
                    {slide.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          id="features" 
          ref={featuresRef}
          className="py-16"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 space-y-12">
            <div className={`text-center animate-on-scroll ${
              scrollY > (featuresRef.current?.offsetTop || 0) - window.innerHeight * 0.8 ? 'visible' : ''
            }`}>
              <span className="inline-block rounded-full bg-yellow-400/10 px-4 py-1.5 text-sm font-medium text-yellow-400">
                Key Features
              </span>
              <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
                Why Choose LIWANAG
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-xl text-slate-300">
                Professional, reliable, and built to government standards for the City of Balanga
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className={`rounded-xl border border-yellow-900/30 bg-[#1a1a1a] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/50 ${
                    index % 2 === 0 ? 'animate-from-left' : 'animate-from-right'
                  } ${
                    scrollY > (featuresRef.current?.offsetTop || 0) - window.innerHeight * 0.7 + Math.floor(index/2) * 100 ? 'visible' : ''
                  }`}
                  style={{ transitionDelay: `${index * 0.15}s` }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-400/10">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-base text-slate-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section 
          id="benefits"
          ref={benefitsRef} 
          className="w-full bg-[#1a1a1a]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className={`inline-block rounded-full bg-yellow-400/10 px-4 py-1.5 text-sm font-medium text-yellow-400 animate-on-scroll ${
                scrollY > (benefitsRef.current?.offsetTop || 0) - window.innerHeight * 0.8 ? 'visible' : ''
              }`}>
                Advantages
              </span>
              <h2 className={`mt-4 text-4xl font-bold text-white animate-on-scroll ${
                scrollY > (benefitsRef.current?.offsetTop || 0) - window.innerHeight * 0.8 ? 'visible' : ''
              }`} style={{ transitionDelay: '0.1s' }}>
                Benefits for Balanga City
              </h2>
              <p className={`mt-4 text-xl text-slate-300 animate-on-scroll ${
                scrollY > (benefitsRef.current?.offsetTop || 0) - window.innerHeight * 0.8 ? 'visible' : ''
              }`} style={{ transitionDelay: '0.2s' }}>
                LIWANAG brings numerous advantages to both city officials and residents
              </p>
              
              <div className="mt-10 grid gap-6">
                {benefitStatements.map((benefit, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-4 animate-from-left ${
                      scrollY > (benefitsRef.current?.offsetTop || 0) - window.innerHeight * 0.7 + index * 50 ? 'visible' : ''
                    }`}
                    style={{ transitionDelay: `${index * 0.2}s` }}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400">
                      <span className="font-bold text-black">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">{benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Benefits Visual */}
            <div className={`relative flex items-center justify-center motion-safe:animate-[gentleFloat_10s_ease-in-out_infinite] animate-from-right ${
              scrollY > (benefitsRef.current?.offsetTop || 0) - window.innerHeight * 0.7 ? 'visible' : ''
            }`}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-yellow-500/10 via-transparent to-yellow-500/5 blur-3xl" />
              <div className="relative aspect-[4/3] w-full max-w-xl rounded-3xl border border-yellow-500/10 bg-[#242424] p-10 shadow-2xl">
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed border-yellow-500/20 bg-black/20 p-6 text-center">
                  <Lightbulb className="h-20 w-20 text-yellow-400" />
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-white">Illuminating Balanga's Future</p>
                    <p className="text-base text-slate-300">
                      LIWANAG combines hardware and software solutions to transform street lighting management and enhance public safety.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section 
          className="px-4 sm:px-6 md:px-8 py-20 text-center"
          ref={ctaRef}
        >
          <div className={`mx-auto max-w-5xl rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 p-0.5 shadow-lg animate-scale ${
            scrollY > (ctaRef.current?.offsetTop || 0) - window.innerHeight * 0.8 ? 'visible' : ''
          }`}>
            <div className="rounded-[calc(0.75rem-1px)] bg-[#1a1a1a] px-8 py-12 sm:px-12">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to experience LIWANAG?
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-300">
                Join the smart city revolution and transform how Balanga City manages street illumination
              </p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-8 py-3 text-base font-semibold text-black shadow-lg transition-all duration-200 hover:-translate-y-[2px] hover:bg-yellow-400 hover:shadow-xl"
                >
                  Request Access
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-transparent px-8 py-3 text-base font-semibold text-yellow-400 transition-all duration-200 hover:-translate-y-[2px] hover:border-yellow-400 hover:text-yellow-300"
                >
                  View Dashboard
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer" className="relative z-10 border-t border-yellow-900/30 bg-[#121212] py-10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600">
                <Lightbulb className="h-5 w-5 text-[#121212]" />
              </div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-yellow-400">
                LIWANAG
              </p>
            </div>
            <p className="text-slate-400">
              © {new Date().getFullYear()} Liwanag Dev Team
            </p>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <button 
              onClick={() => navigate('/login')} 
              className="transition-colors duration-200 hover:text-yellow-400"
            >
              About
            </button>
            <button 
              onClick={() => window.open('mailto:ict@balangacity.gov.ph', '_blank')} 
              className="transition-colors duration-200 hover:text-yellow-400"
            >
              Contact
            </button>
            <button 
              onClick={() => window.open('https://balangacity.gov.ph/privacy', '_blank')} 
              className="transition-colors duration-200 hover:text-yellow-400"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigate('/app/dashboard')} 
              className="transition-colors duration-200 hover:text-yellow-400"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}