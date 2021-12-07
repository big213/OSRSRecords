import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.string("discord_message_id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.dropColumn("discord_message_id");
  });
}
