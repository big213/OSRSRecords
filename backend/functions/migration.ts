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
    knex.schema.createTable("eventClass", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.string("avatar").nullable();
      table.text("description").nullable();
      table.string("parent").nullable();
      table.string("background_image").nullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable("eventGroup", function (table) {
      table.string("id").notNullable().primary();
      table.string("avatar").nullable();
      table.string("name").notNullable();
      table.json("contents").notNullable().defaultTo([]);
      table.integer("sort").notNullable();
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
      table.string("avatar_override").nullable();
      table.string("background_image_override").nullable();
      table.string("name").notNullable();
      table.text("description").nullable();
      table.integer("difficulty").notNullable().defaultTo(2);
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
      table.unique(["event_class", "difficulty"]);
    }),
    knex.schema.createTable("submission", function (table) {
      table.string("id").notNullable().primary();
      table.string("event").notNullable();
      table.string("event_era").notNullable();
      table.integer("participants").notNullable().defaultTo(0);
      table.json("participants_list").notNullable().defaultTo([]);
      table.integer("score").notNullable();
      table.integer("time_elapsed").notNullable();
      table.dateTime("happened_on").notNullable();
      table.integer("status").notNullable().defaultTo(1);
      table.integer("world").nullable();
      table.json("files").notNullable().defaultTo([]);
      table.json("external_links").notNullable().defaultTo([]);
      table.text("private_comments").nullable();
      table.text("public_comments").nullable();
      table.string("discord_message_id").nullable();
      table.string("evidence_key").nullable();
      table.boolean("is_record").notNullable().defaultTo(false);
      table.boolean("is_solo_personal_best").notNullable().defaultTo(false);
      table.boolean("is_recording_verified").notNullable().defaultTo(false);
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").nullable();
      table.string("submitted_by").nullable();
      table.string("discord_id").nullable();
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
    knex.schema.createTable("discordChannel", function (table) {
      table.string("id").notNullable().primary();
      table.string("name").notNullable();
      table.string("channel_id").notNullable();
      table.string("primary_message_id").nullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable("discordChannelOutput", function (table) {
      table.string("id").notNullable().primary();
      table.string("discord_channel").notNullable();
      table.string("event").notNullable();
      table.integer("participants").nullable();
      table.string("event_era").nullable();
      table.integer("event_era_mode").notNullable().defaultTo(1);
      table.integer("ranks_to_show").notNullable().defaultTo(1);
      table.boolean("is_solo_personal_best").nullable();
      table.integer("sort").notNullable();
      table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
      table.dateTime("updated_at").nullable();
      table.string("created_by").notNullable();
    }),
    knex.schema.createTable("eventEra", function (table) {
      table.string("id").notNullable().primary();
      table.string("event").notNullable();
      table.string("name").notNullable();
      table.string("avatar").nullable();
      table.text("description").nullable();
      table.dateTime("begin_date").notNullable();
      table.dateTime("end_date").nullable();
      table.boolean("is_buff").nullable();
      table.boolean("is_relevant").notNullable().defaultTo(false);
      table.boolean("is_current").notNullable().defaultTo(false);
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
        table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
        table.dateTime("updated_at").nullable();
        table.string("created_by").nullable();
        table.string("title").nullable();
        table.unique(["submission", "character"]);
      }
    ),
  ]);
}

export async function down(knex: Knex): Promise<void[]> {
  return Promise.all([
    knex.schema.dropTable("user"),
    knex.schema.dropTable("apiKey"),
    knex.schema.dropTable("eventClass"),
    knex.schema.dropTable("eventGroup"),
    knex.schema.dropTable("event"),
    knex.schema.dropTable("submission"),
    knex.schema.dropTable("character"),
    knex.schema.dropTable("file"),
    knex.schema.dropTable("discordChannel"),
    knex.schema.dropTable("discordChannelOutput"),
    knex.schema.dropTable("eventEra"),
    knex.schema.dropTable("submissionCharacterParticipantLink"),
  ]);
}
