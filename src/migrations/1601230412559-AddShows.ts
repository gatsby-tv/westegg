import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShows1601230412559 implements MigrationInterface {
  name = "AddShows1601230412559";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "episode" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(128) NOT NULL, "description" character varying(2048) NOT NULL, "views" numeric NOT NULL, "date_uploaded" TIMESTAMP NOT NULL DEFAULT now(), "hash" character varying(46) NOT NULL, "thumbnailHash" character varying(46) NOT NULL, "index" numeric NOT NULL, "uploadable" uuid, "season" uuid, CONSTRAINT "PK_7258b95d6d2bf7f621845a0e143" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "season" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "index" numeric NOT NULL, "show" uuid, CONSTRAINT "PK_8ac0d081dbdb7ab02d166bcda9f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "show" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(64) NOT NULL, "channel" uuid, CONSTRAINT "PK_e9993c2777c1d0907e845fce4d1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "episode" ADD CONSTRAINT "FK_572c0fc1dccd8d132750fc2f7c1" FOREIGN KEY ("uploadable") REFERENCES "uploadable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "episode" ADD CONSTRAINT "FK_8a0907bb1355574b2c93c6ad6f8" FOREIGN KEY ("season") REFERENCES "season"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "season" ADD CONSTRAINT "FK_81939a7876a6d58c2446b406951" FOREIGN KEY ("show") REFERENCES "show"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "show" ADD CONSTRAINT "FK_a1252c1fca0c5903bec32b40ca9" FOREIGN KEY ("channel") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "show" DROP CONSTRAINT "FK_a1252c1fca0c5903bec32b40ca9"`
    );
    await queryRunner.query(
      `ALTER TABLE "season" DROP CONSTRAINT "FK_81939a7876a6d58c2446b406951"`
    );
    await queryRunner.query(
      `ALTER TABLE "episode" DROP CONSTRAINT "FK_8a0907bb1355574b2c93c6ad6f8"`
    );
    await queryRunner.query(
      `ALTER TABLE "episode" DROP CONSTRAINT "FK_572c0fc1dccd8d132750fc2f7c1"`
    );
    await queryRunner.query(`DROP TABLE "show"`);
    await queryRunner.query(`DROP TABLE "season"`);
    await queryRunner.query(`DROP TABLE "episode"`);
  }
}
