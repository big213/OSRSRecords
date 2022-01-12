import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("eventEra", function (t) {
    t.boolean("is_buff").nullable();
    t.boolean("is_relevant").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("eventEra", function (t) {
    t.dropColumn("is_buff");
    t.dropColumn("is_relevant");
  });
}
