import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTables1742395919400 implements MigrationInterface {
  name = 'RenameTables1742395919400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`,
    );
    await queryRunner.renameTable('user', 'users');
    await queryRunner.renameTable('refresh_token', 'refreshTokens');
    await queryRunner.query(
      `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_7008a2b0fb083127f60b5f4448e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refreshTokens" DROP CONSTRAINT "FK_7008a2b0fb083127f60b5f4448e"`,
    );
    await queryRunner.renameTable('users', 'user');
    await queryRunner.renameTable('refreshTokens', 'refresh_token');
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
