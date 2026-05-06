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
export default class Base {
    #private;
    [key: string]: any;
    static schema: SchemaDefinition;
    static version?: number;
    static immutable?: boolean;
    constructor(obj: Record<string, any>);
    toObject(): Record<string, any>;
    update(obj: Record<string, any>): void;
    private setProperties;
    private runValidate;
    private validateType;
}
