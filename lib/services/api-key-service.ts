import { db } from '@/lib/db/index';
import { apiKeysTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateApiKey } from '@/lib/utils/api-key-generator';

export class ApiKeyService {
  static async createApiKey(userId: string, keyName: string) {
    try {
      const keyValue = generateApiKey();
      
      const newApiKey = {
        userId, // This is now a Firebase UID (string)
        keyName,
        keyValue,
        requestsUsed: 0,
        requestsLimit: 1000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [createdApiKey] = await db
        .insert(apiKeysTable)
        .values(newApiKey)
        .returning();
      
      return createdApiKey;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw new Error('Failed to create API key');
    }
  }

  static async getUserApiKeys(userId: string) {
    try {
      const apiKeys = await db
        .select()
        .from(apiKeysTable)
        .where(eq(apiKeysTable.userId, userId));
      
      return apiKeys;
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }
  }

  static async deleteApiKey(userId: string, keyId: string) {
    try {
      await db
        .delete(apiKeysTable)
        .where(
          and(
            eq(apiKeysTable.id, keyId),
            eq(apiKeysTable.userId, userId)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw new Error('Failed to delete API key');
    }
  }

  static async toggleApiKeyStatus(userId: string, keyId: string, isActive: boolean) {
    try {
      const [updatedApiKey] = await db
        .update(apiKeysTable)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(apiKeysTable.id, keyId),
            eq(apiKeysTable.userId, userId)
          )
        )
        .returning();

      return updatedApiKey;
    } catch (error) {
      console.error('Error updating API key status:', error);
      throw new Error('Failed to update API key status');
    }
  }

  static async validateApiKey(keyValue: string) {
    try {
      const [apiKey] = await db
        .select()
        .from(apiKeysTable)
        .where(
          and(
            eq(apiKeysTable.keyValue, keyValue),
            eq(apiKeysTable.isActive, true)
          )
        )
        .limit(1);

      return apiKey || null;
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  static async incrementUsage(keyId: string) {
    try {
      await db
        .update(apiKeysTable)
        .set({
          requestsUsed: apiKeysTable.requestsUsed + 1,
          updatedAt: new Date(),
        })
        .where(eq(apiKeysTable.id, keyId));

      return true;
    } catch (error) {
      console.error('Error incrementing API key usage:', error);
      return false;
    }
  }
}
