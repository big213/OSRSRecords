import * as Knex from "knex";

export async function up(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.createTable("discordChannel", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.string("channel_id").notNullable();
      table.string("primary_message_id").nullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable("discordChannelOutput", function (table) {
      table.string("id").notNullable().primary();
      table.string("discord_channel").notNullable();
      table.string("event").notNullable();
      table.integer("participants").nullable();
      table.string("era").nullable();
      table.integer("ranks_to_show").notNullable().defaultTo(1);
      table.integer("sort").notNullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
  ]);
}

export async function down(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.dropTable("discordChannel"),
    knex.schema.dropTable("discordChannelOutput"),
  ]);
}
