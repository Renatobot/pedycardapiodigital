-- Add rejection_reason to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add allow_scheduling_when_open to establishments table
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS allow_scheduling_when_open BOOLEAN DEFAULT false;