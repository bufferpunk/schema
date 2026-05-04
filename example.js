import User from "./user.js";

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
