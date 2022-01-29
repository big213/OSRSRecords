import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.text("reviewer_comments").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("submission", function (t) {
    t.dropColumn("reviewer_comments");
  });
}
