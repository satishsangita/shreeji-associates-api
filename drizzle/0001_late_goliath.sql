CREATE TABLE `mortgage_deeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partyName` varchar(255) NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`loanAmount` varchar(100) NOT NULL,
	`partyMobile` varchar(20) NOT NULL,
	`propertyDetails` text NOT NULL,
	`paymentDetails` text,
	`appointmentDate` varchar(50),
	`mortgageDeedNumber` varchar(100),
	`subRegistrarOffice` varchar(255),
	`mortgagePaymentScreenshot` text,
	`mortgageReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mortgage_deeds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sale_deeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerName` varchar(255) NOT NULL,
	`purchaserName` varchar(255) NOT NULL,
	`propertyDetails` text NOT NULL,
	`sroOffice` varchar(255),
	`saleDeedNumber` varchar(100),
	`saleDeedPayment` varchar(100),
	`saleDeedPaymentReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sale_deeds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `title_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`srNo` varchar(50) NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`partyName` varchar(255) NOT NULL,
	`loanNumber` varchar(100) NOT NULL,
	`propertyDetails` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `title_reports_id` PRIMARY KEY(`id`)
);
