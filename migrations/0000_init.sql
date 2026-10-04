CREATE TABLE `checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`email` text NOT NULL,
	`result` text NOT NULL
);
