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

- `base.js` contains the reusable validation base class.
- `user.js` shows a sample model built on top of the base class.
- `example.js` demonstrates creating and logging a validated object.

## Usage

Create a model by extending `Base` and defining a static `schema`:

```js
import Base from "@bufferpunk/schema";

export default class User extends Base {
  static version = 1;
  static schema = {
    name: { type: String, maxLength: 80, minLength: 5, optional: true },
    confirmed: { type: Boolean, optional: true, default: false }
  };
}
```

Instantiate the class with raw input data:

```js
import User from "./user.js";

const user = new User(
  {
    name: "John Doe",
    confirmed: false
  },
  true // optional to add version tag to the output object, if you're using a db for later migration. (defaults to false)
);

console.log(user);
```

## Schema Rules

Each field configuration can include the following options:

- `type`: required. The expected constructor, such as `String`, `Number`, `Boolean`, `Date`, `Array`, or `Object`.
- `optional`: allows the field to be omitted.
- `default`: value used when the input is missing. Functions are executed to produce the default.
- `minLength` and `maxLength`: length checks for values that expose `length`.
- `validate(value)`: custom validation that runs after coercion and nested validation.

### Nested Objects

Use `children` on an `Object` schema to validate nested properties:

```js
channel: {
  type: Object,
  children: {
    name: { type: String, maxLength: 5 },
    email: { type: String, optional: true }
  }
}
```

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

## Example Model

The included `user.js` example demonstrates:

- nested object validation for contact channels
- recursive validation for arrays of car objects
- default values for fields such as `language`, `bio`, and `confirmed`
- version tagging via the `addVersion` constructor argument

## Notes

This package is most useful when you want schema validation at runtime without introducing a full database ORM or a larger validation framework.