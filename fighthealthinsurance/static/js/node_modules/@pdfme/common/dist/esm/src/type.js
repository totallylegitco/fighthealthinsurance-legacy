import { barcodeSchemaTypes, schemaTypes as _schemaTypes, } from './schema.js';
export const schemaTypes = _schemaTypes;
export const isTextSchema = (arg) => arg.type === 'text';
export const isImageSchema = (arg) => arg.type === 'image';
export const isBarcodeSchema = (arg) => barcodeSchemaTypes.map((t) => t).includes(arg.type);
//# sourceMappingURL=type.js.map