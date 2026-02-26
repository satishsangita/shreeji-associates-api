CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`assignedTo` int NOT NULL,
	`assignedBy` int NOT NULL,
	`dueDate` varchar(20),
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mortgage_deeds` ADD `entryBy` varchar(255);--> statement-breakpoint
ALTER TABLE `mortgage_deeds` ADD `registrationDoneBy` varchar(255);--> statement-breakpoint
ALTER TABLE `mortgage_deeds` ADD `receivedAtOfficeBy` varchar(255);--> statement-breakpoint
ALTER TABLE `mortgage_deeds` ADD `onlineCheckedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `mortgage_deeds` ADD `handOverToName` varchar(255);--> statement-breakpoint
ALTER TABLE `mortgage_deeds` ADD `handOverToNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `mortgage_deeds` ADD `advocateFees` varchar(100);--> statement-breakpoint
ALTER TABLE `mortgage_deeds` ADD `bankReferenceNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `sale_deeds` ADD `purchaserMobile` varchar(20);--> statement-breakpoint
ALTER TABLE `sale_deeds` ADD `entryBy` varchar(255);--> statement-breakpoint
ALTER TABLE `sale_deeds` ADD `checkedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `sale_deeds` ADD `registrationDoneBy` varchar(255);--> statement-breakpoint
ALTER TABLE `sale_deeds` ADD `advocateFees` varchar(100);--> statement-breakpoint
ALTER TABLE `sale_deeds` ADD `officeReceivedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `sale_deeds` ADD `handOverToName` varchar(255);--> statement-breakpoint
ALTER TABLE `sale_deeds` ADD `handOverToNumber` varchar(20);