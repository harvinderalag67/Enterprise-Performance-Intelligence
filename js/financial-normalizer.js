/********************************************************************
 *
 * ENTERPRISE PERFORMANCE INTELLIGENCE™
 *
 * FIPE-4 — FINANCIAL NORMALIZER™
 *
 * File:
 * financial-normalizer.js
 *
 * Release:
 * RC1
 *
 * Purpose:
 *
 * Transform FIPE-3 extracted financial evidence into a standardized,
 * auditable financial representation for downstream enterprise
 * intelligence processing.
 *
 * Core Principle:
 *
 * NORMALIZE INTERPRETATION.
 * NEVER DESTROY SOURCE EVIDENCE.
 *
 ********************************************************************/


/********************************************************************
 * SECTION 1
 * MODULE FOUNDATION AND CONTRACT
 ********************************************************************/


/********************************************************************
 * 1.1 MODULE IDENTITY
 ********************************************************************/

const FINANCIAL_NORMALIZER_VERSION = "1.0.0";

const FINANCIAL_NORMALIZER_COMPONENT =
    "FIPE-4 — Financial Normalizer";

const FINANCIAL_NORMALIZER_RELEASE =
    "RC1";


/********************************************************************
 * 1.2 EVENT CONTRACT
 ********************************************************************/

/*
 * FIPE-4 receives the completed Financial Model from FIPE-3 through:
 *
 *     epi:normalizer-start
 *
 * Expected payload:
 *
 *     event.detail.model
 *
 * FIPE-4 will later publish its completed normalized model through
 * the output events defined below.
 */

const FinancialNormalizerEvents = Object.freeze({

    INPUT:
        "epi:normalizer-start",

    STARTED:
        "epi:normalizer-started",

    MODEL_READY:
        "epi:normalized-model-ready",

    COMPLETE:
        "epi:normalizer-complete",

    ERROR:
        "epi:normalizer-error"

});


/********************************************************************
 * 1.3 NORMALIZER STATUS
 ********************************************************************/

const FinancialNormalizerStatus = Object.freeze({

    IDLE:
        "IDLE",

    INITIALIZING:
        "INITIALIZING",

    READY:
        "READY",

    NORMALIZING:
        "NORMALIZING",

    COMPLETE:
        "COMPLETE",

    ERROR:
        "ERROR"

});


/********************************************************************
 * 1.4 NORMALIZATION CONFIDENCE
 ********************************************************************/

/*
 * This confidence describes FIPE-4 normalization confidence only.
 *
 * It must remain separate from:
 *
 * - FIPE-3 extraction confidence
 * - Future enterprise-level Confidence Engine scoring
 */

const NormalizationConfidence = Object.freeze({

    HIGH:
        "HIGH",

    MEDIUM:
        "MEDIUM",

    LOW:
        "LOW",

    UNKNOWN:
        "UNKNOWN"

});


/********************************************************************
 * 1.5 NORMALIZATION SEVERITY
 ********************************************************************/

const NormalizationSeverity = Object.freeze({

    INFO:
        "INFO",

    WARNING:
        "WARNING",

    ERROR:
        "ERROR"

});


/********************************************************************
 * 1.6 INPUT CONTRACT
 ********************************************************************/

/*
 * FIPE-4 consumes the FIPE-3 Financial Model.
 *
 * Required minimum structure:
 *
 * {
 *     statements: [],
 *     tables: [],
 *     records: []
 * }
 *
 * Individual records may contain:
 *
 * {
 *     statement,
 *     section,
 *     account,
 *     canonicalAccount,
 *     rawValue,
 *     value,
 *     currency,
 *     period,
 *     unit,
 *     page,
 *     tableId,
 *     row,
 *     column,
 *     coordinates,
 *     confidence,
 *     sourceText,
 *     extractionMethod
 * }
 *
 * Missing optional evidence MUST NOT be fabricated.
 */


/********************************************************************
 * 1.7 NORMALIZED RECORD CONTRACT
 ********************************************************************/

function createNormalizedFinancialRecord() {

    return {

        /*
         * Normalized interpretation
         */

        canonicalConcept:
            "",

        normalizedValue:
            null,

        normalizedCurrency:
            "",

        normalizedPeriod:
            "",

        normalizedUnit:
            "",

        normalizationConfidence:
            NormalizationConfidence.UNKNOWN,

        /*
         * Normalization diagnostics
         */

        warnings:
            [],

        errors:
            [],

        transformations:
            [],

        /*
         * Original FIPE-3 evidence
         *
         * This object must preserve the source record
         * without destructive mutation.
         */

        source: {

            statement:
                "",

            section:
                "",

            account:
                "",

            canonicalAccount:
                "",

            rawValue:
                null,

            value:
                null,

            currency:
                "",

            period:
                "",

            unit:
                "",

            page:
                0,

            tableId:
                "",

            row:
                -1,

            column:
                -1,

            coordinates:
                null,

            confidence:
                null,

            sourceText:
                "",

            extractionMethod:
                ""

        }

    };

}


/********************************************************************
 * 1.8 NORMALIZED FINANCIAL MODEL CONTRACT
 ********************************************************************/

function createNormalizedFinancialModel() {

    return {

        version:
            FINANCIAL_NORMALIZER_VERSION,

        component:
            FINANCIAL_NORMALIZER_COMPONENT,

        release:
            FINANCIAL_NORMALIZER_RELEASE,

        generatedAt:
            null,

        sourceModelVersion:
            null,

        records:
            [],

        statements:
            [],

        tables:
            [],

        statistics: {

            inputRecords:
                0,

            normalizedRecords:
                0,

            warningCount:
                0,

            errorCount:
                0

        },

        audit: {

            normalizedBy:
                FINANCIAL_NORMALIZER_COMPONENT,

            version:
                FINANCIAL_NORMALIZER_VERSION,

            startedAt:
                null,

            completedAt:
                null

        }

    };

}


/********************************************************************
 * 1.9 UTILITY FUNCTIONS
 ********************************************************************/

const FinancialNormalizerUtils = Object.freeze({

    now() {

        return new Date().toISOString();

    },

    isObject(value) {

        return (

            value !== null &&

            typeof value === "object" &&

            !Array.isArray(value)

        );

    },

    clone(value) {

        if (
            value === undefined
        ) {

            return undefined;

        }

        return JSON.parse(
            JSON.stringify(value)
        );

    }

});


/********************************************************************
 * 1.10 FINANCIAL NORMALIZER CLASS
 ********************************************************************/

class FinancialNormalizer {

    constructor() {

        this.component =
            FINANCIAL_NORMALIZER_COMPONENT;

        this.version =
            FINANCIAL_NORMALIZER_VERSION;

        this.release =
            FINANCIAL_NORMALIZER_RELEASE;

        this.status =
            FinancialNormalizerStatus.IDLE;

        this.sourceModel =
            null;

        this.normalizedModel =
            createNormalizedFinancialModel();

        this.initialized =
            false;

    }

}


/********************************************************************
 * END SECTION 1
 ********************************************************************/
/********************************************************************
 * SECTION 2
 * INITIALIZATION AND FIPE-3 HANDOFF
 ********************************************************************/


/********************************************************************
 * 2.1 INITIALIZE NORMALIZER
 ********************************************************************/

FinancialNormalizer.prototype.initialize =
    function () {

        /*
         * Initialization must be idempotent.
         *
         * Calling initialize() more than once must not register
         * duplicate event listeners.
         */

        if (this.initialized) {

            return true;

        }

        this.status =
            FinancialNormalizerStatus.INITIALIZING;

        this.connectFinancialExtractor();

        this.initialized =
            true;

        this.status =
            FinancialNormalizerStatus.READY;

        return true;

    };


/********************************************************************
 * 2.2 CONNECT TO FIPE-3
 ********************************************************************/

FinancialNormalizer.prototype.connectFinancialExtractor =
    function () {

        /*
         * Preserve the bound handler reference so that lifecycle
         * management can later remove the exact same listener.
         */

        if (!this._normalizerStartHandler) {

            this._normalizerStartHandler =
                event => {

                    this.receiveFinancialModel(
                        event
                    );

                };

        }

        document.addEventListener(

            FinancialNormalizerEvents.INPUT,

            this._normalizerStartHandler

        );

        return true;

    };


/********************************************************************
 * 2.3 VALIDATE FIPE-3 INPUT CONTRACT
 ********************************************************************/

FinancialNormalizer.prototype.validateInputModel =
    function (model) {

        const errors = [];

        if (
            !FinancialNormalizerUtils
                .isObject(model)
        ) {

            errors.push(
                "Financial Model must be an object."
            );

            return {

                valid:
                    false,

                errors

            };

        }

        if (
            !Array.isArray(
                model.statements
            )
        ) {

            errors.push(
                "Financial Model statements must be an array."
            );

        }

        if (
            !Array.isArray(
                model.tables
            )
        ) {

            errors.push(
                "Financial Model tables must be an array."
            );

        }

        if (
            !Array.isArray(
                model.records
            )
        ) {

            errors.push(
                "Financial Model records must be an array."
            );

        }

        return {

            valid:
                errors.length === 0,

            errors

        };

    };


/********************************************************************
 * 2.4 RECEIVE FIPE-3 FINANCIAL MODEL
 ********************************************************************/

FinancialNormalizer.prototype.receiveFinancialModel =
    function (event) {

        const model =
            event?.detail?.model;

        const validation =
            this.validateInputModel(
                model
            );

        if (!validation.valid) {

            this.status =
                FinancialNormalizerStatus.ERROR;

            document.dispatchEvent(

                new CustomEvent(

                    FinancialNormalizerEvents.ERROR,

                    {

                        detail: {

                            component:
                                this.component,

                            errors:
                                validation.errors

                        }

                    }

                )

            );

            return false;

        }

        /*
         * Preserve FIPE-3 output as immutable working evidence.
         *
         * FIPE-4 must never destructively modify the object
         * originally supplied by FIPE-3.
         */

        this.sourceModel =
            FinancialNormalizerUtils.clone(
                model
            );

        this.normalizedModel =
            createNormalizedFinancialModel();

        this.normalizedModel
            .sourceModelVersion =

                model.version ??
                null;

        this.normalizedModel
            .statistics
            .inputRecords =

                model.records.length;

        this.normalizedModel
            .audit
            .startedAt =

                FinancialNormalizerUtils
                    .now();

        this.status =
            FinancialNormalizerStatus.READY;

        document.dispatchEvent(

            new CustomEvent(

                FinancialNormalizerEvents.STARTED,

                {

                    detail: {

                        component:
                            this.component,

                        version:
                            this.version,

                        inputRecords:
                            model.records.length

                    }

                }

            )

        );

        return true;

    };


/********************************************************************
 * END SECTION 2
 ********************************************************************/
/********************************************************************
 * SECTION 3
 * SOURCE EVIDENCE PRESERVATION
 ********************************************************************/


/********************************************************************
 * 3.1 PRESERVE A SINGLE FIPE-3 RECORD
 ********************************************************************/

FinancialNormalizer.prototype.preserveSourceRecord =
    function (sourceRecord) {

        if (
            !FinancialNormalizerUtils
                .isObject(sourceRecord)
        ) {

            return null;

        }

        const normalizedRecord =
            createNormalizedFinancialRecord();

        /*
         * Preserve FIPE-3 evidence exactly as received.
         *
         * No normalization, inference, canonicalization,
         * or destructive transformation occurs here.
         */

        normalizedRecord.source = {

            statement:
                sourceRecord.statement ?? "",

            section:
                sourceRecord.section ?? "",

            account:
                sourceRecord.account ?? "",

            canonicalAccount:
                sourceRecord.canonicalAccount ?? "",

            rawValue:
                sourceRecord.rawValue ?? null,

            value:
                sourceRecord.value ?? null,

            currency:
                sourceRecord.currency ?? "",

            period:
                sourceRecord.period ?? "",

            unit:
                sourceRecord.unit ?? "",

            page:
                sourceRecord.page ?? 0,

            tableId:
                sourceRecord.tableId ?? "",

            row:
                sourceRecord.row ?? -1,

            column:
                sourceRecord.column ?? -1,

            coordinates:
                FinancialNormalizerUtils.clone(
                    sourceRecord.coordinates ?? null
                ),

            confidence:
                sourceRecord.confidence ?? null,

            sourceText:
                sourceRecord.sourceText ?? "",

            extractionMethod:
                sourceRecord.extractionMethod ?? ""

        };

        return normalizedRecord;

    };


/********************************************************************
 * 3.2 PRESERVE ALL FIPE-3 RECORDS
 ********************************************************************/

FinancialNormalizer.prototype.preserveSourceEvidence =
    function () {

        if (
            !this.sourceModel ||

            !Array.isArray(
                this.sourceModel.records
            )
        ) {

            return false;

        }

        const preservedRecords = [];

        this.sourceModel.records.forEach(
            sourceRecord => {

                const normalizedRecord =
                    this.preserveSourceRecord(
                        sourceRecord
                    );

                if (normalizedRecord) {

                    preservedRecords.push(
                        normalizedRecord
                    );

                }

            }
        );

        this.normalizedModel.records =
            preservedRecords;

        return true;

    };


/********************************************************************
 * 3.3 PRESERVE STATEMENT AND TABLE CONTEXT
 ********************************************************************/

FinancialNormalizer.prototype.preserveModelContext =
    function () {

        if (!this.sourceModel) {

            return false;

        }

        /*
         * Statements and tables are preserved as contextual evidence.
         *
         * FIPE-4 does not normalize or mutate them in this section.
         */

        this.normalizedModel.statements =
            FinancialNormalizerUtils.clone(
                this.sourceModel.statements ?? []
            );

        this.normalizedModel.tables =
            FinancialNormalizerUtils.clone(
                this.sourceModel.tables ?? []
            );

        return true;

    };


/********************************************************************
 * END SECTION 3
 ********************************************************************/
/********************************************************************
 * SECTION 4
 * CORE NORMALIZATION ENGINE
 ********************************************************************/


/********************************************************************
 * 4.1 NUMERIC AND SIGN NORMALIZATION
 ********************************************************************/

FinancialNormalizer.prototype.normalizeNumericValue =
    function (rawValue) {

        /*
         * Missing values remain explicitly unknown.
         */

        if (
            rawValue === null ||
            rawValue === undefined
        ) {

            return {

                value:
                    null,

                transformed:
                    false,

                rule:
                    null

            };

        }

        /*
         * Already-numeric values require no parsing.
         */

        if (
            typeof rawValue === "number"
        ) {

            if (
                Number.isFinite(rawValue)
            ) {

                return {

                    value:
                        rawValue,

                    transformed:
                        false,

                    rule:
                        "NUMERIC_SOURCE"

                };

            }

            return {

                value:
                    null,

                transformed:
                    false,

                rule:
                    "NON_FINITE_NUMBER"

            };

        }

        let value =
            String(rawValue).trim();

        /*
         * Empty or accounting placeholder values
         * represent unavailable numeric evidence.
         */

        if (
            value === "" ||
            value === "-" ||
            value === "—" ||
            value === "–"
        ) {

            return {

                value:
                    null,

                transformed:
                    false,

                rule:
                    "EMPTY_OR_PLACEHOLDER"

            };

        }

        let negativeByParentheses =
            false;

        /*
         * Accounting parentheses:
         *
         * (1,245) → -1245
         */

        if (
            /^\(.*\)$/.test(value)
        ) {

            negativeByParentheses =
                true;

            value =
                value.slice(1, -1).trim();

        }

        /*
         * Remove common thousands separators.
         *
         * No currency or unit conversion occurs here.
         */

        value =
            value.replace(/,/g, "");

        /*
         * Strict numeric validation.
         *
         * Accept:
         *
         * 1245
         * -1245
         * +1245
         * 1245.50
         * .50
         *
         * Reject mixed text rather than guessing.
         */

        if (
            !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/
                .test(value)
        ) {

            return {

                value:
                    null,

                transformed:
                    false,

                rule:
                    "UNRECOGNIZED_NUMERIC_FORMAT"

            };

        }

        let numericValue =
            Number(value);

        if (
            !Number.isFinite(
                numericValue
            )
        ) {

            return {

                value:
                    null,

                transformed:
                    false,

                rule:
                    "NON_FINITE_RESULT"

            };

        }

        if (
            negativeByParentheses
        ) {

            numericValue =
                -Math.abs(numericValue);

        }

        return {

            value:
                numericValue,

            transformed:
                true,

            rule:
                negativeByParentheses

                    ? "ACCOUNTING_PARENTHESES"

                    : "NUMERIC_PARSE"

        };

    };


/********************************************************************
 * 4.1.1 APPLY NUMERIC NORMALIZATION TO A RECORD
 ********************************************************************/

FinancialNormalizer.prototype.normalizeRecordValue =
    function (normalizedRecord) {

        if (
            !FinancialNormalizerUtils
                .isObject(normalizedRecord) ||

            !FinancialNormalizerUtils
                .isObject(
                    normalizedRecord.source
                )
        ) {

            return false;

        }

        /*
         * rawValue has precedence because it preserves
         * the original financial representation.
         *
         * If rawValue is unavailable, FIPE-3's parsed
         * value may be used as fallback evidence.
         */

        const inputValue =

            normalizedRecord.source.rawValue !== null &&
            normalizedRecord.source.rawValue !== undefined

                ? normalizedRecord.source.rawValue

                : normalizedRecord.source.value;

        const result =
            this.normalizeNumericValue(
                inputValue
            );

        normalizedRecord.normalizedValue =
            result.value;

        if (
            result.rule
        ) {

            normalizedRecord
                .transformations
                .push({

                    field:
                        "normalizedValue",

                    rule:
                        result.rule,

                    input:
                        inputValue,

                    output:
                        result.value

                });

        }

        if (
            result.rule ===
                "UNRECOGNIZED_NUMERIC_FORMAT" ||

            result.rule ===
                "NON_FINITE_NUMBER" ||

            result.rule ===
                "NON_FINITE_RESULT"
        ) {

            normalizedRecord
                .warnings
                .push({

                    severity:
                        NormalizationSeverity.WARNING,

                    field:
                        "normalizedValue",

                    message:
                        "Numeric value could not be normalized safely."

                });

        }

        return true;

    };


/********************************************************************
 * END SECTION 4.1
 ********************************************************************/
/********************************************************************
 * 4.2 PERIOD NORMALIZATION
 ********************************************************************/

FinancialNormalizer.prototype.normalizePeriod =
    function (rawPeriod) {

        /*
         * Missing periods remain explicitly unknown.
         */

        if (
            rawPeriod === null ||
            rawPeriod === undefined
        ) {

            return {

                value:
                    "",

                transformed:
                    false,

                rule:
                    null

            };

        }

        const original =
            String(rawPeriod).trim();

        if (!original) {

            return {

                value:
                    "",

                transformed:
                    false,

                rule:
                    null

            };

        }

        let match;

        /*
         * Calendar year:
         *
         * 2025 → 2025
         */

        match =
            original.match(
                /^((?:19|20)\d{2})$/
            );

        if (match) {

            return {

                value:
                    match[1],

                transformed:
                    false,

                rule:
                    "CALENDAR_YEAR"

            };

        }

        /*
         * Explicit fiscal year:
         *
         * FY2025
         * FY 2025
         *
         * Both normalize to:
         *
         * FY2025
         */

        match =
            original.match(
                /^FY\s*((?:19|20)\d{2})$/i
            );

        if (match) {

            const normalized =
                `FY${match[1]}`;

            return {

                value:
                    normalized,

                transformed:
                    normalized !== original,

                rule:
                    "FISCAL_YEAR"

            };

        }

        /*
         * Two-digit ending year range:
         *
         * 2024/25
         * 2024-25
         *
         * Normalize separator only:
         *
         * 2024/25
         *
         * Do not infer FY semantics.
         */

        match =
            original.match(
                /^((?:19|20)\d{2})\s*[\/-]\s*(\d{2})$/
            );

        if (match) {

            const normalized =
                `${match[1]}/${match[2]}`;

            return {

                value:
                    normalized,

                transformed:
                    normalized !== original,

                rule:
                    "YEAR_RANGE_SHORT"

            };

        }

        /*
         * Four-digit year range:
         *
         * 2024/2025
         * 2024-2025
         *
         * Normalize separator only:
         *
         * 2024/2025
         */

        match =
            original.match(
                /^((?:19|20)\d{2})\s*[\/-]\s*((?:19|20)\d{2})$/
            );

        if (match) {

            const normalized =
                `${match[1]}/${match[2]}`;

            return {

                value:
                    normalized,

                transformed:
                    normalized !== original,

                rule:
                    "YEAR_RANGE_LONG"

            };

        }

        /*
         * Unrecognized period formats remain unknown.
         *
         * FIPE-4 must not guess reporting periods.
         */

        return {

            value:
                "",

            transformed:
                false,

            rule:
                "UNRECOGNIZED_PERIOD_FORMAT"

        };

    };


/********************************************************************
 * 4.2.1 APPLY PERIOD NORMALIZATION TO A RECORD
 ********************************************************************/

FinancialNormalizer.prototype.normalizeRecordPeriod =
    function (normalizedRecord) {

        if (
            !FinancialNormalizerUtils
                .isObject(normalizedRecord) ||

            !FinancialNormalizerUtils
                .isObject(
                    normalizedRecord.source
                )
        ) {

            return false;

        }

        const inputPeriod =
            normalizedRecord.source.period;

        const result =
            this.normalizePeriod(
                inputPeriod
            );

        normalizedRecord.normalizedPeriod =
            result.value;

        if (result.rule) {

            normalizedRecord
                .transformations
                .push({

                    field:
                        "normalizedPeriod",

                    rule:
                        result.rule,

                    input:
                        inputPeriod,

                    output:
                        result.value

                });

        }

        if (
            result.rule ===
                "UNRECOGNIZED_PERIOD_FORMAT"
        ) {

            normalizedRecord
                .warnings
                .push({

                    severity:
                        NormalizationSeverity.WARNING,

                    field:
                        "normalizedPeriod",

                    message:
                        "Reporting period could not be normalized safely."

                });

        }

        return true;

    };


/********************************************************************
 * END SECTION 4.2
 ********************************************************************/
/********************************************************************
 * 4.3 CURRENCY AND UNIT NORMALIZATION
 ********************************************************************/


/********************************************************************
 * 4.3.1 CURRENCY NORMALIZATION
 ********************************************************************/

FinancialNormalizer.prototype.normalizeCurrency =
    function (rawCurrency) {

        if (
            rawCurrency === null ||
            rawCurrency === undefined
        ) {

            return {

                value: "",
                transformed: false,
                rule: null

            };

        }

        const original =
            String(rawCurrency).trim();

        if (!original) {

            return {

                value: "",
                transformed: false,
                rule: null

            };

        }

        const upper =
            original.toUpperCase();

        /*
         * Deterministic currency aliases.
         *
         * These aliases are converted only where the
         * intended ISO 4217 currency is unambiguous
         * within the alias itself.
         *
         * Ambiguous standalone symbols are deliberately
         * excluded.
         */

        const currencyAliases = {

            /*
             * Global major currencies
             */

            "US$":
                "USD",

            "RMB":
                "CNY",

            "CN¥":
                "CNY",

            /*
             * East Africa
             */

            "TSH":
                "TZS",

            "TSHS":
                "TZS",

            "KSH":
                "KES",

            "KSHS":
                "KES",

            "USH":
                "UGX",

            "USHS":
                "UGX",

            /*
             * West Africa
             */

            "GH₵":
                "GHS",

            /*
             * Southern Africa
             */

            "RANDS":
                "ZAR"

        };

        if (
            Object.prototype.hasOwnProperty.call(
                currencyAliases,
                upper
            )
        ) {

            return {

                value:
                    currencyAliases[upper],

                transformed:
                    true,

                rule:
                    "CURRENCY_ALIAS_STANDARDIZATION"

            };

        }


        /*
         * Supported ISO 4217 currency codes.
         *
         * This list intentionally covers:
         *
         * - Major global currencies
         * - Major African currencies
         * - Important trade/investment currencies
         *
         * FIPE-4 validates recognized codes rather than
         * accepting every arbitrary three-letter string.
         */

        const supportedCurrencyCodes =
            new Set([

                /*
                 * Major global / reserve / trade currencies
                 */

                "USD", // US Dollar
                "EUR", // Euro
                "GBP", // British Pound
                "JPY", // Japanese Yen
                "CNY", // Chinese Yuan Renminbi
                "CHF", // Swiss Franc

                "CAD", // Canadian Dollar
                "AUD", // Australian Dollar
                "NZD", // New Zealand Dollar

                "INR", // Indian Rupee

                "SGD", // Singapore Dollar
                "HKD", // Hong Kong Dollar
                "KRW", // South Korean Won

                /*
                 * Middle East / Gulf
                 */

                "AED", // UAE Dirham
                "SAR", // Saudi Riyal
                "QAR", // Qatari Riyal
                "KWD", // Kuwaiti Dinar
                "BHD", // Bahraini Dinar
                "OMR", // Omani Rial
                "ILS", // Israeli New Shekel

                /*
                 * East Africa
                 */

                "TZS", // Tanzanian Shilling
                "KES", // Kenyan Shilling
                "UGX", // Ugandan Shilling
                "RWF", // Rwandan Franc
                "BIF", // Burundian Franc
                "ETB", // Ethiopian Birr
                "DJF", // Djiboutian Franc
                "SOS", // Somali Shilling
                "SSP", // South Sudanese Pound

                /*
                 * Southern Africa
                 */

                "ZAR", // South African Rand
                "ZMW", // Zambian Kwacha
                "MWK", // Malawian Kwacha
                "MZN", // Mozambican Metical
                "BWP", // Botswana Pula
                "NAD", // Namibian Dollar
                "SZL", // Eswatini Lilangeni
                "LSL", // Lesotho Loti
                "AOA", // Angolan Kwanza
                "ZWL", // Zimbabwe Gold / legacy-code context

                /*
                 * West Africa
                 */

                "NGN", // Nigerian Naira
                "GHS", // Ghanaian Cedi

                "XOF", // West African CFA Franc

                "SLE", // Sierra Leonean Leone
                "LRD", // Liberian Dollar
                "GMD", // Gambian Dalasi
                "GNF", // Guinean Franc
                "CVE", // Cape Verdean Escudo
                "MRU", // Mauritanian Ouguiya

                /*
                 * Central Africa
                 */

                "XAF", // Central African CFA Franc
                "CDF", // Congolese Franc

                /*
                 * North Africa
                 */

                "EGP", // Egyptian Pound
                "MAD", // Moroccan Dirham
                "DZD", // Algerian Dinar
                "TND", // Tunisian Dinar
                "LYD", // Libyan Dinar
                "SDG", // Sudanese Pound

                /*
                 * Indian Ocean / African markets
                 */

                "MUR", // Mauritian Rupee
                "SCR", // Seychelles Rupee
                "MGA", // Malagasy Ariary
                "KMF", // Comorian Franc

                /*
                 * Other important international currencies
                 */

                "BRL", // Brazilian Real
                "MXN", // Mexican Peso
                "TRY", // Turkish Lira
                "RUB", // Russian Ruble
                "IDR", // Indonesian Rupiah
                "MYR", // Malaysian Ringgit
                "THB", // Thai Baht
                "PHP", // Philippine Peso
                "VND", // Vietnamese Dong
                "PKR", // Pakistani Rupee
                "BDT"  // Bangladeshi Taka

            ]);


        /*
         * Recognized ISO code.
         */

        if (
            supportedCurrencyCodes.has(
                upper
            )
        ) {

            return {

                value:
                    upper,

                transformed:
                    upper !== original,

                rule:
                    "ISO_CURRENCY_STANDARDIZATION"

            };

        }


        /*
         * Unknown or ambiguous currencies remain unknown.
         *
         * Examples deliberately NOT inferred:
         *
         * $
         * £
         * ¥
         * Sh
         * Rs
         * Local Currency
         *
         * These symbols may represent multiple currencies
         * depending on jurisdiction and document context.
         */

        return {

            value:
                "",

            transformed:
                false,

            rule:
                "UNRECOGNIZED_CURRENCY"

        };

    };


/********************************************************************
 * 4.3.2 UNIT NORMALIZATION
 ********************************************************************/

FinancialNormalizer.prototype.normalizeUnit =
    function (rawUnit) {

        if (
            rawUnit === null ||
            rawUnit === undefined
        ) {

            return {

                value: "",
                transformed: false,
                rule: null

            };

        }

        const original =
            String(rawUnit).trim();

        if (!original) {

            return {

                value: "",
                transformed: false,
                rule: null

            };

        }

        const lower =
            original.toLowerCase();

        const unitMap = {

            "unit":
                "UNIT",

            "units":
                "UNIT",

            "actual":
                "UNIT",

            "thousand":
                "THOUSAND",

            "thousands":
                "THOUSAND",

            "'000":
                "THOUSAND",

            "000":
                "THOUSAND",

            "million":
                "MILLION",

            "millions":
                "MILLION",

            "mn":
                "MILLION",

            "mio":
                "MILLION",

            "billion":
                "BILLION",

            "billions":
                "BILLION",

            "bn":
                "BILLION"

        };

        if (
            Object.prototype.hasOwnProperty.call(
                unitMap,
                lower
            )
        ) {

            const normalized =
                unitMap[lower];

            return {

                value:
                    normalized,

                transformed:
                    normalized !== original,

                rule:
                    "UNIT_STANDARDIZATION"

            };

        }

        return {

            value: "",
            transformed: false,
            rule: "UNRECOGNIZED_UNIT"

        };

    };


/********************************************************************
 * 4.3.3 APPLY CURRENCY AND UNIT NORMALIZATION
 ********************************************************************/

FinancialNormalizer.prototype
    .normalizeRecordCurrencyAndUnit =
    function (normalizedRecord) {

        if (
            !FinancialNormalizerUtils
                .isObject(normalizedRecord) ||

            !FinancialNormalizerUtils
                .isObject(
                    normalizedRecord.source
                )
        ) {

            return false;

        }

        /*
         * Currency
         */

        const currencyInput =
            normalizedRecord.source.currency;

        const currencyResult =
            this.normalizeCurrency(
                currencyInput
            );

        normalizedRecord.normalizedCurrency =
            currencyResult.value;

        if (currencyResult.rule) {

            normalizedRecord
                .transformations
                .push({

                    field:
                        "normalizedCurrency",

                    rule:
                        currencyResult.rule,

                    input:
                        currencyInput,

                    output:
                        currencyResult.value

                });

        }

        if (
            currencyResult.rule ===
                "UNRECOGNIZED_CURRENCY"
        ) {

            normalizedRecord
                .warnings
                .push({

                    severity:
                        NormalizationSeverity.WARNING,

                    field:
                        "normalizedCurrency",

                    message:
                        "Currency could not be normalized safely."

                });

        }


        /*
         * Unit
         */

        const unitInput =
            normalizedRecord.source.unit;

        const unitResult =
            this.normalizeUnit(
                unitInput
            );

        normalizedRecord.normalizedUnit =
            unitResult.value;

        if (unitResult.rule) {

            normalizedRecord
                .transformations
                .push({

                    field:
                        "normalizedUnit",

                    rule:
                        unitResult.rule,

                    input:
                        unitInput,

                    output:
                        unitResult.value

                });

        }

        if (
            unitResult.rule ===
                "UNRECOGNIZED_UNIT"
        ) {

            normalizedRecord
                .warnings
                .push({

                    severity:
                        NormalizationSeverity.WARNING,

                    field:
                        "normalizedUnit",

                    message:
                        "Financial unit could not be normalized safely."

                });

        }

        return true;

    };


/********************************************************************
 * END SECTION 4.3
 ********************************************************************/
/********************************************************************
 * 4.4 CANONICAL CONCEPT NORMALIZATION
 ********************************************************************/


/********************************************************************
 * 4.4.1 STANDARDIZE CANONICAL CONCEPT IDENTIFIER
 ********************************************************************/

FinancialNormalizer.prototype.normalizeCanonicalConcept =
    function (canonicalAccount) {

        if (
            canonicalAccount === null ||
            canonicalAccount === undefined
        ) {

            return {

                value:
                    "",

                transformed:
                    false,

                rule:
                    null

            };

        }

        const original =
            String(
                canonicalAccount
            ).trim();

        if (!original) {

            return {

                value:
                    "",

                transformed:
                    false,

                rule:
                    null

            };

        }

        /*
         * Convert FIPE-3 canonical labels into stable,
         * machine-readable identifiers.
         *
         * Examples:
         *
         * Accounts Receivable
         *      → ACCOUNTS_RECEIVABLE
         *
         * Cost of Goods Sold
         *      → COST_OF_GOODS_SOLD
         *
         * EBITDA
         *      → EBITDA
         *
         * Property, Plant & Equipment
         *      → PROPERTY_PLANT_EQUIPMENT
         *
         * This is identifier standardization only.
         *
         * FIPE-4 does NOT remap the accounting meaning.
         */

        const normalized =
            original

                .toUpperCase()

                .replace(
                    /&/g,
                    " AND "
                )

                .replace(
                    /[^A-Z0-9]+/g,
                    "_"
                )

                .replace(
                    /^_+|_+$/g,
                    ""

                )

                .replace(
                    /_+/g,
                    "_"
                );

        if (!normalized) {

            return {

                value:
                    "",

                transformed:
                    false,

                rule:
                    "INVALID_CANONICAL_CONCEPT"

            };

        }

        return {

            value:
                normalized,

            transformed:
                normalized !== original,

            rule:
                "CANONICAL_IDENTIFIER_STANDARDIZATION"

        };

    };


/********************************************************************
 * 4.4.2 APPLY CANONICAL CONCEPT NORMALIZATION
 ********************************************************************/

FinancialNormalizer.prototype
    .normalizeRecordCanonicalConcept =
    function (normalizedRecord) {

        if (
            !FinancialNormalizerUtils
                .isObject(normalizedRecord) ||

            !FinancialNormalizerUtils
                .isObject(
                    normalizedRecord.source
                )
        ) {

            return false;

        }

        /*
         * FIPE-3 canonicalAccount is the authoritative
         * upstream canonical mapping when populated.
         *
         * FIPE-4 does not independently reinterpret
         * source.account here.
         */

        const canonicalInput =
            normalizedRecord
                .source
                .canonicalAccount;

        const result =
            this.normalizeCanonicalConcept(
                canonicalInput
            );

        normalizedRecord.canonicalConcept =
            result.value;

        if (result.rule) {

            normalizedRecord
                .transformations
                .push({

                    field:
                        "canonicalConcept",

                    rule:
                        result.rule,

                    input:
                        canonicalInput,

                    output:
                        result.value

                });

        }

        /*
         * An unmapped FIPE-3 account remains explicitly
         * unmapped.
         *
         * The original account label remains available
         * in source.account for later diagnostics,
         * dictionary improvement, or AI reasoning.
         */

        if (
            !canonicalInput
        ) {

            normalizedRecord
                .warnings
                .push({

                    severity:
                        NormalizationSeverity.WARNING,

                    field:
                        "canonicalConcept",

                    message:
                        "No FIPE-3 canonical account mapping was available."

                });

        }

        if (
            result.rule ===
                "INVALID_CANONICAL_CONCEPT"
        ) {

            normalizedRecord
                .warnings
                .push({

                    severity:
                        NormalizationSeverity.WARNING,

                    field:
                        "canonicalConcept",

                    message:
                        "Canonical account could not be standardized safely."

                });

        }

        return true;

    };


/********************************************************************
 * END SECTION 4.4
 ********************************************************************/
/********************************************************************
 * 4.5 NORMALIZATION ORCHESTRATION
 ********************************************************************/


/********************************************************************
 * 4.5.1 NORMALIZE A SINGLE PRESERVED RECORD
 ********************************************************************/

FinancialNormalizer.prototype.normalizeRecord =
    function (normalizedRecord) {

        if (
            !FinancialNormalizerUtils
                .isObject(normalizedRecord) ||

            !FinancialNormalizerUtils
                .isObject(
                    normalizedRecord.source
                )
        ) {

            return false;

        }

        /*
         * Apply only the normalization primitives already
         * defined and tested in Sections 4.1–4.4.
         *
         * Source evidence must remain unchanged.
         */

        this.normalizeRecordValue(
            normalizedRecord
        );

        this.normalizeRecordPeriod(
            normalizedRecord
        );

        this.normalizeRecordCurrencyAndUnit(
            normalizedRecord
        );

        this.normalizeRecordCanonicalConcept(
            normalizedRecord
        );

        return true;

    };


/********************************************************************
 * 4.5.2 NORMALIZE ALL PRESERVED RECORDS
 ********************************************************************/

FinancialNormalizer.prototype.normalizeRecords =
    function () {

        if (
            !this.normalizedModel ||

            !Array.isArray(
                this.normalizedModel.records
            )
        ) {

            return false;

        }

        let normalizedCount = 0;

        this.normalizedModel.records.forEach(
            normalizedRecord => {

                const normalized =
                    this.normalizeRecord(
                        normalizedRecord
                    );

                if (normalized) {

                    normalizedCount++;

                }

            }
        );

        this.normalizedModel
            .statistics
            .normalizedRecords =

                normalizedCount;

        return true;

    };


/********************************************************************
 * 4.5.3 SYNCHRONIZE NORMALIZATION STATISTICS
 ********************************************************************/

FinancialNormalizer.prototype
    .synchronizeNormalizationStatistics =
    function () {

        if (
            !this.normalizedModel ||

            !Array.isArray(
                this.normalizedModel.records
            )
        ) {

            return false;

        }

        let warningCount = 0;

        let errorCount = 0;

        this.normalizedModel.records.forEach(
            record => {

                if (
                    Array.isArray(
                        record.warnings
                    )
                ) {

                    warningCount +=
                        record.warnings.length;

                }

                if (
                    Array.isArray(
                        record.errors
                    )
                ) {

                    errorCount +=
                        record.errors.length;

                }

            }
        );

        this.normalizedModel
            .statistics
            .warningCount =

                warningCount;

        this.normalizedModel
            .statistics
            .errorCount =

                errorCount;

        return true;

    };


/********************************************************************
 * 4.5.4 EXECUTE CORE NORMALIZATION PIPELINE
 ********************************************************************/

FinancialNormalizer.prototype.normalize =
    function () {

        if (
            !this.sourceModel
        ) {

            return false;

        }

        this.status =
            FinancialNormalizerStatus.NORMALIZING;

        /*
         * Rebuild the normalized model from the accepted
         * FIPE-3 source model.
         *
         * This prevents repeated normalize() calls from
         * accumulating transformations or warnings.
         */

        const sourceModelVersion =
            this.sourceModel.version ??
            null;

        const startedAt =
            FinancialNormalizerUtils.now();

        this.normalizedModel =
            createNormalizedFinancialModel();

        this.normalizedModel
            .sourceModelVersion =

                sourceModelVersion;

        this.normalizedModel
            .statistics
            .inputRecords =

                Array.isArray(
                    this.sourceModel.records
                )

                    ? this.sourceModel.records.length

                    : 0;

        this.normalizedModel
            .audit
            .startedAt =

                startedAt;

        /*
         * Step 1:
         * Preserve source evidence.
         */

        if (
            !this.preserveSourceEvidence()
        ) {

            this.status =
                FinancialNormalizerStatus.ERROR;

            return false;

        }

        /*
         * Step 2:
         * Preserve statement and table context.
         */

        if (
            !this.preserveModelContext()
        ) {

            this.status =
                FinancialNormalizerStatus.ERROR;

            return false;

        }

        /*
         * Step 3:
         * Apply normalization primitives.
         */

        if (
            !this.normalizeRecords()
        ) {

            this.status =
                FinancialNormalizerStatus.ERROR;

            return false;

        }

        /*
         * Step 4:
         * Synchronize current statistics.
         */

        this.synchronizeNormalizationStatistics();

        /*
         * Section 5 will perform formal validation.
         * Section 6 will finalize the model.
         *
         * Therefore status returns to READY here rather
         * than being marked COMPLETE prematurely.
         */

        this.status =
            FinancialNormalizerStatus.READY;

        return true;

    };


/********************************************************************
 * END SECTION 4.5
 ********************************************************************/
/********************************************************************
 * SECTION 5
 * VALIDATION AND DIAGNOSTICS
 ********************************************************************/


/********************************************************************
 * 5.1 VALIDATION RESULT CONTRACT
 ********************************************************************/

function createNormalizerValidationResult() {

    return {

        valid:
            true,

        errors:
            [],

        warnings:
            [],

        statistics: {

            recordsChecked:
                0,

            validRecords:
                0,

            invalidRecords:
                0,

            warningRecords:
                0

        }

    };

}


/********************************************************************
 * 5.1.1 ADD VALIDATION ERROR
 ********************************************************************/

FinancialNormalizer.prototype.addValidationError =
    function (
        validationResult,
        message,
        context = {}
    ) {

        if (
            !FinancialNormalizerUtils
                .isObject(validationResult) ||
            !Array.isArray(
                validationResult.errors
            )
        ) {

            return false;

        }

        validationResult.errors.push({

            severity:
                NormalizationSeverity.ERROR,

            message,

            context:
                FinancialNormalizerUtils.clone(
                    context
                )

        });

        validationResult.valid =
            false;

        return true;

    };


/********************************************************************
 * 5.1.2 ADD VALIDATION WARNING
 ********************************************************************/

FinancialNormalizer.prototype.addValidationWarning =
    function (
        validationResult,
        message,
        context = {}
    ) {

        if (
            !FinancialNormalizerUtils
                .isObject(validationResult) ||
            !Array.isArray(
                validationResult.warnings
            )
        ) {

            return false;

        }

        validationResult.warnings.push({

            severity:
                NormalizationSeverity.WARNING,

            message,

            context:
                FinancialNormalizerUtils.clone(
                    context
                )

        });

        return true;

    };


/********************************************************************
 * END SECTION 5.1
 ********************************************************************/
/********************************************************************
 * 5.2 NORMALIZED RECORD VALIDATION
 ********************************************************************/


/********************************************************************
 * 5.2.1 VALIDATE NORMALIZED RECORD STRUCTURE
 ********************************************************************/

FinancialNormalizer.prototype.validateNormalizedRecord =
    function (
        record,
        recordIndex = -1
    ) {

        const result =
            createNormalizerValidationResult();

        result.statistics.recordsChecked =
            1;

        /*
         * Record itself must be a valid object.
         */

        if (
            !FinancialNormalizerUtils
                .isObject(record)
        ) {

            this.addValidationError(
                result,
                "Normalized financial record must be an object.",
                {
                    recordIndex
                }
            );

            result.statistics.invalidRecords =
                1;

            return result;

        }

        /*
         * Source evidence layer is mandatory.
         *
         * A normalized interpretation without its
         * FIPE-3 source evidence is not auditable.
         */

        if (
            !FinancialNormalizerUtils
                .isObject(record.source)
        ) {

            this.addValidationError(
                result,
                "Normalized financial record is missing its source evidence object.",
                {
                    recordIndex
                }
            );

        }

        /*
         * Diagnostic arrays are structural requirements.
         */

        if (
            !Array.isArray(
                record.warnings
            )
        ) {

            this.addValidationError(
                result,
                "Normalized record warnings must be an array.",
                {
                    recordIndex
                }
            );

        }

        if (
            !Array.isArray(
                record.errors
            )
        ) {

            this.addValidationError(
                result,
                "Normalized record errors must be an array.",
                {
                    recordIndex
                }
            );

        }

        if (
            !Array.isArray(
                record.transformations
            )
        ) {

            this.addValidationError(
                result,
                "Normalized record transformations must be an array.",
                {
                    recordIndex
                }
            );

        }


        /*
         * Evidence completeness checks.
         *
         * These are warnings rather than structural errors.
         */

        if (
            FinancialNormalizerUtils
                .isObject(record.source)
        ) {

            if (
                !String(
                    record.source.account ?? ""
                ).trim()
            ) {

                this.addValidationWarning(
                    result,
                    "Source account label is missing.",
                    {
                        recordIndex
                    }
                );

            }

            if (
                record.source.rawValue === null &&
                record.source.value === null
            ) {

                this.addValidationWarning(
                    result,
                    "Source financial value is missing.",
                    {
                        recordIndex,
                        account:
                            record.source.account ?? ""
                    }
                );

            }

        }


        /*
         * Normalized interpretation completeness.
         *
         * Missing normalization is not automatically
         * structural invalidity because FIPE-4 deliberately
         * refuses to fabricate unsupported information.
         */

        if (
            record.normalizedValue === null
        ) {

            this.addValidationWarning(
                result,
                "Normalized financial value is unavailable.",
                {
                    recordIndex,
                    account:
                        record.source?.account ?? ""
                }
            );

        }

        if (
            !String(
                record.canonicalConcept ?? ""
            ).trim()
        ) {

            this.addValidationWarning(
                result,
                "Canonical financial concept is unavailable.",
                {
                    recordIndex,
                    account:
                        record.source?.account ?? ""
                }
            );

        }

        if (
            !String(
                record.normalizedPeriod ?? ""
            ).trim()
        ) {

            this.addValidationWarning(
                result,
                "Normalized reporting period is unavailable.",
                {
                    recordIndex,
                    account:
                        record.source?.account ?? ""
                }
            );

        }


        /*
         * Final record-level statistics.
         */

        if (result.valid) {

            result.statistics.validRecords =
                1;

        } else {

            result.statistics.invalidRecords =
                1;

        }

        if (
            result.warnings.length > 0
        ) {

            result.statistics.warningRecords =
                1;

        }

        return result;

    };


/********************************************************************
 * END SECTION 5.2
 ********************************************************************/
/********************************************************************
 * 5.3 MODEL-LEVEL VALIDATION
 ********************************************************************/


/********************************************************************
 * 5.3.1 VALIDATE NORMALIZED MODEL
 ********************************************************************/

FinancialNormalizer.prototype.validateNormalizedModel =
    function () {

        const result =
            createNormalizerValidationResult();

        const model =
            this.normalizedModel;

        /*
         * Model object is mandatory.
         */

        if (
            !FinancialNormalizerUtils
                .isObject(model)
        ) {

            this.addValidationError(
                result,
                "Normalized financial model is unavailable."
            );

            return result;

        }


        /*
         * Records collection is structurally mandatory.
         */

        if (
            !Array.isArray(
                model.records
            )
        ) {

            this.addValidationError(
                result,
                "Normalized model records must be an array."
            );

            return result;

        }


        /*
         * An empty model is structurally valid but unusable
         * for meaningful downstream financial intelligence.
         *
         * Therefore this is a warning, not an error.
         */

        if (
            model.records.length === 0
        ) {

            this.addValidationWarning(
                result,
                "Normalized model contains no financial records."
            );

        }


        /*
         * Validate each normalized record.
         */

        model.records.forEach(
            (record, recordIndex) => {

                const recordResult =
                    this.validateNormalizedRecord(
                        record,
                        recordIndex
                    );

                result.statistics.recordsChecked +=
                    recordResult
                        .statistics
                        .recordsChecked;

                result.statistics.validRecords +=
                    recordResult
                        .statistics
                        .validRecords;

                result.statistics.invalidRecords +=
                    recordResult
                        .statistics
                        .invalidRecords;

                result.statistics.warningRecords +=
                    recordResult
                        .statistics
                        .warningRecords;


                /*
                 * Aggregate record validation errors.
                 */

                recordResult.errors.forEach(
                    error => {

                        result.errors.push(
                            FinancialNormalizerUtils
                                .clone(error)
                        );

                    }
                );


                /*
                 * Aggregate record validation warnings.
                 */

                recordResult.warnings.forEach(
                    warning => {

                        result.warnings.push(
                            FinancialNormalizerUtils
                                .clone(warning)
                        );

                    }
                );

            }
        );


        /*
         * Any record-level structural error invalidates
         * the model for downstream processing.
         */

        if (
            result.errors.length > 0
        ) {

            result.valid =
                false;

        }


        /*
         * Context collections should exist as arrays.
         *
         * Missing context does not invalidate otherwise
         * valid financial records, but it reduces
         * traceability and downstream analytical context.
         */

        if (
            !Array.isArray(
                model.statements
            )
        ) {

            this.addValidationWarning(
                result,
                "Normalized model statements context is unavailable."
            );

        }

        if (
            !Array.isArray(
                model.tables
            )
        ) {

            this.addValidationWarning(
                result,
                "Normalized model tables context is unavailable."
            );

        }


        /*
         * Statistics object is structurally expected.
         */

        if (
            !FinancialNormalizerUtils
                .isObject(
                    model.statistics
                )
        ) {

            this.addValidationError(
                result,
                "Normalized model statistics object is unavailable."
            );

        }


        /*
         * Audit object is structurally expected.
         */

        if (
            !FinancialNormalizerUtils
                .isObject(
                    model.audit
                )
        ) {

            this.addValidationError(
                result,
                "Normalized model audit object is unavailable."
            );

        }

        return result;

    };


/********************************************************************
 * END SECTION 5.3
 ********************************************************************/
/********************************************************************
 * 5.4 DIAGNOSTICS AND HEALTH CHECK
 ********************************************************************/


/********************************************************************
 * 5.4.1 DIAGNOSTICS
 ********************************************************************/

FinancialNormalizer.prototype.diagnostics =
    function () {

        const sourceRecords =
            Array.isArray(
                this.sourceModel?.records
            )

                ? this.sourceModel.records.length

                : 0;

        const normalizedRecords =
            Array.isArray(
                this.normalizedModel?.records
            )

                ? this.normalizedModel.records.length

                : 0;

        const statistics =
            FinancialNormalizerUtils.isObject(
                this.normalizedModel?.statistics
            )

                ? FinancialNormalizerUtils.clone(
                    this.normalizedModel.statistics
                )

                : null;

        return {

            component:
                this.component,

            version:
                this.version,

            initialized:
                this.initialized === true,

            status:
                this.status,

            sourceModelAvailable:
                FinancialNormalizerUtils.isObject(
                    this.sourceModel
                ),

            normalizedModelAvailable:
                FinancialNormalizerUtils.isObject(
                    this.normalizedModel
                ),

            sourceRecords,

            normalizedRecords,

            statistics

        };

    };


/********************************************************************
 * 5.4.2 HEALTH CHECK
 ********************************************************************/

FinancialNormalizer.prototype.healthCheck =
    function () {

        const diagnostics =
            this.diagnostics();

        const issues = [];

        /*
         * Initialization health.
         */

        if (
            !diagnostics.initialized
        ) {

            issues.push(
                "Financial Normalizer is not initialized."
            );

        }


        /*
         * Internal normalized-model contract must exist.
         */

        if (
            !diagnostics.normalizedModelAvailable
        ) {

            issues.push(
                "Normalized financial model is unavailable."
            );

        }


        /*
         * ERROR status always represents an unhealthy
         * operational state.
         */

        if (
            diagnostics.status ===
                FinancialNormalizerStatus.ERROR
        ) {

            issues.push(
                "Financial Normalizer is in ERROR status."
            );

        }


        /*
         * Source model availability is reported separately.
         *
         * A newly initialized FIPE-4 component can still be
         * operationally healthy while waiting for FIPE-3.
         */

        const waitingForSource =
            diagnostics.initialized &&
            !diagnostics.sourceModelAvailable;


        /*
         * If source evidence exists but no normalized records
         * were produced, flag the condition diagnostically.
         */

        if (
            diagnostics.sourceModelAvailable &&
            diagnostics.sourceRecords > 0 &&
            diagnostics.normalizedRecords === 0
        ) {

            issues.push(
                "Source financial records are available but no normalized records have been produced."
            );

        }


        return {

            healthy:
                issues.length === 0,

            ready:
                diagnostics.initialized &&
                diagnostics.normalizedModelAvailable &&
                diagnostics.status !==
                    FinancialNormalizerStatus.ERROR,

            waitingForSource,

            issues,

            diagnostics

        };

    };


/********************************************************************
 * END SECTION 5.4
 ********************************************************************/
/********************************************************************
 * 5.5 VALIDATION ORCHESTRATION
 ********************************************************************/


/********************************************************************
 * 5.5.1 STORE VALIDATION RESULT
 ********************************************************************/

FinancialNormalizer.prototype.storeValidationResult =
    function (validationResult) {

        if (
            !FinancialNormalizerUtils
                .isObject(validationResult)
        ) {

            return false;

        }

        if (
            !FinancialNormalizerUtils
                .isObject(
                    this.normalizedModel
                )
        ) {

            return false;

        }

        /*
         * Store a cloned snapshot.
         *
         * The caller must not retain a mutable reference
         * into FIPE-4 internal state.
         */

        this.normalizedModel.validation =
            FinancialNormalizerUtils.clone(
                validationResult
            );

        return true;

    };


/********************************************************************
 * 5.5.2 SYNCHRONIZE VALIDATION STATISTICS
 ********************************************************************/

FinancialNormalizer.prototype
    .synchronizeValidationStatistics =
    function (validationResult) {

        if (
            !FinancialNormalizerUtils
                .isObject(validationResult) ||

            !FinancialNormalizerUtils
                .isObject(
                    this.normalizedModel?.statistics
                )
        ) {

            return false;

        }

        this.normalizedModel
            .statistics
            .validationRecordsChecked =

                validationResult
                    .statistics
                    .recordsChecked;

        this.normalizedModel
            .statistics
            .validRecords =

                validationResult
                    .statistics
                    .validRecords;

        this.normalizedModel
            .statistics
            .invalidRecords =

                validationResult
                    .statistics
                    .invalidRecords;

        this.normalizedModel
            .statistics
            .validationWarningRecords =

                validationResult
                    .statistics
                    .warningRecords;

        this.normalizedModel
            .statistics
            .validationErrors =

                validationResult
                    .errors
                    .length;

        this.normalizedModel
            .statistics
            .validationWarnings =

                validationResult
                    .warnings
                    .length;

        return true;

    };


/********************************************************************
 * 5.5.3 EXECUTE VALIDATION PIPELINE
 ********************************************************************/

FinancialNormalizer.prototype.validate =
    function () {

        if (
            !FinancialNormalizerUtils
                .isObject(
                    this.normalizedModel
                )
        ) {

            this.status =
                FinancialNormalizerStatus.ERROR;

            return false;

        }

        /*
         * Execute model-level validation.
         *
         * validateNormalizedModel() already delegates
         * record-level validation to Section 5.2.
         */

        const validationResult =
            this.validateNormalizedModel();

        /*
         * Persist validation snapshot.
         */

        if (
            !this.storeValidationResult(
                validationResult
            )
        ) {

            this.status =
                FinancialNormalizerStatus.ERROR;

            return false;

        }

        /*
         * Synchronize validation statistics.
         */

        if (
            !this.synchronizeValidationStatistics(
                validationResult
            )
        ) {

            this.status =
                FinancialNormalizerStatus.ERROR;

            return false;

        }

        /*
         * Structural validation errors prevent FIPE-4
         * from being considered ready for finalization.
         *
         * Warnings alone do not.
         */

        if (
            validationResult.valid
        ) {

            this.status =
                FinancialNormalizerStatus.READY;

        } else {

            this.status =
                FinancialNormalizerStatus.ERROR;

        }

        return validationResult.valid;

    };


/********************************************************************
 * END SECTION 5.5
 ********************************************************************/
/********************************************************************
 * SECTION 6
 * FINALIZATION AND PUBLIC API
 ********************************************************************/


/********************************************************************
 * 6.1 FINALIZATION READINESS
 ********************************************************************/

FinancialNormalizer.prototype.checkFinalizationReadiness =
    function () {

        const issues = [];

        /*
         * FIPE-3 source model must exist.
         */

        if (
            !FinancialNormalizerUtils
                .isObject(
                    this.sourceModel
                )
        ) {

            issues.push(
                "Source financial model is unavailable."
            );

        }


        /*
         * FIPE-4 normalized model must exist.
         */

        if (
            !FinancialNormalizerUtils
                .isObject(
                    this.normalizedModel
                )
        ) {

            issues.push(
                "Normalized financial model is unavailable."
            );

            return {

                ready:
                    false,

                issues

            };

        }


        /*
         * Normalized records collection must exist.
         */

        if (
            !Array.isArray(
                this.normalizedModel.records
            )
        ) {

            issues.push(
                "Normalized financial records collection is unavailable."
            );

        }


        /*
         * If FIPE-3 supplied records, FIPE-4 must have
         * produced corresponding normalized records.
         *
         * This prevents premature finalization before
         * normalize() has actually run.
         */

        const sourceRecordCount =

            Array.isArray(
                this.sourceModel?.records
            )

                ? this.sourceModel.records.length

                : 0;

        const normalizedRecordCount =

            Array.isArray(
                this.normalizedModel?.records
            )

                ? this.normalizedModel.records.length

                : 0;

        if (
            sourceRecordCount > 0 &&
            normalizedRecordCount !==
                sourceRecordCount
        ) {

            issues.push(
                "Normalization is incomplete or normalized record count does not match source record count."
            );

        }


        /*
         * Validation must have executed.
         *
         * Presence of the validation object is the
         * explicit evidence that Section 5 completed.
         */

        if (
            !FinancialNormalizerUtils
                .isObject(
                    this.normalizedModel.validation
                )
        ) {

            issues.push(
                "Normalized financial model has not been validated."
            );

        } else if (
            this.normalizedModel
                .validation
                .valid !== true
        ) {

            issues.push(
                "Normalized financial model failed validation."
            );

        }


        /*
         * FIPE-4 cannot finalize while operationally
         * in ERROR status.
         */

        if (
            this.status ===
                FinancialNormalizerStatus.ERROR
        ) {

            issues.push(
                "Financial Normalizer is in ERROR status."
            );

        }


        return {

            ready:
                issues.length === 0,

            issues

        };

    };


/********************************************************************
 * END SECTION 6.1
 ********************************************************************/
/********************************************************************
 * 6.2 FINALIZE NORMALIZED MODEL
 ********************************************************************/


/********************************************************************
 * 6.2.1 FINALIZE MODEL
 ********************************************************************/

FinancialNormalizer.prototype.finalize =
    function () {

        /*
         * Finalization is guarded by the Section 6.1
         * readiness gate.
         */

        const readiness =
            this.checkFinalizationReadiness();

        if (
            !readiness.ready
        ) {

            this.status =
                FinancialNormalizerStatus.ERROR;

            return false;

        }


        /*
         * Finalization must be idempotent.
         *
         * If the model has already been finalized,
         * return success without changing completion
         * timestamps or duplicating lifecycle effects.
         */

        if (
            this.normalizedModel
                .audit
                .completedAt
        ) {

            return true;

        }


        /*
         * Synchronize current normalization statistics
         * one final time before completion.
         */

        this.synchronizeNormalizationStatistics();


        /*
         * Stamp final audit metadata.
         */

        this.normalizedModel
            .audit
            .completedAt =

                FinancialNormalizerUtils.now();

        this.normalizedModel
            .audit
            .component =

                this.component;

        this.normalizedModel
            .audit
            .version =

                this.version;


        /*
         * Explicit downstream contract state.
         */

        this.normalizedModel.finalized =
            true;

        this.normalizedModel.finalizedBy =
            this.component;

        this.normalizedModel.finalizedVersion =
            this.version;


        /*
         * Mark component lifecycle complete.
         *
         * No downstream event is dispatched here.
         * Event handoff belongs to Section 6.4.
         */

        this.status =
            FinancialNormalizerStatus.COMPLETE;

        return true;

    };


/********************************************************************
 * END SECTION 6.2
 ********************************************************************/
/********************************************************************
 * 6.3 SAFE PUBLIC RETRIEVAL API
 ********************************************************************/


/********************************************************************
 * 6.3.1 GET NORMALIZED MODEL
 ********************************************************************/

FinancialNormalizer.prototype.getNormalizedModel =
    function () {

        if (
            !FinancialNormalizerUtils
                .isObject(
                    this.normalizedModel
                )
        ) {

            return null;

        }

        return FinancialNormalizerUtils.clone(
            this.normalizedModel
        );

    };


/********************************************************************
 * 6.3.2 GET NORMALIZED RECORDS
 ********************************************************************/

FinancialNormalizer.prototype.getNormalizedRecords =
    function () {

        if (
            !Array.isArray(
                this.normalizedModel?.records
            )
        ) {

            return [];

        }

        return FinancialNormalizerUtils.clone(
            this.normalizedModel.records
        );

    };


/********************************************************************
 * 6.3.3 GET NORMALIZED RECORD BY INDEX
 ********************************************************************/

FinancialNormalizer.prototype.getNormalizedRecord =
    function (recordIndex) {

        if (
            !Number.isInteger(
                recordIndex
            ) ||

            recordIndex < 0 ||

            !Array.isArray(
                this.normalizedModel?.records
            ) ||

            recordIndex >=
                this.normalizedModel.records.length
        ) {

            return null;

        }

        return FinancialNormalizerUtils.clone(

            this.normalizedModel
                .records[recordIndex]

        );

    };


/********************************************************************
 * 6.3.4 GET VALIDATION RESULT
 ********************************************************************/

FinancialNormalizer.prototype.getValidationResult =
    function () {

        if (
            !FinancialNormalizerUtils
                .isObject(
                    this.normalizedModel?.validation
                )
        ) {

            return null;

        }

        return FinancialNormalizerUtils.clone(
            this.normalizedModel.validation
        );

    };


/********************************************************************
 * END SECTION 6.3
 ********************************************************************/
/********************************************************************
 * 6.4 DOWNSTREAM EVENT HANDOFF
 ********************************************************************/


/********************************************************************
 * 6.4.1 PUBLISH FINALIZED NORMALIZED MODEL
 ********************************************************************/

FinancialNormalizer.prototype.publishNormalizedModel =
    function () {

        /*
         * Only a successfully finalized and validated
         * model may be published downstream.
         */

        if (
            this.status !==
                FinancialNormalizerStatus.COMPLETE ||

            this.normalizedModel?.finalized !==
                true ||

            this.normalizedModel
                ?.validation
                ?.valid !==
                true
        ) {

            return false;

        }


        /*
         * Obtain a safe cloned model through the
         * Section 6.3 public retrieval API.
         *
         * Never expose this.normalizedModel directly.
         */

        const publicModel =
            this.getNormalizedModel();

        if (
            !FinancialNormalizerUtils
                .isObject(
                    publicModel
                )
        ) {

            return false;

        }


        /*
         * MODEL_READY is the existing FIPE-4 downstream
         * contract.
         *
         * Future consumers subscribe to this event
         * without FIPE-4 needing to know their identity.
         */

        document.dispatchEvent(

            new CustomEvent(

                FinancialNormalizerEvents.MODEL_READY,

                {

                    detail: {

                        component:
                            this.component,

                        version:
                            this.version,

                        model:
                            publicModel

                    }

                }

            )

        );

       /*
 * After the financial artifact has been made
 * available, announce lifecycle completion.
 */

return this.publishCompletion();

    };

/********************************************************************
 * 6.4.2 PUBLISH COMPLETION LIFECYCLE EVENT
 ********************************************************************/

FinancialNormalizer.prototype.publishCompletion =
    function () {

        /*
         * Completion may only be announced after
         * successful finalization.
         */

        if (
            this.status !==
                FinancialNormalizerStatus.COMPLETE ||

            this.normalizedModel?.finalized !==
                true ||

            this.normalizedModel
                ?.validation
                ?.valid !==
                true
        ) {

            return false;

        }


        /*
         * COMPLETE is a lifecycle event.
         *
         * It deliberately does not carry the full
         * normalized financial model.
         *
         * Consumers requiring financial data should
         * subscribe to MODEL_READY.
         */

        document.dispatchEvent(

            new CustomEvent(

                FinancialNormalizerEvents.COMPLETE,

                {

                    detail: {

                        component:
                            this.component,

                        version:
                            this.version,

                        status:
                            this.status,

                        finalized:
                            true,

                        completedAt:
                            this.normalizedModel
                                .audit
                                .completedAt

                    }

                }

            )

        );

        return true;

    };

/********************************************************************
 * END SECTION 6.4
 ********************************************************************/
/********************************************************************
 * 6.5 RESET AND LIFECYCLE SUPPORT
 ********************************************************************/


/********************************************************************
 * 6.5.1 RESET PROCESSING STATE
 ********************************************************************/

FinancialNormalizer.prototype.reset =
    function () {

        /*
         * Preserve lifecycle identity.
         *
         * Reset clears processing state only.
         * It must not recreate event listeners or
         * destroy component configuration.
         */

        const wasInitialized =
            this.initialized === true;


        /*
         * Remove the accepted FIPE-3 source model.
         */

        this.sourceModel =
            null;


        /*
         * Rebuild a clean FIPE-4 normalized-model contract.
         *
         * This clears:
         *
         * - normalized records
         * - preserved context
         * - normalization statistics
         * - validation result
         * - finalization metadata
         * - audit timestamps
         */

        this.normalizedModel =
            createNormalizedFinancialModel();


        /*
         * Restore lifecycle state.
         *
         * An initialized component remains initialized
         * and returns to READY.
         *
         * A never-initialized component remains in its
         * original non-ready lifecycle state.
         */

        if (wasInitialized) {

            this.status =
                FinancialNormalizerStatus.READY;

        }

        return true;

    };


/********************************************************************
 * END SECTION 6.5
 ********************************************************************/
