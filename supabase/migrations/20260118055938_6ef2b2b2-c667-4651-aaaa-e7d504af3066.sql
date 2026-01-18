-- Add scheduled date and time columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS scheduled_time time;