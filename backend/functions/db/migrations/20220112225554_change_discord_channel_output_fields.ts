import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("discordChannelOutput", function (t) {
    t.integer("event_era_mode").notNullable().defaultTo(1);
    t.dropColumn("use_current_event_era");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("discordChannelOutput", function (t) {
    t.dropColumn("event_era_mode");
    t.boolean("use_current_event_era").notNullable();
  });
}
