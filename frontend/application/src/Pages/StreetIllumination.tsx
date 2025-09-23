import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MapVisualization from "../components/Map/MapVisualization";
import { Bot, X, Send, MessageCircle } from "lucide-react";

function StreetIllumination() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="absolute -inset-4 overflow-hidden">
      <MapVisualization height="100%" width="100%" />
      
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-900 px-8 py-4 rounded-full shadow-2xl flex items-center space-x-3 font-semibold transition-all duration-300 hover:scale-105 z-50 text-lg"
        >
          <Bot size={24} />
          <span>Ask Luxor</span>
        </button>
      )}

      {/* Chat Popup */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#151E2A] border border-slate-600/50 rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 px-4 py-3 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <span className="font-semibold">Luxor AI</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/luxor')}
                className="hover:bg-black/10 rounded-full p-1.5 transition-colors"
                title="Go to full chat"
              >
                <MessageCircle size={16} />
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                className="hover:bg-black/10 rounded-full p-1.5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {/* Luxor's greeting message */}
            <div className="flex items-start space-x-2">
              <div className="bg-amber-400 rounded-full p-1.5 flex-shrink-0">
                <Bot size={12} className="text-gray-900" />
              </div>
              <div className="bg-slate-700/50 text-white text-sm px-3 py-2 rounded-lg rounded-tl-none max-w-[200px]">
                Hi I am Luxor, how can I help you?
              </div>
            </div>
            
            {/* Sample user message */}
            <div className="flex items-start space-x-2 justify-end">
              <div className="bg-amber-400 text-gray-900 text-sm px-3 py-2 rounded-lg rounded-tr-none max-w-[200px]">
                Hello Luxor, are the streetlights in Cupang Proper dim?
              </div>
            </div>
            
            {/* Sample Luxor response */}
            <div className="flex items-start space-x-2">
              <div className="bg-amber-400 rounded-full p-1.5 flex-shrink-0">
                <Bot size={12} className="text-gray-900" />
              </div>
              <div className="bg-slate-700/50 text-white text-sm px-3 py-2 rounded-lg rounded-tl-none max-w-[200px]">
                As of 9:00 PM the lights are working well, as they measure at 795 lux.
              </div>
            </div>
          </div>
          
          {/* Chat Input */}
          <div className="p-3 border-t border-slate-600/30">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type your Message..."
                className="flex-1 bg-slate-700/30 border border-slate-600/30 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-yellow-400/50 placeholder-gray-400"
              />
              <button className="bg-amber-400 hover:bg-yellow-500 text-gray-900 p-2 rounded-lg transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreetIllumination;
