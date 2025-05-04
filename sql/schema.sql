
-- Qatrah Hayat Supabase Schema
-- Run these commands in your Supabase SQL Editor (Database -> SQL Editor -> New query)

-- -----------------------------------------------------------------------------
-- 1. Enable UUID extension if not already enabled
-- -----------------------------------------------------------------------------
-- create extension if not exists "uuid-ossp"; -- Run this if needed, might require DB restart

-- -----------------------------------------------------------------------------
-- 2. Create Enums (Custom Types) - Adjust if using different names or values
-- -----------------------------------------------------------------------------
-- Note: Supabase dashboard often provides a UI for creating enums.
-- If you create them via UI, ensure the names match exactly.
-- If running SQL, uncomment and run these CREATE TYPE statements.

-- do $$ begin
--     create type public."BloodGroup" as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
-- exception
--     when duplicate_object then null;
-- end $$;

-- do $$ begin
--     create type public."Gender" as enum ('Male', 'Female');
-- exception
--     when duplicate_object then null;
-- end $$;

-- do $$ begin
--     create type public."UserRole" as enum ('donor', 'recipient', 'admin');
-- exception
--     when duplicate_object then null;
-- end $$;

-- do $$ begin
--     create type public."RequestStatus" as enum ('Pending', 'Pending Verification', 'Active', 'Partially Fulfilled', 'Fulfilled', 'Cancelled', 'Expired');
-- exception
--     when duplicate_object then null;
-- end $$;

-- do $$ begin
--     create type public."UrgencyLevel" as enum ('Critical', 'High', 'Medium', 'Low');
-- exception
--     when duplicate_object then null;
-- end $$;

-- do $$ begin
--     create type public."CampaignStatus" as enum ('Upcoming', 'Ongoing', 'Completed', 'Cancelled');
-- exception
--     when duplicate_object then null;
-- end $$;

-- do $$ begin
--     create type public."DonationType" as enum ('Whole Blood', 'Platelets', 'Plasma', 'Power Red');
-- exception
--     when duplicate_object then null;
-- end $$;


-- -----------------------------------------------------------------------------
-- 3. Create Users Table
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  uid uuid not null primary key references auth.users (id) on delete cascade, -- Foreign key to Supabase auth users table
  email text unique,                            -- Unique email
  first_name text,
  last_name text,
  phone text,
  dob date,                                     -- Use DATE type for Date of Birth
  blood_group public."BloodGroup",              -- Use the custom ENUM type
  gender public."Gender",                       -- Use the custom ENUM type
  role public."UserRole" not null default 'donor', -- Use the custom ENUM type, default to donor
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  -- Donor specific fields (nullable)
  last_donation_date date,                      -- Use DATE type
  medical_conditions text,
  is_eligible boolean default true,             -- Default eligibility to true
  next_eligible_date date,                      -- Use DATE type
  total_donations integer default 0             -- Default total donations to 0
);

-- RLS Policy for Users table (Example: Users can view/update their own profile)
-- Adjust policies based on your exact security requirements.
-- Ensure RLS is enabled for the table in Supabase UI.

alter table public.users enable row level security;

create policy "Allow logged-in users to view their own profile"
on public.users for select
using (auth.uid() = uid);

create policy "Allow logged-in users to update their own profile"
on public.users for update
using (auth.uid() = uid)
with check (auth.uid() = uid);

-- Policy for allowing service_role to bypass RLS (needed for seeding/admin actions)
-- This is often implicitly handled for service_role keys, but explicit policy can be added if needed.
-- create policy "Allow service_role full access"
-- on public.users for all
-- using (true)
-- with check (true);

-- Trigger function to automatically update `updated_at` timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists before creating
drop trigger if exists on_users_updated on public.users;

-- Create the trigger
create trigger on_users_updated
before update on public.users
for each row
execute procedure public.handle_updated_at();


-- -----------------------------------------------------------------------------
-- 4. Create Blood Banks Table
-- -----------------------------------------------------------------------------
create table if not exists public.blood_banks (
  id uuid not null primary key default uuid_generate_v4(), -- Use uuid-ossp function
  name text not null,
  location text not null,
  location_coords text, -- Use TEXT for simplicity, consider PostGIS later if needed
  contact_phone text,
  operating_hours text,
  website text,
  inventory jsonb,                          -- Use JSONB for flexible inventory structure
  last_inventory_update timestamp with time zone,
  services_offered text[],                  -- Array of text for services
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- RLS Policy for Blood Banks (Example: Allow public read access)
alter table public.blood_banks enable row level security;

create policy "Allow public read access to blood banks"
on public.blood_banks for select
using (true);

-- Allow admin full access (Example, adjust role name if needed)
create policy "Allow admin full access to blood banks"
on public.blood_banks for all
using ( (select role from public.users where uid = auth.uid()) = 'admin' )
with check ( (select role from public.users where uid = auth.uid()) = 'admin' );

-- Trigger for updated_at
drop trigger if exists on_blood_banks_updated on public.blood_banks;
create trigger on_blood_banks_updated
before update on public.blood_banks
for each row
execute procedure public.handle_updated_at();


-- -----------------------------------------------------------------------------
-- 5. Create Campaigns Table
-- -----------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid not null primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  organizer text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  time_details text,
  location text not null,
  location_coords text,                     -- Use TEXT for simplicity
  image_url text,
  goal_units integer not null default 0,
  collected_units integer not null default 0,
  status public."CampaignStatus" not null default 'Upcoming', -- Use ENUM
  participants_count integer not null default 0,
  required_blood_groups public."BloodGroup"[],          -- Array of ENUM
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- RLS Policy for Campaigns (Example: Public read, admin full access)
alter table public.campaigns enable row level security;

create policy "Allow public read access to campaigns"
on public.campaigns for select
using (true);

create policy "Allow admin full access to campaigns"
on public.campaigns for all
using ( (select role from public.users where uid = auth.uid()) = 'admin' )
with check ( (select role from public.users where uid = auth.uid()) = 'admin' );

-- Trigger for updated_at
drop trigger if exists on_campaigns_updated on public.campaigns;
create trigger on_campaigns_updated
before update on public.campaigns
for each row
execute procedure public.handle_updated_at();


-- -----------------------------------------------------------------------------
-- 6. Create Blood Requests Table
-- -----------------------------------------------------------------------------
create table if not exists public.blood_requests (
  id uuid not null primary key default uuid_generate_v4(),
  requester_uid uuid not null references public.users (uid) on delete set null, -- Foreign key to users
  requester_name text,                         -- Denormalized
  patient_name text not null,
  required_blood_group public."BloodGroup" not null, -- Use ENUM
  units_required integer not null check (units_required > 0),
  units_fulfilled integer not null default 0,
  urgency public."UrgencyLevel" not null,        -- Use ENUM
  hospital_name text not null,
  hospital_location text not null,
  contact_phone text not null,
  additional_details text,
  status public."RequestStatus" not null default 'Pending Verification', -- Use ENUM
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- RLS Policy for Blood Requests (Example: User can manage own, admin can manage all)
alter table public.blood_requests enable row level security;

create policy "Allow users to view/manage their own requests"
on public.blood_requests for all
using (auth.uid() = requester_uid)
with check (auth.uid() = requester_uid);

create policy "Allow admin full access to blood requests"
on public.blood_requests for all
using ( (select role from public.users where uid = auth.uid()) = 'admin' )
with check ( (select role from public.users where uid = auth.uid()) = 'admin' );

-- Allow authenticated users to view ACTIVE requests (adjust as needed)
create policy "Allow logged-in users to view active requests"
on public.blood_requests for select
using ( auth.role() = 'authenticated' and status = 'Active' );


-- Trigger for updated_at
drop trigger if exists on_blood_requests_updated on public.blood_requests;
create trigger on_blood_requests_updated
before update on public.blood_requests
for each row
execute procedure public.handle_updated_at();


-- -----------------------------------------------------------------------------
-- 7. Create Donations Table
-- -----------------------------------------------------------------------------
create table if not exists public.donations (
  id uuid not null primary key default uuid_generate_v4(),
  donor_uid uuid not null references public.users (uid) on delete cascade, -- Foreign key to users
  donation_date timestamp with time zone not null,
  donation_type public."DonationType" not null, -- Use ENUM
  location_name text not null,
  campaign_id uuid references public.campaigns (id) on delete set null,   -- Optional foreign key
  blood_bank_id uuid references public.blood_banks (id) on delete set null, -- Optional foreign key
  notes text,
  created_at timestamp with time zone not null default now()
  -- No updated_at needed if donations are typically immutable once created
);

-- RLS Policy for Donations (Example: User sees own, admin sees all)
alter table public.donations enable row level security;

create policy "Allow users to view their own donations"
on public.donations for select
using (auth.uid() = donor_uid);

create policy "Allow admin full access to donations"
on public.donations for all
using ( (select role from public.users where uid = auth.uid()) = 'admin' )
with check ( (select role from public.users where uid = auth.uid()) = 'admin' );


-- Add indexes for frequently queried columns (optional but recommended)
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_blood_requests_status on public.blood_requests (status);
create index if not exists idx_blood_requests_requester on public.blood_requests (requester_uid);
create index if not exists idx_donations_donor on public.donations (donor_uid);
create index if not exists idx_campaigns_status on public.campaigns (status);

-- End of Schema --
