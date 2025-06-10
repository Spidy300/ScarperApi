import { db } from '@/lib/db';
import { usersTable, type NewUser, type User } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User as FirebaseUser } from 'firebase/auth';

export class UserService {
  static async createOrUpdateUser(firebaseUser: FirebaseUser, provider: string): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.uid, firebaseUser.uid))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        const [updatedUser] = await db
          .update(usersTable)
          .set({
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            updatedAt: new Date(),
          })
          .where(eq(usersTable.uid, firebaseUser.uid))
          .returning();

        return updatedUser;
      } else {
        // Create new user
        const newUser: NewUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const [createdUser] = await db
          .insert(usersTable)
          .values(newUser)
          .returning();

        return createdUser;
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new Error('Failed to save user to database');
    }
  }

  static async getUserByUid(uid: string): Promise<User | null> {
    try {
      const users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.uid, uid))
        .limit(1);

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }
}
