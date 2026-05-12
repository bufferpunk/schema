# Changelog

## [3.1.0] - 2026-05-12

### ⚠️ Breaking Changes

- **Immutability error messages**: Error message wording changed for consistency
  ```
  // Before: "Cannot change immutable property 'name'"
  // After: "Cannot update immutable property 'name'"
  ```

- **Property setter enforcement**: Class-level immutability now prevents direct property assignment (not just `.update()`)
  ```ts
  class ImmutableUser extends Base {
    static immutable = true;
    static schema = { name: { type: String } };
  }
  
  const user = new ImmutableUser({ name: "John" });
  user.name = "Jane"; // Error: Cannot update immutable object of type ImmutableUser
  ```

### ✨ New Features

- **`json()` method**: Serialize instance to JSON string
  ```ts
  const user = new User({ name: "John" });
  const jsonStr = user.json();
  ```

- **`parseConfig` parameter**: Pass `coerce` and `safe` options to constructor and `.update()`
  ```ts
  // Coerce string to Date on construction
  const user = new User({ createdAt: "2020-01-01" }, { coerce: true });
  
  // Silently ignore validation errors during construction
  const user = new User({}, { safe: true });
  ```

- **Property setter validation**: Direct property assignment now validates and revalidates values
  ```ts
  const user = new User({ name: "John" });
  user.name = "  Jane  "; // Runs beforeChecks/afterChecks hooks
  ```

- **Fixed nested object property leak**: Nested `keys` properties now correctly attach to their parent object, not the root instance

### 🐛 Bug Fixes

- Property setters now persist validated values instead of discarding them
- Nested object child properties no longer leak to the root object during initialization
- Immutability is now enforced on direct property assignment (not just `.update()`)

## [3.0.0] - 2026-05-06

### ⚠️ Breaking Changes

- **Constructor signature changed**: Removed `addVersion` parameter from constructor. Version is now automatically included if `static version` is defined on the class.
  ```ts
  // Before
  new User(data, true);
  
  // After
  new User(data);
  ```

- **Hook names renamed**:
  - `beforeValidate` → `beforeChecks`
  - `afterValidate` → `afterChecks`

- **Array field config changed**: `child` → `values`
  ```ts
  // Before
  cars: { type: Array, child: { type: Object, children: { ... } } }
  
  // After
  cars: { type: Array, values: { type: Object, keys: { ... } } }
  ```

- **Object field config changed**: `children` → `keys`
  ```ts
  // Before
  address: { type: Object, children: { street: {...}, city: {...} } }
  
  // After
  address: { type: Object, keys: { street: {...}, city: {...} } }
  ```

### ✨ New Features

- **Immutability support**: Mark fields or entire classes as immutable
  ```ts
  class ImmutableUser extends Base {
    static immutable = true; // entire class cannot be updated
    
    static schema = {
      id: { type: String, immutable: true }, // this field cannot change
      name: { type: String }
    };
  }
  ```

- **Update method**: Safely update instance properties after creation
  ```ts
  const user = new User({ name: 'John' });
  user.update({ name: 'Jane' }); // returns void, modifies instance
  ```

- **Better error messages**: Property paths now include quotes for clarity
  ```
  // Before: "Invalid value for address.street, expected one of: ..."
  // After: "Invalid value for 'address.street', expected one of: ..."
  ```

### 📝 Migration Guide

If upgrading from v2.x:

1. Replace all `beforeValidate` with `beforeChecks`
2. Replace all `afterValidate` with `afterChecks`
3. Replace all `child` with `values` in Array types
4. Replace all `children` with `keys` in Object types
5. Remove the second parameter from all constructor calls (version now auto-applies)
6. If using immutability, enable with `static immutable = true` or field-level `immutable: true`
7. For instance updates, use the new `update()` method instead of reassigning properties
