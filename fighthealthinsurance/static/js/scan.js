import * as Tesseract from 'tesseract.js';
import * as PDFJS from "pdfjs-dist";
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
    const elem = document.getElementById("denial_text");
    if (elem != null) {
        elem.value += text;
    }
}
export const storeLocal = async function (evt) {
    const target = evt.target;
    if (target != null) {
        const name = target.id;
        const value = target.value;
        window.localStorage.setItem(name, value);
    }
};
const worker = await Tesseract.createWorker({
    corePath: '{% static  "js/node_modules/tesseract.js-core/tesseract-core.wasm.js" %}',
    workerPath: '{% static "js/node_modules/tesseract.js/dist/worker.min.js" %}',
    logger: function (m) { console.log(m); }
});
await worker.loadLanguage('eng');
await worker.initialize('eng');
await worker.setParameters({
    // @ts-ignore
    tessedit_pageseg_mode: Tesseract.PSM.PSM_AUTO_OSD,
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
const getPDFPageText = async (pdf, pageNo) => {
    const page = await pdf.getPage(pageNo);
    const tokenizedText = await page.getTextContent();
    // @ts-ignore
    const pageText = tokenizedText.items.map(token => token.str).join("");
    return pageText;
};
// @ts-ignore
export const getPDFText = async (source) => {
    // @ts-ignore
    Object.assign(window, { pdfjsWorker: PDFJSWorker }); // added to fit 2.3.0
    const pdf = await PDFJS.getDocument(source).promise;
    const maxPages = pdf.numPages;
    const pageTextPromises = [];
    for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
        pageTextPromises.push(getPDFPageText(pdf, pageNo));
    }
    const pageTexts = await Promise.all(pageTextPromises);
    return pageTexts.join(" ");
};
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
export const recognize = async function (evt) {
    const target = evt.target;
    const files = target.files;
    if (files == null) {
        return;
    }
    const file = files[0];
    if (isPDF(file)) {
        const reader = new FileReader();
        reader.onload = async function (ez) {
            reader.readAsDataURL(file);
            const dataURI = reader.result;
            const bins = convertDataURIToBinary(dataURI);
            const doc = PDFJS.getDocument(bins);
            const ret = await getPDFText(doc);
            addText(ret);
        };
    }
    else {
        const ret = await worker.recognize(file);
        console.log(ret.data.text);
        addText(ret.data.text);
    }
};
const elm = document.getElementById('uploader');
if (elm != null) {
    elm.addEventListener('change', recognize);
}
// Restore previous local values
var inp = document.getElementsByTagName('input');
var nodes = document.querySelectorAll("input[type=text]");
console.log(nodes);
for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.id.startsWith('store_')) {
        node.addEventListener('change', storeLocal);
        const storedValue = window.localStorage.getItem(nodes[i].id);
        if (node.value == "" && storedValue != null) {
            node.value = storedValue;
        }
    }
}
export function validateForm(form) {
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
