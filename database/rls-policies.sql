-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON users
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Barbershops policies
CREATE POLICY "Anyone can view active barbershops" ON barbershops
    FOR SELECT
    USING (status_id = 2); -- status_id 2 is 'active'

CREATE POLICY "Owners can view their own barbershops" ON barbershops
    FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Enable insert for authenticated users only" ON barbershops
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Barbers policies
CREATE POLICY "Anyone can view active barbers" ON barbers
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM barbershops b 
        WHERE b.id = barbers.barbershop_id 
        AND b.status_id = 2
    ));

CREATE POLICY "Enable insert for authenticated users only" ON barbers
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
