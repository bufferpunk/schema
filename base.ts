export interface FieldConfig {
  type: any;
  immutable?: boolean;
  optional?: boolean;
  default?: any;
  enum?: any[];
  maxLength?: number; 
  minLength?: number;
  beforeChecks?: (value: any) => any;
  afterChecks?: (value: any) => any;
  validate?: (value: any) => void;
  keys?: Record<string, FieldConfig>;
  values?: FieldConfig;
}

export interface SchemaDefinition {
  [key: string]: FieldConfig;
}

interface BaseConstructor {
  schema: SchemaDefinition;
  immutable?: boolean;
  version?: number;
}

function isNone(that: any): boolean { return that === null || that === undefined }

export default class Base {
  [key: string]: any;

  declare static schema: SchemaDefinition;
  declare static version?: number;
  declare static immutable?: boolean;

  constructor(obj: Record<string, any>) {
    const ctor = this.constructor as typeof Base & BaseConstructor;
    this.setProperties(ctor.schema, obj, true);
    if (ctor.version) this.#store.set("version", ctor.version);
  }

  #store = new Map<string, any>();
  toObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [key, value] of this.#store.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  update(obj: Record<string, any>): void {
    const ctor = this.constructor as typeof Base & BaseConstructor;
    this.setProperties(ctor.schema, obj);
    if (ctor.version) this.#store.set("version", ctor.version);
  }

  private setProperties(schema: SchemaDefinition, data: Record<string, any>, isNew: boolean = false): void {
    const ctor = this.constructor as typeof Base & BaseConstructor;
    if (ctor.immutable && !isNew) throw new Error(`Cannot update immutable object of type ${ctor.name}`);
    if (!isNew) data = { ...this.toObject(), ...data };

    for (const key in schema) {
      const conf = schema[key];
      let value = data[key];
      if (!conf) throw new Error(`'${key}' has no schema. Either remove it from the schema definition or add a schema for it.`);

      const validated = this.runValidate(conf, value, key);
      this.#store.set(key, validated);
      if (isNew) {
        Object.defineProperty(this, key, {
          get: () => this.#store.get(key),
          enumerable: true,
          configurable: false,
        });
      }
    }

    if (isNew) Object.freeze(this);
  }

  private runValidate(confPassed: FieldConfig, valuePassed: any, path: string): any {
    const { conf, value } = this.validateType(confPassed, valuePassed, path);
    let toReturn: any = value;
    if (conf.type === Array) {
      if (!conf.values) throw new Error(`Missing child configuration for array at ${path}`);
      toReturn = value.map((v: any, i: number) => this.runValidate(conf.values!, v, `${path}[${i}]`));
    }

    if (conf.type === Object &&  conf.keys) {
      const obj: Record<string, any> = {};
      for (const childKey in conf.keys)
        obj[childKey] = this.runValidate(conf.keys[childKey], value[childKey], `${path}.${childKey}`);
      toReturn = obj;
    }

    const p = path.split(".").reduce((o, k) => o?.[k], this.toObject());
    if (conf.immutable && !isNone(p) && p !== value) throw new Error(`Cannot change immutable property '${path}'`);
    if (typeof conf.validate === "function") conf.validate(toReturn);
    return toReturn;
  }

  private validateType(conf: FieldConfig, value: any, path: string): { conf: FieldConfig; value: any } {
    if (!conf.type) throw new Error(`Missing type configuration at '${path}'`);
    if (conf.beforeChecks && typeof conf.beforeChecks === "function") {
      const newVal = conf.beforeChecks(value);
      if (isNone(newVal) || conf.optional) value = newVal;
    }

    if (isNone(value)) {
      if (!isNone(conf.default)) value = typeof conf.default === 'function' ? conf.default() : conf.default;
      if (!conf.optional && isNone(value)) throw new Error(`Missing required property at '${path}'`);
      if (conf.optional && isNone(value)) return { conf, value };
    }

    if (value.constructor !== conf.type) {
      // Attempt to coerce the value to the correct type if possible. Valuable for date strings from a json for example
      value = new conf.type(value);
      if (value.constructor !== conf.type || isNaN(value))
        throw new Error(`Invalid type at '${path}', expected ${conf.type.name}, got ${value.constructor.name}`);
    }

    if (conf.maxLength && value.length > conf.maxLength) throw new Error(`Value too large for '${path}', maximum characters: ${conf.maxLength}`);
    if (conf.minLength && value.length < conf.minLength) throw new Error(`Value too small for '${path}', minimum characters: ${conf.minLength}`);
    if (conf.enum && !conf.enum.includes(value)) throw new Error(`Invalid value for '${path}', expected one of: ${conf.enum.join(", ")}`);
    if (conf.afterChecks && typeof conf.afterChecks === "function") {
      const newVal = conf.afterChecks(value);
      if (isNone(newVal) || conf.optional) value = newVal;
    }
    return { conf, value };
  }
}
