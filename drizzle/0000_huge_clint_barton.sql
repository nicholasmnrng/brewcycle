CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PACKED', 'SHIPPED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."pickup_status" AS ENUM('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'WAITING_OTP', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('EARNED_PICKUP', 'EARNED_PURCHASE', 'EARNED_REFERRAL', 'REDEEMED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'CAFE', 'DRIVER', 'BUYER');--> statement-breakpoint
CREATE TABLE "environmental_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"value" numeric(12, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"payment_proof_url" text,
	"shipping_resi" varchar(120),
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"driver_id" uuid,
	"estimated_weight" numeric(10, 2) NOT NULL,
	"actual_weight" numeric(10, 2),
	"status" "pickup_status" DEFAULT 'PENDING' NOT NULL,
	"schedule_date" timestamp with time zone NOT NULL,
	"original_schedule_date" timestamp with time zone,
	"reschedule_reason" text,
	"reminder_h1_sent" boolean DEFAULT false NOT NULL,
	"reminder_h0_sent" boolean DEFAULT false NOT NULL,
	"proof_photo_url" text,
	"otp_code_hash" varchar(255),
	"otp_expires_at" timestamp with time zone,
	"otp_attempts" integer DEFAULT 0 NOT NULL,
	"zone" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_reschedule_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pickup_id" uuid NOT NULL,
	"old_date" timestamp with time zone NOT NULL,
	"new_date" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(80) NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"usage_guide" text,
	"price" numeric(12, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"unit" varchar(32) NOT NULL,
	"rating_avg" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"points_delta" integer NOT NULL,
	"type" "reward_type" NOT NULL,
	"description" text NOT NULL,
	"ref_id" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"points_required" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(32),
	"role" "user_role" NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"referral_code" varchar(32) NOT NULL,
	"referred_by_id" uuid,
	"referral_bonus_awarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_cafe_id_users_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_reschedule_log" ADD CONSTRAINT "pickup_reschedule_log_pickup_id_pickup_requests_id_fk" FOREIGN KEY ("pickup_id") REFERENCES "public"."pickup_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_id_users_id_fk" FOREIGN KEY ("referred_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "environmental_config_key_unique" ON "environmental_config" USING btree ("key");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_buyer_id_idx" ON "orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "pickup_requests_status_idx" ON "pickup_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pickup_requests_schedule_date_idx" ON "pickup_requests" USING btree ("schedule_date");--> statement-breakpoint
CREATE INDEX "pickup_requests_driver_id_idx" ON "pickup_requests" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "pickup_requests_cafe_id_idx" ON "pickup_requests" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "pickup_reschedule_log_pickup_id_idx" ON "pickup_reschedule_log" USING btree ("pickup_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_stock_idx" ON "products" USING btree ("stock");--> statement-breakpoint
CREATE INDEX "reviews_product_id_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_buyer_id_idx" ON "reviews" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "rewards_user_id_idx" ON "rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rewards_type_idx" ON "rewards" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_unique" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");