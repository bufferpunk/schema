var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Base_store;
function isNone(that) { return that === null || that === undefined; }
class Base {
    constructor(obj) {
        _Base_store.set(this, new Map());
        const ctor = this.constructor;
        this.setProperties(ctor.schema, obj, true);
        if (ctor.version)
            __classPrivateFieldGet(this, _Base_store, "f").set("version", ctor.version);
    }
    toObject() {
        const obj = {};
        for (const [key, value] of __classPrivateFieldGet(this, _Base_store, "f").entries()) {
            obj[key] = value;
        }
        return obj;
    }
    update(obj) {
        const ctor = this.constructor;
        this.setProperties(ctor.schema, obj);
        if (ctor.version)
            __classPrivateFieldGet(this, _Base_store, "f").set("version", ctor.version);
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
            const validated = this.runValidate(conf, value, key);
            __classPrivateFieldGet(this, _Base_store, "f").set(key, validated);
            if (isNew) {
                Object.defineProperty(this, key, {
                    get: () => __classPrivateFieldGet(this, _Base_store, "f").get(key),
                    enumerable: true,
                    configurable: false,
                });
            }
        }
        if (isNew)
            Object.freeze(this);
    }
    runValidate(confPassed, valuePassed, path) {
        const { conf, value } = this.validateType(confPassed, valuePassed, path);
        let toReturn = value;
        if (conf.type === Array) {
            if (!conf.values)
                throw new Error(`Missing child configuration for array at ${path}`);
            toReturn = value.map((v, i) => this.runValidate(conf.values, v, `${path}[${i}]`));
        }
        if (conf.type === Object && conf.keys) {
            const obj = {};
            for (const childKey in conf.keys)
                obj[childKey] = this.runValidate(conf.keys[childKey], value[childKey], `${path}.${childKey}`);
            toReturn = obj;
        }
        const p = path.split(".").reduce((o, k) => o?.[k], this.toObject());
        if (conf.immutable && !isNone(p) && p !== value)
            throw new Error(`Cannot change immutable property '${path}'`);
        if (typeof conf.validate === "function")
            conf.validate(toReturn);
        return toReturn;
    }
    validateType(conf, value, path) {
        if (!conf.type)
            throw new Error(`Missing type configuration at '${path}'`);
        if (conf.beforeChecks && typeof conf.beforeChecks === "function") {
            const newVal = conf.beforeChecks(value);
            if (isNone(newVal) || conf.optional)
                value = newVal;
        }
        if (isNone(value)) {
            if (!isNone(conf.default))
                value = typeof conf.default === 'function' ? conf.default() : conf.default;
            if (!conf.optional && isNone(value))
                throw new Error(`Missing required property at '${path}'`);
            if (conf.optional && isNone(value))
                return { conf, value };
        }
        if (value.constructor !== conf.type) {
            // Attempt to coerce the value to the correct type if possible. Valuable for date strings from a json for example
            value = new conf.type(value);
            if (value.constructor !== conf.type || isNaN(value))
                throw new Error(`Invalid type at '${path}', expected ${conf.type.name}, got ${value.constructor.name}`);
        }
        if (conf.maxLength && value.length > conf.maxLength)
            throw new Error(`Value too large for '${path}', maximum characters: ${conf.maxLength}`);
        if (conf.minLength && value.length < conf.minLength)
            throw new Error(`Value too small for '${path}', minimum characters: ${conf.minLength}`);
        if (conf.enum && !conf.enum.includes(value))
            throw new Error(`Invalid value for '${path}', expected one of: ${conf.enum.join(", ")}`);
        if (conf.afterChecks && typeof conf.afterChecks === "function") {
            const newVal = conf.afterChecks(value);
            if (isNone(newVal) || conf.optional)
                value = newVal;
        }
        return { conf, value };
    }
}
_Base_store = new WeakMap();
export default Base;
