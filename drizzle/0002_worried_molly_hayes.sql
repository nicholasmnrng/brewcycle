ALTER TABLE "pickup_requests" ADD COLUMN "pickup_address" text;--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD COLUMN "pickup_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD COLUMN "pickup_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD COLUMN "contact_name" varchar(160);--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD COLUMN "contact_phone" varchar(32);--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD COLUMN "pickup_notes" text;