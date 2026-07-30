/********************************************************************
 * Enterprise Performance Intelligence™
 *
 * Blueprint Knowledge Base™ (BKB™)
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

/**
 * Module Information
 */
const BKB_VERSION = "1.0.0 RC1";
const BKB_MODULE_NAME = "Blueprint Knowledge Base™";
const BKB_STATUS = "FOUNDATION";

/**
 * Log Levels
 */
const BKB_LOG_LEVEL = Object.freeze({
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR"
});

/**
 * Lifecycle Status
 */
const BKB_LIFECYCLE = Object.freeze({
    UNINITIALIZED: "UNINITIALIZED",
    INITIALIZED: "INITIALIZED",
    RUNNING: "RUNNING",
    STOPPED: "STOPPED",
    DESTROYED: "DESTROYED"
});

/**
 * Canonical Blueprint Categories
 *
 * These categories define the analytical domains used by the
 * canonical EPI Problem Blueprints PB-001 through PB-010.
 *
 * Source of truth:
 * config/canonical-blueprints-v2.0.0.json
 *
 * IMPORTANT:
 * Category vocabulary must remain aligned with the canonical
 * blueprint registry. Blueprint identity and executive-question
 * meaning remain governed by the canonical registry.
 */
const BKB_BLUEPRINT_CATEGORY = Object.freeze({

    PROFITABILITY:
        "PROFITABILITY",

    CASH_FLOW:
        "CASH_FLOW",

    ENTERPRISE_VALUE:
        "ENTERPRISE_VALUE",

    WORKING_CAPITAL:
        "WORKING_CAPITAL",

    COMMERCIAL:
        "COMMERCIAL",

    OPERATIONS:
        "OPERATIONS",

    GROWTH:
        "GROWTH",

    CAPITAL_ALLOCATION:
        "CAPITAL_ALLOCATION",

    RISK:
        "RISK",

    EXECUTIVE_ORCHESTRATION:
        "EXECUTIVE_ORCHESTRATION"

});

/**
 * Blueprint Status
 */
const BKB_BLUEPRINT_STATUS = Object.freeze({
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    ARCHIVED: "ARCHIVED",
    DEPRECATED: "DEPRECATED"
});

/**
 * Evidence Requirement
 */
const BKB_EVIDENCE_REQUIREMENT = Object.freeze({
    REQUIRED: "REQUIRED",
    RECOMMENDED: "RECOMMENDED",
    OPTIONAL: "OPTIONAL"
});

/**
 * Confidence Levels
 */
const BKB_CONFIDENCE_LEVEL = Object.freeze({
    VERY_LOW: "VERY_LOW",
    LOW: "LOW",
    MODERATE: "MODERATE",
    HIGH: "HIGH",
    VERY_HIGH: "VERY_HIGH"
});

/********************************************************************
 * SECTION 2
 * Configuration
 ********************************************************************/

const DEFAULT_BKB_CONFIG = Object.freeze({

    /**
     * Module
     */
    version: BKB_VERSION,
    moduleName: BKB_MODULE_NAME,

    /**
     * Runtime
     */
    debug: false,

    /**
     * Registry
     */
    autoRegister: true,
    validateOnRegister: true,
    allowDuplicateIds: false,

    /**
     * Blueprint Limits
     */
    maxBlueprints: 500,
    maxQuestionsPerBlueprint: 500,
    maxEvidenceItems: 500,

    /**
     * Version Control
     */
    enableVersioning: true,

    /**
     * Logging
     */
    logLevel: BKB_LOG_LEVEL.INFO

});

/**
 * Runtime State
 */
let bkbLifecycleState = BKB_LIFECYCLE.UNINITIALIZED;

let bkbConfiguration = {
    ...DEFAULT_BKB_CONFIG
};

/********************************************************************
 * SECTION 3
 * Blueprint Schema Definitions
 ********************************************************************/

/**
 * Blueprint Schema Version
 */
const BKB_SCHEMA_VERSION = "1.0.0";

/**
 * Blueprint Definition Schema
 */
const BLUEPRINT_SCHEMA = Object.freeze({

    id: null,

    name: null,

    category: null,

    description: null,

    version: "1.0.0",

    status: BKB_BLUEPRINT_STATUS.DRAFT,

    objectives: [],

    requiredEvidence: [],

    recommendedEvidence: [],

    optionalEvidence: [],

    confidenceRules: [],

    diagnosticQuestions: [],

    aiPromptTemplate: null,

    outputTemplate: null,

    metadata: {}

});

/********************************************************************
 * SECTION 4
 * Blueprint Registry
 ********************************************************************/
/********************************************************************
 * SECTION 4.1
 * Registry Store
 ********************************************************************/

/**
 * Internal Blueprint Registry
 *
 * Stores all registered blueprint definitions.
 * Key   : Blueprint ID
 * Value : Blueprint Object
 */
const blueprintRegistry = new Map();

/**
 * Creates a defensive deep copy of a blueprint value.
 *
 * Prevents external consumers from mutating canonical
 * registry-owned blueprint state through retrieval APIs.
 *
 * @param {*} value
 * @returns {*}
 */
function cloneBlueprintValue(value) {

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
 * SECTION 4.2
 * Blueprint Manager
 ********************************************************************/

const BlueprintManager = {

    /**
     * Initializes the Blueprint Knowledge Base.
     */

    registerBlueprint(blueprint) {

        if (!blueprint || !blueprint.id) {
            return false;
        }

        blueprintRegistry.set(blueprint.id, blueprint);

        return true;

    },

    /**
     * Remove Blueprint
     */
    removeBlueprint(blueprintId) {

        return blueprintRegistry.delete(blueprintId);

    },

    /**
     * Retrieve Blueprint
     */
    getBlueprint(blueprintId) {

    const blueprint =
        blueprintRegistry.get(
            blueprintId
        );

    if (
        blueprint === undefined
    ) {

        return null;

    }

    return cloneBlueprintValue(
        blueprint
    );

},

    /**
     * Check Blueprint Exists
     */
    hasBlueprint(blueprintId) {

        return blueprintRegistry.has(blueprintId);

    },

    /**
     * List All Blueprints
     */
    listBlueprints() {

    return Array.from(

        blueprintRegistry.values()

    ).map(

        blueprint =>

            cloneBlueprintValue(
                blueprint
            )

    );

},

    /**
     * Count Registered Blueprints
     */
    countBlueprints() {

        return blueprintRegistry.size;

    },

    /**
     * Clear Registry
     */
    clearRegistry() {

        blueprintRegistry.clear();

        return true;

    }

};
/********************************************************************
 * SECTION 4.3
 * Registry Statistics
 ********************************************************************/

const RegistryStatistics = {

    /**
     * Total Registered Blueprints
     */
    getTotalBlueprints() {

        return blueprintRegistry.size;

    },

    /**
     * Blueprint Status Statistics
     */
    getStatusCounts() {

        const counts = {};

        blueprintRegistry.forEach(blueprint => {

            const status = blueprint.status || "UNKNOWN";

            counts[status] = (counts[status] || 0) + 1;

        });

        return counts;

    },

    /**
     * Blueprint Category Statistics
     */
    getCategoryCounts() {

        const counts = {};

        blueprintRegistry.forEach(blueprint => {

            const category = blueprint.category || "UNCATEGORIZED";

            counts[category] = (counts[category] || 0) + 1;

        });

        return counts;

    },

    /**
     * Registry Summary
     */
    getSummary() {

        return {

            totalBlueprints: this.getTotalBlueprints(),

            statusCounts: this.getStatusCounts(),

            categoryCounts: this.getCategoryCounts()

        };

    }

};

/********************************************************************
 * SECTION 5
 * Validation Engine
 ********************************************************************/
/********************************************************************
 * SECTION 5.1
 * Validation Result Model
 ********************************************************************/

/**
 * Standard Validation Result
 *
 * Every validation routine within the Blueprint Knowledge Base™
 * returns an object based on this structure.
 */
const BKB_VALIDATION_RESULT_TEMPLATE = Object.freeze({

    valid: true,

    errors: [],

    warnings: []

});

/**
 * Creates a new validation result.
 *
 * Returns a fresh object so that validation operations never
 * modify the immutable template.
 */
function createValidationResult() {

    return {

        valid: BKB_VALIDATION_RESULT_TEMPLATE.valid,

        errors: [],

        warnings: []

    };

}
/********************************************************************
 * SECTION 5.2
 * Required Field Validation
 ********************************************************************/

const ValidationEngine = {

    /**
     * Validates mandatory blueprint fields.
     *
     * @param {Object} blueprint
     * @param {Object} result
     * @returns {Object}
     */
    validateRequiredFields(blueprint, result) {

        if (!blueprint || typeof blueprint !== "object") {

            result.valid = false;
            result.errors.push("Blueprint must be a valid object.");

            return result;

        }

        const requiredFields = [

            "id",
            "name",
            "category",
            "version",
            "status"

        ];

        requiredFields.forEach(field => {

            const value = blueprint[field];

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {

                result.valid = false;

                result.errors.push(
                    `Required field '${field}' is missing.`
                );

            }

        });

        return result;

    },

    /**
     * Validates blueprint structure.
     *
     * @param {Object} blueprint
     * @param {Object} result
     * @returns {Object}
     */
    validateStructure(blueprint, result) {

        const arrayFields = [

            "diagnosticQuestions",
            "requiredEvidence",
            "recommendedEvidence",
            "optionalEvidence",
            "confidenceRules"

        ];

        arrayFields.forEach(field => {

            if (
                blueprint[field] !== undefined &&
                !Array.isArray(blueprint[field])
            ) {

                result.valid = false;

                result.errors.push(
                    `'${field}' must be an array.`
                );

            }

        });

        if (
            blueprint.metadata !== undefined &&
            (
                typeof blueprint.metadata !== "object" ||
                Array.isArray(blueprint.metadata)
            )
        ) {

            result.valid = false;

            result.errors.push(
                "'metadata' must be an object."
            );

        }

               return result;

    },

    /**
     * Validates enumeration values.
     */
    validateEnumerations(blueprint, result) {
    
        if (

            blueprint.status !== undefined &&

            !Object.values(
                BKB_BLUEPRINT_STATUS
            ).includes(blueprint.status)

        ) {

            result.valid = false;

            result.errors.push(
                "Invalid blueprint status."
            );

        }

        if (

            blueprint.category !== undefined &&

            !Object.values(
                BKB_BLUEPRINT_CATEGORY
            ).includes(blueprint.category)

        ) {

            result.valid = false;

            result.errors.push(
                "Invalid blueprint category."
            );

        }

                return result;

    },

    /**
     * Validates an entire blueprint.
     *
     * Executes all validation stages and returns
     * a consolidated validation result.
     *
     * @param {Object} blueprint
     * @returns {Object}
     */
    validateBlueprint(blueprint) {

        const result = createValidationResult();

        this.validateRequiredFields(
            blueprint,
            result
        );

        this.validateStructure(
            blueprint,
            result
        );

        this.validateEnumerations(
            blueprint,
            result
        );

        return result;

    }

};

/********************************************************************
 * SECTION 6
 * Public API
 ********************************************************************/

const BlueprintKnowledgeBase = {

    /**
     * Initializes the Blueprint Knowledge Base.
     */
    initialize(config = {}) {

        bkbConfiguration = {

            ...DEFAULT_BKB_CONFIG,

            ...config

        };

        bkbLifecycleState =
            BKB_LIFECYCLE.INITIALIZED;

        return true;

    },
    /**
     * Starts the Blueprint Knowledge Base.
     *
     * @returns {Boolean}
     */
    start() {

        if (
            bkbLifecycleState !==
            BKB_LIFECYCLE.INITIALIZED
        ) {

            return false;

        }

        bkbLifecycleState =
            BKB_LIFECYCLE.RUNNING;

        return true;

    },
    /**
     * Stops the Blueprint Knowledge Base.
     *
     * @returns {Boolean}
     */
    stop() {

        if (
            bkbLifecycleState !==
            BKB_LIFECYCLE.RUNNING
        ) {

            return false;

        }

        bkbLifecycleState =
            BKB_LIFECYCLE.STOPPED;

        return true;

    },
    /**
     * Destroys the Blueprint Knowledge Base.
     *
     * @returns {Boolean}
     */
    destroy() {

        blueprintRegistry.clear();

        bkbConfiguration = {

            ...DEFAULT_BKB_CONFIG

        };

        bkbLifecycleState =
            BKB_LIFECYCLE.DESTROYED;

        return true;

    },
    /**
     * Registers a blueprint.
     */
    registerBlueprint(blueprint) {

        if (bkbConfiguration.validateOnRegister) {

            const validationResult = ValidationEngine.validateBlueprint(
                blueprint
            );

            if (!validationResult.valid) {
                return false;
            }

        }

        return BlueprintManager.registerBlueprint(
            blueprint
        );

    },

    /**
     * Removes a blueprint.
     *
     * @param {String} blueprintId
     * @returns {Boolean}
     */
    removeBlueprint(blueprintId) {

        return BlueprintManager.removeBlueprint(
            blueprintId
        );

    },

    /**
     * Retrieves a blueprint.
     *
     * @param {String} blueprintId
     * @returns {Object|null}
     */
    getBlueprint(blueprintId) {

        return BlueprintManager.getBlueprint(
            blueprintId
        );

    },

    /**
     * Checks whether a blueprint exists.
     *
     * @param {String} blueprintId
     * @returns {Boolean}
     */
    hasBlueprint(blueprintId) {

        return BlueprintManager.hasBlueprint(
            blueprintId
        );

    },

    /**
     * Returns all registered blueprints.
     *
     * @returns {Array}
     */
    listBlueprints() {

        return BlueprintManager.listBlueprints();

    },

    /**
     * Validates a blueprint.
     *
     * @param {Object} blueprint
     * @returns {Object}
     */
    validateBlueprint(blueprint) {

        return ValidationEngine.validateBlueprint(
            blueprint
        );

    },

    /**
     * Returns registry statistics.
     *
     * @returns {Object}
     */
    getStatistics() {

        return RegistryStatistics.getSummary();

    },

    /**
     * Clears the registry.
     *
     * @returns {Boolean}
     */
    clearRegistry() {

        return BlueprintManager.clearRegistry();

    },

    /**
     * Returns the module version.
     *
     * @returns {String}
     */
    getVersion() {

        return BKB_VERSION;

    },

    /********************************************************************
     * SECTION 7
     * Lifecycle
     ********************************************************************/
    /**
     * Returns the current lifecycle state.
     *
     * @returns {String}
     */
    getLifecycleState() {

        return bkbLifecycleState;

    },

    /**
     * Returns the active configuration.
     *
     * @returns {Object}
     */
    getConfiguration() {

        return {

            ...bkbConfiguration

        };

    }

};

/********************************************************************
 * SECTION 8
 * Module Export
 ********************************************************************/

window.BlueprintKnowledgeBase = BlueprintKnowledgeBase;
if (typeof module !== "undefined" && module.exports) {

    module.exports = BlueprintKnowledgeBase;

}
