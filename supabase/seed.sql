-- SAMPLE DATA FOR LOCAL DEVELOPMENT AND DEMOS ONLY. Do not load into production.
-- These titles and authors are made up for the prototype. They have no book files.

insert into public.books (id, title, author_name, edition, subject_id, description, keywords, status) values
  ('00000000-0000-4000-8000-000000000001', 'Civil Procedure in Practice', 'Adaeze Okonkwo', '3rd edition', 'civil-litigation',
   'A step-by-step guide to civil litigation, from first instructions to judgment, written for Bar Part II students.',
   array['pleadings', 'service', 'jurisdiction'], 'published'),
  ('00000000-0000-4000-8000-000000000002', 'Drafting Pleadings: A Workbook', 'Ibrahim Danladi', '1st edition', 'civil-litigation',
   'Worked examples of writs, statements of claim and defences, with drafting exercises.',
   array['drafting', 'statement of claim'], 'published'),
  ('00000000-0000-4000-8000-000000000003', 'Criminal Trials from Arrest to Appeal', 'Funmilayo Adebayo', '2nd edition', 'criminal-litigation',
   'Covers arrest, bail, charges, trial and appeal with practical checklists for defence and prosecution.',
   array['bail', 'charge', 'burden of proof'], 'published'),
  ('00000000-0000-4000-8000-000000000004', 'Bail, Charges and Plea Bargaining', 'Adaeze Okonkwo', '1st edition', 'criminal-litigation',
   'A focused guide to the pre-trial stage of criminal proceedings.',
   array['bail', 'plea bargain'], 'published'),
  ('00000000-0000-4000-8000-000000000005', 'Conveyancing and Land Transactions', 'Chukwuemeka Obi', '4th edition', 'property-law',
   'Investigation of title, contracts of sale, deeds and registration, with model documents.',
   array['title', 'deed', 'conveyancing'], 'published'),
  ('00000000-0000-4000-8000-000000000006', 'Leases and Mortgages Explained', 'Halima Bello', '2nd edition', 'property-law',
   'Drafting and negotiating leases and mortgages, with common pitfalls.',
   array['lease', 'mortgage'], 'published'),
  ('00000000-0000-4000-8000-000000000007', 'Company Formation and Governance', 'Tunde Bakare', '2nd edition', 'corporate-law',
   'Incorporation under CAMA 2020, directors duties, meetings and resolutions.',
   array['CAMA', 'directors', 'incorporation'], 'published'),
  ('00000000-0000-4000-8000-000000000008', 'Ethics for the Nigerian Lawyer', 'Ngozi Eze', '3rd edition', 'professional-ethics',
   'The Rules of Professional Conduct with practical scenarios for the Bar Finals.',
   array['RPC', 'conduct', 'advocacy'], 'published'),
  ('00000000-0000-4000-8000-000000000009', 'Corporate Insolvency Handbook', 'Tunde Bakare', '1st edition', 'corporate-law',
   'Draft awaiting review. Should NOT appear in the student catalogue.',
   array['insolvency'], 'pending_review')
on conflict (id) do nothing;
