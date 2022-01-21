import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("discordChannelOutput", function (t) {
    t.integer("lines_limit").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("discordChannelOutput", function (t) {
    t.dropColumn("lines_limit");
  });
}
