
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center"><FileText className="mr-2 h-6 w-6"/>Terms of Service</CardTitle>
          <CardDescription>Last Updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Qatrah Hayat website and platform (the "Service") operated by Qatrah Hayat ("us", "we", or "our").
          </p>
          <p>
            Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who wish to access or use the Service. By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you do not have permission to access the Service.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Accounts</h2>
            <p>
              When you create an account with us, you guarantee that you are above the age of 16 (or the applicable age of majority in your jurisdiction) and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Use of the Service</h2>
            <p>
              The Service allows users to find information about blood donation centers, view campaigns, request blood (facilitating connection, not guaranteeing supply), and potentially track donation history (where integrated with centers).
            </p>
            <p>
              You agree not to use the Service:
            </p>
            <ul>
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
              <li>To impersonate or attempt to impersonate Qatrah Hayat, a Qatrah Hayat employee, another user, or any other person or entity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm Qatrah Hayat or users of the Service or expose them to liability.</li>
            </ul>
             <p>
                <strong>Disclaimer:</strong> Qatrah Hayat acts as a facilitator. We do not operate blood banks, collect blood, or perform medical screenings. Eligibility decisions are made solely by the staff at the respective donation centers. Information provided on the platform regarding inventory or eligibility is for informational purposes and may not be real-time or fully comprehensive. We are not liable for any issues arising from the donation process, blood transfusions, or information provided by third-party centers.
             </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of Qatrah Hayat and its licensors. The Service is protected by copyright, trademark, and other laws of both the [Your Country] and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Qatrah Hayat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Links To Other Web Sites</h2>
            <p>
              Our Service may contain links to third-party web sites or services that are not owned or controlled by Qatrah Hayat.
            </p>
            <p>
              Qatrah Hayat has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third-party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites.
            </p>
            <p>
              You acknowledge and agree that Qatrah Hayat shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such third-party web sites or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
            <p>
              If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction/Country], without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:terms@qatrahhayat.org" className="text-primary hover:underline">terms@qatrahhayat.org</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
