import test from "node:test";
import assert from "node:assert/strict";
import Base from "../base.js";

/* Basic tests to verify core functionality. You can add more as needed. Send a PR to be included. */

test("validates fields, applies defaults, and runs hooks", () => {
  class User extends Base {
    static version = 1;
    static schema = {
      name: {
        type: String,
        min: 2,
        max: 100,
        optional: true,
        beforeChecks: (value) => typeof value === "string" ? value.trim() : value,
        afterChecks: (value) => value.replace(/\s+/g, " ")
      },
      status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
        beforeChecks: (value) => typeof value === "string" ? value.toLowerCase() : value
      },
      confirmed: { type: Boolean, optional: true, default: false },
      profile: {
        type: Object,
        default: {},
        keys: {
          role: { type: String, enum: ["admin", "editor"], default: "editor" }
        }
      },
      tags: {
        type: Array,
        default: [],
        values: {
          type: String,
          beforeChecks: (value) => typeof value === "string" ? value.trim() : value
        }
      }
    };
  }

  const user = new User({  name: "  John   Doe  ", status: "active" });

  assert.equal(user.name, "John Doe");
  assert.equal(user.status, "active");
  assert.equal(user.confirmed, false);
  assert.deepEqual(user.profile, { role: "editor" });
  assert.deepEqual(user.tags, []);
  assert.equal(user.version, 1);
  assert.deepEqual(user.toObject(), {
    name: "John Doe",
    status: "active",
    confirmed: false,
    profile: { role: "editor" },
    tags: [],
    version: 1
  });
});

test("update merges existing values and revalidates", () => {
  class User extends Base {
    static schema = {
      name: { type: String },
      role: { type: String, enum: ["admin", "editor"], default: "editor" },
      confirmed: { type: Boolean, optional: true, default: false }
    };
  }

  const user = new User({ name: "John" });
  user.update({ role: "admin" });

  assert.equal(user.name, "John");
  assert.equal(user.role, "admin");
  assert.equal(user.confirmed, false);
});

test("immutable properties reject updates", () => {
  class User extends Base {
    static schema = {
      name: { type: String, immutable: true },
      profile: {
        type: Object,
        default: { role: "editor" },
        keys: { role: { type: String, immutable: true } }
      }
    };
  }

  const user = new User({ name: "John" });

  assert.throws(() => {
    user.update({ name: "Jane" });
  }, /Cannot update immutable property 'name'/);
  assert.throws(() => {
    user.name = "Jane";
  }, /Cannot update immutable property 'name'/);
  assert.throws(() => {
    user.profile.role = "admin";
  }, /Cannot update immutable property 'profile.role'/);
});

test("supports custom base model inheritance", () => {
  class BaseModel extends Base {
    save() {
      return "saved";
    }
  }

  class User extends BaseModel {
    static collection = "users";
    static schema = {
      name: { type: String }
    };
  }

  const user = new User({ name: "John" });

  assert.equal(user.save(), "saved");
  assert.equal(user.name, "John");
  assert.equal(User.collection, "users");
});

test("coerce Date when parseConfig.coerce true", () => {
  class Item extends Base {
    static schema = { createdAt: { type: Date } };
  }

  const it = new Item({ createdAt: "2020-01-01T00:00:00Z" }, { coerce: true });
  assert.ok(it.createdAt instanceof Date);
});

test("number min/max enforces on update", () => {
  class P extends Base {
    static schema = { price: { type: Number, min: 0, max: 100 } };
  }

  const p = new P({ price: 50 });
  assert.doesNotThrow(() => p.update({ price: 100 }));
  assert.throws(() => p.update({ price: 200 }), /Value too large for 'price'/);
});

test("string min/max length enforces on update", () => {
  class S extends Base {
    static schema = { username: { type: String, min: 3, max: 10 } };
  }

  const s = new S({ username: "user" });
  assert.doesNotThrow(() => s.update({ username: "newuser" }));
  assert.throws(() => s.update({ username: "ab" }), /Value too small for 'username'/);
  assert.throws(() => s.update({ username: "thisisaverylongusername" }), /Value too large for 'username'/);
});

test("enum invalid on construct throws", () => {
  class R extends Base {
    static schema = { role: { type: String, enum: ["a", "b"] } };
  }

  assert.throws(() => new R({ role: "c" }), /Invalid value for 'role'/);
});

test("safe parseConfig swallows errors during construction", () => {
  class S extends Base {
    static schema = { name: { type: String } };
  }

  // Should not throw when safe:true even though required field is missing/invalid
  assert.doesNotThrow(() => new S({}, { safe: true }));
  const s = new S({}, { safe: true });
  assert.deepEqual(s.toObject(), {});
});

test("class-level immutability blocks direct assignment", () => {
  class I extends Base {
    static immutable = true;
    static schema = { name: { type: String, optional: true } };
  }

  const i = new I({ name: "alice" });
  assert.throws(() => { i.name = "bob"; }, /Cannot update immutable object of type I/);
});

test("reassigning array property revalidates and persists values", () => {
  class A extends Base {
    static schema = {
      tags: {
        type: Array,
        default: [],
        values: { type: String, beforeChecks: (v) => typeof v === "string" ? v.trim() : v }
      }
    };
  }

  const a = new A({ tags: ["init"] });
  a.tags = ["  new ", " other "];
  assert.equal(a.tags[0], "new");
  assert.equal(a.tags[1], "other");
});
