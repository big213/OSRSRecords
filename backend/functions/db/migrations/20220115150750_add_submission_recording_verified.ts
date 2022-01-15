import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.boolean("is_recording_verified").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.dropColumn("is_recording_verified");
  });
}
