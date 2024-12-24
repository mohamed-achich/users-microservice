import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1703442900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "user_role_enum" AS ENUM ('USER', 'ADMIN');
            
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "roles" "user_role_enum" array NOT NULL DEFAULT '{USER}',
                "firstName" character varying,
                "lastName" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isActive" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_username" UNIQUE ("username"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            );

            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "users";
            DROP TYPE "user_role_enum";
        `);
    }
}
