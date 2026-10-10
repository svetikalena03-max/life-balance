import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const owner = "00000000-0000-4000-8000-000000000001";
const otherOwner = "00000000-0000-4000-8000-000000000002";
const member = "00000000-0000-4000-8000-000000000003";
const outsider = "00000000-0000-4000-8000-000000000004";

test("real PostgreSQL policies isolate health and enforce family invitations", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id UUID PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
        $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO anon, authenticated;
      GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
      CREATE TABLE public.profiles (user_id UUID PRIMARY KEY, name TEXT);
      INSERT INTO auth.users VALUES ('${owner}'), ('${otherOwner}'), ('${member}'), ('${outsider}');
      INSERT INTO public.profiles VALUES ('${member}', 'Test member');
    `);
    for (const filename of [
      "20261008140000_family_access.sql",
      "20261008150000_glucose_readings.sql",
      "20261010180000_pregnancy_diary.sql",
      "20261010190000_family_concurrency.sql",
    ]) {
      await db.exec(
        readFileSync(new URL(`../supabase/migrations/${filename}`, import.meta.url), "utf8"),
      );
    }
    async function asUser(user, query, params = []) {
      await db.exec("SET ROLE authenticated");
      try {
        await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [user]);
        return (await db.query(query, params)).rows;
      } finally {
        await db.exec("RESET ROLE");
      }
    }
    const [family] = await asUser(owner, "SELECT public.create_family() AS id");
    await asUser(otherOwner, "SELECT public.create_family()");
    const [invite] = await asUser(owner, "SELECT public.create_family_invite($1) AS code", [
      family.id,
    ]);
    await assert.rejects(
      asUser(outsider, "SELECT public.create_family_invite($1)", [family.id]),
      /Only the family owner/,
    );
    await assert.rejects(
      asUser(otherOwner, "SELECT public.accept_family_invite($1)", [invite.code]),
      /already in a family/,
    );
    await asUser(member, "SELECT public.accept_family_invite($1)", [invite.code]);
    await assert.rejects(
      asUser(outsider, "SELECT public.accept_family_invite($1)", [invite.code]),
      /invalid or expired/,
    );
    await assert.rejects(
      asUser(member, "SELECT public.create_family()"),
      /Leave your current family/,
    );
    assert.equal((await asUser(owner, "SELECT * FROM public.family_members")).length, 1);
    assert.equal((await asUser(outsider, "SELECT * FROM public.family_members")).length, 0);
    await assert.rejects(asUser(owner, "SELECT * FROM public.family_invites"), /permission denied/);
    await assert.rejects(
      asUser(outsider, "INSERT INTO public.family_members VALUES ($1, $2, 'fake', now())", [
        family.id,
        outsider,
      ]),
      /permission denied/,
    );

    for (const user of [owner, member]) {
      await asUser(
        user,
        "INSERT INTO public.glucose_readings (user_id, measured_at, value_mmol_l, context) VALUES ($1, now(), 5.5, 'fasting')",
        [user],
      );
      await asUser(
        user,
        "INSERT INTO public.pregnancy_settings (user_id, due_date) VALUES ($1, '2027-01-01')",
        [user],
      );
      await asUser(
        user,
        "INSERT INTO public.pregnancy_records (user_id, record_date, kind, note) VALUES ($1, '2026-10-10', 'daily', 'test')",
        [user],
      );
    }
    for (const table of ["glucose_readings", "pregnancy_settings", "pregnancy_records"]) {
      for (const user of [owner, member]) {
        const rows = await asUser(user, `SELECT * FROM public.${table}`);
        assert.equal(rows.length, 1, table);
        assert.equal(rows[0].user_id, user, table);
      }
      assert.equal((await asUser(outsider, `SELECT * FROM public.${table}`)).length, 0, table);
      assert.equal(
        (
          await asUser(member, `DELETE FROM public.${table} WHERE user_id = $1 RETURNING *`, [
            owner,
          ])
        ).length,
        0,
        table,
      );
    }
    await assert.rejects(
      asUser(
        member,
        "INSERT INTO public.pregnancy_settings (user_id, due_date) VALUES ($1, '2027-01-01')",
        [outsider],
      ),
      /row-level security/,
    );
    await assert.rejects(
      asUser(member, "UPDATE public.glucose_readings SET user_id = $1", [outsider]),
      /row-level security/,
    );
    await db.exec("SET ROLE anon");
    try {
      await assert.rejects(db.query("SELECT * FROM public.glucose_readings"), /permission denied/);
      await assert.rejects(db.query("SELECT public.create_family()"), /permission denied/);
    } finally {
      await db.exec("RESET ROLE");
    }

    for (let index = 0; index < 20; index++)
      await asUser(owner, "SELECT public.create_family_invite($1)", [family.id]);
    await assert.rejects(
      asUser(owner, "SELECT public.create_family_invite($1)", [family.id]),
      /Too many active/,
    );
    await asUser(owner, "DELETE FROM public.families WHERE id = $1", [family.id]);
    assert.equal((await asUser(member, "SELECT * FROM public.family_members")).length, 0);
    assert.equal((await asUser(member, "SELECT * FROM public.glucose_readings")).length, 1);
    await db.query("DELETE FROM auth.users WHERE id = $1", [owner]);
    for (const table of ["glucose_readings", "pregnancy_settings", "pregnancy_records"])
      assert.equal(
        (await db.query(`SELECT * FROM public.${table} WHERE user_id = $1`, [owner])).rows.length,
        0,
        table,
      );
  } finally {
    await db.close();
  }
});
