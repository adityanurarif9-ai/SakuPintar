CREATE TABLE `wallet_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`snapshot` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
