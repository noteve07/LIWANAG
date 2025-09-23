import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0D1117] to-[#1C2834] flex flex-col items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245,158,11,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Main Loading Content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Animated Light Bulb */}
        <div className="relative">
          <div 
            className="w-20 h-20 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              animation: 'slowPulse 3s ease-in-out infinite',
              filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.6))',
            }}
          >
            {/* Light Bulb SVG - Same as Map Loading */}
            <svg 
              className="w-10 h-10 text-gray-900" 
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          
          {/* Glowing Ring */}
          <div 
            className="absolute inset-0 w-20 h-20 border-4 border-amber-400/30 rounded-full"
            style={{
              animation: 'slowPulse 3s ease-in-out infinite 0.5s',
            }}
          ></div>
          
          {/* Outer Glow */}
          <div 
            className="absolute inset-0 w-24 h-24 -m-2 border-2 border-amber-300/20 rounded-full"
            style={{
              animation: 'slowPulse 3s ease-in-out infinite 1s',
            }}
          ></div>
        </div>
        
        {/* LIWANAG Text */}
        <div className="text-center space-y-2">
          <h1 
            className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent tracking-wider"
            style={{
              animation: 'textPulse 3s ease-in-out infinite 1.5s',
            }}
          >
            LIWANAG
          </h1>
          <p 
            className="text-lg text-amber-200/80 font-medium"
            style={{
              animation: 'textPulse 3s ease-in-out infinite 2s',
            }}
          >
            Lighting Intelligence with Automated
          </p>
          <p 
            className="text-lg text-amber-200/80 font-medium"
            style={{
              animation: 'textPulse 3s ease-in-out infinite 2.2s',
            }}
          >
            Navigation for Analytics & Governance
          </p>
        </div>
        
        {/* Loading Dots */}
        <div className="flex space-x-2 mt-8">
          <div 
            className="w-3 h-3 bg-amber-400 rounded-full"
            style={{ animation: 'bounce 1.5s ease-in-out infinite' }}
          ></div>
          <div 
            className="w-3 h-3 bg-amber-400 rounded-full"
            style={{ animation: 'bounce 1.5s ease-in-out infinite 0.2s' }}
          ></div>
          <div 
            className="w-3 h-3 bg-amber-400 rounded-full"
            style={{ animation: 'bounce 1.5s ease-in-out infinite 0.4s' }}
          ></div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slowPulse {
          0%, 100% { 
            opacity: 0.4;
            transform: scale(1);
          }
          20% { 
            opacity: 1;
            transform: scale(1.05);
          }
          80% { 
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @keyframes textPulse {
          0%, 100% { 
            opacity: 0.6;
          }
          20% { 
            opacity: 1;
          }
          80% { 
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
