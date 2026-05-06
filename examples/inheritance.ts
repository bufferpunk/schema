import Base, { SchemaDefinition } from "../base.js";

class BaseModel extends Base {
  save() {
    // save to db
  }
}

class User extends BaseModel {
  static collection = "users";
  static schema: SchemaDefinition = {
    name: { type: String }
  };
}

const user = new User({ name: "John Doe" });
user.save();

console.log(user);
