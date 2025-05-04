
"use client";

import React from 'react';
import { Globe, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';


interface GoogleMapEmbedProps {
  initialEmbedUrl: string;
  title: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (event: React.FormEvent) => void;
}

export default function GoogleMapEmbed({
    initialEmbedUrl,
    title,
    searchQuery,
    setSearchQuery,
    onSearchSubmit
}: GoogleMapEmbedProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [currentEmbedUrl, setCurrentEmbedUrl] = React.useState(initialEmbedUrl);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

   // Update the iframe src when the initialEmbedUrl prop changes (due to search)
   React.useEffect(() => {
       setCurrentEmbedUrl(initialEmbedUrl);
   }, [initialEmbedUrl]);

  return (
    <div className="space-y-4 p-4 md:p-6 border rounded-lg bg-muted/50 mt-8">
      <h3 className="text-lg font-semibold flex items-center justify-center mb-4"><Globe className="mr-2 h-5 w-5 text-primary"/>Map View</h3>

        {/* Search Bar - Logic handled by parent */}
        <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
            <Label htmlFor="map-search" className="sr-only">Search Location</Label>
            <Input
                id="map-search"
                type="search"
                placeholder="Search map location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // Update state in parent
                className="flex-grow bg-background"
            />
            <Button type="submit" variant="outline">
                <Search className="mr-2 h-4 w-4" /> Search Map
            </Button>
        </form>

      <div className="relative h-[400px] w-full bg-muted-foreground/10 rounded-md overflow-hidden border">
        {isClient ? (
          <iframe
            key={currentEmbedUrl} // Force re-render on URL change
            src={currentEmbedUrl} // Use state variable for src
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={title}
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Map results are based on your search query.
      </p>
    </div>
  );
}
