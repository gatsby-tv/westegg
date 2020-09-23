import { MigrationInterface, QueryRunner } from "typeorm";

export class UploadableVideo1600838999468 implements MigrationInterface {
  name = "UploadableVideo1600838999468";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "video" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(128) NOT NULL, "description" character varying(2048) NOT NULL, "views" numeric NOT NULL, "date_uploaded" TIMESTAMP NOT NULL DEFAULT now(), "hash" character varying(46) NOT NULL, "thumbnailHash" character varying(46) NOT NULL, "uploadable" uuid, CONSTRAINT "PK_1a2f3856250765d72e7e1636c8e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "uploadable" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), CONSTRAINT "PK_2d94d06e0b644b8c5b08f5ae226" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "video" ADD CONSTRAINT "FK_e2d311988002ca6b8603e6d1ae0" FOREIGN KEY ("uploadable") REFERENCES "uploadable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video" DROP CONSTRAINT "FK_e2d311988002ca6b8603e6d1ae0"`
    );
    await queryRunner.query(`DROP TABLE "uploadable"`);
    await queryRunner.query(`DROP TABLE "video"`);
  }
}
