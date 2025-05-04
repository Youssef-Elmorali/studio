-- Create custom ENUM types first (if not already existing)
-- Ensure extensions are enabled in Supabase Dashboard (Database -> Extensions -> Search for "uuid-ossp")
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For generating UUIDs if needed

-- Drop existing types if they exist (be careful with this in production)
-- DROP TYPE IF EXISTS public."BloodGroup" CASCADE;
-- DROP TYPE IF EXISTS public."Gender" CASCADE;
-- DROP TYPE IF EXISTS public."UserRole" CASCADE;
-- DROP TYPE IF EXISTS public."RequestStatus" CASCADE;
-- DROP TYPE IF EXISTS public."UrgencyLevel" CASCADE;
-- DROP TYPE IF EXISTS public."CampaignStatus" CASCADE;
-- DROP TYPE IF EXISTS public."DonationType" CASCADE;

-- Create ENUM Types
CREATE TYPE public."BloodGroup" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE public."Gender" AS ENUM ('Male', 'Female');
CREATE TYPE public."UserRole" AS ENUM ('donor', 'recipient', 'admin');
CREATE TYPE public."RequestStatus" AS ENUM ('Pending', 'Pending Verification', 'Active', 'Partially Fulfilled', 'Fulfilled', 'Cancelled', 'Expired');
CREATE TYPE public."UrgencyLevel" AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE public."CampaignStatus" AS ENUM ('Upcoming', 'Ongoing', 'Completed', 'Cancelled');
CREATE TYPE public."DonationType" AS ENUM ('Whole Blood', 'Platelets', 'Plasma', 'Power Red');

-- Table: users
-- Stores user profile information, linked to Supabase Auth.
CREATE TABLE public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Foreign key to auth.users table
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  dob DATE,                                  -- Store as DATE
  blood_group public."BloodGroup",              -- Use the custom ENUM type
  gender public."Gender",                    -- Use the custom ENUM type
  role public."UserRole" NOT NULL DEFAULT 'recipient', -- Use the custom ENUM type
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Donor specific fields (nullable)
  last_donation_date DATE,                  -- Store as DATE
  medical_conditions TEXT,
  is_eligible BOOLEAN DEFAULT TRUE,
  next_eligible_date DATE,                   -- Store as DATE
  total_donations INT DEFAULT 0
);
-- Add comments for clarity
COMMENT ON TABLE public.users IS 'Stores user profile data, extending Supabase auth users.';
COMMENT ON COLUMN public.users.uid IS 'Primary key, references auth.users.id.';
COMMENT ON COLUMN public.users.dob IS 'Date of birth.';
COMMENT ON COLUMN public.users.last_donation_date IS 'Date of the last blood donation (for donors).';
COMMENT ON COLUMN public.users.next_eligible_date IS 'Date when the donor becomes eligible again.';

-- Enable RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile.
CREATE POLICY "Allow individual user access to own data"
ON public.users
FOR SELECT USING (auth.uid() = uid);

-- RLS Policy: Users can update their own profile.
CREATE POLICY "Allow individual user to update own data"
ON public.users
FOR UPDATE USING (auth.uid() = uid);

-- RLS Policy: Admins can view all user profiles (Requires custom claim or function)
-- Example using a role claim (adjust if using a different method):
-- CREATE POLICY "Allow admin read access"
-- ON public.users
-- FOR SELECT TO authenticated
-- USING (get_my_claim('user_role') = 'admin'); -- Assumes a get_my_claim function

-- RLS Policy: Allow users to insert their own profile (usually done via signup/functions)
CREATE POLICY "Allow individual user to insert own data"
ON public.users
FOR INSERT WITH CHECK (auth.uid() = uid);

-- Table: blood_banks
-- Stores information about blood donation centers/banks.
-- Requires PostGIS extension for location_coords: Enable in Supabase Dashboard (Database -> Extensions -> Search for "postgis")
CREATE TABLE public.blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  -- Requires PostGIS enabled in Supabase Dashboard
  -- location_coords GEOGRAPHY(Point, 4326), -- Store as GEOGRAPHY Point type
  contact_phone VARCHAR(20),
  operating_hours VARCHAR(255),
  website VARCHAR(255),
  inventory JSONB,                           -- Store inventory as JSONB map (BloodGroup -> count)
  last_inventory_update TIMESTAMPTZ,
  services_offered TEXT[],                   -- Array of services
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.blood_banks IS 'Information about blood donation centers.';
-- COMMENT ON COLUMN public.blood_banks.location_coords IS 'Geospatial coordinates (Requires PostGIS).';
COMMENT ON COLUMN public.blood_banks.inventory IS 'JSONB map of blood types to unit counts.';

-- RLS for blood_banks: Allow public read access
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to blood banks"
ON public.blood_banks
FOR SELECT USING (true);
-- Add policy for admins to insert/update if needed


-- Table: campaigns
-- Stores information about blood donation campaigns/drives.
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  organizer VARCHAR(255) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  time_details VARCHAR(100),                -- e.g., "10 AM - 4 PM"
  location TEXT NOT NULL,
  -- Requires PostGIS enabled in Supabase Dashboard
  -- location_coords GEOGRAPHY(Point, 4326),
  image_url VARCHAR(255),
  goal_units INT DEFAULT 0,
  collected_units INT DEFAULT 0,
  status public."CampaignStatus" NOT NULL,      -- Use the custom ENUM type
  participants_count INT DEFAULT 0,
  required_blood_groups public."BloodGroup"[], -- Array of specific blood groups needed
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.campaigns IS 'Information about blood donation drives and events.';
COMMENT ON COLUMN public.campaigns.required_blood_groups IS 'Optional array of specific blood types needed.';

-- RLS for campaigns: Allow public read access
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to campaigns"
ON public.campaigns
FOR SELECT USING (true);
-- Add policy for admins to insert/update if needed


-- Table: blood_requests
-- Stores user requests for blood donations.
CREATE TABLE public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE SET NULL, -- Link to user, set null if user deleted
  requester_name VARCHAR(200),               -- Denormalized name
  patient_name VARCHAR(200) NOT NULL,
  required_blood_group public."BloodGroup" NOT NULL, -- Use the custom ENUM type
  units_required INT NOT NULL,
  units_fulfilled INT DEFAULT 0,
  urgency public."UrgencyLevel" NOT NULL,       -- Use the custom ENUM type
  hospital_name VARCHAR(255) NOT NULL,
  hospital_location TEXT NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  additional_details TEXT,
  status public."RequestStatus" NOT NULL DEFAULT 'Pending Verification', -- Use ENUM type
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.blood_requests IS 'User-submitted requests for blood.';
COMMENT ON COLUMN public.blood_requests.requester_name IS 'Denormalized name of the requester for easy display.';

-- RLS for blood_requests:
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own requests
CREATE POLICY "Allow user to view own requests"
ON public.blood_requests
FOR SELECT USING (auth.uid() = requester_uid);

-- Allow users to insert requests for themselves
CREATE POLICY "Allow user to insert own requests"
ON public.blood_requests
FOR INSERT WITH CHECK (auth.uid() = requester_uid);

-- Allow users to update/cancel their own PENDING requests (adjust statuses as needed)
CREATE POLICY "Allow user to update own pending requests"
ON public.blood_requests
FOR UPDATE USING (auth.uid() = requester_uid AND status IN ('Pending Verification', 'Pending'))
WITH CHECK (auth.uid() = requester_uid);

-- Allow authenticated users to view ACTIVE requests (adjust statuses as needed)
CREATE POLICY "Allow authenticated users to view active requests"
ON public.blood_requests
FOR SELECT TO authenticated
USING (status IN ('Active', 'Partially Fulfilled'));

-- Add admin policies for full access if necessary (similar to users table)


-- Table: donations
-- Stores records of blood donations made by users.
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE, -- Link to user, delete donation if user deleted
  donation_date DATE NOT NULL,             -- Store as DATE
  donation_type public."DonationType" NOT NULL, -- Use the custom ENUM type
  location_name VARCHAR(255) NOT NULL,     -- Name of bank or campaign location
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL, -- Optional link
  blood_bank_id UUID REFERENCES public.blood_banks(id) ON DELETE SET NULL, -- Optional link
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.donations IS 'Records of individual blood donations.';

-- RLS for donations:
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own donation records
CREATE POLICY "Allow user to view own donations"
ON public.donations
FOR SELECT USING (auth.uid() = donor_uid);

-- Add policies for admins/centers to insert/update donations if required

-- Table: notifications
-- Stores notifications for users.
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50), -- e.g., 'request_match', 'campaign_start', 'eligibility_reminder'
    link VARCHAR(255), -- Optional link related to the notification
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.notifications IS 'Stores notifications for users.';

-- RLS for notifications:
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notifications
CREATE POLICY "Allow user to view own notifications"
ON public.notifications
FOR SELECT USING (auth.uid() = user_uid);

-- Allow users to mark their own notifications as read
CREATE POLICY "Allow user to update own notifications"
ON public.notifications
FOR UPDATE USING (auth.uid() = user_uid)
WITH CHECK (auth.uid() = user_uid);

-- Policies for inserting notifications (likely done via triggers or functions)


-- Helper function to update 'updated_at' column automatically (Optional but recommended)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc', now());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger function to tables with 'updated_at'
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
ON public.users FOR EACH ROW EXECUTE FUNCTION
public.update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at BEFORE UPDATE
ON public.blood_requests FOR EACH ROW EXECUTE FUNCTION
public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE
ON public.campaigns FOR EACH ROW EXECUTE FUNCTION
public.update_updated_at_column();

CREATE TRIGGER update_blood_banks_updated_at BEFORE UPDATE
ON public.blood_banks FOR EACH ROW EXECUTE FUNCTION
public.update_updated_at_column();


-- --- Seed Data (Optional: Add INSERT statements here if needed) ---

-- Example: Inserting a Blood Bank (ensure PostGIS is enabled if using location_coords)
/*
INSERT INTO public.blood_banks (name, location, contact_phone, operating_hours, website, inventory, last_inventory_update, services_offered)
VALUES
  ('Central Blood Bank', '123 Main St, Cityville', '555-1000', 'Mon-Fri 9am-5pm', 'www.centralblood.org', '{"A+": 25, "A-": 10, "B+": 15, "B-": 5, "AB+": 8, "AB-": 3, "O+": 40, "O-": 20}', NOW() - interval '2 hours', ARRAY['Whole Blood', 'Platelets']),
  ('North City Donation Center', '456 Oak Ave, Northville', '555-2000', 'Tue-Sat 10am-6pm', 'www.northcitydonate.org', '{"A+": 30, "O+": 50, "B-": 8}', NOW() - interval '1 hour', ARRAY['Whole Blood']);
*/

-- Example: Inserting a Campaign
/*
INSERT INTO public.campaigns (title, description, organizer, start_date, end_date, time_details, location, goal_units, status)
VALUES
  ('Summer Community Drive', 'Help us meet the summer demand!', 'Qatrah Hayat Community Team', '2024-07-15 09:00:00+00', '2024-07-20 17:00:00+00', '9 AM - 5 PM Daily', 'City Hall Plaza', 200, 'Ongoing'),
  ('University Blood Challenge', 'Support your campus and save lives.', 'State University Health Services', '2024-08-05 00:00:00+00', '2024-08-09 23:59:59+00', 'See Campus Schedule', 'State University - Student Union', 300, 'Upcoming');
*/

-- The admin user should be created using the seed script (`scripts/seed-admin.ts`)
-- which interacts with Supabase Auth directly.
-- Do not insert the admin user directly into the `users` table via SQL
-- without ensuring the corresponding auth user exists.

SELECT 'Database schema and basic RLS policies created successfully.' as status;
