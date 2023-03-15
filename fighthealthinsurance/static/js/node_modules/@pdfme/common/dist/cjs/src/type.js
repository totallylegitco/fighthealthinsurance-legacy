"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBarcodeSchema = exports.isImageSchema = exports.isTextSchema = exports.schemaTypes = void 0;
const schema_js_1 = require("./schema.js");
exports.schemaTypes = schema_js_1.schemaTypes;
const isTextSchema = (arg) => arg.type === 'text';
exports.isTextSchema = isTextSchema;
const isImageSchema = (arg) => arg.type === 'image';
exports.isImageSchema = isImageSchema;
const isBarcodeSchema = (arg) => schema_js_1.barcodeSchemaTypes.map((t) => t).includes(arg.type);
exports.isBarcodeSchema = isBarcodeSchema;
//# sourceMappingURL=type.js.map