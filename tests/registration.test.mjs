import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the production modules with mocked React/Supabase; no database calls.
function loadModule(path, dependencies) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console: { info() {}, error() {}, warn() {} },
  });
  return exports;
}

const react = { useState: (value) => [value, () => {}], useEffect() {}, useCallback: (fn) => fn };
const consent = {
  privacyAndData: true,
  terms: true,
  medical: true,
  documentVersion: "2026-10-07",
  acceptedAt: "2026-10-07T00:00:00.000Z",
};
const legal = {
  LEGAL_DOCUMENT_VERSION: "2026-10-07",
  allRequiredConsentsAccepted(value) {
    return Boolean(
      value?.privacyAndData &&
      value?.terms &&
      value?.medical &&
      value?.documentVersion === "2026-10-07",
    );
  },
  legalConsentMetadata(value) {
    return {
      privacy_policy_accepted: value.privacyAndData,
      personal_data_accepted: value.privacyAndData,
      user_agreement_accepted: value.terms,
      medical_disclaimer_accepted: value.medical,
      legal_document_version: value.documentVersion,
      legal_accepted_at: value.acceptedAt,
    };
  },
  readRegistrationConsents() {
    return null;
  },
};
// Add a browser origin to the VM without exposing application credentials.
const originalLoad = loadModule;
function browserAuth(response) {
  let calls = 0;
  let request;
  const exports = {};
  const code = ts.transpileModule(
    readFileSync(new URL("../src/lib/auth.ts", import.meta.url), "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    window: { location: { origin: "https://example.test" } },
    require: (name) => {
      if (name === "react") return react;
      if (name === "@/lib/legal") return legal;
      return {
        supabase: {
          auth: {
            async signUp(input) {
              request = input;
              return response;
            },
            async signInWithPassword() {
              calls++;
              throw new Error("Unexpected login");
            },
          },
        },
      };
    },
    console: { info() {}, error() {}, warn() {} },
  });
  return { signUp: exports.useAuth().signUp, calls: () => calls, request: () => request };
}

const user = {
  id: "user-a",
  email: "a@example.test",
  identities: [{}],
  user_metadata: { name: "Анна" },
};
for (const [name, session, confirmation] of [
  ["email confirmation required", null, true],
  ["immediate session", { user }, false],
]) {
  test(name, async () => {
    const scenario = browserAuth({ data: { user, session }, error: null });
    const result = await scenario.signUp(" A@example.test ", "password", "Анна", consent);
    assert.equal(result.ok, true);
    assert.equal(result.requiresEmailConfirmation, confirmation);
    assert.equal(scenario.calls(), 0);
    assert.equal(scenario.request().email, "a@example.test");
    assert.deepEqual(Object.keys(scenario.request().options.data), [
      "name",
      "privacy_policy_accepted",
      "personal_data_accepted",
      "user_agreement_accepted",
      "medical_disclaimer_accepted",
      "legal_document_version",
      "legal_accepted_at",
    ]);
  });
}
test("existing account and signup failure are not reported as confirmation success", async () => {
  for (const response of [
    { data: { user: { ...user, identities: [] }, session: null }, error: null },
    { data: { user: null, session: null }, error: { message: "Auth unavailable" } },
    { data: { user: null, session: null }, error: null },
  ]) {
    const scenario = browserAuth(response);
    assert.equal((await scenario.signUp(user.email, "password", undefined, consent)).ok, false);
    assert.equal(scenario.calls(), 0);
  }
});

function registrationClient(profile, consents, failure = null) {
  const filters = [];
  return {
    filters,
    from(table) {
      const result = { data: table === "profiles" ? profile : consents, error: failure };
      const query = {
        select() {
          return query;
        },
        eq(key, value) {
          filters.push([table, key, value]);
          return query;
        },
        maybeSingle() {
          return Promise.resolve(result);
        },
        limit() {
          return Promise.resolve(result);
        },
      };
      return query;
    },
  };
}
const { loadRegistrationState } = loadModule("../src/lib/registration.ts", {
  "@/lib/legal": legal,
});
test("first login requires both filled profile and accepted consents", async () => {
  for (const [profile, consents, complete] of [
    [null, [], false],
    [{ height: null, current_weight: null }, [], false],
    [{ height: 170, current_weight: 70 }, [], false],
    [{ height: 170, current_weight: 70 }, [{ id: "consent" }], true],
  ]) {
    const client = registrationClient(profile, consents);
    assert.equal((await loadRegistrationState(client, user.id)).complete, complete);
    assert.equal(
      client.filters.filter(([, key, value]) => key === "user_id" && value === user.id).length,
      2,
    );
    assert.equal(
      client.filters.filter(([, key, value]) => key.endsWith("_accepted") && value === true).length,
      4,
    );
  }
});
test("database errors do not unlock the app", async () => {
  await assert.rejects(
    loadRegistrationState(registrationClient(null, [], { message: "Permission denied" }), user.id),
    /Permission denied/,
  );
});

function completionScenario({
  accepted = true,
  profileOk = true,
  consentError = null,
  sessionId = user.id,
} = {}) {
  let stateIndex = 0;
  const updates = [];
  const operations = [];
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: {
      useState(value) {
        const index = stateIndex++;
        return [index >= 6 && index <= 8 ? accepted : value, (next) => updates.push([index, next])];
      },
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@tanstack/react-router": { Link: "Link" },
    "@/lib/store": {
      DEFAULT_PROFILE: {},
      async ensureCurrentUserProfile(profile) {
        operations.push(["profile", profile]);
        return { ok: profileOk, error: "Profile failed" };
      },
    },
    "@/integrations/supabase/client": {
      supabase: {
        auth: {
          async getUser() {
            return { data: { user: { id: sessionId } }, error: null };
          },
        },
        from(table) {
          return {
            async insert(row) {
              operations.push([table, row]);
              return { error: consentError };
            },
          };
        },
      },
    },
    "@/lib/legal": legal,
  };
  for (const [file, names] of Object.entries({
    button: ["Button"],
    input: ["Input"],
    label: ["Label"],
    card: ["Card"],
    checkbox: ["Checkbox"],
    select: ["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"],
    alert: ["Alert", "AlertDescription", "AlertTitle"],
  })) {
    mocks[`@/components/ui/${file}`] = Object.fromEntries(names.map((name) => [name, name]));
  }
  const { RegistrationCompletion } = originalLoad(
    "../src/components/RegistrationCompletion.tsx",
    mocks,
  );
  const tree = RegistrationCompletion({
    userId: user.id,
    initialName: "Анна",
    initialProfile: null,
    onComplete: () => operations.push(["complete"]),
  });
  function findForm(node) {
    if (!node || typeof node !== "object") return null;
    if (node.type === "form") return node;
    for (const child of [node.props?.children].flat()) {
      const result = findForm(child);
      if (result) return result;
    }
    return null;
  }
  return {
    submit: () => findForm(tree).props.onSubmit({ preventDefault() {} }),
    operations,
    updates,
  };
}
test("completion saves profile then consents before unlocking", async () => {
  const scenario = completionScenario();
  await scenario.submit();
  assert.deepEqual(
    scenario.operations.map(([name]) => name),
    ["profile", "legal_consents", "complete"],
  );
  assert.equal(scenario.operations[1][1].user_id, user.id);
});
test("missing consent or changed session prevents writes", async () => {
  for (const options of [{ accepted: false }, { sessionId: "user-b" }]) {
    const scenario = completionScenario(options);
    await scenario.submit();
    assert.deepEqual(scenario.operations, []);
  }
});
test("save failures keep completion locked and surface an error", async () => {
  for (const options of [{ profileOk: false }, { consentError: { message: "Consent failed" } }]) {
    const scenario = completionScenario(options);
    await scenario.submit();
    assert.ok(!scenario.operations.some(([name]) => name === "complete"));
    assert.ok(scenario.updates.some(([index, value]) => index === 9 && typeof value === "string"));
  }
});
