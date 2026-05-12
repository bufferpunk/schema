function isNone(that) { return that === undefined || that === null; }
export default class Base {
    constructor(obj, parseConfig) {
        this.update(obj, parseConfig, true);
    }
    update(obj, parseConfig, isNew = false) {
        const ctor = this.constructor;
        try {
            if (parseConfig)
                ctor.parseConfig = { ...ctor.parseConfig, ...parseConfig };
            this.setProperties(ctor.schema, obj, isNew);
            if (ctor.version)
                this["version"] = ctor.version;
        }
        catch (e) {
            for (const key in Object.keys(this))
                delete this[key];
            if (!ctor.parseConfig?.safe)
                throw e;
        }
    }
    toObject() {
        const obj = {};
        for (const key in this) {
            obj[key] = this[key];
        }
        return obj;
    }
    setProperties(schema, data, isNew = false) {
        const ctor = this.constructor;
        if (ctor.immutable && !isNew)
            throw new Error(`Cannot update immutable object of type ${ctor.name}`);
        if (!isNew)
            data = { ...this.toObject(), ...data };
        for (const key in schema) {
            const conf = schema[key];
            let value = data[key];
            if (!conf)
                throw new Error(`'${key}' has no schema. Either remove it from the schema definition or add a schema for it.`);
            this.runValidate(conf, value, key, isNew, this, key);
            // this[key] = validated;
            // if (isNew) {
            //   Object.defineProperty(this, key, {
            //     get: () => this.get(key),
            //     enumerable: true,
            //     configurable: false,
            //   });
            // }
        }
    }
    runValidate(confPassed, valuePassed, path, isNew, container = this, propertyName) {
        const { conf, value } = this.validateType(confPassed, valuePassed, path, isNew);
        let toReturn = value;
        if (conf.type === Array) {
            if (!conf.values)
                throw new Error(`Missing child configuration for array at ${path}`);
            toReturn = value.map((v, i) => this.runValidate(conf.values, v, `${path}[${i}]`, isNew));
        }
        if (conf.type === Object && conf.keys) {
            const obj = {};
            for (const childKey in conf.keys)
                this.runValidate(conf.keys[childKey], value[childKey], `${path}.${childKey}`, isNew, obj, childKey);
            toReturn = obj;
        }
        const p = path.split(".").reduce((o, k) => o?.[k], this);
        if (conf.immutable && !isNone(p) && p !== toReturn)
            throw new Error(`Cannot update immutable property '${path}'`);
        if (typeof conf.validate === "function")
            conf.validate(toReturn);
        if (propertyName !== undefined) {
            let currentValue = toReturn;
            delete container[propertyName];
            Object.defineProperty(container, propertyName, {
                get: () => currentValue,
                set: (newVal) => {
                    const ctor = this.constructor;
                    if (ctor.immutable)
                        throw new Error(`Cannot update immutable object of type ${ctor.name}`);
                    if (conf.immutable)
                        throw new Error(`Cannot update immutable property '${path}'`);
                    const validated = this.runValidate(conf, newVal, path, false, container, propertyName);
                    currentValue = validated;
                    if (typeof conf.validate === "function")
                        conf.validate(validated);
                },
                enumerable: true,
                configurable: true,
            });
        }
        return toReturn;
    }
    validateType(conf, value, path, isNew) {
        const ctor = this.constructor;
        if (!conf.type)
            throw new Error(`Missing type configuration at '${path}'`);
        if (conf.beforeChecks && typeof conf.beforeChecks === "function") {
            const newVal = conf.beforeChecks(value);
            if (!isNone(newVal) || conf.optional)
                value = newVal;
        }
        if (!isNew && conf.immutable)
            throw new Error(`Cannot update immutable property '${path}'`);
        if (isNone(value)) {
            if (!isNone(conf.default))
                value = typeof conf.default === 'function' ? conf.default() : conf.default;
            if (isNone(value)) {
                if (conf.optional)
                    return { conf, value };
                if (!conf.optional)
                    throw new Error(`Missing required property at '${path}'`);
            }
        }
        if (value.constructor !== conf.type) {
            // Attempt to coerce the value to the correct type if possible. Valuable for date strings from a json for example
            if (ctor.parseConfig?.coerce)
                value = new conf.type(value);
            if (value.constructor !== conf.type || isNaN(value))
                throw new Error(`Invalid type at '${path}', expected ${conf.type.name}, got ${value.constructor.name}`);
        }
        if ((conf.max !== undefined) && (value.length ? value.length > conf.max : value > conf.max))
            throw new Error(`Value too large for '${path}', maximum: ${conf.max}`);
        if ((conf.min !== undefined) && (value.length ? value.length < conf.min : value < conf.min))
            throw new Error(`Value too small for '${path}', minimum: ${conf.min}`);
        if (conf.enum && !conf.enum.includes(value))
            throw new Error(`Invalid value for '${path}', expected one of: ${conf.enum.join(", ")}`);
        if (conf.afterChecks && typeof conf.afterChecks === "function") {
            const newVal = conf.afterChecks(value);
            if (!isNone(newVal) || conf.optional)
                value = newVal;
        }
        return { conf, value };
    }
}
