
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EligibilityPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center"><CheckCircle className="mr-2 h-6 w-6"/>Blood Donation Eligibility</CardTitle>
          <CardDescription>General guidelines for blood donation. Please note specific criteria may vary slightly by donation center.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Requirements */}
          <div className="space-y-3 p-4 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold">Basic Requirements</h3>
            <ul className="list-none space-y-2">
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"/><span>Be in good general health and feeling well.</span></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"/><span>Be at least 17 years old (or 16 with parental consent in some areas - check local guidelines).</span></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"/><span>Weigh at least 110 lbs (50 kg).</span></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"/><span>Have not donated whole blood in the last 56 days (8 weeks).</span></li>
            </ul>
          </div>

          {/* Common Reasons for Deferral */}
          <Accordion type="single" collapsible className="w-full">
             <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">Common Reasons for Temporary Deferral</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p className="flex items-start"><AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0"/><span>Low iron (hemoglobin) level.</span></p>
                <p className="flex items-start"><AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0"/><span>Certain medications (e.g., antibiotics, blood thinners - discuss with staff).</span></p>
                <p className="flex items-start"><AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0"/><span>Recent illness, cold, or flu.</span></p>
                <p className="flex items-start"><AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0"/><span>Recent tattoo or piercing (wait times vary).</span></p>
                 <p className="flex items-start"><AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0"/><span>Recent travel to certain countries (risk of malaria or other infections).</span></p>
                <p className="flex items-start"><AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0"/><span>Pregnancy (wait 6 weeks after giving birth).</span></p>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="item-2">
               <AccordionTrigger className="text-lg font-semibold hover:text-primary">Reasons for Permanent Deferral</AccordionTrigger>
               <AccordionContent className="space-y-2 text-muted-foreground">
                 <p className="flex items-start"><XCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0"/><span>History of certain infectious diseases (e.g., HIV, Hepatitis B/C).</span></p>
                 <p className="flex items-start"><XCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0"/><span>Certain heart conditions or history of specific cancers.</span></p>
                 <p className="flex items-start"><XCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0"/><span>Received a dura mater (brain covering) transplant.</span></p>
                  <p className="flex items-start"><XCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0"/><span>Risk factors associated with Creutzfeldt-Jakob Disease (CJD).</span></p>
               </AccordionContent>
             </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">Travel Restrictions</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p>Travel to certain areas may result in a temporary deferral due to the risk of infections like malaria, Zika, or Ebola.</p>
                <p>Please inform the donation center staff about your recent travel history (within the last 1-3 years, depending on location).</p>
                {/* TODO: Potentially link to a more detailed travel list if available */}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Disclaimer */}
          <div className="p-4 border border-amber-300 bg-amber-50 rounded-lg text-amber-800 text-sm">
             <p className="font-semibold mb-1 flex items-center"><AlertTriangle className="h-4 w-4 mr-1.5"/>Important Note:</p>
            <p>This information is a general guide. Final eligibility is determined by the medical staff at the donation center based on your health history and screening results. If you have specific questions, please contact the donation center directly.</p>
          </div>

          <div className="text-center pt-4">
              <Button asChild>
                 <Link href="/donate">Find a Donation Center to Ask Specific Questions</Link>
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
