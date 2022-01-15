import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.string("evidence_key").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.dropColumn("evidence_key");
  });
}
