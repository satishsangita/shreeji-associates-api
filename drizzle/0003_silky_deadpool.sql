CREATE TABLE `app_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `daily_mis_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportDate` varchar(20) NOT NULL,
	`tasksCompleted` text NOT NULL,
	`hoursWorked` varchar(10) NOT NULL,
	`titleReportsDone` int DEFAULT 0,
	`mortgageDeedsDone` int DEFAULT 0,
	`saleDeedsDone` int DEFAULT 0,
	`courtVisits` int DEFAULT 0,
	`clientMeetings` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_mis_reports_id` PRIMARY KEY(`id`)
);
