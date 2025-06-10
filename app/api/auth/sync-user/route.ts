import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    
    // Create a mock Firebase user object for the UserService
    const mockFirebaseUser = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
    }
    
    const user = await UserService.createOrUpdateUser(mockFirebaseUser, userData.provider)
    
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync user' },
      { status: 500 }
    )
  }
}
