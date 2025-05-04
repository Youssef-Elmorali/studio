-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing ENUM types if they exist (optional, for clean re-run)
DROP TYPE IF EXISTS public."BloodGroup" CASCADE;
DROP TYPE IF EXISTS public."Gender" CASCADE;
DROP TYPE IF EXISTS public."UserRole" CASCADE;
DROP TYPE IF EXISTS public."RequestStatus" CASCADE;
DROP TYPE IF EXISTS public."UrgencyLevel" CASCADE;
DROP TYPE IF EXISTS public."CampaignStatus" CASCADE;
DROP TYPE IF EXISTS public."DonationType" CASCADE;

-- Create ENUM types
CREATE TYPE public."BloodGroup" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE public."Gender" AS ENUM ('Male', 'Female');
CREATE TYPE public."UserRole" AS ENUM ('donor', 'recipient', 'admin');
CREATE TYPE public."RequestStatus" AS ENUM ('Pending', 'Pending Verification', 'Active', 'Partially Fulfilled', 'Fulfilled', 'Cancelled', 'Expired');
CREATE TYPE public."UrgencyLevel" AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE public."CampaignStatus" AS ENUM ('Upcoming', 'Ongoing', 'Completed', 'Cancelled');
CREATE TYPE public."DonationType" AS ENUM ('Whole Blood', 'Platelets', 'Plasma', 'Power Red');


-- Table: users (Stores user profile information)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  dob DATE,                     -- Store as YYYY-MM-DD
  blood_group public."BloodGroup", -- Use the custom ENUM type
  gender public."Gender",            -- Use the custom ENUM type
  role public."UserRole" NOT NULL DEFAULT 'donor', -- Default role
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Donor specific (nullable)
  last_donation_date DATE,      -- Store as YYYY-MM-DD
  medical_conditions TEXT,
  is_eligible BOOLEAN DEFAULT TRUE,
  next_eligible_date DATE,     -- Store as YYYY-MM-DD
  total_donations INTEGER DEFAULT 0
);

-- Enable RLS for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to view their own profile
CREATE POLICY "Allow users to view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = uid);

-- RLS Policy: Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = uid);

-- RLS Policy: Allow admins to manage all profiles (adjust based on your admin check)
-- Assumes a way to identify admins, e.g., a custom claim or the 'role' column itself
CREATE POLICY "Allow admins to manage all profiles" ON public.users
  FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');


-- Table: blood_requests (Stores blood donation requests)
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  requester_name TEXT,             -- Denormalized for easier display
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
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for blood_requests
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to create requests
CREATE POLICY "Allow authenticated users to create requests" ON public.blood_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy: Allow users to view their own requests
CREATE POLICY "Allow users to view their own requests" ON public.blood_requests
  FOR SELECT USING (auth.uid() = requester_uid);

-- RLS Policy: Allow users to update/cancel their own pending requests
CREATE POLICY "Allow users to update/cancel their own pending requests" ON public.blood_requests
  FOR UPDATE USING (auth.uid() = requester_uid AND status IN ('Pending Verification', 'Pending', 'Active')) -- Adjust statuses as needed
  WITH CHECK (auth.uid() = requester_uid);

-- RLS Policy: Allow authenticated users to view Active/Fulfilled requests (adjust visibility as needed)
CREATE POLICY "Allow authenticated users to view active/fulfilled requests" ON public.blood_requests
  FOR SELECT USING (auth.role() = 'authenticated' AND status IN ('Active', 'Partially Fulfilled', 'Fulfilled'));

-- RLS Policy: Allow admins to manage all requests
CREATE POLICY "Allow admins to manage all requests" ON public.blood_requests
  FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');


-- Table: donations (Records individual donation events)
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  donation_date DATE NOT NULL,       -- Store as YYYY-MM-DD
  donation_type public."DonationType" NOT NULL,
  location_name TEXT NOT NULL,         -- e.g., "City Central Blood Bank" or "Summer Blood Drive"
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL, -- Optional link
  blood_bank_id UUID REFERENCES public.blood_banks(id) ON DELETE SET NULL, -- Optional link
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to view their own donation history
CREATE POLICY "Allow users to view their own donation history" ON public.donations
  FOR SELECT USING (auth.uid() = donor_uid);

-- RLS Policy: Allow admins/staff (or service role) to insert donations (Needs refinement based on how donations are recorded)
CREATE POLICY "Allow admins/staff to insert donations" ON public.donations
  FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'); -- Example: only admins can insert directly

-- RLS Policy: Allow admins to manage all donations
CREATE POLICY "Allow admins to manage all donations" ON public.donations
  FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');


-- Table: blood_banks (Information about donation centers)
CREATE TABLE IF NOT EXISTS public.blood_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  -- location_coords GEOGRAPHY(Point, 4326),      -- Requires PostGIS extension enabled in Supabase
  contact_phone TEXT,
  operating_hours TEXT,
  website TEXT,
  inventory JSONB DEFAULT '{}'::jsonb, -- Map of blood type to count
  last_inventory_update TIMESTAMPTZ,
  services_offered TEXT[],            -- Array of strings
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for blood_banks
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read access to blood bank info
CREATE POLICY "Allow public read access to blood banks" ON public.blood_banks
  FOR SELECT USING (true);

-- RLS Policy: Allow admins to manage blood banks
CREATE POLICY "Allow admins to manage blood banks" ON public.blood_banks
  FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');


-- Table: campaigns (Information about donation drives/events)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organizer TEXT NOT NULL,              -- Could be FK later
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  time_details TEXT,                    -- e.g., "10:00 AM - 4:00 PM Daily"
  location TEXT NOT NULL,
  -- location_coords GEOGRAPHY(Point, 4326), -- Requires PostGIS
  image_url TEXT,
  goal_units INTEGER DEFAULT 0 CHECK (goal_units >= 0),
  collected_units INTEGER DEFAULT 0 CHECK (collected_units >= 0),
  status public."CampaignStatus" NOT NULL DEFAULT 'Upcoming',
  participants_count INTEGER DEFAULT 0 CHECK (participants_count >= 0),
  required_blood_groups public."BloodGroup"[], -- Array of ENUMs
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read access to campaigns
CREATE POLICY "Allow public read access to campaigns" ON public.campaigns
  FOR SELECT USING (true);

-- RLS Policy: Allow admins to manage campaigns
CREATE POLICY "Allow admins to manage campaigns" ON public.campaigns
  FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');


-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT, -- e.g., 'match', 'campaign', 'urgent', 'info', 'request_update'
    link TEXT, -- Optional link to related content (request, campaign page)
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to view their own notifications
CREATE POLICY "Allow users to view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_uid);

-- RLS Policy: Allow users to mark their own notifications as read
CREATE POLICY "Allow users to update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_uid) WITH CHECK (auth.uid() = user_uid);

-- RLS Policy: Allow service role or admins to insert notifications
-- This needs careful consideration. A trigger or function might be better.
CREATE POLICY "Allow admin/service role to insert notifications" ON public.notifications
  FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'); -- Example check

-- RLS Policy: Allow admins to manage all notifications
CREATE POLICY "Allow admins to manage all notifications" ON public.notifications
  FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');


-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update 'updated_at'
DROP TRIGGER IF EXISTS on_users_update ON public.users;
CREATE TRIGGER on_users_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_blood_requests_update ON public.blood_requests;
CREATE TRIGGER on_blood_requests_update
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_blood_banks_update ON public.blood_banks;
CREATE TRIGGER on_blood_banks_update
  BEFORE UPDATE ON public.blood_banks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_campaigns_update ON public.campaigns;
CREATE TRIGGER on_campaigns_update
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- === SEED DATA ===

-- IMPORTANT: Admin User Authentication Record
-- The following INSERT statement only creates the *profile* for the admin user.
-- The corresponding authentication user (with email/password) MUST be created
-- separately using the Supabase dashboard (Authentication -> Add User) or a
-- server-side script (like scripts/seed-admin.ts).
-- Ensure the UID below matches the UID created in Supabase Auth.
-- Replace 'PASTE_ADMIN_AUTH_USER_UID_HERE' with the actual UID after creating the auth user.
-- Or, preferably, run the `npm run seed:admin` script which handles both Auth and profile creation.

-- INSERT INTO public.users (uid, email, first_name, last_name, phone, blood_group, gender, role, is_eligible, total_donations)
-- VALUES
--   ('PASTE_ADMIN_AUTH_USER_UID_HERE', 'qunicrom1@gmail.com', 'Admin', 'User', '0000000000', 'O+', 'Male', 'admin', true, 0);

-- Sample Users (Donors & Recipients) - Replace UIDs with actual Auth User UIDs if needed for testing RLS
-- Generate some UUIDs for sample users (replace with actual UIDs if linking to real auth users)
-- Example UUIDs (generate your own or fetch from Auth):
-- donor1: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
-- donor2: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0'
-- recip1: 'c3d4e5f6-a7b8-9012-3456-7890abcdef01'

-- INSERT INTO public.users (uid, email, first_name, last_name, phone, dob, blood_group, gender, role, last_donation_date, next_eligible_date, total_donations, is_eligible)
-- VALUES
--   ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'donor1@example.com', 'John', 'Doe', '1234567890', '1990-05-15', 'A+', 'Male', 'donor', '2024-03-01', '2024-08-25', 5, true),
--   ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'donor2@example.com', 'Jane', 'Smith', '0987654321', '1985-11-20', 'O-', 'Female', 'donor', '2024-04-10', '2024-09-04', 12, true),
--   ('c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'recipient1@example.com', 'Alice', 'Brown', '5551234567', '1995-02-28', 'B+', 'Female', 'recipient', NULL, NULL, 0, false); -- Recipient specific fields are null/default


-- Sample Blood Banks
INSERT INTO public.blood_banks (name, location, contact_phone, operating_hours, website, inventory, last_inventory_update, services_offered)
VALUES
  ('City Central Blood Bank', '123 Main St, Cityville', '555-1000', 'Mon-Fri 8am-6pm, Sat 9am-1pm', 'www.citycentralbb.org', '{"A+": 50, "A-": 25, "B+": 30, "B-": 15, "AB+": 10, "AB-": 5, "O+": 60, "O-": 40}', now() - interval '2 hours', ARRAY['Whole Blood', 'Platelets', 'Plasma']),
  ('North Regional Donor Center', '456 North Ave, Northtown', '555-2000', 'Tue-Sat 10am-4pm', 'www.northregionaldc.org', '{"A+": 35, "A-": 18, "B+": 22, "B-": 8, "AB+": 5, "AB-": 2, "O+": 45, "O-": 28}', now() - interval '5 hours', ARRAY['Whole Blood', 'Power Red']),
  ('Westside Community Hospital', '789 West Blvd, Westonia', '555-3000', 'Mon-Fri 9am-5pm', 'www.westsidehospital.com/bloodbank', '{"A+": 20, "A-": 10, "B+": 15, "B-": 5, "AB+": 3, "AB-": 1, "O+": 30, "O-": 18}', now() - interval '1 day', ARRAY['Whole Blood']);

-- Sample Campaigns
INSERT INTO public.campaigns (title, description, organizer, start_date, end_date, time_details, location, goal_units, collected_units, status, participants_count, required_blood_groups)
VALUES
  ('Summer Blood Drive 2024', 'Help us meet the summer demand! All donors get a free t-shirt.', 'Community Blood Services', '2024-07-15 00:00:00+00', '2024-07-20 23:59:59+00', '10:00 AM - 4:00 PM Daily', 'City Hall Plaza', 200, 150, 'Ongoing', 120, NULL),
  ('University Challenge - Fall Semester', 'Support your university department and save lives!', 'State University & Red Cross', '2024-09-10 00:00:00+00', '2024-09-14 23:59:59+00', '9:00 AM - 5:00 PM Daily', 'State University Campus - Student Union', 300, 0, 'Upcoming', 0, ARRAY['O-', 'O+', 'A-']),
  ('Holiday Heroes Drive', 'Give the gift of life this holiday season.', 'Local Red Cross Chapter', '2024-12-01 00:00:00+00', '2024-12-05 23:59:59+00', '11:00 AM - 6:00 PM Daily', 'Downtown Community Center', 250, 0, 'Upcoming', 0, NULL);

-- Sample Blood Requests (Link requester_uid to existing user UIDs if possible)
-- INSERT INTO public.blood_requests (requester_uid, requester_name, patient_name, required_blood_group, units_required, urgency, hospital_name, hospital_location, contact_phone, status)
-- VALUES
--   ('c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'Alice Brown', 'Bob Williams', 'B+', 2, 'High', 'City Central Hospital', '100 Hospital Dr, Cityville', '555-1010', 'Active'),
--   ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'John Doe', 'Self', 'O-', 4, 'Critical', 'North Regional Medical Center', '500 North Ave, Northtown', '555-2020', 'Pending Verification');


-- Sample Donations (Link donor_uid, campaign_id, blood_bank_id to existing IDs if possible)
-- Example: Link donation 1 to John Doe, Summer Blood Drive, and City Central BB
-- Note: You'd need to fetch the actual UUIDs generated for the banks/campaigns above first.
-- INSERT INTO public.donations (donor_uid, donation_date, donation_type, location_name, campaign_id, blood_bank_id, notes)
-- VALUES
--   ('a1b2c3d4-e5f6-7890-1234-567890abcdef', '2024-07-16', 'Whole Blood', 'Summer Blood Drive 2024', (SELECT id FROM public.campaigns WHERE title = 'Summer Blood Drive 2024'), (SELECT id FROM public.blood_banks WHERE name = 'City Central Blood Bank'), 'First time donating at this drive.'),
--   ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', '2024-04-10', 'Power Red', 'North Regional Donor Center', NULL, (SELECT id FROM public.blood_banks WHERE name = 'North Regional Donor Center'), NULL);

-- Sample Notifications (Link user_uid to existing user UIDs)
-- INSERT INTO public.notifications (user_uid, message, type, link, is_read)
-- VALUES
--   ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Your next eligible donation date is approaching: 2024-08-25', 'info', '/profile', FALSE),
--   ('c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'Potential match found for your blood request for Bob Williams (B+).', 'match', '/requests/uuid-of-request-1', FALSE), -- Replace with actual request ID
--   ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'Thank you for your recent Power Red donation!', 'info', '/profile', TRUE);

-- Ensure PostGIS is enabled if using GEOGRAPHY (Run in Supabase SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Grant usage on schema public to roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant select permission to anon and authenticated roles for specific tables
GRANT SELECT ON TABLE public.blood_banks TO anon, authenticated;
GRANT SELECT ON TABLE public.campaigns TO anon, authenticated;

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blood_requests TO authenticated;
GRANT SELECT, INSERT ON TABLE public.donations TO authenticated; -- Allow users to potentially log donations? Or restrict insert.
GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated; -- Read and mark as read

-- Grant all permissions for postgres, service_role (adjust as necessary)
GRANT ALL PRIVILEGES ON TABLE public.users TO postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE public.blood_requests TO postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE public.donations TO postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE public.blood_banks TO postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE public.campaigns TO postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE public.notifications TO postgres, service_role;

-- Grant permissions on sequences if any (Supabase handles UUIDs, but for serial types)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;

-- Reset role settings
RESET SESSION AUTHORIZATION;


-- Example RLS Policies (Refined and consolidated from individual table sections)

-- ** users Table RLS **
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
CREATE POLICY "Allow users to view their own profile" ON public.users FOR SELECT USING (auth.uid() = uid);
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);
DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.users;
CREATE POLICY "Allow admins to manage all profiles" ON public.users FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');

-- ** blood_requests Table RLS **
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to create requests" ON public.blood_requests;
CREATE POLICY "Allow authenticated users to create requests" ON public.blood_requests FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow users to view their own requests" ON public.blood_requests;
CREATE POLICY "Allow users to view their own requests" ON public.blood_requests FOR SELECT USING (auth.uid() = requester_uid);
DROP POLICY IF EXISTS "Allow users to update/cancel their own pending requests" ON public.blood_requests;
CREATE POLICY "Allow users to update/cancel their own pending requests" ON public.blood_requests FOR UPDATE USING (auth.uid() = requester_uid AND status IN ('Pending Verification', 'Pending', 'Active')) WITH CHECK (auth.uid() = requester_uid);
DROP POLICY IF EXISTS "Allow authenticated users to view active/fulfilled requests" ON public.blood_requests;
CREATE POLICY "Allow authenticated users to view active/fulfilled requests" ON public.blood_requests FOR SELECT TO authenticated USING (status IN ('Active', 'Partially Fulfilled', 'Fulfilled'));
DROP POLICY IF EXISTS "Allow admins to manage all requests" ON public.blood_requests;
CREATE POLICY "Allow admins to manage all requests" ON public.blood_requests FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');

-- ** donations Table RLS **
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to view their own donation history" ON public.donations;
CREATE POLICY "Allow users to view their own donation history" ON public.donations FOR SELECT USING (auth.uid() = donor_uid);
DROP POLICY IF EXISTS "Allow admins/staff to insert donations" ON public.donations;
CREATE POLICY "Allow admins/staff to insert donations" ON public.donations FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "Allow admins to manage all donations" ON public.donations;
CREATE POLICY "Allow admins to manage all donations" ON public.donations FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');

-- ** blood_banks Table RLS **
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to blood banks" ON public.blood_banks;
CREATE POLICY "Allow public read access to blood banks" ON public.blood_banks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admins to manage blood banks" ON public.blood_banks;
CREATE POLICY "Allow admins to manage blood banks" ON public.blood_banks FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');

-- ** campaigns Table RLS **
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to campaigns" ON public.campaigns;
CREATE POLICY "Allow public read access to campaigns" ON public.campaigns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admins to manage campaigns" ON public.campaigns;
CREATE POLICY "Allow admins to manage campaigns" ON public.campaigns FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');

-- ** notifications Table RLS **
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to view their own notifications" ON public.notifications;
CREATE POLICY "Allow users to view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_uid);
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.notifications;
CREATE POLICY "Allow users to update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_uid) WITH CHECK (auth.uid() = user_uid);
DROP POLICY IF EXISTS "Allow admin/service role to insert notifications" ON public.notifications;
CREATE POLICY "Allow admin/service role to insert notifications" ON public.notifications FOR INSERT WITH CHECK (((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin')); -- Simplified example, adjust as needed
DROP POLICY IF EXISTS "Allow admins to manage all notifications" ON public.notifications;
CREATE POLICY "Allow admins to manage all notifications" ON public.notifications FOR ALL USING ((SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin');
