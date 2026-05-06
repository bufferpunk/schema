import test from "node:test";
import assert from "node:assert/strict";
import Base from "../base.js";

test("validates fields, applies defaults, and runs hooks", () => {
  class User extends Base {
    static version = 1;
    static schema = {
      name: {
        type: String,
        minLength: 2,
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

  const user = new User({
    name: "  John   Doe  ",
    status: "active",
    profile: {}
  });

  assert.equal(user.name, "John Doe");
  assert.equal(user.status, "active");
  assert.equal(user.confirmed, false);
  assert.deepEqual(user.profile, { role: "editor" });
  assert.deepEqual(user.tags, []);
  assert.equal(user.toObject().version, 1);
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

test("immutable classes reject updates", () => {
  class User extends Base {
    static immutable = true;
    static schema = {
      name: { type: String }
    };
  }

  const user = new User({ name: "John" });

  assert.throws(() => {
    user.update({ name: "Jane" });
  }, /Cannot update immutable object of type User/);
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
