export interface FieldConfig {
    type: any;
    optional?: boolean;
    default?: any;
    enum?: any[];
    maxLength?: number;
    minLength?: number;
    beforeValidate?: (value: any) => any;
    validate?: (value: any) => void;
    afterValidate?: (value: any) => any;
    children?: Record<string, FieldConfig>;
    child?: FieldConfig;
}
export interface SchemaDefinition {
    [key: string]: FieldConfig;
}
export default class Base {
    [key: string]: any;
    static schema: SchemaDefinition;
    static version?: number;
    constructor(obj: Record<string, any>, addVersion?: boolean);
    private setProperties;
    private runValidate;
    private validateType;
}
