import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: 'var(--color-bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: 'calc(var(--spacing-2xl) + 80px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-xl) var(--spacing-md)' }}>
        <button 
          onClick={() => navigate('/settings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted, #64748b)', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: '500' }}
        >
          <ArrowLeft size={20} /> Back to Settings
        </button>

        <div style={{ backgroundColor: 'var(--color-bg-card, #ffffff)', borderRadius: '12px', padding: '2rem', border: '1px solid var(--color-border, #e2e8f0)', boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.5rem', fontWeight: '700' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--color-text-subtle, #64748b)', marginBottom: '2rem' }}>Effective Date: 26 August 2026</p>

          <div style={{ color: 'var(--color-text-muted, #334155)', lineHeight: '1.6', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p>GreenLeaf Agencies ("Company", "we", "us", or "our") operates GoBill (the "Service"), a subscription-based billing and invoicing platform. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use the Service, and describes your rights regarding that information. By using the Service, you agree to the collection and use of information as described here.</p>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>1. Information We Collect</h2>
              
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-main, #1e293b)', marginBottom: '0.5rem' }}>1.1 Information You Provide</h3>
              <ul style={{ paddingLeft: '1.5rem', margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Account information:</strong> name, business name, email address, phone number, password, and billing address.</li>
                <li><strong>Business and tax details:</strong> GSTIN, business registration details, and other information needed to generate compliant invoices.</li>
                <li><strong>Billing and invoice data:</strong> customer names, line items, amounts, and other content you enter to create bills, invoices, and reports.</li>
                <li><strong>Payment information:</strong> processed by our third-party payment gateway; we retain only limited transaction metadata (e.g., plan, amount, date, status), not full card/bank details.</li>
                <li><strong>Communications:</strong> messages you send us via support channels, email, or in-app forms.</li>
              </ul>

              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-main, #1e293b)', marginBottom: '0.5rem' }}>1.2 Information Collected Automatically</h3>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Usage data:</strong> features accessed, number of bills generated, plan usage, timestamps, and interaction logs.</li>
                <li><strong>Device and log data:</strong> IP address, browser type, operating system, device identifiers, and referring URLs.</li>
                <li><strong>Cookies and similar technologies:</strong> used for authentication, preferences, analytics, and service functionality (see Section 7).</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>2. How We Use Your Information</h2>
              <p style={{ marginBottom: '0.75rem' }}>We use collected information to:</p>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Provide, operate, and maintain the Service, including generating invoices and bills in your selected format.</li>
                <li>Process subscriptions, payments, upgrades, downgrades, and cancellations.</li>
                <li>Enforce plan-based usage limits (e.g., monthly bill volume).</li>
                <li>Send transactional communications (billing receipts, service notices, security alerts).</li>
                <li>Send product updates or promotional communications, where you have not opted out.</li>
                <li>Monitor, analyze, and improve the Service's performance, security, and features.</li>
                <li>Detect, prevent, and address fraud, abuse, or violations of our Terms & Conditions.</li>
                <li>Comply with legal, tax, and regulatory obligations, including those relating to GST and financial record-keeping.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>3. Legal Basis for Processing</h2>
              <p>Where applicable law requires a legal basis, we rely on: performance of our contract with you (providing the Service), your consent (e.g., for marketing communications or optional cookies), our legitimate interests (e.g., securing and improving the Service), and compliance with legal obligations (e.g., tax and financial regulations).</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>4. How We Share Information</h2>
              <p style={{ marginBottom: '0.75rem' }}>We do not sell your personal information. We may share information with:</p>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Service providers:</strong> payment gateways, cloud hosting providers, analytics providers, and customer support tools, under contractual confidentiality obligations.</li>
                <li><strong>Legal and compliance purposes:</strong> where required by law, regulation, legal process, or governmental request.</li>
                <li><strong>Business transfers:</strong> in connection with a merger, acquisition, financing, or sale of assets, subject to standard confidentiality protections.</li>
                <li><strong>With your consent:</strong> for any other purpose disclosed to you at the time of collection.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>5. Data Retention</h2>
              <p>We retain account and billing data for as long as your account is active and as needed to provide the Service. Following account closure, we may retain certain records (including invoice and tax-related data) for the period required by applicable tax, accounting, and legal obligations, after which we securely delete or anonymize the data.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>6. Data Security</h2>
              <p>We implement administrative, technical, and physical safeguards designed to protect your information, including encryption in transit, access controls, and regular security reviews. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>7. Cookies and Tracking Technologies</h2>
              <p>We use cookies and similar technologies to authenticate users, remember preferences, and understand usage patterns. You can control cookies through your browser settings; disabling certain cookies may affect Service functionality. We may also use analytics tools that collect aggregated, non-identifying usage statistics.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>8. Your Rights and Choices</h2>
              <p style={{ marginBottom: '0.75rem' }}>Subject to applicable law, you may have the right to:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Access, correct, or update your personal information via your account settings.</li>
                <li>Request deletion of your account and associated personal data, subject to legal retention requirements.</li>
                <li>Opt out of marketing communications by using the unsubscribe link or contacting us.</li>
                <li>Request a copy of your data in a portable format, where applicable.</li>
                <li>Object to or restrict certain processing activities, where applicable law provides this right.</li>
              </ul>
              <p>To exercise these rights, contact us at dhamugreenleaf@gmail.com. We may need to verify your identity before fulfilling certain requests.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>9. Children's Privacy</h2>
              <p>The Service is intended for business use by individuals aged 18 and above. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected such information, we will take steps to delete it.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>10. International Data Transfers</h2>
              <p>Your information may be processed and stored on servers located outside your state or country, including where our hosting or service providers operate. Where such transfers occur, we take reasonable steps to ensure appropriate safeguards are in place consistent with applicable law.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>11. Third-Party Links and Integrations</h2>
              <p>The Service may contain links to, or integrations with, third-party practical websites, payment processors, or tools (e.g., accounting or Tally-format exports). We are not responsible for the privacy practices of third parties, and we encourage you to review their privacy policies separately.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>12. Changes to This Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will post the updated policy with a revised "Effective Date" and, for material changes, provide notice via email or in-app notification.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.75rem' }}>13. Grievance Officer / Contact Us</h2>
              <p style={{ marginBottom: '0.75rem' }}>In accordance with applicable data protection and information technology regulations, the Grievance Officer for privacy-related concerns is:</p>
              
              <div style={{ backgroundColor: 'var(--color-bg-subtle, #f1f5f9)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border, transparent)' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Grievance Officer:</strong> Dhamu</p>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>GreenLeaf Agencies</strong></p>
                <p style={{ margin: '0 0 0.5rem 0' }}>2/156 E 13, Moiyanadamaplayam,<br/>Ettiveerampalayam Village, Perumanallur,<br/>Avinashi, Tiruppur- 641 666.</p>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Email:</strong> dhamugreenleaf@gmail.com</p>
                <p style={{ margin: 0 }}><strong>Website:</strong> https://gobill.gldatacenter.com</p>
              </div>
              <p style={{ marginTop: '0.75rem' }}>For any questions, complaints, or requests regarding this Privacy Policy or your personal information, please reach out using the details above. We aim to respond within a reasonable time as required by applicable law.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
