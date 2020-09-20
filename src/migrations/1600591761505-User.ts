import { MigrationInterface, QueryRunner } from "typeorm";

import {
  HANDLE_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  ENCRYPTED_PASSWORD_MAX_LENGTH
} from "../entities/User";

export class User1600591761505 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        handle VARCHAR(${HANDLE_MAX_LENGTH}),
        display_name VARCHAR(${DISPLAY_NAME_MAX_LENGTH}),
        email VARCHAR(${EMAIL_MAX_LENGTH}),
        password VARCHAR(${ENCRYPTED_PASSWORD_MAX_LENGTH})
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "user";
    `);
  }
}
