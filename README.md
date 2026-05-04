# @bufferpunk/schema

A small runtime schema and type validator for JavaScript and TypeScript-style object models.

It is designed for classes that extend a shared base validator and define a static `schema` object. When you create a model instance, the base class:

- validates required and optional fields
- applies default values
- coerces primitive values when possible
- validates nested objects and arrays recursively
- runs custom validation functions after type checks

## Installation

```bash
npm install @bufferpunk/schema
```

## Package Structure

- `base.ts` / `base.d.ts` / `base.js` — The reusable validation base class with full TypeScript types.
- `example.ts` / `example.js` — A complete example with a User model and usage demo.

The package includes TypeScript source files with type declarations generated during the build. Run `npm run build` to regenerate `.d.ts` files after updating `.ts` sources.

## Usage

### JavaScript

Create a model by extending `Base` and defining a static `schema`:

```js
import Base from "@bufferpunk/schema";

class User extends Base {
  static version = 1;
  static schema = {
    name: { type: String, maxLength: 80, minLength: 5, optional: true },
    confirmed: { type: Boolean, optional: true, default: false }
  };
}

const user = new User(
  {
    name: "John Doe",
    confirmed: false
  },
  true // optional: adds version tag to output for database migrations (defaults to false)
);

console.log(user);
```

### TypeScript

Use TypeScript for full type safety:

```ts
import Base, { SchemaDefinition } from "@bufferpunk/schema";

class User extends Base {
  static version = 1;
  static schema: SchemaDefinition = {
    name: { type: String, maxLength: 80, minLength: 5, optional: true },
    confirmed: { type: Boolean, optional: true, default: false }
  };
}

const user = new User(
  {
    name: "John Doe",
    confirmed: false
  },
  true // optional to add version tag to the output object, if you're using a db for later migration. (defaults to false)
);

console.log(user);
```

### Building TypeScript

If you modify the `.ts` source files, rebuild the type declarations:

```bash
npm run build
```

This generates `.d.ts` files for IDE autocompletion and type checking.

## Schema Rules

Each field configuration can include the following options:

- `type`: required. The expected constructor, such as `String`, `Number`, `Boolean`, `Date`, `Array`, or `Object`.
- `optional`: allows the field to be omitted.
- `default`: value used when the input is missing. Functions are executed to produce the default.
- `minLength` and `maxLength`: length checks for values that expose `length`.
- `validate(value)`: custom validation that runs after coercion and nested validation.
- `child`: for `Array` types, defines the schema for nested validation.
- `children`: for `Object` types, defines the schema for nested validation of object properties.

## Examples

The included `example.ts` / `example.js` demonstrates:

- nested object validation for contact channels (email, phone)
- recursive validation for arrays of car objects
- default values for fields such as `language`, `bio`, and `confirmed`
- version tagging via the `addVersion` constructor argument
- both JavaScript and TypeScript patterns

See the example files for a complete demonstration of the package's capabilities.


### Arrays

Use `child` on an `Array` schema to validate every element:

```js
cars: {
  type: Array,
  child: {
    type: Object,
    children: {
      make: { type: String },
      model: { type: String }
    }
  }
}
```

## Notes

This package is most useful when you want schema validation at runtime without introducing a full database ORM or a larger validation framework.