export interface FieldConfig {
  type: any;
  optional?: boolean;
  default?: any;
  maxLength?: number;
  minLength?: number;
  validate?: (value: any) => void;
  children?: Record<string, FieldConfig>;
  child?: FieldConfig;
}

export interface SchemaDefinition {
  [key: string]: FieldConfig;
}

interface BaseConstructor {
  schema: SchemaDefinition;
  version?: number;
}

export default class Base {
  [key: string]: any;

  declare static schema: SchemaDefinition;
  declare static version?: number;

  constructor(obj: Record<string, any>, addVersion: boolean = false) {
    const ctor = this.constructor as typeof Base & BaseConstructor;
    this.setProperties(ctor.schema, obj);
    if (addVersion && ctor.version) this.version = ctor.version;
  }

  private setProperties(schema: SchemaDefinition, data: Record<string, any>): void {
    for (const key in schema) {
      const conf = schema[key];
      let value = data[key];

      if (!conf) throw new Error(`${key} has no schema. Either remove it from the input or add a schema for it.`);
      this[key] = this.runValidate(conf, value, key);
    }
  }

  private runValidate(confPassed: FieldConfig, valuePassed: any, path: string): any {
    const { conf, value } = this.validateType(confPassed, valuePassed, path);
    let toReturn: any = value;

    if (conf.type === Array) {
      if (!conf.child) throw new Error(`Missing child configuration for array at ${path}[i]`);
      toReturn = value.map((v: any, i: number) => this.runValidate(conf.child!, v, `${path}[${i}]`));
    }

    if (conf.type === Object && conf.children) {
      const obj: Record<string, any> = {};
      for (const childKey in conf.children)
        obj[childKey] = this.runValidate(conf.children[childKey], value[childKey], `${path}.${childKey}`);

      toReturn = obj;
    }

    if (typeof conf.validate === "function") conf.validate(toReturn);
    return toReturn;
  }

  private validateType(conf: FieldConfig, value: any, path: string): { conf: FieldConfig; value: any } {
    if (!conf.type) throw new Error(`Missing type configuration at ${path}`);

    if (value === null || value === undefined) {
      if (conf.default !== undefined) value = typeof conf.default === 'function' ? conf.default() : conf.default;
      if (!conf.optional && (value === null || value === undefined)) throw new Error(`Missing required property at ${path}`);
      if (conf.optional && (value === null || value === undefined)) return { conf, value };
    }

    if (value.constructor !== conf.type) {
      value = new conf.type(value);
      if (value.constructor !== conf.type || isNaN(value))
        throw new Error(`Invalid type at ${path}, expected ${conf.type.name}, got ${value.constructor.name}`);
    }

    if (conf.maxLength && value.length > conf.maxLength) throw new Error(`Value too large for ${path}, maximum characters: ${conf.maxLength}`);
    if (conf.minLength && value.length < conf.minLength) throw new Error(`Value too small for ${path}, minimum characters: ${conf.minLength}`);

    return { conf, value };
  }
}
