import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("eventClass", function (t) {
    // need to default to false to prevent entry problems
    t.boolean("is_sub_event").defaultTo(false).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("eventClass", function (t) {
    t.dropColumn("is_sub_event");
  });
}
