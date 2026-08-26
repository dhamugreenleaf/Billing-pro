import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: 'calc(var(--spacing-2xl) + 80px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-xl) var(--spacing-md)' }}>
        <button 
          onClick={() => navigate('/settings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: '500' }}
        >
          <ArrowLeft size={20} /> Back to Settings
        </button>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: '700' }}>Terms & Conditions</h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Date: 26-08-2026</p>

          <div style={{ color: '#334155', lineHeight: '1.6', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p>These Terms & Conditions ("Terms") govern access to and use of Billing Pro (the "Service"), a billing and invoicing platform operated by GreenLeaf Agencies ("Company", "we", "us", or "our"), including the website https://gobill.gldatacenter.com and any associated mobile or desktop applications. By creating an account, subscribing to a plan, or otherwise using the Service, you ("Customer", "you", or "your") agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>1. Description of Service</h2>
              <p>Billing Pro is a subscription-based billing and invoicing platform that enables businesses to generate invoices, bills, and related documents in multiple formats (including basic, classic, Tally, modern, retail POS, GST/tax, service, proforma, and wholesale B2B formats), manage billing records, and access reporting tools. Available features vary by subscription plan as described on our Plans page and Section 3 below.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>2. Eligibility and Account Registration</h2>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>You must be at least 18 years old and legally capable of entering into a binding contract to use the Service.</li>
                <li>You must provide accurate, current, and complete information during registration and keep it updated.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</li>
                <li>You must notify us immediately at dhamugreenleaf@gmail.com of any unauthorized use of your account.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>3. Subscription Plans and Billing</h2>
              <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginBottom: '0.5rem' }}>3.1 Plans</h3>
              <p style={{ marginBottom: '0.75rem' }}>We currently offer the following subscription tiers, each with its own usage limits and feature set as displayed in-app at the time of purchase:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Free</strong> — ₹0/month: limited monthly bill volume, basic invoice format, no GST support.</li>
                <li><strong>Basic</strong> — ₹10/month: higher monthly bill volume, GST support, and additional invoice formats (e.g., Classic, Tally, Wholesale B2B).</li>
                <li><strong>Pro</strong> — ₹15/month: maximum monthly bill volume, all invoice formats, retail POS billing, advanced tax invoicing, and priority features.</li>
              </ul>
              <p>We may introduce new plans, modify features included in a plan, or discontinue a plan at our discretion. Where changes materially reduce the value of your current plan, we will provide reasonable advance notice.</p>
              
              <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 0.5rem 0' }}>3.2 Fees and Payment</h3>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Subscription fees are billed in advance on a recurring monthly (or otherwise stated) basis, in Indian Rupees (₹), unless otherwise specified.</li>
                <li>All fees are exclusive of applicable taxes (including GST) unless stated otherwise; such taxes will be added to your invoice where applicable.</li>
                <li>Payments are processed through our third-party payment gateway partners. We do not store your full card or bank details.</li>
                <li>Failure to pay subscription fees when due may result in suspension or downgrade of your account to the Free plan.</li>
              </ul>

              <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 0.5rem 0' }}>3.3 Upgrades, Downgrades, and Cancellation</h3>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>You may upgrade, downgrade, or cancel your subscription at any time from the Plans section of your account.</li>
                <li>Upgrades take effect immediately; downgrades and cancellations take effect at the end of the current billing cycle unless stated otherwise.</li>
                <li>Cancellation does not entitle you to a refund of fees already paid for the current billing period, except as required by law or set out in Section 3.4.</li>
              </ul>

              <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 0.5rem 0' }}>3.4 Refunds</h3>
              <p>Except where required by applicable law, subscription fees are non-refundable. Refund requests arising from billing errors or service unavailability will be assessed on a case-by-case basis by contacting dhamugreenleaf@gmail.com.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>4. Acceptable Use</h2>
              <p style={{ marginBottom: '0.75rem' }}>You agree not to use the Service to:</p>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Generate fraudulent, misleading, or unlawful invoices or billing records.</li>
                <li>Violate any applicable tax, financial, or consumer protection law, including GST regulations.</li>
                <li>Upload malicious code, attempt unauthorized access, or interfere with the Service's operation or security.</li>
                <li>Reverse-engineer, resell, sublicense, or white-label the Service without our prior written consent.</li>
                <li>Exceed the usage limits (e.g., monthly bill volume) associated with your subscription plan through automated or abusive means.</li>
              </ul>
              <p style={{ marginTop: '0.75rem' }}>We reserve the right to suspend or terminate accounts that violate this Acceptable Use section.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>5. Customer Data and Content</h2>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>You retain ownership of all billing, invoice, and business data you input into the Service ("Customer Data").</li>
                <li>You grant us a limited license to host, process, and display Customer Data solely to provide and improve the Service.</li>
                <li>You are solely responsible for the accuracy, legality, and tax compliance of invoices and bills generated using the Service.</li>
                <li>We are not a party to, and assume no liability for, transactions between you and your own customers.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>6. Intellectual Property</h2>
              <p>The Service, including its software, design, trademarks, logos, and documentation, is owned by GreenLeaf Agencies or its licensors and is protected by intellectual property laws. These Terms do not grant you any rights to our intellectual property except the limited right to use the Service in accordance with your subscription plan.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>7. Service Availability</h2>
              <p>We aim to keep the Service available at all times but do not guarantee uninterrupted or error-free operation. We may perform scheduled maintenance, and may modify, suspend, or discontinue features of the Service with reasonable notice where practicable.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>8. Disclaimer of Warranties</h2>
              <p style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT INVOICES GENERATED WILL SATISFY ALL REGULATORY OR TAX REQUIREMENTS APPLICABLE TO YOUR BUSINESS. YOU ARE RESPONSIBLE FOR VERIFYING COMPLIANCE WITH APPLICABLE LAWS, INCLUDING GST AND OTHER TAX REGULATIONS, BEFORE RELYING ON GENERATED DOCUMENTS.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>9. Limitation of Liability</h2>
              <p style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, GREENLEAF AGENCIES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITY ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE TOTAL SUBSCRIPTION FEES PAID BY YOU IN THE THREE (3) MONTHS PRECEDING THE CLAIM.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>10. Indemnification</h2>
              <p>You agree to indemnify and hold harmless GreenLeaf Agencies, its officers, employees, and agents from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising from your use of the Service, your Customer Data, or your violation of these Terms or applicable law.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>11. Termination</h2>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>You may terminate your account at any time by cancelling your subscription and, if desired, requesting account deletion.</li>
                <li>We may suspend or terminate your access to the Service for material breach of these Terms, non-payment, unlawful use, or as required by law, with notice where reasonably practicable.</li>
                <li>Upon termination, your right to use the Service ceases immediately; provisions relating to fees owed, intellectual property, disclaimers, liability, and indemnification survive termination.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>12. Changes to These Terms</h2>
              <p>We may update these Terms from time to time to reflect changes in the Service, legal requirements, or business practices. We will notify you of material changes via email or in-app notice at least 30 days before they take effect. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>13. Governing Law and Dispute Resolution</h2>
              <p>These Terms are governed by the laws of India, without regard to conflict-of-law principles. Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts at Tiruppur, Tamil Nadu, India, unless otherwise required by mandatory consumer protection law.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>14. General Provisions</h2>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Service.</li>
                <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in full effect.</li>
                <li><strong>No Waiver:</strong> Our failure to enforce any right or provision is not a waiver of that right.</li>
                <li><strong>Assignment:</strong> You may not assign these Terms without our prior written consent; we may assign them in connection with a merger, acquisition, or sale of assets.</li>
                <li><strong>Force Majeure:</strong> We are not liable for delays or failures caused by events beyond our reasonable control.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.75rem' }}>15. Contact Us</h2>
              <p style={{ marginBottom: '0.5rem' }}>If you have questions about these Terms, please contact us at:</p>
              <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>GreenLeaf Agencies</strong></p>
                <p style={{ margin: '0 0 0.5rem 0' }}>2/156 E 13, Moiyanadamaplayam,<br/>Ettiveerampalayam Village, Perumanallur,<br/>Avinashi, Tiruppur- 641 666.</p>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Email:</strong> dhamugreenleaf@gmail.com</p>
                <p style={{ margin: 0 }}><strong>Website:</strong> https://gobill.gldatacenter.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
