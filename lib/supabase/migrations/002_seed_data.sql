-- Seed expertise fields
INSERT INTO public.expertise_fields (name, description, difficulty_level) VALUES
('Technology', 'Software development, IT infrastructure, digital solutions', 'easy'),
('Agriculture', 'Farming, crop management, agricultural technology', 'easy'),
('Healthcare', 'Medical services, public health, healthcare systems', 'medium'),
('Education', 'Teaching, curriculum development, educational technology', 'easy'),
('Finance', 'Banking, microfinance, financial services', 'medium'),
('Energy', 'Renewable energy, power systems, energy access', 'hard'),
('Transportation', 'Logistics, public transport, infrastructure', 'medium'),
('Telecommunications', 'Mobile networks, internet connectivity, communications', 'medium'),
('Real Estate', 'Property development, housing, urban planning', 'medium'),
('Tourism', 'Hospitality, travel services, cultural tourism', 'easy')
ON CONFLICT (name) DO NOTHING;

-- Note: Sample questions and users should be created through the application
-- The following are example questions that companies can create after signing up:

-- Example Easy Questions:
-- "What are the main challenges facing small-scale farmers in rural Africa?"
-- "How can mobile technology improve access to financial services in African communities?"
-- "What role does education play in economic development in Africa?"

-- Example Medium Questions:
-- "Describe the impact of climate change on agricultural productivity in your region."
-- "What are the main barriers to internet connectivity in African communities?"
-- "How can renewable energy solutions address power shortages in African cities?"

-- Example Hard Questions:
-- "Explain how renewable energy solutions can address power shortages in African cities."
-- "What strategies can be implemented to improve healthcare delivery in remote African regions?"
-- "How can African countries leverage technology to improve governance and transparency?"

-- Note: Users (contributors and companies) should be created through Supabase Auth
-- Company dashboard stats will be automatically calculated by the application

