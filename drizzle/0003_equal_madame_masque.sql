ALTER TABLE "orders" ADD COLUMN "shipping_recipient" varchar(160);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_phone" varchar(32);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address" text;