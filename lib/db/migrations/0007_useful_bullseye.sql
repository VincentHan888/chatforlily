CREATE TABLE IF NOT EXISTS "InviteCode" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	"usedAt" timestamp,
	"usedBy" uuid,
	"maxUses" varchar(10) DEFAULT '1' NOT NULL,
	"currentUses" varchar(10) DEFAULT '0' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdBy" varchar(64) DEFAULT 'system' NOT NULL,
	"description" text,
	CONSTRAINT "InviteCode_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "inviteCodeUsed" varchar(32);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "isVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_usedBy_User_id_fk" FOREIGN KEY ("usedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
