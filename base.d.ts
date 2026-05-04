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
export default class Base {
    [key: string]: any;
    static schema: SchemaDefinition;
    static version?: number;
    constructor(obj: Record<string, any>, addVersion?: boolean);
    private setProperties;
    private runValidate;
    private validateType;
}
