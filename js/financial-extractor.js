/******************************************************************************
 * ============================================================================
 * Enterprise Performance Intelligence™
 * ============================================================================
 *
 * Module ID       : FIPE-3
 * Module Name     : Financial Intelligence Extractor™
 * File            : financial-extractor.js
 *
 * Release         : RC1
 * Version         : 1.0.0
 * Status          : Production Candidate
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Converts Enterprise Document Contracts™ into structured financial facts.
 *
 * SHALL
 *
 * ✓ Detect financial statements
 * ✓ Detect financial sections
 * ✓ Detect financial tables
 * ✓ Recognize financial entities
 * ✓ Map accounts
 * ✓ Build Canonical Financial Model
 * ✓ Preserve traceability
 *
 * SHALL NOT
 *
 * ✗ Calculate ratios
 * ✗ Generate recommendations
 * ✗ Call LLMs
 * ✗ Produce Executive Intelligence Briefs
 *
 ******************************************************************************/

"use strict";
/*=============================================================================
    MODULE INFORMATION
=============================================================================*/

const FIPE3_INFO = Object.freeze({

    module: "FIPE-3",

    component: "Financial Intelligence Extractor",

    version: "1.0.0",

    release: "RC1",

    status: "Production Candidate",

    buildDate: "2026-07"

});
/*=============================================================================
    CONFIGURATION
=============================================================================*/

const ExtractorConfiguration = Object.freeze({

    detectStatements: true,

    detectSections: true,

    detectTables: true,

    detectEntities: true,

    mapAccounts: true,

    preserveCoordinates: true,

    preserveConfidence: true,

    preserveAuditTrail: true

});
/*=============================================================================
    FINANCIAL STATEMENTS
=============================================================================*/

const StatementType = Object.freeze({

    BALANCE_SHEET: "Balance Sheet",

    PROFIT_AND_LOSS: "Profit & Loss",

    CASH_FLOW: "Cash Flow",

    EQUITY: "Statement of Changes in Equity",

    NOTES: "Notes to Accounts",

    AUDITOR: "Auditor Report",

    MANAGEMENT: "Management Discussion",

    ESG: "ESG",

    UNKNOWN: "Unknown"

});
/*=============================================================================
    FINANCIAL SECTIONS
=============================================================================*/

const FinancialSection = Object.freeze({

    CURRENT_ASSETS: "Current Assets",

    NON_CURRENT_ASSETS: "Non-Current Assets",

    CURRENT_LIABILITIES: "Current Liabilities",

    NON_CURRENT_LIABILITIES: "Non-Current Liabilities",

    EQUITY: "Equity",

    REVENUE: "Revenue",

    EXPENSES: "Expenses",

    CASHFLOW_OPERATING: "Operating Activities",

    CASHFLOW_INVESTING: "Investing Activities",

    CASHFLOW_FINANCING: "Financing Activities",

    UNKNOWN: "Unknown"

});
/*=============================================================================
    FINANCIAL ENTITIES
=============================================================================*/

const FinancialEntityType = Object.freeze({

    ACCOUNT: "Account",

    VALUE: "Value",

    CURRENCY: "Currency",

    PERIOD: "Reporting Period",

    NOTE_REFERENCE: "Note Reference",

    PERCENTAGE: "Percentage",

    DATE: "Date"

});
/*=============================================================================
    CONFIDENCE
=============================================================================*/

const ConfidenceLevel = Object.freeze({

    VERY_HIGH: 0.95,

    HIGH: 0.85,

    MEDIUM: 0.70,

    LOW: 0.50,

    UNKNOWN: 0.00

});
/*=============================================================================
    EVENTS
=============================================================================*/

const ExtractorEvents = Object.freeze({

    INITIALIZED: "extractor:initialized",

    CONTRACT_RECEIVED: "extractor:contract",

    STATEMENT_DETECTED: "extractor:statement",

    SECTION_DETECTED: "extractor:section",

    ENTITY_DETECTED: "extractor:entity",

    ACCOUNT_MAPPED: "extractor:account",

    MODEL_READY: "extractor:model",

    ERROR: "extractor:error"

});
/*=============================================================================
    LOGGER
=============================================================================*/

class ExtractorLogger {

    static info(...args) {

        console.info("[FIPE-3]", ...args);

    }

    static warn(...args) {

        console.warn("[FIPE-3]", ...args);

    }

    static error(...args) {

        console.error("[FIPE-3]", ...args);

    }

}

class ExtractorUtils {

    static now() {

        return new Date().toISOString();

    }

}
/*=============================================================================
    CANONICAL FINANCIAL RECORD
=============================================================================*/

function createFinancialRecord() {

    return {

        statement: "",

        section: "",

        account: "",

        canonicalAccount: "",

        rawValue: null,

        value: null,

        currency: "",

        period: "",

        unit: "",

        page: 0,

        tableId: "",

        row: -1,

        column: -1,

        confidence: ConfidenceLevel.UNKNOWN,

        sourceText: "",

        extractionMethod: "",

        coordinates: null

    };

}
/*=============================================================================
    CANONICAL FINANCIAL MODEL
=============================================================================*/

function createFinancialModel() {

    return {

    version: "1.0.0",

    generatedAt: new Date().toISOString(),

    statements: [],

    entities: [],

    tables: [],

    records: [],

    knowledgeGraph: {

        version: "1.0.0",

        nodes: [],

        relationships: []

    },

    statistics: {

        statements: 0,

        tables: 0,

        records: 0

    },

    audit: {}

};


}
/*=============================================================================
    CORE FINANCIAL INTELLIGENCE EXTRACTOR
=============================================================================*/

class FinancialExtractor {

    /*=========================================================================
        CONSTRUCTOR
    =========================================================================*/

    constructor(configuration = {}) {

        this.module = FIPE3_INFO.module;

        this.component = FIPE3_INFO.component;

        this.version = FIPE3_INFO.version;

        this.release = FIPE3_INFO.release;

        this.configuration = {

            ...ExtractorConfiguration,

            ...configuration

        };

        this.initialized = false;

        this.contract = null;

        this.financialModel = createFinancialModel();

        this.statistics = {

            contractsReceived: 0,

            statementsDetected: 0,

            entitiesDetected: 0,

            recordsCreated: 0,

            failed: 0

        };

        this.events = {};

        ExtractorLogger.info(

            `${this.component} constructed.`

        );

    }
    /*=========================================================================
        INITIALIZATION
    =========================================================================*/

    initialize() {

        if (this.initialized) {

            return;

        }

        this.registerDefaultEvents();

        this.connectDocumentReader();

        this.initialized = true;

        this.emit(

            ExtractorEvents.INITIALIZED,

            {

                version: this.version

            }

        );

        ExtractorLogger.info(

            "Financial Extractor initialized."

        );

    }
        /*=========================================================================
        FIPE-2 INTEGRATION
    =========================================================================*/

    connectDocumentReader() {

        if (!window.DocumentReader) {

            ExtractorLogger.warn(

                "Document Reader unavailable."

            );

            return;

        }

        window.DocumentReader.on(

            ReaderEvents.HANDOFF_READY,

            contract => {

                this.receiveContract(contract);

            }

        );

        ExtractorLogger.info(

            "Connected to FIPE-2."

        );

    }
        /*=========================================================================
        CONTRACT RECEPTION
    =========================================================================*/

    receiveContract(contract) {

        if (!contract) {

            ExtractorLogger.error(

                "No Enterprise Document Contract received."

            );

            return;

        }

        this.contract = contract;

        this.statistics.contractsReceived++;

        this.emit(

            ExtractorEvents.CONTRACT_RECEIVED,

            contract

        );

        ExtractorLogger.info(

            "Enterprise Document Contract received."

        );
document.dispatchEvent(

    new CustomEvent(

        "epi:extractor-start",

        {

            detail: {

                module: this.module

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
        MODEL ACCESS
    =========================================================================*/

    getFinancialModel() {

        return this.financialModel;

    }

    resetFinancialModel() {

        this.financialModel =

            createFinancialModel();

    }
        /*=========================================================================
        DIAGNOSTICS
    =========================================================================*/

    diagnostics() {

        return {

            information: FIPE3_INFO,

            statistics: this.statistics,

            initialized: this.initialized,

            contractLoaded:

                this.contract !== null

        };

    }

    healthCheck() {

        return {

            initialized: this.initialized,

            contractsReceived:

                this.statistics.contractsReceived,

            records:

                this.statistics.recordsCreated

        };

    }
        /*=========================================================================
        LIFECYCLE
    =========================================================================*/

    reset() {

        this.contract = null;

        this.resetFinancialModel();

        this.statistics = {

            contractsReceived: 0,

            statementsDetected: 0,

            entitiesDetected: 0,

            recordsCreated: 0,

            failed: 0

        };

    }
        /*=========================================================================
        FINANCIAL STATEMENT CLASSIFICATION
    =========================================================================*/

    classifyStatements() {

        if (!this.contract || !this.contract.document) {

            ExtractorLogger.warn(

                "No Enterprise Document Contract loaded."

            );

            return [];

        }

        const pages = this.contract.document.pages || [];

        const detectedStatements = [];

        pages.forEach(page => {

            const statement = this.detectStatement(page);

            if (statement !== StatementType.UNKNOWN) {

                detectedStatements.push({

                    page: page.pageNumber,

                    statement: statement,

                    confidence: ConfidenceLevel.HIGH

                });

                this.statistics.statementsDetected++;

                this.emit(

                    ExtractorEvents.STATEMENT_DETECTED,

                    statement

                );

            }

        });

        this.financialModel.statements = detectedStatements;

        return detectedStatements;

    }
    /*=========================================================================
    STATEMENT DETECTION
=========================================================================*/

detectStatement(page) {

    const text =

        (page.text || "").toLowerCase();

    if (text.includes("balance sheet")) {

        return StatementType.BALANCE_SHEET;

    }

    if (

        text.includes("statement of profit") ||

        text.includes("profit and loss")

    ) {

        return StatementType.PROFIT_AND_LOSS;

    }

    if (text.includes("cash flow")) {

        return StatementType.CASH_FLOW;

    }

    if (

        text.includes("statement of changes in equity")

    ) {

        return StatementType.EQUITY;

    }

    if (text.includes("notes to accounts")) {

        return StatementType.NOTES;

    }

    if (text.includes("independent auditor")) {

        return StatementType.AUDITOR;

    }

    if (text.includes("management discussion")) {

        return StatementType.MANAGEMENT;

    }

    if (

        text.includes("esg") ||

        text.includes("sustainability")

    ) {

        return StatementType.ESG;

    }

    return StatementType.UNKNOWN;

}

        /*=========================================================================
        FINANCIAL TABLE EXTRACTION
    =========================================================================*/

    extractFinancialTables() {

        if (!this.contract || !this.contract.document) {

            ExtractorLogger.warn(
                "No Enterprise Document Contract loaded."
            );

            return [];

        }

        const document = this.contract.document;

        const tables = document.tables || [];

        const extractedTables = [];

        tables.forEach((table, index) => {

            const financialTable = this.buildFinancialTable(

                table,

                index + 1

            );

            extractedTables.push(financialTable);

        });

        this.financialModel.tables = extractedTables;

        return extractedTables;

    }
      
        /*=========================================================================
        TABLE BUILDER
    =========================================================================*/

    buildFinancialTable(table, tableId) {

        return {

            id: `TABLE-${tableId}`,

            page: table.page || 0,

            title: table.title || "",

            headers: this.extractHeaders(table),

            rows: this.extractRows(table),

            columns: this.extractColumns(table),

            metadata: {

                confidence:

                    table.confidence ||

                    ConfidenceLevel.HIGH,

                extractedBy: this.component,

                extractedAt:

                    ExtractorUtils.now()

            }

        };

    }
        /*=========================================================================
        HEADER EXTRACTION
    =========================================================================*/

    extractHeaders(table) {

        if (!table.headers) {

            return [];

        }

        return [...table.headers];

    }
        /*=========================================================================
        ROW EXTRACTION
    =========================================================================*/

    extractRows(table) {

        if (!table.rows) {

            return [];

        }

        return table.rows.map(

            (row, index) => ({

                index,

                values: [...row]

            })

        );

    }
        /*=========================================================================
        COLUMN EXTRACTION
    =========================================================================*/

    extractColumns(table) {

        if (

            !table.headers ||

            table.headers.length === 0

        ) {

            return [];

        }

        return table.headers.map(

            (header, index) => ({

                index,

                name: header

            })

        );

    }
        /*=========================================================================
        TABLE LOOKUP
    =========================================================================*/

    getFinancialTables() {

        return this.financialModel.tables || [];

    }

    getFinancialTable(id) {

        return (

            this.financialModel.tables || []

        ).find(

            table => table.id === id

        );

    }
        /*=========================================================================
        TABLE VALIDATION
    =========================================================================*/

    validateFinancialTables() {

        return (

            this.financialModel.tables &&

            this.financialModel.tables.length > 0

        );

    }
        /*=========================================================================
        TABLE SUMMARY
    =========================================================================*/

    summarizeFinancialTables() {

        return {

            detected:

                this.financialModel.tables.length,

            tables:

                this.financialModel.tables

        };

    }
        /*=========================================================================
        FINANCIAL FACT EXTRACTION
    =========================================================================*/

    extractFinancialFacts() {

    const tables =
        this.getFinancialTables();

    const records = [];

    tables.forEach(table => {

        /*
         * Identify columns whose headers explicitly
         * represent financial reporting periods.
         *
         * Example:
         *
         * Account | Note | FY2025 | FY2024
         *
         * Period columns:
         * 2 → FY2025
         * 3 → FY2024
         */
        const periodColumns = [];

        if (
            Array.isArray(table.headers)
        ) {

            table.headers.forEach(
                (header, columnIndex) => {

                    if (
                        this.isFinancialPeriodHeader(
                            header
                        )
                    ) {

                        periodColumns.push(
                            columnIndex
                        );

                    }

                }
            );

        }

        table.rows.forEach(row => {

            /*
             * Preferred path:
             * Extract one record for every
             * explicitly recognized period column.
             */
            if (
                periodColumns.length > 0
            ) {

                periodColumns.forEach(
                    columnIndex => {

                        const record =
                            this.extractFinancialRecord(
                                row,
                                table,
                                columnIndex
                            );

                        if (record) {

                            records.push(record);

                            this.statistics
                                .recordsCreated++;

                        }

                    }
                );

                return;

            }

            /*
             * Backward-compatible fallback:
             *
             * If the source table contains no
             * recognizable period headers,
             * preserve existing RC1 behavior
             * by extracting column index 1.
             *
             * No period is invented.
             */
            const record =
                this.extractFinancialRecord(
                    row,
                    table
                );

            if (record) {

                records.push(record);

                this.statistics
                    .recordsCreated++;

            }

        });

    });

    this.financialModel.records =
        records;

    return records;

}
        /*=========================================================================
        FINANCIAL RECORD BUILDER
    =========================================================================*/
    /**
     * Determine whether a table header represents
     * a recognizable financial reporting period.
     *
     * This method performs structural recognition only.
     * It does not infer or fabricate missing periods.
     */
    isFinancialPeriodHeader(header) {

        if (
            header === null ||
            header === undefined
        ) {

            return false;

        }

        const value =
            String(header)
                .trim();

        if (!value) {

            return false;

        }

        /*
         * Calendar year:
         * 2025
         */
        if (
            /^(19|20)\d{2}$/.test(value)
        ) {

            return true;

        }

        /*
         * Fiscal year:
         * FY2025
         * FY 2025
         */
        if (
            /^FY\s*(19|20)\d{2}$/i.test(value)
        ) {

            return true;

        }

        /*
         * Year ranges:
         * 2024/25
         * 2024-25
         * 2024/2025
         * 2024-2025
         */
        if (
            /^(19|20)\d{2}\s*[\/-]\s*(\d{2}|(19|20)\d{2})$/.test(
                value
            )
        ) {

            return true;

        }

        return false;

    }

    extractFinancialRecord(row, table, columnIndex = 1) {

        if (

            !row ||

            row.values.length < 2

        ) {

            return null;

        }

        const record =

            createFinancialRecord();

        record.account =

            String(

                row.values[0] ?? ""

            ).trim();

        record.rawValue =
    row.values[columnIndex] ?? null;

record.value =
    this.parseFinancialValue(
        record.rawValue
    );

        record.statement =

            this.identifyStatement(

                table

            );

        record.section =

            FinancialSection.UNKNOWN;

        record.page = table.page;

        record.tableId = table.id;

        record.row = row.index;

        record.column = columnIndex;

        if (
    table.headers &&
    this.isFinancialPeriodHeader(
        table.headers[columnIndex]
    )
) {

    record.period =
        String(
            table.headers[columnIndex]
        ).trim();

}

        record.confidence =

            ConfidenceLevel.HIGH;

        record.sourceText =

            row.values.join(" ");

        record.extractionMethod =

            "Structured Table";

        return record;

    }
        /*=========================================================================
        VALUE PARSER
    =========================================================================*/

    parseFinancialValue(value) {

        if (

            value === null ||

            value === undefined

        ) {

            return null;

        }

        if (

            typeof value === "number"

        ) {

            return value;

        }

        const cleaned =

            String(value)

                .replace(/,/g, "")

                .replace(/[₹$€£]/g, "")

                .trim();

        const parsed =

            Number(cleaned);

        return Number.isNaN(parsed)

            ? null

            : parsed;

    }
        /*=========================================================================
        STATEMENT IDENTIFIER
    =========================================================================*/

    identifyStatement(table) {

        const statements = this.financialModel.statements || [];

const statement = statements.find(

    s => s.page === table.page

);


        return statement

            ? statement.statement

            : StatementType.UNKNOWN;

    }
        /*=========================================================================
        RECORD VALIDATION
    =========================================================================*/

    validateFinancialRecord(record) {

        return (

            record &&

            record.account !== "" &&

            record.value !== null

        );

    }
        /*=========================================================================
        RECORD LOOKUP
    =========================================================================*/

    getFinancialRecords() {

        return this.financialModel.records;

    }

    getFinancialRecord(account) {

        return this.financialModel.records.find(

            record =>

                record.account === account

        );

    }
        /*=========================================================================
        RECORD SUMMARY
    =========================================================================*/

    summarizeFinancialRecords() {

        return {

            records:

                this.financialModel.records.length,

            accounts:

                this.financialModel.records.map(

                    record => record.account

                )

        };

    }
    /*=============================================================================
    CANONICAL ACCOUNT DICTIONARY
=============================================================================*/

getCanonicalDictionary() {

    return {

        "trade receivables": "Accounts Receivable",

        "accounts receivable": "Accounts Receivable",

        "receivables": "Accounts Receivable",

        "debtors": "Accounts Receivable",

        "sundry debtors": "Accounts Receivable",

        "inventory": "Inventory",

        "inventories": "Inventory",

        "stock": "Inventory",

        "stock in trade": "Inventory",

        "finished goods": "Inventory",

        "cash": "Cash and Cash Equivalents",

        "cash equivalents": "Cash and Cash Equivalents",

        "bank balances": "Cash and Cash Equivalents",

        "trade payables": "Accounts Payable",

        "accounts payable": "Accounts Payable",

        "creditors": "Accounts Payable",

        "borrowings": "Borrowings",

        "loans": "Borrowings",

        "property plant equipment": "Property, Plant and Equipment",

        "ppe": "Property, Plant and Equipment"

    };

}
/*=============================================================================
    CANONICAL ACCOUNT MAPPING
=============================================================================*/

mapCanonicalAccounts() {

    const dictionary =

        this.getCanonicalDictionary();

    const records = this.financialModel.records || [];

records.forEach(

        record => {

            const key =

                record.account

                    .toLowerCase()

                    .trim();

            record.canonicalAccount =

                dictionary[key] ||

                record.account;

            this.emit(

                ExtractorEvents.ACCOUNT_MAPPED,

                record

            );

        }

    );

}
/*=============================================================================
    LOOKUP
=============================================================================*/

findCanonicalAccount(accountName) {

    const dictionary =

        this.getCanonicalDictionary();

    const key =

        accountName

            .toLowerCase()

            .trim();

    return dictionary[key] ||

        accountName;

}
/*=============================================================================
    REVERSE LOOKUP
=============================================================================*/

findOriginalAccounts(canonicalAccount) {

    return this.financialModel.records.filter(

        record =>

            record.canonicalAccount ===

            canonicalAccount

    );

}
/*=============================================================================
    VALIDATION
=============================================================================*/

validateCanonicalMapping() {

    return this.financialModel.records.every(

        record =>

            record.canonicalAccount !== ""

    );

}
/*=============================================================================
    SUMMARY
=============================================================================*/

summarizeCanonicalAccounts() {

    const summary = {};

    this.financialModel.records.forEach(

        record => {

            const key =

                record.canonicalAccount;

            summary[key] =

                (summary[key] || 0) + 1;

        }

    );

    return summary;

}
/*=============================================================================
    ENTERPRISE FINANCIAL KNOWLEDGE GRAPH
=============================================================================*/

buildFinancialKnowledgeGraph() {

    this.financialModel.knowledgeGraph = {

        version: "1.0.0",

        generatedAt: ExtractorUtils.now(),

        nodes: [],

        relationships: []

    };

    const records = this.financialModel.records || [];

records.forEach(record => {

        this.addFinancialNode(record);

    });

    return this.financialModel.knowledgeGraph;

}
/*=============================================================================
    NODE BUILDER
=============================================================================*/

addFinancialNode(record) {

    const graph = this.financialModel.knowledgeGraph;

    const nodeId =

        `NODE-${graph.nodes.length + 1}`;

    graph.nodes.push({

        id: nodeId,

        type: "FinancialFact",

        account: record.account,

        canonicalAccount: record.canonicalAccount,

        value: record.value,

        statement: record.statement,

        section: record.section,

        page: record.page,

        confidence: record.confidence

    });

}
/*=============================================================================
    RELATIONSHIP BUILDER
=============================================================================*/

buildRelationships() {

    const graph =

        this.financialModel.knowledgeGraph;

    const nodes = graph.nodes || [];

nodes.forEach(node => {

        graph.relationships.push({

            source: node.id,

            target: node.canonicalAccount,

            relation: "MAPS_TO"

        });

    });

}
/*=============================================================================
    VALIDATION
=============================================================================*/

validateKnowledgeGraph() {

    const graph =

        this.financialModel.knowledgeGraph;

    return (

        graph &&

        graph.nodes.length > 0

    );

}
/*=============================================================================
    SUMMARY
=============================================================================*/

summarizeKnowledgeGraph() {

    const graph =

        this.financialModel.knowledgeGraph;

    return {

        nodes:

            graph.nodes.length,

        relationships:

            graph.relationships.length

    };

}
/*=============================================================================
    MODEL FINALIZATION
=============================================================================*/

finalizeFinancialModel() {

    this.buildFinancialKnowledgeGraph();

    this.buildRelationships();
    /*
     * Synchronize final Financial Model statistics.
     *
     * These counts are derived from the completed model immediately
     * before downstream handoff to FIPE-4.
     */
    this.financialModel.statistics = {

        statements:
            this.financialModel.statements.length,

        tables:
            this.financialModel.tables.length,

        records:
            this.financialModel.records.length

    };

    this.financialModel.audit = {

        extractor: this.component,

        version: this.version,

        completedAt: ExtractorUtils.now()

    };

    this.emit(

        ExtractorEvents.MODEL_READY,

        this.financialModel

    );

    ExtractorLogger.info(

        "Enterprise Financial Knowledge Graph created."

    );
    document.dispatchEvent(

    new CustomEvent(

        "epi:normalizer-start",

        {

            detail: {

                model: this.financialModel

            }

        }

    )

);
document.dispatchEvent(

    new CustomEvent(

        "epi:extractor-complete",

        {

            detail: {

                model: this.financialModel

            }

        }

    )

);

    return this.financialModel;

}
/*=============================================================================
    END OF FINANCIAL EXTRACTOR CLASS
=============================================================================*/

}

/*=============================================================================
    MODULE REGISTRY
=============================================================================*/

window.EPI = window.EPI || {};

window.EPI.Modules = window.EPI.Modules || {};

window.EPI.Modules.FinancialExtractor =

    new FinancialExtractor();

/*=============================================================================
    BACKWARD COMPATIBILITY
=============================================================================*/

window.FinancialExtractor =

    window.EPI.Modules.FinancialExtractor;

/*=============================================================================
    DOM INITIALIZATION
=============================================================================*/

document.addEventListener(

    "DOMContentLoaded",

    () => {

        ExtractorLogger.info(

            "Enterprise Performance Intelligence™"

        );

        ExtractorLogger.info(

            `Initializing ${FIPE3_INFO.component}`

        );

        window.FinancialExtractor.initialize();

        ExtractorLogger.info(

            "FIPE-3 successfully initialized."

        );

    }

);

/*=============================================================================
    DEBUG SUPPORT
=============================================================================*/

window.FIPE3 = {

    info() {

        return FIPE3_INFO;

    },

    diagnostics() {

        return window.FinancialExtractor.diagnostics();

    },

    health() {

        return window.FinancialExtractor.healthCheck();

    },

    model() {

        return window.FinancialExtractor.getFinancialModel();

    },

    records() {

        return window.FinancialExtractor.getFinancialRecords();

    },

    reset() {

        window.FinancialExtractor.reset();

    }

};

/*=============================================================================
    MODULE READY
=============================================================================*/

ExtractorLogger.info(

    "Financial Intelligence Extractor™ RC1 Loaded."

);

/*=============================================================================
    END OF FILE
=============================================================================*/
