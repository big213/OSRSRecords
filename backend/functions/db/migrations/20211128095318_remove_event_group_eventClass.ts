import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("eventGroup", function (t) {
    t.dropColumn("event_class");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("eventGroup", function (t) {
    t.string("event_class").notNullable();
  });
}
