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
export default class Base {
    [key: string]: any;
    static schema: SchemaDefinition;
    static version?: number;
    static immutable?: boolean;
    static parseConfig?: parserConfig;
    constructor(obj: Record<string, any>, parseConfig?: parserConfig);
    update(obj: Record<string, any>, parseConfig?: parserConfig, isNew?: boolean): void;
    toObject(): Record<string, any>;
    private setProperties;
    private runValidate;
    private validateType;
}
