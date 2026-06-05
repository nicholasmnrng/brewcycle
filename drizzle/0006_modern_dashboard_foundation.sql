CREATE TYPE "promo_status" AS ENUM('ACTIVE', 'SCHEDULED', 'EXPIRED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM('SUCCESS', 'ERROR', 'WARNING', 'INFO', 'LOADING', 'CONFIRMATION');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"title" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"discount_type" varchar(32) DEFAULT 'PERCENT' NOT NULL,
	"discount_value" numeric(10, 2) DEFAULT '0' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"status" "promo_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"role" "user_role",
	"type" "notification_type" DEFAULT 'INFO' NOT NULL,
	"title" varchar(180) NOT NULL,
	"message" text,
	"module" varchar(80),
	"entity_id" varchar(120),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_name" varchar(160),
	"actor_role" "user_role",
	"action" varchar(120) NOT NULL,
	"module" varchar(80) NOT NULL,
	"entity_id" varchar(120),
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gamification_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"label" varchar(160) NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "promos" ADD CONSTRAINT "promos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promos_product_id_idx" ON "promos" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promos_status_idx" ON "promos" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_role_idx" ON "notifications" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_module_idx" ON "audit_logs" USING btree ("module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gamification_config_key_unique" ON "gamification_config" USING btree ("key");
