import { extensions, categories, type Extension, type InsertExtension, type Category, type InsertCategory } from "../shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
    getExtensions(): Promise<Extension[]>;
    getExtensionsWithPagination(page: number, limit: number): Promise<Extension[]>;
    getExtensionsByCategory(categoryId: number): Promise<Extension[]>;
    getExtensionsByCategoryWithPagination(categoryId: number, page: number, limit: number): Promise<Extension[]>;
    searchExtensions(query: string): Promise<Extension[]>;
    getCategories(): Promise<Category[]>;
    createExtension(extension: InsertExtension): Promise<Extension>;
    createCategory(category: InsertCategory): Promise<Category>;
    getExtensionById(id: number): Promise<Extension | undefined>;
}

export class DatabaseStorage implements IStorage {
    async getExtensions(): Promise<Extension[]> {
        return await db.select().from(extensions);
    }

    async getExtensionsWithPagination(page: number, limit: number): Promise<Extension[]> {
        const offset = page * limit;
        return await db.select()
            .from(extensions)
            .limit(limit)
            .offset(offset)
            .orderBy(sql`${extensions.id} ASC`);
    }

    async getExtensionsByCategory(categoryId: number): Promise<Extension[]> {
        return await db.select()
            .from(extensions)
            .where(eq(extensions.categoryId, categoryId));
    }

    async getExtensionsByCategoryWithPagination(categoryId: number, page: number, limit: number): Promise<Extension[]> {
        const offset = page * limit;
        return await db.select()
            .from(extensions)
            .where(eq(extensions.categoryId, categoryId))
            .limit(limit)
            .offset(offset)
            .orderBy(sql`${extensions.id} ASC`);
    }

    async searchExtensions(query: string): Promise<Extension[]> {
        const searchQuery = query.toLowerCase();
        // Using a more efficient search query with ILIKE
        return await db.select()
            .from(extensions)
            .where(sql`LOWER(${extensions.name}) LIKE ${`%${searchQuery}%`} 
                   OR LOWER(${extensions.description}) LIKE ${`%${searchQuery}%`}`)
            .limit(50); // Limit search results for better performance
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

    async getExtensionById(id: number): Promise<Extension | undefined> {
        const [extension] = await db.select()
            .from(extensions)
            .where(eq(extensions.id, id));
        return extension;
    }
}

export const storage = new DatabaseStorage();