import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function FAQSection() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How does the referral program work?",
      answer: "Every member is automatically an affiliate. Share your link and earn up to 30% recurring commissions + multi-tier bonuses, paid instantly in USDC."
    },
    {
      question: "What kind of leads do you provide?",
      answer: "Fresh, vetted leads actively interested in business opportunities, side income, or premium offers. Delivered weekly with full contact details."
    },
    {
      question: "How are commissions paid?",
      answer: "Instantly in USDC cryptocurrency to your wallet as soon as someone joins through your link."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes—cancel any time. Refunds follow our standard policy (detailed on the billing page)."
    },
    {
      question: "What's the difference between tiers?",
      answer: "Higher tiers get more weekly leads and deeper referral bonuses (up to 4 levels). All tiers include full referral program access."
    }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-bg-color-dark transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-body-color dark:text-body-color-dark">Get answers to common questions about Proleads Network</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full text-left p-6 bg-white dark:bg-dark rounded-lg shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-black dark:text-white">{faq.question}</h3>
                  <ChevronDown className={`h-5 w-5 text-body-color dark:text-body-color-dark transition-transform duration-300 ${
                    openFaq === index ? 'transform rotate-180' : ''
                  }`} />
                </div>
              </button>
              {openFaq === index && (
                <div className="mt-2 p-6 pt-0 bg-white dark:bg-dark rounded-lg transition-colors duration-300">
                  <p className="text-body-color dark:text-body-color-dark">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
