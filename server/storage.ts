import { extensions, categories, type Extension, type InsertExtension, type Category, type InsertCategory } from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getExtensions(): Promise<Extension[]>;
  getExtensionsByCategory(categoryId: number): Promise<Extension[]>;
  searchExtensions(query: string): Promise<Extension[]>;
  getCategories(): Promise<Category[]>;
  createExtension(extension: InsertExtension): Promise<Extension>;
  createCategory(category: InsertCategory): Promise<Category>;
}

export class DatabaseStorage implements IStorage {
  async getExtensions(): Promise<Extension[]> {
    return await db.select().from(extensions);
  }

  async getExtensionsByCategory(categoryId: number): Promise<Extension[]> {
    return await db.select()
      .from(extensions)
      .where(eq(extensions.categoryId, categoryId));
  }

  async searchExtensions(query: string): Promise<Extension[]> {
    const searchQuery = query.toLowerCase();
    const results = await db.select().from(extensions);
    return results.filter(ext => 
      ext.name.toLowerCase().includes(searchQuery) || 
      ext.description.toLowerCase().includes(searchQuery)
    );
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createExtension(extension: InsertExtension): Promise<Extension> {
    const [newExtension] = await db.insert(extensions)
      .values(extension)
      .returning();
    return newExtension;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }
}

export const storage = new DatabaseStorage();
