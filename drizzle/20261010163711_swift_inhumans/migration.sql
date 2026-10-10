CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"googleSub" varchar(255) NOT NULL UNIQUE,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"accessTokenExpiresAt" integer NOT NULL,
	"selectedSpreadsheetId" varchar(255)
);
