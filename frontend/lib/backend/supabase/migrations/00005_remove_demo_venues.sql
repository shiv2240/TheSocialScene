-- Migration 00005: remove demo/sample venues from the initial seed
DELETE FROM public.venues
WHERE slug IN (
  'social-house-indiranagar',
  'koramangala-social-studio',
  'cyber-hub-amphitheatre',
  'bandra-creative-loft'
);
