

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function ContactPage() {
  // Placeholder for form submission logic
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Normally, you'd gather form data and send it.
      // For now, just log or show a message.
      alert("Contact form submission is not implemented yet.");
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center"><Send className="mr-2 h-6 w-6"/>Get In Touch</CardTitle>
            <CardDescription>Have questions or feedback? Fill out the form below and we'll get back to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  Contact form submission is currently not functional. Please use the contact details provided on the right.
                </AlertDescription>
            </Alert>
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Your Name" required disabled />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required disabled />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="Reason for contacting us" required disabled />
              </div>
              <div className="space-y-1">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" placeholder="Your message here..." rows={5} required disabled />
              </div>
              <Button type="submit" className="w-full" disabled> {/* Disable button */}
                 <Send className="mr-2 h-4 w-4" /> Send Message (Disabled)
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="space-y-8">
           <h2 className="text-3xl font-bold text-primary">Contact Information</h2>
           <p className="text-muted-foreground">
              You can reach us through the following channels. For urgent matters related to blood requests or donation appointments, please contact the relevant blood center directly.
           </p>
          <Card className="shadow-md bg-muted/50">
             <CardContent className="p-6 space-y-4">
                <div className="flex items-start space-x-4">
                   <div className="bg-primary text-primary-foreground p-3 rounded-full mt-1">
                      <MapPin className="h-5 w-5"/>
                   </div>
                   <div>
                      <h4 className="font-semibold text-lg">Our Office</h4>
                      <p className="text-muted-foreground">123 Life Saver St, Cityville, Country</p>
                      {/* Add Map Link/Embed later if needed */}
                   </div>
                </div>
                 <div className="flex items-start space-x-4">
                   <div className="bg-primary text-primary-foreground p-3 rounded-full mt-1">
                     <Mail className="h-5 w-5"/>
                   </div>
                   <div>
                     <h4 className="font-semibold text-lg">Email Us</h4>
                     <a href="mailto:info@qatrahhayat.org" className="text-muted-foreground hover:text-primary transition-colors">info@qatrahhayat.org</a>
                   </div>
                 </div>
                 <div className="flex items-start space-x-4">
                   <div className="bg-primary text-primary-foreground p-3 rounded-full mt-1">
                     <Phone className="h-5 w-5"/>
                   </div>
                   <div>
                     <h4 className="font-semibold text-lg">Call Us</h4>
                     <a href="tel:+1234567890" className="text-muted-foreground hover:text-primary transition-colors">(123) 456-7890</a>
                      <p className="text-xs text-muted-foreground">(General Inquiries Only)</p>
                   </div>
                 </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
