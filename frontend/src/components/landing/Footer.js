import React from 'react';

function Footer() {
  
  const scrollToSection = (sectionId) => {
    // If we're not on the homepage, navigate to it first
    if (window.location.pathname !== '/') {
      window.location.href = '/';
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSmoothScroll = (sectionId) => {
    if (window.location.pathname !== '/') {
      // If not on homepage, navigate to homepage and then scroll
      window.location.href = '/#' + sectionId;
    } else {
      scrollToSection(sectionId);
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="flex flex-col items-center mb-4">
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="w-20 h-auto mb-2"
              />
              <p className="text-gray-400 text-lg">
                Your LeadGen Partner
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><button onClick={() => handleSmoothScroll('about')} className="text-gray-400 hover:text-white transition-colors text-left">About</button></li>
              <li><button onClick={() => handleSmoothScroll('pricing')} className="text-gray-400 hover:text-white transition-colors text-left">Pricing</button></li>
              <li><a href="/affiliates" className="text-gray-400 hover:text-white transition-colors">Affiliates</a></li>
              <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Members Area</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-400">Email: support@members.proleads.network</span></li>
              <li><span className="text-gray-400">24/7 Member Support</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Proleads Network. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
