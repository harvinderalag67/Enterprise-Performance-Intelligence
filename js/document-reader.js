/******************************************************************************
 * ============================================================================
 * Enterprise Performance Intelligence™
 * ============================================================================
 *
 * Module ID          : FIPE-2
 * Module Name        : Document Reader™
 * File               : document-reader.js
 *
 * Release            : RC1
 * Version            : 1.0.0
 * Status             : Production Candidate
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * The Document Reader™ receives validated financial documents from FIPE-1
 * and converts them into a unified machine-readable representation.
 *
 * THIS MODULE SHALL
 *
 * ✓ Receive upload manifest
 * ✓ Identify document types
 * ✓ Read PDF documents
 * ✓ Read Excel workbooks
 * ✓ Read CSV files
 * ✓ Read scanned documents (OCR)
 * ✓ Extract document metadata
 * ✓ Extract document structure
 * ✓ Produce Unified Document Model
 * ✓ Hand off to FIPE-3
 *
 * THIS MODULE SHALL NOT
 *
 * ✗ Perform financial analysis
 * ✗ Calculate ratios
 * ✗ Call AI services
 * ✗ Generate Executive Intelligence Briefs
 *
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 *
 * FIPE-1
 * Upload Manager
 *      │
 *      ▼
 * FIPE-2
 * Document Reader
 *      │
 *      ▼
 * FIPE-3
 * Financial Extractor
 *
 *****************************************************************************/

"use strict";
/*=============================================================================
    MODULE INFORMATION
=============================================================================*/

const FIPE2_INFO = Object.freeze({

    module: "FIPE-2",

    component: "Document Reader",

    version: "1.0.0",

    release: "RC1",

    status: "Production Candidate",

    buildDate: "2026-07"

});
/*=============================================================================
    READER CONFIGURATION
=============================================================================*/

const ReaderConfiguration = Object.freeze({

    enablePDF: true,

    enableExcel: true,

    enableCSV: true,

    enableOCR: true,

    enableMetadata: true,

    enableImages: true,

    maxPages: 500,

    maxWorkbookSheets: 100,

    maxCSVRows: 100000,

    ocrLanguage: "eng"

});
/*=============================================================================
    DOCUMENT TYPES
=============================================================================*/

const DocumentType = Object.freeze({

    PDF: "pdf",

    XLSX: "xlsx",

    XLS: "xls",

    CSV: "csv",

    IMAGE: "image",

    UNKNOWN: "unknown"

});
/*=============================================================================
    READER STATUS
=============================================================================*/

const ReaderStatus = Object.freeze({

    IDLE: "Idle",

    LOADING: "Loading",

    READING: "Reading",

    NORMALIZING: "Normalizing",

    COMPLETED: "Completed",

    FAILED: "Failed"

});
/*=============================================================================
    PROCESSING STAGES
=============================================================================*/

const ReaderStage = Object.freeze({

    RECEIVE: "Receive",

    IDENTIFY: "Identify",

    READ: "Read",

    OCR: "OCR",

    NORMALIZE: "Normalize",

    HANDOFF: "Handoff",

    COMPLETE: "Complete"

});
/*=============================================================================
    EVENTS
=============================================================================*/

const ReaderEvents = Object.freeze({

    INITIALIZED: "reader:initialized",

    DOCUMENT_RECEIVED: "reader:received",

    DOCUMENT_IDENTIFIED: "reader:identified",

    DOCUMENT_READ: "reader:read",

    OCR_COMPLETED: "reader:ocr-completed",

    NORMALIZED: "reader:normalized",

    HANDOFF_READY: "reader:handoff",

    ERROR: "reader:error"

});
/*=============================================================================
    LOGGER
=============================================================================*/

class ReaderLogger {

    static info(...message) {

        console.info("[FIPE-2]", ...message);

    }

    static warn(...message) {

        console.warn("[FIPE-2]", ...message);

    }

    static error(...message) {

        console.error("[FIPE-2]", ...message);

    }

}
/*=============================================================================
    UTILITIES
=============================================================================*/

const ReaderUtils = {

    detectType(fileName) {

        const extension =

            fileName
                .split(".")
                .pop()
                .toLowerCase();

        switch (extension) {

            case "pdf":

                return DocumentType.PDF;

            case "xlsx":

                return DocumentType.XLSX;

            case "xls":

                return DocumentType.XLS;

            case "csv":

                return DocumentType.CSV;

            default:

                return DocumentType.UNKNOWN;

        }

    },

    createDocumentId() {

        return crypto.randomUUID();

    },

    now() {

        return new Date().toISOString();

    },

    deepClone(object) {

        return JSON.parse(

            JSON.stringify(object)

        );

    }

};
/*=============================================================================
    CORE DOCUMENT READER CLASS
=============================================================================*/

class DocumentReader {

    /*=========================================================================
        CONSTRUCTOR
    =========================================================================*/

    constructor(configuration = {}) {

        this.module = FIPE2_INFO.module;

        this.component = FIPE2_INFO.component;

        this.version = FIPE2_INFO.version;

        this.release = FIPE2_INFO.release;

        this.configuration = {

            ...ReaderConfiguration,

            ...configuration

        };

        this.initialized = false;

        this.status = ReaderStatus.IDLE;

        this.stage = ReaderStage.RECEIVE;

        this.sessionId = null;

        this.manifest = null;

        this.documents = [];

        this.currentDocument = null;

        this.statistics = {

            received: 0,

            identified: 0,

            read: 0,

            failed: 0

        };

        this.events = {};

        ReaderLogger.info(

            `${this.component} constructed.`

        );

    }

    /*=========================================================================
        INITIALIZATION
    =========================================================================*/

    initialize() {

        if (this.initialized) {

            ReaderLogger.warn(

                "Document Reader already initialized."

            );

            return;

        }

        this.registerDefaultEvents();

        this.connectUploadManager();

        this.initialized = true;

        this.status = ReaderStatus.IDLE;

        this.stage = ReaderStage.RECEIVE;

        this.emit(

            ReaderEvents.INITIALIZED,

            {

                version: this.version

            }

        );

        ReaderLogger.info(

            "Document Reader initialized."

        );

    }

    /*=========================================================================
        UPLOAD MANAGER INTEGRATION
    =========================================================================*/

    connectUploadManager() {

        if (!window.UploadManager) {

            ReaderLogger.warn(

                "Upload Manager not available."

            );

            return;

        }

        window.UploadManager.on(

            "document-reader:start",

            payload => {

                this.receiveManifest(payload);

            }

        );

        ReaderLogger.info(

            "Connected to FIPE-1."

        );

    }

    /*=========================================================================
        MANIFEST RECEPTION
    =========================================================================*/

    receiveManifest(payload) {

        if (!payload) {

            ReaderLogger.error(

                "No manifest received."

            );

            return;

        }

        this.sessionId = payload.sessionId;

        this.manifest = payload.manifest;

        this.stage = ReaderStage.RECEIVE;

        this.statistics.received++;

        this.emit(

            ReaderEvents.DOCUMENT_RECEIVED,

            payload

        );

        ReaderLogger.info(

            "Manifest received."

        );
document.dispatchEvent(

    new CustomEvent(

        "epi:reader-start",

        {

            detail: {

                sessionId: this.sessionId

            }

        }

    )

);

    }

    /*=========================================================================
        EVENT BUS
    =========================================================================*/

    registerDefaultEvents() {

        this.events = {};

    }

    on(eventName, callback) {

        if (!this.events[eventName]) {

            this.events[eventName] = [];

        }

        this.events[eventName].push(callback);

    }

    emit(eventName, payload = {}) {

        if (!this.events[eventName]) {

            return;

        }

        this.events[eventName].forEach(

            callback => callback(payload)

        );

    }

    off(eventName, callback) {

        if (!this.events[eventName]) {

            return;

        }

        this.events[eventName] =

            this.events[eventName].filter(

                listener => listener !== callback

            );

    }

    /*=========================================================================
        STATUS
    =========================================================================*/

    setStatus(status) {

        this.status = status;

    }

    setStage(stage) {

        this.stage = stage;

    }

    getStatus() {

        return this.status;

    }

    getStage() {

        return this.stage;

    }

    isInitialized() {

        return this.initialized;

    }
    /*=========================================================================
        DOCUMENT REGISTRY
    =========================================================================*/

    registerDocument(documentModel) {

        if (!documentModel) {

            ReaderLogger.warn(
                "Attempted to register an empty document."
            );

            return false;

        }

        this.documents.push(documentModel);

        this.currentDocument = documentModel;

        ReaderLogger.info(

            "Document registered:",

            documentModel.fileName

        );

        return true;

    }

    getDocuments() {

        return ReaderUtils.deepClone(

            this.documents

        );

    }

    getCurrentDocument() {

        return ReaderUtils.deepClone(

            this.currentDocument

        );

    }

    getDocumentCount() {

        return this.documents.length;

    }

    /*=========================================================================
        SESSION INFORMATION
    =========================================================================*/

    getSessionInformation() {

        return {

            sessionId: this.sessionId,

            initialized: this.initialized,

            status: this.status,

            stage: this.stage,

            documents: this.documents.length,

            statistics: ReaderUtils.deepClone(

                this.statistics

            )

        };

    }

    /*=========================================================================
        STATISTICS
    =========================================================================*/

    incrementIdentified() {

        this.statistics.identified++;

    }

    incrementRead() {

        this.statistics.read++;

    }

    incrementFailed() {

        this.statistics.failed++;

    }

    /*=========================================================================
        DIAGNOSTICS
    =========================================================================*/

    healthCheck() {

        return {

            module: this.module,

            component: this.component,

            version: this.version,

            initialized: this.initialized,

            status: this.status,

            stage: this.stage,

            documents: this.documents.length,

            sessionId: this.sessionId

        };

    }

    diagnostics() {

        return {

            information: FIPE2_INFO,

            configuration: ReaderUtils.deepClone(

                this.configuration

            ),

            statistics: ReaderUtils.deepClone(

                this.statistics

            ),

            session: this.getSessionInformation(),

            health: this.healthCheck()

        };

    }

    printDiagnostics() {

        ReaderLogger.info(

            "=========== FIPE-2 Diagnostics ==========="

        );

        console.table(

            this.healthCheck()

        );

        console.table(

            this.statistics

        );

    }

    /*=========================================================================
        LIFECYCLE
    =========================================================================*/

    reset() {

        this.status = ReaderStatus.IDLE;

        this.stage = ReaderStage.RECEIVE;

        this.sessionId = null;

        this.manifest = null;

        this.documents = [];

        this.currentDocument = null;

        this.statistics = {

            received: 0,

            identified: 0,

            read: 0,

            failed: 0

        };

        ReaderLogger.info(

            "Document Reader reset."

        );

    }

    destroy() {

        this.reset();

        this.events = {};

        this.initialized = false;

        ReaderLogger.info(

            "Document Reader destroyed."

        );

    }
        /*=========================================================================
        FILE DISPATCHER
    =========================================================================*/

    dispatchManifest() {

        if (!this.manifest) {

            ReaderLogger.warn(

                "No upload manifest available."

            );

            return false;

        }

        if (!Array.isArray(this.manifest.files)) {

            ReaderLogger.error(

                "Manifest does not contain a valid file list."

            );

            return false;

        }

        ReaderLogger.info(

            `Dispatching ${this.manifest.files.length} document(s).`

        );

        this.stage = ReaderStage.IDENTIFY;

        this.manifest.files.forEach(file => {

            this.dispatchFile(file);

        });

        return true;

    }

    /*=========================================================================
        FILE ROUTER
    =========================================================================*/

    dispatchFile(file) {

        const type = ReaderUtils.detectType(file.name);

        this.incrementIdentified();

        this.emit(

            ReaderEvents.DOCUMENT_IDENTIFIED,

            {

                fileName: file.name,

                type: type

            }

        );

        switch (type) {

            case DocumentType.PDF:

                this.dispatchPDF(file);

                break;

            case DocumentType.XLSX:

            case DocumentType.XLS:

                this.dispatchWorkbook(file);

                break;

            case DocumentType.CSV:

                this.dispatchCSV(file);

                break;

            case DocumentType.IMAGE:

                this.dispatchImage(file);

                break;

            default:

                this.rejectDocument(file);

        }

    }

    /*=========================================================================
        PDF DISPATCH
    =========================================================================*/

    dispatchPDF(file) {

        ReaderLogger.info(

            "Routing PDF:",

            file.name

        );

        this.emit(

            "reader:pdf",

            file

        );

    }

    /*=========================================================================
        WORKBOOK DISPATCH
    =========================================================================*/

    dispatchWorkbook(file) {

        ReaderLogger.info(

            "Routing Workbook:",

            file.name

        );

        this.emit(

            "reader:workbook",

            file

        );

    }

    /*=========================================================================
        CSV DISPATCH
    =========================================================================*/

    dispatchCSV(file) {

        ReaderLogger.info(

            "Routing CSV:",

            file.name

        );

        this.emit(

            "reader:csv",

            file

        );

    }

    /*=========================================================================
        IMAGE DISPATCH
    =========================================================================*/

    dispatchImage(file) {

        ReaderLogger.info(

            "Routing Image:",

            file.name

        );

        this.emit(

            "reader:image",

            file

        );

    }

    /*=========================================================================
        UNKNOWN DOCUMENT
    =========================================================================*/

    rejectDocument(file) {

        this.incrementFailed();

        ReaderLogger.warn(

            "Unsupported document:",

            file.name

        );

        this.emit(

            ReaderEvents.ERROR,

            {

                fileName: file.name,

                reason: "Unsupported document type."

            }

        );

    }
        /*=========================================================================
        DOCUMENT NORMALIZATION
    =========================================================================*/

    normalizeDocument(documentModel) {

        if (!documentModel) {

            ReaderLogger.warn(

                "No document supplied for normalization."

            );

            return null;

        }

        this.setStage(

            ReaderStage.NORMALIZE

        );

        ReaderLogger.info(

            "Normalizing document:",

            documentModel.fileName

        );

        documentModel = this.normalizeMetadata(

            documentModel

        );

        documentModel = this.normalizePages(

            documentModel

        );

        documentModel = this.normalizeTables(

            documentModel

        );

        documentModel = this.normalizeTextBlocks(

            documentModel

        );

        documentModel = this.normalizeWorkbook(

            documentModel

        );

        documentModel.normalized = true;

        this.emit(

            ReaderEvents.NORMALIZED,

            documentModel

        );
document.dispatchEvent(

    new CustomEvent(

        "epi:reader-complete",

        {

            detail: {

                sessionId: this.sessionId,

                document: documentModel

            }

        }

    )

);

        return documentModel;

    }
        /*=========================================================================
        METADATA NORMALIZATION
    =========================================================================*/

    normalizeMetadata(model) {

        model.metadata ??= {};

        model.metadata.normalizedAt =

            ReaderUtils.now();

        model.metadata.reader =

            this.component;

        model.metadata.version =

            this.version;

        return model;

    }
        /*=========================================================================
        PAGE NORMALIZATION
    =========================================================================*/

    normalizePages(model) {

        if (!Array.isArray(model.pages)) {

            model.pages = [];

        }

        model.pages.forEach(

            (page, index) => {

                page.pageNumber ||= index + 1;

                page.type ||= "page";

            }

        );

        return model;

    }
        /*=========================================================================
        TABLE NORMALIZATION
    =========================================================================*/

    normalizeTables(model) {

        if (!Array.isArray(model.tables)) {

            model.tables = [];

        }

        model.tables.forEach(

            table => {

                table.type ||= "financial-table";

                table.rows ||= [];

            }

        );

        return model;

    }
        /*=========================================================================
        TEXT BLOCK NORMALIZATION
    =========================================================================*/

    normalizeTextBlocks(model) {

        if (!Array.isArray(model.textBlocks)) {

            model.textBlocks = [];

        }

        model.textBlocks.forEach(

            block => {

                block.text ||= "";

                block.confidence ||= 100;

            }

        );

        return model;

    }
        /*=========================================================================
        WORKBOOK NORMALIZATION
    =========================================================================*/

    normalizeWorkbook(model) {

        if (!Array.isArray(model.workbook)) {

            model.workbook = [];

        }

        return model;

    }
        /*=========================================================================
        DOCUMENT VALIDATION
    =========================================================================*/

    validateNormalizedDocument(model) {

        return (

            model &&

            model.normalized === true &&

            model.metadata &&

            Array.isArray(model.pages) &&

            Array.isArray(model.tables) &&

            Array.isArray(model.textBlocks)

        );

    }
        /*=========================================================================
        ENTERPRISE DOCUMENT CONTRACT
    =========================================================================*/

    createEnterpriseDocumentContract(documentModel) {

        return {

            contractVersion: "1.0.0",

            platform: "Enterprise Performance Intelligence",

            module: this.module,

            generatedAt: ReaderUtils.now(),

            sessionId: this.sessionId,

            normalized: true,

            document: ReaderUtils.deepClone(documentModel)

        };

    }
        /*=========================================================================
        CONTRACT VALIDATION
    =========================================================================*/

    validateEnterpriseContract(contract) {

        if (!contract) {

            return false;

        }

        if (!contract.document) {

            return false;

        }

        if (!contract.contractVersion) {

            return false;

        }

        return true;

    }
        /*=========================================================================
        CONTRACT EXPORT
    =========================================================================*/

    exportEnterpriseContract(documentModel) {

        const contract =

            this.createEnterpriseDocumentContract(

                documentModel

            );

        if (

            !this.validateEnterpriseContract(

                contract

            )

        ) {

            ReaderLogger.error(

                "Enterprise Document Contract validation failed."

            );

            return null;

        }

        ReaderLogger.info(

            "Enterprise Document Contract created."

        );

        return contract;

    }
        /*=========================================================================
        FIPE-3 HANDOFF
    =========================================================================*/

    handoffToFinancialExtractor(documentModel) {

        const contract =

            this.exportEnterpriseContract(

                documentModel

            );

        if (!contract) {

            return false;

        }

        this.setStage(

            ReaderStage.HANDOFF

        );

        this.emit(

            ReaderEvents.HANDOFF_READY,

            contract

        );

        ReaderLogger.info(

            "Enterprise Document Contract ready for FIPE-3."

        );
document.dispatchEvent(

    new CustomEvent(

        "epi:reader-handoff",

        {

            detail: contract

        }

    )

);
        return true;

    }
    /*=============================================================================
    END OF DOCUMENT READER CLASS
=============================================================================*/

}

/*=============================================================================
    MODULE REGISTRY
=============================================================================*/

window.EPI = window.EPI || {};

window.EPI.Modules = window.EPI.Modules || {};

window.EPI.Modules.DocumentReader = new DocumentReader();

/*=============================================================================
    BACKWARD COMPATIBILITY
=============================================================================*/

window.DocumentReader =

    window.EPI.Modules.DocumentReader;

/*=============================================================================
    DOM INITIALIZATION
=============================================================================*/

document.addEventListener(

    "DOMContentLoaded",

    () => {

        ReaderLogger.info(

            "Enterprise Performance Intelligence™"

        );

        ReaderLogger.info(

            `Initializing ${FIPE2_INFO.component}`

        );

        window.DocumentReader.initialize();

        ReaderLogger.info(

            "FIPE-2 successfully initialized."

        );

    }

);

/*=============================================================================
    DEBUG SUPPORT
=============================================================================*/

window.FIPE2 = {

    info() {

        return FIPE2_INFO;

    },

    diagnostics() {

        return window.DocumentReader.diagnostics();

    },

    health() {

        return window.DocumentReader.healthCheck();

    },

    session() {

        return window.DocumentReader.getSessionInformation();

    },

    documents() {

        return window.DocumentReader.getDocuments();

    },

    reset() {

        window.DocumentReader.reset();

    }

};

/*=============================================================================
    MODULE READY
=============================================================================*/

ReaderLogger.info(

    "Financial Document Reader™ RC1 Loaded."

);

/*=============================================================================
    END OF FILE
=============================================================================*/
