"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";
import type { LatLngExpression } from 'leaflet';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { BloodBank } from '@/types/blood-bank'; // Import BloodBank type
import { useToast } from '@/hooks/use-toast';


// Component to change map view
function ChangeView({ center, zoom }: { center: LatLngExpression, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapViewProps {
  banks: BloodBank[];
  initialCenter?: LatLngExpression;
  initialZoom?: number;
}

export function MapView({ banks, initialCenter = [31.9632, 35.9306], initialZoom = 7 }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCenter, setCurrentCenter] = useState<LatLngExpression>(initialCenter);
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const banksWithCoords = banks.filter(bank => bank.locationCoords?.lat && bank.locationCoords?.lng);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      // Reset to initial view or show all markers? Resetting for now.
      setCurrentCenter(initialCenter);
      setCurrentZoom(initialZoom);
      setSearchError(null);
      return;
    }

    if (!apiKey) {
        setSearchError("Map search requires a Google Maps API Key to be configured.");
        toast({
            title: "Search Error",
            description: "Map search functionality is limited without an API key.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    setSearchError(null);

    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        setCurrentCenter([lat, lng]);
        setCurrentZoom(13); // Zoom in closer for specific location
        toast({
           title: "Location Found",
           description: `Map centered on ${data.results[0].formatted_address}`,
        });
      } else if (data.status === 'ZERO_RESULTS') {
        setSearchError("Location not found. Please try a different search term.");
         toast({
             title: "Search Error",
             description: "Location not found.",
             variant: "destructive",
         });
      } else {
         console.error("Geocoding API Error:", data.status, data.error_message);
         setSearchError(`Geocoding failed: ${data.error_message || data.status}`);
         toast({
              title: "Search Error",
              description: `Could not find location: ${data.error_message || data.status}`,
              variant: "destructive",
          });
      }
    } catch (error) {
      console.error("Error during geocoding fetch:", error);
      setSearchError("An error occurred while searching for the location.");
       toast({
            title: "Search Error",
            description: "An network error occurred during search.",
            variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, apiKey, initialCenter, initialZoom, toast]);


  if (!isClient) {
    // Return a placeholder or skeleton while waiting for client-side rendering
    return (
        <div className="space-y-4 p-4 md:p-6 border rounded-lg bg-muted/50 mt-8">
            <h3 className="text-lg font-semibold text-center mb-4">Map View</h3>
            <div className="relative h-[400px] w-full bg-muted rounded-md flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="ml-2 text-muted-foreground">Loading map...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6 border rounded-lg bg-muted/50 mt-8">
       <h3 className="text-lg font-semibold text-center mb-4">Map View</h3>

       {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
            <Label htmlFor="map-search" className="sr-only">Search Location on Map</Label>
            <Input
                id="map-search"
                type="search"
                placeholder="Search for location to center map..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-background"
                disabled={isLoading}
            />
            <Button type="submit" variant="outline" disabled={isLoading || !searchQuery.trim()}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                 {isLoading ? 'Searching...' : 'Search Map'}
            </Button>
        </form>

        {searchError && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Search Error</AlertTitle>
                <AlertDescription>{searchError}</AlertDescription>
            </Alert>
        )}

      <div className="relative h-[450px] w-full bg-muted rounded-md overflow-hidden border">
         {/* Use a key that forces remount only when necessary, like number of banks if markers change drastically */}
         {/* Or better, control view changes internally with ChangeView component */}
        <MapContainer
            // No key needed here if ChangeView handles updates
            center={currentCenter} // Controlled center state
            zoom={currentZoom}      // Controlled zoom state
            scrollWheelZoom={true} // Enable scroll wheel zoom
            style={{ height: "100%", width: "100%" }}
          >
           <ChangeView center={currentCenter} zoom={currentZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {banksWithCoords.map((bank) => (
               bank.locationCoords && // Double check coords exist
              <Marker key={bank.id} position={[bank.locationCoords.lat, bank.locationCoords.lng]}>
                <Popup>
                  <strong>{bank.name}</strong><br />
                  {bank.location}<br />
                   {bank.contactPhone && `Phone: ${bank.contactPhone}`}
                   {/* TODO: Add link to bank detail page */}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
      </div>
       <p className="text-xs text-muted-foreground text-center mt-2">
          Map displays available blood banks. Use search to center the map on a location.
       </p>
    </div>
  );
}