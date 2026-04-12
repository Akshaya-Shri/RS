"use client";

import { useEffect, useState } from "react";

export default function FloatingWhatsApp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <a
      href="https://wa.me/910000000000" 
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 p-4 bg-[#25D366] text-white rounded-full shadow-2xl transition-all duration-500 overflow-visible group ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      }`}
      aria-label="Chat on WhatsApp"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12.031 0C5.385 0 0 5.386 0 12.031c0 2.128.552 4.195 1.6 6.012L.159 23.364l5.441-1.428a11.967 11.967 0 0 0 6.431 1.861h.005c6.643 0 12.034-5.386 12.034-12.035C24.068 5.426 18.679 0 12.031 0zm0 21.802h-.004a10.007 10.007 0 0 1-5.1-1.397l-.365-.217-3.794.995.998-3.7-.238-.378a9.982 9.982 0 0 1-1.528-5.368c0-5.514 4.49-10.003 10.008-10.003 5.518 0 10.008 4.49 10.008 10.002 0 5.515-4.49 10.004-10.005 10.004zm5.498-7.509c-.302-.151-1.785-.882-2.062-.983-.277-.101-.48-.151-.682.151-.202.302-.782.983-.958 1.185-.177.202-.354.227-.656.076-1.517-.768-2.618-1.468-3.628-3.197-.177-.302-.019-.465.132-.616.136-.136.302-.353.454-.53.151-.177.202-.303.302-.505.101-.202.051-.379-.025-.53-.076-.152-.682-1.643-.934-2.25-.246-.593-.497-.513-.682-.522-.177-.008-.379-.008-.58-.008s-.53.076-.808.379c-.277.303-1.06 1.036-1.06 2.527s1.085 2.93 1.236 3.132c.151.202 2.135 3.259 5.174 4.568.723.311 1.287.498 1.725.637.727.231 1.389.198 1.906.12.58-.088 1.785-.73 2.037-1.435.253-.705.253-1.31.177-1.435-.076-.126-.277-.202-.58-.353z"/>
      </svg>
      {/* Dynamic Ripple */}
      <span className="absolute -inset-2 rounded-full border border-[#25D366] opacity-0 group-hover:animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
    </a>
  );
}
