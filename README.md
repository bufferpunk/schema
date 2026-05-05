# @bufferpunk/schema

A lightweight, super fast runtime schema validator for JavaScript and TypeScript models.

`@bufferpunk/schema` is built around a base class that validates plain objects using a static schema definition. It is especially useful when working with NoSQL data, API payloads, and nested objects that need runtime guarantees.

This is built for data integrity and validation without the overhead of a full ORM or heavy validation library. It provides a simple way to  define schemas with type coercion, defaults, required fields, and custom validation logic.  
Best for APIs that receive untyped data and need to enforce structure and constraints at runtime.

## What It Does

When a model extends `Base` and defines a static `schema`, instance creation will:

- enforce required fields
- apply defaults (primitive values or factory functions)
- coerce values to the configured type when possible
- validate nested objects and arrays recursively
- validate allowed values with `enum`
- run `beforeValidate` and `afterValidate` hooks
- run custom `validate` logic for business rules

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
      beforeValidate: (value) => typeof value === "string" ? value.trim() : value,
      afterValidate: (value) => value.replace(/\s+/g, " ")
    },
    role: {
      type: String,
      enum: ["admin", "editor", "viewer"],
      default: "viewer",
      beforeValidate: (value) => typeof value === "string" ? value.toLowerCase() : value
    },
    confirmed: { type: Boolean, optional: true, default: false }
  };
}

const user = new User({
  name: "   John    Doe   ",
  role: "EDITOR"
}, true); // remove the second argument to skip version addition

console.log(user);
// {
//   name: "John Doe",
//   role: "editor",
//   confirmed: false,
//   version: 1
// }
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
      beforeValidate: (value: any) => typeof value === "string" ? value.trim() : value,
      afterValidate: (value: any) => value.replace(/\s+/g, " ")
    },
    language: {
      type: String,
      enum: ["english", "spanish", "portuguese"],
      default: "english",
      beforeValidate: (value: any) => typeof value === "string" ? value.toLowerCase().trim() : value,
      afterValidate: (value: any) => value.charAt(0).toUpperCase() + value.slice(1)
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
- `minLength`, `maxLength`: length constraints for values with a `length`
- `beforeValidate(value)`: transforms/sanitizes raw input before required/type checks
- `afterValidate(value)`: transforms value after type/length/enum checks
- `validate(value)`: custom final validation logic
- `child`: required for `Array` types to validate each array item
- `children`: required for `Object` types to validate nested properties

## Validation Order

For each field, validation runs in this order:

1. `beforeValidate`
2. required/optional and default handling
3. type validation/coercion
4. `minLength` / `maxLength`
5. `enum`
6. `afterValidate`
7. custom `validate`

This order allows you to normalize input first, then enforce constraints, then apply final formatting.

## Nested Objects and Arrays

Use `children` for objects and `child` for arrays:

```js
preferences: {
  type: Object,
  children: {
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    notifications: { type: Boolean, default: true }
  }
},
cars: {
  type: Array,
  child: {
    type: Object,
    children: {
      make: { type: String },
      model: { type: String },
      color: {
        type: String,
        enum: ["blue", "red", "black"],
        beforeValidate: (v) => typeof v === "string" ? v.toLowerCase().trim() : v,
        afterValidate: (v) => v.charAt(0).toUpperCase() + v.slice(1)
      }
    }
  }
}
```

## Included Files

- `base.ts` / `base.js` / `base.d.ts`: base validator implementation
- `example.ts` / `example.js`: complete usage examples with nested schemas and hooks

## Notes

This package is intentionally small and framework-agnostic. It gives you runtime schema safety without requiring a full ORM or heavyweight validation framework.
