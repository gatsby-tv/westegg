import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAndChannel1600662026276 implements MigrationInterface {
  name = "AddUserAndChannel1600662026276";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "handle" character varying(16) NOT NULL, "display_name" character varying(64) NOT NULL, "email" character varying(64) NOT NULL, "password" character varying(256) NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "channel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "handle" character varying(16) NOT NULL, "display_name" character varying(64) NOT NULL, "owner" uuid, CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD CONSTRAINT "FK_43b026a9ae31a105029f4a12580" FOREIGN KEY ("owner") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "channel" DROP CONSTRAINT "FK_43b026a9ae31a105029f4a12580"`
    );
    await queryRunner.query(`DROP TABLE "channel"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
