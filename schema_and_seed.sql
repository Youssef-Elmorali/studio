
-- ========================================================
-- Qatrah Hayat Supabase Schema and Seed Data
-- ========================================================
-- This script defines the necessary tables, types, and relationships
-- for the Qatrah Hayat application based on the defined TypeScript types.
-- It also includes commands to enable Row Level Security and seed
-- initial data, including the admin user (requires the Auth user to exist first).

-- ========================================================
-- 1. Create ENUM Types
-- ========================================================
-- Drop existing types if they exist (useful for development/resetting)
DROP TYPE IF EXISTS public."UserRole" CASCADE;
DROP TYPE IF EXISTS public."BloodGroup" CASCADE;
DROP TYPE IF EXISTS public."Gender" CASCADE;
DROP TYPE IF EXISTS public."RequestStatus" CASCADE;
DROP TYPE IF EXISTS public."UrgencyLevel" CASCADE;
DROP TYPE IF EXISTS public."CampaignStatus" CASCADE;
DROP TYPE IF EXISTS public."DonationType" CASCADE;

-- Create ENUM types
CREATE TYPE public."UserRole" AS ENUM ('donor', 'recipient', 'admin');
CREATE TYPE public."BloodGroup" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE public."Gender" AS ENUM ('Male', 'Female'); -- Keeping simple as requested
CREATE TYPE public."RequestStatus" AS ENUM ('Pending', 'Pending Verification', 'Active', 'Partially Fulfilled', 'Fulfilled', 'Cancelled', 'Expired');
CREATE TYPE public."UrgencyLevel" AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE public."CampaignStatus" AS ENUM ('Upcoming', 'Ongoing', 'Completed', 'Cancelled');
CREATE TYPE public."DonationType" AS ENUM ('Whole Blood', 'Platelets', 'Plasma', 'Power Red');

-- ========================================================
-- 2. Create Tables
-- ========================================================

-- Users Table (Profiles)
CREATE TABLE public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Foreign Key to Supabase Auth users table
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  dob DATE,                                  -- Date of birth
  blood_group public."BloodGroup",           -- Use the custom ENUM type
  gender public."Gender",                   -- Use the custom ENUM type
  role public."UserRole" NOT NULL DEFAULT 'donor', -- Default role
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Donor specific fields (nullable)
  last_donation_date DATE,                  -- Date only
  medical_conditions TEXT,
  is_eligible BOOLEAN DEFAULT true,         -- Default to eligible
  next_eligible_date DATE,                  -- Date only
  total_donations INTEGER DEFAULT 0        -- Default to 0 donations
);
COMMENT ON TABLE public.users IS 'Stores user profile information, extending Supabase Auth users.';
COMMENT ON COLUMN public.users.uid IS 'Links to the corresponding user in Supabase Auth.';

-- Blood Banks Table
CREATE TABLE public.blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  location_coords GEOGRAPHY(Point, 4326),      -- Requires PostGIS extension enabled in Supabase
  contact_phone TEXT,
  operating_hours TEXT,
  website TEXT,
  inventory JSONB,                             -- Store inventory map { "A+": 10, "O-": 5 }
  last_inventory_update TIMESTAMPTZ,
  services_offered TEXT[],                     -- Array of service names
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.blood_banks IS 'Stores information about blood donation centers/banks.';
COMMENT ON COLUMN public.blood_banks.location_coords IS 'Geographical coordinates (Latitude, Longitude). Requires PostGIS.';
COMMENT ON COLUMN public.blood_banks.inventory IS 'Approximate blood stock levels as a JSON object, e.g., {"A+": 10, "O-": 5}.';

-- Blood Requests Table
CREATE TABLE public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE, -- Link to the user who made the request
  requester_name TEXT,                         -- Denormalized for easier display
  patient_name TEXT NOT NULL,
  required_blood_group public."BloodGroup" NOT NULL,
  units_required INTEGER NOT NULL CHECK (units_required > 0),
  units_fulfilled INTEGER NOT NULL DEFAULT 0 CHECK (units_fulfilled >= 0),
  urgency public."UrgencyLevel" NOT NULL,
  hospital_name TEXT NOT NULL,
  hospital_location TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  additional_details TEXT,
  status public."RequestStatus" NOT NULL DEFAULT 'Pending Verification',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.blood_requests IS 'Stores requests for blood donations.';
COMMENT ON COLUMN public.blood_requests.requester_uid IS 'Foreign key referencing the user who created the request.';

-- Campaigns Table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organizer TEXT NOT NULL,                     -- Name or ID of the organizing body
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  time_details TEXT,                           -- e.g., "10 AM - 4 PM Daily"
  location TEXT NOT NULL,
  location_coords GEOGRAPHY(Point, 4326),      -- Requires PostGIS extension
  image_url TEXT,
  goal_units INTEGER NOT NULL DEFAULT 0 CHECK (goal_units >= 0),
  collected_units INTEGER NOT NULL DEFAULT 0 CHECK (collected_units >= 0),
  status public."CampaignStatus" NOT NULL DEFAULT 'Upcoming',
  participants_count INTEGER NOT NULL DEFAULT 0 CHECK (participants_count >= 0),
  required_blood_groups public."BloodGroup"[], -- Array of specific blood groups needed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_end_date_check CHECK (end_date >= start_date) -- Ensure end date is after start date
);
COMMENT ON TABLE public.campaigns IS 'Stores information about blood donation campaigns/events.';
COMMENT ON COLUMN public.campaigns.location_coords IS 'Geographical coordinates (Latitude, Longitude) for the campaign venue. Requires PostGIS.';

-- Donations Table (Records of actual donations)
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE, -- Link to the donor
  donation_date TIMESTAMPTZ NOT NULL,
  donation_type public."DonationType" NOT NULL,
  location_name TEXT NOT NULL,                   -- Where the donation occurred (Bank name or Campaign name)
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL, -- Optional link to a campaign
  blood_bank_id UUID REFERENCES public.blood_banks(id) ON DELETE SET NULL, -- Optional link to a blood bank
  notes TEXT,                                  -- Notes from the center or donor
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.donations IS 'Records individual blood donations.';
COMMENT ON COLUMN public.donations.donor_uid IS 'Foreign key referencing the user who donated.';
COMMENT ON COLUMN public.donations.campaign_id IS 'Optional foreign key linking the donation to a specific campaign.';
COMMENT ON COLUMN public.donations.blood_bank_id IS 'Optional foreign key linking the donation to a specific blood bank.';


-- ========================================================
-- 3. Enable Row Level Security (RLS)
-- ========================================================
-- It is highly recommended to enable RLS on all tables containing user data
-- and define appropriate policies for secure access.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY; -- Public read might be ok, but writes should be restricted
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;  -- Public read might be ok, but writes should be restricted

-- ========================================================
-- 4. Seed Admin User Profile
-- ========================================================
-- IMPORTANT: This only creates the profile in the 'users' table.
-- The corresponding user MUST be created in Supabase Auth first
-- (e.g., using the sign-up form or the seed script `scripts/seed-admin.ts`).
-- Replace 'YOUR_ADMIN_USER_AUTH_UID' with the actual UID from Supabase Auth.

-- Example (replace with the correct UID after running seed script or signing up):
-- INSERT INTO public.users (uid, email, first_name, last_name, phone, blood_group, gender, role)
-- VALUES
--   ('YOUR_ADMIN_USER_AUTH_UID', 'admin@qatrahhayat.com', 'Admin', 'User', '0000000000', 'O+', 'Male', 'admin')
-- ON CONFLICT (uid) DO UPDATE SET -- Update if user profile already exists
--   email = EXCLUDED.email,
--   first_name = EXCLUDED.first_name,
--   last_name = EXCLUDED.last_name,
--   phone = EXCLUDED.phone,
--   blood_group = EXCLUDED.blood_group,
--   gender = EXCLUDED.gender,
--   role = EXCLUDED.role,
--   updated_at = now();

-- ========================================================
-- 5. Optional: Seed Mock Data (for testing)
-- ========================================================

-- Mock Blood Banks (Requires PostGIS enabled)
-- Example: INSERT INTO public.blood_banks (name, location, location_coords, contact_phone, operating_hours, website, inventory, last_inventory_update)
-- VALUES
--   ('City Central Blood Bank', '123 Main St, Cityville', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326), '(555) 111-2222', 'Mon-Fri 9am-5pm', 'www.citycentralbb.org', '{"A+": 25, "O-": 8, "B+": 15}', now() - interval '2 hours'),
--   ('North Regional Donor Center', '456 Oak Ave, Northtown', ST_SetSRID(ST_MakePoint(-74.0160, 40.7528), 4326), '(555) 333-4444', 'Tue-Sat 10am-6pm', 'www.northregionaldc.org', '{"AB+": 5, "O+": 30}', now() - interval '1 day');

-- Mock Campaigns
-- Example: INSERT INTO public.campaigns (title, description, organizer, start_date, end_date, time_details, location, goal_units, status)
-- VALUES
--   ('Summer Blood Drive', 'Annual summer drive to boost supplies.', 'Community Blood Services', now() + interval '1 month', now() + interval '1 month' + interval '5 days', '10 AM - 4 PM Daily', 'City Hall Plaza', 200, 'Upcoming'),
--   ('University Challenge', 'Help your department win!', 'University Health Org', now() - interval '1 week', now() - interval '2 days', '9 AM - 5 PM Daily', 'University Student Union', 300, 'Completed');

-- Note: Mock donations and requests would require existing mock users.

-- ========================================================
-- End of Script
-- ========================================================
