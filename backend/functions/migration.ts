import * as Knex from "knex";

export async function up(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.createTable("user", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.string("firebase_uid").notNullable().unique();
      table.string("email").notNullable().unique();
      table.string("avatar").nullable();
      table.integer("role").notNullable().defaultTo(2);
      table.json("permissions").nullable();
      table.boolean("is_public").notNullable().defaultTo(true);
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable("apiKey", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.string("code").notNullable().unique();
      table.string("user").notNullable();
      table.json("permissions").nullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable("era", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.string("avatar").nullable();
      table.text("description").nullable();
      table.dateTime("begin_date").notNullable();
      table.dateTime("end_date").nullable();
      table.boolean("is_current").notNullable().defaultTo(false);
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable("eventClass", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.string("avatar").nullable();
      table.text("description").nullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable("event", function (table) {
      table.string("id").notNullable().primary();
      table.string("event_class").notNullable();
      table.integer("min_participants").nullable();
      table.integer("max_participants").nullable();
      table.dateTime("release_date").notNullable();
      table.string("avatar").nullable();
      table.string("name").notNullable();
      table.text("description").nullable();
      table.boolean("is_hard_mode").notNullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
      table.unique(["event_class", "is_hard_mode"]);
    }),
    knex.schema.createTable("submission", function (table) {
      table.string("id").notNullable().primary();
      table.string("event").notNullable();
      table.string("era").notNullable();
      table.integer("participants").notNullable().defaultTo(0);
      table.integer("score").notNullable();
      table.integer("time_elapsed").notNullable();
      table.dateTime("happened_on").notNullable();
      table.integer("status").notNullable().defaultTo(1);
      table.integer("world").nullable();
      table.json("files").notNullable().defaultTo([]);
      table.json("external_links").notNullable().defaultTo([]);
      table.text("private_comments").nullable();
      table.text("public_comments").nullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").nullable();
      table.string("submitted_by").notNullable();
    }),
    knex.schema.createTable("character", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.string("standardized_name").notNullable().unique();
      table.string("avatar").nullable();
      table.text("description").nullable();
      table.string("owned_by").nullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").nullable();
    }),
    knex.schema.createTable("file", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.integer("size").notNullable();
      table.string("location").notNullable();
      table.string("content_type").notNullable();
      table.string("parent_key").nullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable(
      "submissionCharacterParticipantLink",
      function (table) {
        table.string("id").notNullable().primary();
        table.string("submission").notNullable();
        table.string("character").notNullable();
        table.string("title").nullable();
        table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
        table.dateTime("updated_at").nullable();
        table.string("created_by").notNullable();
        table.unique(["submission", "character"]);
      }
    ),
  ]);
}

export async function down(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.dropTable("user"),
    knex.schema.dropTable("apiKey"),
    knex.schema.dropTable("era"),
    knex.schema.dropTable("eventClass"),
    knex.schema.dropTable("event"),
    knex.schema.dropTable("submission"),
    knex.schema.dropTable("character"),
    knex.schema.dropTable("file"),
    knex.schema.dropTable("submissionCharacterParticipantLink"),
  ]);
}
