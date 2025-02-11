import { pgTable, serial, text, varchar, timestamp, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const extensions = pgTable('extensions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  icon: varchar('icon', { length: 50 }).notNull(),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  users: varchar('users', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const extensionsRelations = relations(extensions, ({ one }) => ({
  category: one(categories, {
    fields: [extensions.categoryId],
    references: [categories.id],
  }),
}));

export type Extension = typeof extensions.$inferSelect;
export type InsertExtension = typeof extensions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
