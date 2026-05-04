import Base from "./base.js";

// We're defining the User model here for demonstration purposes,
//  but in your project you should have models in separate files and import them where needed.

class User extends Base {
  static collection = 'users'; // in this example, this is for mongodb, but it can be used for any db or even just for in-memory objects. It's just a way to identify the type of the object and can be used for later migrations if needed.
  static version = 1;
  static schema = {
    joinedOn: { type: Date, default: new Date(), optional: true },
    name: { type: String, maxLength: 80, minLength: 5, optional: true },
    channel: {
      type: Object,
      children: { // An object can have multiple children types
        name: { type: String, maxLength: 5 },
        email: { type: String, maxLength: 35, minLength: 5, optional: true },
        phone: { type: String, maxLength: 15, minLength: 5, optional: true }
      },
      validate: (value) => {
        // Validates the final value after all type checks and defaults have been applied
        if (value.name === 'email' && !/^[a-z0-9._+-]+@[a-z0-9-]+(\.[a-z]{2,})+$/.test(value.email)) throw new Error('Invalid email format');
        if (!['phone', 'email'].includes(value.name)) throw new Error('Invalid channel name');
        if (!value[value.name]) throw new Error(`Missing channel value for ${value.name}`);
      }
    },
    language: { type: String, maxLength: 20, minLength: 5, optional: true, default: 'English' },
    bio: { type: String, maxLength: 50, minLength: 5, optional: true,
      default: () => {
        // Yes, deafult can be a function or a primitive type value.
        // If it's a function, it will be called to get the default value when needed.
        return 'No bio yet'; // or a random generated bio
      }
    },
    confirmed: { type: Boolean, optional: true, default: false },
    cars: {
      type: Array,
      optional: true,
      default: [],
      child: { // An array should have one child type
        type: Object, // Or it could be a primitive type like String, Number, etc. In that case, the child would just be { type: String } for example.
        children: { // You can nest objects until the final child is a primitive type. The validation will run recursively through all levels of nesting.
          make: { type: String, maxLength: 20, minLength: 2 },
          model: { type: String, maxLength: 20, minLength: 2 },
          year: { type: Number, optional: true },
          plate_number: { type: String, maxLength: 20, minLength: 3 },
          color: { type: String, maxLength: 10, minLength: 3 },
          img_url: { type: String, maxLength: 200, minLength: 5, optional: true }
        }
      }
    }
  };
}

const user = new User({
  name: 'John Doe',
  channel: { name: 'email', email: 'john@example.com' },
  cars: [
    { make: 'Toyota', model: 'Camry', year: 2020, plate_number: 'ABC123', color: 'Blue' },
    { make: 'Honda', model: 'Civic', plate_number: 'XYZ789', color: 'Red' }
  ]
}, true);

console.log(user);
/* Output:
User {
  joinedOn: 2026-05-04T16:55:20.192Z,
  name: 'John Doe',
  channel: { name: 'email', email: 'john@example.com', phone: undefined },
  language: 'English',
  bio: 'No bio yet',
  confirmed: false,
  cars: [
    {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      plate_number: 'ABC123',
      color: 'Blue',
      img_url: undefined
    },
    {
      make: 'Honda',
      model: 'Civic',
      year: undefined,
      plate_number: 'XYZ789',
      color: 'Red',
      img_url: undefined
    }
  ],
  version: 1
}
**/

// From here you can safely save the user to the database,
// knowing that all the properties are valid and all defaults have been applied.
// You can also be sure that if you later retrieve this user from the database and create a new User instance with it,
// it will still be valid and have all the same properties,
// even if some were missing or in the wrong type in the retrieved data.
// For databases like MongoDB, you can even save the user with the version property
// and use it to handle future schema changes and migrations more easily.
// This package is a huge win for NoSQL databases, but it can be used with SQL databases as well,
// especially if you want to have a more flexible schema or handle complex nested data.
// With this package, NoSQL databases can have the same level of data integrity and validation as SQL databases,
// while still keeping their flexibility and ease of use.
