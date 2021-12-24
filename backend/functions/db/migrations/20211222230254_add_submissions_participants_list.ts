import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.json("participants_list").notNullable().defaultTo([]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.dropColumn("participants_list");
  });
}
