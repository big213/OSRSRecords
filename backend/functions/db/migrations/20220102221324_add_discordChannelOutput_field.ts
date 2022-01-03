import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("discordChannelOutput", function (t) {
    t.boolean("use_current_event_era").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("discordChannelOutput", function (t) {
    t.dropColumn("use_current_event_era");
  });
}
