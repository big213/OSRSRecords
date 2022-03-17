import * as Knex from "knex";

export async function up(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.createTable("externalLinkBackup", function (table) {
      table.string("id").notNullable().primary();
      table.string("url").notNullable().unique();
      table.string("file").notNullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.alterTable("submission", function (t) {
      t.jsonb("external_link_backups").notNullable().defaultTo([]);
    }),
  ]);
}

export async function down(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.dropTable("externalLinkBackup"),
    knex.schema.alterTable("submission", function (t) {
      t.dropColumn("external_link_backups");
    }),
  ]);
}
