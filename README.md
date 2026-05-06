# @bufferpunk/schema

A lightweight runtime schema validator for JavaScript and TypeScript models with support for immutability and field-level validation hooks.

`@bufferpunk/schema` is built around a base class that validates plain objects using a static schema definition. It is especially useful when working with NoSQL data, API payloads, and nested objects that need runtime guarantees and immutability constraints.

## What It Does

When a model extends `Base` and defines a static `schema`, instance creation and updates will:

- enforce required fields
- apply defaults (primitive values or factory functions)
- coerce values to the configured type when possible
- validate nested objects and arrays recursively
- validate allowed values with `enum`
- run custom `beforeChecks` and `afterChecks` hooks if present
- run custom `validate` hook for final validation if present
- enforce immutability at class or field level

## Installation

```bash
npm install @bufferpunk/schema
```

## Quick Start (JavaScript)

```js
import Base from "@bufferpunk/schema";

class User extends Base {
  static version = 1;

  static schema = {
    name: {
      type: String,
      minLength: 2,
      maxLength: 80,
      beforeChecks: (value) => typeof value === "string" ? value.trim() : value,
      afterChecks: (value) => value.replace(/\s+/g, " ")
    },
    role: {
      type: String,
      enum: ["admin", "editor", "viewer"],
      default: "viewer",
      beforeChecks: (value) => typeof value === "string" ? value.toLowerCase() : value
    },
    confirmed: { type: Boolean, optional: true, default: false }
  };
}

const user = new User({
  name: "   John    Doe   ",
  role: "EDITOR"
});

console.log(user);
// {
//   name: "John Doe",
//   role: "editor",
//   confirmed: false,
//   version: 1
// }

// Update the user
user.update({ role: "admin" });
```

## Quick Start (TypeScript)

```ts
import Base, { SchemaDefinition } from "@bufferpunk/schema";

class User extends Base {
  static version = 1;

  static schema: SchemaDefinition = {
    name: {
      type: String,
      minLength: 2,
      maxLength: 80,
      beforeChecks: (value: any) => typeof value === "string" ? value.trim() : value,
      afterChecks: (value: any) => value.replace(/\s+/g, " ")
    },
    language: {
      type: String,
      enum: ["english", "spanish", "portuguese"],
      default: "english",
      beforeChecks: (value: any) => typeof value === "string" ? value.toLowerCase().trim() : value,
      afterChecks: (value: any) => value.charAt(0).toUpperCase() + value.slice(1)
    }
  };
}

const user = new User({ name: "   Ana   Silva   " });
console.log(user);
```

Now you have safe user input, and can safely work with the objects knowing they conform to the defined schema, with all the transformations and validations applied.

## Field Configuration

Each field in a schema can include:

- `type` (required): constructor such as `String`, `Number`, `Boolean`, `Date`, `Array`, `Object`
- `optional`: allows missing value
- `default`: fallback value when input is `null` or `undefined` (function values are executed)
- `enum`: list of allowed values
- `minLength`, `maxLength`: length constraints for values with a `length` property
- `immutable`: prevent this field from being changed after creation
- `beforeChecks(value)`: transforms/sanitizes raw input before required/type checks
- `afterChecks(value)`: transforms value after type/length/enum checks and before validation
- `validate(value)`: custom final validation logic
- `values`: required for `Array` types to validate each array item
- `keys`: required for `Object` types to validate nested properties

the `type` property is the only required configuration for a field. All other properties are optional and can be used as needed to enforce constraints and transformations.

## Validation Order

For each field, validation runs in this order:

1. `beforeChecks` (you can handle user input normalization here, e.g trimming strings, coercing types, etc.)
2. required/optional and default handling
3. type validation/coercion
4. `minLength` / `maxLength`
5. `enum`
6. `afterChecks` (best for output formatting)
7. custom `validate` (best business rules)
8. immutability check (if field is immutable)

This order allows you to normalize input first, enforce constraints, then apply final formatting while respecting immutability.

## Immutability

Mark classes or individual fields as immutable to prevent modifications:

```ts
class ImmutableUser extends Base {
  static immutable = true; // entire class cannot be updated
  
  static schema: SchemaDefinition = {
    id: { type: String, immutable: true }, // this field cannot change
    name: { type: String } // this field can be updated
  };
}

const user = new ImmutableUser({ id: "123", name: "John" });
user.update({ name: "Jane" }); // Error: Cannot update immutable object
```

Or mix immutable and mutable fields:

```ts
class User extends Base {
  static schema: SchemaDefinition = {
    id: { type: String, immutable: true },
    createdAt: { type: Date, immutable: true, default: () => new Date() },
    name: { type: String }, // can be updated
    role: { type: String, default: "user" } // can be updated
  };
}

const user = new User({ id: "123", name: "John" });
user.update({ name: "Jane" }); // works
user.update({ id: "456" }); // Error: Cannot change immutable property 'id'
```

## Updating Instances

Use the `update()` method to safely modify instance properties:

```ts
const user = new User({ name: "John", role: "user" });
user.update({ role: "admin" });
// All validation, defaults, and hooks run again
```

The constructor automatically includes the `version` if defined on the class:

```ts
class User extends Base {
  static version = 1;
  static schema = { /* ... */ };
}

const user = new User({ name: "John" });
console.log(user.version); // 1
```

## Custom Base Models

If you already have your own base model class, you can extend `Base` first and add shared behavior there. Your app models can then inherit both the schema validation and your own methods.

```ts
import Base from "@bufferpunk/schema";

class BaseModel extends Base {
  save() {
    // save to db
  }
}

class User extends BaseModel {
  static collection = "users";
  static schema = {
    name: { type: String }
  };
}
```

This pattern is useful when you want schema validation in a shared domain base class, while still keeping your own persistence or business methods in one place.

If you want a CommonJS-style example, the same pattern looks like this:

```js
const Base = require("@bufferpunk/schema").default;

class BaseModel extends Base {
  save() {
    // save to db
  }
}

class User extends BaseModel {
  static collection = "users";
  static schema = { name: { type: String } };
}
```

See [examples/inheritance.ts](examples/inheritance.ts) and [examples/inheritance.js](examples/inheritance.js) for a complete working example.

## Nested Objects and Arrays

Use `keys` for objects and `values` for arrays:

```js
preferences: {
  type: Object,
  keys: {
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    notifications: { type: Boolean, default: true }
  }
},
cars: {
  type: Array,
  values: {
    type: Object,
    keys: {
      make: { type: String },
      model: { type: String },
      color: {
        type: String,
        enum: ["blue", "red", "black"],
        beforeChecks: (v) => typeof v === "string" ? v.toLowerCase().trim() : v,
        afterChecks: (v) => v.charAt(0).toUpperCase() + v.slice(1)
      }
    }
  }
}
```

## Included Files

- `base.ts` / `base.js` / `base.d.ts`: base validator implementation
- `example.ts` / `example.js`: thin launchers for the main demo in `examples/`
- `examples/user.ts` / `examples/user.js`: the main example model with nested schemas, hooks, and immutability
- `examples/inheritance.ts` / `examples/inheritance.js`: custom base model inheritance example

## Example Layout

The full demo now lives under `examples/` so the root example files stay small.

If you want to copy the pattern into your own app, treat `examples/user.ts` as the main reference and build your own model files the same way.

## Migration from v2.x

If upgrading from v2.x, see [CHANGELOG.md](CHANGELOG.md) for breaking changes and migration steps.

## Notes

This package is intentionally small and framework-agnostic. It gives you runtime schema safety, immutability constraints, and field-level validation without requiring a full ORM or heavyweight validation framework.
