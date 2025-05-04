
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center"><HelpCircle className="mr-2 h-6 w-6"/>Frequently Asked Questions</CardTitle>
          <CardDescription>Find answers to common questions about blood donation and using Qatrah Hayat.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-4">

            {/* General Donation Questions */}
            <AccordionItem value="q1">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">Who can donate blood?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p>Generally, donors must be in good health, at least 17 years old (16 with consent in some areas), weigh at least 110 lbs (50 kg), and meet other eligibility criteria.</p>
                <p>Visit our <a href="/eligibility" className="text-primary underline hover:no-underline">Eligibility Page</a> for more details.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">How often can I donate blood?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can typically donate whole blood every 56 days (8 weeks). Donation intervals for other types like platelets or plasma may differ.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">Does donating blood hurt?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You might feel a brief pinch when the needle is inserted, but the donation process itself is usually painless. Most donors report feeling fine afterwards.
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="q4">
               <AccordionTrigger className="text-lg font-semibold hover:text-primary">How long does the donation process take?</AccordionTrigger>
               <AccordionContent className="text-muted-foreground">
                 The entire process, including registration, mini-health check, donation, and refreshments, usually takes about an hour. The actual blood draw takes only about 8-10 minutes.
               </AccordionContent>
             </AccordionItem>

             <AccordionItem value="q5">
               <AccordionTrigger className="text-lg font-semibold hover:text-primary">What should I do before and after donating?</AccordionTrigger>
               <AccordionContent className="text-muted-foreground space-y-2">
                 <p><strong>Before:</strong> Eat a healthy meal, drink plenty of water, get a good night's sleep, and bring a valid ID.</p>
                 <p><strong>After:</strong> Drink extra fluids, avoid strenuous activity for the rest of the day, keep the bandage on for a few hours, and enjoy the feeling of having helped someone!</p>
               </AccordionContent>
             </AccordionItem>

             {/* Platform Specific Questions */}
              <AccordionItem value="q6">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary">How do I find a donation center using Qatrah Hayat?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Navigate to the <a href="/donate" className="text-primary underline hover:no-underline">Find Donation</a> page. Enter your location (city or zip code) and optionally a date to see nearby centers and drives.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q7">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary">How do I request blood?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                   Go to the <a href="/request" className="text-primary underline hover:no-underline">Request Blood</a> page and fill out the form with patient details, required blood type, urgency, and location. Submitting a request helps notify potential donors and centers, but doesn't guarantee immediate fulfillment.
                </AccordionContent>
              </AccordionItem>

               <AccordionItem value="q8">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary">Is my personal information safe?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                   We take data privacy seriously. Your information is handled securely and in accordance with our <a href="/privacy" className="text-primary underline hover:no-underline">Privacy Policy</a>. Donation-related health information is managed by the respective blood centers following strict confidentiality protocols.
                </AccordionContent>
              </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
