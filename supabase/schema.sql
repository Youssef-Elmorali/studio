-- Enable Row Level Security (RLS)
-- RLS is enabled by default in Supabase, but this confirms it.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;


-- Create custom ENUM types (if they don't exist)
-- Note: Supabase might handle enums differently in the UI vs SQL.
-- This attempts to create them if needed.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bloodgroup') THEN
        CREATE TYPE public."BloodGroup" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
        CREATE TYPE public."Gender" AS ENUM ('Male', 'Female');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        CREATE TYPE public."UserRole" AS ENUM ('donor', 'recipient', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requeststatus') THEN
        CREATE TYPE public."RequestStatus" AS ENUM ('Pending', 'Pending Verification', 'Active', 'Partially Fulfilled', 'Fulfilled', 'Cancelled', 'Expired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgencylevel') THEN
        CREATE TYPE public."UrgencyLevel" AS ENUM ('Critical', 'High', 'Medium', 'Low');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donationtype') THEN
        CREATE TYPE public."DonationType" AS ENUM ('Whole Blood', 'Platelets', 'Plasma', 'Power Red');
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaignstatus') THEN
         CREATE TYPE public."CampaignStatus" AS ENUM ('Upcoming', 'Ongoing', 'Completed', 'Cancelled');
     END IF;
END $$;


-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Foreign Key to Supabase Auth users table
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  dob DATE, -- Date of Birth
  blood_group public."BloodGroup", -- Use the custom ENUM type
  gender public."Gender",          -- Use the custom ENUM type
  role public."UserRole" NOT NULL DEFAULT 'recipient', -- Default role
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Donor specific fields (nullable)
  last_donation_date DATE,
  medical_conditions TEXT,
  is_eligible BOOLEAN DEFAULT TRUE,
  next_eligible_date DATE,
  total_donations INT DEFAULT 0
);
COMMENT ON TABLE public.users IS 'Stores user profile information, extending Supabase Auth users.';
COMMENT ON COLUMN public.users.uid IS 'Primary key, references auth.users.id.';
COMMENT ON COLUMN public.users.role IS 'User role: donor, recipient, or admin.';


-- 2. Blood Banks Table
CREATE TABLE IF NOT EXISTS public.blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  -- location_coords GEOGRAPHY(Point, 4326), -- Requires PostGIS extension enabled in Supabase
  -- Alternative using JSONB for coordinates if PostGIS is not enabled:
  location_coords JSONB, -- Store as {"lat": number, "lng": number}
  contact_phone VARCHAR(20),
  operating_hours TEXT,
  website VARCHAR(255),
  inventory JSONB, -- Store inventory as JSON: {"A+": 10, "O-": 5, ...}
  last_inventory_update TIMESTAMPTZ,
  services_offered TEXT[], -- Array of services
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.blood_banks IS 'Information about blood donation centers/banks.';
COMMENT ON COLUMN public.blood_banks.location_coords IS 'Geospatial coordinates (latitude, longitude). Requires PostGIS extension for GEOGRAPHY type, otherwise use JSONB {"lat": ..., "lng": ...}.';
COMMENT ON COLUMN public.blood_banks.inventory IS 'JSON object mapping blood types (e.g., "A+") to unit counts.';


-- 3. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  organizer VARCHAR(255),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  time_details TEXT, -- e.g., "10:00 AM - 4:00 PM Daily"
  location TEXT NOT NULL,
  -- location_coords GEOGRAPHY(Point, 4326), -- Requires PostGIS extension
  -- Alternative using JSONB:
  location_coords JSONB, -- Store as {"lat": number, "lng": number}
  image_url VARCHAR(255),
  goal_units INT NOT NULL DEFAULT 0,
  collected_units INT NOT NULL DEFAULT 0,
  status public."CampaignStatus" NOT NULL DEFAULT 'Upcoming', -- Use the custom ENUM type
  participants_count INT NOT NULL DEFAULT 0,
  required_blood_groups public."BloodGroup"[], -- Array of specific blood groups needed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.campaigns IS 'Details about blood donation drives and campaigns.';
COMMENT ON COLUMN public.campaigns.location_coords IS 'Geospatial coordinates for the campaign location. Requires PostGIS extension for GEOGRAPHY type, otherwise use JSONB {"lat": ..., "lng": ...}.';


-- 4. Blood Requests Table
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  requester_name VARCHAR(200), -- Denormalized for easy display
  patient_name VARCHAR(255) NOT NULL,
  required_blood_group public."BloodGroup" NOT NULL, -- Use the custom ENUM type
  units_required INT NOT NULL DEFAULT 1,
  units_fulfilled INT NOT NULL DEFAULT 0,
  urgency public."UrgencyLevel" NOT NULL DEFAULT 'Medium', -- Use the custom ENUM type
  hospital_name VARCHAR(255) NOT NULL,
  hospital_location TEXT NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  additional_details TEXT,
  status public."RequestStatus" NOT NULL DEFAULT 'Pending Verification', -- Use the custom ENUM type
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.blood_requests IS 'Records requests for blood submitted by users.';


-- 5. Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE SET NULL, -- Keep record even if donor deleted? Or CASCADE?
  donation_date DATE NOT NULL,
  donation_type public."DonationType" NOT NULL, -- Use the custom ENUM type
  location_name VARCHAR(255), -- e.g., "City Central Blood Bank" or Campaign Title
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL, -- Optional link
  blood_bank_id UUID REFERENCES public.blood_banks(id) ON DELETE SET NULL, -- Optional link
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.donations IS 'Tracks individual blood donations.';
COMMENT ON COLUMN public.donations.donor_uid IS 'The user who made the donation.';
COMMENT ON COLUMN public.donations.campaign_id IS 'Link to the campaign if donation was part of one.';
COMMENT ON COLUMN public.donations.blood_bank_id IS 'Link to the blood bank where donation occurred.';


-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON public.blood_requests(requester_uid);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_uid);
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(start_date, end_date);
-- Consider a GIN index for blood_banks.location_coords if using JSONB and querying coordinates
-- CREATE INDEX idx_blood_banks_coords_gin ON public.blood_banks USING GIN (location_coords);


-- Create Function to Update `updated_at` Timestamps Automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the Trigger to Tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
ON public.users FOR EACH ROW EXECUTE FUNCTION
public.update_updated_at_column();

CREATE TRIGGER update_blood_banks_updated_at BEFORE UPDATE
ON public.blood_banks FOR EACH ROW EXECUTE FUNCTION
public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE
ON public.campaigns FOR EACH ROW EXECUTE FUNCTION
public.update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at BEFORE UPDATE
ON public.blood_requests FOR EACH ROW EXECUTE FUNCTION
public.update_updated_at_column();


-- Seed Data (Optional - run this separately or uncomment)
/*
-- Example Seed Data (adjust as needed)
-- Ensure the admin user exists in auth.users first (use seed script or Supabase UI)
-- Assuming admin UID is 'your-admin-user-uid'

-- Seed Admin User Profile (if not handled by seed script)
INSERT INTO public.users (uid, email, first_name, last_name, role)
VALUES
  ('your-admin-user-uid', 'admin@qatrahhayat.com', 'Admin', 'User', 'admin')
ON CONFLICT (uid) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Seed Sample Donor
INSERT INTO public.users (uid, email, first_name, last_name, phone, dob, blood_group, gender, role, is_eligible, total_donations)
VALUES
  ('donor-uid-1', 'donor1@example.com', 'Sam', 'Donor', '1234567890', '1990-05-15', 'A+', 'Male', 'donor', TRUE, 2),
  ('donor-uid-2', 'donor2@example.com', 'Jane', 'Giver', '0987654321', '1985-11-20', 'O-', 'Female', 'donor', TRUE, 5)
ON CONFLICT (uid) DO NOTHING; -- Or DO UPDATE if you want to update existing

-- Seed Sample Recipient
INSERT INTO public.users (uid, email, first_name, last_name, phone, dob, blood_group, gender, role)
VALUES
  ('recipient-uid-1', 'recipient1@example.com', 'Patient', 'Zero', '1122334455', '1978-01-30', 'B+', 'Male', 'recipient')
ON CONFLICT (uid) DO NOTHING;

-- Seed Sample Blood Bank
INSERT INTO public.blood_banks (name, location, location_coords, contact_phone, operating_hours, inventory, last_inventory_update)
VALUES
  ('City Central Blood Bank', '123 Main St, Cityville', '{"lat": 31.95, "lng": 35.93}', '555-1000', 'Mon-Fri 9am-5pm', '{"A+": 25, "A-": 10, "B+": 15, "B-": 5, "AB+": 8, "AB-": 2, "O+": 40, "O-": 18}', NOW() - interval '2 hours'),
  ('North Regional Center', '456 North Ave, Cityville', '{"lat": 31.98, "lng": 35.91}', '555-2000', 'Tue-Sat 10am-6pm', '{"A+": 15, "A-": 5, "B+": 20, "B-": 8, "AB+": 4, "AB-": 1, "O+": 30, "O-": 12}', NOW() - interval '4 hours');

-- Seed Sample Campaign
INSERT INTO public.campaigns (title, description, organizer, start_date, end_date, time_details, location, status, goal_units)
VALUES
  ('Summer Blood Drive 2024', 'Annual summer drive to boost blood supply.', 'Community Blood Services', '2024-07-15 00:00:00+00', '2024-07-20 23:59:59+00', '10 AM - 4 PM Daily', 'City Hall Plaza', 'Ongoing', 200),
  ('University Challenge Fall', 'University department challenge.', 'Student Health Org', '2024-09-10 00:00:00+00', '2024-09-14 23:59:59+00', '9 AM - 5 PM Daily', 'University Campus Green', 'Upcoming', 300);

-- Seed Sample Blood Request
-- Replace 'recipient-uid-1' with an actual recipient UID from your users table
-- INSERT INTO public.blood_requests (requester_uid, requester_name, patient_name, required_blood_group, units_required, urgency, hospital_name, hospital_location, contact_phone, status)
-- VALUES
--   ('recipient-uid-1', 'Patient Zero', 'John Smith', 'B+', 2, 'High', 'City General Hospital', '789 South St, Cityville', '555-3000', 'Pending Verification');

-- Seed Sample Donation
-- Replace 'donor-uid-1' and 'donor-uid-2' with actual donor UIDs
-- INSERT INTO public.donations (donor_uid, donation_date, donation_type, location_name)
-- VALUES
--   ('donor-uid-1', '2024-04-10', 'Whole Blood', 'City Central Blood Bank'),
--   ('donor-uid-2', '2024-05-01', 'Power Red', 'North Regional Center');

*/
