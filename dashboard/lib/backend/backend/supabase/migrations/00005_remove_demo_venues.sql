-- Demo venue records are not part of production seed data.
DELETE FROM public.venues
WHERE slug IN (
  'social-house-indiranagar',
  'koramangala-social-studio',
  'cyber-hub-amphitheatre',
  'bandra-creative-loft'
);
