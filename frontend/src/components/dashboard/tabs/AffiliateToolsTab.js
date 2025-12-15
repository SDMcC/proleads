import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Share2 } from 'lucide-react';

function AffiliateToolsTab({ user }) {
  const [editableText, setEditableText] = useState('🚀 Join the Web3 revolution! Earn up to 30% commission with our 4-tier affiliate system. Connect your wallet and start earning instant crypto payouts in USDC!');
  const [isEditingText, setIsEditingText] = useState(false);

  const copyReferralLink = () => {
    const shortLink = getShortenedLink();
    navigator.clipboard.writeText(shortLink);
    alert('Referral link copied to clipboard!');
  };

  const getShortenedLink = () => {
    if (!user?.referral_code) return user?.referral_link || '';
    // Create a shortened version using referral code
    const baseUrl = window.location.origin;
    return `${baseUrl}/r/${user.referral_code}`;
  };

  const generateQRCode = () => {
    // Use QR Server API which is more reliable than Google Charts
    const qrData = encodeURIComponent(getShortenedLink());
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=FFFFFF&color=000000`;
  };

  const downloadQRCode = async () => {
    try {
      const qrUrl = generateQRCode();
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `referral-qr-code-${user?.username || 'user'}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Failed to download QR code');
    }
  };

  const shareToSocial = (platform) => {
    const referralLink = getShortenedLink();
    const text = editableText + ' ';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyPromotionalText = () => {
    const textWithLink = `${editableText} ${getShortenedLink()}`;
    navigator.clipboard.writeText(textWithLink);
    alert('Promotional text with link copied!');
  };

  const saveEditableText = () => {
    setIsEditingText(false);
    // Here you could save to backend if needed
  };

  return (
    <div className="space-y-6">
      {/* Referral Link */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Your Referral Link</h3>
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="text"
            value={getShortenedLink()}
            readOnly
            className="flex-1 px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-300"
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </button>
        </div>
        
        {/* QR Code */}
        <div className="text-center">
          <h4 className="text-white font-medium mb-3">QR Code</h4>
          <div className="inline-block p-4 bg-white rounded-lg mb-3">
            <img 
              src={generateQRCode()} 
              alt="Referral QR Code" 
              className="w-48 h-48"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' fill='%23999'%3E%3Crect width='192' height='192' fill='%23f3f3f3'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14'%3EQR Code%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
          <div className="space-x-2">
            <p className="text-gray-400 text-sm mb-2">Scan to visit your referral link</p>
            <button
              onClick={downloadQRCode}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-300"
            >
              Download QR Code
            </button>
          </div>
        </div>
      </div>

      {/* Social Share Buttons */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Share on Social Media</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            onClick={() => shareToSocial('x')}
            className="flex flex-col items-center p-4 bg-black hover:bg-gray-800 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">X</span>
          </button>

          <button
            onClick={() => shareToSocial('facebook')}
            className="flex flex-col items-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">Facebook</span>
          </button>

          <button
            onClick={() => shareToSocial('linkedin')}
            className="flex flex-col items-center p-4 bg-blue-700 hover:bg-blue-800 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">LinkedIn</span>
          </button>

          <button
            onClick={() => shareToSocial('telegram')}
            className="flex flex-col items-center p-4 bg-blue-400 hover:bg-blue-500 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">Telegram</span>
          </button>

          <button
            onClick={() => shareToSocial('whatsapp')}
            className="flex flex-col items-center p-4 bg-green-500 hover:bg-green-600 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Marketing Materials */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Marketing Materials</h3>
        <div className="space-y-4">
          <div className="p-4 bg-black bg-opacity-20 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-medium">Promotional Text</h4>
              <button
                onClick={() => setIsEditingText(!isEditingText)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all duration-300"
              >
                {isEditingText ? 'Save' : 'Edit'}
              </button>
            </div>
            
            {isEditingText ? (
              <div className="space-y-3">
                <textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white text-sm"
                  rows={4}
                  placeholder="Enter your promotional text..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={saveEditableText}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all duration-300"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingText(false);
                      setEditableText('🚀 Join the Web3 revolution! Earn up to 30% commission with our 4-tier affiliate system. Connect your wallet and start earning instant crypto payouts in USDC!');
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all duration-300"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 text-sm mb-3">
                  "{editableText}"
                </p>
                <p className="text-blue-400 text-sm mb-3 break-all">
                  Link: {getShortenedLink()}
                </p>
                <button
                  onClick={copyPromotionalText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all duration-300"
                >
                  Copy Text + Link
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-black bg-opacity-20 rounded-lg">
            <h4 className="text-white font-medium mb-2">Commission Structure</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-blue-300 font-bold">Affiliate</p>
                <p className="text-white text-sm">25% / 5%</p>
              </div>
              <div>
                <p className="text-orange-300 font-bold">Bronze</p>
                <p className="text-white text-sm">25% / 5% / 3% / 2%</p>
              </div>
              <div>
                <p className="text-gray-300 font-bold">Silver</p>
                <p className="text-white text-sm">27% / 10% / 5% / 3%</p>
              </div>
              <div>
                <p className="text-yellow-300 font-bold">Gold</p>
                <p className="text-white text-sm">30% / 15% / 10% / 5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default AffiliateToolsTab;
