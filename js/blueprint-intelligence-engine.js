/********************************************************************
 * Enterprise Performance Intelligence™
 *
 * Blueprint Intelligence Engine™ (BIE)
 *
 * Version : 1.0.0 RC1
 * Status  : Foundation
 *
 * Copyright © Enterprise Performance Intelligence™
 ********************************************************************/

/********************************************************************
 * SECTION 1
 * Constants
 ********************************************************************/
"use strict";

/********************************************************************
 * BIE ENGINE VERSION
 ********************************************************************/

const BIE_VERSION = "1.0.0 RC1";

const BIE_ENGINE_NAME = "Blueprint Intelligence Engine™";

/********************************************************************
 * ENGINE STATUS
 ********************************************************************/

const BIE_STATUS = Object.freeze({

    CREATED: "CREATED",

    INITIALIZED: "INITIALIZED",

    RUNNING: "RUNNING",

    STOPPED: "STOPPED",

    DESTROYED: "DESTROYED"

});

/********************************************************************
 * LOG LEVELS
 ********************************************************************/

const BIE_LOG_LEVEL = Object.freeze({

    DEBUG: "DEBUG",

    INFO: "INFO",

    WARNING: "WARNING",

    ERROR: "ERROR"

});

/********************************************************************
 * ENGINE EVENTS
 ********************************************************************/

const BIE_EVENTS = Object.freeze({

    INITIALIZED: "BIE_INITIALIZED",

    STARTED: "BIE_STARTED",

    STOPPED: "BIE_STOPPED",

    RESET: "BIE_RESET",

    DESTROYED: "BIE_DESTROYED",

    BLUEPRINT_SELECTED: "BLUEPRINT_SELECTED",

    DOCUMENT_REQUIREMENTS_READY: "DOCUMENT_REQUIREMENTS_READY",

    DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",

    DOCUMENT_REMOVED: "DOCUMENT_REMOVED",

    CONFIDENCE_UPDATED: "CONFIDENCE_UPDATED",

    ANALYSIS_CONTRACT_READY: "ANALYSIS_CONTRACT_READY"

});

/********************************************************************
 * DOCUMENT CATEGORIES
 ********************************************************************/

const DOCUMENT_CATEGORY = Object.freeze({

    REQUIRED: "REQUIRED",

    RECOMMENDED: "RECOMMENDED",

    OPTIONAL: "OPTIONAL"

});

/********************************************************************
 * CONFIDENCE LEVELS
 ********************************************************************/

const CONFIDENCE_LEVEL = Object.freeze({

    LOW: "LOW",

    MEDIUM: "MEDIUM",

    HIGH: "HIGH",

    VERY_HIGH: "VERY_HIGH"

});

/********************************************************************
 * SECTION 2
 * Configuration
 ********************************************************************/

/**
 * Default configuration for the Blueprint Intelligence Engine™
 *
 * These values control the behaviour of the engine.
 * They DO NOT contain blueprint knowledge or business rules.
 */

const DEFAULT_BIE_CONFIG = Object.freeze({

    /**
     * Enable detailed console logging.
     */
    debug: false,

    /**
     * Automatically save engine state.
     */
    autoSave: true,

    /**
     * Automatically publish events.
     */
    autoPublishEvents: true,

    /**
     * Minimum confidence (%) required
     * before an Executive Analysis can begin.
     */
    confidenceThreshold: 80,

    /**
     * Maximum number of recommended
     * documents shown to the user.
     */
    maxRecommendedDocuments: 20,

    /**
     * Prefix used when generating
     * Analysis Session IDs.
     */
    sessionPrefix: "ANL",

    /**
     * Version information.
     */
    version: BIE_VERSION,

    /**
     * Engine name.
     */
    engineName: BIE_ENGINE_NAME

});

/********************************************************************
 * SECTION 3
 * Engine State
 ********************************************************************/

/**
 * Creates the default Blueprint Intelligence Engine™ state.
 *
 * Every new analysis session starts from this state.
 * This function should NEVER be modified directly.
 * Always use resetState() to create a new session.
 */

function createInitialBIEState() {

    const timestamp = new Date().toISOString();

    return {

        /**
         * Engine Information
         */
        initialized: false,

        status: BIE_STATUS.CREATED,

        version: BIE_VERSION,

        engineName: BIE_ENGINE_NAME,

        /**
         * Analysis Session
         */
        sessionId: null,

        createdAt: timestamp,

        updatedAt: timestamp,

        /**
         * Blueprint Selection
         */
        selectedBlueprint: null,

        executiveObjective: null,

        /**
         * Document Requirements
         */
        requiredDocuments: [],

        recommendedDocuments: [],

        optionalDocuments: [],

        /**
         * Uploaded Documents
         */
        uploadedDocuments: [],

        /**
         * Confidence
         */
        predictedConfidence: 0,

        confidenceLevel: CONFIDENCE_LEVEL.LOW,

        /**
         * Analysis
         */
        analysisContract: null,

        /**
         * Engine Metadata
         */
        metadata: {}

    };

}

/**
 * The active engine state.
 *
 * This is the single source of truth
 * for the Blueprint Intelligence Engine™.
 */

let bieState = createInitialBIEState();

/**
 * Returns the current engine state.
 */

function getBIEState() {

    return bieState;

}

/**
 * Replaces the current engine state.
 */

function setBIEState(newState) {

    bieState = {

        ...newState,

        updatedAt: new Date().toISOString()

    };

}

/**
 * Resets the engine state.
 */

function resetBIEState() {

    bieState = createInitialBIEState();

    return bieState;

}
/**
 * Creates a defensive deep copy of BIE-owned runtime data.
 *
 * Prevents external consumers from mutating internal engine state.
 *
 * @param {*} value
 * @returns {*}
 */
function cloneBIEValue(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return value;

    }

    if (
        typeof structuredClone === "function"
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

/********************************************************************
 * SECTION 4
 * Logger
 ********************************************************************/

/**
 * Blueprint Intelligence Engine™ Logger
 *
 * All engine logging should pass through this object.
 * This makes it easy to redirect logs later to databases,
 * monitoring tools, or enterprise logging systems.
 */

const BIELogger = {

    /**
     * Generic logger
     */
    log(level, message, data = null) {

        const timestamp = new Date().toISOString();

        const logEntry = {
            timestamp,
            engine: BIE_ENGINE_NAME,
            version: BIE_VERSION,
            level,
            message,
            data
        };

        if (!DEFAULT_BIE_CONFIG.debug &&
            level === BIE_LOG_LEVEL.DEBUG) {
            return;
        }

        console.log(logEntry);

    },

    /**
     * Debug
     */
    debug(message, data = null) {

        this.log(BIE_LOG_LEVEL.DEBUG, message, data);

    },

    /**
     * Information
     */
    info(message, data = null) {

        this.log(BIE_LOG_LEVEL.INFO, message, data);

    },

    /**
     * Warning
     */
    warning(message, data = null) {

        this.log(BIE_LOG_LEVEL.WARNING, message, data);

    },

    /**
     * Error
     */
    error(message, data = null) {

        this.log(BIE_LOG_LEVEL.ERROR, message, data);

    }

};

/********************************************************************
 * SECTION 5
 * Event Bus
 ********************************************************************/

/**
 * Blueprint Intelligence Engine™
 * Internal Event Bus
 *
 * Provides publish / subscribe communication
 * between independent modules.
 */

const BIEEventBus = {

    /**
     * Registered event listeners.
     */
    listeners: new Map(),

    /**
     * Subscribe to an event.
     *
     * @param {string} eventName
     * @param {Function} callback
     */
    subscribe(eventName, callback) {

        if (typeof callback !== "function") {

            BIELogger.error(
                "Event subscription requires a callback function.",
                { eventName }
            );

            return false;

        }

        if (!this.listeners.has(eventName)) {

            this.listeners.set(eventName, []);

        }

        this.listeners.get(eventName).push(callback);

        BIELogger.debug("Subscribed to event.", {

            event: eventName

        });

        return true;

    },

    /**
     * Remove an event listener.
     *
     * @param {string} eventName
     * @param {Function} callback
     */
    unsubscribe(eventName, callback) {

        if (!this.listeners.has(eventName)) {

            return false;

        }

        const updatedListeners = this.listeners
            .get(eventName)
            .filter(listener => listener !== callback);

        this.listeners.set(eventName, updatedListeners);

        return true;

    },

    /**
     * Publish an event.
     *
     * @param {string} eventName
     * @param {Object} payload
     */
    publish(eventName, payload = {}) {

        BIELogger.info("Publishing event.", {

            event: eventName,

            payload

        });

        if (!this.listeners.has(eventName)) {

            return;

        }

        this.listeners
            .get(eventName)
            .forEach(listener => {

                try {

                    listener(payload);

                }

                catch (error) {

                    BIELogger.error(

                        "Event listener failed.",

                        {

                            event: eventName,

                            error

                        }

                    );

                }

            });

    },

    /**
     * Remove all listeners.
     */
    clear() {

        this.listeners.clear();

        BIELogger.info("Event bus cleared.");

    }

};

/********************************************************************
 * SECTION 6
 * Session Manager
 ********************************************************************/

/**
 * Blueprint Intelligence Engine™
 * Session Manager
 *
 * Responsible for creating and managing
 * Executive Analysis Sessions.
 */

const BIESessionManager = {

    /**
     * Creates a unique Analysis Session ID.
     *
     * Example:
     * ANL-20260706-101530-483
     */
    generateSessionId() {

        const now = new Date();

        const yyyy = now.getFullYear();

        const mm = String(now.getMonth() + 1).padStart(2, "0");

        const dd = String(now.getDate()).padStart(2, "0");

        const hh = String(now.getHours()).padStart(2, "0");

        const min = String(now.getMinutes()).padStart(2, "0");

        const ss = String(now.getSeconds()).padStart(2, "0");

        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");

        return `${DEFAULT_BIE_CONFIG.sessionPrefix}-${yyyy}${mm}${dd}-${hh}${min}${ss}-${random}`;

    },

    /**
     * Starts a new Executive Analysis Session.
     */
    createSession() {

        const state = getBIEState();

        const sessionId = this.generateSessionId();

        state.sessionId = sessionId;

        state.createdAt = new Date().toISOString();

        state.updatedAt = state.createdAt;

        state.status = BIE_STATUS.INITIALIZED;

        state.initialized = true;

        setBIEState(state);

        BIELogger.info(

            "Analysis Session Created.",

            {

                sessionId

            }

        );

        BIEEventBus.publish(

            BIE_EVENTS.INITIALIZED,

            {

                sessionId

            }

        );

        return sessionId;

    },

    /**
     * Returns the active session ID.
     */
    getSessionId() {

        return getBIEState().sessionId;

    },

    /**
     * Determines whether an active session exists.
     */
    hasActiveSession() {

        return getBIEState().sessionId !== null;

    },

    /**
     * Closes the active session.
     */
    closeSession() {

        const state = getBIEState();

        BIELogger.info(

            "Analysis Session Closed.",

            {

                sessionId: state.sessionId

            }

        );

        resetBIEState();

    }

};
/********************************************************************
 * SECTION 6.1
 * Blueprint Knowledge Base Integration
 ********************************************************************/

/**
 * Attached Blueprint Knowledge Base service.
 *
 * BIE stores only the service reference.
 * Canonical blueprint knowledge remains owned exclusively by BKB.
 */
let bieBlueprintKnowledgeBase = null;


/**
 * Validates the minimum BKB API required by BIE.
 *
 * @param {*} candidate
 * @returns {Boolean}
 */
function isValidBKBService(candidate) {

    return Boolean(

        candidate &&

        typeof candidate === "object" &&

        typeof candidate.getBlueprint === "function" &&

        typeof candidate.hasBlueprint === "function" &&

        typeof candidate.listBlueprints === "function" &&

        typeof candidate.getLifecycleState === "function"

    );

}

/********************************************************************
 * SECTION 7
 * Public API
 ********************************************************************/

/**
 * Blueprint Intelligence Engine™
 * Public API
 *
 * This is the only interface that external
 * modules should use to communicate with BIE.
 */

const BIE = {

    /**
     * Returns engine information.
     */
    getVersion() {

        return BIE_VERSION;

    },

    getEngineName() {

        return BIE_ENGINE_NAME;

    },
/**
 * Attaches the qualified Blueprint Knowledge Base.
 */
attachBlueprintKnowledgeBase(knowledgeBase) {

    if (
        !isValidBKBService(
            knowledgeBase
        )
    ) {

        return false;

    }

    bieBlueprintKnowledgeBase =
        knowledgeBase;

    return true;

},


/**
 * Returns the attached Blueprint Knowledge Base service.
 */
getBlueprintKnowledgeBase() {

    return bieBlueprintKnowledgeBase;

},

    /**
     * Returns current engine state.
     */
    getState() {

    return cloneBIEValue(
        getBIEState()
    );

},

    /**
     * Creates a new Analysis Session.
     */
    initialize() {

        return BIESessionManager.createSession();

    },

    /**
     * Resets the engine.
     */
    reset() {

        BIESessionManager.closeSession();

        return BIESessionManager.createSession();

    },

    /**
     * Returns current Session ID.
     */
    getSessionId() {

        return BIESessionManager.getSessionId();

    },

    /**
     * Returns TRUE if a session exists.
     */
    hasActiveSession() {

        return BIESessionManager.hasActiveSession();

    },

    /**
     * Event subscription.
     */
    on(eventName, callback) {

        return BIEEventBus.subscribe(eventName, callback);

    },

    /**
     * Event unsubscription.
     */
    off(eventName, callback) {

        return BIEEventBus.unsubscribe(eventName, callback);

    },

    /**
     * Publish an event.
     */
    emit(eventName, payload = {}) {

        return BIEEventBus.publish(eventName, payload);

    }

};

/********************************************************************
 * SECTION 8
 * Engine Lifecycle
 ********************************************************************/

/**
 * Starts the Blueprint Intelligence Engine™.
 */
BIE.start = function () {

    const state =
        getBIEState();

    if (
        state.status ===
            BIE_STATUS.RUNNING
    ) {

        return true;

    }

    if (
        state.status !==
            BIE_STATUS.INITIALIZED &&
        state.status !==
            BIE_STATUS.STOPPED
    ) {

        return false;

    }

    if (
        !isValidBKBService(
            bieBlueprintKnowledgeBase
        )
    ) {

        return false;

    }

    state.status =
        BIE_STATUS.RUNNING;

    state.updatedAt =
        new Date().toISOString();

    setBIEState(
        state
    );

    BIELogger.info(
        "Blueprint Intelligence Engine started."
    );

    BIEEventBus.publish(
        BIE_EVENTS.STARTED,
        {

            sessionId:
                state.sessionId

        }
    );

    return true;

};

/**
 * Stops the Blueprint Intelligence Engine™.
 */
BIE.stop = function () {

    const state =
        getBIEState();

    if (
        state.status !==
            BIE_STATUS.RUNNING
    ) {

        return false;

    }

    state.status =
        BIE_STATUS.STOPPED;

    state.updatedAt =
        new Date().toISOString();

    setBIEState(
        state
    );

    BIELogger.info(
        "Blueprint Intelligence Engine stopped."
    );

    BIEEventBus.publish(
        BIE_EVENTS.STOPPED,
        {

            sessionId:
                state.sessionId

        }
    );

    return true;

};

/**
 * Destroys the engine.
 */
BIE.destroy = function () {

    BIELogger.info("Destroying Blueprint Intelligence Engine.");

    BIEEventBus.clear();

    resetBIEState();

    const state = getBIEState();

    state.status = BIE_STATUS.DESTROYED;

    setBIEState(state);

    BIEEventBus.publish(BIE_EVENTS.DESTROYED);

    return true;

};

/**
 * Returns the current engine status.
 */
BIE.getStatus = function () {

    return getBIEState().status;

};

/**
 * Returns TRUE if the engine is running.
 */
BIE.isRunning = function () {

    return getBIEState().status === BIE_STATUS.RUNNING;

};
/********************************************************************
 * SECTION 9
 * Global Runtime Registration
 ********************************************************************/

/**
 * Exposes the existing singleton runtime.
 *
 * BIE is retained as the implementation identity.
 * BlueprintIntelligenceEngine is the formal public runtime identity.
 */
if (
    typeof globalThis !==
        "undefined"
) {

    globalThis.BIE =
        BIE;

    globalThis.BlueprintIntelligenceEngine =
        BIE;

}
