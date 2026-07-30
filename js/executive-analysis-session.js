/**
 * ============================================================================
 * Enterprise Performance Intelligence™
 * ============================================================================
 *
 * Runtime Kernel
 *
 * File:
 *      executive-analysis-session.js
 *
 * Version:
 *      1.0.0
 *
 * Description:
 *      Production-grade Executive Analysis Session Manager responsible for
 *      orchestrating the complete lifecycle of an Enterprise Performance
 *      Intelligence™ analysis.
 *
 * Responsibilities
 * ----------------
 * • Session creation
 * • Session lifecycle management
 * • Enterprise metadata
 * • Uploaded document registry
 * • Financial extraction state
 * • Blueprint execution state
 * • Confidence assessment state
 * • Executive package state
 * • Runtime event publication
 * • Diagnostics
 * • Snapshot generation
 *
 * Author:
 *      Enterprise Performance Intelligence™
 *
 * Copyright:
 *      © Enterprise Performance Intelligence™
 *
 * ============================================================================
 */

(function (global) {

    "use strict";

    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const VERSION = "1.0.0";

    /**
     * ------------------------------------------------------------------------
     * Session Lifecycle States
     * ------------------------------------------------------------------------
     */

    const SESSION_STATE = Object.freeze({

        INITIALISING: "INITIALISING",

        READY: "READY",

        UPLOADING: "UPLOADING",

        READING: "READING",

        EXTRACTING: "EXTRACTING",

        NORMALISING: "NORMALISING",

        ANALYSING: "ANALYSING",

        SCORING: "SCORING",

        GENERATING: "GENERATING",

        COMPLETED: "COMPLETED",

        FAILED: "FAILED",

        CANCELLED: "CANCELLED"

    });

    /**
     * ------------------------------------------------------------------------
     * Executive Analysis Session
     * ------------------------------------------------------------------------
     */

    class ExecutiveAnalysisSession {

        /**
         * --------------------------------------------------------------------
         * Constructor
         * --------------------------------------------------------------------
         */

        constructor(options = {}) {

            this.version = VERSION;

            this.debug = Boolean(options.debug);

            this.session = null;

        }

        /**
         * --------------------------------------------------------------------
         * Generate Unique Session ID
         * --------------------------------------------------------------------
         */

        generateSessionId(prefix = "session") {

            return (

                prefix +

                "_" +

                Date.now().toString(36) +

                "_" +

                Math.random()

                    .toString(36)

                    .substring(2, 10)

            );

        }

        /**
         * --------------------------------------------------------------------
         * Create Canonical Session Object
         * --------------------------------------------------------------------
         */

        createEmptySession() {

            const timestamp = new Date().toISOString();

            return {

                sessionId:

                    this.generateSessionId(),

                tenant: null,

                enterprise: null,

                user: null,

                blueprint: null,

                uploadedDocuments: [],

                extractedFinancials: null,

                normalizedFinancials: null,

                analysisContract: null,

                blueprintAnalysis: null,

                confidenceAssessment: null,

                executiveBrief: null,

                packageStatus: {

                    status: "NOT_STARTED",

                    message: "",

                    updated: null

},

                lifecycle: {

                    state:

                        SESSION_STATE.INITIALISING,

                    progress: 0,

                    message:

                        "Session Initialising"

                },

                timestamps: {

                    created: timestamp,

                    updated: timestamp,

                    completed: null

                }

            };

        }

        /**
         * --------------------------------------------------------------------
         * Is Session Available
         * --------------------------------------------------------------------
         */

        hasSession() {

            return this.session !== null;

        }

        /**
         * --------------------------------------------------------------------
         * Get Current Session
         * --------------------------------------------------------------------
         */

        getSession() {

    return this.exportSession();

}

        /**
         * --------------------------------------------------------------------
         * Get Session State
         * --------------------------------------------------------------------
         */

        getState() {

            if (!this.session) {

                return null;

            }

            return this.session.lifecycle.state;

        }
        /**
         * --------------------------------------------------------------------
         * Create Executive Analysis Session
         * --------------------------------------------------------------------
         *
         * Creates a new analysis session and populates the canonical
         * Enterprise Performance Intelligence™ session object.
         *
         * @param {Object} options
         *
         * @returns {Object}
         */

        createSession(options = {}) {

            this.session = this.createEmptySession();

            this.session.tenant =
                options.tenant ?? null;

            this.session.enterprise =
                options.enterprise ?? null;

            this.session.user =
                options.user ?? null;

            this.session.blueprint =
                options.blueprint ?? null;

            this.session.lifecycle.state =
                SESSION_STATE.READY;

            this.session.lifecycle.progress = 0;

            this.session.lifecycle.message =
                "Session Ready";

            this.session.timestamps.updated =
    new Date().toISOString();

this.publishSessionCreated();

return this.session;

        }

        /**
         * --------------------------------------------------------------------
         * Reset Current Session
         * --------------------------------------------------------------------
         *
         * Clears all runtime data while preserving the session instance.
         *
         * @returns {Object}
         */

        resetSession() {

            if (!this.hasSession()) {

                this.session =
                    this.createEmptySession();

            } else {

                const sessionId =
                    this.session.sessionId;

                this.session =
                    this.createEmptySession();

                this.session.sessionId =
                    sessionId;

            }

            this.session.lifecycle.state =
                SESSION_STATE.READY;

            this.session.lifecycle.message =
                "Session Reset";

            this.session.timestamps.updated =
                new Date().toISOString();

            return this.session;

        }

        /**
         * --------------------------------------------------------------------
         * Destroy Session
         * --------------------------------------------------------------------
         *
         * Completely removes the active runtime session.
         *
         * @returns {Boolean}
         */

        destroySession() {

            if (!this.hasSession()) {

                return false;

            }

            this.session = null;

            return true;

        }

        /**
         * --------------------------------------------------------------------
         * Update Timestamp
         * --------------------------------------------------------------------
         */

        touch() {

            if (!this.hasSession()) {

                return;

            }

            this.session.timestamps.updated =
                new Date().toISOString();

        }

        /**
         * --------------------------------------------------------------------
         * Set Enterprise
         * --------------------------------------------------------------------
         */

        setEnterprise(enterprise) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.enterprise =
                enterprise;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Set Tenant
         * --------------------------------------------------------------------
         */

        setTenant(tenant) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.tenant =
                tenant;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Set User
         * --------------------------------------------------------------------
         */

        setUser(user) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.user =
                user;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Set Blueprint
         * --------------------------------------------------------------------
         */

        setBlueprint(blueprint) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.blueprint =
                blueprint;

            this.touch();

            return this;

        }
                /**
         * --------------------------------------------------------------------
         * Validate Session State
         * --------------------------------------------------------------------
         *
         * @param {String} state
         *
         * @returns {Boolean}
         */

        isValidState(state) {

            return Object.values(

                SESSION_STATE

            ).includes(state);

        }

        /**
         * --------------------------------------------------------------------
         * Update Lifecycle State
         * --------------------------------------------------------------------
         *
         * Updates the runtime lifecycle state while maintaining
         * timestamp consistency.
         *
         * @param {String} state
         * @param {String} message
         * @param {Number|null} progress
         *
         * @returns {Object}
         */

        setState(

            state,

            message = "",

            progress = null

        ) {

            if (!this.hasSession()) {

                throw new Error(

                    "No active analysis session."

                );

            }

            if (!this.isValidState(state)) {

                throw new Error(

                    `Invalid session state: ${state}`

                );

            }

            this.session.lifecycle.state = state;

            if (

                typeof message === "string" &&

                message.length > 0

            ) {

                this.session.lifecycle.message =

                    message;

            }

            if (

                progress !== null

            ) {

                if (

                    !Number.isFinite(progress) ||

                    progress < 0 ||

                    progress > 100

                ) {

                    throw new RangeError(

                        "Progress must be between 0 and 100."

                    );

                }

                this.session.lifecycle.progress =

                    progress;

            }

            this.touch();

this.publishLifecycleChanged();

return this.session.lifecycle;

        }

        /**
         * --------------------------------------------------------------------
         * Advance Progress
         * --------------------------------------------------------------------
         *
         * @param {Number} increment
         *
         * @returns {Number}
         */

        advanceProgress(

            increment = 1

        ) {

            if (!this.hasSession()) {

                throw new Error(

                    "No active analysis session."

                );

            }

            if (

                !Number.isFinite(increment)

            ) {

                throw new TypeError(

                    "Progress increment must be numeric."

                );

            }

            const nextProgress =

                Math.min(

                    100,

                    this.session.lifecycle.progress +

                    increment

                );

            this.session.lifecycle.progress =

                nextProgress;

            this.touch();

            return nextProgress;

        }

        /**
         * --------------------------------------------------------------------
         * Mark Session Complete
         * --------------------------------------------------------------------
         */

        completeSession(

            message = "Analysis Complete"

        ) {

            this.setState(

                SESSION_STATE.COMPLETED,

                message,

                100

            );

            this.session.timestamps.completed =

                new Date().toISOString();

            this.publishSessionCompleted();

return this.session;

        }

        /**
         * --------------------------------------------------------------------
         * Mark Session Failed
         * --------------------------------------------------------------------
         */

        failSession(

            reason = "Analysis Failed"

        ) {

            this.setState(

                SESSION_STATE.FAILED,

                reason

            );

            this.publishSessionFailed(reason);

return this.session;

        }

        /**
         * --------------------------------------------------------------------
         * Cancel Session
         * --------------------------------------------------------------------
         */

        cancelSession(

            reason = "Analysis Cancelled"

        ) {

            this.setState(

                SESSION_STATE.CANCELLED,

                reason

            );

            return this.session;

        }

        /**
         * --------------------------------------------------------------------
         * Is Session Complete
         * --------------------------------------------------------------------
         */

        isCompleted() {

            return (

                this.hasSession() &&

                this.session.lifecycle.state ===

                SESSION_STATE.COMPLETED

            );

        }

        /**
         * --------------------------------------------------------------------
         * Is Session Active
         * --------------------------------------------------------------------
         */

        isActive() {

            if (!this.hasSession()) {

                return false;

            }

            return ![

                SESSION_STATE.COMPLETED,

                SESSION_STATE.FAILED,

                SESSION_STATE.CANCELLED

            ].includes(

                this.session.lifecycle.state

            );

        }

        /**
         * --------------------------------------------------------------------
         * Get Lifecycle Summary
         * --------------------------------------------------------------------
         */

        getLifecycle() {

            if (!this.hasSession()) {

                return null;

            }

            return {

                state:

                    this.session.lifecycle.state,

                progress:

                    this.session.lifecycle.progress,

                message:

                    this.session.lifecycle.message,

                updated:

                    this.session.timestamps.updated

            };

        }
                /**
         * --------------------------------------------------------------------
         * Generate Document ID
         * --------------------------------------------------------------------
         *
         * @returns {String}
         */

        generateDocumentId(prefix = "doc") {

            return (

                prefix +

                "_" +

                Date.now().toString(36) +

                "_" +

                Math.random()

                    .toString(36)

                    .substring(2, 10)

            );

        }

        /**
         * --------------------------------------------------------------------
         * Register Uploaded Document
         * --------------------------------------------------------------------
         *
         * Registers a document with the current session.
         *
         * @param {Object} document
         *
         * @returns {Object}
         */

        registerDocument(document = {}) {

            if (!this.hasSession()) {

                throw new Error(

                    "No active analysis session."

                );

            }

            const registeredDocument = {

                documentId:

                    this.generateDocumentId(),

                name:

                    document.name ?? null,

                type:

                    document.type ?? null,

                size:

                    document.size ?? null,

                source:

                    document.source ?? "upload",

                uploadedAt:

                    new Date().toISOString(),

                status:

                    "REGISTERED",

                metadata:

                    document.metadata ?? {},

                content:

                    null,

                extraction:

                    null,

                normalized:

                    null

            };

            this.session.uploadedDocuments.push(

                registeredDocument

            );

            this.touch();

this.publishDocumentRegistered(
    registeredDocument
);

return registeredDocument;

        }

        /**
         * --------------------------------------------------------------------
         * Get Registered Documents
         * --------------------------------------------------------------------
         *
         * @returns {Array}
         */

        getDocuments() {

            if (!this.hasSession()) {

                return [];

            }

            return this.clone(

    this.session.uploadedDocuments

);

        }

        /**
         * --------------------------------------------------------------------
         * Get Document Count
         * --------------------------------------------------------------------
         */

        getDocumentCount() {

            if (!this.hasSession()) {

                return 0;

            }

            return this.session.uploadedDocuments.length;

        }

        /**
         * --------------------------------------------------------------------
         * Find Document
         * --------------------------------------------------------------------
         *
         * @param {String} documentId
         *
         * @returns {Object|null}
         */

        getDocument(documentId) {

            if (!this.hasSession()) {

                return null;

            }

           const document =

    this.session.uploadedDocuments.find(

        document =>

            document.documentId ===

            documentId

    );

            return document ?

            this.clone(document)

        :

            null;

        }

        /**
         * --------------------------------------------------------------------
         * Update Document Status
         * --------------------------------------------------------------------
         *
         * @param {String} documentId
         * @param {String} status
         *
         * @returns {Object}
         */

        updateDocumentStatus(

            documentId,

            status

        ) {

            const document = this.session.uploadedDocuments.find(
    document => document.documentId === documentId
);

if (!document) {
    throw new Error("Document not found.");
}

document.status = status;

this.touch();

return this.clone(document);

        }

        /**
         * --------------------------------------------------------------------
         * Remove Document
         * --------------------------------------------------------------------
         *
         * @param {String} documentId
         *
         * @returns {Boolean}
         */

        removeDocument(documentId) {

            if (!this.hasSession()) {

                return false;

            }

            const index =

                this.session.uploadedDocuments.findIndex(

                    document =>

                        document.documentId ===

                        documentId

                );

            if (index === -1) {

                return false;

            }

            this.session.uploadedDocuments.splice(

                index,

                1

            );

            this.touch();

            return true;

        }

        /**
         * --------------------------------------------------------------------
         * Clear Registered Documents
         * --------------------------------------------------------------------
         *
         * @returns {ExecutiveAnalysisSession}
         */

        clearDocuments() {

            if (!this.hasSession()) {

                return this;

            }

            this.session.uploadedDocuments = [];

            this.touch();

            return this;

        }
                /**
         * --------------------------------------------------------------------
         * Store Extracted Financial Data
         * --------------------------------------------------------------------
         *
         * Stores the raw financial extraction generated by the
         * Financial Extractor.
         *
         * @param {Object} financials
         *
         * @returns {ExecutiveAnalysisSession}
         */

        setExtractedFinancials(financials = {}) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.extractedFinancials = financials;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Get Extracted Financial Data
         * --------------------------------------------------------------------
         */

        getExtractedFinancials() {

    if (!this.hasSession()) {

        return null;

    }

    return this.clone(

        this.session.extractedFinancials

    );

}

        /**
         * --------------------------------------------------------------------
         * Store Normalized Financial Data
         * --------------------------------------------------------------------
         *
         * Stores normalized financial statements generated by the
         * Financial Normalizer.
         *
         * @param {Object} financials
         *
         * @returns {ExecutiveAnalysisSession}
         */

        setNormalizedFinancials(financials = {}) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.normalizedFinancials = financials;

            this.touch();

            this.publishFinancialsUpdated();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Get Normalized Financial Data
         * --------------------------------------------------------------------
         */

        getNormalizedFinancials() {

            if (!this.hasSession()) {

                return null;

            }

            return this.clone(

    this.session.normalizedFinancials

);

        }

        /**
         * --------------------------------------------------------------------
         * Store Blueprint Analysis Contract
         * --------------------------------------------------------------------
         *
         * Stores the canonical Blueprint Analysis Contract generated
         * prior to execution of the Blueprint Intelligence Engine.
         *
         * @param {Object} contract
         *
         * @returns {ExecutiveAnalysisSession}
         */

        setAnalysisContract(contract = {}) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.analysisContract = contract;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Get Blueprint Analysis Contract
         * --------------------------------------------------------------------
         */

        getAnalysisContract() {

            if (!this.hasSession()) {

                return null;

            }

            return this.clone(

    this.session.analysisContract

);

        }

        /**
         * --------------------------------------------------------------------
         * Clear Financial Intelligence
         * --------------------------------------------------------------------
         *
         * Removes all financial intelligence while preserving
         * session metadata and uploaded documents.
         *
         * @returns {ExecutiveAnalysisSession}
         */

        clearFinancials() {

            if (!this.hasSession()) {

                return this;

            }

            this.session.extractedFinancials = null;

            this.session.normalizedFinancials = null;

            this.session.analysisContract = null;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Financial Intelligence Available
         * --------------------------------------------------------------------
         */

        hasFinancials() {

            return (

                this.hasSession() &&

                this.session.normalizedFinancials !== null

            );

        }

        /**
         * --------------------------------------------------------------------
         * Get Financial Intelligence Summary
         * --------------------------------------------------------------------
         */

        getFinancialSummary() {

            if (!this.hasSession()) {

                return null;

            }

            return {

                extracted:

                    this.session.extractedFinancials !== null,

                normalized:

                    this.session.normalizedFinancials !== null,

                analysisContract:

                    this.session.analysisContract !== null

            };

        }
                /**
         * --------------------------------------------------------------------
         * Store Blueprint Analysis
         * --------------------------------------------------------------------
         *
         * Stores the complete Blueprint Intelligence Engine output.
         *
         * @param {Object} analysis
         *
         * @returns {ExecutiveAnalysisSession}
         */

        setBlueprintAnalysis(analysis = {}) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.blueprintAnalysis = analysis;

            this.touch();

this.publishBlueprintCompleted();

return this;

        }

        /**
         * --------------------------------------------------------------------
         * Get Blueprint Analysis
         * --------------------------------------------------------------------
         */

        getBlueprintAnalysis() {

            if (!this.hasSession()) {

                return null;

            }

            return this.clone(

    this.session.blueprintAnalysis

);

        }

        /**
         * --------------------------------------------------------------------
         * Store Executive Findings
         * --------------------------------------------------------------------
         */

        setExecutiveFindings(findings = []) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            if (!this.session.blueprintAnalysis) {

                this.session.blueprintAnalysis = {};

            }

            this.session.blueprintAnalysis.executiveFindings =
                findings;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Store KPI Summary
         * --------------------------------------------------------------------
         */

        setKPISummary(kpis = {}) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            if (!this.session.blueprintAnalysis) {

                this.session.blueprintAnalysis = {};

            }

            this.session.blueprintAnalysis.kpis = kpis;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Store Enterprise Risks
         * --------------------------------------------------------------------
         */

        setEnterpriseRisks(risks = []) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            if (!this.session.blueprintAnalysis) {

                this.session.blueprintAnalysis = {};

            }

            this.session.blueprintAnalysis.risks = risks;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Store Enterprise Opportunities
         * --------------------------------------------------------------------
         */

        setEnterpriseOpportunities(opportunities = []) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            if (!this.session.blueprintAnalysis) {

                this.session.blueprintAnalysis = {};

            }

            this.session.blueprintAnalysis.opportunities =
                opportunities;

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Get Executive Findings
         * --------------------------------------------------------------------
         */

        getExecutiveFindings() {

            return this.session?.blueprintAnalysis
                ?.executiveFindings ?? [];

        }

        /**
         * --------------------------------------------------------------------
         * Get KPI Summary
         * --------------------------------------------------------------------
         */

        getKPISummary() {

            return this.session?.blueprintAnalysis
                ?.kpis ?? {};

        }

        /**
         * --------------------------------------------------------------------
         * Get Enterprise Risks
         * --------------------------------------------------------------------
         */

        getEnterpriseRisks() {

            return this.session?.blueprintAnalysis
                ?.risks ?? [];

        }

        /**
         * --------------------------------------------------------------------
         * Get Enterprise Opportunities
         * --------------------------------------------------------------------
         */

        getEnterpriseOpportunities() {

            return this.session?.blueprintAnalysis
                ?.opportunities ?? [];

        }

        /**
         * --------------------------------------------------------------------
         * Blueprint Analysis Available
         * --------------------------------------------------------------------
         */

        hasBlueprintAnalysis() {

            return (

                this.hasSession() &&

                this.session.blueprintAnalysis !== null

            );

        }

        /**
         * --------------------------------------------------------------------
         * Clear Blueprint Analysis
         * --------------------------------------------------------------------
         */

        clearBlueprintAnalysis() {

            if (!this.hasSession()) {

                return this;

            }

            this.session.blueprintAnalysis = null;

            this.touch();

            return this;

        }
                /**
         * --------------------------------------------------------------------
         * Store Confidence Assessment
         * --------------------------------------------------------------------
         *
         * Stores the output generated by the Confidence Engine.
         *
         * @param {Object} assessment
         *
         * @returns {ExecutiveAnalysisSession}
         */

        setConfidenceAssessment(assessment = {}) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.confidenceAssessment = assessment;

            this.touch();

this.publishConfidenceCompleted();

return this;

        }

        /**
         * --------------------------------------------------------------------
         * Get Confidence Assessment
         * --------------------------------------------------------------------
         */

        getConfidenceAssessment() {

            if (!this.hasSession()) {

                return null;

            }

            return this.clone(

    this.session.confidenceAssessment

);

        }

        /**
         * --------------------------------------------------------------------
         * Confidence Assessment Available
         * --------------------------------------------------------------------
         */

        hasConfidenceAssessment() {

            return (

                this.hasSession() &&

                this.session.confidenceAssessment !== null

            );

        }

        /**
         * --------------------------------------------------------------------
         * Store Executive Brief
         * --------------------------------------------------------------------
         *
         * Stores the executive briefing package generated by the
         * Executive Package Generator.
         *
         * @param {Object} brief
         *
         * @returns {ExecutiveAnalysisSession}
         */

        setExecutiveBrief(brief = {}) {

            if (!this.hasSession()) {

                throw new Error(
                    "No active analysis session."
                );

            }

            this.session.executiveBrief = brief;

            this.touch();

this.publishExecutiveBriefReady();

return this;

        }

        /**
         * --------------------------------------------------------------------
         * Get Executive Brief
         * --------------------------------------------------------------------
         */

        getExecutiveBrief() {

            if (!this.hasSession()) {

                return null;

            }

            return this.clone(this.session.executiveBrief);

        }

        /**
         * --------------------------------------------------------------------
         * Executive Brief Available
         * --------------------------------------------------------------------
         */

        hasExecutiveBrief() {

            return (

                this.hasSession() &&

                this.session.executiveBrief !== null

            );

        }

        /**
         * --------------------------------------------------------------------
         * Update Executive Package Status
         * --------------------------------------------------------------------
         *
         * Valid states:
         *
         * NOT_STARTED
         * GENERATING
         * GENERATED
         * FAILED
         */
        static get PACKAGE_STATUS() {
            return Object.freeze({
                NOT_STARTED: "NOT_STARTED",
                GENERATING: "GENERATING",
                GENERATED: "GENERATED",
                FAILED: "FAILED"
            });
        }

        setPackageStatus(

            status,

            message = ""

        ) {

            if (!this.hasSession()) {
                throw new Error(
                    "No active analysis session."
                );
            }

            const PACKAGE_STATUS = this.constructor.PACKAGE_STATUS;

            if (!Object.values(PACKAGE_STATUS).includes(status)) {
                throw new Error(
                    `Invalid package status: ${status}`
                );
            }

            if (!this.session.packageStatus) {

                this.session.packageStatus = {

                    status: PACKAGE_STATUS.NOT_STARTED,

                    message: "",

                    updated: null

                };

            }

            this.session.packageStatus.status =

                status;

            this.session.packageStatus.message =

                message;

            this.session.packageStatus.updated =

                new Date().toISOString();

            this.touch();

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Get Executive Package Status
         * --------------------------------------------------------------------
         */

        getPackageStatus() {

            if (!this.hasSession()) {

                return null;

            }

            return (

                this.session.packageStatus ||

                {

                    status: "NOT_STARTED",

                    message: "",

                    updated: null

                }

            );

        }

        /**
         * --------------------------------------------------------------------
         * Executive Intelligence Summary
         * --------------------------------------------------------------------
         */

        getExecutiveSummary() {

            if (!this.hasSession()) {

                return null;

            }

            return {

                confidenceAssessment:

                    this.session.confidenceAssessment !== null,

                executiveBrief:

                    this.session.executiveBrief !== null,

                packageStatus:

                    this.getPackageStatus()

            };

        }

        /**
         * --------------------------------------------------------------------
         * Clear Executive Intelligence
         * --------------------------------------------------------------------
         */

        clearExecutiveIntelligence() {

            if (!this.hasSession()) {

                return this;

            }

            this.session.confidenceAssessment = null;

            this.session.executiveBrief = null;

            this.session.packageStatus = {

                status: "NOT_STARTED",

                message: "",

                updated: null

            };

            this.touch();

            return this;

        }
                /**
         * --------------------------------------------------------------------
         * Publish Runtime Event
         * --------------------------------------------------------------------
         *
         * Publishes an event through the Runtime Event Bus when
         * available. Safe no-op if EventBus is unavailable.
         *
         * @param {String} type
         * @param {Object} data
         *
         * @returns {Boolean}
         */

        publishEvent(type, data = {}) {

            if (

    !global.EventBus ||

    typeof global.EventBus.publish !== "function"

) {

                return false;

            }

            global.EventBus.publish(

                type,

                {

                    sessionId:

                        this.session?.sessionId ?? null,

                    ...data

                },

                "ExecutiveAnalysisSession"

            );

            return true;

        }

        /**
         * --------------------------------------------------------------------
         * Publish Session Created Event
         * --------------------------------------------------------------------
         */

        publishSessionCreated() {

            if (!this.hasSession()) {

                return false;

            }

            return this.publishEvent(

                "session.created",

                {

                    lifecycle:

                        this.getLifecycle()

                }

            );

        }

        /**
         * --------------------------------------------------------------------
         * Publish Lifecycle Changed Event
         * --------------------------------------------------------------------
         */

        publishLifecycleChanged() {

            if (!this.hasSession()) {

                return false;

            }

            return this.publishEvent(

                "session.lifecycle.changed",

                {

                    lifecycle:

                        this.getLifecycle()

                }

            );

        }

        /**
         * --------------------------------------------------------------------
         * Publish Document Registered Event
         * --------------------------------------------------------------------
         */

        publishDocumentRegistered(document) {

            return this.publishEvent(

                "session.document.registered",

                {

                    document

                }

            );

        }

        /**
         * --------------------------------------------------------------------
         * Publish Financial Updated Event
         * --------------------------------------------------------------------
         */

        publishFinancialsUpdated() {

            return this.publishEvent(

                "session.financials.updated",

                this.getFinancialSummary()

            );

        }

        /**
         * --------------------------------------------------------------------
         * Publish Blueprint Complete Event
         * --------------------------------------------------------------------
         */

        publishBlueprintCompleted() {

            return this.publishEvent(

                "session.blueprint.completed",

                {

                    blueprint:

                        this.session?.blueprint,

                    summary:

                        {

                            findings:

                                this.getExecutiveFindings().length,

                            risks:

                                this.getEnterpriseRisks().length,

                            opportunities:

                                this.getEnterpriseOpportunities().length

                        }

                }

            );

        }

        /**
         * --------------------------------------------------------------------
         * Publish Confidence Complete Event
         * --------------------------------------------------------------------
         */

        publishConfidenceCompleted() {

            return this.publishEvent(

                "session.confidence.completed",

                {

                    available:

                        this.hasConfidenceAssessment()

                }

            );

        }

        /**
         * --------------------------------------------------------------------
         * Publish Executive Brief Ready Event
         * --------------------------------------------------------------------
         */

        publishExecutiveBriefReady() {

            return this.publishEvent(

                "session.executive.ready",

                this.getExecutiveSummary()

            );

        }

        /**
         * --------------------------------------------------------------------
         * Publish Session Completed Event
         * --------------------------------------------------------------------
         */

        publishSessionCompleted() {

            return this.publishEvent(

                "session.completed",

                {

                    lifecycle:

                        this.getLifecycle()

                }

            );

        }

        /**
         * --------------------------------------------------------------------
         * Publish Session Failed Event
         * --------------------------------------------------------------------
         */

        publishSessionFailed(error) {

            return this.publishEvent(

                "session.failed",

                {

                    error

                }

            );

        }
        
                /**
         * --------------------------------------------------------------------
         * Deep Clone Utility
         * --------------------------------------------------------------------
         *
         * Creates a deep copy of serializable runtime objects.
         *
         * @param {*} value
         *
         * @returns {*}
         */

        clone(value) {

    if (typeof structuredClone === "function") {

        return structuredClone(value);

    }

    return JSON.parse(

        JSON.stringify(value)

    );

}

        /**
         * --------------------------------------------------------------------
         * Export Session Snapshot
         * --------------------------------------------------------------------
         *
         * Returns an immutable snapshot of the current runtime
         * session for diagnostics or persistence.
         *
         * @returns {Object|null}
         */

        exportSession() {

            if (!this.hasSession()) {

                return null;

            }

            return this.clone(

                this.session

            );

        }

        /**
         * --------------------------------------------------------------------
         * Runtime Health
         * --------------------------------------------------------------------
         *
         * Returns a lightweight health report for the current
         * analysis session.
         */

        health() {

            if (!this.hasSession()) {

                return {

                    healthy: false,

                    reason: "NO_ACTIVE_SESSION"

                };

            }

            return {

                healthy: true,

                version: this.version,

                sessionId:

                    this.session.sessionId,

                lifecycle:

                    this.session.lifecycle.state,

                progress:

                    this.session.lifecycle.progress,

                documents:

                    this.getDocumentCount(),

                financials:

                    this.hasFinancials(),

                blueprint:

                    this.hasBlueprintAnalysis(),

                confidence:

                    this.hasConfidenceAssessment(),

                executiveBrief:

                    this.hasExecutiveBrief(),


            };

        }

        /**
         * --------------------------------------------------------------------
         * Runtime Statistics
         * --------------------------------------------------------------------
         */

        statistics() {

            if (!this.hasSession()) {

                return null;

            }

            return {

    sessionId:

        this.session.sessionId,

    enterprise:

        this.session.enterprise,

    blueprint:

        this.session.blueprint,

    created:

        this.session.timestamps.created,

    updated:

        this.session.timestamps.updated,

    completed:

        this.session.timestamps.completed,

    documents:

        this.getDocumentCount(),

    state:

        this.getState(),

    progress:

        this.session.lifecycle.progress

};

}

        /**
         * --------------------------------------------------------------------
         * Diagnostics
         * --------------------------------------------------------------------
         */

        diagnostics() {

            return {

                runtime:

                    "ExecutiveAnalysisSession",

                version:

                    this.version,

                debug:

                    this.debug,

                health:

                    this.health(),

                statistics:

                    this.statistics()

            };

        }

        /**
         * --------------------------------------------------------------------
         * Print Diagnostics
         * --------------------------------------------------------------------
         */

        printDiagnostics() {

            if (

                typeof console !== "undefined"

            ) {

                console.table(

                    this.statistics()

                );

            }

            return this;

        }

        /**
         * --------------------------------------------------------------------
         * Serialize Session
         * --------------------------------------------------------------------
         */

        serialize() {

            return JSON.stringify(

                this.exportSession(),

                null,

                2

            );

        }

        /**
         * --------------------------------------------------------------------
         * Reset Runtime
         * --------------------------------------------------------------------
         *
         * Clears runtime state while preserving the active
         * session metadata.
         */

        resetRuntime() {

            if (!this.hasSession()) {

                return this;

            }

            this.clearDocuments();

            this.clearFinancials();

            this.clearBlueprintAnalysis();

            this.clearExecutiveIntelligence();

            this.setState(

                SESSION_STATE.READY,

                "Runtime Reset",

                0

            );

            this.touch();

            return this;

        }

    }
    /**
     * ====================================================================
     * Runtime Self Test
     * ====================================================================
     *
     * Performs a lightweight structural validation during startup.
     * This is not intended to replace unit tests.
     *
     * @returns {Boolean}
     */

    function selfTest(sessionManager) {

        try {

            if (!(sessionManager instanceof ExecutiveAnalysisSession)) {

                throw new Error(
                    "Invalid ExecutiveAnalysisSession instance."
                );

            }

            const requiredMethods = [

                "createSession",
                "destroySession",
                "setState",
                "registerDocument",
                "setExtractedFinancials",
                "setNormalizedFinancials",
                "setAnalysisContract",
                "setBlueprintAnalysis",
                "setConfidenceAssessment",
                "setExecutiveBrief",
                "exportSession",
                "diagnostics"

            ];

            for (const method of requiredMethods) {

                if (typeof sessionManager[method] !== "function") {

                    throw new Error(

                        `Missing required method: ${method}`

                    );

                }

            }

            return true;

        }

        catch (error) {

            console.error(

                "[ExecutiveAnalysisSession]",

                error

            );

            return false;

        }

    }

    /**
     * ====================================================================
     * Singleton Initialization
     * ====================================================================
     */

    const executiveAnalysisSession =

        new ExecutiveAnalysisSession();

    /**
     * ====================================================================
     * Runtime Validation
     * ====================================================================
     */

    if (

        !selfTest(

            executiveAnalysisSession

        )

    ) {

        throw new Error(

            "ExecutiveAnalysisSession failed startup validation."

        );

    }

    /**
     * ====================================================================
     * Public Runtime Namespace
     * ====================================================================
     */

    global.ExecutiveAnalysisSession =

        executiveAnalysisSession;

    /**
     * ====================================================================
     * Runtime Metadata
     * ====================================================================
     */

    Object.defineProperties(

        global.ExecutiveAnalysisSession,

        {

            VERSION: {

                value: VERSION,

                enumerable: true

            },

            MODULE: {

                value: "ExecutiveAnalysisSession",

                enumerable: true

            }

        }

    );

    /**
     * ====================================================================
     * Publish Runtime Ready Event
     * ====================================================================
     */

    if (

        global.EventBus &&

        typeof global.EventBus.publish === "function"

    ) {

        global.EventBus.publish(

            "runtime.executive.session.ready",

            {

                module: "ExecutiveAnalysisSession",

                version: VERSION

            },

            "ExecutiveAnalysisSession"

        );

    }

    /**
     * ====================================================================
     * Freeze Public Namespace
     * ====================================================================
     */

    Object.seal(

        global.ExecutiveAnalysisSession

    );

})();
