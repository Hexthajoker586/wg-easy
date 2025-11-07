import { randomBytes, createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { apiKey } from './schema';
import type { DBType } from '#db/sqlite';

/**
 * Hash an API key using SHA-256 (not salted, deterministic)
 * This allows us to look up keys efficiently
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

function createPreparedStatement(db: DBType) {
  return {
    findAllByUser: db.query.apiKey
      .findMany({
        where: eq(apiKey.userId, sql.placeholder('userId')),
      })
      .prepare(),
    findById: db.query.apiKey
      .findFirst({
        where: eq(apiKey.id, sql.placeholder('id')),
      })
      .prepare(),
    findByKeyHash: db.query.apiKey
      .findFirst({
        where: eq(apiKey.keyHash, sql.placeholder('keyHash')),
      })
      .prepare(),
    delete: db
      .delete(apiKey)
      .where(eq(apiKey.id, sql.placeholder('id')))
      .prepare(),
    updateLastUsed: db
      .update(apiKey)
      .set({
        lastUsedAt: sql.placeholder('lastUsedAt') as never as string,
      })
      .where(eq(apiKey.id, sql.placeholder('id')))
      .prepare(),
  };
}

export class ApiKeyService {
  #db: DBType;
  #statements: ReturnType<typeof createPreparedStatement>;

  constructor(db: DBType) {
    this.#db = db;
    this.#statements = createPreparedStatement(db);
  }

  /**
   * Generate a secure random API key
   * Format: wge_<32 random hex chars>
   */
  private generateKey(): string {
    const randomHex = randomBytes(32).toString('hex');
    return `wge_${randomHex}`;
  }

  /**
   * Create a new API key for a user
   * @returns The plain text API key (only shown once) and the key record
   */
  async create(
    userId: ID,
    name: string,
    expiresAt?: string
  ): Promise<{ key: string; record: typeof apiKey.$inferSelect }> {
    const plainKey = this.generateKey();
    const keyHash = hashApiKey(plainKey);

    const result = await this.#db
      .insert(apiKey)
      .values({
        userId,
        name,
        keyHash,
        expiresAt: expiresAt ?? null,
        lastUsedAt: null,
      })
      .returning()
      .execute();

    if (!result[0]) {
      throw new Error('Failed to create API key');
    }

    return {
      key: plainKey,
      record: result[0],
    };
  }

  /**
   * Get all API keys for a user
   */
  async getAllByUser(userId: ID) {
    return this.#statements.findAllByUser.execute({ userId });
  }

  /**
   * Get a single API key by ID
   */
  async get(id: ID) {
    return this.#statements.findById.execute({ id });
  }

  /**
   * Validate an API key and return the associated key record
   */
  async validate(plainKey: string) {
    // Check format
    if (!plainKey.startsWith('wge_')) {
      return null;
    }

    // Hash the key and look it up
    const keyHash = hashApiKey(plainKey);
    const key = await this.#statements.findByKeyHash.execute({ keyHash });

    if (!key) {
      return null;
    }

    // Check if key is expired
    if (key.expiresAt) {
      const expiresAt = new Date(key.expiresAt);
      if (expiresAt < new Date()) {
        return null;
      }
    }

    // Update last used timestamp
    const now = new Date().toISOString();
    await this.#statements.updateLastUsed.execute({
      id: key.id,
      lastUsedAt: now,
    });

    return key;
  }

  /**
   * Revoke (delete) an API key
   */
  async revoke(id: ID) {
    return this.#statements.delete.execute({ id });
  }

  /**
   * Revoke an API key if it belongs to the specified user
   */
  async revokeByUser(id: ID, userId: ID) {
    const key = await this.get(id);
    if (!key || key.userId !== userId) {
      throw new Error('API key not found or does not belong to user');
    }
    return this.revoke(id);
  }
}
