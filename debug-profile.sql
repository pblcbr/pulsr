-- Debug what's in the profiles table
-- Execute in Supabase SQL Editor

-- 1. Check all profiles
SELECT 
  id, 
  user_id, 
  practical, 
  analytical, 
  creative, 
  social, 
  entrepreneurial, 
  organized,
  business_model,
  audience,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- 2. Check if there are any profiles with data
SELECT 
  user_id,
  CASE 
    WHEN analytical > 0 OR practical > 0 THEN 'Has onboarding data'
    ELSE 'Empty profile'
  END as status,
  analytical,
  practical,
  business_model
FROM public.profiles;
