import * as Knex from "knex";

export async function up(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.alterTable("submission", function (t) {
      t.boolean("is_solo_personal_best").notNullable().defaultTo(false);
    }),
    knex.schema.alterTable("discordChannelOutput", function (t) {
      t.boolean("is_solo_personal_best").nullable();
    }),
  ]);
}

export async function down(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.alterTable("submission", function (t) {
      t.dropColumn("is_solo_personal_best");
    }),
    knex.schema.alterTable("discordChannelOutput", function (t) {
      t.dropColumn("is_solo_personal_best");
    }),
  ]);
}
