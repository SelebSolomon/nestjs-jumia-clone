import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.cacheManager.get<T>(key);
      if (data) {
        this.logger.debug(`Cache HIT: ${key}`);
        return data;
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error for ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      this.logger.error(`Cache SET error for ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for ${key}:`, error);
    }
  }

  // Simplified - just delete multiple keys manually
  async deleteMultiple(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.delete(key)));
      this.logger.debug(`Cache DELETE multiple: ${keys.length} keys`);
    } catch (error) {
      this.logger.error('Cache DELETE multiple error:', error);
    }
  }
}
