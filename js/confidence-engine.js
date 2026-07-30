"use strict";

/********************************************************************
 * ENTERPRISE PERFORMANCE INTELLIGENCE
 * CONFIDENCE ENGINE
 *
 * Purpose:
 *
 * Qualify normalized financial evidence for downstream
 * intelligence generation by producing deterministic,
 * explainable confidence assessments.
 *
 * Upstream:
 * FIPE-4 Financial Normalizer
 *
 * Input Event:
 * epi:normalized-model-ready
 *
 * Downstream:
 * Blueprint Execution Infrastructure
 * PB-001 through PB-010
 *
 * Design Principles:
 *
 * 1. Preserve upstream evidence.
 * 2. Never fabricate missing facts.
 * 3. Separate validity from confidence.
 * 4. Separate confidence from materiality.
 * 5. Distinguish LOW confidence from UNKNOWN confidence.
 * 6. Every confidence judgment must be explainable.
 * 7. Numeric confidence scores are deterministic decision-support
 *    scores, not statistical probabilities.
 ********************************************************************/


/********************************************************************
 * SECTION 1
 * MODULE FOUNDATION AND CONTRACT
 ********************************************************************/


/********************************************************************
 * 1.1 MODULE IDENTITY
 ********************************************************************/

const ConfidenceEngineIdentity =
    Object.freeze({

        COMPONENT:
            "Confidence Engine",

        MODULE:
            "confidence-engine",

        VERSION:
            "1.0.0",

        CONTRACT_VERSION:
            "1.0.0"

    });


/********************************************************************
 * 1.2 LIFECYCLE STATUS CONTRACT
 ********************************************************************/

const ConfidenceEngineStatus =
    Object.freeze({

        CREATED:
            "CREATED",

        READY:
            "READY",

        PROCESSING:
            "PROCESSING",

        COMPLETE:
            "COMPLETE",

        ERROR:
            "ERROR"

    });


/********************************************************************
 * 1.3 EVENT CONTRACT
 ********************************************************************/

const ConfidenceEngineEvents =
    Object.freeze({

        /*
         * Existing FIPE-4 downstream artifact event.
         */

        INPUT:
            "epi:normalized-model-ready",


        /*
         * Confidence Engine lifecycle events.
         */

        STARTED:
            "epi:confidence-engine-started",

        MODEL_READY:
            "epi:confidence-model-ready",

        COMPLETE:
            "epi:confidence-engine-complete",

        ERROR:
            "epi:confidence-engine-error"

    });


/********************************************************************
 * 1.4 CONFIDENCE BAND CONTRACT
 ********************************************************************/

const ConfidenceBand =
    Object.freeze({

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
 * 1.5 CONFIDENCE DIMENSION CONTRACT
 ********************************************************************/

const ConfidenceDimension =
    Object.freeze({

        SOURCE_TRACEABILITY:
            "sourceTraceability",

        EXTRACTION_RELIABILITY:
            "extractionReliability",

        NORMALIZATION_CERTAINTY:
            "normalizationCertainty",

        COMPLETENESS:
            "completeness",

        CONSISTENCY:
            "consistency",

        CORROBORATION:
            "corroboration"

    });


/********************************************************************
 * 1.6 CONFIDENCE REASON-CODE CONTRACT
 *
 * These codes explain WHY confidence changed.
 *
 * They are not user-facing prose and do not yet assign numerical
 * penalties or weights.
 ********************************************************************/

const ConfidenceReasonCode =
    Object.freeze({

        /*
         * Source traceability.
         */

        SOURCE_TRACEABLE:
            "SOURCE_TRACEABLE",

        SOURCE_PARTIALLY_TRACEABLE:
            "SOURCE_PARTIALLY_TRACEABLE",

        SOURCE_UNTRACEABLE:
            "SOURCE_UNTRACEABLE",


        /*
         * Extraction reliability.
         */

        EXTRACTION_HIGH_CONFIDENCE:
            "EXTRACTION_HIGH_CONFIDENCE",

        EXTRACTION_MEDIUM_CONFIDENCE:
            "EXTRACTION_MEDIUM_CONFIDENCE",

        EXTRACTION_LOW_CONFIDENCE:
            "EXTRACTION_LOW_CONFIDENCE",

        EXTRACTION_CONFIDENCE_UNKNOWN:
            "EXTRACTION_CONFIDENCE_UNKNOWN",


        /*
         * Normalization.
         */

        NORMALIZATION_COMPLETE:
            "NORMALIZATION_COMPLETE",

        NORMALIZATION_PARTIAL:
            "NORMALIZATION_PARTIAL",

        NORMALIZATION_UNRESOLVED:
            "NORMALIZATION_UNRESOLVED",


        /*
         * Completeness.
         */

        REQUIRED_FIELDS_COMPLETE:
            "REQUIRED_FIELDS_COMPLETE",

        REQUIRED_FIELDS_PARTIAL:
            "REQUIRED_FIELDS_PARTIAL",

        REQUIRED_FIELDS_INSUFFICIENT:
            "REQUIRED_FIELDS_INSUFFICIENT",


        /*
         * Consistency.
         */

        NO_CONFLICT_DETECTED:
            "NO_CONFLICT_DETECTED",

        CONFLICT_DETECTED:
            "CONFLICT_DETECTED",

        CONSISTENCY_NOT_ASSESSABLE:
            "CONSISTENCY_NOT_ASSESSABLE",


        /*
         * Corroboration.
         */

        CORROBORATED:
            "CORROBORATED",

        NOT_CORROBORATED:
            "NOT_CORROBORATED",

        CORROBORATION_NOT_ASSESSABLE:
            "CORROBORATION_NOT_ASSESSABLE",


        /*
         * Overall confidence state.
         */

        INSUFFICIENT_EVIDENCE:
            "INSUFFICIENT_EVIDENCE",

        CRITICAL_DIMENSION_CAP:
            "CRITICAL_DIMENSION_CAP"

    });


/********************************************************************
 * 1.7 CREATE CONFIDENCE DIMENSIONS
 *
 * Scores remain null until the relevant dimension engine evaluates
 * the evidence.
 *
 * null is deliberate:
 *
 * null = not yet assessed / not assessable
 * 0    = assessed and scored zero
 *
 * These meanings must never be collapsed.
 ********************************************************************/

function createConfidenceDimensions() {

    return {

        sourceTraceability:
            null,

        extractionReliability:
            null,

        normalizationCertainty:
            null,

        completeness:
            null,

        consistency:
            null,

        corroboration:
            null

    };

}


/********************************************************************
 * 1.8 CREATE CONFIDENCE ASSESSMENT
 ********************************************************************/

function createConfidenceAssessment() {

    return {

        /*
         * Overall deterministic confidence score.
         *
         * null means confidence has not yet been defensibly scored.
         */

        score:
            null,


        /*
         * UNKNOWN is the safe default.
         */

        band:
            ConfidenceBand.UNKNOWN,


        /*
         * Independent confidence dimensions.
         */

        dimensions:
            createConfidenceDimensions(),


        /*
         * Machine-readable explanations.
         */

        reasonCodes:
            [],


        /*
         * Human-readable diagnostic explanations.
         */

        reasons:
            [],

        warnings:
            [],


        /*
         * Records whether a critical confidence cap
         * affected the final assessment.
         */

        capped:
            false,

        capReason:
            null

    };

}


/********************************************************************
 * 1.9 CREATE CONFIDENCE RECORD
 *
 * A confidence record wraps a preserved FIPE-4 record.
 *
 * The original normalized evidence must not be rewritten by the
 * Confidence Engine.
 ********************************************************************/

function createConfidenceRecord() {

    return {

        /*
         * Position of the corresponding FIPE-4 record.
         */

        recordIndex:
            null,


        /*
         * Convenience identifier for downstream blueprint logic.
         */

        canonicalConcept:
            "",


        /*
         * Preserved FIPE-4 normalized record.
         *
         * Populated later using a defensive clone.
         */

        evidence:
            null,


        /*
         * Confidence assessment generated by this engine.
         */

        confidence:
            createConfidenceAssessment()

    };

}


/********************************************************************
 * 1.10 CREATE CONFIDENCE MODEL
 ********************************************************************/

function createConfidenceModel() {

    return {

        component:
            ConfidenceEngineIdentity.COMPONENT,

        version:
            ConfidenceEngineIdentity.VERSION,

        contractVersion:
            ConfidenceEngineIdentity.CONTRACT_VERSION,


        /*
         * Confidence-qualified records.
         */

        records:
            [],


        /*
         * Model-level confidence summary.
         *
         * Populated in later sections.
         */

        summary: {

            score:
                null,

            band:
                ConfidenceBand.UNKNOWN,

            evidenceCoverage:
                null,

            conceptCoverage:
                null,

            periodCoverage:
                null,

            conflicts:
                0,

            dataGaps:
                0

        },


        /*
         * Runtime statistics.
         */

        statistics: {

            inputRecords:
                0,

            assessedRecords:
                0,

            highConfidenceRecords:
                0,

            mediumConfidenceRecords:
                0,

            lowConfidenceRecords:
                0,

            unknownConfidenceRecords:
                0,

            conflictsDetected:
                0,

            corroboratedRecords:
                0

        },


        /*
         * Validation contract.
         */

        validation:
            null,


        /*
         * Finalization state.
         */

        finalized:
            false,

        finalizedBy:
            "",

        finalizedVersion:
            "",


        /*
         * Audit metadata.
         */

        audit: {

            createdAt:
                ConfidenceEngineUtils.now(),

            startedAt:
                null,

            completedAt:
                null

        }

    };

}


/********************************************************************
 * 1.11 UTILITY FOUNDATION
 ********************************************************************/

const ConfidenceEngineUtils =
    Object.freeze({

        now() {

            return new Date()
                .toISOString();

        },


        isObject(value) {

            return (

                value !== null &&

                typeof value ===
                    "object" &&

                !Array.isArray(value)

            );

        },


        clone(value) {

            if (
                value === undefined
            ) {

                return undefined;

            }

            if (
                typeof structuredClone ===
                    "function"
            ) {

                return structuredClone(
                    value
                );

            }

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        },


        isFiniteNumber(value) {

            return (

                typeof value ===
                    "number" &&

                Number.isFinite(value)

            );

        },


        clampScore(value) {

            if (
                !this.isFiniteNumber(value)
            ) {

                return null;

            }

            return Math.min(

                100,

                Math.max(
                    0,
                    Math.round(value)
                )

            );

        }

    });


/********************************************************************
 * 1.12 CONFIDENCE ENGINE CLASS FOUNDATION
 ********************************************************************/

class ConfidenceEngine {

    constructor() {

        this.component =
            ConfidenceEngineIdentity.COMPONENT;

        this.version =
            ConfidenceEngineIdentity.VERSION;

        this.contractVersion =
            ConfidenceEngineIdentity.CONTRACT_VERSION;


        /*
         * Lifecycle state.
         */

        this.status =
            ConfidenceEngineStatus.CREATED;

        this.initialized =
            false;


        /*
         * FIPE-4 input model.
         *
         * Populated only after the validated/finalized FIPE-4
         * contract is accepted in Section 2.
         */

        this.sourceModel =
            null;


        /*
         * Confidence-qualified output model.
         */

        this.confidenceModel =
            createConfidenceModel();


        /*
         * Runtime statistics remain separate from the public model
         * until synchronization logic is engineered.
         */

        this.statistics = {

            inputRecords:
                0,

            assessedRecords:
                0,

            highConfidenceRecords:
                0,

            mediumConfidenceRecords:
                0,

            lowConfidenceRecords:
                0,

            unknownConfidenceRecords:
                0,

            conflictsDetected:
                0,

            corroboratedRecords:
                0

        };

    }

}


/********************************************************************
 * 1.13 SAFE GLOBAL EXPORTS
 *
 * Explicit exports make browser-console qualification possible
 * without relying on top-level lexical bindings being exposed as
 * window properties.
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window.ConfidenceEngine =
        ConfidenceEngine;

    window.ConfidenceEngineIdentity =
        ConfidenceEngineIdentity;

    window.ConfidenceEngineStatus =
        ConfidenceEngineStatus;

    window.ConfidenceEngineEvents =
        ConfidenceEngineEvents;

    window.ConfidenceBand =
        ConfidenceBand;

    window.ConfidenceDimension =
        ConfidenceDimension;

    window.ConfidenceReasonCode =
        ConfidenceReasonCode;

    window.ConfidenceEngineUtils =
        ConfidenceEngineUtils;

    window.createConfidenceDimensions =
        createConfidenceDimensions;

    window.createConfidenceAssessment =
        createConfidenceAssessment;

    window.createConfidenceRecord =
        createConfidenceRecord;

    window.createConfidenceModel =
        createConfidenceModel;

}


/********************************************************************
 * END SECTION 1
 ********************************************************************/
/********************************************************************
 * SECTION 2
 * INITIALIZATION AND FIPE-4 HANDOFF
 ********************************************************************/


/********************************************************************
 * 2.1 INITIALIZE
 ********************************************************************/

ConfidenceEngine.prototype.initialize =
    function () {

        /*
         * Initialization must be idempotent.
         *
         * Repeated calls must not create duplicate
         * event listeners.
         */

        if (
            this.initialized === true
        ) {

            return true;

        }


        /*
         * Register the FIPE-4 input contract.
         */

        if (
            !this.registerDefaultEvents()
        ) {

            this.status =
                ConfidenceEngineStatus.ERROR;

            return false;

        }


        this.initialized =
            true;

        this.status =
            ConfidenceEngineStatus.READY;

        return true;

    };


/********************************************************************
 * 2.2 REGISTER DEFAULT EVENTS
 ********************************************************************/

ConfidenceEngine.prototype.registerDefaultEvents = function () {

    /*
     * Prevent duplicate registration of the FIPE-4
     * normalized-model input listener.
     */

    if (
        typeof this._normalizedModelListener ===
            "function"
    ) {

        return true;

    }


    /*
     * Preserve the listener reference so the same
     * handler is used for this engine instance.
     *
     * The INPUT event represents the completed FIPE-4
     * handoff into the Confidence Engine.
     *
     * Lifecycle completion must occur only AFTER the
     * normalized model has been successfully received,
     * validated, accepted, initialized and prepared.
     */

    this._normalizedModelListener =

        event => {

            const received =

                this.receiveNormalizedModel(
                    event
                );


            /*
             * Do not attempt confidence orchestration when
             * the incoming FIPE-4 contract was rejected.
             *
             * receiveNormalizedModel() owns rejection state.
             */

            if (
                received !==
                    true
            ) {

                return;

            }


            /*
             * The model is now in PROCESSING state.
             *
             * Complete the authoritative Confidence Engine
             * lifecycle exactly once through the existing
             * Section 6.2 completion boundary.
             */

            this.completeConfidenceLifecycle();

        };


    /*
     * Register the FIPE-4 normalized-model handoff.
     */

    document.addEventListener(

        ConfidenceEngineEvents.INPUT,

        this._normalizedModelListener

    );


    /*
     * Registration itself is successful.
     *
     * Do NOT complete the lifecycle here.
     * No FIPE-4 model has been received yet.
     */

    return true;

}

/********************************************************************
 * 2.3 RECEIVE NORMALIZED MODEL
 ********************************************************************/

ConfidenceEngine.prototype.receiveNormalizedModel =
    function (event) {

        /*
         * The Confidence Engine must be initialized before
         * accepting pipeline input.
         */

        if (
            this.initialized !== true
        ) {

            this.status =
                ConfidenceEngineStatus.ERROR;

            return false;

        }


        /*
         * FIPE-4 MODEL_READY contract:
         *
         * event.detail.model
         */

        const incomingModel =
            event?.detail?.model;


        /*
         * Validate before accepting or storing anything.
         */

        const validation =
            this.validateInputContract(
                incomingModel
            );

        if (
            validation.valid !== true
        ) {

            this.status =
                ConfidenceEngineStatus.ERROR;

            return false;

        }


        /*
         * Accept a defensive clone.
         */

        if (
            !this.acceptNormalizedModel(
                incomingModel
            )
        ) {

            this.status =
                ConfidenceEngineStatus.ERROR;

            return false;

        }


        /*
         * Create one confidence record for every
         * accepted FIPE-4 normalized record.
         */

        if (
            !this.initializeConfidenceRecords()
        ) {

            this.status =
                ConfidenceEngineStatus.ERROR;

            return false;

        }

/*
 * Prepare confidence-relevant evidence signals.
 *
 * This does not score confidence.
 */

if (
    !this.prepareConfidenceRecords()
) {

    this.status =
        ConfidenceEngineStatus.ERROR;

    return false;

}

        /*
         * Synchronize input statistics.
         */

        this.synchronizeInputStatistics();


        /*
         * Input has been accepted and is ready for
         * confidence assessment.
         *
         * Actual assessment begins in later sections.
         */

        this.status =
            ConfidenceEngineStatus.PROCESSING;


        /*
         * Record processing start time only after
         * successful contract acceptance.
         */

        if (
            this.confidenceModel?.audit
        ) {

            this.confidenceModel
                .audit
                .startedAt =

                    ConfidenceEngineUtils.now();

        }


        /*
         * Announce lifecycle start.
         *
         * This event carries metadata only.
         * It does not expose the source model.
         */

        document.dispatchEvent(

            new CustomEvent(

                ConfidenceEngineEvents.STARTED,

                {

                    detail: {

                        component:
                            this.component,

                        version:
                            this.version,

                        status:
                            this.status,

                        inputRecords:
                            this.statistics
                                .inputRecords

                    }

                }

            )

        );

        return true;

    };


/********************************************************************
 * 2.4 VALIDATE FIPE-4 INPUT CONTRACT
 ********************************************************************/

ConfidenceEngine.prototype.validateInputContract =
    function (model) {

        const errors = [];


        /*
         * Model must exist.
         */

        if (
            !ConfidenceEngineUtils
                .isObject(
                    model
                )
        ) {

            errors.push(
                "Normalized financial model is unavailable."
            );

            return {

                valid:
                    false,

                errors

            };

        }


        /*
         * FIPE-4 records collection is mandatory.
         *
         * An empty records array is structurally valid.
         * Confidence coverage can be assessed later.
         */

        if (
            !Array.isArray(
                model.records
            )
        ) {

            errors.push(
                "Normalized financial records collection is unavailable."
            );

        }


        /*
         * Only finalized FIPE-4 artifacts may enter
         * confidence assessment.
         */

        if (
            model.finalized !==
                true
        ) {

            errors.push(
                "Normalized financial model is not finalized."
            );

        }


        /*
         * FIPE-4 validation must explicitly have passed.
         */

        if (
            !ConfidenceEngineUtils
                .isObject(
                    model.validation
                )
        ) {

            errors.push(
                "Normalized financial model validation is unavailable."
            );

        } else if (
            model.validation.valid !==
                true
        ) {

            errors.push(
                "Normalized financial model failed validation."
            );

        }


        /*
         * Audit metadata provides provenance that this
         * artifact passed through FIPE-4 finalization.
         */

        if (
            !ConfidenceEngineUtils
                .isObject(
                    model.audit
                )
        ) {

            errors.push(
                "Normalized financial model audit metadata is unavailable."
            );

        } else if (
            !model.audit.completedAt
        ) {

            errors.push(
                "Normalized financial model completion timestamp is unavailable."
            );

        }


        return {

            valid:
                errors.length === 0,

            errors

        };

    };


/********************************************************************
 * 2.5 ACCEPT NORMALIZED MODEL
 ********************************************************************/

ConfidenceEngine.prototype.acceptNormalizedModel =
    function (model) {

        const validation =
            this.validateInputContract(
                model
            );

        if (
            validation.valid !== true
        ) {

            return false;

        }


        /*
         * Never retain the event payload by reference.
         *
         * Although FIPE-4 already publishes a clone,
         * the Confidence Engine establishes its own
         * defensive ownership boundary.
         */

        this.sourceModel =
            ConfidenceEngineUtils.clone(
                model
            );


        /*
         * Each accepted input begins with a fresh
         * Confidence Engine output contract.
         *
         * This prevents stale confidence assessments
         * from a previous run leaking into the new run.
         */

        this.confidenceModel =
            createConfidenceModel();


        /*
         * Reset runtime statistics for the new run.
         */

        this.statistics = {

            inputRecords:
                0,

            assessedRecords:
                0,

            highConfidenceRecords:
                0,

            mediumConfidenceRecords:
                0,

            lowConfidenceRecords:
                0,

            unknownConfidenceRecords:
                0,

            conflictsDetected:
                0,

            corroboratedRecords:
                0

        };

        return true;

    };


/********************************************************************
 * 2.6 INITIALIZE CONFIDENCE RECORDS
 ********************************************************************/

ConfidenceEngine.prototype.initializeConfidenceRecords =
    function () {

        if (
            !Array.isArray(
                this.sourceModel?.records
            ) ||

            !Array.isArray(
                this.confidenceModel?.records
            )
        ) {

            return false;

        }


        this.confidenceModel.records =

            this.sourceModel.records.map(

                (sourceRecord, index) => {

                    const confidenceRecord =
                        createConfidenceRecord();


                    /*
                     * Preserve positional linkage to FIPE-4.
                     */

                    confidenceRecord.recordIndex =
                        index;


                    /*
                     * Convenience concept identifier.
                     *
                     * Do not infer or fabricate one.
                     */

                    confidenceRecord.canonicalConcept =

                        typeof sourceRecord
                            ?.canonicalConcept ===
                            "string"

                            ? sourceRecord
                                .canonicalConcept

                            : "";


                    /*
                     * Preserve FIPE-4 evidence defensively.
                     *
                     * Each confidence record receives its
                     * own clone.
                     */

                    confidenceRecord.evidence =

                        ConfidenceEngineUtils.clone(
                            sourceRecord
                        );


                    return confidenceRecord;

                }

            );

        return true;

    };


/********************************************************************
 * 2.7 SYNCHRONIZE INPUT STATISTICS
 ********************************************************************/

ConfidenceEngine.prototype.synchronizeInputStatistics =
    function () {

        if (
            !Array.isArray(
                this.sourceModel?.records
            ) ||

            !ConfidenceEngineUtils
                .isObject(
                    this.confidenceModel
                        ?.statistics
                )
        ) {

            return false;

        }


        const inputRecordCount =
            this.sourceModel
                .records
                .length;


        this.statistics.inputRecords =
            inputRecordCount;


        this.confidenceModel
            .statistics
            .inputRecords =

                inputRecordCount;


        /*
         * No records have been assessed yet.
         */

        this.statistics.assessedRecords =
            0;

        this.confidenceModel
            .statistics
            .assessedRecords =
                0;

        return true;

    };


/********************************************************************
 * 2.8 INPUT DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.inputDiagnostics =
    function () {

        const issues = [];


        if (
            this.initialized !== true
        ) {

            issues.push(
                "Confidence Engine is not initialized."
            );

        }


        if (
            this.status ===
                ConfidenceEngineStatus.ERROR
        ) {

            issues.push(
                "Confidence Engine is in ERROR status."
            );

        }


        if (
            this.sourceModel !== null
        ) {

            const validation =
                this.validateInputContract(
                    this.sourceModel
                );

            if (
                validation.valid !== true
            ) {

                issues.push(
                    ...validation.errors
                );

            }

        }


        const waitingForInput =

            this.initialized === true &&

            this.status ===
                ConfidenceEngineStatus.READY &&

            this.sourceModel ===
                null;


        const processing =

            this.initialized === true &&

            this.status ===
                ConfidenceEngineStatus.PROCESSING &&

            this.sourceModel !==
                null;


        return {

            healthy:
                issues.length === 0,

            ready:
                this.initialized === true &&

                this.status !==
                    ConfidenceEngineStatus.ERROR,

            waitingForInput,

            processing,

            status:
                this.status,

            issues

        };

    };


/********************************************************************
 * END SECTION 2
 ********************************************************************/
/********************************************************************
 * SECTION 3
 * EVIDENCE PRESERVATION AND CONFIDENCE RECORD PREPARATION
 *
 * PURPOSE:
 *
 * Prepare FIPE-4 normalized evidence for deterministic confidence
 * assessment without modifying, inferring, or scoring the evidence.
 *
 * This section:
 *
 * 1. Preserves FIPE-4 evidence.
 * 2. Extracts assessment signals already present in the evidence.
 * 3. Records whether confidence-relevant fields are available.
 * 4. Prepares confidence records for later scoring.
 *
 * This section DOES NOT:
 *
 * - calculate confidence scores,
 * - assign confidence bands,
 * - infer missing financial facts,
 * - perform conflict detection,
 * - perform corroboration,
 * - execute PB-001 through PB-010,
 * - perform AI reasoning.
 ********************************************************************/


/********************************************************************
 * 3.1 CREATE EVIDENCE PROFILE
 *
 * This profile contains only confidence-relevant observations about
 * evidence already present in the FIPE-4 record.
 *
 * Boolean fields indicate presence or assessability.
 *
 * They do NOT indicate quality scores.
 ********************************************************************/

function createEvidenceProfile() {

    return {

        /*
         * SOURCE TRACEABILITY SIGNALS
         */

        sourceTraceability: {

            hasSource:
                false,

            hasSourceText:
                false,

            hasPage:
                false,

            hasTableId:
                false,

            hasRow:
                false,

            hasColumn:
                false,

            hasCoordinates:
                false,

            hasExtractionMethod:
                false

        },


        /*
         * EXTRACTION RELIABILITY SIGNALS
         */

        extractionReliability: {

            available:
                false,

            sourceConfidence:
                null

        },


        /*
         * NORMALIZATION CERTAINTY SIGNALS
         */

        normalizationCertainty: {

            hasCanonicalConcept:
                false,

            hasNormalizedValue:
                false,

            hasNormalizedCurrency:
                false,

            hasNormalizedPeriod:
                false,

            hasNormalizedUnit:
                false,

            normalizationConfidenceAvailable:
                false,

            normalizationConfidence:
                null

        },


        /*
         * COMPLETENESS SIGNALS
         *
         * These describe whether core analytical fields exist.
         * They do not yet determine whether the record is complete
         * enough for any specific blueprint.
         */

        completeness: {

            hasConcept:
                false,

            hasValue:
                false,

            hasCurrency:
                false,

            hasPeriod:
                false,

            hasUnit:
                false

        },


        /*
         * CONSISTENCY IS NOT ASSESSED IN SECTION 3.
         */

        consistency: {

            assessable:
                false,

            conflicts:
                []

        },


        /*
         * CORROBORATION IS NOT ASSESSED IN SECTION 3.
         */

        corroboration: {

            assessable:
                false,

            supportingRecords:
                []

        }

    };

}


/********************************************************************
 * 3.2 HELPER — MEANINGFUL VALUE
 *
 * Determines whether a value is genuinely present.
 *
 * Important:
 *
 * 0 is meaningful.
 * false is meaningful.
 *
 * null, undefined, empty strings and explicit UNKNOWN markers are
 * treated as unavailable.
 ********************************************************************/

ConfidenceEngine.prototype.hasMeaningfulValue =
    function (value) {

        if (
            value === null ||

            value === undefined
        ) {

            return false;

        }


        if (
            typeof value ===
                "string"
        ) {

            const normalized =
                value
                    .trim()
                    .toUpperCase();

            if (
                normalized === "" ||

                normalized === "UNKNOWN" ||

                normalized === "N/A" ||

                normalized === "NA" ||

                normalized === "NULL"
            ) {

                return false;

            }

        }

        return true;

    };


/********************************************************************
 * 3.3 BUILD SOURCE TRACEABILITY PROFILE
 ********************************************************************/

ConfidenceEngine.prototype.buildSourceTraceabilityProfile =
    function (evidence) {

        const profile = {

            hasSource:
                false,

            hasSourceText:
                false,

            hasPage:
                false,

            hasTableId:
                false,

            hasRow:
                false,

            hasColumn:
                false,

            hasCoordinates:
                false,

            hasExtractionMethod:
                false

        };


        if (
            !ConfidenceEngineUtils
                .isObject(
                    evidence
                )
        ) {

            return profile;

        }


        const source =

            ConfidenceEngineUtils
                .isObject(
                    evidence.source
                )

                ? evidence.source

                : {};


        /*
         * A preserved FIPE-4 source object is itself
         * a traceability signal.
         */

        profile.hasSource =

            ConfidenceEngineUtils
                .isObject(
                    evidence.source
                );


        /*
         * Prefer preserved source evidence.
         *
         * Fall back only to equivalent fields already present on the
         * FIPE-4 normalized record.
         *
         * Nothing is inferred.
         */

        profile.hasSourceText =

            this.hasMeaningfulValue(
                source.sourceText
            ) ||

            this.hasMeaningfulValue(
                evidence.sourceText
            );


        profile.hasPage =

            this.hasMeaningfulValue(
                source.page
            ) ||

            this.hasMeaningfulValue(
                evidence.page
            );


        profile.hasTableId =

            this.hasMeaningfulValue(
                source.tableId
            ) ||

            this.hasMeaningfulValue(
                evidence.tableId
            );


        profile.hasRow =

            this.hasMeaningfulValue(
                source.row
            ) ||

            this.hasMeaningfulValue(
                evidence.row
            );


        profile.hasColumn =

            this.hasMeaningfulValue(
                source.column
            ) ||

            this.hasMeaningfulValue(
                evidence.column
            );


        profile.hasCoordinates =

            ConfidenceEngineUtils
                .isObject(
                    source.coordinates
                ) ||

            ConfidenceEngineUtils
                .isObject(
                    evidence.coordinates
                );


        profile.hasExtractionMethod =

            this.hasMeaningfulValue(
                source.extractionMethod
            ) ||

            this.hasMeaningfulValue(
                evidence.extractionMethod
            );


        return profile;

    };


/********************************************************************
 * 3.4 BUILD EXTRACTION RELIABILITY PROFILE
 *
 * FIPE-3 extraction confidence may be preserved by FIPE-4 inside
 * the source evidence.
 *
 * We preserve it exactly.
 *
 * We do NOT convert HIGH/MEDIUM/LOW into a numeric score here.
 ********************************************************************/

ConfidenceEngine.prototype.buildExtractionReliabilityProfile =
    function (evidence) {

        const profile = {

            available:
                false,

            sourceConfidence:
                null

        };


        if (
            !ConfidenceEngineUtils
                .isObject(
                    evidence
                )
        ) {

            return profile;

        }


        const source =

            ConfidenceEngineUtils
                .isObject(
                    evidence.source
                )

                ? evidence.source

                : {};


        const sourceConfidence =

            this.hasMeaningfulValue(
                source.confidence
            )

                ? source.confidence

                : (

                    this.hasMeaningfulValue(
                        evidence.extractionConfidence
                    )

                        ? evidence.extractionConfidence

                        : null

                );


        if (
            sourceConfidence !== null
        ) {

            profile.available =
                true;

            profile.sourceConfidence =
                sourceConfidence;

        }


        return profile;

    };


/********************************************************************
 * 3.5 BUILD NORMALIZATION CERTAINTY PROFILE
 ********************************************************************/

ConfidenceEngine.prototype.buildNormalizationCertaintyProfile =
    function (evidence) {

        const profile = {

            hasCanonicalConcept:
                false,

            hasNormalizedValue:
                false,

            hasNormalizedCurrency:
                false,

            hasNormalizedPeriod:
                false,

            hasNormalizedUnit:
                false,

            normalizationConfidenceAvailable:
                false,

            normalizationConfidence:
                null

        };


        if (
            !ConfidenceEngineUtils
                .isObject(
                    evidence
                )
        ) {

            return profile;

        }


        profile.hasCanonicalConcept =

            this.hasMeaningfulValue(
                evidence.canonicalConcept
            );


        /*
         * Numeric zero must remain valid.
         */

        profile.hasNormalizedValue =

            ConfidenceEngineUtils
                .isFiniteNumber(
                    evidence.normalizedValue
                );


        profile.hasNormalizedCurrency =

            this.hasMeaningfulValue(
                evidence.normalizedCurrency
            );


        profile.hasNormalizedPeriod =

            this.hasMeaningfulValue(
                evidence.normalizedPeriod
            );


        profile.hasNormalizedUnit =

            this.hasMeaningfulValue(
                evidence.normalizedUnit
            );


        if (
            this.hasMeaningfulValue(
                evidence.normalizationConfidence
            )
        ) {

            profile
                .normalizationConfidenceAvailable =
                    true;

            profile.normalizationConfidence =

                ConfidenceEngineUtils.clone(
                    evidence.normalizationConfidence
                );

        }


        return profile;

    };


/********************************************************************
 * 3.6 BUILD COMPLETENESS PROFILE
 *
 * This is record-level structural completeness only.
 *
 * Blueprint-specific sufficiency belongs later when PB-001 through
 * PB-010 declare what evidence each executive question requires.
 ********************************************************************/

ConfidenceEngine.prototype.buildCompletenessProfile =
    function (evidence) {

        const profile = {

            hasConcept:
                false,

            hasValue:
                false,

            hasCurrency:
                false,

            hasPeriod:
                false,

            hasUnit:
                false

        };


        if (
            !ConfidenceEngineUtils
                .isObject(
                    evidence
                )
        ) {

            return profile;

        }


        profile.hasConcept =

            this.hasMeaningfulValue(
                evidence.canonicalConcept
            );


        profile.hasValue =

            ConfidenceEngineUtils
                .isFiniteNumber(
                    evidence.normalizedValue
                );


        profile.hasCurrency =

            this.hasMeaningfulValue(
                evidence.normalizedCurrency
            );


        profile.hasPeriod =

            this.hasMeaningfulValue(
                evidence.normalizedPeriod
            );


        profile.hasUnit =

            this.hasMeaningfulValue(
                evidence.normalizedUnit
            );


        return profile;

    };


/********************************************************************
 * 3.7 PREPARE EVIDENCE PROFILE
 *
 * Creates the complete assessment-ready evidence profile.
 *
 * No scoring occurs here.
 ********************************************************************/

ConfidenceEngine.prototype.prepareEvidenceProfile =
    function (evidence) {

        const profile =
            createEvidenceProfile();


        if (
            !ConfidenceEngineUtils
                .isObject(
                    evidence
                )
        ) {

            return profile;

        }


        profile.sourceTraceability =

            this.buildSourceTraceabilityProfile(
                evidence
            );


        profile.extractionReliability =

            this.buildExtractionReliabilityProfile(
                evidence
            );


        profile.normalizationCertainty =

            this.buildNormalizationCertaintyProfile(
                evidence
            );


        profile.completeness =

            this.buildCompletenessProfile(
                evidence
            );


        /*
         * Explicitly retain UNKNOWN / unassessed state
         * for later dimensions.
         */

        profile.consistency = {

            assessable:
                false,

            conflicts:
                []

        };


        profile.corroboration = {

            assessable:
                false,

            supportingRecords:
                []

        };


        return profile;

    };


/********************************************************************
 * 3.8 PREPARE CONFIDENCE RECORD
 *
 * Adds assessment metadata to an existing confidence record.
 *
 * The preserved FIPE-4 evidence is not modified.
 ********************************************************************/

ConfidenceEngine.prototype.prepareConfidenceRecord =
    function (confidenceRecord) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord.evidence
                )
        ) {

            return false;

        }


        confidenceRecord.evidenceProfile =

            this.prepareEvidenceProfile(
                confidenceRecord.evidence
            );


        return true;

    };


/********************************************************************
 * 3.9 PREPARE ALL CONFIDENCE RECORDS
 ********************************************************************/

ConfidenceEngine.prototype.prepareConfidenceRecords =
    function () {

        if (
            !Array.isArray(
                this.confidenceModel
                    ?.records
            )
        ) {

            return false;

        }


        let preparedCount =
            0;


        this.confidenceModel
            .records
            .forEach(

                confidenceRecord => {

                    if (
                        this.prepareConfidenceRecord(
                            confidenceRecord
                        )
                    ) {

                        preparedCount++;

                    }

                }

            );


        return (
            preparedCount ===
            this.confidenceModel
                .records
                .length
        );

    };


/********************************************************************
 * 3.10 EVIDENCE PREPARATION DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.evidencePreparationDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            preparedRecords:
                0,

            unpreparedRecords:
                0,

            recordsWithConcept:
                0,

            recordsWithValue:
                0,

            recordsWithCurrency:
                0,

            recordsWithPeriod:
                0,

            recordsWithUnit:
                0,

            recordsWithExtractionConfidence:
                0,

            recordsWithSourceTraceability:
                0

        };


        records.forEach(

            record => {

                const profile =
                    record.evidenceProfile;


                if (
                    !ConfidenceEngineUtils
                        .isObject(
                            profile
                        )
                ) {

                    diagnostics
                        .unpreparedRecords++;

                    return;

                }


                diagnostics
                    .preparedRecords++;


                if (
                    profile
                        .completeness
                        .hasConcept
                ) {

                    diagnostics
                        .recordsWithConcept++;

                }


                if (
                    profile
                        .completeness
                        .hasValue
                ) {

                    diagnostics
                        .recordsWithValue++;

                }


                if (
                    profile
                        .completeness
                        .hasCurrency
                ) {

                    diagnostics
                        .recordsWithCurrency++;

                }


                if (
                    profile
                        .completeness
                        .hasPeriod
                ) {

                    diagnostics
                        .recordsWithPeriod++;

                }


                if (
                    profile
                        .completeness
                        .hasUnit
                ) {

                    diagnostics
                        .recordsWithUnit++;

                }


                if (
                    profile
                        .extractionReliability
                        .available
                ) {

                    diagnostics
                        .recordsWithExtractionConfidence++;

                }


                const traceability =
                    profile.sourceTraceability;


                if (
                    traceability.hasSource ||

                    traceability.hasSourceText ||

                    traceability.hasPage ||

                    traceability.hasTableId ||

                    traceability.hasCoordinates
                ) {

                    diagnostics
                        .recordsWithSourceTraceability++;

                }

            }

        );


        return diagnostics;

    };


/********************************************************************
 * SAFE SECTION 3 EXPORT
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window.createEvidenceProfile =
        createEvidenceProfile;

}


/********************************************************************
 * END SECTION 3
 ********************************************************************/
/********************************************************************
 * SECTION 4
 * DETERMINISTIC EVIDENCE CONFIDENCE ASSESSMENT
 ********************************************************************/


/********************************************************************
 * 4.1 SCORING POLICY AND WEIGHT CONTRACT
 *
 * PURPOSE:
 *
 * Establish the deterministic scoring vocabulary used by later
 * confidence assessors.
 *
 * This subsection defines policy only.
 *
 * It DOES NOT:
 *
 * - score confidence records,
 * - assign record-level confidence bands,
 * - detect conflicts,
 * - determine corroboration,
 * - execute blueprints,
 * - perform AI reasoning.
 ********************************************************************/


/********************************************************************
 * 4.1.1 DIMENSION WEIGHT CONTRACT
 *
 * Weights total 1.00.
 *
 * Corroboration is deliberately excluded from the mandatory base
 * score because absence of independent corroboration does not, by
 * itself, make a valid financial fact unreliable.
 ********************************************************************/

const ConfidenceDimensionWeights =
    Object.freeze({

        sourceTraceability:
            0.20,

        extractionReliability:
            0.20,

        normalizationCertainty:
            0.25,

        completeness:
            0.20,

        consistency:
            0.15

    });


/********************************************************************
 * 4.1.2 SCORE BAND THRESHOLDS
 *
 * Scores are deterministic decision-support scores.
 * They are NOT statistical probabilities.
 *
 * UNKNOWN is not represented by a numeric threshold.
 * UNKNOWN is assigned only when evidence is insufficient for a
 * defensible overall assessment.
 ********************************************************************/

const ConfidenceScoreThresholds =
    Object.freeze({

        HIGH_MIN:
            85,

        MEDIUM_MIN:
            60,

        LOW_MIN:
            0,

        MAX:
            100

    });


/********************************************************************
 * 4.1.3 STANDARD DIMENSION SCORES
 *
 * Individual assessors may use these standardized values when their
 * evidence state maps cleanly to HIGH / MEDIUM / LOW.
 *
 * UNKNOWN remains null.
 ********************************************************************/

const ConfidenceStandardScores =
    Object.freeze({

        HIGH:
            100,

        MEDIUM:
            70,

        LOW:
            35,

        UNKNOWN:
            null

    });


/********************************************************************
 * 4.1.4 CRITICAL CONFIDENCE CAPS
 *
 * Caps prevent strong non-critical dimensions from mathematically
 * concealing a critical evidence weakness.
 *
 * These are policy ceilings, not automatic penalties.
 *
 * Later assessment logic decides whether a cap condition applies.
 ********************************************************************/

const ConfidenceCriticalCaps =
    Object.freeze({

        /*
         * A record without a usable normalized financial value cannot
         * support quantitative financial analysis.
         *
         * null means the overall confidence assessment should remain
         * UNKNOWN rather than receive a fabricated numeric score.
         */

        MISSING_NORMALIZED_VALUE:
            null,


        /*
         * Without a canonical financial concept, the record cannot
         * reliably support blueprint-level semantic analysis.
         */

        MISSING_CANONICAL_CONCEPT:
            59,


        /*
         * Evidence that cannot be materially traced to source should
         * not receive HIGH confidence.
         */

        UNTRACEABLE_SOURCE:
            59,


        /*
         * A material unresolved contradiction should prevent HIGH
         * confidence until resolved.
         */

        MATERIAL_CONFLICT:
            59,


        /*
         * If extraction itself is explicitly LOW confidence, strong
         * downstream normalization must not elevate the record to HIGH.
         */

        LOW_EXTRACTION_RELIABILITY:
            59

    });


/********************************************************************
 * 4.1.5 CORROBORATION POLICY
 *
 * Corroboration is treated separately from the base weighted score.
 *
 * NONE:
 * No independent corroboration has been established.
 * This is neutral, not a penalty.
 *
 * SUPPORTING:
 * Independent evidence supports the same fact.
 *
 * CONFLICTING:
 * Independent evidence materially conflicts with the fact.
 *
 * NOT_ASSESSABLE:
 * The system cannot defensibly determine corroboration.
 ********************************************************************/

const ConfidenceCorroborationState =
    Object.freeze({

        SUPPORTING:
            "SUPPORTING",

        NONE:
            "NONE",

        CONFLICTING:
            "CONFLICTING",

        NOT_ASSESSABLE:
            "NOT_ASSESSABLE"

    });


const ConfidenceCorroborationPolicy =
    Object.freeze({

        /*
         * Conservative MVP modifier.
         *
         * Supporting corroboration may strengthen an otherwise
         * defensible score slightly, but can never exceed 100.
         *
         * No corroboration is neutral.
         *
         * Conflicting corroboration is handled through consistency
         * and critical-cap logic rather than a hidden arithmetic
         * penalty here.
         */

        SUPPORTING_BONUS:
            5,

        NONE_ADJUSTMENT:
            0,

        NOT_ASSESSABLE_ADJUSTMENT:
            0

    });


/********************************************************************
 * 4.1.6 SCORING POLICY CONTRACT
 *
 * Central policy object for diagnostics and downstream assessors.
 ********************************************************************/

const ConfidenceScoringPolicy =
    Object.freeze({

        version:
            "1.0.0",

        scoreRange: {

            minimum:
                0,

            maximum:
                100

        },

        thresholds:
            ConfidenceScoreThresholds,

        standardScores:
            ConfidenceStandardScores,

        weights:
            ConfidenceDimensionWeights,

        criticalCaps:
            ConfidenceCriticalCaps,

        corroboration: {

            states:
                ConfidenceCorroborationState,

            policy:
                ConfidenceCorroborationPolicy

        },

        principles:
            Object.freeze({

                unknownIsNotZero:
                    true,

                useOnlyAssessableDimensions:
                    true,

                renormalizeAssessableWeights:
                    true,

                applyCriticalCaps:
                    true,

                corroborationIsMandatory:
                    false,

                scoreIsProbability:
                    false

            })

    });


/********************************************************************
 * 4.1.7 GET SCORING POLICY
 *
 * Returns a defensive clone so external consumers cannot mutate the
 * internal scoring contract.
 ********************************************************************/

ConfidenceEngine.prototype.getScoringPolicy =
    function () {

        return ConfidenceEngineUtils.clone(
            ConfidenceScoringPolicy
        );

    };


/********************************************************************
 * 4.1.8 VALIDATE DIMENSION WEIGHTS
 ********************************************************************/

ConfidenceEngine.prototype.validateDimensionWeights =
    function () {

        const weights =
            Object.values(
                ConfidenceDimensionWeights
            );


        if (
            weights.length === 0
        ) {

            return false;

        }


        if (
            !weights.every(

                weight =>

                    ConfidenceEngineUtils
                        .isFiniteNumber(
                            weight
                        ) &&

                    weight >= 0 &&

                    weight <= 1

            )
        ) {

            return false;

        }


        const total =
            weights.reduce(

                (sum, weight) =>
                    sum + weight,

                0

            );


        /*
         * Floating-point tolerance avoids equality defects such as
         * 0.1 + 0.2 !== 0.3.
         */

        return (
            Math.abs(
                total - 1
            ) < 0.000001
        );

    };


/********************************************************************
 * 4.1.9 CLASSIFY NUMERIC CONFIDENCE SCORE
 *
 * This helper classifies a defensible numeric score.
 *
 * null or invalid input returns UNKNOWN.
 *
 * It does not determine whether sufficient evidence exists to
 * calculate the score in the first place.
 ********************************************************************/

ConfidenceEngine.prototype.classifyConfidenceScore =
    function (score) {

        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    score
                )
        ) {

            return ConfidenceBand.UNKNOWN;

        }


        const normalizedScore =
            ConfidenceEngineUtils
                .clampScore(
                    score
                );


        if (
            normalizedScore >=
                ConfidenceScoreThresholds
                    .HIGH_MIN
        ) {

            return ConfidenceBand.HIGH;

        }


        if (
            normalizedScore >=
                ConfidenceScoreThresholds
                    .MEDIUM_MIN
        ) {

            return ConfidenceBand.MEDIUM;

        }


        return ConfidenceBand.LOW;

    };


/********************************************************************
 * 4.1.10 APPLY CONFIDENCE CAP
 *
 * Generic deterministic helper.
 *
 * A null cap deliberately produces null, representing a condition
 * where numeric confidence is not defensible.
 ********************************************************************/

ConfidenceEngine.prototype.applyConfidenceCap =
    function (
        score,
        cap
    ) {

        if (
            cap === null
        ) {

            return null;

        }


        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    score
                ) ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    cap
                )
        ) {

            return null;

        }


        return ConfidenceEngineUtils
            .clampScore(

                Math.min(
                    score,
                    cap
                )

            );

    };


/********************************************************************
 * 4.1.11 CALCULATE WEIGHT TOTAL
 *
 * Utility used to verify and later renormalize assessable dimensions.
 ********************************************************************/

ConfidenceEngine.prototype.getDimensionWeightTotal =
    function (
        dimensionNames = null
    ) {

        const names =

            Array.isArray(
                dimensionNames
            )

                ? dimensionNames

                : Object.keys(
                    ConfidenceDimensionWeights
                );


        return names.reduce(

            (total, dimensionName) => {

                const weight =
                    ConfidenceDimensionWeights[
                        dimensionName
                    ];


                return (

                    ConfidenceEngineUtils
                        .isFiniteNumber(
                            weight
                        )

                        ? total + weight

                        : total

                );

            },

            0

        );

    };


/********************************************************************
 * 4.1.12 SAFE SECTION 4.1 EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window.ConfidenceDimensionWeights =
        ConfidenceDimensionWeights;

    window.ConfidenceScoreThresholds =
        ConfidenceScoreThresholds;

    window.ConfidenceStandardScores =
        ConfidenceStandardScores;

    window.ConfidenceCriticalCaps =
        ConfidenceCriticalCaps;

    window.ConfidenceCorroborationState =
        ConfidenceCorroborationState;

    window.ConfidenceCorroborationPolicy =
        ConfidenceCorroborationPolicy;

    window.ConfidenceScoringPolicy =
        ConfidenceScoringPolicy;

}


/********************************************************************
 * END SECTION 4.1
 ********************************************************************/
/********************************************************************
 * 4.2 SOURCE TRACEABILITY ASSESSMENT
 *
 * PURPOSE:
 *
 * Determine how strongly a normalized financial fact can be traced
 * back to its originating evidence.
 *
 * This subsection evaluates only source-provenance signals prepared
 * in Section 3.
 *
 * It DOES NOT:
 *
 * - assess extraction reliability,
 * - assess normalization certainty,
 * - assess completeness,
 * - detect conflicts,
 * - assess corroboration,
 * - calculate overall record confidence,
 * - execute PB-001 through PB-010,
 * - perform AI reasoning.
 ********************************************************************/


/********************************************************************
 * 4.2.1 SOURCE TRACEABILITY SCORE WEIGHTS
 *
 * Total = 100 points.
 ********************************************************************/

const SourceTraceabilityScoreWeights =
    Object.freeze({

        hasSource:
            10,

        hasSourceText:
            25,

        hasPage:
            15,

        hasTableId:
            15,

        hasRow:
            10,

        hasColumn:
            10,

        hasCoordinates:
            10,

        hasExtractionMethod:
            5

    });


/********************************************************************
 * 4.2.2 SOURCE TRACEABILITY REASON CODES
 *
 * Reason codes are deterministic and machine-readable.
 *
 * Later AI reasoning may explain them in executive language,
 * but it must not invent or alter their evidentiary meaning.
 ********************************************************************/

const SourceTraceabilityReasonCodes =
    Object.freeze({

        STRONG:
            "SOURCE_TRACEABILITY_STRONG",

        PARTIAL:
            "SOURCE_TRACEABILITY_PARTIAL",

        WEAK:
            "SOURCE_TRACEABILITY_WEAK",

        UNKNOWN:
            "SOURCE_TRACEABILITY_UNKNOWN",

        SOURCE_OBJECT_MISSING:
            "SOURCE_OBJECT_MISSING",

        SOURCE_TEXT_MISSING:
            "SOURCE_TEXT_MISSING",

        PAGE_REFERENCE_MISSING:
            "PAGE_REFERENCE_MISSING",

        TABLE_REFERENCE_MISSING:
            "TABLE_REFERENCE_MISSING",

        ROW_REFERENCE_MISSING:
            "ROW_REFERENCE_MISSING",

        COLUMN_REFERENCE_MISSING:
            "COLUMN_REFERENCE_MISSING",

        COORDINATES_MISSING:
            "COORDINATES_MISSING",

        EXTRACTION_METHOD_MISSING:
            "EXTRACTION_METHOD_MISSING"

    });


/********************************************************************
 * 4.2.3 CREATE DIMENSION ASSESSMENT
 *
 * Generic shape used here for source traceability.
 *
 * UNKNOWN remains represented by score = null.
 ********************************************************************/

ConfidenceEngine.prototype.createDimensionAssessment =
    function (
        dimension
    ) {

        return {

            dimension:
                dimension,

            assessable:
                false,

            score:
                null,

            band:
                ConfidenceBand.UNKNOWN,

            reasonCodes:
                [],

            reasons:
                [],

            evidence:
                {},

            assessedAt:
                null

        };

    };


/********************************************************************
 * 4.2.4 VALIDATE SOURCE TRACEABILITY PROFILE
 *
 * A traceability profile is assessable when Section 3 produced the
 * expected profile structure containing boolean provenance signals.
 *
 * A profile with all values false is still assessable:
 *
 * it means traceability was assessed and found absent.
 *
 * That is LOW, not UNKNOWN.
 *
 * UNKNOWN is reserved for cases where the profile itself is missing
 * or structurally unusable.
 ********************************************************************/

ConfidenceEngine.prototype.isSourceTraceabilityAssessable =
    function (profile) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    profile
                )
        ) {

            return false;

        }


        const requiredSignals = [

            "hasSource",
            "hasSourceText",
            "hasPage",
            "hasTableId",
            "hasRow",
            "hasColumn",
            "hasCoordinates",
            "hasExtractionMethod"

        ];


        return requiredSignals.every(

            signal =>

                typeof profile[
                    signal
                ] === "boolean"

        );

    };


/********************************************************************
 * 4.2.5 CALCULATE SOURCE TRACEABILITY SCORE
 *
 * Pure deterministic arithmetic.
 *
 * No inference.
 * No hidden penalties.
 * No normalization beyond the explicit 100-point contract.
 ********************************************************************/

ConfidenceEngine.prototype.calculateSourceTraceabilityScore =
    function (profile) {

        if (
            !this.isSourceTraceabilityAssessable(
                profile
            )
        ) {

            return null;

        }


        let score =
            0;


        Object.entries(
            SourceTraceabilityScoreWeights
        )
        .forEach(

            ([signal, weight]) => {

                if (
                    profile[
                        signal
                    ] === true
                ) {

                    score +=
                        weight;

                }

            }

        );


        return ConfidenceEngineUtils
            .clampScore(
                score
            );

    };


/********************************************************************
 * 4.2.6 BUILD SOURCE TRACEABILITY REASONS
 *
 * Produces deterministic explainability.
 ********************************************************************/

ConfidenceEngine.prototype.buildSourceTraceabilityReasons =
    function (
        profile,
        score
    ) {

        const reasonCodes =
            [];

        const reasons =
            [];


        if (
            !this.isSourceTraceabilityAssessable(
                profile
            ) ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    score
                )
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .UNKNOWN
            );

            reasons.push(
                "Source traceability could not be assessed from the available evidence profile."
            );


            return {

                reasonCodes,
                reasons

            };

        }


        const band =
            this.classifyConfidenceScore(
                score
            );


        if (
            band ===
                ConfidenceBand.HIGH
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .STRONG
            );

            reasons.push(
                "The financial fact has strong source traceability."
            );

        } else if (
            band ===
                ConfidenceBand.MEDIUM
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .PARTIAL
            );

            reasons.push(
                "The financial fact has partial source traceability."
            );

        } else {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .WEAK
            );

            reasons.push(
                "The financial fact has weak source traceability."
            );

        }


        /*
         * Add explicit deficiency reasons.
         */

        if (
            profile.hasSource !==
                true
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .SOURCE_OBJECT_MISSING
            );

            reasons.push(
                "The preserved source evidence object is unavailable."
            );

        }


        if (
            profile.hasSourceText !==
                true
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .SOURCE_TEXT_MISSING
            );

            reasons.push(
                "Original source text is unavailable."
            );

        }


        if (
            profile.hasPage !==
                true
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .PAGE_REFERENCE_MISSING
            );

            reasons.push(
                "Page-level provenance is unavailable."
            );

        }


        if (
            profile.hasTableId !==
                true
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .TABLE_REFERENCE_MISSING
            );

            reasons.push(
                "Table-level provenance is unavailable."
            );

        }


        if (
            profile.hasRow !==
                true
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .ROW_REFERENCE_MISSING
            );

            reasons.push(
                "Row-level provenance is unavailable."
            );

        }


        if (
            profile.hasColumn !==
                true
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .COLUMN_REFERENCE_MISSING
            );

            reasons.push(
                "Column-level provenance is unavailable."
            );

        }


        if (
            profile.hasCoordinates !==
                true
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .COORDINATES_MISSING
            );

            reasons.push(
                "Explicit source coordinates are unavailable."
            );

        }


        if (
            profile.hasExtractionMethod !==
                true
        ) {

            reasonCodes.push(
                SourceTraceabilityReasonCodes
                    .EXTRACTION_METHOD_MISSING
            );

            reasons.push(
                "The extraction method is unavailable."
            );

        }


        return {

            reasonCodes,
            reasons

        };

    };


/********************************************************************
 * 4.2.7 ASSESS SOURCE TRACEABILITY
 *
 * Primary Section 4.2 assessor.
 *
 * Input:
 * Section 3 sourceTraceability profile.
 *
 * Output:
 * Explainable dimension assessment.
 ********************************************************************/

ConfidenceEngine.prototype.assessSourceTraceability =
    function (profile) {

        const assessment =

            this.createDimensionAssessment(
                "sourceTraceability"
            );


        /*
         * Preserve the assessed signals defensively.
         */

        assessment.evidence =

            ConfidenceEngineUtils
                .isObject(
                    profile
                )

                ? ConfidenceEngineUtils
                    .clone(
                        profile
                    )

                : {};


        if (
            !this.isSourceTraceabilityAssessable(
                profile
            )
        ) {

            const explanation =

                this.buildSourceTraceabilityReasons(
                    profile,
                    null
                );


            assessment.reasonCodes =
                explanation.reasonCodes;

            assessment.reasons =
                explanation.reasons;

            assessment.assessedAt =
                ConfidenceEngineUtils.now();


            return assessment;

        }


        const score =

            this.calculateSourceTraceabilityScore(
                profile
            );


        assessment.assessable =
            true;

        assessment.score =
            score;

        assessment.band =

            this.classifyConfidenceScore(
                score
            );


        const explanation =

            this.buildSourceTraceabilityReasons(
                profile,
                score
            );


        assessment.reasonCodes =
            explanation.reasonCodes;

        assessment.reasons =
            explanation.reasons;

        assessment.assessedAt =
            ConfidenceEngineUtils.now();


        return assessment;

    };


/********************************************************************
 * 4.2.8 ASSESS SOURCE TRACEABILITY FOR CONFIDENCE RECORD
 *
 * Writes only to the sourceTraceability dimension.
 *
 * It does NOT modify overall confidence.
 ********************************************************************/

ConfidenceEngine.prototype.assessRecordSourceTraceability =
    function (
        confidenceRecord
    ) {

        /*
         * Validate the confidence-record contract established
         * in Section 1 and extended with the Section 3
         * evidenceProfile.
         */

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .evidenceProfile
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                        .dimensions
                )
        ) {

            return false;

        }


        const profile =

            confidenceRecord
                .evidenceProfile
                .sourceTraceability;


        const assessment =

            this.assessSourceTraceability(
                profile
            );


        /*
         * Section 1 contract:
         *
         * confidenceRecord
         *     .confidence
         *     .dimensions
         *
         * Store only the source-traceability dimension here.
         *
         * Do not modify the overall confidence score or band.
         */

        confidenceRecord
            .confidence
            .dimensions
            .sourceTraceability =

                assessment;


        return true;

    };

/********************************************************************
 * 4.2.9 SOURCE TRACEABILITY DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.sourceTraceabilityDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            assessedRecords:
                0,

            high:
                0,

            medium:
                0,

            low:
                0,

            unknown:
                0

        };


        records.forEach(

            record => {

                const assessment =

    record
        ?.confidence
        ?.dimensions
        ?.sourceTraceability;


                if (
                    !ConfidenceEngineUtils
                        .isObject(
                            assessment
                        ) ||

                    assessment.assessable !==
                        true
                ) {

                    diagnostics.unknown++;

                    return;

                }


                diagnostics
                    .assessedRecords++;


                switch (
                    assessment.band
                ) {

                    case ConfidenceBand.HIGH:

                        diagnostics.high++;

                        break;


                    case ConfidenceBand.MEDIUM:

                        diagnostics.medium++;

                        break;


                    case ConfidenceBand.LOW:

                        diagnostics.low++;

                        break;


                    default:

                        diagnostics.unknown++;

                }

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 4.2.10 SAFE SECTION 4.2 EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window.SourceTraceabilityScoreWeights =
        SourceTraceabilityScoreWeights;

    window.SourceTraceabilityReasonCodes =
        SourceTraceabilityReasonCodes;

}


/********************************************************************
 * END SECTION 4.2
 ********************************************************************/
/********************************************************************
 * 4.3 EXTRACTION RELIABILITY ASSESSMENT
 *
 * PURPOSE:
 *
 * Interpret the upstream extraction-confidence evidence preserved
 * from FIPE-3 through FIPE-4 and Section 3.
 *
 * This subsection evaluates only extraction reliability.
 *
 * It DOES NOT:
 *
 * - infer extraction reliability from source traceability,
 * - infer extraction reliability from normalization quality,
 * - assess normalization certainty,
 * - assess completeness,
 * - assess consistency,
 * - assess corroboration,
 * - calculate overall confidence,
 * - apply critical confidence caps,
 * - execute PB-001 through PB-010,
 * - perform AI reasoning.
 ********************************************************************/


/********************************************************************
 * 4.3.1 EXTRACTION RELIABILITY REASON CODES
 ********************************************************************/

const ExtractionReliabilityReasonCodes =
    Object.freeze({

        HIGH:
            "EXTRACTION_RELIABILITY_HIGH",

        MEDIUM:
            "EXTRACTION_RELIABILITY_MEDIUM",

        LOW:
            "EXTRACTION_RELIABILITY_LOW",

        UNKNOWN:
            "EXTRACTION_RELIABILITY_UNKNOWN",

        SIGNAL_MISSING:
            "EXTRACTION_CONFIDENCE_SIGNAL_MISSING",

        SIGNAL_UNRECOGNIZED:
            "EXTRACTION_CONFIDENCE_SIGNAL_UNRECOGNIZED"

    });


/********************************************************************
 * 4.3.2 NORMALIZE EXTRACTION CONFIDENCE SIGNAL
 *
 * Accept only explicit upstream confidence vocabulary.
 *
 * No fuzzy inference.
 * No guessing.
 *
 * Case and surrounding whitespace are normalized because those are
 * representational differences, not semantic inference.
 ********************************************************************/

ConfidenceEngine.prototype.normalizeExtractionConfidenceSignal =
    function (value) {

        if (
            value === null ||
            value === undefined
        ) {

            return null;

        }


        const normalized =

            String(
                value
            )
            .trim()
            .toUpperCase();


        if (
            normalized ===
                ConfidenceBand.HIGH
        ) {

            return ConfidenceBand.HIGH;

        }


        if (
            normalized ===
                ConfidenceBand.MEDIUM
        ) {

            return ConfidenceBand.MEDIUM;

        }


        if (
            normalized ===
                ConfidenceBand.LOW
        ) {

            return ConfidenceBand.LOW;

        }


        if (
            normalized ===
                ConfidenceBand.UNKNOWN
        ) {

            return ConfidenceBand.UNKNOWN;

        }


        return null;

    };


/********************************************************************
 * 4.3.3 RESOLVE EXTRACTION CONFIDENCE SIGNAL
 *
 * Section 3 may preserve the upstream signal in its prepared
 * extractionReliability profile.
 *
 * This resolver deliberately checks only explicit confidence fields.
 * It does not derive confidence from extraction method or provenance.
 ********************************************************************/

ConfidenceEngine.prototype.resolveExtractionConfidenceSignal =
    function (profile) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    profile
                )
        ) {

            return {

                found:
                    false,

                rawValue:
                    null,

                normalizedValue:
                    null

            };

        }


        const candidateFields = [

            "confidence",

            "extractionConfidence",

            "sourceConfidence",

            "upstreamConfidence"

        ];


        for (
            const field of
                candidateFields
        ) {

            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        profile,
                        field
                    )
            ) {

                const rawValue =
                    profile[
                        field
                    ];


                return {

                    found:
                        true,

                    rawValue:
                        rawValue,

                    normalizedValue:

                        this
                            .normalizeExtractionConfidenceSignal(
                                rawValue
                            )

                };

            }

        }


        return {

            found:
                false,

            rawValue:
                null,

            normalizedValue:
                null

        };

    };


/********************************************************************
 * 4.3.4 ASSESSABILITY
 *
 * Extraction reliability is assessable only when an explicit,
 * recognized HIGH / MEDIUM / LOW signal is available.
 *
 * Explicit UNKNOWN remains unassessable.
 ********************************************************************/

ConfidenceEngine.prototype.isExtractionReliabilityAssessable =
    function (profile) {

        const resolved =

            this.resolveExtractionConfidenceSignal(
                profile
            );


        return (

            resolved.normalizedValue ===
                ConfidenceBand.HIGH ||

            resolved.normalizedValue ===
                ConfidenceBand.MEDIUM ||

            resolved.normalizedValue ===
                ConfidenceBand.LOW

        );

    };


/********************************************************************
 * 4.3.5 CALCULATE EXTRACTION RELIABILITY SCORE
 *
 * Uses the standardized Section 4.1 dimension scores.
 ********************************************************************/

ConfidenceEngine.prototype.calculateExtractionReliabilityScore =
    function (profile) {

        const resolved =

            this.resolveExtractionConfidenceSignal(
                profile
            );


        switch (
            resolved.normalizedValue
        ) {

            case ConfidenceBand.HIGH:

                return ConfidenceStandardScores
                    .HIGH;


            case ConfidenceBand.MEDIUM:

                return ConfidenceStandardScores
                    .MEDIUM;


            case ConfidenceBand.LOW:

                return ConfidenceStandardScores
                    .LOW;


            default:

                return null;

        }

    };


/********************************************************************
 * 4.3.6 BUILD EXTRACTION RELIABILITY REASONS
 ********************************************************************/

ConfidenceEngine.prototype.buildExtractionReliabilityReasons =
    function (
        profile,
        score
    ) {

        const reasonCodes =
            [];

        const reasons =
            [];


        const resolved =

            this.resolveExtractionConfidenceSignal(
                profile
            );


        /*
         * No explicit upstream signal.
         */

        if (
            resolved.found !==
                true
        ) {

            reasonCodes.push(
                ExtractionReliabilityReasonCodes
                    .UNKNOWN
            );

            reasonCodes.push(
                ExtractionReliabilityReasonCodes
                    .SIGNAL_MISSING
            );

            reasons.push(
                "Extraction reliability could not be assessed because no explicit upstream extraction-confidence signal was available."
            );


            return {

                reasonCodes,
                reasons

            };

        }


        /*
         * Explicit UNKNOWN is legitimate upstream uncertainty.
         */

        if (
            resolved.normalizedValue ===
                ConfidenceBand.UNKNOWN
        ) {

            reasonCodes.push(
                ExtractionReliabilityReasonCodes
                    .UNKNOWN
            );

            reasons.push(
                "The upstream extraction-confidence signal is explicitly UNKNOWN."
            );


            return {

                reasonCodes,
                reasons

            };

        }


        /*
         * Present but unsupported vocabulary.
         */

        if (
            resolved.normalizedValue ===
                null
        ) {

            reasonCodes.push(
                ExtractionReliabilityReasonCodes
                    .UNKNOWN
            );

            reasonCodes.push(
                ExtractionReliabilityReasonCodes
                    .SIGNAL_UNRECOGNIZED
            );

            reasons.push(
                "The upstream extraction-confidence signal is not recognized by the deterministic confidence contract."
            );


            return {

                reasonCodes,
                reasons

            };

        }


        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    score
                )
        ) {

            reasonCodes.push(
                ExtractionReliabilityReasonCodes
                    .UNKNOWN
            );

            reasons.push(
                "Extraction reliability could not be assigned a defensible numeric score."
            );


            return {

                reasonCodes,
                reasons

            };

        }


        switch (
            resolved.normalizedValue
        ) {

            case ConfidenceBand.HIGH:

                reasonCodes.push(
                    ExtractionReliabilityReasonCodes
                        .HIGH
                );

                reasons.push(
                    "The upstream extraction process reported HIGH confidence for this financial fact."
                );

                break;


            case ConfidenceBand.MEDIUM:

                reasonCodes.push(
                    ExtractionReliabilityReasonCodes
                        .MEDIUM
                );

                reasons.push(
                    "The upstream extraction process reported MEDIUM confidence for this financial fact."
                );

                break;


            case ConfidenceBand.LOW:

                reasonCodes.push(
                    ExtractionReliabilityReasonCodes
                        .LOW
                );

                reasons.push(
                    "The upstream extraction process reported LOW confidence for this financial fact."
                );

                break;


            default:

                reasonCodes.push(
                    ExtractionReliabilityReasonCodes
                        .UNKNOWN
                );

                reasons.push(
                    "Extraction reliability remains unknown."
                );

        }


        return {

            reasonCodes,
            reasons

        };

    };


/********************************************************************
 * 4.3.7 ASSESS EXTRACTION RELIABILITY
 ********************************************************************/

ConfidenceEngine.prototype.assessExtractionReliability =
    function (profile) {

        const assessment =

            this.createDimensionAssessment(
                "extractionReliability"
            );


        assessment.evidence =

            ConfidenceEngineUtils
                .isObject(
                    profile
                )

                ? ConfidenceEngineUtils
                    .clone(
                        profile
                    )

                : {};


        const resolved =

            this.resolveExtractionConfidenceSignal(
                profile
            );


        /*
         * Preserve the interpreted upstream signal explicitly.
         */

        assessment.evidence
            .resolvedConfidence =

                resolved.normalizedValue;


        if (
            !this.isExtractionReliabilityAssessable(
                profile
            )
        ) {

            const explanation =

                this.buildExtractionReliabilityReasons(
                    profile,
                    null
                );


            assessment.reasonCodes =
                explanation.reasonCodes;

            assessment.reasons =
                explanation.reasons;

            assessment.assessedAt =
                ConfidenceEngineUtils.now();


            return assessment;

        }


        const score =

            this.calculateExtractionReliabilityScore(
                profile
            );


        assessment.assessable =
            true;

        assessment.score =
            score;

        assessment.band =

            this.classifyConfidenceScore(
                score
            );


        const explanation =

            this.buildExtractionReliabilityReasons(
                profile,
                score
            );


        assessment.reasonCodes =
            explanation.reasonCodes;

        assessment.reasons =
            explanation.reasons;

        assessment.assessedAt =
            ConfidenceEngineUtils.now();


        return assessment;

    };


/********************************************************************
 * 4.3.8 ASSESS EXTRACTION RELIABILITY FOR CONFIDENCE RECORD
 *
 * Writes only to:
 *
 * confidence.dimensions.extractionReliability
 *
 * Overall confidence remains untouched.
 ********************************************************************/

ConfidenceEngine.prototype.assessRecordExtractionReliability =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .evidenceProfile
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                        .dimensions
                )
        ) {

            return false;

        }


        const profile =

            confidenceRecord
                .evidenceProfile
                .extractionReliability;


        const assessment =

            this.assessExtractionReliability(
                profile
            );


        confidenceRecord
            .confidence
            .dimensions
            .extractionReliability =

                assessment;


        return true;

    };


/********************************************************************
 * 4.3.9 EXTRACTION RELIABILITY DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.extractionReliabilityDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            assessedRecords:
                0,

            high:
                0,

            medium:
                0,

            low:
                0,

            unknown:
                0

        };


        records.forEach(

            record => {

                const assessment =

                    record
                        ?.confidence
                        ?.dimensions
                        ?.extractionReliability;


                if (
                    !ConfidenceEngineUtils
                        .isObject(
                            assessment
                        ) ||

                    assessment.assessable !==
                        true
                ) {

                    diagnostics.unknown++;

                    return;

                }


                diagnostics
                    .assessedRecords++;


                switch (
                    assessment.band
                ) {

                    case ConfidenceBand.HIGH:

                        diagnostics.high++;

                        break;


                    case ConfidenceBand.MEDIUM:

                        diagnostics.medium++;

                        break;


                    case ConfidenceBand.LOW:

                        diagnostics.low++;

                        break;


                    default:

                        diagnostics.unknown++;

                }

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 4.3.10 SAFE SECTION 4.3 EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window.ExtractionReliabilityReasonCodes =
        ExtractionReliabilityReasonCodes;

}


/********************************************************************
 * END SECTION 4.3
 ********************************************************************/
/********************************************************************
 * 4.4 NORMALIZATION CERTAINTY ASSESSMENT
 *
 * PURPOSE:
 *
 * Assess how completely FIPE-4 established the normalized analytical
 * identity and context of a financial fact.
 *
 * This section consumes only the normalization-certainty evidence
 * profile prepared in Section 3.
 *
 * It DOES NOT:
 *
 * - re-normalize upstream evidence,
 * - infer missing currency, period, unit, or concept,
 * - alter FIPE-4 evidence,
 * - calculate overall confidence,
 * - apply critical confidence caps,
 * - execute PB-001 through PB-010,
 * - perform AI reasoning.
 ********************************************************************/


/********************************************************************
 * 4.4.1 NORMALIZATION CERTAINTY SCORE WEIGHTS
 ********************************************************************/

const NormalizationCertaintyScoreWeights =
    Object.freeze({

        hasCanonicalConcept:
            30,

        hasNormalizedValue:
            30,

        hasNormalizedCurrency:
            15,

        hasNormalizedPeriod:
            15,

        hasNormalizedUnit:
            10

    });



/********************************************************************
 * 4.4.2 NORMALIZATION CERTAINTY REASON CODES
 ********************************************************************/

const NormalizationCertaintyReasonCodes =
    Object.freeze({

        HIGH:
            "NORMALIZATION_CERTAINTY_HIGH",

        MEDIUM:
            "NORMALIZATION_CERTAINTY_MEDIUM",

        LOW:
            "NORMALIZATION_CERTAINTY_LOW",

        UNKNOWN:
            "NORMALIZATION_CERTAINTY_UNKNOWN",

        CANONICAL_CONCEPT_MISSING:
            "CANONICAL_CONCEPT_MISSING",

        NORMALIZED_VALUE_MISSING:
            "NORMALIZED_VALUE_MISSING",

        CURRENCY_MISSING:
            "NORMALIZED_CURRENCY_MISSING",

        PERIOD_MISSING:
            "NORMALIZED_PERIOD_MISSING",

        UNIT_MISSING:
            "NORMALIZED_UNIT_MISSING"

    });


/********************************************************************
 * 4.4.3 NORMALIZATION PROFILE ASSESSABILITY
 *
 * All five boolean signals must exist.
 *
 * All false is still assessable and produces LOW.
 *
 * A missing/malformed profile produces UNKNOWN.
 ********************************************************************/

ConfidenceEngine.prototype.isNormalizationCertaintyAssessable =
    function (profile) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    profile
                )
        ) {

            return false;

        }


        const requiredSignals = [

    "hasCanonicalConcept",
    "hasNormalizedValue",
    "hasNormalizedCurrency",
    "hasNormalizedPeriod",
    "hasNormalizedUnit"

];


        return requiredSignals.every(

            signal =>

                typeof profile[
                    signal
                ] === "boolean"

        );

    };


/********************************************************************
 * 4.4.4 CALCULATE NORMALIZATION CERTAINTY SCORE
 ********************************************************************/

ConfidenceEngine.prototype.calculateNormalizationCertaintyScore =
    function (profile) {

        if (
            !this.isNormalizationCertaintyAssessable(
                profile
            )
        ) {

            return null;

        }


        let score =
            0;


        Object.entries(
            NormalizationCertaintyScoreWeights
        )
        .forEach(

            ([signal, weight]) => {

                if (
                    profile[
                        signal
                    ] === true
                ) {

                    score +=
                        weight;

                }

            }

        );


        return ConfidenceEngineUtils
            .clampScore(
                score
            );

    };


/********************************************************************
 * 4.4.5 BUILD NORMALIZATION CERTAINTY REASONS
 ********************************************************************/

ConfidenceEngine.prototype.buildNormalizationCertaintyReasons =
    function (
        profile,
        score
    ) {

        const reasonCodes =
            [];

        const reasons =
            [];


        if (
            !this.isNormalizationCertaintyAssessable(
                profile
            ) ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    score
                )
        ) {

            reasonCodes.push(
                NormalizationCertaintyReasonCodes
                    .UNKNOWN
            );

            reasons.push(
                "Normalization certainty could not be assessed from the available evidence profile."
            );


            return {

                reasonCodes,
                reasons

            };

        }


        const band =

            this.classifyConfidenceScore(
                score
            );


        if (
            band ===
                ConfidenceBand.HIGH
        ) {

            reasonCodes.push(
                NormalizationCertaintyReasonCodes
                    .HIGH
            );

            reasons.push(
                "The financial fact has strong normalization certainty."
            );

        } else if (
            band ===
                ConfidenceBand.MEDIUM
        ) {

            reasonCodes.push(
                NormalizationCertaintyReasonCodes
                    .MEDIUM
            );

            reasons.push(
                "The financial fact has partial normalization certainty."
            );

        } else {

            reasonCodes.push(
                NormalizationCertaintyReasonCodes
                    .LOW
            );

            reasons.push(
                "The financial fact has weak normalization certainty."
            );

        }


        if (
            profile.hasCanonicalConcept !==
                true
        ) {

            reasonCodes.push(
                NormalizationCertaintyReasonCodes
                    .CANONICAL_CONCEPT_MISSING
            );

            reasons.push(
                "A canonical financial concept is unavailable."
            );

        }


        if (
            profile.hasNormalizedValue !==
                true
        ) {

            reasonCodes.push(
                NormalizationCertaintyReasonCodes
                    .NORMALIZED_VALUE_MISSING
            );

            reasons.push(
                "A usable normalized financial value is unavailable."
            );

        }


        if (
    profile.hasNormalizedCurrency !==
        true
) {

    reasonCodes.push(
        NormalizationCertaintyReasonCodes
            .CURRENCY_MISSING
    );

    reasons.push(
        "Normalized currency context is unavailable."
    );

}

        if (
            profile.hasPeriod !==
                true
        ) {
}

        if (
    profile.hasPeriod !==
        true
) {

    reasonCodes.push(
        NormalizationCertaintyReasonCodes
            .PERIOD_MISSING
    );

    reasons.push(
        "Normalized reporting-period context is unavailable."
    );

}


       if (
    profile.hasNormalizedUnit !==
        true
) {

    reasonCodes.push(
        NormalizationCertaintyReasonCodes
            .UNIT_MISSING
    );

    reasons.push(
        "Normalized unit context is unavailable."
    );

}

        return {

            reasonCodes,
            reasons

        };

    };


/********************************************************************
 * 4.4.6 ASSESS NORMALIZATION CERTAINTY
 ********************************************************************/

ConfidenceEngine.prototype.assessNormalizationCertainty =
    function (profile) {

        const assessment =

            this.createDimensionAssessment(
                "normalizationCertainty"
            );


        assessment.evidence =

            ConfidenceEngineUtils
                .isObject(
                    profile
                )

                ? ConfidenceEngineUtils
                    .clone(
                        profile
                    )

                : {};


        if (
            !this.isNormalizationCertaintyAssessable(
                profile
            )
        ) {

            const explanation =

                this.buildNormalizationCertaintyReasons(
                    profile,
                    null
                );


            assessment.reasonCodes =
                explanation.reasonCodes;

            assessment.reasons =
                explanation.reasons;

            assessment.assessedAt =
                ConfidenceEngineUtils.now();


            return assessment;

        }


        const score =

            this.calculateNormalizationCertaintyScore(
                profile
            );


        assessment.assessable =
            true;

        assessment.score =
            score;

        assessment.band =

            this.classifyConfidenceScore(
                score
            );


        const explanation =

            this.buildNormalizationCertaintyReasons(
                profile,
                score
            );


        assessment.reasonCodes =
            explanation.reasonCodes;

        assessment.reasons =
            explanation.reasons;

        assessment.assessedAt =
            ConfidenceEngineUtils.now();


        return assessment;

    };


/********************************************************************
 * 4.4.7 ASSESS NORMALIZATION CERTAINTY FOR RECORD
 ********************************************************************/

ConfidenceEngine.prototype.assessRecordNormalizationCertainty =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .evidenceProfile
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                        .dimensions
                )
        ) {

            return false;

        }


        const profile =

            confidenceRecord
                .evidenceProfile
                .normalizationCertainty;


        const assessment =

            this.assessNormalizationCertainty(
                profile
            );


        confidenceRecord
            .confidence
            .dimensions
            .normalizationCertainty =

                assessment;


        return true;

    };


/********************************************************************
 * 4.4.8 NORMALIZATION CERTAINTY DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.normalizationCertaintyDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            assessedRecords:
                0,

            high:
                0,

            medium:
                0,

            low:
                0,

            unknown:
                0

        };


        records.forEach(

            record => {

                const assessment =

                    record
                        ?.confidence
                        ?.dimensions
                        ?.normalizationCertainty;


                if (
                    !ConfidenceEngineUtils
                        .isObject(
                            assessment
                        ) ||

                    assessment.assessable !==
                        true
                ) {

                    diagnostics.unknown++;

                    return;

                }


                diagnostics.assessedRecords++;


                switch (
                    assessment.band
                ) {

                    case ConfidenceBand.HIGH:

                        diagnostics.high++;

                        break;


                    case ConfidenceBand.MEDIUM:

                        diagnostics.medium++;

                        break;


                    case ConfidenceBand.LOW:

                        diagnostics.low++;

                        break;


                    default:

                        diagnostics.unknown++;

                }

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 4.4.9 SAFE SECTION 4.4 EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window.NormalizationCertaintyScoreWeights =
        NormalizationCertaintyScoreWeights;

    window.NormalizationCertaintyReasonCodes =
        NormalizationCertaintyReasonCodes;

}


/********************************************************************
 * END SECTION 4.4
 ********************************************************************/
/********************************************************************
 * 4.5 COMPLETENESS ASSESSMENT
 *
 * PURPOSE:
 *
 * Assess whether a normalized financial fact contains the minimum
 * semantic and contextual components required for downstream
 * analytical use.
 *
 * Consumes the frozen Section 3 completeness profile:
 *
 * - hasConcept
 * - hasValue
 * - hasCurrency
 * - hasPeriod
 * - hasUnit
 *
 * This section DOES NOT:
 *
 * - re-normalize evidence,
 * - fabricate missing attributes,
 * - calculate overall confidence,
 * - apply critical confidence caps,
 * - execute blueprint logic,
 * - perform AI reasoning.
 ********************************************************************/


/********************************************************************
 * 4.5.1 COMPLETENESS SCORE WEIGHTS
 ********************************************************************/

const CompletenessScoreWeights =
    Object.freeze({

        hasConcept:
            25,

        hasValue:
            30,

        hasCurrency:
            15,

        hasPeriod:
            20,

        hasUnit:
            10

    });


/********************************************************************
 * 4.5.2 COMPLETENESS REASON CODES
 ********************************************************************/

const CompletenessReasonCodes =
    Object.freeze({

        HIGH:
            "COMPLETENESS_HIGH",

        MEDIUM:
            "COMPLETENESS_MEDIUM",

        LOW:
            "COMPLETENESS_LOW",

        UNKNOWN:
            "COMPLETENESS_UNKNOWN",

        CONCEPT_MISSING:
            "COMPLETENESS_CONCEPT_MISSING",

        VALUE_MISSING:
            "COMPLETENESS_VALUE_MISSING",

        CURRENCY_MISSING:
            "COMPLETENESS_CURRENCY_MISSING",

        PERIOD_MISSING:
            "COMPLETENESS_PERIOD_MISSING",

        UNIT_MISSING:
            "COMPLETENESS_UNIT_MISSING"

    });


/********************************************************************
 * 4.5.3 COMPLETENESS ASSESSABILITY
 *
 * The profile is assessable when all five contracted signals are
 * explicitly boolean.
 *
 * All false is still assessable and produces a score of zero.
 *
 * Structurally unavailable or malformed evidence remains UNKNOWN.
 ********************************************************************/

ConfidenceEngine.prototype.isCompletenessAssessable =
    function (profile) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    profile
                )
        ) {

            return false;

        }


        const requiredSignals = [

            "hasConcept",
            "hasValue",
            "hasCurrency",
            "hasPeriod",
            "hasUnit"

        ];


        return requiredSignals.every(

            signal =>

                typeof profile[
                    signal
                ] === "boolean"

        );

    };


/********************************************************************
 * 4.5.4 CALCULATE COMPLETENESS SCORE
 ********************************************************************/

ConfidenceEngine.prototype.calculateCompletenessScore =
    function (profile) {

        if (
            !this.isCompletenessAssessable(
                profile
            )
        ) {

            return null;

        }


        let score =
            0;


        Object.entries(
            CompletenessScoreWeights
        )
        .forEach(

            ([signal, weight]) => {

                if (
                    profile[
                        signal
                    ] === true
                ) {

                    score +=
                        weight;

                }

            }

        );


        return ConfidenceEngineUtils
            .clampScore(
                score
            );

    };


/********************************************************************
 * 4.5.5 BUILD COMPLETENESS REASONS
 ********************************************************************/

ConfidenceEngine.prototype.buildCompletenessReasons =
    function (
        profile,
        score
    ) {

        const reasonCodes =
            [];

        const reasons =
            [];


        if (
            !this.isCompletenessAssessable(
                profile
            ) ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    score
                )
        ) {

            reasonCodes.push(
                CompletenessReasonCodes
                    .UNKNOWN
            );

            reasons.push(
                "Completeness could not be assessed from the available evidence profile."
            );


            return {

                reasonCodes,
                reasons

            };

        }


        const band =

            this.classifyConfidenceScore(
                score
            );


        if (
            band ===
                ConfidenceBand.HIGH
        ) {

            reasonCodes.push(
                CompletenessReasonCodes
                    .HIGH
            );

            reasons.push(
                "The financial fact contains a highly complete analytical evidence package."
            );

        } else if (
            band ===
                ConfidenceBand.MEDIUM
        ) {

            reasonCodes.push(
                CompletenessReasonCodes
                    .MEDIUM
            );

            reasons.push(
                "The financial fact contains a partially complete analytical evidence package."
            );

        } else {

            reasonCodes.push(
                CompletenessReasonCodes
                    .LOW
            );

            reasons.push(
                "The financial fact contains an incomplete analytical evidence package."
            );

        }


        if (
            profile.hasConcept !==
                true
        ) {

            reasonCodes.push(
                CompletenessReasonCodes
                    .CONCEPT_MISSING
            );

            reasons.push(
                "The financial fact lacks a usable semantic concept."
            );

        }


        if (
            profile.hasValue !==
                true
        ) {

            reasonCodes.push(
                CompletenessReasonCodes
                    .VALUE_MISSING
            );

            reasons.push(
                "The financial fact lacks a usable value."
            );

        }


        if (
            profile.hasCurrency !==
                true
        ) {

            reasonCodes.push(
                CompletenessReasonCodes
                    .CURRENCY_MISSING
            );

            reasons.push(
                "The financial fact lacks currency context."
            );

        }


        if (
            profile.hasPeriod !==
                true
        ) {

            reasonCodes.push(
                CompletenessReasonCodes
                    .PERIOD_MISSING
            );

            reasons.push(
                "The financial fact lacks reporting-period context."
            );

        }


        if (
            profile.hasUnit !==
                true
        ) {

            reasonCodes.push(
                CompletenessReasonCodes
                    .UNIT_MISSING
            );

            reasons.push(
                "The financial fact lacks unit context."
            );

        }


        return {

            reasonCodes,
            reasons

        };

    };


/********************************************************************
 * 4.5.6 ASSESS COMPLETENESS
 ********************************************************************/

ConfidenceEngine.prototype.assessCompleteness =
    function (profile) {

        const assessment =

            this.createDimensionAssessment(
                "completeness"
            );


        assessment.evidence =

            ConfidenceEngineUtils
                .isObject(
                    profile
                )

                ? ConfidenceEngineUtils
                    .clone(
                        profile
                    )

                : {};


        if (
            !this.isCompletenessAssessable(
                profile
            )
        ) {

            const explanation =

                this.buildCompletenessReasons(
                    profile,
                    null
                );


            assessment.reasonCodes =
                explanation.reasonCodes;

            assessment.reasons =
                explanation.reasons;

            assessment.assessedAt =
                ConfidenceEngineUtils.now();


            return assessment;

        }


        const score =

            this.calculateCompletenessScore(
                profile
            );


        assessment.assessable =
            true;

        assessment.score =
            score;

        assessment.band =

            this.classifyConfidenceScore(
                score
            );


        const explanation =

            this.buildCompletenessReasons(
                profile,
                score
            );


        assessment.reasonCodes =
            explanation.reasonCodes;

        assessment.reasons =
            explanation.reasons;

        assessment.assessedAt =
            ConfidenceEngineUtils.now();


        return assessment;

    };


/********************************************************************
 * 4.5.7 ASSESS COMPLETENESS FOR CONFIDENCE RECORD
 ********************************************************************/

ConfidenceEngine.prototype.assessRecordCompleteness =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .evidenceProfile
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                        .dimensions
                )
        ) {

            return false;

        }


        const profile =

            confidenceRecord
                .evidenceProfile
                .completeness;


        const assessment =

            this.assessCompleteness(
                profile
            );


        confidenceRecord
            .confidence
            .dimensions
            .completeness =

                assessment;


        return true;

    };


/********************************************************************
 * 4.5.8 COMPLETENESS DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.completenessDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            assessedRecords:
                0,

            high:
                0,

            medium:
                0,

            low:
                0,

            unknown:
                0

        };


        records.forEach(

            record => {

                const assessment =

                    record
                        ?.confidence
                        ?.dimensions
                        ?.completeness;


                if (
                    !ConfidenceEngineUtils
                        .isObject(
                            assessment
                        ) ||

                    assessment.assessable !==
                        true
                ) {

                    diagnostics.unknown++;

                    return;

                }


                diagnostics.assessedRecords++;


                switch (
                    assessment.band
                ) {

                    case ConfidenceBand.HIGH:

                        diagnostics.high++;

                        break;


                    case ConfidenceBand.MEDIUM:

                        diagnostics.medium++;

                        break;


                    case ConfidenceBand.LOW:

                        diagnostics.low++;

                        break;


                    default:

                        diagnostics.unknown++;

                }

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 4.5.9 SAFE SECTION 4.5 EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window.CompletenessScoreWeights =
        CompletenessScoreWeights;

    window.CompletenessReasonCodes =
        CompletenessReasonCodes;

}


/********************************************************************
 * END SECTION 4.5
 ********************************************************************/
/********************************************************************
 * 4.6 CONSISTENCY & CORROBORATION ASSESSMENT
 *
 * PURPOSE:
 *
 * Assess the two cross-record confidence dimensions prepared by
 * Section 3:
 *
 * CONSISTENCY
 * - assessable
 * - conflicts[]
 *
 * CORROBORATION
 * - assessable
 * - supportingRecords[]
 *
 * These dimensions remain independent.
 *
 * IMPORTANT:
 *
 * assessable === false means UNKNOWN.
 *
 * It does NOT mean:
 * - inconsistent,
 * - unsupported,
 * - low confidence.
 *
 * This section DOES NOT:
 *
 * - manufacture cross-record evidence,
 * - modify FIPE-4 records,
 * - calculate overall confidence,
 * - apply critical confidence caps,
 * - execute blueprint logic,
 * - perform AI reasoning.
 ********************************************************************/


/********************************************************************
 * 4.6.1 CONSISTENCY REASON CODES
 ********************************************************************/

const ConsistencyReasonCodes =
    Object.freeze({

        HIGH:
            "CONSISTENCY_HIGH",

        MEDIUM:
            "CONSISTENCY_MEDIUM",

        LOW:
            "CONSISTENCY_LOW",

        UNKNOWN:
            "CONSISTENCY_UNKNOWN",

        NO_CONFLICTS:
            "NO_CONFLICTS_DETECTED",

        LIMITED_CONFLICTS:
            "LIMITED_CONFLICTS_DETECTED",

        MATERIAL_CONFLICTS:
            "MATERIAL_CONFLICTS_DETECTED",

        NOT_ASSESSABLE:
            "CONSISTENCY_NOT_ASSESSABLE"

    });


/********************************************************************
 * 4.6.2 CONSISTENCY PROFILE VALIDATION
 ********************************************************************/

ConfidenceEngine.prototype.isConsistencyProfileValid =
    function (profile) {

        return (

            ConfidenceEngineUtils
                .isObject(
                    profile
                ) &&

            typeof profile.assessable ===
                "boolean" &&

            Array.isArray(
                profile.conflicts
            )

        );

    };


/********************************************************************
 * 4.6.3 CALCULATE CONSISTENCY SCORE
 *
 * Deterministic MVP policy:
 *
 * Not assessable     -> null / UNKNOWN
 * 0 conflicts        -> 100
 * 1 conflict         -> 70
 * 2+ conflicts       -> 35
 *
 * Conflict severity semantics can be introduced later only if
 * upstream evidence provides a frozen severity contract.
 ********************************************************************/

ConfidenceEngine.prototype.calculateConsistencyScore =
    function (profile) {

        if (
            !this.isConsistencyProfileValid(
                profile
            ) ||

            profile.assessable !==
                true
        ) {

            return null;

        }


        const conflictCount =

            profile.conflicts.length;


        if (
            conflictCount === 0
        ) {

            return ConfidenceStandardScores
                .HIGH;

        }


        if (
            conflictCount === 1
        ) {

            return ConfidenceStandardScores
                .MEDIUM;

        }


        return ConfidenceStandardScores
            .LOW;

    };


/********************************************************************
 * 4.6.4 ASSESS CONSISTENCY
 ********************************************************************/

ConfidenceEngine.prototype.assessConsistency =
    function (profile) {

        const assessment =

            this.createDimensionAssessment(
                "consistency"
            );


        assessment.evidence =

            ConfidenceEngineUtils
                .isObject(
                    profile
                )

                ? ConfidenceEngineUtils
                    .clone(
                        profile
                    )

                : {};


        if (
            !this.isConsistencyProfileValid(
                profile
            ) ||

            profile.assessable !==
                true
        ) {

            assessment.reasonCodes = [

                ConsistencyReasonCodes
                    .UNKNOWN,

                ConsistencyReasonCodes
                    .NOT_ASSESSABLE

            ];

            assessment.reasons = [

                "Consistency could not be defensibly assessed from the available cross-record evidence."

            ];

            assessment.assessedAt =
                ConfidenceEngineUtils.now();


            return assessment;

        }


        const score =

            this.calculateConsistencyScore(
                profile
            );


        assessment.assessable =
            true;

        assessment.score =
            score;

        assessment.band =

            this.classifyConfidenceScore(
                score
            );


        const conflictCount =

            profile.conflicts.length;


        if (
            conflictCount === 0
        ) {

            assessment.reasonCodes = [

                ConsistencyReasonCodes.HIGH,

                ConsistencyReasonCodes
                    .NO_CONFLICTS

            ];

            assessment.reasons = [

                "No conflicting cross-record evidence was detected."

            ];

        } else if (
            conflictCount === 1
        ) {

            assessment.reasonCodes = [

                ConsistencyReasonCodes.MEDIUM,

                ConsistencyReasonCodes
                    .LIMITED_CONFLICTS

            ];

            assessment.reasons = [

                "One conflicting cross-record evidence item was detected."

            ];

        } else {

            assessment.reasonCodes = [

                ConsistencyReasonCodes.LOW,

                ConsistencyReasonCodes
                    .MATERIAL_CONFLICTS

            ];

            assessment.reasons = [

                "Multiple conflicting cross-record evidence items were detected."

            ];

        }


        assessment.assessedAt =
            ConfidenceEngineUtils.now();


        return assessment;

    };


/********************************************************************
 * 4.6.5 PERSIST CONSISTENCY ASSESSMENT
 ********************************************************************/

ConfidenceEngine.prototype.assessRecordConsistency =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .evidenceProfile
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                        .dimensions
                )
        ) {

            return false;

        }


        const assessment =

            this.assessConsistency(

                confidenceRecord
                    .evidenceProfile
                    .consistency

            );


        confidenceRecord
            .confidence
            .dimensions
            .consistency =

                assessment;


        return true;

    };


/********************************************************************
 * 4.6.6 CORROBORATION REASON CODES
 ********************************************************************/

const CorroborationReasonCodes =
    Object.freeze({

        HIGH:
            "CORROBORATION_HIGH",

        MEDIUM:
            "CORROBORATION_MEDIUM",

        LOW:
            "CORROBORATION_LOW",

        UNKNOWN:
            "CORROBORATION_UNKNOWN",

        MULTIPLE_SUPPORTING_RECORDS:
            "MULTIPLE_SUPPORTING_RECORDS",

        SINGLE_SUPPORTING_RECORD:
            "SINGLE_SUPPORTING_RECORD",

        NO_SUPPORTING_RECORDS:
            "NO_SUPPORTING_RECORDS",

        NOT_ASSESSABLE:
            "CORROBORATION_NOT_ASSESSABLE"

    });


/********************************************************************
 * 4.6.7 CORROBORATION PROFILE VALIDATION
 ********************************************************************/

ConfidenceEngine.prototype.isCorroborationProfileValid =
    function (profile) {

        return (

            ConfidenceEngineUtils
                .isObject(
                    profile
                ) &&

            typeof profile.assessable ===
                "boolean" &&

            Array.isArray(
                profile.supportingRecords
            )

        );

    };


/********************************************************************
 * 4.6.8 CALCULATE CORROBORATION SCORE
 *
 * Deterministic MVP policy:
 *
 * Not assessable        -> null / UNKNOWN
 * 2+ supporting records -> 100
 * 1 supporting record   -> 70
 * 0 supporting records  -> 35
 *
 * IMPORTANT:
 *
 * Zero supporting records is LOW only when corroboration was
 * explicitly assessable.
 *
 * If assessable === false, the result is UNKNOWN.
 ********************************************************************/

ConfidenceEngine.prototype.calculateCorroborationScore =
    function (profile) {

        if (
            !this.isCorroborationProfileValid(
                profile
            ) ||

            profile.assessable !==
                true
        ) {

            return null;

        }


        const supportingCount =

            profile.supportingRecords.length;


        if (
            supportingCount >= 2
        ) {

            return ConfidenceStandardScores
                .HIGH;

        }


        if (
            supportingCount === 1
        ) {

            return ConfidenceStandardScores
                .MEDIUM;

        }


        return ConfidenceStandardScores
            .LOW;

    };


/********************************************************************
 * 4.6.9 ASSESS CORROBORATION
 ********************************************************************/

ConfidenceEngine.prototype.assessCorroboration =
    function (profile) {

        const assessment =

            this.createDimensionAssessment(
                "corroboration"
            );


        assessment.evidence =

            ConfidenceEngineUtils
                .isObject(
                    profile
                )

                ? ConfidenceEngineUtils
                    .clone(
                        profile
                    )

                : {};


        if (
            !this.isCorroborationProfileValid(
                profile
            ) ||

            profile.assessable !==
                true
        ) {

            assessment.reasonCodes = [

                CorroborationReasonCodes
                    .UNKNOWN,

                CorroborationReasonCodes
                    .NOT_ASSESSABLE

            ];

            assessment.reasons = [

                "Corroboration could not be defensibly assessed from the available supporting-record evidence."

            ];

            assessment.assessedAt =
                ConfidenceEngineUtils.now();


            return assessment;

        }


        const score =

            this.calculateCorroborationScore(
                profile
            );


        assessment.assessable =
            true;

        assessment.score =
            score;

        assessment.band =

            this.classifyConfidenceScore(
                score
            );


        const supportingCount =

            profile.supportingRecords.length;


        if (
            supportingCount >= 2
        ) {

            assessment.reasonCodes = [

                CorroborationReasonCodes.HIGH,

                CorroborationReasonCodes
                    .MULTIPLE_SUPPORTING_RECORDS

            ];

            assessment.reasons = [

                "Multiple supporting records corroborate this financial fact."

            ];

        } else if (
            supportingCount === 1
        ) {

            assessment.reasonCodes = [

                CorroborationReasonCodes.MEDIUM,

                CorroborationReasonCodes
                    .SINGLE_SUPPORTING_RECORD

            ];

            assessment.reasons = [

                "One supporting record corroborates this financial fact."

            ];

        } else {

            assessment.reasonCodes = [

                CorroborationReasonCodes.LOW,

                CorroborationReasonCodes
                    .NO_SUPPORTING_RECORDS

            ];

            assessment.reasons = [

                "No supporting records were identified despite corroboration being assessable."

            ];

        }


        assessment.assessedAt =
            ConfidenceEngineUtils.now();


        return assessment;

    };


/********************************************************************
 * 4.6.10 PERSIST CORROBORATION ASSESSMENT
 ********************************************************************/

ConfidenceEngine.prototype.assessRecordCorroboration =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .evidenceProfile
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                        .dimensions
                )
        ) {

            return false;

        }


        const assessment =

            this.assessCorroboration(

                confidenceRecord
                    .evidenceProfile
                    .corroboration

            );


        confidenceRecord
            .confidence
            .dimensions
            .corroboration =

                assessment;


        return true;

    };


/********************************************************************
 * 4.6.11 CROSS-RECORD DIMENSION DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.crossRecordDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const createCounters =
            () => ({

                assessed:
                    0,

                high:
                    0,

                medium:
                    0,

                low:
                    0,

                unknown:
                    0

            });


        const diagnostics = {

            totalRecords:
                records.length,

            consistency:
                createCounters(),

            corroboration:
                createCounters()

        };


        const consume =
            (
                assessment,
                counters
            ) => {

                if (
                    !ConfidenceEngineUtils
                        .isObject(
                            assessment
                        ) ||

                    assessment.assessable !==
                        true
                ) {

                    counters.unknown++;

                    return;

                }


                counters.assessed++;


                switch (
                    assessment.band
                ) {

                    case ConfidenceBand.HIGH:

                        counters.high++;

                        break;


                    case ConfidenceBand.MEDIUM:

                        counters.medium++;

                        break;


                    case ConfidenceBand.LOW:

                        counters.low++;

                        break;


                    default:

                        counters.unknown++;

                }

            };


        records.forEach(

            record => {

                consume(

                    record
                        ?.confidence
                        ?.dimensions
                        ?.consistency,

                    diagnostics
                        .consistency

                );


                consume(

                    record
                        ?.confidence
                        ?.dimensions
                        ?.corroboration,

                    diagnostics
                        .corroboration

                );

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 4.6.12 SAFE EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window.ConsistencyReasonCodes =
        ConsistencyReasonCodes;

    window.CorroborationReasonCodes =
        CorroborationReasonCodes;

}


/********************************************************************
 * END SECTION 4.6
 ********************************************************************/
/********************************************************************
 * SECTION 5 — OVERALL CONFIDENCE COMPUTATION
 *
 * 5.1 AGGREGATION FOUNDATION & CONTRACT
 *
 * PURPOSE:
 *
 * Establish the deterministic contract used to aggregate completed
 * dimension-level confidence assessments into an overall confidence
 * determination.
 *
 * This section consumes the frozen Section 4.1 policy:
 *
 * ConfidenceDimensionWeights
 *
 * Weighted dimensions:
 *
 * - sourceTraceability       0.20
 * - extractionReliability    0.20
 * - normalizationCertainty   0.25
 * - completeness             0.20
 * - consistency              0.15
 *
 * Total                      1.00
 *
 * Corroboration remains an independently assessed supplementary
 * dimension. It is intentionally not part of the base weighted
 * aggregation contract.
 *
 * Section 5.1 DOES NOT:
 *
 * - calculate final overall confidence,
 * - mutate confidence.score,
 * - mutate confidence.band,
 * - apply confidence caps,
 * - convert UNKNOWN to zero,
 * - fabricate missing dimension evidence,
 * - execute blueprint logic,
 * - perform AI reasoning.
 ********************************************************************/


/********************************************************************
 * 5.1.1 AGGREGATION DIMENSION ROLES
 *
 * Explicitly distinguishes dimensions participating in the frozen
 * weighted aggregation policy from supplementary dimensions.
 ********************************************************************/

const ConfidenceAggregationDimensionRoles =
    Object.freeze({

        WEIGHTED:
            Object.freeze([

                "sourceTraceability",
                "extractionReliability",
                "normalizationCertainty",
                "completeness",
                "consistency"

            ]),

        SUPPLEMENTARY:
            Object.freeze([

                "corroboration"

            ])

    });


/********************************************************************
 * 5.1.2 AGGREGATION STATUS
 ********************************************************************/

const ConfidenceAggregationStatus =
    Object.freeze({

        READY:
            "READY",

        PARTIAL:
            "PARTIAL",

        INSUFFICIENT:
            "INSUFFICIENT",

        INVALID:
            "INVALID"

    });


/********************************************************************
 * 5.1.3 AGGREGATION REASON CODES
 ********************************************************************/

const ConfidenceAggregationReasonCodes =
    Object.freeze({

        READY:
            "CONFIDENCE_AGGREGATION_READY",

        PARTIAL:
            "CONFIDENCE_AGGREGATION_PARTIAL",

        INSUFFICIENT:
            "CONFIDENCE_AGGREGATION_INSUFFICIENT",

        INVALID:
            "CONFIDENCE_AGGREGATION_INVALID",

        DIMENSION_UNKNOWN:
            "CONFIDENCE_DIMENSION_UNKNOWN",

        DIMENSION_INVALID:
            "CONFIDENCE_DIMENSION_INVALID",

        WEIGHT_CONTRACT_INVALID:
            "CONFIDENCE_WEIGHT_CONTRACT_INVALID"

    });


/********************************************************************
 * 5.1.4 CREATE AGGREGATION RESULT
 *
 * This structure preserves the calculation inputs and eligibility
 * state without yet calculating final confidence.
 ********************************************************************/

ConfidenceEngine.prototype.createConfidenceAggregationResult =
    function () {

        return {

            status:
                ConfidenceAggregationStatus
                    .INVALID,

            eligible:
                false,

            weightedDimensions:
                [],

            supplementaryDimensions:
                [],

            assessedWeightedDimensions:
                [],

            unknownWeightedDimensions:
                [],

            invalidWeightedDimensions:
                [],

            assessedWeight:
                0,

            totalConfiguredWeight:
                0,

            rawScore:
                null,

            reasonCodes:
                [],

            reasons:
                [],

            createdAt:
                ConfidenceEngineUtils.now()

        };

    };


/********************************************************************
 * 5.1.5 VALIDATE FROZEN DIMENSION-WEIGHT CONTRACT
 *
 * Requirements:
 *
 * - contract must be an object,
 * - exactly the five configured weighted dimensions must exist,
 * - each weight must be finite and > 0,
 * - weights must total 1.0 within floating-point tolerance,
 * - supplementary dimensions must not appear in base weights.
 ********************************************************************/

ConfidenceEngine.prototype.validateConfidenceDimensionWeights =
    function () {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    ConfidenceDimensionWeights
                )
        ) {

            return false;

        }


        const configuredKeys =

            Object.keys(
                ConfidenceDimensionWeights
            );


        const requiredKeys =

            ConfidenceAggregationDimensionRoles
                .WEIGHTED;


        if (
            configuredKeys.length !==
                requiredKeys.length
        ) {

            return false;

        }


        const exactKeysPresent =

            requiredKeys.every(

                key =>

                    Object.prototype
                        .hasOwnProperty
                        .call(
                            ConfidenceDimensionWeights,
                            key
                        )

            );


        if (
            !exactKeysPresent
        ) {

            return false;

        }


        const weightsValid =

            requiredKeys.every(

                key => {

                    const weight =

                        ConfidenceDimensionWeights[
                            key
                        ];


                    return (

                        ConfidenceEngineUtils
                            .isFiniteNumber(
                                weight
                            ) &&

                        weight > 0

                    );

                }

            );


        if (
            !weightsValid
        ) {

            return false;

        }


        const supplementaryExcluded =

            ConfidenceAggregationDimensionRoles
                .SUPPLEMENTARY
                .every(

                    key =>

                        !Object.prototype
                            .hasOwnProperty
                            .call(
                                ConfidenceDimensionWeights,
                                key
                            )

                );


        if (
            !supplementaryExcluded
        ) {

            return false;

        }


        const totalWeight =

            requiredKeys.reduce(

                (
                    total,
                    key
                ) =>

                    total +

                    ConfidenceDimensionWeights[
                        key
                    ],

                0

            );


        return (

            Math.abs(
                totalWeight - 1
            ) < 1e-9

        );

    };


/********************************************************************
 * 5.1.6 VALIDATE INDIVIDUAL DIMENSION ASSESSMENT
 *
 * A structurally valid assessment must:
 *
 * - be an object,
 * - explicitly expose assessable,
 * - if assessable:
 *      score must be finite,
 *      score must be within 0–100,
 *      band must be a recognized confidence band,
 * - if not assessable:
 *      score must be null,
 *      band must be UNKNOWN.
 *
 * UNKNOWN remains valid evidence state.
 * UNKNOWN is NOT converted to LOW or zero.
 ********************************************************************/

ConfidenceEngine.prototype.validateDimensionAssessment =
    function (
        assessment
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    assessment
                ) ||

            typeof assessment.assessable !==
                "boolean"
        ) {

            return false;

        }


        if (
            assessment.assessable ===
                false
        ) {

            return (

                assessment.score ===
                    null &&

                assessment.band ===
                    ConfidenceBand.UNKNOWN

            );

        }


        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    assessment.score
                )
        ) {

            return false;

        }


        if (
            assessment.score < 0 ||

            assessment.score > 100
        ) {

            return false;

        }


        const validBands = [

            ConfidenceBand.HIGH,
            ConfidenceBand.MEDIUM,
            ConfidenceBand.LOW

        ];


        return validBands.includes(
            assessment.band
        );

    };


/********************************************************************
 * 5.1.7 INSPECT AGGREGATION INPUTS
 *
 * Classifies the five weighted dimensions as:
 *
 * - assessed,
 * - UNKNOWN,
 * - structurally invalid.
 *
 * Supplementary dimensions are preserved separately.
 *
 * IMPORTANT:
 *
 * This function does NOT decide how UNKNOWN dimensions will be
 * treated mathematically. That policy belongs to Section 5.2.
 ********************************************************************/

ConfidenceEngine.prototype.inspectConfidenceAggregationInputs =
    function (
        confidence
    ) {

        const result =

            this.createConfidenceAggregationResult();


        if (
            !this.validateConfidenceDimensionWeights()
        ) {

            result.status =

                ConfidenceAggregationStatus
                    .INVALID;

            result.reasonCodes.push(

                ConfidenceAggregationReasonCodes
                    .WEIGHT_CONTRACT_INVALID

            );

            result.reasons.push(

                "The frozen confidence dimension-weight contract is invalid."

            );


            return result;

        }


        result.totalConfiguredWeight =

            Object.values(
                ConfidenceDimensionWeights
            )
            .reduce(

                (
                    total,
                    weight
                ) =>

                    total + weight,

                0

            );


        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidence.dimensions
                )
        ) {

            result.status =

                ConfidenceAggregationStatus
                    .INVALID;

            result.reasonCodes.push(

                ConfidenceAggregationReasonCodes
                    .INVALID

            );

            result.reasons.push(

                "Confidence dimensions are unavailable for aggregation inspection."

            );


            return result;

        }


        ConfidenceAggregationDimensionRoles
            .WEIGHTED
            .forEach(

                dimensionName => {

                    const assessment =

                        confidence
                            .dimensions[
                                dimensionName
                            ];


                    const weight =

                        ConfidenceDimensionWeights[
                            dimensionName
                        ];


                    const entry = {

                        dimension:
                            dimensionName,

                        weight:
                            weight,

                        assessable:
                            assessment
                                ?.assessable ===
                                true,

                        score:

                            assessment
                                ?.score ??
                                null,

                        band:

                            assessment
                                ?.band ??
                                ConfidenceBand.UNKNOWN

                    };


                    result.weightedDimensions
                        .push(
                            entry
                        );


                    if (
                        !this.validateDimensionAssessment(
                            assessment
                        )
                    ) {

                        result.invalidWeightedDimensions
                            .push(
                                dimensionName
                            );

                        return;

                    }


                    if (
                        assessment.assessable ===
                            false
                    ) {

                        result.unknownWeightedDimensions
                            .push(
                                dimensionName
                            );

                        return;

                    }


                    result.assessedWeightedDimensions
                        .push(
                            dimensionName
                        );


                    result.assessedWeight +=
                        weight;

                }

            );


        ConfidenceAggregationDimensionRoles
            .SUPPLEMENTARY
            .forEach(

                dimensionName => {

                    const assessment =

                        confidence
                            .dimensions[
                                dimensionName
                            ];


                    result.supplementaryDimensions
                        .push({

                            dimension:
                                dimensionName,

                            valid:

                                this
                                    .validateDimensionAssessment(
                                        assessment
                                    ),

                            assessable:

                                assessment
                                    ?.assessable ===
                                    true,

                            score:

                                assessment
                                    ?.score ??
                                    null,

                            band:

                                assessment
                                    ?.band ??
                                    ConfidenceBand.UNKNOWN

                        });

                }

            );


        /*
         * Structural invalidity always dominates.
         */

        if (
            result.invalidWeightedDimensions
                .length > 0
        ) {

            result.status =

                ConfidenceAggregationStatus
                    .INVALID;

            result.reasonCodes.push(

                ConfidenceAggregationReasonCodes
                    .DIMENSION_INVALID

            );

            result.reasons.push(

                "One or more weighted confidence dimensions contain structurally invalid assessments."

            );


            return result;

        }


        /*
         * All five weighted dimensions are assessable.
         */

        if (
            result.unknownWeightedDimensions
                .length === 0
        ) {

            result.status =

                ConfidenceAggregationStatus
                    .READY;

            result.eligible =
                true;

            result.reasonCodes.push(

                ConfidenceAggregationReasonCodes
                    .READY

            );

            result.reasons.push(

                "All weighted confidence dimensions are available for aggregation."

            );


            return result;

        }


        /*
         * Some weighted dimensions are UNKNOWN.
         *
         * We classify this only as PARTIAL here.
         * Section 5.2 will decide whether the available evidence
         * is sufficient for defensible overall scoring.
         */

        if (
            result.assessedWeightedDimensions
                .length > 0
        ) {

            result.status =

                ConfidenceAggregationStatus
                    .PARTIAL;

            result.reasonCodes.push(

                ConfidenceAggregationReasonCodes
                    .PARTIAL,

                ConfidenceAggregationReasonCodes
                    .DIMENSION_UNKNOWN

            );

            result.reasons.push(

                "One or more weighted confidence dimensions are UNKNOWN; evidence-sufficiency policy is required before aggregation."

            );


            return result;

        }


        /*
         * No weighted dimensions are assessable.
         */

        result.status =

            ConfidenceAggregationStatus
                .INSUFFICIENT;

        result.reasonCodes.push(

            ConfidenceAggregationReasonCodes
                .INSUFFICIENT

        );

        result.reasons.push(

            "No weighted confidence dimensions are currently assessable."

        );


        return result;

    };


/********************************************************************
 * 5.1.8 SAFE SECTION 5.1 EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window
        .ConfidenceAggregationDimensionRoles =

            ConfidenceAggregationDimensionRoles;


    window
        .ConfidenceAggregationStatus =

            ConfidenceAggregationStatus;


    window
        .ConfidenceAggregationReasonCodes =

            ConfidenceAggregationReasonCodes;

}


/********************************************************************
 * END SECTION 5.1
 ********************************************************************/
/********************************************************************
 * 5.2 DIMENSION ELIGIBILITY & EVIDENCE SUFFICIENCY
 *
 * PURPOSE:
 *
 * Determine whether the available dimension-level confidence
 * evidence is sufficient to permit deterministic overall confidence
 * scoring.
 *
 * CORE REQUIRED DIMENSIONS:
 *
 * - sourceTraceability
 * - extractionReliability
 * - normalizationCertainty
 * - completeness
 *
 * CONDITIONAL WEIGHTED DIMENSION:
 *
 * - consistency
 *
 * SUPPLEMENTARY DIMENSION:
 *
 * - corroboration
 *
 * IMPORTANT:
 *
 * Eligibility is NOT confidence quality.
 *
 * A LOW but valid and assessable core dimension remains eligible
 * for aggregation. Critical weaknesses and confidence ceilings
 * belong to Section 5.4.
 *
 * Section 5.2 DOES NOT:
 *
 * - calculate raw weighted confidence,
 * - renormalize weights,
 * - mutate confidence.score,
 * - mutate confidence.band,
 * - apply confidence caps,
 * - convert UNKNOWN to zero,
 * - fabricate unavailable evidence.
 ********************************************************************/


/********************************************************************
 * 5.2.1 EVIDENCE SUFFICIENCY DIMENSION ROLES
 ********************************************************************/

const ConfidenceEvidenceSufficiencyRoles =
    Object.freeze({

        CORE_REQUIRED:
            Object.freeze([

                "sourceTraceability",
                "extractionReliability",
                "normalizationCertainty",
                "completeness"

            ]),

        CONDITIONAL_WEIGHTED:
            Object.freeze([

                "consistency"

            ]),

        SUPPLEMENTARY:
            Object.freeze([

                "corroboration"

            ])

    });


/********************************************************************
 * 5.2.2 EVIDENCE SUFFICIENCY STATUS
 ********************************************************************/

const ConfidenceEvidenceSufficiencyStatus =
    Object.freeze({

        FULL:
            "FULL",

        CONDITIONAL:
            "CONDITIONAL",

        INSUFFICIENT:
            "INSUFFICIENT",

        INVALID:
            "INVALID"

    });


/********************************************************************
 * 5.2.3 EVIDENCE SUFFICIENCY REASON CODES
 ********************************************************************/

const ConfidenceEvidenceSufficiencyReasonCodes =
    Object.freeze({

        FULL:
            "CONFIDENCE_EVIDENCE_FULL",

        CONDITIONAL:
            "CONFIDENCE_EVIDENCE_CONDITIONAL",

        INSUFFICIENT:
            "CONFIDENCE_EVIDENCE_INSUFFICIENT",

        INVALID:
            "CONFIDENCE_EVIDENCE_INVALID",

        CORE_COMPLETE:
            "CONFIDENCE_CORE_DIMENSIONS_COMPLETE",

        CORE_UNKNOWN:
            "CONFIDENCE_CORE_DIMENSION_UNKNOWN",

        CORE_INVALID:
            "CONFIDENCE_CORE_DIMENSION_INVALID",

        CONSISTENCY_AVAILABLE:
            "CONFIDENCE_CONSISTENCY_AVAILABLE",

        CONSISTENCY_UNKNOWN:
            "CONFIDENCE_CONSISTENCY_UNKNOWN",

        CONSISTENCY_INVALID:
            "CONFIDENCE_CONSISTENCY_INVALID",

        CORROBORATION_AVAILABLE:
            "CONFIDENCE_CORROBORATION_AVAILABLE",

        CORROBORATION_UNKNOWN:
            "CONFIDENCE_CORROBORATION_UNKNOWN",

        CORROBORATION_INVALID:
            "CONFIDENCE_CORROBORATION_INVALID"

    });


/********************************************************************
 * 5.2.4 CREATE EVIDENCE SUFFICIENCY RESULT
 ********************************************************************/

ConfidenceEngine.prototype.createEvidenceSufficiencyResult =
    function () {

        return {

            status:
                ConfidenceEvidenceSufficiencyStatus
                    .INVALID,

            eligible:
                false,

            coreDimensions:
                [],

            assessedCoreDimensions:
                [],

            unknownCoreDimensions:
                [],

            invalidCoreDimensions:
                [],

            conditionalDimensions:
                [],

            assessedConditionalDimensions:
                [],

            unknownConditionalDimensions:
                [],

            invalidConditionalDimensions:
                [],

            supplementaryDimensions:
                [],

            availableWeightedDimensions:
                [],

            unavailableWeightedDimensions:
                [],

            availableWeight:
                0,

            unavailableWeight:
                0,

            reasonCodes:
                [],

            reasons:
                [],

            warnings:
                [],

            evaluatedAt:
                ConfidenceEngineUtils.now()

        };

    };


/********************************************************************
 * 5.2.5 INSPECT A DIMENSION FOR SUFFICIENCY
 *
 * Returns a normalized inspection state:
 *
 * ASSESSED
 * UNKNOWN
 * INVALID
 *
 * This consumes the frozen Section 5.1 structural validator.
 ********************************************************************/

ConfidenceEngine.prototype.inspectDimensionForSufficiency =
    function (
        dimensionName,
        assessment
    ) {

        const result = {

            dimension:
                dimensionName,

            state:
                "INVALID",

            valid:
                false,

            assessable:
                false,

            score:
                null,

            band:
                ConfidenceBand.UNKNOWN

        };


        if (
            !this.validateDimensionAssessment(
                assessment
            )
        ) {

            return result;

        }


        result.valid =
            true;

        result.assessable =

            assessment.assessable ===
                true;

        result.score =

            assessment.score;

        result.band =

            assessment.band;


        if (
            assessment.assessable ===
                false
        ) {

            result.state =
                "UNKNOWN";

            return result;

        }


        result.state =
            "ASSESSED";


        return result;

    };


/********************************************************************
 * 5.2.6 EVALUATE EVIDENCE SUFFICIENCY
 *
 * POLICY:
 *
 * 1. All four CORE_REQUIRED dimensions must be structurally valid
 *    and assessable.
 *
 * 2. LOW core scores remain eligible.
 *
 * 3. consistency:
 *
 *    - ASSESSED:
 *        FULL evidence sufficiency.
 *
 *    - legitimately UNKNOWN:
 *        CONDITIONAL evidence sufficiency.
 *        Overall scoring remains eligible.
 *
 *    - INVALID:
 *        INVALID.
 *
 * 4. corroboration:
 *
 *    - does not determine base-score eligibility,
 *    - its state is preserved diagnostically,
 *    - malformed corroboration produces a warning but does not
 *      invalidate otherwise sufficient base aggregation evidence.
 *
 * 5. No arithmetic or renormalization occurs here.
 ********************************************************************/

ConfidenceEngine.prototype.evaluateEvidenceSufficiency =
    function (
        confidence
    ) {

        const result =

            this.createEvidenceSufficiencyResult();


        /*
         * Structural confidence contract.
         */

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidence.dimensions
                )
        ) {

            result.status =

                ConfidenceEvidenceSufficiencyStatus
                    .INVALID;

            result.reasonCodes.push(

                ConfidenceEvidenceSufficiencyReasonCodes
                    .INVALID

            );

            result.reasons.push(

                "Confidence dimensions are unavailable for evidence-sufficiency evaluation."

            );


            return result;

        }


        /*
         * Validate the existing frozen aggregation contract first.
         */

        if (
            !this.validateConfidenceDimensionWeights()
        ) {

            result.status =

                ConfidenceEvidenceSufficiencyStatus
                    .INVALID;

            result.reasonCodes.push(

                ConfidenceEvidenceSufficiencyReasonCodes
                    .INVALID

            );

            result.reasons.push(

                "The frozen confidence dimension-weight contract is invalid."

            );


            return result;

        }


        /**********************************************************
         * CORE REQUIRED DIMENSIONS
         **********************************************************/

        ConfidenceEvidenceSufficiencyRoles
            .CORE_REQUIRED
            .forEach(

                dimensionName => {

                    const assessment =

                        confidence
                            .dimensions[
                                dimensionName
                            ];


                    const inspection =

                        this
                            .inspectDimensionForSufficiency(

                                dimensionName,
                                assessment

                            );


                    result.coreDimensions
                        .push(
                            inspection
                        );


                    if (
                        inspection.state ===
                            "ASSESSED"
                    ) {

                        result
                            .assessedCoreDimensions
                            .push(
                                dimensionName
                            );

                        return;

                    }


                    if (
                        inspection.state ===
                            "UNKNOWN"
                    ) {

                        result
                            .unknownCoreDimensions
                            .push(
                                dimensionName
                            );

                        return;

                    }


                    result
                        .invalidCoreDimensions
                        .push(
                            dimensionName
                        );

                }

            );


        /**********************************************************
         * CONDITIONAL WEIGHTED DIMENSION
         **********************************************************/

        ConfidenceEvidenceSufficiencyRoles
            .CONDITIONAL_WEIGHTED
            .forEach(

                dimensionName => {

                    const assessment =

                        confidence
                            .dimensions[
                                dimensionName
                            ];


                    const inspection =

                        this
                            .inspectDimensionForSufficiency(

                                dimensionName,
                                assessment

                            );


                    result
                        .conditionalDimensions
                        .push(
                            inspection
                        );


                    if (
                        inspection.state ===
                            "ASSESSED"
                    ) {

                        result
                            .assessedConditionalDimensions
                            .push(
                                dimensionName
                            );

                        return;

                    }


                    if (
                        inspection.state ===
                            "UNKNOWN"
                    ) {

                        result
                            .unknownConditionalDimensions
                            .push(
                                dimensionName
                            );

                        return;

                    }


                    result
                        .invalidConditionalDimensions
                        .push(
                            dimensionName
                        );

                }

            );


        /**********************************************************
         * SUPPLEMENTARY DIMENSION
         **********************************************************/

        ConfidenceEvidenceSufficiencyRoles
            .SUPPLEMENTARY
            .forEach(

                dimensionName => {

                    const assessment =

                        confidence
                            .dimensions[
                                dimensionName
                            ];


                    const inspection =

                        this
                            .inspectDimensionForSufficiency(

                                dimensionName,
                                assessment

                            );


                    result
                        .supplementaryDimensions
                        .push(
                            inspection
                        );


                    if (
                        inspection.state ===
                            "ASSESSED"
                    ) {

                        result.reasonCodes.push(

                            ConfidenceEvidenceSufficiencyReasonCodes
                                .CORROBORATION_AVAILABLE

                        );

                    } else if (
                        inspection.state ===
                            "UNKNOWN"
                    ) {

                        result.reasonCodes.push(

                            ConfidenceEvidenceSufficiencyReasonCodes
                                .CORROBORATION_UNKNOWN

                        );

                    } else {

                        result.reasonCodes.push(

                            ConfidenceEvidenceSufficiencyReasonCodes
                                .CORROBORATION_INVALID

                        );

                        result.warnings.push(

                            "Supplementary corroboration evidence is structurally invalid."

                        );

                    }

                }

            );


        /**********************************************************
         * INVALID CORE / CONDITIONAL EVIDENCE
         *
         * Structural invalidity is different from legitimate
         * UNKNOWN evidence.
         **********************************************************/

        if (
            result.invalidCoreDimensions
                .length > 0 ||

            result.invalidConditionalDimensions
                .length > 0
        ) {

            result.status =

                ConfidenceEvidenceSufficiencyStatus
                    .INVALID;


            result.eligible =
                false;


            result.reasonCodes.push(

                ConfidenceEvidenceSufficiencyReasonCodes
                    .INVALID

            );


            if (
                result.invalidCoreDimensions
                    .length > 0
            ) {

                result.reasonCodes.push(

                    ConfidenceEvidenceSufficiencyReasonCodes
                        .CORE_INVALID

                );

                result.reasons.push(

                    "One or more required core confidence dimensions are structurally invalid."

                );

            }


            if (
                result.invalidConditionalDimensions
                    .length > 0
            ) {

                result.reasonCodes.push(

                    ConfidenceEvidenceSufficiencyReasonCodes
                        .CONSISTENCY_INVALID

                );

                result.reasons.push(

                    "The conditional consistency dimension is structurally invalid."

                );

            }


            return result;

        }


        /**********************************************************
         * CORE EVIDENCE SUFFICIENCY GATE
         *
         * Every core dimension must be ASSESSED.
         *
         * Score level is deliberately irrelevant here.
         **********************************************************/

        if (
            result.unknownCoreDimensions
                .length > 0
        ) {

            result.status =

                ConfidenceEvidenceSufficiencyStatus
                    .INSUFFICIENT;


            result.eligible =
                false;


            result.reasonCodes.push(

                ConfidenceEvidenceSufficiencyReasonCodes
                    .INSUFFICIENT,

                ConfidenceEvidenceSufficiencyReasonCodes
                    .CORE_UNKNOWN

            );


            result.reasons.push(

                "Overall confidence cannot be calculated because one or more required core confidence dimensions are UNKNOWN."

            );


            /*
             * Still expose weighted availability diagnostically.
             */

            ConfidenceAggregationDimensionRoles
                .WEIGHTED
                .forEach(

                    dimensionName => {

                        const assessment =

                            confidence
                                .dimensions[
                                    dimensionName
                                ];


                        if (
                            this
                                .validateDimensionAssessment(
                                    assessment
                                ) &&

                            assessment.assessable ===
                                true
                        ) {

                            result
                                .availableWeightedDimensions
                                .push(
                                    dimensionName
                                );

                            result.availableWeight +=

                                ConfidenceDimensionWeights[
                                    dimensionName
                                ];

                        } else {

                            result
                                .unavailableWeightedDimensions
                                .push(
                                    dimensionName
                                );

                            result.unavailableWeight +=

                                ConfidenceDimensionWeights[
                                    dimensionName
                                ];

                        }

                    }

                );


            return result;

        }


        /*
         * All four core dimensions are valid and assessable.
         */

        result.reasonCodes.push(

            ConfidenceEvidenceSufficiencyReasonCodes
                .CORE_COMPLETE

        );


        /**********************************************************
         * CALCULATE AVAILABILITY ONLY
         *
         * This records which configured weights are available.
         *
         * It DOES NOT:
         * - calculate weighted score,
         * - renormalize weights.
         **********************************************************/

        ConfidenceAggregationDimensionRoles
            .WEIGHTED
            .forEach(

                dimensionName => {

                    const assessment =

                        confidence
                            .dimensions[
                                dimensionName
                            ];


                    if (
                        this
                            .validateDimensionAssessment(
                                assessment
                            ) &&

                        assessment.assessable ===
                            true
                    ) {

                        result
                            .availableWeightedDimensions
                            .push(
                                dimensionName
                            );

                        result.availableWeight +=

                            ConfidenceDimensionWeights[
                                dimensionName
                            ];

                    } else {

                        result
                            .unavailableWeightedDimensions
                            .push(
                                dimensionName
                            );

                        result.unavailableWeight +=

                            ConfidenceDimensionWeights[
                                dimensionName
                            ];

                    }

                }

            );


        /**********************************************************
         * FULL
         *
         * All four core dimensions + consistency are assessable.
         **********************************************************/

        if (
            result
                .assessedConditionalDimensions
                .includes(
                    "consistency"
                )
        ) {

            result.status =

                ConfidenceEvidenceSufficiencyStatus
                    .FULL;


            result.eligible =
                true;


            result.reasonCodes.push(

                ConfidenceEvidenceSufficiencyReasonCodes
                    .FULL,

                ConfidenceEvidenceSufficiencyReasonCodes
                    .CONSISTENCY_AVAILABLE

            );


            result.reasons.push(

                "All required core dimensions and the conditional consistency dimension are available for weighted confidence aggregation."

            );


            return result;

        }


        /**********************************************************
         * CONDITIONAL
         *
         * All core dimensions are assessable.
         * Consistency is legitimately UNKNOWN.
         *
         * Overall scoring is allowed, but Section 5.3 must account
         * for the unavailable 15% without treating it as zero.
         **********************************************************/

        result.status =

            ConfidenceEvidenceSufficiencyStatus
                .CONDITIONAL;


        result.eligible =
            true;


        result.reasonCodes.push(

            ConfidenceEvidenceSufficiencyReasonCodes
                .CONDITIONAL,

            ConfidenceEvidenceSufficiencyReasonCodes
                .CONSISTENCY_UNKNOWN

        );


        result.reasons.push(

            "All required core confidence dimensions are assessable; consistency is legitimately UNKNOWN, so conditional aggregation is permitted."

        );


        return result;

    };


/********************************************************************
 * 5.2.7 RECORD-LEVEL EVIDENCE SUFFICIENCY
 *
 * Convenience method.
 *
 * Does not persist any final score or mutate confidence.
 ********************************************************************/

ConfidenceEngine.prototype.evaluateRecordEvidenceSufficiency =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord.confidence
                )
        ) {

            return this
                .createEvidenceSufficiencyResult();

        }


        return this
            .evaluateEvidenceSufficiency(

                confidenceRecord
                    .confidence

            );

    };


/********************************************************************
 * 5.2.8 EVIDENCE SUFFICIENCY DIAGNOSTICS
 *
 * Evaluates the current confidence-model records without mutating
 * them.
 ********************************************************************/

ConfidenceEngine.prototype.evidenceSufficiencyDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            eligibleRecords:
                0,

            ineligibleRecords:
                0,

            full:
                0,

            conditional:
                0,

            insufficient:
                0,

            invalid:
                0

        };


        records.forEach(

            record => {

                const result =

                    this
                        .evaluateRecordEvidenceSufficiency(
                            record
                        );


                if (
                    result.eligible
                ) {

                    diagnostics
                        .eligibleRecords++;

                } else {

                    diagnostics
                        .ineligibleRecords++;

                }


                switch (
                    result.status
                ) {

                    case ConfidenceEvidenceSufficiencyStatus
                        .FULL:

                        diagnostics.full++;

                        break;


                    case ConfidenceEvidenceSufficiencyStatus
                        .CONDITIONAL:

                        diagnostics.conditional++;

                        break;


                    case ConfidenceEvidenceSufficiencyStatus
                        .INSUFFICIENT:

                        diagnostics.insufficient++;

                        break;


                    default:

                        diagnostics.invalid++;

                }

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 5.2.9 SAFE EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window
        .ConfidenceEvidenceSufficiencyRoles =

            ConfidenceEvidenceSufficiencyRoles;


    window
        .ConfidenceEvidenceSufficiencyStatus =

            ConfidenceEvidenceSufficiencyStatus;


    window
        .ConfidenceEvidenceSufficiencyReasonCodes =

            ConfidenceEvidenceSufficiencyReasonCodes;

}


/********************************************************************
 * END SECTION 5.2
 ********************************************************************/
/********************************************************************
 * 5.3 RAW WEIGHTED CONFIDENCE
 *
 * PURPOSE:
 *
 * Calculate the deterministic raw weighted confidence score from
 * dimension-level assessments that have passed the Section 5.2
 * evidence-sufficiency gate.
 *
 * FULL MODE:
 *
 * All five configured weighted dimensions are assessable.
 *
 * CONDITIONAL MODE:
 *
 * All four core dimensions are assessable, while consistency is
 * legitimately UNKNOWN.
 *
 * In CONDITIONAL mode:
 *
 * - UNKNOWN consistency is NOT converted to zero,
 * - its unavailable weight is excluded,
 * - available configured weights are renormalized,
 * - the exclusion remains explicit in the calculation trace.
 *
 * IMPORTANT:
 *
 * This section calculates RAW confidence only.
 *
 * It DOES NOT mutate:
 *
 * confidence.score
 * confidence.band
 * confidence.capped
 * confidence.capReason
 *
 * Critical confidence conditions and caps belong to Section 5.4.
 ********************************************************************/


/********************************************************************
 * 5.3.1 RAW AGGREGATION MODES
 ********************************************************************/

const ConfidenceRawAggregationMode =
    Object.freeze({

        FULL_WEIGHTED:
            "FULL_WEIGHTED",

        CONDITIONAL_RENORMALIZED:
            "CONDITIONAL_RENORMALIZED",

        NOT_CALCULABLE:
            "NOT_CALCULABLE"

    });


/********************************************************************
 * 5.3.2 RAW CONFIDENCE REASON CODES
 ********************************************************************/

const ConfidenceRawScoreReasonCodes =
    Object.freeze({

        FULL_WEIGHTED:
            "CONFIDENCE_RAW_FULL_WEIGHTED",

        CONDITIONAL_RENORMALIZED:
            "CONFIDENCE_RAW_CONDITIONAL_RENORMALIZED",

        NOT_CALCULABLE:
            "CONFIDENCE_RAW_NOT_CALCULABLE",

        EVIDENCE_INSUFFICIENT:
            "CONFIDENCE_RAW_EVIDENCE_INSUFFICIENT",

        EVIDENCE_INVALID:
            "CONFIDENCE_RAW_EVIDENCE_INVALID",

        DIMENSION_EXCLUDED:
            "CONFIDENCE_RAW_DIMENSION_EXCLUDED",

        INVALID_WEIGHT:
            "CONFIDENCE_RAW_INVALID_WEIGHT",

        INVALID_SCORE:
            "CONFIDENCE_RAW_INVALID_SCORE",

        INVALID_AVAILABLE_WEIGHT:
            "CONFIDENCE_RAW_INVALID_AVAILABLE_WEIGHT"

    });


/********************************************************************
 * 5.3.3 PRECISION CONTRACT
 *
 * Raw confidence is exposed to two decimal places.
 *
 * Individual calculation inputs and unrounded contributions remain
 * available in the calculation trace.
 ********************************************************************/

const ConfidenceRawScorePrecision =
    Object.freeze({

        DECIMAL_PLACES:
            2

    });


/********************************************************************
 * 5.3.4 CREATE RAW CONFIDENCE RESULT
 ********************************************************************/

ConfidenceEngine.prototype.createRawConfidenceResult =
    function () {

        return {

            calculable:
                false,

            mode:
                ConfidenceRawAggregationMode
                    .NOT_CALCULABLE,

            rawScore:
                null,

            unroundedRawScore:
                null,

            weightedContribution:
                0,

            configuredWeight:
                1,

            availableWeight:
                0,

            unavailableWeight:
                1,

            dimensionContributions:
                [],

            excludedDimensions:
                [],

            reasonCodes:
                [],

            reasons:
                [],

            warnings:
                [],

            calculatedAt:
                ConfidenceEngineUtils.now()

        };

    };


/********************************************************************
 * 5.3.5 ROUND RAW CONFIDENCE SCORE
 *
 * Deterministic numeric rounding.
 *
 * Returns null for invalid numeric input.
 ********************************************************************/

ConfidenceEngine.prototype.roundRawConfidenceScore =
    function (
        value
    ) {

        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    value
                )
        ) {

            return null;

        }


        const decimalPlaces =

            ConfidenceRawScorePrecision
                .DECIMAL_PLACES;


        const factor =

            Math.pow(
                10,
                decimalPlaces
            );


        return (

            Math.round(
                (
                    value +
                    Number.EPSILON
                ) *
                factor
            ) /
            factor

        );

    };


/********************************************************************
 * 5.3.6 CREATE DIMENSION CONTRIBUTION
 *
 * Creates an auditable contribution record.
 *
 * configuredWeight:
 *     frozen weight from ConfidenceDimensionWeights
 *
 * effectiveWeight:
 *     weight after any conditional renormalization
 *
 * configuredContribution:
 *     score × configuredWeight
 *
 * effectiveContribution:
 *     score × effectiveWeight
 ********************************************************************/

ConfidenceEngine.prototype.createDimensionContribution =
    function (
        dimensionName,
        assessment,
        configuredWeight,
        availableWeight,
        included
    ) {

        const contribution = {

            dimension:
                dimensionName,

            included:
                included === true,

            assessable:

                assessment
                    ?.assessable ===
                    true,

            score:

                assessment
                    ?.score ??
                    null,

            band:

                assessment
                    ?.band ??
                    ConfidenceBand.UNKNOWN,

            configuredWeight:
                configuredWeight,

            effectiveWeight:
                0,

            configuredContribution:
                0,

            effectiveContribution:
                0

        };


        if (
            included !== true
        ) {

            return contribution;

        }


        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    configuredWeight
                ) ||

            configuredWeight <= 0 ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    availableWeight
                ) ||

            availableWeight <= 0 ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    assessment?.score
                )
        ) {

            return contribution;

        }


        contribution.effectiveWeight =

            configuredWeight /
            availableWeight;


        contribution.configuredContribution =

            assessment.score *
            configuredWeight;


        contribution.effectiveContribution =

            assessment.score *
            contribution.effectiveWeight;


        return contribution;

    };


/********************************************************************
 * 5.3.7 CALCULATE RAW WEIGHTED CONFIDENCE
 *
 * Consumes Section 5.2 evidence sufficiency.
 *
 * FULL:
 *
 *     availableWeight = 1.00
 *
 *     rawScore =
 *         Σ(score × configuredWeight)
 *
 *
 * CONDITIONAL:
 *
 *     typically availableWeight = 0.85
 *
 *     rawScore =
 *         Σ(score × configuredWeight)
 *         ---------------------------
 *             availableWeight
 *
 *
 * INSUFFICIENT / INVALID:
 *
 *     calculable = false
 *     rawScore = null
 ********************************************************************/

ConfidenceEngine.prototype.calculateRawWeightedConfidence =
    function (
        confidence
    ) {

        const result =

            this.createRawConfidenceResult();


        const sufficiency =

            this.evaluateEvidenceSufficiency(
                confidence
            );


        /*
         * Preserve availability state from Section 5.2.
         */

        if (
            ConfidenceEngineUtils
                .isFiniteNumber(
                    sufficiency.availableWeight
                )
        ) {

            result.availableWeight =

                sufficiency.availableWeight;

        }


        if (
            ConfidenceEngineUtils
                .isFiniteNumber(
                    sufficiency.unavailableWeight
                )
        ) {

            result.unavailableWeight =

                sufficiency.unavailableWeight;

        }


        /*
         * INVALID evidence.
         */

        if (
            sufficiency.status ===
                ConfidenceEvidenceSufficiencyStatus
                    .INVALID
        ) {

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .NOT_CALCULABLE,

                ConfidenceRawScoreReasonCodes
                    .EVIDENCE_INVALID

            );


            result.reasons.push(

                "Raw confidence cannot be calculated because the confidence evidence is structurally invalid."

            );


            return result;

        }


        /*
         * INSUFFICIENT evidence.
         */

        if (
            sufficiency.status ===
                ConfidenceEvidenceSufficiencyStatus
                    .INSUFFICIENT
        ) {

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .NOT_CALCULABLE,

                ConfidenceRawScoreReasonCodes
                    .EVIDENCE_INSUFFICIENT

            );


            result.reasons.push(

                "Raw confidence cannot be calculated because required core confidence evidence is unavailable."

            );


            return result;

        }


        /*
         * Defensive eligibility gate.
         */

        if (
            sufficiency.eligible !==
                true
        ) {

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .NOT_CALCULABLE

            );


            result.reasons.push(

                "Raw confidence calculation is not eligible under the evidence-sufficiency policy."

            );


            return result;

        }


        /*
         * Available weight must be valid before arithmetic.
         */

        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    sufficiency.availableWeight
                ) ||

            sufficiency.availableWeight <= 0 ||

            sufficiency.availableWeight > 1
        ) {

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .NOT_CALCULABLE,

                ConfidenceRawScoreReasonCodes
                    .INVALID_AVAILABLE_WEIGHT

            );


            result.reasons.push(

                "Raw confidence cannot be calculated because the available aggregation weight is invalid."

            );


            return result;

        }


        result.availableWeight =

            sufficiency.availableWeight;


        result.unavailableWeight =

            sufficiency.unavailableWeight;


        /*
         * Determine aggregation mode.
         */

        if (
            sufficiency.status ===
                ConfidenceEvidenceSufficiencyStatus
                    .FULL
        ) {

            result.mode =

                ConfidenceRawAggregationMode
                    .FULL_WEIGHTED;

        } else if (
            sufficiency.status ===
                ConfidenceEvidenceSufficiencyStatus
                    .CONDITIONAL
        ) {

            result.mode =

                ConfidenceRawAggregationMode
                    .CONDITIONAL_RENORMALIZED;

        } else {

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .NOT_CALCULABLE

            );


            return result;

        }


        let configuredContributionTotal =
            0;


        let effectiveContributionTotal =
            0;


        /*
         * Process exactly the frozen five weighted dimensions.
         */

        for (
            const dimensionName of
            ConfidenceAggregationDimensionRoles
                .WEIGHTED
        ) {

            const assessment =

                confidence
                    ?.dimensions?.[
                        dimensionName
                    ];


            const configuredWeight =

                ConfidenceDimensionWeights[
                    dimensionName
                ];


            /*
             * Frozen weight contract must remain valid.
             */

            if (
                !ConfidenceEngineUtils
                    .isFiniteNumber(
                        configuredWeight
                    ) ||

                configuredWeight <= 0
            ) {

                result.calculable =
                    false;

                result.mode =

                    ConfidenceRawAggregationMode
                        .NOT_CALCULABLE;

                result.rawScore =
                    null;

                result.unroundedRawScore =
                    null;

                result.reasonCodes.push(

                    ConfidenceRawScoreReasonCodes
                        .NOT_CALCULABLE,

                    ConfidenceRawScoreReasonCodes
                        .INVALID_WEIGHT

                );

                result.reasons.push(

                    "A configured confidence dimension weight is invalid."

                );


                return result;

            }


            const assessmentValid =

                this
                    .validateDimensionAssessment(
                        assessment
                    );


            /*
             * Structurally invalid weighted assessment.
             */

            if (
                !assessmentValid
            ) {

                result.calculable =
                    false;

                result.mode =

                    ConfidenceRawAggregationMode
                        .NOT_CALCULABLE;

                result.rawScore =
                    null;

                result.unroundedRawScore =
                    null;

                result.reasonCodes.push(

                    ConfidenceRawScoreReasonCodes
                        .NOT_CALCULABLE,

                    ConfidenceRawScoreReasonCodes
                        .INVALID_SCORE

                );

                result.reasons.push(

                    "A weighted confidence dimension contains an invalid assessment."

                );


                return result;

            }


            const included =

                assessment.assessable ===
                    true;


            const contribution =

                this
                    .createDimensionContribution(

                        dimensionName,
                        assessment,
                        configuredWeight,
                        sufficiency.availableWeight,
                        included

                    );


            result
                .dimensionContributions
                .push(
                    contribution
                );


            if (
                included
            ) {

                configuredContributionTotal +=

                    contribution
                        .configuredContribution;


                effectiveContributionTotal +=

                    contribution
                        .effectiveContribution;

            } else {

                result
                    .excludedDimensions
                    .push(
                        dimensionName
                    );

            }

        }


        /*
         * CONDITIONAL mode must explicitly preserve exclusion.
         */

        if (
            result.mode ===
                ConfidenceRawAggregationMode
                    .CONDITIONAL_RENORMALIZED &&

            result.excludedDimensions
                .length > 0
        ) {

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .DIMENSION_EXCLUDED

            );


            result.warnings.push(

                "One or more legitimately UNKNOWN weighted dimensions were excluded and the available weights were renormalized."

            );

        }


        /*
         * Raw weighted arithmetic.
         *
         * configuredContributionTotal / availableWeight
         *
         * must equal the sum of effective contributions,
         * subject only to floating-point precision.
         */

        const unroundedRawScore =

            configuredContributionTotal /
            sufficiency.availableWeight;


        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    unroundedRawScore
                )
        ) {

            result.calculable =
                false;

            result.mode =

                ConfidenceRawAggregationMode
                    .NOT_CALCULABLE;

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .NOT_CALCULABLE

            );


            return result;

        }


        /*
         * Defensive numerical boundary.
         *
         * Dimension scores are constrained to 0–100, therefore a
         * valid renormalized raw score must also remain in 0–100.
         */

        if (
            unroundedRawScore < 0 ||

            unroundedRawScore > 100 + 1e-9
        ) {

            result.calculable =
                false;

            result.mode =

                ConfidenceRawAggregationMode
                    .NOT_CALCULABLE;

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .NOT_CALCULABLE,

                ConfidenceRawScoreReasonCodes
                    .INVALID_SCORE

            );


            result.reasons.push(

                "The calculated raw confidence score falls outside the valid 0–100 range."

            );


            return result;

        }


        result.calculable =
            true;


        result.weightedContribution =

            configuredContributionTotal;


        result.unroundedRawScore =

            unroundedRawScore;


        result.rawScore =

            this
                .roundRawConfidenceScore(
                    unroundedRawScore
                );


        if (
            result.mode ===
                ConfidenceRawAggregationMode
                    .FULL_WEIGHTED
        ) {

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .FULL_WEIGHTED

            );


            result.reasons.push(

                "Raw confidence was calculated using all configured weighted confidence dimensions."

            );

        } else {

            result.reasonCodes.push(

                ConfidenceRawScoreReasonCodes
                    .CONDITIONAL_RENORMALIZED

            );


            result.reasons.push(

                "Raw confidence was calculated from available core evidence using controlled weight renormalization because consistency was legitimately UNKNOWN."

            );

        }


        /*
         * Internal arithmetic consistency warning.
         *
         * This should never occur under a valid contract.
         */

        if (
            Math.abs(
                effectiveContributionTotal -
                unroundedRawScore
            ) > 1e-9
        ) {

            result.warnings.push(

                "The effective contribution trace differs from the calculated raw confidence score."

            );

        }


        return result;

    };


/********************************************************************
 * 5.3.8 RECORD-LEVEL RAW CONFIDENCE
 *
 * Convenience API.
 *
 * Does NOT persist the raw score into confidence.score.
 ********************************************************************/

ConfidenceEngine.prototype.calculateRecordRawConfidence =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord.confidence
                )
        ) {

            return this
                .createRawConfidenceResult();

        }


        return this
            .calculateRawWeightedConfidence(

                confidenceRecord
                    .confidence

            );

    };


/********************************************************************
 * 5.3.9 RAW CONFIDENCE DIAGNOSTICS
 *
 * Evaluates all current confidence-model records without mutating
 * their final confidence fields.
 ********************************************************************/

ConfidenceEngine.prototype.rawConfidenceDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            calculableRecords:
                0,

            nonCalculableRecords:
                0,

            fullWeighted:
                0,

            conditionalRenormalized:
                0,

            averageRawScore:
                null

        };


        const scores =
            [];


        records.forEach(

            record => {

                const result =

                    this
                        .calculateRecordRawConfidence(
                            record
                        );


                if (
                    result.calculable ===
                        true
                ) {

                    diagnostics
                        .calculableRecords++;


                    scores.push(
                        result.rawScore
                    );


                    if (
                        result.mode ===
                            ConfidenceRawAggregationMode
                                .FULL_WEIGHTED
                    ) {

                        diagnostics
                            .fullWeighted++;

                    }


                    if (
                        result.mode ===
                            ConfidenceRawAggregationMode
                                .CONDITIONAL_RENORMALIZED
                    ) {

                        diagnostics
                            .conditionalRenormalized++;

                    }

                } else {

                    diagnostics
                        .nonCalculableRecords++;

                }

            }

        );


        if (
            scores.length > 0
        ) {

            const average =

                scores.reduce(

                    (
                        total,
                        score
                    ) =>

                        total + score,

                    0

                ) /
                scores.length;


            diagnostics.averageRawScore =

                this
                    .roundRawConfidenceScore(
                        average
                    );

        }


        return diagnostics;

    };


/********************************************************************
 * 5.3.10 SAFE EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window
        .ConfidenceRawAggregationMode =

            ConfidenceRawAggregationMode;


    window
        .ConfidenceRawScoreReasonCodes =

            ConfidenceRawScoreReasonCodes;


    window
        .ConfidenceRawScorePrecision =

            ConfidenceRawScorePrecision;

}


/********************************************************************
 * END SECTION 5.3
 ********************************************************************/
/********************************************************************
 * 5.4 CRITICAL CONDITIONS & CONFIDENCE CAPS
 *
 * PURPOSE:
 *
 * Detect material weaknesses in core evidence dimensions and
 * calculate the maximum defensible confidence candidate without
 * corrupting the raw weighted score produced by Section 5.3.
 *
 * MVP POLICY:
 *
 * CORE DIMENSION LOW:
 *     maximum confidence ceiling = 59
 *
 * CORE DIMENSION SCORE ZERO:
 *     maximum confidence ceiling = 35
 *
 * Multiple applicable caps:
 *     the most restrictive ceiling wins.
 *
 * IMPORTANT:
 *
 * - Caps are ceilings, never bonuses.
 * - Caps never alter rawScore.
 * - UNKNOWN does not become a cap.
 * - Consistency LOW does not create a hard MVP cap.
 * - Corroboration does not create a base-score cap.
 *
 * Section 5.4 DOES NOT mutate:
 *
 * confidence.score
 * confidence.band
 * confidence.capped
 * confidence.capReason
 *
 * Final confidence persistence belongs to Section 5.5.
 ********************************************************************/


/********************************************************************
 * 5.4.1 CONFIDENCE CAP POLICY
 *
 * Explicit policy contract.
 *
 * These values are NOT ConfidenceStandardScores and are NOT
 * classification thresholds.
 ********************************************************************/

const ConfidenceCapPolicy =
    Object.freeze({

        CORE_LOW_MAX_SCORE:
            59,

        CORE_ZERO_MAX_SCORE:
            35

    });


/********************************************************************
 * 5.4.2 CRITICAL CONDITION TYPES
 ********************************************************************/

const ConfidenceCriticalConditionType =
    Object.freeze({

        CORE_DIMENSION_LOW:
            "CORE_DIMENSION_LOW",

        CORE_DIMENSION_ZERO:
            "CORE_DIMENSION_ZERO"

    });


/********************************************************************
 * 5.4.3 CAP EVALUATION STATUS
 ********************************************************************/

const ConfidenceCapEvaluationStatus =
    Object.freeze({

        NOT_CALCULABLE:
            "NOT_CALCULABLE",

        UNRESTRICTED:
            "UNRESTRICTED",

        CAPPED:
            "CAPPED",

        CONDITION_PRESENT_NOT_BINDING:
            "CONDITION_PRESENT_NOT_BINDING"

    });


/********************************************************************
 * 5.4.4 CAP REASON CODES
 ********************************************************************/

const ConfidenceCapReasonCodes =
    Object.freeze({

        NOT_CALCULABLE:
            "CONFIDENCE_CAP_NOT_CALCULABLE",

        NO_CRITICAL_CONDITION:
            "CONFIDENCE_CAP_NO_CRITICAL_CONDITION",

        CORE_LOW:
            "CONFIDENCE_CAP_CORE_LOW",

        CORE_ZERO:
            "CONFIDENCE_CAP_CORE_ZERO",

        MULTIPLE_CONDITIONS:
            "CONFIDENCE_CAP_MULTIPLE_CONDITIONS",

        CAP_APPLIED:
            "CONFIDENCE_CAP_APPLIED",

        CAP_NOT_BINDING:
            "CONFIDENCE_CAP_NOT_BINDING"

    });


/********************************************************************
 * 5.4.5 CREATE CRITICAL CONDITION
 ********************************************************************/

ConfidenceEngine.prototype.createConfidenceCriticalCondition =
    function (
        type,
        dimension,
        observedScore,
        observedBand,
        capScore,
        reason
    ) {

        return {

            type:
                type,

            dimension:
                dimension,

            observedScore:
                observedScore,

            observedBand:
                observedBand,

            capScore:
                capScore,

            reason:
                reason

        };

    };


/********************************************************************
 * 5.4.6 CREATE CAP EVALUATION RESULT
 ********************************************************************/

ConfidenceEngine.prototype.createConfidenceCapResult =
    function () {

        return {

            calculable:
                false,

            status:
                ConfidenceCapEvaluationStatus
                    .NOT_CALCULABLE,

            rawScore:
                null,

            candidateScore:
                null,

            capApplied:
                false,

            effectiveCap:
                null,

            capReason:
                null,

            triggeredConditions:
                [],

            applicableCaps:
                [],

            reasonCodes:
                [],

            reasons:
                [],

            warnings:
                [],

            evaluatedAt:
                ConfidenceEngineUtils.now()

        };

    };


/********************************************************************
 * 5.4.7 DETECT CRITICAL CONFIDENCE CONDITIONS
 *
 * Uses ONLY the four Section 5.2 CORE_REQUIRED dimensions.
 *
 * Priority:
 *
 * score === 0
 *     → CORE_DIMENSION_ZERO
 *
 * otherwise band === LOW
 *     → CORE_DIMENSION_LOW
 *
 * A zero score is not duplicated as both ZERO and LOW.
 *
 * This function does not reassess evidence.
 ********************************************************************/

ConfidenceEngine.prototype.detectCriticalConfidenceConditions =
    function (
        confidence
    ) {

        const conditions =
            [];


        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidence.dimensions
                )
        ) {

            return conditions;

        }


        ConfidenceEvidenceSufficiencyRoles
            .CORE_REQUIRED
            .forEach(

                dimensionName => {

                    const assessment =

                        confidence
                            .dimensions[
                                dimensionName
                            ];


                    /*
                     * Only structurally valid and assessable
                     * dimensions may create critical conditions.
                     */

                    if (
                        !this
                            .validateDimensionAssessment(
                                assessment
                            ) ||

                        assessment.assessable !==
                            true
                    ) {

                        return;

                    }


                    /*
                     * Strongest weakness:
                     * explicit score zero.
                     */

                    if (
                        assessment.score ===
                            0
                    ) {

                        conditions.push(

                            this
                                .createConfidenceCriticalCondition(

                                    ConfidenceCriticalConditionType
                                        .CORE_DIMENSION_ZERO,

                                    dimensionName,

                                    assessment.score,

                                    assessment.band,

                                    ConfidenceCapPolicy
                                        .CORE_ZERO_MAX_SCORE,

                                    (
                                        "Core confidence dimension '" +
                                        dimensionName +
                                        "' has an explicit score of zero."
                                    )

                                )

                        );


                        return;

                    }


                    /*
                     * Any other LOW core assessment.
                     */

                    if (
                        assessment.band ===
                            ConfidenceBand.LOW
                    ) {

                        conditions.push(

                            this
                                .createConfidenceCriticalCondition(

                                    ConfidenceCriticalConditionType
                                        .CORE_DIMENSION_LOW,

                                    dimensionName,

                                    assessment.score,

                                    assessment.band,

                                    ConfidenceCapPolicy
                                        .CORE_LOW_MAX_SCORE,

                                    (
                                        "Core confidence dimension '" +
                                        dimensionName +
                                        "' is assessed as LOW."
                                    )

                                )

                        );

                    }

                }

            );


        return conditions;

    };


/********************************************************************
 * 5.4.8 RESOLVE EFFECTIVE CONFIDENCE CAP
 *
 * If multiple critical conditions exist, the lowest cap wins.
 *
 * Returns null when no applicable cap exists.
 ********************************************************************/

ConfidenceEngine.prototype.resolveEffectiveConfidenceCap =
    function (
        conditions
    ) {

        if (
            !Array.isArray(
                conditions
            ) ||

            conditions.length ===
                0
        ) {

            return null;

        }


        const validCaps =

            conditions
                .map(

                    condition =>
                        condition?.capScore

                )
                .filter(

                    capScore =>

                        ConfidenceEngineUtils
                            .isFiniteNumber(
                                capScore
                            ) &&

                        capScore >= 0 &&

                        capScore <= 100

                );


        if (
            validCaps.length ===
                0
        ) {

            return null;

        }


        return Math.min(
            ...validCaps
        );

    };


/********************************************************************
 * 5.4.9 EVALUATE CONFIDENCE CAP
 *
 * Consumes:
 *
 * - Section 5.3 raw weighted confidence,
 * - existing dimension assessments.
 *
 * Rules:
 *
 * 1. If raw score is not calculable:
 *      cap evaluation is NOT_CALCULABLE.
 *
 * 2. If no critical condition:
 *      candidateScore = rawScore.
 *
 * 3. If critical conditions exist:
 *
 *      candidateScore =
 *          min(
 *              rawScore,
 *              effectiveCap
 *          )
 *
 * 4. capApplied is true ONLY when the cap actually lowers rawScore.
 *
 * 5. rawScore remains unchanged.
 ********************************************************************/

ConfidenceEngine.prototype.evaluateConfidenceCap =
    function (
        confidence
    ) {

        const result =

            this.createConfidenceCapResult();


        const rawResult =

            this
                .calculateRawWeightedConfidence(
                    confidence
                );


        /*
         * Raw confidence must exist before a cap can be evaluated.
         */

        if (
            rawResult.calculable !==
                true ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    rawResult.rawScore
                )
        ) {

            result.reasonCodes.push(

                ConfidenceCapReasonCodes
                    .NOT_CALCULABLE

            );


            result.reasons.push(

                "Confidence caps cannot be evaluated because raw confidence is not calculable."

            );


            return result;

        }


        result.calculable =
            true;


        result.rawScore =

            rawResult.rawScore;


        /*
         * Detect critical evidence conditions.
         */

        const conditions =

            this
                .detectCriticalConfidenceConditions(
                    confidence
                );


        result.triggeredConditions =

            conditions.map(

                condition => ({

                    ...condition

                })

            );


        result.applicableCaps =

            conditions.map(

                condition => ({

                    type:
                        condition.type,

                    dimension:
                        condition.dimension,

                    capScore:
                        condition.capScore

                })

            );


        /*
         * No critical condition.
         */

        if (
            conditions.length ===
                0
        ) {

            result.status =

                ConfidenceCapEvaluationStatus
                    .UNRESTRICTED;


            result.candidateScore =

                rawResult.rawScore;


            result.reasonCodes.push(

                ConfidenceCapReasonCodes
                    .NO_CRITICAL_CONDITION

            );


            result.reasons.push(

                "No critical core evidence condition requires a confidence ceiling."

            );


            return result;

        }


        /*
         * Record condition-specific reason codes.
         */

        if (
            conditions.some(

                condition =>

                    condition.type ===
                        ConfidenceCriticalConditionType
                            .CORE_DIMENSION_LOW

            )
        ) {

            result.reasonCodes.push(

                ConfidenceCapReasonCodes
                    .CORE_LOW

            );

        }


        if (
            conditions.some(

                condition =>

                    condition.type ===
                        ConfidenceCriticalConditionType
                            .CORE_DIMENSION_ZERO

            )
        ) {

            result.reasonCodes.push(

                ConfidenceCapReasonCodes
                    .CORE_ZERO

            );

        }


        if (
            conditions.length >
                1
        ) {

            result.reasonCodes.push(

                ConfidenceCapReasonCodes
                    .MULTIPLE_CONDITIONS

            );

        }


        const effectiveCap =

            this
                .resolveEffectiveConfidenceCap(
                    conditions
                );


        /*
         * Defensive fallback.
         */

        if (
            !ConfidenceEngineUtils
                .isFiniteNumber(
                    effectiveCap
                )
        ) {

            result.status =

                ConfidenceCapEvaluationStatus
                    .NOT_CALCULABLE;


            result.calculable =
                false;


            result.rawScore =
                rawResult.rawScore;


            result.candidateScore =
                null;


            result.warnings.push(

                "Critical confidence conditions were detected but no valid confidence cap could be resolved."

            );


            return result;

        }


        result.effectiveCap =

            effectiveCap;


        /*
         * A cap is a ceiling, never a floor.
         */

        result.candidateScore =

            Math.min(

                rawResult.rawScore,
                effectiveCap

            );


        /*
         * Cap actually lowers the raw score.
         */

        if (
            result.candidateScore <
                rawResult.rawScore
        ) {

            result.status =

                ConfidenceCapEvaluationStatus
                    .CAPPED;


            result.capApplied =
                true;


            result.reasonCodes.push(

                ConfidenceCapReasonCodes
                    .CAP_APPLIED

            );


            /*
             * Preserve a deterministic primary cap reason.
             *
             * Select a condition matching the most restrictive cap.
             */

            const controllingCondition =

                conditions.find(

                    condition =>

                        condition.capScore ===
                            effectiveCap

                );


            result.capReason =

                controllingCondition

                    ? (
                        controllingCondition.type +
                        ":" +
                        controllingCondition.dimension
                    )

                    : "CRITICAL_CONFIDENCE_CONDITION";


            result.reasons.push(

                (
                    "Raw confidence of " +
                    rawResult.rawScore +
                    " was constrained to " +
                    result.candidateScore +
                    " because a critical core evidence condition imposed a maximum confidence ceiling."
                )

            );


            return result;

        }


        /*
         * Critical condition exists, but raw score is already below
         * or equal to the ceiling.
         *
         * The cap is applicable but not mathematically binding.
         */

        result.status =

            ConfidenceCapEvaluationStatus
                .CONDITION_PRESENT_NOT_BINDING;


        result.capApplied =
            false;


        result.reasonCodes.push(

            ConfidenceCapReasonCodes
                .CAP_NOT_BINDING

        );


        result.reasons.push(

            "A critical core evidence condition exists, but the raw confidence score is already at or below the applicable confidence ceiling."

        );


        return result;

    };


/********************************************************************
 * 5.4.10 RECORD-LEVEL CAP EVALUATION
 *
 * Convenience API.
 *
 * Does NOT persist candidateScore into confidence.score.
 ********************************************************************/

ConfidenceEngine.prototype.evaluateRecordConfidenceCap =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord.confidence
                )
        ) {

            return this
                .createConfidenceCapResult();

        }


        return this
            .evaluateConfidenceCap(

                confidenceRecord
                    .confidence

            );

    };


/********************************************************************
 * 5.4.11 CAP DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.confidenceCapDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            calculableRecords:
                0,

            nonCalculableRecords:
                0,

            unrestricted:
                0,

            capped:
                0,

            conditionPresentNotBinding:
                0,

            coreLowConditions:
                0,

            coreZeroConditions:
                0

        };


        records.forEach(

            record => {

                const result =

                    this
                        .evaluateRecordConfidenceCap(
                            record
                        );


                if (
                    result.calculable ===
                        true
                ) {

                    diagnostics
                        .calculableRecords++;

                } else {

                    diagnostics
                        .nonCalculableRecords++;

                }


                switch (
                    result.status
                ) {

                    case ConfidenceCapEvaluationStatus
                        .UNRESTRICTED:

                        diagnostics
                            .unrestricted++;

                        break;


                    case ConfidenceCapEvaluationStatus
                        .CAPPED:

                        diagnostics
                            .capped++;

                        break;


                    case ConfidenceCapEvaluationStatus
                        .CONDITION_PRESENT_NOT_BINDING:

                        diagnostics
                            .conditionPresentNotBinding++;

                        break;

                }


                result.triggeredConditions
                    .forEach(

                        condition => {

                            if (
                                condition.type ===
                                    ConfidenceCriticalConditionType
                                        .CORE_DIMENSION_LOW
                            ) {

                                diagnostics
                                    .coreLowConditions++;

                            }


                            if (
                                condition.type ===
                                    ConfidenceCriticalConditionType
                                        .CORE_DIMENSION_ZERO
                            ) {

                                diagnostics
                                    .coreZeroConditions++;

                            }

                        }

                    );

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 5.4.12 SAFE EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window
        .ConfidenceCapPolicy =

            ConfidenceCapPolicy;


    window
        .ConfidenceCriticalConditionType =

            ConfidenceCriticalConditionType;


    window
        .ConfidenceCapEvaluationStatus =

            ConfidenceCapEvaluationStatus;


    window
        .ConfidenceCapReasonCodes =

            ConfidenceCapReasonCodes;

}


/********************************************************************
 * END SECTION 5.4
 ********************************************************************/
/********************************************************************
 * 5.5 FINAL CONFIDENCE DETERMINATION
 *
 * PURPOSE:
 *
 * Convert the validated aggregation and cap-evaluation outputs from
 * Sections 5.1–5.4 into the authoritative overall confidence result.
 *
 * This is the first Section 5 stage permitted to persist:
 *
 * confidence.score
 * confidence.band
 * confidence.capped
 * confidence.capReason
 *
 * PRINCIPLES:
 *
 * - Final score comes from Section 5.4 candidateScore.
 * - Final band uses the existing frozen classifier.
 * - UNKNOWN is never converted to zero.
 * - A cap is recorded only when it actually lowered raw confidence.
 * - Reasons and warnings are merged without duplication.
 * - Repeated finalization is semantically idempotent.
 * - Dimension assessments and FIPE-4 evidence remain untouched.
 ********************************************************************/


/********************************************************************
 * 5.5.1 FINALIZATION STATUS
 ********************************************************************/

const ConfidenceFinalizationStatus =
    Object.freeze({

        FINALIZED:
            "FINALIZED",

        FINALIZED_CAPPED:
            "FINALIZED_CAPPED",

        UNKNOWN:
            "UNKNOWN",

        INVALID:
            "INVALID"

    });


/********************************************************************
 * 5.5.2 FINALIZATION REASON CODES
 ********************************************************************/

const ConfidenceFinalizationReasonCodes =
    Object.freeze({

        FINALIZED:
            "CONFIDENCE_FINALIZED",

        FINALIZED_CAPPED:
            "CONFIDENCE_FINALIZED_CAPPED",

        UNKNOWN_INSUFFICIENT:
            "CONFIDENCE_FINAL_UNKNOWN_INSUFFICIENT",

        UNKNOWN_INVALID:
            "CONFIDENCE_FINAL_UNKNOWN_INVALID",

        INVALID_TARGET:
            "CONFIDENCE_FINAL_INVALID_TARGET"

    });


/********************************************************************
 * 5.5.3 CREATE FINALIZATION RESULT
 *
 * This result is an audit object describing what Section 5.5 did.
 *
 * It is separate from confidence itself.
 ********************************************************************/

ConfidenceEngine.prototype.createConfidenceFinalizationResult =
    function () {

        return {

            finalized:
                false,

            status:
                ConfidenceFinalizationStatus
                    .UNKNOWN,

            score:
                null,

            band:
                ConfidenceBand.UNKNOWN,

            rawScore:
                null,

            candidateScore:
                null,

            capped:
                false,

            capReason:
                null,

            reasonCodes:
                [],

            reasons:
                [],

            warnings:
                [],

            finalizedAt:
                ConfidenceEngineUtils.now()

        };

    };


/********************************************************************
 * 5.5.4 UNIQUE ARRAY MERGE
 *
 * Deterministically appends values while preventing duplication.
 *
 * Used for:
 *
 * confidence.reasonCodes
 * confidence.reasons
 * confidence.warnings
 *
 * Existing order is preserved.
 ********************************************************************/

ConfidenceEngine.prototype.mergeUniqueConfidenceValues =
    function (
        target,
        values
    ) {

        const output =

            Array.isArray(
                target
            )

                ? target

                : [];


        if (
            !Array.isArray(
                values
            )
        ) {

            return output;

        }


        values.forEach(

            value => {

                if (
                    typeof value !==
                        "string" ||

                    value.length ===
                        0
                ) {

                    return;

                }


                if (
                    !output.includes(
                        value
                    )
                ) {

                    output.push(
                        value
                    );

                }

            }

        );


        return output;

    };


/********************************************************************
 * 5.5.5 RESET AUTHORITATIVE OVERALL CONFIDENCE
 *
 * Resets ONLY the overall conclusion fields.
 *
 * Does NOT touch:
 *
 * dimensions
 * evidence
 * record identity
 *
 * This guarantees that a new deterministic finalization cannot
 * inherit a stale previous overall score.
 ********************************************************************/

ConfidenceEngine.prototype.resetFinalConfidenceState =
    function (
        confidence
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                )
        ) {

            return false;

        }


        confidence.score =
            null;


        confidence.band =
            ConfidenceBand.UNKNOWN;


        confidence.capped =
            false;


        confidence.capReason =
            null;


        return true;

    };


/********************************************************************
 * 5.5.6 FINALIZE CONFIDENCE
 *
 * Authoritative finalization API.
 *
 * Pipeline:
 *
 * 1. Validate target.
 * 2. Evaluate Section 5.4 cap result.
 * 3. Reset stale overall conclusion state.
 * 4. If non-calculable:
 *      persist UNKNOWN semantics.
 * 5. If calculable:
 *      candidateScore becomes final score.
 * 6. Classify using existing classifier.
 * 7. Persist actual cap state.
 * 8. Merge explainability without duplication.
 *
 * IMPORTANT:
 *
 * Section 5.4 already consumes Section 5.3.
 * We do not independently reproduce aggregation arithmetic here.
 ********************************************************************/

ConfidenceEngine.prototype.finalizeConfidence =
    function (
        confidence
    ) {

        const result =

            this
                .createConfidenceFinalizationResult();


        /*
         * Validate mutable confidence target.
         */

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidence.dimensions
                )
        ) {

            result.status =

                ConfidenceFinalizationStatus
                    .INVALID;


            result.reasonCodes.push(

                ConfidenceFinalizationReasonCodes
                    .INVALID_TARGET

            );


            result.reasons.push(

                "Final confidence could not be persisted because the confidence target is invalid."

            );


            return result;

        }


        /*
         * Evaluate the complete pre-finalization pipeline.
         */

        const capResult =

            this
                .evaluateConfidenceCap(
                    confidence
                );


        /*
         * Reset only authoritative overall fields.
         *
         * Existing explanation arrays are preserved and merged
         * idempotently below.
         */

        this
            .resetFinalConfidenceState(
                confidence
            );


        /*
         * Preserve upstream explanations.
         */

        confidence.reasonCodes =

            this
                .mergeUniqueConfidenceValues(

                    confidence.reasonCodes,

                    capResult.reasonCodes

                );


        confidence.reasons =

            this
                .mergeUniqueConfidenceValues(

                    confidence.reasons,

                    capResult.reasons

                );


        confidence.warnings =

            this
                .mergeUniqueConfidenceValues(

                    confidence.warnings,

                    capResult.warnings

                );


        /*
         * NON-CALCULABLE
         *
         * Preserve UNKNOWN semantics.
         */

        if (
            capResult.calculable !==
                true ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    capResult.candidateScore
                )
        ) {

            const sufficiency =

                this
                    .evaluateEvidenceSufficiency(
                        confidence
                    );


            confidence.score =
                null;


            confidence.band =
                ConfidenceBand.UNKNOWN;


            confidence.capped =
                false;


            confidence.capReason =
                null;


            result.finalized =
                true;


            result.score =
                null;


            result.band =
                ConfidenceBand.UNKNOWN;


            result.rawScore =

                capResult.rawScore;


            result.candidateScore =
                null;


            result.capped =
                false;


            result.capReason =
                null;


            /*
             * Distinguish invalid evidence from insufficient evidence.
             */

            if (
                sufficiency.status ===
                    ConfidenceEvidenceSufficiencyStatus
                        .INVALID
            ) {

                result.status =

                    ConfidenceFinalizationStatus
                        .INVALID;


                result.reasonCodes.push(

                    ConfidenceFinalizationReasonCodes
                        .UNKNOWN_INVALID

                );


                result.reasons.push(

                    "Final confidence remains UNKNOWN because the confidence evidence is structurally invalid."

                );

            } else {

                result.status =

                    ConfidenceFinalizationStatus
                        .UNKNOWN;


                result.reasonCodes.push(

                    ConfidenceFinalizationReasonCodes
                        .UNKNOWN_INSUFFICIENT

                );


                result.reasons.push(

                    "Final confidence remains UNKNOWN because sufficient defensible evidence is unavailable."

                );

            }


            confidence.reasonCodes =

                this
                    .mergeUniqueConfidenceValues(

                        confidence.reasonCodes,

                        result.reasonCodes

                    );


            confidence.reasons =

                this
                    .mergeUniqueConfidenceValues(

                        confidence.reasons,

                        result.reasons

                    );


            result.reasonCodes =

                [
                    ...confidence.reasonCodes
                ];


            result.reasons =

                [
                    ...confidence.reasons
                ];


            result.warnings =

                [
                    ...confidence.warnings
                ];


            return result;

        }


        /*
         * CALCULABLE FINAL SCORE
         */

        const finalScore =

            capResult
                .candidateScore;


        const finalBand =

            this
                .classifyConfidenceScore(
                    finalScore
                );


        /*
         * Defensive classifier guard.
         */

        if (
            finalBand !==
                ConfidenceBand.HIGH &&

            finalBand !==
                ConfidenceBand.MEDIUM &&

            finalBand !==
                ConfidenceBand.LOW
        ) {

            confidence.score =
                null;


            confidence.band =
                ConfidenceBand.UNKNOWN;


            confidence.capped =
                false;


            confidence.capReason =
                null;


            result.finalized =
                true;


            result.status =

                ConfidenceFinalizationStatus
                    .INVALID;


            result.reasonCodes.push(

                ConfidenceFinalizationReasonCodes
                    .UNKNOWN_INVALID

            );


            result.reasons.push(

                "Final confidence remains UNKNOWN because the calculated score could not be classified defensibly."

            );


            confidence.reasonCodes =

                this
                    .mergeUniqueConfidenceValues(

                        confidence.reasonCodes,

                        result.reasonCodes

                    );


            confidence.reasons =

                this
                    .mergeUniqueConfidenceValues(

                        confidence.reasons,

                        result.reasons

                    );


            result.reasonCodes =

                [
                    ...confidence.reasonCodes
                ];


            result.reasons =

                [
                    ...confidence.reasons
                ];


            result.warnings =

                [
                    ...confidence.warnings
                ];


            return result;

        }


        /*
         * Persist authoritative overall confidence.
         */

        confidence.score =

            finalScore;


        confidence.band =

            finalBand;


        confidence.capped =

            capResult.capApplied ===
                true;


        confidence.capReason =

            capResult.capApplied ===
                true

                ? capResult.capReason

                : null;


        /*
         * Build finalization result.
         */

        result.finalized =
            true;


        result.score =

            confidence.score;


        result.band =

            confidence.band;


        result.rawScore =

            capResult.rawScore;


        result.candidateScore =

            capResult.candidateScore;


        result.capped =

            confidence.capped;


        result.capReason =

            confidence.capReason;


        if (
            confidence.capped ===
                true
        ) {

            result.status =

                ConfidenceFinalizationStatus
                    .FINALIZED_CAPPED;


            result.reasonCodes.push(

                ConfidenceFinalizationReasonCodes
                    .FINALIZED_CAPPED

            );


            result.reasons.push(

                (
                    "Final confidence was constrained from a raw score of " +
                    capResult.rawScore +
                    " to " +
                    finalScore +
                    " because a critical evidence condition imposed a confidence ceiling."
                )

            );

        } else {

            result.status =

                ConfidenceFinalizationStatus
                    .FINALIZED;


            result.reasonCodes.push(

                ConfidenceFinalizationReasonCodes
                    .FINALIZED

            );


            result.reasons.push(

                (
                    "Final confidence was determined at " +
                    finalScore +
                    " with band " +
                    finalBand +
                    "."
                )

            );

        }


        /*
         * Persist finalization explanations without duplication.
         */

        confidence.reasonCodes =

            this
                .mergeUniqueConfidenceValues(

                    confidence.reasonCodes,

                    result.reasonCodes

                );


        confidence.reasons =

            this
                .mergeUniqueConfidenceValues(

                    confidence.reasons,

                    result.reasons

                );


        confidence.warnings =

            this
                .mergeUniqueConfidenceValues(

                    confidence.warnings,

                    result.warnings

                );


        /*
         * Return the complete persisted explanation state.
         */

        result.reasonCodes =

            [
                ...confidence.reasonCodes
            ];


        result.reasons =

            [
                ...confidence.reasons
            ];


        result.warnings =

            [
                ...confidence.warnings
            ];


        return result;

    };


/********************************************************************
 * 5.5.7 FINALIZE RECORD CONFIDENCE
 *
 * Record-level convenience API.
 *
 * This DOES mutate the record's authoritative confidence conclusion.
 ********************************************************************/

ConfidenceEngine.prototype.finalizeRecordConfidence =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord.confidence
                )
        ) {

            const result =

                this
                    .createConfidenceFinalizationResult();


            result.status =

                ConfidenceFinalizationStatus
                    .INVALID;


            result.reasonCodes.push(

                ConfidenceFinalizationReasonCodes
                    .INVALID_TARGET

            );


            result.reasons.push(

                "Record confidence could not be finalized because the confidence record is invalid."

            );


            return result;

        }


        return this
            .finalizeConfidence(

                confidenceRecord
                    .confidence

            );

    };


/********************************************************************
 * 5.5.8 FINALIZE ALL RECORD CONFIDENCE
 *
 * Finalizes every valid confidence record currently held by the
 * engine.
 *
 * Returns one audit result per record.
 ********************************************************************/

ConfidenceEngine.prototype.finalizeAllRecordConfidence =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        return records.map(

            (
                record,
                index
            ) => {

                const finalization =

                    this
                        .finalizeRecordConfidence(
                            record
                        );


                return {

                    recordIndex:

                        ConfidenceEngineUtils
                            .isFiniteNumber(
                                record?.recordIndex
                            )

                            ? record.recordIndex

                            : index,

                    canonicalConcept:

                        typeof record
                            ?.canonicalConcept ===
                            "string"

                            ? record.canonicalConcept

                            : "",

                    finalization:
                        finalization

                };

            }

        );

    };


/********************************************************************
 * 5.5.9 FINAL CONFIDENCE DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.finalConfidenceDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            finalizedRecords:
                0,

            high:
                0,

            medium:
                0,

            low:
                0,

            unknown:
                0,

            capped:
                0,

            uncapped:
                0,

            invalid:
                0,

            averageFinalScore:
                null

        };


        const scores =
            [];


        records.forEach(

            record => {

                const confidence =

                    record
                        ?.confidence;


                if (
                    !ConfidenceEngineUtils
                        .isObject(
                            confidence
                        )
                ) {

                    diagnostics
                        .invalid++;


                    return;

                }


                if (
                    ConfidenceEngineUtils
                        .isFiniteNumber(
                            confidence.score
                        )
                ) {

                    diagnostics
                        .finalizedRecords++;


                    scores.push(
                        confidence.score
                    );


                    if (
                        confidence.capped ===
                            true
                    ) {

                        diagnostics
                            .capped++;

                    } else {

                        diagnostics
                            .uncapped++;

                    }

                } else {

                    diagnostics
                        .unknown++;

                }


                switch (
                    confidence.band
                ) {

                    case ConfidenceBand.HIGH:

                        diagnostics.high++;

                        break;


                    case ConfidenceBand.MEDIUM:

                        diagnostics.medium++;

                        break;


                    case ConfidenceBand.LOW:

                        diagnostics.low++;

                        break;

                }

            }

        );


        if (
            scores.length > 0
        ) {

            const average =

                scores.reduce(

                    (
                        total,
                        score
                    ) =>

                        total + score,

                    0

                ) /
                scores.length;


            diagnostics.averageFinalScore =

                this
                    .roundRawConfidenceScore(
                        average
                    );

        }


        return diagnostics;

    };


/********************************************************************
 * 5.5.10 SAFE EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window
        .ConfidenceFinalizationStatus =

            ConfidenceFinalizationStatus;


    window
        .ConfidenceFinalizationReasonCodes =

            ConfidenceFinalizationReasonCodes;

}


/********************************************************************
 * END SECTION 5.5
 ********************************************************************/
/********************************************************************
 * 5.6 EXPLAINABILITY & DECISION-GRADE DIAGNOSTICS
 *
 * PURPOSE:
 *
 * Convert the authoritative confidence result produced by Section
 * 5.5 into deterministic, machine-readable and human-readable
 * explanations suitable for downstream EPI components.
 *
 * Section 5.6 explains confidence.
 * It does NOT determine confidence.
 *
 * STRICT NON-MUTATION RULE:
 *
 * This section must not alter:
 *
 * confidence.score
 * confidence.band
 * confidence.capped
 * confidence.capReason
 * confidence.dimensions
 * FIPE-4 evidence
 ********************************************************************/


/********************************************************************
 * 5.6.1 DECISION-USE CLASSIFICATION
 *
 * These are usability descriptors.
 *
 * They are NOT confidence bands and must never replace:
 *
 * HIGH
 * MEDIUM
 * LOW
 * UNKNOWN
 ********************************************************************/

const ConfidenceDecisionUse =
    Object.freeze({

        RELIABLE:
            "RELIABLE",

        USE_WITH_CAUTION:
            "USE_WITH_CAUTION",

        MATERIAL_LIMITATIONS:
            "MATERIAL_LIMITATIONS",

        INSUFFICIENT_EVIDENCE:
            "INSUFFICIENT_EVIDENCE",

        INVALID_EVIDENCE:
            "INVALID_EVIDENCE"

    });


/********************************************************************
 * 5.6.2 EXPLANATION STATUS
 ********************************************************************/

const ConfidenceExplanationStatus =
    Object.freeze({

        EXPLAINED:
            "EXPLAINED",

        UNKNOWN:
            "UNKNOWN",

        INVALID:
            "INVALID"

    });


/********************************************************************
 * 5.6.3 EXPLANATION REASON CODES
 ********************************************************************/

const ConfidenceExplanationReasonCodes =
    Object.freeze({

        HIGH_CONFIDENCE:
            "CONFIDENCE_EXPLANATION_HIGH",

        MEDIUM_CONFIDENCE:
            "CONFIDENCE_EXPLANATION_MEDIUM",

        LOW_CONFIDENCE:
            "CONFIDENCE_EXPLANATION_LOW",

        CAPPED_CONFIDENCE:
            "CONFIDENCE_EXPLANATION_CAPPED",

        INSUFFICIENT_EVIDENCE:
            "CONFIDENCE_EXPLANATION_INSUFFICIENT_EVIDENCE",

        INVALID_EVIDENCE:
            "CONFIDENCE_EXPLANATION_INVALID_EVIDENCE",

        INVALID_TARGET:
            "CONFIDENCE_EXPLANATION_INVALID_TARGET"

    });


/********************************************************************
 * 5.6.4 CREATE DIMENSION EXPLANATION
 ********************************************************************/

ConfidenceEngine.prototype.createConfidenceDimensionExplanation =
    function (
        dimensionName,
        assessment
    ) {

        const safeAssessment =

            ConfidenceEngineUtils
                .isObject(
                    assessment
                )

                ? assessment

                : {};


        return {

            dimension:
                dimensionName,

            assessable:

                safeAssessment.assessable ===
                    true,

            score:

                ConfidenceEngineUtils
                    .isFiniteNumber(
                        safeAssessment.score
                    )

                    ? safeAssessment.score

                    : null,

            band:

                typeof safeAssessment.band ===
                    "string"

                    ? safeAssessment.band

                    : ConfidenceBand.UNKNOWN,

            reasonCodes:

                Array.isArray(
                    safeAssessment.reasonCodes
                )

                    ? [
                        ...safeAssessment.reasonCodes
                    ]

                    : [],

            reasons:

                Array.isArray(
                    safeAssessment.reasons
                )

                    ? [
                        ...safeAssessment.reasons
                    ]

                    : [],

            warnings:

                Array.isArray(
                    safeAssessment.warnings
                )

                    ? [
                        ...safeAssessment.warnings
                    ]

                    : []

        };

    };


/********************************************************************
 * 5.6.5 CREATE CONFIDENCE EXPLANATION RESULT
 ********************************************************************/

ConfidenceEngine.prototype.createConfidenceExplanationResult =
    function () {

        return {

            explained:
                false,

            status:
                ConfidenceExplanationStatus
                    .UNKNOWN,

            decisionUse:
                ConfidenceDecisionUse
                    .INSUFFICIENT_EVIDENCE,

            summary:
                "",

            overall: {

                score:
                    null,

                band:
                    ConfidenceBand.UNKNOWN,

                rawScore:
                    null,

                candidateScore:
                    null,

                capped:
                    false,

                capReason:
                    null

            },

            dimensions:
                [],

            strengths:
                [],

            weaknesses:
                [],

            limitations:
                [],

            reasonCodes:
                [],

            reasons:
                [],

            warnings:
                [],

            explainedAt:
                ConfidenceEngineUtils.now()

        };

    };


/********************************************************************
 * 5.6.6 CLASSIFY DECISION USE
 *
 * This function interprets the already-finalized confidence state.
 *
 * It does NOT calculate or alter confidence.
 ********************************************************************/

ConfidenceEngine.prototype.classifyConfidenceDecisionUse =
    function (
        confidence
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                )
        ) {

            return ConfidenceDecisionUse
                .INVALID_EVIDENCE;

        }


        if (
            confidence.band ===
                ConfidenceBand.HIGH &&

            ConfidenceEngineUtils
                .isFiniteNumber(
                    confidence.score
                )
        ) {

            return ConfidenceDecisionUse
                .RELIABLE;

        }


        if (
            confidence.band ===
                ConfidenceBand.MEDIUM &&

            ConfidenceEngineUtils
                .isFiniteNumber(
                    confidence.score
                )
        ) {

            return ConfidenceDecisionUse
                .USE_WITH_CAUTION;

        }


        if (
            confidence.band ===
                ConfidenceBand.LOW &&

            ConfidenceEngineUtils
                .isFiniteNumber(
                    confidence.score
                )
        ) {

            return ConfidenceDecisionUse
                .MATERIAL_LIMITATIONS;

        }


        /*
         * UNKNOWN requires distinction between:
         *
         * - structurally invalid evidence
         * - insufficient evidence
         */

        const sufficiency =

            this
                .evaluateEvidenceSufficiency(
                    confidence
                );


        if (
            sufficiency.status ===
                ConfidenceEvidenceSufficiencyStatus
                    .INVALID
        ) {

            return ConfidenceDecisionUse
                .INVALID_EVIDENCE;

        }


        return ConfidenceDecisionUse
            .INSUFFICIENT_EVIDENCE;

    };


/********************************************************************
 * 5.6.7 BUILD DIMENSION EXPLANATIONS
 ********************************************************************/

ConfidenceEngine.prototype.buildConfidenceDimensionExplanations =
    function (
        confidence
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidence.dimensions
                )
        ) {

            return [];

        }


        return Object.keys(
            confidence.dimensions
        )
        .map(

            dimensionName =>

                this
                    .createConfidenceDimensionExplanation(

                        dimensionName,

                        confidence
                            .dimensions[
                                dimensionName
                            ]

                    )

        );

    };


/********************************************************************
 * 5.6.8 IDENTIFY CONFIDENCE STRENGTHS
 *
 * HIGH assessed dimensions are surfaced as strengths.
 ********************************************************************/

ConfidenceEngine.prototype.identifyConfidenceStrengths =
    function (
        dimensionExplanations
    ) {

        if (
            !Array.isArray(
                dimensionExplanations
            )
        ) {

            return [];

        }


        return dimensionExplanations
            .filter(

                dimension =>

                    dimension.assessable ===
                        true &&

                    dimension.band ===
                        ConfidenceBand.HIGH

            )
            .map(

                dimension => ({

                    dimension:
                        dimension.dimension,

                    score:
                        dimension.score,

                    band:
                        dimension.band

                })

            );

    };


/********************************************************************
 * 5.6.9 IDENTIFY CONFIDENCE WEAKNESSES
 *
 * LOW assessed dimensions are surfaced as weaknesses.
 ********************************************************************/

ConfidenceEngine.prototype.identifyConfidenceWeaknesses =
    function (
        dimensionExplanations
    ) {

        if (
            !Array.isArray(
                dimensionExplanations
            )
        ) {

            return [];

        }


        return dimensionExplanations
            .filter(

                dimension =>

                    dimension.assessable ===
                        true &&

                    dimension.band ===
                        ConfidenceBand.LOW

            )
            .map(

                dimension => ({

                    dimension:
                        dimension.dimension,

                    score:
                        dimension.score,

                    band:
                        dimension.band

                })

            );

    };


/********************************************************************
 * 5.6.10 BUILD CONFIDENCE LIMITATIONS
 *
 * Limitations include:
 *
 * - UNKNOWN dimensions
 * - actual binding cap
 *
 * These are explanatory only.
 ********************************************************************/

ConfidenceEngine.prototype.buildConfidenceLimitations =
    function (
        confidence,
        dimensionExplanations
    ) {

        const limitations =
            [];


        if (
            Array.isArray(
                dimensionExplanations
            )
        ) {

            dimensionExplanations
                .forEach(

                    dimension => {

                        if (
                            dimension.assessable !==
                                true ||

                            dimension.band ===
                                ConfidenceBand.UNKNOWN
                        ) {

                            limitations.push({

                                type:
                                    "UNASSESSED_DIMENSION",

                                dimension:
                                    dimension.dimension,

                                message:

                                    (
                                        "Confidence dimension '" +
                                        dimension.dimension +
                                        "' is not defensibly assessable."
                                    )

                            });

                        }

                    }

                );

        }


        if (
            confidence?.capped ===
                true
        ) {

            limitations.push({

                type:
                    "CONFIDENCE_CAP",

                dimension:
                    null,

                message:

                    (
                        "Final confidence was constrained by the critical condition '" +
                        (
                            confidence.capReason ||
                            "UNSPECIFIED"
                        ) +
                        "'."
                    )

            });

        }


        return limitations;

    };


/********************************************************************
 * 5.6.11 BUILD OVERALL CONFIDENCE SUMMARY
 ********************************************************************/

ConfidenceEngine.prototype.buildConfidenceSummary =
    function (
        confidence,
        decisionUse
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                )
        ) {

            return "Confidence could not be explained because the confidence state is invalid.";

        }


        if (
            confidence.band ===
                ConfidenceBand.UNKNOWN ||

            !ConfidenceEngineUtils
                .isFiniteNumber(
                    confidence.score
                )
        ) {

            if (
                decisionUse ===
                    ConfidenceDecisionUse
                        .INVALID_EVIDENCE
            ) {

                return "Overall confidence is UNKNOWN because the available evidence is structurally invalid.";

            }


            return "Overall confidence is UNKNOWN because sufficient defensible evidence is unavailable.";

        }


        let summary =

            (
                "Overall confidence is " +
                confidence.band +
                " with a score of " +
                confidence.score +
                "."
            );


        if (
            confidence.capped ===
                true
        ) {

            summary +=

                (
                    " The final confidence score was constrained by " +
                    confidence.capReason +
                    "."
                );

        }


        return summary;

    };


/********************************************************************
 * 5.6.12 EXPLAIN FINAL CONFIDENCE
 *
 * READ-ONLY WITH RESPECT TO THE CONFIDENCE MODEL.
 *
 * IMPORTANT:
 *
 * Section 5.5 must already have finalized the authoritative result.
 *
 * This method does not call finalizeConfidence().
 ********************************************************************/

ConfidenceEngine.prototype.explainConfidence =
    function (
        confidence
    ) {

        const result =

            this
                .createConfidenceExplanationResult();


        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidence
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidence.dimensions
                )
        ) {

            result.status =

                ConfidenceExplanationStatus
                    .INVALID;


            result.decisionUse =

                ConfidenceDecisionUse
                    .INVALID_EVIDENCE;


            result.reasonCodes.push(

                ConfidenceExplanationReasonCodes
                    .INVALID_TARGET

            );


            result.reasons.push(

                "Confidence explanation could not be generated because the confidence target is invalid."

            );


            result.summary =

                "Confidence could not be explained because the confidence state is invalid.";


            return result;

        }


        /*
         * Capture the authoritative final state.
         *
         * No mutation is permitted.
         */

        const dimensionExplanations =

            this
                .buildConfidenceDimensionExplanations(
                    confidence
                );


        const decisionUse =

            this
                .classifyConfidenceDecisionUse(
                    confidence
                );


        const strengths =

            this
                .identifyConfidenceStrengths(
                    dimensionExplanations
                );


        const weaknesses =

            this
                .identifyConfidenceWeaknesses(
                    dimensionExplanations
                );


        const limitations =

            this
                .buildConfidenceLimitations(

                    confidence,
                    dimensionExplanations

                );


        /*
         * Reconstruct pre-finalization trace for explanation only.
         *
         * evaluateConfidenceCap() is non-mutating.
         */

        const capResult =

            this
                .evaluateConfidenceCap(
                    confidence
                );


        result.explained =
            true;


        result.decisionUse =
            decisionUse;


        result.summary =

            this
                .buildConfidenceSummary(

                    confidence,
                    decisionUse

                );


        result.overall = {

            score:

                ConfidenceEngineUtils
                    .isFiniteNumber(
                        confidence.score
                    )

                    ? confidence.score

                    : null,

            band:

                typeof confidence.band ===
                    "string"

                    ? confidence.band

                    : ConfidenceBand.UNKNOWN,

            rawScore:

                ConfidenceEngineUtils
                    .isFiniteNumber(
                        capResult.rawScore
                    )

                    ? capResult.rawScore

                    : null,

            candidateScore:

                ConfidenceEngineUtils
                    .isFiniteNumber(
                        capResult.candidateScore
                    )

                    ? capResult.candidateScore

                    : null,

            capped:

                confidence.capped ===
                    true,

            capReason:

                confidence.capped ===
                    true

                    ? confidence.capReason

                    : null

        };


        result.dimensions =
            dimensionExplanations;


        result.strengths =
            strengths;


        result.weaknesses =
            weaknesses;


        result.limitations =
            limitations;


        /*
         * Classify explanation state.
         */

        switch (
            decisionUse
        ) {

            case ConfidenceDecisionUse
                .RELIABLE:

                result.status =

                    ConfidenceExplanationStatus
                        .EXPLAINED;


                result.reasonCodes.push(

                    ConfidenceExplanationReasonCodes
                        .HIGH_CONFIDENCE

                );


                result.reasons.push(

                    "The finalized confidence result is HIGH and is supported by the available assessed evidence."

                );

                break;


            case ConfidenceDecisionUse
                .USE_WITH_CAUTION:

                result.status =

                    ConfidenceExplanationStatus
                        .EXPLAINED;


                result.reasonCodes.push(

                    ConfidenceExplanationReasonCodes
                        .MEDIUM_CONFIDENCE

                );


                result.reasons.push(

                    "The finalized confidence result is MEDIUM and should be used with appropriate caution."

                );

                break;


            case ConfidenceDecisionUse
                .MATERIAL_LIMITATIONS:

                result.status =

                    ConfidenceExplanationStatus
                        .EXPLAINED;


                result.reasonCodes.push(

                    ConfidenceExplanationReasonCodes
                        .LOW_CONFIDENCE

                );


                result.reasons.push(

                    "The finalized confidence result is LOW and contains material evidentiary limitations."

                );

                break;


            case ConfidenceDecisionUse
                .INVALID_EVIDENCE:

                result.status =

                    ConfidenceExplanationStatus
                        .INVALID;


                result.reasonCodes.push(

                    ConfidenceExplanationReasonCodes
                        .INVALID_EVIDENCE

                );


                result.reasons.push(

                    "Confidence remains UNKNOWN because the evidence structure is invalid."

                );

                break;


            default:

                result.status =

                    ConfidenceExplanationStatus
                        .UNKNOWN;


                result.reasonCodes.push(

                    ConfidenceExplanationReasonCodes
                        .INSUFFICIENT_EVIDENCE

                );


                result.reasons.push(

                    "Confidence remains UNKNOWN because sufficient defensible evidence is unavailable."

                );

                break;

        }


        /*
         * Explicit cap explanation.
         */

        if (
            confidence.capped ===
                true
        ) {

            result.reasonCodes.push(

                ConfidenceExplanationReasonCodes
                    .CAPPED_CONFIDENCE

            );


            result.reasons.push(

                (
                    "The raw confidence score of " +
                    capResult.rawScore +
                    " was constrained to " +
                    confidence.score +
                    " by the critical condition " +
                    confidence.capReason +
                    "."
                )

            );

        }


        /*
         * Preserve final confidence warnings as explanatory output,
         * using defensive copies only.
         */

        result.warnings =

            Array.isArray(
                confidence.warnings
            )

                ? [
                    ...confidence.warnings
                ]

                : [];


        return result;

    };


/********************************************************************
 * 5.6.13 EXPLAIN RECORD CONFIDENCE
 ********************************************************************/

ConfidenceEngine.prototype.explainRecordConfidence =
    function (
        confidenceRecord
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) ||

            !ConfidenceEngineUtils
                .isObject(
                    confidenceRecord.confidence
                )
        ) {

            return this
                .explainConfidence(
                    null
                );

        }


        const explanation =

            this
                .explainConfidence(

                    confidenceRecord
                        .confidence

                );


        return {

            recordIndex:

                ConfidenceEngineUtils
                    .isFiniteNumber(
                        confidenceRecord.recordIndex
                    )

                    ? confidenceRecord.recordIndex

                    : null,

            canonicalConcept:

                typeof confidenceRecord
                    .canonicalConcept ===
                    "string"

                    ? confidenceRecord
                        .canonicalConcept

                    : "",

            explanation:
                explanation

        };

    };


/********************************************************************
 * 5.6.14 EXPLAIN ALL RECORD CONFIDENCE
 ********************************************************************/

ConfidenceEngine.prototype.explainAllRecordConfidence =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        return records.map(

            record =>

                this
                    .explainRecordConfidence(
                        record
                    )

        );

    };


/********************************************************************
 * 5.6.15 EXPLAINABILITY DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.confidenceExplainabilityDiagnostics =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        const diagnostics = {

            totalRecords:
                records.length,

            explained:
                0,

            reliable:
                0,

            useWithCaution:
                0,

            materialLimitations:
                0,

            insufficientEvidence:
                0,

            invalidEvidence:
                0,

            capped:
                0,

            recordsWithWeaknesses:
                0,

            recordsWithLimitations:
                0

        };


        records.forEach(

            record => {

                const wrapped =

                    this
                        .explainRecordConfidence(
                            record
                        );


                const explanation =

                    wrapped?.explanation ||
                    wrapped;


                if (
                    explanation.explained ===
                        true
                ) {

                    diagnostics
                        .explained++;

                }


                switch (
                    explanation.decisionUse
                ) {

                    case ConfidenceDecisionUse
                        .RELIABLE:

                        diagnostics
                            .reliable++;

                        break;


                    case ConfidenceDecisionUse
                        .USE_WITH_CAUTION:

                        diagnostics
                            .useWithCaution++;

                        break;


                    case ConfidenceDecisionUse
                        .MATERIAL_LIMITATIONS:

                        diagnostics
                            .materialLimitations++;

                        break;


                    case ConfidenceDecisionUse
                        .INVALID_EVIDENCE:

                        diagnostics
                            .invalidEvidence++;

                        break;


                    case ConfidenceDecisionUse
                        .INSUFFICIENT_EVIDENCE:

                        diagnostics
                            .insufficientEvidence++;

                        break;

                }


                if (
                    explanation.overall
                        ?.capped ===
                        true
                ) {

                    diagnostics
                        .capped++;

                }


                if (
                    explanation.weaknesses
                        ?.length >
                        0
                ) {

                    diagnostics
                        .recordsWithWeaknesses++;

                }


                if (
                    explanation.limitations
                        ?.length >
                        0
                ) {

                    diagnostics
                        .recordsWithLimitations++;

                }

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 5.6.16 SAFE EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window
        .ConfidenceDecisionUse =

            ConfidenceDecisionUse;


    window
        .ConfidenceExplanationStatus =

            ConfidenceExplanationStatus;


    window
        .ConfidenceExplanationReasonCodes =

            ConfidenceExplanationReasonCodes;

}


/********************************************************************
 * END SECTION 5.6
 ********************************************************************/
/********************************************************************
 * 5.7 RECORD-LEVEL CONFIDENCE ORCHESTRATION
 *
 * PURPOSE:
 *
 * Provide one deterministic orchestration path for processing a
 * confidence record through the already validated Confidence Engine
 * stages.
 *
 * Section 5.7 introduces NO new scoring policy.
 *
 * PIPELINE:
 *
 * 1. Validate confidence record.
 * 2. Assess dimensions when required using the existing canonical
 *    Section 4 record-assessment API.
 * 3. Inspect aggregation inputs.
 * 4. Evaluate evidence sufficiency.
 * 5. Calculate raw weighted confidence.
 * 6. Evaluate critical confidence caps.
 * 7. Finalize authoritative confidence.
 * 8. Generate decision-grade explanation.
 * 9. Return one coherent orchestration result.
 *
 * IMPORTANT:
 *
 * - Existing scoring algorithms are reused, not duplicated.
 * - UNKNOWN remains distinct from zero.
 * - FIPE-4 evidence must not be mutated.
 * - Repeated orchestration must be semantically idempotent.
 ********************************************************************/


/********************************************************************
 * 5.7.1 ORCHESTRATION STATUS
 ********************************************************************/

const ConfidenceOrchestrationStatus =
    Object.freeze({

        COMPLETE:
            "COMPLETE",

        COMPLETE_UNKNOWN:
            "COMPLETE_UNKNOWN",

        INVALID:
            "INVALID",

        ERROR:
            "ERROR"

    });


/********************************************************************
 * 5.7.2 ORCHESTRATION REASON CODES
 ********************************************************************/

const ConfidenceOrchestrationReasonCodes =
    Object.freeze({

        COMPLETE:
            "CONFIDENCE_ORCHESTRATION_COMPLETE",

        COMPLETE_UNKNOWN:
            "CONFIDENCE_ORCHESTRATION_COMPLETE_UNKNOWN",

        INVALID_RECORD:
            "CONFIDENCE_ORCHESTRATION_INVALID_RECORD",

        ASSESSMENT_FAILED:
            "CONFIDENCE_ORCHESTRATION_ASSESSMENT_FAILED",

        FINALIZATION_FAILED:
            "CONFIDENCE_ORCHESTRATION_FINALIZATION_FAILED",

        EXPLANATION_FAILED:
            "CONFIDENCE_ORCHESTRATION_EXPLANATION_FAILED",

        UNEXPECTED_ERROR:
            "CONFIDENCE_ORCHESTRATION_UNEXPECTED_ERROR"

    });


/********************************************************************
 * 5.7.3 ORCHESTRATION STAGES
 ********************************************************************/

const ConfidenceOrchestrationStage =
    Object.freeze({

        VALIDATION:
            "VALIDATION",

        DIMENSION_ASSESSMENT:
            "DIMENSION_ASSESSMENT",

        AGGREGATION_INSPECTION:
            "AGGREGATION_INSPECTION",

        EVIDENCE_SUFFICIENCY:
            "EVIDENCE_SUFFICIENCY",

        RAW_CONFIDENCE:
            "RAW_CONFIDENCE",

        CAP_EVALUATION:
            "CAP_EVALUATION",

        FINALIZATION:
            "FINALIZATION",

        EXPLANATION:
            "EXPLANATION",

        COMPLETE:
            "COMPLETE"

    });


/********************************************************************
 * 5.7.4 CREATE ORCHESTRATION RESULT
 ********************************************************************/

ConfidenceEngine.prototype.createConfidenceOrchestrationResult =
    function () {

        return {

            processed:
                false,

            status:
                ConfidenceOrchestrationStatus.INVALID,

            recordIndex:
                null,

            canonicalConcept:
                "",

            currentStage:
                ConfidenceOrchestrationStage.VALIDATION,

            stagesCompleted:
                [],

            aggregationInspection:
                null,

            evidenceSufficiency:
                null,

            rawConfidence:
                null,

            capEvaluation:
                null,

            finalization:
                null,

            explanation:
                null,

            reasonCodes:
                [],

            reasons:
                [],

            warnings:
                [],

            processedAt:
                ConfidenceEngineUtils.now()

        };

    };


/********************************************************************
 * 5.7.5 MARK ORCHESTRATION STAGE COMPLETE
 *
 * Prevents duplicate stage entries during repeated or defensive
 * orchestration.
 ********************************************************************/

ConfidenceEngine.prototype.markConfidenceOrchestrationStage =
    function (
        result,
        stage
    ) {

        if (
            !ConfidenceEngineUtils
                .isObject(
                    result
                ) ||

            typeof stage !==
                "string"
        ) {

            return false;

        }


        if (
            !Array.isArray(
                result.stagesCompleted
            )
        ) {

            result.stagesCompleted =
                [];

        }


        if (
            !result.stagesCompleted
                .includes(
                    stage
                )
        ) {

            result.stagesCompleted
                .push(
                    stage
                );

        }


        result.currentStage =
            stage;


        return true;

    };


/********************************************************************
 * 5.7.6 VALIDATE ORCHESTRATION RECORD
 ********************************************************************/

ConfidenceEngine.prototype.validateConfidenceOrchestrationRecord =
    function (
        confidenceRecord
    ) {

        return (

            ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                ) &&

            ConfidenceEngineUtils
                .isObject(
                    confidenceRecord.confidence
                ) &&

            ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                        .confidence
                        .dimensions
                )

        );

    };


/********************************************************************
 * 5.7.7 DETERMINE WHETHER DIMENSION ASSESSMENT IS REQUIRED
 *
 * A dimension assessment is considered already present when all six
 * dimension keys contain object assessments.
 *
 * This prevents orchestration from blindly repeating Section 4 work.
 *
 * IMPORTANT:
 *
 * UNKNOWN is still a valid assessment state.
 * Therefore assessable:false does NOT mean "not assessed".
 ********************************************************************/

ConfidenceEngine.prototype.requiresConfidenceDimensionAssessment =
    function (
        confidenceRecord
    ) {

        if (
            !this
                .validateConfidenceOrchestrationRecord(
                    confidenceRecord
                )
        ) {

            return true;

        }


        const dimensions =

            confidenceRecord
                .confidence
                .dimensions;


        const requiredDimensions = [

            "sourceTraceability",
            "extractionReliability",
            "normalizationCertainty",
            "completeness",
            "consistency",
            "corroboration"

        ];


        return requiredDimensions
            .some(

                dimensionName =>

                    !ConfidenceEngineUtils
                        .isObject(

                            dimensions[
                                dimensionName
                            ]

                        )

            );

    };


/********************************************************************
 * 5.7.8 ASSESS RECORD DIMENSIONS WHEN REQUIRED
 *
 * Uses the existing canonical Section 4 record-level assessment API.
 *
 * No dimension scoring logic is reproduced here.
 ********************************************************************/

ConfidenceEngine.prototype.ensureConfidenceDimensionsAssessed =
    function (
        confidenceRecord
    ) {

        if (
            !this
                .validateConfidenceOrchestrationRecord(
                    confidenceRecord
                )
        ) {

            return {

                success:
                    false,

                assessed:
                    false,

                reused:
                    false,

                reason:

                    "Confidence record is invalid."

            };

        }


        if (
            !this
                .requiresConfidenceDimensionAssessment(
                    confidenceRecord
                )
        ) {

            return {

                success:
                    true,

                assessed:
                    false,

                reused:
                    true,

                reason:

                    "Existing dimension assessments were reused."

            };

        }


        /*
         * Canonical Section 4 record assessment API.
         */

        if (
            typeof this
                .assessRecordConfidence !==
                "function"
        ) {

            return {

                success:
                    false,

                assessed:
                    false,

                reused:
                    false,

                reason:

                    "Canonical record confidence assessment API is unavailable."

            };

        }


        try {

            this
                .assessRecordConfidence(
                    confidenceRecord
                );


            return {

                success:
                    true,

                assessed:
                    true,

                reused:
                    false,

                reason:

                    "Record confidence dimensions were assessed using the canonical assessment pipeline."

            };

        } catch (
            error
        ) {

            return {

                success:
                    false,

                assessed:
                    false,

                reused:
                    false,

                reason:

                    error?.message ||
                    "Record confidence assessment failed."

            };

        }

    };


/********************************************************************
 * 5.7.9 ORCHESTRATE ONE CONFIDENCE RECORD
 *
 * This is the principal Section 5.7 API.
 *
 * It coordinates existing engine stages without reproducing their
 * logic.
 ********************************************************************/

ConfidenceEngine.prototype.orchestrateRecordConfidence =
    function (
        confidenceRecord
    ) {

        const result =

            this
                .createConfidenceOrchestrationResult();


        /*
         * Preserve convenient record identity.
         */

        if (
            ConfidenceEngineUtils
                .isObject(
                    confidenceRecord
                )
        ) {

            result.recordIndex =

                ConfidenceEngineUtils
                    .isFiniteNumber(
                        confidenceRecord.recordIndex
                    )

                    ? confidenceRecord.recordIndex

                    : null;


            result.canonicalConcept =

                typeof confidenceRecord
                    .canonicalConcept ===
                    "string"

                    ? confidenceRecord
                        .canonicalConcept

                    : "";

        }


        /**********************************************************
         * STAGE 1 — VALIDATION
         **********************************************************/

        result.currentStage =

            ConfidenceOrchestrationStage
                .VALIDATION;


        if (
            !this
                .validateConfidenceOrchestrationRecord(
                    confidenceRecord
                )
        ) {

            result.status =

                ConfidenceOrchestrationStatus
                    .INVALID;


            result.reasonCodes.push(

                ConfidenceOrchestrationReasonCodes
                    .INVALID_RECORD

            );


            result.reasons.push(

                "Confidence orchestration could not begin because the confidence record is invalid."

            );


            return result;

        }


        this
            .markConfidenceOrchestrationStage(

                result,

                ConfidenceOrchestrationStage
                    .VALIDATION

            );


        try {

            /**********************************************************
             * STAGE 2 — DIMENSION ASSESSMENT
             **********************************************************/

            result.currentStage =

                ConfidenceOrchestrationStage
                    .DIMENSION_ASSESSMENT;


            const assessmentResult =

                this
                    .ensureConfidenceDimensionsAssessed(
                        confidenceRecord
                    );


            if (
                assessmentResult.success !==
                    true
            ) {

                result.status =

                    ConfidenceOrchestrationStatus
                        .ERROR;


                result.reasonCodes.push(

                    ConfidenceOrchestrationReasonCodes
                        .ASSESSMENT_FAILED

                );


                result.reasons.push(

                    assessmentResult.reason

                );


                return result;

            }


            this
                .markConfidenceOrchestrationStage(

                    result,

                    ConfidenceOrchestrationStage
                        .DIMENSION_ASSESSMENT

                );


            /**********************************************************
             * STAGE 3 — AGGREGATION INSPECTION
             **********************************************************/

            result.currentStage =

                ConfidenceOrchestrationStage
                    .AGGREGATION_INSPECTION;


            result.aggregationInspection =

                this
                    .inspectConfidenceAggregationInputs(

                        confidenceRecord
                            .confidence

                    );


            this
                .markConfidenceOrchestrationStage(

                    result,

                    ConfidenceOrchestrationStage
                        .AGGREGATION_INSPECTION

                );


            /**********************************************************
             * STAGE 4 — EVIDENCE SUFFICIENCY
             **********************************************************/

            result.currentStage =

                ConfidenceOrchestrationStage
                    .EVIDENCE_SUFFICIENCY;


            result.evidenceSufficiency =

                this
                    .evaluateEvidenceSufficiency(

                        confidenceRecord
                            .confidence

                    );


            this
                .markConfidenceOrchestrationStage(

                    result,

                    ConfidenceOrchestrationStage
                        .EVIDENCE_SUFFICIENCY

                );


            /**********************************************************
             * STAGE 5 — RAW WEIGHTED CONFIDENCE
             **********************************************************/

            result.currentStage =

                ConfidenceOrchestrationStage
                    .RAW_CONFIDENCE;


            result.rawConfidence =

                this
                    .calculateRawWeightedConfidence(

                        confidenceRecord
                            .confidence

                    );


            this
                .markConfidenceOrchestrationStage(

                    result,

                    ConfidenceOrchestrationStage
                        .RAW_CONFIDENCE

                );


            /**********************************************************
             * STAGE 6 — CAP EVALUATION
             **********************************************************/

            result.currentStage =

                ConfidenceOrchestrationStage
                    .CAP_EVALUATION;


            result.capEvaluation =

                this
                    .evaluateConfidenceCap(

                        confidenceRecord
                            .confidence

                    );


            this
                .markConfidenceOrchestrationStage(

                    result,

                    ConfidenceOrchestrationStage
                        .CAP_EVALUATION

                );


            /**********************************************************
             * STAGE 7 — AUTHORITATIVE FINALIZATION
             **********************************************************/

            result.currentStage =

                ConfidenceOrchestrationStage
                    .FINALIZATION;


            result.finalization =

                this
                    .finalizeRecordConfidence(
                        confidenceRecord
                    );


            if (
                !ConfidenceEngineUtils
                    .isObject(
                        result.finalization
                    ) ||

                result.finalization.finalized !==
                    true
            ) {

                result.status =

                    ConfidenceOrchestrationStatus
                        .ERROR;


                result.reasonCodes.push(

                    ConfidenceOrchestrationReasonCodes
                        .FINALIZATION_FAILED

                );


                result.reasons.push(

                    "Confidence orchestration could not produce an authoritative final confidence result."

                );


                return result;

            }


            this
                .markConfidenceOrchestrationStage(

                    result,

                    ConfidenceOrchestrationStage
                        .FINALIZATION

                );


            /**********************************************************
             * STAGE 8 — EXPLANATION
             **********************************************************/

            result.currentStage =

                ConfidenceOrchestrationStage
                    .EXPLANATION;


            const wrappedExplanation =

                this
                    .explainRecordConfidence(
                        confidenceRecord
                    );


            result.explanation =

                wrappedExplanation
                    ?.explanation ||

                wrappedExplanation;


            if (
                !ConfidenceEngineUtils
                    .isObject(
                        result.explanation
                    ) ||

                result.explanation.explained !==
                    true
            ) {

                result.status =

                    ConfidenceOrchestrationStatus
                        .ERROR;


                result.reasonCodes.push(

                    ConfidenceOrchestrationReasonCodes
                        .EXPLANATION_FAILED

                );


                result.reasons.push(

                    "Confidence orchestration completed finalization but could not generate a valid confidence explanation."

                );


                return result;

            }


            this
                .markConfidenceOrchestrationStage(

                    result,

                    ConfidenceOrchestrationStage
                        .EXPLANATION

                );


            /**********************************************************
             * STAGE 9 — COMPLETE
             **********************************************************/

            result.processed =
                true;


            if (
                confidenceRecord
                    .confidence
                    .band ===
                    ConfidenceBand.UNKNOWN
            ) {

                result.status =

                    ConfidenceOrchestrationStatus
                        .COMPLETE_UNKNOWN;


                result.reasonCodes.push(

                    ConfidenceOrchestrationReasonCodes
                        .COMPLETE_UNKNOWN

                );


                result.reasons.push(

                    "Confidence orchestration completed successfully with an UNKNOWN final confidence state."

                );

            } else {

                result.status =

                    ConfidenceOrchestrationStatus
                        .COMPLETE;


                result.reasonCodes.push(

                    ConfidenceOrchestrationReasonCodes
                        .COMPLETE

                );


                result.reasons.push(

                    "Confidence orchestration completed successfully."

                );

            }


            this
                .markConfidenceOrchestrationStage(

                    result,

                    ConfidenceOrchestrationStage
                        .COMPLETE

                );


            return result;

        } catch (
            error
        ) {

            result.processed =
                false;


            result.status =

                ConfidenceOrchestrationStatus
                    .ERROR;


            result.reasonCodes.push(

                ConfidenceOrchestrationReasonCodes
                    .UNEXPECTED_ERROR

            );


            result.reasons.push(

                error?.message ||
                "An unexpected confidence orchestration error occurred."

            );


            return result;

        }

    };


/********************************************************************
 * 5.7.10 ORCHESTRATE ALL CONFIDENCE RECORDS
 *
 * Processes records sequentially and deterministically.
 *
 * One record failure does not prevent other records from being
 * processed.
 ********************************************************************/

ConfidenceEngine.prototype.orchestrateAllRecordConfidence =
    function () {

        const records =

            Array.isArray(
                this.confidenceModel
                    ?.records
            )

                ? this.confidenceModel.records

                : [];


        return records.map(

            record =>

                this
                    .orchestrateRecordConfidence(
                        record
                    )

        );

    };


/********************************************************************
 * 5.7.11 ORCHESTRATION DIAGNOSTICS
 ********************************************************************/

ConfidenceEngine.prototype.confidenceOrchestrationDiagnostics =
    function (
        orchestrationResults
    ) {

        const results =

            Array.isArray(
                orchestrationResults
            )

                ? orchestrationResults

                : [];


        const diagnostics = {

            totalRecords:
                results.length,

            processed:
                0,

            complete:
                0,

            completeUnknown:
                0,

            invalid:
                0,

            errors:
                0,

            high:
                0,

            medium:
                0,

            low:
                0,

            unknown:
                0,

            capped:
                0

        };


        results.forEach(

            result => {

                if (
                    result?.processed ===
                        true
                ) {

                    diagnostics
                        .processed++;

                }


                switch (
                    result?.status
                ) {

                    case ConfidenceOrchestrationStatus
                        .COMPLETE:

                        diagnostics
                            .complete++;

                        break;


                    case ConfidenceOrchestrationStatus
                        .COMPLETE_UNKNOWN:

                        diagnostics
                            .completeUnknown++;

                        break;


                    case ConfidenceOrchestrationStatus
                        .INVALID:

                        diagnostics
                            .invalid++;

                        break;


                    case ConfidenceOrchestrationStatus
                        .ERROR:

                        diagnostics
                            .errors++;

                        break;

                }


                const finalization =

                    result
                        ?.finalization;


                switch (
                    finalization
                        ?.band
                ) {

                    case ConfidenceBand.HIGH:

                        diagnostics.high++;

                        break;


                    case ConfidenceBand.MEDIUM:

                        diagnostics.medium++;

                        break;


                    case ConfidenceBand.LOW:

                        diagnostics.low++;

                        break;


                    case ConfidenceBand.UNKNOWN:

                        diagnostics.unknown++;

                        break;

                }


                if (
                    finalization
                        ?.capped ===
                        true
                ) {

                    diagnostics
                        .capped++;

                }

            }

        );


        return diagnostics;

    };


/********************************************************************
 * 5.7.12 SAFE EXPORTS
 ********************************************************************/

if (
    typeof window !==
        "undefined"
) {

    window
        .ConfidenceOrchestrationStatus =

            ConfidenceOrchestrationStatus;


    window
        .ConfidenceOrchestrationReasonCodes =

            ConfidenceOrchestrationReasonCodes;


    window
        .ConfidenceOrchestrationStage =

            ConfidenceOrchestrationStage;

}


/********************************************************************
 * END SECTION 5.7
 ********************************************************************/
// // ============================================================
// SECTION 6 — FINALIZATION, OUTPUT & DOWNSTREAM HANDOFF
// ============================================================
//
// SECTION 6.1 — CONFIDENCE OUTPUT CONTRACT
//
// PURPOSE
// -------
// Define the authoritative downstream output contract of the
// Confidence Engine.
//
// This section does NOT:
// - calculate confidence
// - change confidence scores
// - introduce new dimensions
// - introduce new weights
// - introduce new caps
// - perform AI reasoning
// - generate recommendations
//
// Sections 1–5 remain authoritative for all confidence
// assessment and determination logic.
// ============================================================


const CONFIDENCE_OUTPUT_CONTRACT_VERSION =
    "1.0.0";


/**
 * Creates the canonical downstream Confidence Engine output.
 *
 * This is a projection boundary only.
 *
 * It MUST NOT:
 * - recompute confidence
 * - reclassify confidence
 * - apply caps
 * - mutate the assessed model
 *
 * @param {Object} assessedModel
 * @returns {Object}
 */
function createConfidenceOutput(
    assessedModel
) {

    if (
        !assessedModel ||
        typeof assessedModel !==
            "object"
    ) {

        throw new TypeError(
            "Confidence Engine output requires a valid assessed model."
        );

    }


    const sourceRecords =

        Array.isArray(
            assessedModel.records
        )

            ? assessedModel.records

            : [];


    const output = {

        contract: {

            name:
                "EPI_CONFIDENCE_OUTPUT",

            version:
                CONFIDENCE_OUTPUT_CONTRACT_VERSION

        },


        /*
         * Static source identity.
         *
         * We deliberately do not introduce new global
         * ENGINE_NAME / ENGINE_VERSION contracts.
         */

        source: {

            engine:
                "ConfidenceEngine",

            contractVersion:
                CONFIDENCE_OUTPUT_CONTRACT_VERSION

        },


                model: {

            id:

                assessedModel.modelId ??

                assessedModel.id ??

                null,


            status:

                assessedModel.status ??

                null

        },


        records:

            sourceRecords.map(
                createConfidenceOutputRecord
            ),


        diagnostics:

            createConfidenceOutputDiagnostics(
                assessedModel
            )

    };


    return deepCloneConfidenceOutput(
        output
    );

}



/**
 * Projects one assessed record into the downstream
 * Confidence Engine output contract.
 *
 * No confidence logic is executed here.
 *
 * @param {Object} record
 * @returns {Object}
 */

function createConfidenceOutputRecord(
    confidenceRecord
) {

    /*
     * SECTION 6.1
     * Public output projection only.
     *
     * Financial fields belong to the preserved FIPE-4
     * evidence object:
     *
     *     confidenceRecord.evidence
     *
     * Confidence fields belong to:
     *
     *     confidenceRecord.confidence
     *
     * This function performs projection only.
     * It does not calculate, classify, cap, or otherwise
     * modify confidence.
     */

    if (
        confidenceRecord === null ||
        typeof confidenceRecord !== "object" ||
        Array.isArray(confidenceRecord)
    ) {

        return null;

    }


    const evidence =

        confidenceRecord.evidence !== null &&
        typeof confidenceRecord.evidence === "object" &&
        !Array.isArray(confidenceRecord.evidence)

            ? confidenceRecord.evidence

            : {};


    const confidence =

        confidenceRecord.confidence !== null &&
        typeof confidenceRecord.confidence === "object" &&
        !Array.isArray(confidenceRecord.confidence)

            ? confidenceRecord.confidence

            : {};


    return {

        /*
         * Preserve FIPE-4 record identity.
         */

        recordId:

            evidence.recordId ??

            evidence.id ??

            null,


        recordIndex:

            confidenceRecord.recordIndex ??

            evidence.recordIndex ??

            null,


        canonicalConcept:

            confidenceRecord.canonicalConcept ??

            evidence.canonicalConcept ??

            null,


        statementType:

            evidence.statementType ??

            evidence.statement ??

            null,


        /*
         * Preserve normalized financial context from
         * the authoritative evidence object.
         */

        period:

            deepCloneConfidenceOutput(

                evidence.normalizedPeriod ??

                evidence.period ??

                null

            ),


        /*
         * CRITICAL ZERO-VALUE SEMANTICS
         *
         * Nullish coalescing preserves:
         *
         *     0
         *
         * while still converting only null/undefined
         * to null.
         */

        normalizedValue:

            evidence.normalizedValue ??

            null,


        currency:

            evidence.normalizedCurrency ??

            evidence.currency ??

            null,


        unit:

            evidence.normalizedUnit ??

            evidence.unit ??

            null,


        /*
         * Preserve authoritative confidence state.
         *
         * No confidence computation occurs here.
         */

        confidence: {

            score:

                confidence.score ??

                null,


            band:

                confidence.band ??

                ConfidenceBand.UNKNOWN,


            capped:

                confidence.capped === true,


            capReason:

                confidence.capReason ??

                null,


            dimensions:

                deepCloneConfidenceOutput(

                    confidence.dimensions ??

                    {}

                ),


            reasonCodes:

                deepCloneConfidenceOutput(

                    Array.isArray(
                        confidence.reasonCodes
                    )

                        ? confidence.reasonCodes

                        : []

                ),


            reasons:

                deepCloneConfidenceOutput(

                    Array.isArray(
                        confidence.reasons
                    )

                        ? confidence.reasons

                        : []

                ),


            warnings:

                deepCloneConfidenceOutput(

                    Array.isArray(
                        confidence.warnings
                    )

                        ? confidence.warnings

                        : []

                )

        },


        /*
         * Preserve provenance from FIPE-4 evidence.
         */

        provenance:

            evidence.provenance !== null &&
            typeof evidence.provenance !== "undefined"

                ? deepCloneConfidenceOutput(
                    evidence.provenance
                )

                : null

    };

}

/**
 * Creates descriptive output diagnostics.
 *
 * These diagnostics do not score or classify evidence.
 *
 * @param {Object} assessedModel
 * @returns {Object}
 */
function createConfidenceOutputDiagnostics(
    assessedModel
) {

    const records =

        Array.isArray(
            assessedModel?.records
        )

            ? assessedModel.records

            : [];


    let scoredRecords =
        0;


    let unknownRecords =
        0;


    let cappedRecords =
        0;


    for (
        const record of records
    ) {

        const confidence =
            record?.confidence;


        if (
            !confidence ||
            typeof confidence !==
                "object"
        ) {

            unknownRecords +=
                1;

            continue;

        }


        if (
            Number.isFinite(
                confidence.score
            )
        ) {

            scoredRecords +=
                1;

        }


        /*
         * UNKNOWN is counted once per record.
         *
         * score === null and band === UNKNOWN may both be true,
         * but they represent the same record state.
         */

        if (

            confidence.score ==
                null ||

            confidence.band ===
                ConfidenceBand.UNKNOWN

        ) {

            unknownRecords +=
                1;

        }


        if (
            confidence.capped ===
                true
        ) {

            cappedRecords +=
                1;

        }

    }


    return {

        totalRecords:
            records.length,

        scoredRecords:
            scoredRecords,

        unknownRecords:
            unknownRecords,

        cappedRecords:
            cappedRecords

    };

}

/**
 * Defensive clone for the downstream output boundary.
 *
 * Downstream consumers must not receive mutable references
 * to authoritative Confidence Engine state.
 *
 * @param {*} value
 * @returns {*}
 */
function deepCloneConfidenceOutput(
    value
) {

    if (
        value ===
            undefined
    ) {

        return undefined;

    }


    if (
        typeof structuredClone ===
            "function"
    ) {

        return structuredClone(
            value
        );

    }


    return JSON.parse(

        JSON.stringify(
            value
        )

    );

}
/*
 * ============================================================
 * SECTION 6.2
 * CONFIDENCE ENGINE LIFECYCLE CLOSURE
 * ============================================================
 *
 * PURPOSE
 * -------
 * Close the existing FIPE-4 -> Confidence Engine lifecycle
 * after Section 5 orchestration became available.
 *
 * This method does NOT:
 *
 * - reassess evidence independently
 * - introduce new scoring logic
 * - introduce new confidence dimensions
 * - change weights
 * - change caps
 * - change Section 5 orchestration
 * - collapse MODEL_READY and COMPLETE semantics
 *
 * Section 5.7 remains authoritative for record-level
 * confidence orchestration.
 */


ConfidenceEngine.prototype.completeConfidenceLifecycle =
function () {

    /*
     * Lifecycle closure is valid only after the existing
     * FIPE-4 handoff has placed the engine into PROCESSING.
     *
     * This also prevents accidental direct invocation from
     * CREATED or READY state.
     */

    if (
        this.status !==
            ConfidenceEngineStatus.PROCESSING
    ) {

        return false;

    }


    try {

        /*
         * Execute the already-qualified Section 5.7
         * orchestration exactly once for this lifecycle call.
         *
         * orchestrateAllRecordConfidence() mutates the existing
         * authoritative confidence records through the qualified
         * record orchestration pipeline.
         */

        const orchestrationResults =

            this
                .orchestrateAllRecordConfidence();


        if (
            !Array.isArray(
                orchestrationResults
            )
        ) {

            throw new Error(
                "Confidence orchestration did not return a valid result collection."
            );

        }


        /*
         * Create the defensive downstream projection defined
         * and qualified in Section 6.1.
         *
         * This does not recalculate confidence.
         */

        const output =

            createConfidenceOutput(
                this.confidenceModel
            );


        /*
         * MODEL_READY semantics:
         *
         * A finalized confidence output is now available for
         * downstream consumption.
         *
         * Publish a defensive output object.
         */

        document.dispatchEvent(

            new CustomEvent(

                ConfidenceEngineEvents.MODEL_READY,

                {

                    detail: {

                        component:
                            this.component,

                        version:
                            this.version,

                        status:
                            this.status,

                        model:
                            output

                    }

                }

            )

        );


        /*
         * Lifecycle completion occurs only AFTER MODEL_READY
         * has been emitted.
         */

        this.status =
            ConfidenceEngineStatus.COMPLETE;


        /*
         * Preserve completion audit timing where the existing
         * confidence model exposes the audit contract.
         */

        if (
            this.confidenceModel?.audit
        ) {

            this.confidenceModel
                .audit
                .completedAt =

                    ConfidenceEngineUtils.now();

        }


        /*
         * COMPLETE semantics:
         *
         * Processing lifecycle has terminated successfully.
         *
         * This event intentionally does not duplicate the
         * confidence model payload.
         */

        document.dispatchEvent(

            new CustomEvent(

                ConfidenceEngineEvents.COMPLETE,

                {

                    detail: {

                        component:
                            this.component,

                        version:
                            this.version,

                        status:
                            this.status,

                        processedRecords:
                            orchestrationResults.length

                    }

                }

            )

        );


        return true;

    } catch (
        error
    ) {

        /*
         * Terminal lifecycle failure.
         */

        this.status =
            ConfidenceEngineStatus.ERROR;


        document.dispatchEvent(

            new CustomEvent(

                ConfidenceEngineEvents.ERROR,

                {

                    detail: {

                        component:
                            this.component,

                        version:
                            this.version,

                        status:
                            this.status,

                        message:

                            error instanceof Error

                                ? error.message

                                : String(
                                    error
                                )

                    }

                }

            )

        );


        return false;

    }

};