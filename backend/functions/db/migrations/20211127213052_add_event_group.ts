import * as Knex from "knex";

export async function up(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.createTable("eventGroup", function (table) {
      table.string("id").notNullable().primary();
      table.string("event_class").notNullable();
      table.string("avatar").nullable();
      table.string("name").notNullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),

    knex.schema.alterTable("event", function (t) {
      t.string("event_group").defaultTo("00000000").notNullable();
    }),

    knex.schema.alterTable("event", function (t) {
      t.string("event_group").notNullable().alter();
    }),
  ]);
}

export async function down(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.dropTable("eventGroup"),
    knex.schema.alterTable("event", function (t) {
      t.dropColumn("event_group");
    }),
  ]);
}
