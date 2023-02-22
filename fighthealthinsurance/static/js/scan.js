"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.validateForm = exports.recognize = exports.getPDFText = exports.storeLocal = void 0;
var Tesseract = require("tesseract.js");
var pdfjs_dist_1 = require("pdfjs-dist");
var scrubRegex = [
    [new RegExp("^\\W*patents?:?\\s+\\w+", "gmi"), "Patient: patient_name"],
    [new RegExp("^\\W*patients?:?\\s+\\w+", "gmi"), "Patient: patient_name"],
    [new RegExp("^\\W*member:\\s+\\w+", "gmi"), "Member: member_name"],
    [new RegExp("^\\W*member:\\s+\\w+\\s+\\w+", "gmi"), "Member: member_name"],
    [new RegExp("^\\W*dear\\s+\\w+\\s+\\w+\\W?$", "gmi"), "Dear patient_name"],
    [new RegExp("^\\W*dear\\s+\\w+\\s+\\w+\\s*\.?\\w+\\W?$", "gmi"), "Dear patient_name"],
    [new RegExp("^\\W*dear\\s+\\w+\\W?$", "gmi"), "Dear patient_name"],
];
function scrubText(text) {
    var reservedTokens = [];
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.id.startsWith('store_') && node.value != "") {
            reservedTokens.push([new RegExp(node.value, "gi"),
                node.id]);
            for (var j = 0; j < nodes.length; j++) {
                var secondNode = nodes[j];
                if (secondNode.value != "") {
                    reservedTokens.push([new RegExp(node.value + secondNode.value, "gi"),
                        node.id + "_" + secondNode.id]);
                }
            }
        }
    }
    console.log("Scrubbing with:");
    console.log(reservedTokens);
    console.log(scrubRegex);
    for (var i = 0; i < scrubRegex.length; i++) {
        text = text.replace(scrubRegex[i][0], scrubRegex[i][1]);
    }
    for (var i = 0; i < reservedTokens.length; i++) {
        text = text.replace(reservedTokens[i][0], " " + reservedTokens[i][1]);
    }
    return text;
}
function addText(text) {
    text = scrubText(text);
    var elem = document.getElementById("denial_text");
    if (elem != null) {
        elem.value += text;
    }
}
var storeLocal = function (evt) {
    return __awaiter(this, void 0, void 0, function () {
        var target, name_1, value;
        return __generator(this, function (_a) {
            target = evt.target;
            if (target != null) {
                name_1 = target.id;
                value = target.value;
                window.localStorage.setItem(name_1, value);
            }
            return [2 /*return*/];
        });
    });
};
exports.storeLocal = storeLocal;
var worker = await Tesseract.createWorker({
    corePath: '{% static  "js/node_modules/tesseract.js-core/tesseract-core.wasm.js" %}',
    workerPath: '{% static "js/node_modules/tesseract.js/dist/worker.min.js" %}',
    logger: function (m) { console.log(m); }
});
await worker.loadLanguage('eng');
await worker.initialize('eng');
await worker.setParameters({
    // @ts-ignore
    tessedit_pageseg_mode: Tesseract.PSM.PSM_AUTO_OSD
});
function getExtension(file) {
    var parts = file.name.split('.');
    return parts[parts.length - 1];
}
function isPDF(file) {
    return (getExtension(file).toLowerCase() == "pdf" ||
        file.type.match('application/pdf'));
}
// @ts-ignore
var getPDFPageText = function (pdf, pageNo) { return __awaiter(void 0, void 0, void 0, function () {
    var page, tokenizedText, pageText;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, pdf.getPage(pageNo)];
            case 1:
                page = _a.sent();
                return [4 /*yield*/, page.getTextContent()];
            case 2:
                tokenizedText = _a.sent();
                pageText = tokenizedText.items.map(function (token) { return token.str; }).join("");
                return [2 /*return*/, pageText];
        }
    });
}); };
// @ts-ignore
var getPDFText = function (source) { return __awaiter(void 0, void 0, void 0, function () {
    var pdf, maxPages, pageTextPromises, pageNo, pageTexts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // @ts-ignore
                Object.assign(window, { pdfjsWorker: PDFJSWorker }); // added to fit 2.3.0
                return [4 /*yield*/, pdfjs_dist_1["default"].getDocument(source).promise];
            case 1:
                pdf = _a.sent();
                maxPages = pdf.numPages;
                pageTextPromises = [];
                for (pageNo = 1; pageNo <= maxPages; pageNo += 1) {
                    pageTextPromises.push(getPDFPageText(pdf, pageNo));
                }
                return [4 /*yield*/, Promise.all(pageTextPromises)];
            case 2:
                pageTexts = _a.sent();
                return [2 /*return*/, pageTexts.join(" ")];
        }
    });
}); };
exports.getPDFText = getPDFText;
// @ts-ignore
function convertDataURIToBinary(dataURI) {
    var BASE64_MARKER = ";base64,";
    var base64Index = 28;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}
var recognize = function (evt) {
    return __awaiter(this, void 0, void 0, function () {
        var target, files, file, reader_1, ret;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    target = evt.target;
                    files = target.files;
                    if (files == null) {
                        return [2 /*return*/];
                    }
                    file = files[0];
                    if (!isPDF(file)) return [3 /*break*/, 1];
                    reader_1 = new FileReader();
                    reader_1.onload = function (ez) {
                        return __awaiter(this, void 0, void 0, function () {
                            var dataURI, bins, doc, ret;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        reader_1.readAsDataURL(file);
                                        dataURI = reader_1.result;
                                        bins = convertDataURIToBinary(dataURI);
                                        doc = pdfjs_dist_1["default"].getDocument(bins);
                                        return [4 /*yield*/, (0, exports.getPDFText)(doc)];
                                    case 1:
                                        ret = _a.sent();
                                        addText(ret);
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, worker.recognize(file)];
                case 2:
                    ret = _a.sent();
                    console.log(ret.data.text);
                    addText(ret.data.text);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
};
exports.recognize = recognize;
var elm = document.getElementById('uploader');
if (elm != null) {
    elm.addEventListener('change', exports.recognize);
}
// Restore previous local values
var inp = document.getElementsByTagName('input');
var nodes = document.querySelectorAll("input[type=text]");
console.log(nodes);
for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.id.startsWith('store_')) {
        node.addEventListener('change', exports.storeLocal);
        var storedValue = window.localStorage.getItem(nodes[i].id);
        if (node.value == "" && storedValue != null) {
            node.value = storedValue;
        }
    }
}
function validateForm(form) {
    if (!form.privacy.checked) {
        document.getElementById('agree_chk_error').style.visibility = 'visible';
        return false;
    }
    else if (!form.pii.checked) {
        document.getElementById('pii_error').style.visibility = 'visible';
    }
    else {
        document.getElementById('agree_chk_error').style.visibility = 'hidden';
        document.getElementById('pii_error').style.visibility = 'hidden';
        return true;
    }
}
exports.validateForm = validateForm;
