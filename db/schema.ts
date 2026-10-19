import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const walletAccounts=sqliteTable('wallet_accounts',{
  userId:text('user_id').primaryKey(),
  snapshot:text('snapshot').notNull(),
  revision:integer('revision').notNull().default(1),
  createdAt:text('created_at').notNull(),
  updatedAt:text('updated_at').notNull(),
});
