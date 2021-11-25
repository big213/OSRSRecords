import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(
    "submissionCharacterParticipantLink",
    function (t) {
      t.string("created_by").nullable().alter();
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(
    "submissionCharacterParticipantLink",
    function (t) {
      t.string("created_by").notNullable().alter();
    }
  );
}
