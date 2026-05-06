import Base, { SchemaDefinition } from "../base.js";

class User extends Base {
  static collection = "users";
  static version = 1;
  static immutable = false;

  static schema: SchemaDefinition = {
    joinedOn: { type: Date, default: () => new Date(), optional: true },
    name: {
      type: String,
      maxLength: 80,
      minLength: 5,
      optional: true,
      beforeChecks: (value: any) => typeof value === "string" ? value.trim() : value,
      afterChecks: (value: any) => value.replace(/\s+/g, " ")
    },
    channel: {
      type: Object,
      keys: {
        name: { type: String, maxLength: 5, enum: ["phone", "email"] },
        email: { type: String, maxLength: 35, minLength: 5, optional: true },
        phone: { type: String, maxLength: 15, minLength: 5, optional: true }
      },
      validate: (value: Record<string, any>) => {
        if (value.name === "email" && !/^[a-z0-9._+-]+@[a-z0-9-]+(\.[a-z]{2,})+$/.test(value.email)) throw new Error("Invalid email format");
        if (!value[value.name]) throw new Error(`Missing channel value for ${value.name}`);
      }
    },
    language: {
      type: String,
      maxLength: 20,
      minLength: 5,
      optional: true,
      default: "english",
      enum: ["english", "spanish", "portuguese"],
      beforeChecks: (value: any) => typeof value === "string" ? value.toLowerCase().trim() : value,
      afterChecks: (value: any) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    confirmed: { type: Boolean, optional: true, immutable: true },
    cars: {
      type: Array,
      optional: true,
      default: [],
      values: {
        type: Object,
        keys: {
          make: { type: String, maxLength: 20, minLength: 2 },
          model: { type: String, maxLength: 20, minLength: 2 },
          year: { type: Number, optional: true },
          plate_number: { type: String, maxLength: 20, minLength: 3 },
          color: {
            type: String,
            maxLength: 10,
            minLength: 3,
            enum: ["blue", "red", "black", "white", "silver"],
            beforeChecks: (value: any) => typeof value === "string" ? value.toLowerCase().trim() : value,
            afterChecks: (value: any) => value.charAt(0).toUpperCase() + value.slice(1)
          },
          img_url: { type: String, maxLength: 200, minLength: 5, optional: true }
        }
      }
    }
  };
}

const user = new User({
  name: "   John    Doe   ",
  channel: { name: "email", email: "john@example.com" },
  cars: [
    { make: "Toyota", model: "Camry", year: 2020, plate_number: "ABC123", color: "blue" },
    { make: "Honda", model: "Civic", plate_number: "XYZ789", color: "red" }
  ]
});

console.log("Initial user:");
console.log(user);

/*
This example shows:
- beforeChecks / afterChecks hooks
- enum validation
- keys / values for nested objects and arrays
- immutable field configuration
- automatic version assignment
*/
