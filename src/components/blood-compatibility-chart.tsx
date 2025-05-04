"use client";

import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle } from 'lucide-react';

type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Compatibility rules: Recipient -> Donor[]
const compatibility: Record<BloodType, BloodType[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'], // Universal Donor (for red cells)
};

// Donation rules: Donor -> Recipient[]
const donationAbility: Record<BloodType, BloodType[]> = {
    'A+': ['A+', 'AB+'],
    'A-': ['A+', 'A-', 'AB+', 'AB-'],
    'B+': ['B+', 'AB+'],
    'B-': ['B+', 'B-', 'AB+', 'AB-'],
    'AB+': ['AB+'],
    'AB-': ['AB+', 'AB-'],
    'O+': ['A+', 'B+', 'AB+', 'O+'],
    'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Donor
};


export function BloodCompatibilityChart() {
  const [selectedDonor, setSelectedDonor] = React.useState<BloodType | null>(null);
  const [selectedRecipient, setSelectedRecipient] = React.useState<BloodType | null>(null);

  const getCellStyle = (donor: BloodType, recipient: BloodType): string => {
    const canDonate = donationAbility[donor]?.includes(recipient);
    let baseStyle = "text-center cursor-pointer transition-colors duration-200";

    if (selectedDonor === donor || selectedRecipient === recipient) {
        if(canDonate) {
            baseStyle += " bg-primary/20";
        } else {
            baseStyle += " bg-destructive/10";
        }
    }
     if (selectedDonor === donor && selectedRecipient === recipient) {
       baseStyle += canDonate ? " bg-primary/40 ring-2 ring-primary" : " bg-destructive/30 ring-2 ring-destructive";
     }

     if (selectedDonor && selectedDonor !== donor && !donationAbility[selectedDonor]?.includes(recipient)) {
       baseStyle += " opacity-30";
     }
     if (selectedRecipient && selectedRecipient !== recipient && !donationAbility[donor]?.includes(selectedRecipient)) {
        baseStyle += " opacity-30";
     }


    return baseStyle;
  };

  const handleCellClick = (donor: BloodType, recipient: BloodType) => {
     setSelectedDonor(donor);
     setSelectedRecipient(recipient);
  }

  const handleDonorHeaderClick = (donor: BloodType) => {
    setSelectedDonor(prev => prev === donor ? null : donor);
    if (selectedRecipient) setSelectedRecipient(null); // Clear recipient selection when donor header clicked
  };

  const handleRecipientHeaderClick = (recipient: BloodType) => {
    setSelectedRecipient(prev => prev === recipient ? null : recipient);
     if (selectedDonor) setSelectedDonor(null); // Clear donor selection when recipient header clicked
  };

  return (
    <Card className="w-full max-w-4xl mx-auto my-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Blood Type Compatibility Chart</CardTitle>
        <CardDescription>Click on a donor (column header) or recipient (row header) to highlight compatibility. Click a cell to select both.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableCaption>Green check indicates compatibility, Red X indicates incompatibility.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 w-[100px] min-w-[100px] text-center font-semibold">Recipient <span className="block text-xs font-normal">(Can Receive From)</span></TableHead>
                {bloodTypes.map((donor) => (
                  <TableHead
                     key={`donor-${donor}`}
                     className={`text-center font-semibold cursor-pointer hover:bg-primary/10 ${selectedDonor === donor ? 'bg-primary/20' : ''}`}
                     onClick={() => handleDonorHeaderClick(donor)}
                  >
                    {donor}
                  </TableHead>
                ))}
              </TableRow>
               <TableRow className="invisible h-0">
                 <TableHead className="sticky left-0 bg-background z-10 w-[100px] min-w-[100px] p-0"></TableHead>
                 {bloodTypes.map((type) => <TableHead key={`w-${type}`} className="p-0 w-[80px] min-w-[80px]"></TableHead>)}
               </TableRow>
            </TableHeader>
            <TableBody>
              {bloodTypes.map((recipient) => (
                <TableRow key={`recipient-row-${recipient}`}>
                  <TableHead
                     className={`sticky left-0 bg-background z-10 text-center font-semibold cursor-pointer hover:bg-primary/10 ${selectedRecipient === recipient ? 'bg-primary/20' : ''}`}
                      onClick={() => handleRecipientHeaderClick(recipient)}
                  >
                    {recipient}
                   </TableHead>
                  {bloodTypes.map((donor) => {
                    const isCompatible = donationAbility[donor]?.includes(recipient);
                    const cellTooltip = `${donor} ${isCompatible ? 'can' : 'cannot'} donate to ${recipient}`;
                    return (
                      <TableCell
                        key={`cell-${donor}-${recipient}`}
                        className={getCellStyle(donor, recipient)}
                        onClick={() => handleCellClick(donor, recipient)}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <div className="flex justify-center items-center h-full">
                                {isCompatible ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-destructive" />
                                )}
                             </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{cellTooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
          {selectedDonor && selectedRecipient && (
               <p className="mt-4 text-center font-medium">
                 Selected: Donor <strong>{selectedDonor}</strong>, Recipient <strong>{selectedRecipient}</strong> - Compatibility: {donationAbility[selectedDonor]?.includes(selectedRecipient) ? <span className="text-green-600">Yes</span> : <span className="text-destructive">No</span>}
               </p>
           )}
      </CardContent>
    </Card>
  );
}
