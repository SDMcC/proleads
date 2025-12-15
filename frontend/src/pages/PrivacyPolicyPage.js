import React from 'react';
import Footer from '../components/landing/Footer';

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center space-x-3">
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold">Proleads Network</span>
            </a>
            <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Policies</h1>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Jump to:</h3>
            <ul className="space-y-2">
              <li><a href="#privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a></li>
              <li><a href="#refund-policy" className="text-blue-600 hover:text-blue-800">Refund Policy</a></li>
              <li><a href="#contact" className="text-blue-600 hover:text-blue-800">Contact Us</a></li>
            </ul>
          </div>

          <section id="privacy-policy" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h2>
            <p className="text-gray-600 mb-4"><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
            
            <p className="text-gray-700 mb-6">
              This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your 
              information when You use the Service and tells You about Your privacy rights and how the law protects You.
            </p>

            <p className="text-gray-700 mb-8">
              We use Your Personal data to provide and improve the Service. By using the Service, You agree to the 
              collection and use of information in accordance with this Privacy Policy.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Information We Collect</h3>
            <p className="text-gray-700 mb-4">
              While using Our Service, We may ask You to provide Us with certain personally identifiable information 
              that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Email address</li>
              <li>Username and password</li>
              <li>Cryptocurrency wallet addresses</li>
              <li>Usage Data</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">How We Use Your Information</h3>
            <p className="text-gray-700 mb-4">The Company may use Personal Data for the following purposes:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li><strong>To provide and maintain our Service:</strong> including monitoring usage of our Service</li>
              <li><strong>To manage Your Account:</strong> manage Your registration as a user of the Service</li>
              <li><strong>To process payments:</strong> handle cryptocurrency transactions and commission payments</li>
              <li><strong>To contact You:</strong> regarding updates, security notices, or support requests</li>
              <li><strong>For business transfers:</strong> in connection with mergers or asset transfers</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Data Security</h3>
            <p className="text-gray-700 mb-6">
              The security of Your Personal Data is important to Us, but remember that no method of transmission over 
              the Internet, or method of electronic storage is 100% secure. While We strive to use commercially 
              acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Blockchain and Cryptocurrency</h3>
            <p className="text-gray-700 mb-6">
              Our service involves cryptocurrency transactions on blockchain networks. Please note that blockchain 
              transactions are public and immutable. While wallet addresses may be pseudonymous, transaction data 
              is permanently recorded on the blockchain.
            </p>
          </section>

          <section id="refund-policy" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Return & Refund Policy</h2>
            <p className="text-gray-600 mb-4"><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
            
            <p className="text-gray-700 mb-6">
              All payments including commission payouts to our affiliates and members are made using USDC and are 
              processed, split and transferred instantly to the personal wallets of all members and affiliates who 
              are part of the respective sale - up to seven individual wallets.
            </p>

            <p className="text-gray-700 mb-6">
              Due to the nature of the blockchain and cryptocurrency in general, transactions can only be refunded 
              by the party receiving the funds, so it is not possible for us to offer refunds without the agreement 
              and action of the other parties involved.
            </p>

            <p className="text-gray-700 mb-6">
              If you have any questions, concerns, or complaints regarding this refund policy, we encourage you to 
              contact us using the details below.
            </p>
          </section>

          <section id="contact" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, You can contact us:
            </p>
            <ul className="text-gray-700 space-y-2">
              <li>By email: <a href="mailto:support@members.proleads.network" className="text-blue-600 hover:text-blue-800">support@members.proleads.network</a></li>
              <li>Through our member support system in your dashboard</li>
            </ul>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Terms of Service Page Component

export default PrivacyPolicyPage;
