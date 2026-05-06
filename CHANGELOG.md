# Changelog

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
