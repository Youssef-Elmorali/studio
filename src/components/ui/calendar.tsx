
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps, useDayPicker } from "react-day-picker"
import { format } from 'date-fns';

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
    fromYear?: number;
    toYear?: number;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
   captionLayout = "buttons",
   fromYear: fromYearProp,
   toYear: toYearProp,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: cn(
            "text-sm font-medium",
            captionLayout === "dropdown" && "hidden",
            captionLayout === "dropdown-buttons" && "hidden",
        ),
        caption_dropdowns: "flex justify-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        vhidden: "hidden",
        dropdown: "rdp-dropdown",
        dropdown_icon: "ml-2",
        dropdown_year: "rdp-dropdown_year",
        dropdown_month: "rdp-dropdown_month",
        ...classNames,
      }}
       captionLayout={captionLayout}
       fromYear={fromYearProp}
       toYear={toYearProp}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
         Dropdown: (dropdownProps: DropdownProps) => {
           const {
             fromDate,
             toDate,
             fromMonth,
             toMonth,
             fromYear: contextFromYear,
             toYear: contextToYear,
             goToMonth,
             currentMonth, // Use currentMonth from context
           } = useDayPicker();

           const { name, value } = dropdownProps;

           // Ensure currentMonth is a valid Date object before proceeding
           const displayMonth = React.useMemo(() => {
               if (currentMonth && isValid(currentMonth)) {
                   return currentMonth;
               }
               // Provide a fallback or handle the undefined case appropriately
               console.warn("Calendar Dropdown: currentMonth from useDayPicker context is undefined or invalid, using fallback.");
               return new Date(); // Fallback to current date
           }, [currentMonth]);


           const handleValueChange = (newValue: string) => {
             const newDate = new Date(displayMonth); // Use the validated displayMonth
             if (name === "months") {
               newDate.setMonth(parseInt(newValue));
             } else if (name === "years") {
               newDate.setFullYear(parseInt(newValue));
             }
             if (goToMonth && isValid(newDate)) { // Check if goToMonth exists and newDate is valid
                 goToMonth(newDate);
             } else {
                  console.error("Calendar Dropdown: goToMonth function is not available or new date is invalid.");
             }
           };

           // Determine start/end year using context or props, falling back to calculated range
           const startYear = contextFromYear ?? fromYearProp ?? displayMonth.getFullYear() - MAX_YEAR_RANGE;
           const endYear = contextToYear ?? toYearProp ?? displayMonth.getFullYear();


           let options: { value: string; label: string }[] = [];

           if (name === "months") {
             options = Array.from({ length: 12 }, (_, i) => ({
               value: i.toString(),
               label: format(new Date(displayMonth.getFullYear(), i, 1), "MMM"), // Use displayMonth's year
             }));

             // Filter months based on from/toMonth if the year matches
             const selectedYear = displayMonth.getFullYear();
              if (fromMonth && selectedYear === fromMonth.getFullYear()) {
                  options = options.filter(opt => parseInt(opt.value) >= fromMonth.getMonth());
              }
               if (toMonth && selectedYear === toMonth.getFullYear()) {
                  options = options.filter(opt => parseInt(opt.value) <= toMonth.getMonth());
               }

           } else if (name === "years") {
             options = Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
               value: (startYear + i).toString(),
               label: (startYear + i).toString(),
             }));
              // Filter years based on fromDate and toDate if they exist
              if (fromDate) {
                  options = options.filter(opt => parseInt(opt.value) >= fromDate.getFullYear());
              }
              if (toDate) {
                  options = options.filter(opt => parseInt(opt.value) <= toDate.getFullYear());
              }
           }


           return (
             <Select
               value={value?.toString()} // Directly use the value prop from DropdownProps
               onValueChange={handleValueChange} // Call the handler on change
             >
               <SelectTrigger className="h-7 text-xs px-2 border-none shadow-none focus:ring-0 bg-transparent w-auto">
                 <SelectValue placeholder={name === 'months' ? 'Month' : 'Year'} />
               </SelectTrigger>
               <SelectContent>
                 <ScrollArea className={cn("h-48", name === 'years' && 'h-64')}>
                   {options.map((option) => (
                     <SelectItem
                       key={option.value}
                       value={option.value}
                       className="text-xs"
                     >
                       {option.label}
                     </SelectItem>
                   ))}
                 </ScrollArea>
               </SelectContent>
             </Select>
           );
         },
       }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

// Add constant used in the component
const MAX_YEAR_RANGE = 120;

export { Calendar }
