// Test file to verify Supabase connection and database functions
// This file can be run to test the database setup

import { supabase } from '../src/lib/supabase'
import { lookupService } from '../src/lib/database'

async function testDatabaseConnection() {
  console.log('🧪 Testing Supabase database connection...')
  
  try {
    // Test basic connection
    const { data: { session } } = await supabase.auth.getSession()
    console.log('✅ Supabase connection established')
    
    // Test database queries (these will work once tables are created)
    try {
      const userTypes = await lookupService.getUserTypes()
      console.log('✅ User types retrieved:', userTypes.length, 'types')
      
      const barbershopStatuses = await lookupService.getBarbershopStatuses()
      console.log('✅ Barbershop statuses retrieved:', barbershopStatuses.length, 'statuses')
      
      const appointmentStatuses = await lookupService.getAppointmentStatuses()
      console.log('✅ Appointment statuses retrieved:', appointmentStatuses.length, 'statuses')
      
      console.log('🎉 All database tests passed!')
      
    } catch (dbError) {
      console.log('⚠️  Database tables not yet created. Please run the SQL schema first.')
      console.log('   See SUPABASE_SETUP.md for instructions.')
      console.log('   Error:', (dbError as Error).message)
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', (error as Error).message)
    console.log('💡 Make sure you have set up your .env.local file with Supabase credentials')
    console.log('   See SUPABASE_SETUP.md for setup instructions')
  }
}

// Export for use in other files
export { testDatabaseConnection }

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
}