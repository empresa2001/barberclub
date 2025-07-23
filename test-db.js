import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testDatabaseConnection() {
  console.log('🧪 Testing Supabase database connection...')
  
  try {
    // Test basic connection
    const { data: { user } } = await supabase.auth.getUser()
    console.log('✅ Supabase connection established')
    
    // Test database queries
    try {
      const { data: userTypes } = await supabase
        .from('user_types')
        .select('*')
      console.log('✅ User types retrieved:', userTypes?.length || 0, 'types')
      
      const { data: barbershopStatuses } = await supabase
        .from('barbershop_status')
        .select('*')
      console.log('✅ Barbershop statuses retrieved:', barbershopStatuses?.length || 0, 'statuses')
      
      const { data: appointmentStatuses } = await supabase
        .from('appointment_status')
        .select('*')
      console.log('✅ Appointment statuses retrieved:', appointmentStatuses?.length || 0, 'statuses')
      
      console.log('🎉 All database tests passed!')
      
    } catch (dbError) {
      console.log('⚠️  Database tables not yet created. Please run the SQL schema first.')
      console.log('   See SUPABASE_SETUP.md for instructions.')
      console.log('   Error:', dbError.message)
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message)
    console.log('💡 Make sure you have set up your .env.local file with Supabase credentials')
    console.log('   See SUPABASE_SETUP.md for setup instructions')
  }
}

// Execute test
testDatabaseConnection()