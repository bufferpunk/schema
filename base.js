export default class Base {
  constructor(obj, addVersion = false) {
    this.setProperties(this.constructor.schema, obj);
    if (addVersion && this.constructor.version !== undefined) this.version = this.constructor.version;
  }

  setProperties(schema, data) {
    for (const key in schema) {
      const conf = schema[key];
      let value = data[key];

      if (!conf) throw new Error(`'${key}' has no schema. Either remove it from the schema definition or add a schema for it.`);
      this[key] = this.runValidate(conf, value, key);
    }
  }

  runValidate(confPassed, valuePassed, path) {
    const { conf, value } = this.validateType(confPassed, valuePassed, path);
    let toReturn = value;

    if (conf.type === Array) {
      if (!conf.child) throw new Error(`Missing child configuration for array at '${path}'`);
      toReturn = value.map((v, i) => this.runValidate(conf.child, v, `'${path}[${i}]'`));
    }

    if (conf.type === Object && conf.children) {
      const obj = {};
      for (const childKey in conf.children)
        obj[childKey] = this.runValidate(conf.children[childKey], value[childKey], `'${path}.${childKey}'`);

      toReturn = obj;
    }

    if (typeof conf.validate === "function") conf.validate(toReturn);
    return toReturn;
  }

  validateType(conf, value, path) {
    if (!conf.type) throw new Error(`Missing type configuration at ${path}`);

    if (conf.beforeValidate && typeof conf.beforeValidate === "function") {
      const newVal = conf.beforeValidate(value);
      if (newVal !== undefined && newVal !== null) value = newVal;
    }

    if (value === null || value === undefined) {
      if (conf.default !== undefined) value = typeof conf.default === 'function' ? conf.default() : conf.default;
      if (!conf.optional && (value === null || value === undefined)) throw new Error(`Missing required property at ${path}`);
      if (conf.optional && (value === null || value === undefined)) return { conf, value };
    }

    if (value.constructor !== conf.type) {
      // Attempt to coerce the value to the correct type if possible
      // Valuable for date strings from a json for example, but also for numbers and booleans
      value = new conf.type(value);
      if (value.constructor !== conf.type || isNaN(value))
        throw new Error(`Invalid type at ${path}, expected ${conf.type.name}, got ${value.constructor.name}`);
    }

    if (conf.maxLength && value.length > conf.maxLength) throw new Error(`Value too large for ${path}, maximum characters: ${conf.maxLength}`);

    if (conf.minLength && value.length < conf.minLength) throw new Error(`Value too small for ${path}, minimum characters: ${conf.minLength}`);

    if (conf.enum && !conf.enum.includes(value)) throw new Error(`Invalid value for ${path}, expected one of: ${conf.enum.join(", ")}`);

    if (conf.afterValidate && typeof conf.afterValidate === "function") {
      const newVal = conf.afterValidate(value);
      if (newVal !== undefined && newVal !== null) value = newVal;
    }

    return { conf, value };
  }
}
