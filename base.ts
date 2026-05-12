export interface FieldConfig {
  type: any;
  immutable?: boolean;
  optional?: boolean;
  default?: any;
  enum?: any[];
  max?: number; 
  min?: number;
  beforeChecks?: (value: any) => any;
  afterChecks?: (value: any) => any;
  validate?: (value: any) => void;
  keys?: Record<string, FieldConfig>;
  values?: FieldConfig;
}

export interface SchemaDefinition {
  [key: string]: FieldConfig;
}

export interface parserConfig {
  coerce?: boolean;
  safe?: boolean;
}

interface BaseConstructor {
  schema: SchemaDefinition;
  immutable?: boolean;
  version?: number;
}

function isNone(that: any): boolean { return that === undefined || that === null; }

export default class Base {
  [key: string]: any;

  declare static schema: SchemaDefinition;
  declare static version?: number;
  declare static immutable?: boolean;
  declare static parseConfig?: parserConfig;

  constructor(obj: Record<string, any>, parseConfig?: parserConfig) {
    this.update(obj, parseConfig, true);
  }

  update(obj: Record<string, any>, parseConfig?: parserConfig, isNew: boolean = false): void {
    const ctor = this.constructor as typeof Base & BaseConstructor;
    try {
      if (parseConfig) ctor.parseConfig = { ...ctor.parseConfig, ...parseConfig };
      this.setProperties(ctor.schema, obj, isNew);
      if (ctor.version) this["version"] = ctor.version;
    } catch (e) {
      for (const key in Object.keys(this)) delete this[key];
      if (!ctor.parseConfig?.safe) throw e;
    }
  }

  toObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const key in this) obj[key] = this[key];
    return obj;
  }

  json(): string { return JSON.stringify(this.toObject()); }

  private setProperties(schema: SchemaDefinition, data: Record<string, any>, isNew: boolean = false): void {
    const ctor = this.constructor as typeof Base & BaseConstructor;
    if (ctor.immutable && !isNew) throw new Error(`Cannot update immutable object of type ${ctor.name}`);
    if (!isNew) data = { ...this.toObject(), ...data };

    for (const key in schema) {
      const conf = schema[key];
      let value = data[key];
      if (!conf) throw new Error(`'${key}' has no schema. Either remove it from the schema definition or add a schema for it.`);
      this.runValidate(conf, value, key, isNew, this, key);
    }
  }

  private runValidate(confPassed: FieldConfig, valuePassed: any, path: string, isNew: boolean, container: Record<string, any> = this, propertyName?: string): any {
    const { conf, value } = this.validateType(confPassed, valuePassed, path, isNew);
    let toReturn: any = value;
    if (conf.type === Array) {
      if (!conf.values) throw new Error(`Missing child configuration for array at ${path}`);
      toReturn = value.map((v: any, i: number) => this.runValidate(conf.values!, v, `${path}[${i}]`, isNew));
    }

    if (conf.type === Object &&  conf.keys) {
      const obj: Record<string, any> = {};
      for (const childKey in conf.keys)
        this.runValidate(conf.keys[childKey], value[childKey], `${path}.${childKey}`, isNew, obj, childKey);
      toReturn = obj;
    }

    const p = path.split(".").reduce((o, k) => o?.[k], this);
    if (conf.immutable && !isNone(p) && p !== toReturn) throw new Error(`Cannot update immutable property '${path}'`);
    if (typeof conf.validate === "function") conf.validate(toReturn);

    if (propertyName !== undefined) {
      let currentValue = toReturn;
      delete container[propertyName];
      Object.defineProperty(container, propertyName, {
        get: () => currentValue,
        set: (newVal) => {
          const ctor = this.constructor as typeof Base & BaseConstructor;
          if (ctor.immutable) throw new Error(`Cannot update immutable object of type ${ctor.name}`);
          if (conf.immutable) throw new Error(`Cannot update immutable property '${path}'`);
          const validated = this.runValidate(conf, newVal, path, false, container, propertyName);
          currentValue = validated;
          if (typeof conf.validate === "function") conf.validate(validated);
        },
        enumerable: true,
        configurable: true,
      });
    }
    return toReturn;
  }

  private validateType(conf: FieldConfig, value: any, path: string, isNew: boolean): { conf: FieldConfig; value: any } {
    const ctor = this.constructor as typeof Base & BaseConstructor;
    if (!conf.type) throw new Error(`Missing type configuration at '${path}'`);
    if (conf.beforeChecks && typeof conf.beforeChecks === "function") {
      const newVal = conf.beforeChecks(value);
      if (!isNone(newVal) || conf.optional) value = newVal;
    }
    if (!isNew && conf.immutable) throw new Error(`Cannot update immutable property '${path}'`);
    if (isNone(value)) {
      if (!isNone(conf.default)) value = typeof conf.default === 'function' ? conf.default() : conf.default;
      if (isNone(value)) {
        if (conf.optional) return { conf, value };
        if (!conf.optional) throw new Error(`Missing required property at '${path}'`);
      }
    }

    if (value.constructor !== conf.type) {
      // Attempt to coerce the value to the correct type if possible. Valuable for date strings from a json for example
      if (ctor.parseConfig?.coerce) value = new conf.type(value);
      if (value.constructor !== conf.type || isNaN(value))
        throw new Error(`Invalid type at '${path}', expected ${conf.type.name}, got ${value.constructor.name}`);
    }

    if ((conf.max !== undefined) && (value.length ? value.length > conf.max : value > conf.max)) throw new Error(`Value too large for '${path}', maximum: ${conf.max}`);
    if ((conf.min !== undefined) && (value.length ? value.length < conf.min : value < conf.min)) throw new Error(`Value too small for '${path}', minimum: ${conf.min}`);
    if (conf.enum && !conf.enum.includes(value)) throw new Error(`Invalid value for '${path}', expected one of: ${conf.enum.join(", ")}`);
    if (conf.afterChecks && typeof conf.afterChecks === "function") {
      const newVal = conf.afterChecks(value);
      if (!isNone(newVal) || conf.optional) value = newVal;
    }
    return { conf, value };
  }
}
