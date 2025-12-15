import React from 'react';
import Footer from '../components/landing/Footer';

function TermsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Jump to:</h3>
            <ul className="space-y-2">
              <li><a href="#terms-conditions" className="text-blue-600 hover:text-blue-800">Website Terms & Conditions</a></li>
              <li><a href="#kyc-policy" className="text-blue-600 hover:text-blue-800">Know Your Customer</a></li>
              <li><a href="#participation-terms" className="text-blue-600 hover:text-blue-800">Terms of Participation</a></li>
              <li><a href="#affiliate-terms" className="text-blue-600 hover:text-blue-800">Affiliate Terms & Conditions</a></li>
            </ul>
          </div>

          <section id="terms-conditions" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Website Terms & Conditions</h2>
            
            <p className="text-gray-700 mb-6">
              These Terms govern your access to, usage of all content, products and services available at our website 
              (the "Service") operated by Proleads Network ("us", "we", or "our").
            </p>

            <p className="text-gray-700 mb-8">
              Your access to our services are subject to your acceptance, without modification, of all of the terms 
              and conditions contained herein and all other operating rules and policies published and that may be 
              published from time to time by us.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">User Accounts</h3>
            <p className="text-gray-700 mb-6">
              Where use of any part of our Services requires an account, you agree to provide us with complete and 
              accurate information when you register for an account. You will be solely responsible and liable for 
              any activity that occurs under your account.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Cryptocurrency and Blockchain</h3>
            <p className="text-gray-700 mb-6">
              Our service involves cryptocurrency transactions and blockchain technology. You acknowledge and understand 
              the risks associated with cryptocurrency, including volatility, technical risks, and regulatory uncertainty. 
              All transactions are final and irreversible.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Termination</h3>
            <p className="text-gray-700 mb-6">
              We may terminate or suspend your access to all or any part of our Services at any time, with or without 
              cause, with or without notice, effective immediately. If you wish to terminate your account, you may 
              simply discontinue using our Services.
            </p>
          </section>

          <section id="kyc-policy" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Know Your Customer (KYC) Policy</h2>
            
            <p className="text-gray-700 mb-6">
              To comply with applicable laws and regulations, including anti-money laundering (AML) and 
              counter-terrorism financing (CTF) requirements, we may require you to provide certain information 
              and documentation to verify your identity.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">KYC Requirements</h3>
            <p className="text-gray-700 mb-4">Depending on your usage of our services, we may request:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Personal identification details (full name, date of birth, address)</li>
              <li>Government-issued identification documents</li>
              <li>Proof of address documentation</li>
              <li>Source of funds verification for large transactions</li>
            </ul>

            <p className="text-gray-700 mb-6">
              Failure to provide requested KYC information in a timely manner may result in restrictions on your 
              account, including withholding of commission payments or suspension of access to our services.
            </p>
          </section>

          <section id="participation-terms" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Terms of Participation</h2>
            
            <div className="space-y-4 text-gray-700">
              <p><strong>1.</strong> Members must be 18 years of age or older to participate. Members must provide accurate, complete and updated registration information.</p>
              
              <p><strong>2.</strong> We reserve the right to refuse applications for membership at our sole discretion.</p>
              
              <p><strong>3.</strong> Members may not activate or use more than one Member account or use false or misleading information.</p>
              
              <p><strong>4.</strong> We reserve the right to track Member activity and transactions for security and compliance purposes.</p>
              
              <p><strong>5.</strong> We have the right to suspend or cancel membership for violations of these terms. All earnings may be forfeited for fraudulent behavior.</p>
              
              <p><strong>6.</strong> Spamming is strictly prohibited and will result in immediate account termination.</p>
              
              <p><strong>7.</strong> All Members shall comply with applicable laws, rules, and regulations in their jurisdiction.</p>
            </div>
          </section>

          <section id="affiliate-terms" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Affiliate Terms & Conditions</h2>
            
            <p className="text-gray-700 mb-6">
              These terms apply to individuals participating in our affiliate program. By participating, you agree 
              to use the program in accordance with these terms.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Affiliate Registration</h3>
            <p className="text-gray-700 mb-6">
              We reserve the right to approve or reject any affiliate registration in our sole discretion. 
              All members automatically become affiliates and can earn commissions by referring new members.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Commissions and Payments</h3>
            <p className="text-gray-700 mb-6">
              Commission rates vary by membership tier and are paid instantly in USDC cryptocurrency. Payments 
              are made automatically to your specified wallet address when referrals join or make payments.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Network Building</h3>
            <p className="text-gray-700 mb-6">
              Affiliates can invite others to become their downline affiliates. Network commissions are paid 
              according to your membership tier's commission structure, up to 4 levels deep for higher tiers.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Compliance</h3>
            <p className="text-gray-700 mb-6">
              Affiliates must comply with all applicable laws regarding marketing, advertising, and financial 
              services. Misleading claims, spam, or fraudulent practices will result in immediate termination.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default TermsPage;
