
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center"><ShieldCheck className="mr-2 h-6 w-6"/>Privacy Policy</CardTitle>
          <CardDescription>Last Updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <p>
            Welcome to Qatrah Hayat ("we", "us", "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at privacy@qatrahhayat.org.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our products and services, when you participate in activities on the platform (such as donating or requesting blood information, interacting with campaigns) or otherwise when you contact us.</p>
            <p>The personal information that we collect depends on the context of your interactions with us and the platform, the choices you make and the products and features you use. The personal information we collect may include the following:</p>
            <ul>
              <li><strong>Personal Information Provided by You:</strong> Names; phone numbers; email addresses; mailing addresses; usernames; passwords; contact preferences; contact or authentication data; billing addresses; debit/credit card numbers; blood type (optional, and stored securely); donation history (linked from participating centers with your consent).</li>
              <li><strong>Information Automatically Collected:</strong> IP address; browser type; operating system; access times; pages viewed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use personal information collected via our platform for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations. We indicate the specific processing grounds we rely on next to each purpose listed below.</p>
            <ul>
              <li>To facilitate account creation and logon process.</li>
              <li>To post testimonials (with your consent).</li>
              <li>Request feedback.</li>
              <li>To enable user-to-user communications (e.g., connecting donors with requests, if applicable and consented to).</li>
              <li>To manage user accounts.</li>
              <li>To send administrative information to you.</li>
              <li>To protect our Services (e.g., fraud monitoring).</li>
              <li>To enforce our terms, conditions and policies.</li>
              <li>To respond to legal requests and prevent harm.</li>
              <li>To deliver and facilitate delivery of services to the user (e.g., coordinating donation appointments).</li>
              <li>To respond to user inquiries/offer support to users.</li>
              <li>To send you marketing and promotional communications (if opted-in).</li>
              <li>Deliver targeted advertising to you (if applicable).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Will Your Information Be Shared With Anyone?</h2>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
            <p>Specifically, we may need to process your data or share your personal information in the following situations:</p>
            <ul>
              <li><strong>Blood Centers/Hospitals:</strong> When you schedule a donation or respond to a request, relevant information may be shared with the participating blood center or hospital to facilitate the process.</li>
              <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              <li><strong>Vendors, Consultants and Other Third-Party Service Providers:</strong> We may share your data with third-party vendors, service providers, contractors or agents who perform services for us or on our behalf and require access to such information to do that work.</li>
              <li><strong>Legal Obligations:</strong> We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.</li>
            </ul>
          </section>

          {/* Add sections for Cookies, Data Retention, Security, Minors, Your Rights, Updates, Contact */}

           <section>
             <h2 className="text-xl font-semibold text-foreground">4. How Do We Keep Your Information Safe?</h2>
             <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security, and improperly collect, access, steal, or modify your information.</p>
           </section>

           <section>
             <h2 className="text-xl font-semibold text-foreground">5. What Are Your Privacy Rights?</h2>
             <p>In some regions (like the EEA, UK, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability. In certain circumstances, you may also have the right to object to the processing of your personal information.</p>
             <p>You can review, change, or terminate your account at any time through your profile settings.</p>
           </section>

           <section>
             <h2 className="text-xl font-semibold text-foreground">6. Updates To This Notice</h2>
             <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.</p>
           </section>


          <section>
            <h2 className="text-xl font-semibold text-foreground">7. How Can You Contact Us About This Notice?</h2>
            <p>If you have questions or comments about this notice, you may email us at <a href="mailto:privacy@qatrahhayat.org" className="text-primary hover:underline">privacy@qatrahhayat.org</a> or by post to:</p>
            <p>
              Qatrah Hayat<br />
              Attn: Privacy Officer<br />
              123 Life Saver St<br />
              Cityville, Country [Zip Code]
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
