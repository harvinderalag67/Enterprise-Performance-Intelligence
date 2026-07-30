"use strict";

/********************************************************************
 * EPI — BLUEPRINT SELECTION + ANALYSIS CONTRACT LAYER
 *
 * File:
 * blueprint-analysis-contract.js
 *
 * MVP Responsibility:
 *
 * 1. Resolve a canonical blueprint by:
 *      - Blueprint ID, or
 *      - Exact canonical executive question
 *
 * 2. Retrieve the authoritative blueprint exclusively from:
 *      BlueprintKnowledgeBase
 *
 * 3. Construct a defensive Analysis Contract for downstream:
 *      - Evidence binding
 *      - Confidence integration
 *      - Executive Intelligence Package
 *      - AI Reasoning
 *      - Executive Intelligence Brief
 *
 * Architectural Rules:
 *
 * - BKB remains the sole canonical blueprint knowledge owner.
 * - No blueprint registry is duplicated here.
 * - No PB semantics are hard-coded here.
 * - No financial calculations are performed here.
 * - No AI reasoning is performed here.
 * - No confidence scoring is performed here.
 * - No report generation is performed here.
 *
 * MVP STATUS:
 * Qualification Candidate
 ********************************************************************/


/********************************************************************
 * SECTION 1
 * Runtime Identity
 ********************************************************************/

const BLUEPRINT_ANALYSIS_CONTRACT_IDENTITY =
    Object.freeze({

        name:
            "EPI Blueprint Selection + Analysis Contract",

        version:
            "1.0.0 RC1",

        contractName:
            "EPI_BLUEPRINT_ANALYSIS_CONTRACT",

        contractVersion:
            "1.0.0"

    });


/********************************************************************
 * SECTION 2
 * Status Enumeration
 ********************************************************************/

const BLUEPRINT_ANALYSIS_CONTRACT_STATUS =
    Object.freeze({

        CREATED:
            "CREATED",

        READY:
            "READY",

        BLUEPRINT_SELECTED:
            "BLUEPRINT_SELECTED",

        CONTRACT_CREATED:
            "CONTRACT_CREATED",

        ERROR:
            "ERROR"

    });


/********************************************************************
 * SECTION 3
 * Internal Runtime State
 ********************************************************************/

let blueprintAnalysisContractStatus =
    BLUEPRINT_ANALYSIS_CONTRACT_STATUS.CREATED;

let attachedBlueprintKnowledgeBase =
    null;

let lastSelectedBlueprintId =
    null;

let lastAnalysisContract =
    null;


/********************************************************************
 * SECTION 4
 * Utility Functions
 ********************************************************************/

/**
 * Determine whether a value is a non-null object.
 */
function isBlueprintContractObject(value) {

    return (

        value !== null &&

        typeof value ===
            "object" &&

        !Array.isArray(value)

    );

}


/**
 * Deep clone plain blueprint / contract values.
 *
 * This implementation intentionally avoids transferring
 * ownership of BKB-returned structures to downstream consumers.
 */
function cloneBlueprintContractValue(value) {

    if (

        value === null ||

        typeof value !==
            "object"

    ) {

        return value;

    }


    if (
        Array.isArray(value)
    ) {

        return value.map(

            item =>
                cloneBlueprintContractValue(
                    item
                )

        );

    }


    const clone = {};


    Object.keys(value)
        .forEach(

            key => {

                clone[key] =
                    cloneBlueprintContractValue(
                        value[key]
                    );

            }

        );


    return clone;

}


/**
 * Recursively freezes an object or array.
 */
function deepFreezeBlueprintContract(value) {

    if (

        value === null ||

        typeof value !==
            "object" ||

        Object.isFrozen(value)

    ) {

        return value;

    }


    Object.getOwnPropertyNames(value)
        .forEach(

            propertyName => {

                const propertyValue =
                    value[propertyName];


                if (

                    propertyValue !== null &&

                    typeof propertyValue ===
                        "object"

                ) {

                    deepFreezeBlueprintContract(
                        propertyValue
                    );

                }

            }

        );


    return Object.freeze(value);

}


/**
 * Normalize string input for matching.
 *
 * Matching remains semantically strict:
 * only whitespace and surrounding-space normalization
 * are applied.
 */
function normalizeBlueprintSelectionText(value) {

    if (
        typeof value !==
            "string"
    ) {

        return "";

    }


    return value
        .trim()
        .replace(
            /\s+/g,
            " "
        );

}


/**
 * Return a defensive copy.
 */
function defensiveBlueprintContractCopy(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return value;
    }


    return cloneBlueprintContractValue(
        value
    );

}


/********************************************************************
 * SECTION 5
 * BKB Contract Validation
 ********************************************************************/

/**
 * Verify that a supplied object satisfies the minimum
 * Blueprint Knowledge Base public API required by this layer.
 */
function isQualifiedBlueprintKnowledgeBase(service) {

    return Boolean(

        service &&

        typeof service.getBlueprint ===
            "function" &&

        typeof service.hasBlueprint ===
            "function" &&

        typeof service.listBlueprints ===
            "function" &&

        typeof service.getLifecycleState ===
            "function"

    );

}


/********************************************************************
 * SECTION 6
 * Blueprint Selection
 ********************************************************************/

/**
 * Resolve a blueprint ID from either:
 *
 * - PB-001 style canonical ID
 * - Exact canonical executive question
 *
 * No semantic guessing or fuzzy matching is performed.
 */
function resolveCanonicalBlueprintId(
    selection
) {

    if (
        !attachedBlueprintKnowledgeBase
    ) {

        return null;

    }


    const normalizedSelection =
        normalizeBlueprintSelectionText(
            selection
        );


    if (
        !normalizedSelection
    ) {

        return null;

    }


    /*
     * Direct canonical ID resolution.
     */

    if (

        attachedBlueprintKnowledgeBase
            .hasBlueprint(
                normalizedSelection
            )

    ) {

        return normalizedSelection;

    }


    /*
     * Exact canonical executive-question resolution.
     */

    const blueprints =
        attachedBlueprintKnowledgeBase
            .listBlueprints();


    if (
        !Array.isArray(blueprints)
    ) {

        return null;

    }


    const matchedBlueprint =
        blueprints.find(

            blueprint => {

                const canonicalQuestion =
                    normalizeBlueprintSelectionText(

                        blueprint
                            ?.canonicalQuestion

                    );


                return (

                    canonicalQuestion ===
                        normalizedSelection

                );

            }

        );


    return (
        matchedBlueprint?.id ??
        null
    );

}


/********************************************************************
 * SECTION 7
 * Analysis Contract Builder
 ********************************************************************/

/**
 * Construct the downstream Analysis Contract exclusively from
 * the canonical blueprint retrieved from BKB.
 */
function buildCanonicalAnalysisContract(
    blueprint
) {

    if (
        !isBlueprintContractObject(
            blueprint
        )
    ) {

        return null;

    }


    const analysisContract = {

        contract: {

            name:
                BLUEPRINT_ANALYSIS_CONTRACT_IDENTITY
                    .contractName,

            version:
                BLUEPRINT_ANALYSIS_CONTRACT_IDENTITY
                    .contractVersion

        },


        blueprint: {

            id:
                blueprint.id,

            canonicalQuestion:
                blueprint.canonicalQuestion,

            name:
                blueprint.name ??
                null,

            category:
                blueprint.category,

            status:
                blueprint.status

        },


        objectives:
            cloneBlueprintContractValue(

                blueprint.objectives ??
                []

            ),


        evidence: {

            required:
                cloneBlueprintContractValue(

                    blueprint.requiredEvidence ??
                    []

                ),

            recommended:
                cloneBlueprintContractValue(

                    blueprint.recommendedEvidence ??
                    []

                ),

            optional:
                cloneBlueprintContractValue(

                    blueprint.optionalEvidence ??
                    []

                )

        },


        diagnostics: {

            questions:
                cloneBlueprintContractValue(

                    blueprint.diagnosticQuestions ??
                    []

                ),

            lenses:
                cloneBlueprintContractValue(

                    blueprint.diagnosticLenses ??
                    []

                )

        },


        confidence: {

            rules:
                cloneBlueprintContractValue(

                    blueprint.confidenceRules ??
                    []

                )

        },


        reasoningContext:
            cloneBlueprintContractValue(

                blueprint.reasoningContext ??
                null

            ),


        outputContract:
            cloneBlueprintContractValue(

                blueprint.outputContract ??
                null

            )

    };


    return deepFreezeBlueprintContract(
        analysisContract
    );

}


/********************************************************************
 * SECTION 8
 * Public Runtime
 ********************************************************************/

const BlueprintAnalysisContract = {


    /**
     * Runtime identity.
     */
    getVersion() {

        return (
            BLUEPRINT_ANALYSIS_CONTRACT_IDENTITY
                .version
        );

    },


    getName() {

        return (
            BLUEPRINT_ANALYSIS_CONTRACT_IDENTITY
                .name
        );

    },


    getStatus() {

        return blueprintAnalysisContractStatus;

    },


    /**
     * Attach the qualified canonical BKB singleton.
     */
    attachBlueprintKnowledgeBase(
        service
    ) {

        if (
            !isQualifiedBlueprintKnowledgeBase(
                service
            )
        ) {

            return false;

        }


        attachedBlueprintKnowledgeBase =
            service;


        blueprintAnalysisContractStatus =
            BLUEPRINT_ANALYSIS_CONTRACT_STATUS.READY;


        return true;

    },


    /**
     * Retrieve attached BKB identity.
     *
     * This intentionally returns the service singleton itself.
     * The BKB is a service dependency, not owned data.
     */
    getBlueprintKnowledgeBase() {

        return attachedBlueprintKnowledgeBase;

    },


    /**
     * Resolve selection without creating an Analysis Contract.
     */
    resolveBlueprintId(
        selection
    ) {

        return resolveCanonicalBlueprintId(
            selection
        );

    },


    /**
     * Select and defensively retrieve a canonical blueprint.
     */
    selectBlueprint(
        selection
    ) {

        const blueprintId =
            resolveCanonicalBlueprintId(
                selection
            );


        if (
            !blueprintId
        ) {

            return null;

        }


        const blueprint =
            attachedBlueprintKnowledgeBase
                .getBlueprint(
                    blueprintId
                );


        if (
            !blueprint
        ) {

            return null;

        }


        lastSelectedBlueprintId =
            blueprintId;


        blueprintAnalysisContractStatus =
            BLUEPRINT_ANALYSIS_CONTRACT_STATUS
                .BLUEPRINT_SELECTED;


        return defensiveBlueprintContractCopy(
            blueprint
        );

    },


    /**
     * Create an Analysis Contract from a PB ID
     * or exact canonical executive question.
     */
    createAnalysisContract(
        selection
    ) {

        const blueprintId =
            resolveCanonicalBlueprintId(
                selection
            );


        if (
            !blueprintId
        ) {

            return null;

        }


        const blueprint =
            attachedBlueprintKnowledgeBase
                .getBlueprint(
                    blueprintId
                );


        if (
            !blueprint
        ) {

            return null;

        }


        const contract =
            buildCanonicalAnalysisContract(
                blueprint
            );


        if (
            !contract
        ) {

            blueprintAnalysisContractStatus =
                BLUEPRINT_ANALYSIS_CONTRACT_STATUS
                    .ERROR;

            return null;

        }


        lastSelectedBlueprintId =
            blueprintId;


        /*
         * Store our own defensive internal copy.
         */
        lastAnalysisContract =
            cloneBlueprintContractValue(
                contract
            );


        deepFreezeBlueprintContract(
            lastAnalysisContract
        );


        blueprintAnalysisContractStatus =
            BLUEPRINT_ANALYSIS_CONTRACT_STATUS
                .CONTRACT_CREATED;


        /*
         * Return a separate defensive copy.
         */
        return defensiveBlueprintContractCopy(
            lastAnalysisContract
        );

    },


    /**
     * Retrieve last selected canonical blueprint ID.
     */
    getSelectedBlueprintId() {

        return lastSelectedBlueprintId;

    },


    /**
     * Retrieve last Analysis Contract defensively.
     */
    getLastAnalysisContract() {

        if (
            !lastAnalysisContract
        ) {

            return null;

        }


        return defensiveBlueprintContractCopy(
            lastAnalysisContract
        );

    },


    /**
     * Reset only this integration layer.
     *
     * Does not mutate BKB.
     * Does not mutate BIE.
     */
    reset() {

        lastSelectedBlueprintId =
            null;

        lastAnalysisContract =
            null;


        blueprintAnalysisContractStatus =

            attachedBlueprintKnowledgeBase

                ? BLUEPRINT_ANALYSIS_CONTRACT_STATUS
                    .READY

                : BLUEPRINT_ANALYSIS_CONTRACT_STATUS
                    .CREATED;


        return true;

    }

};


/********************************************************************
 * SECTION 9
 * Global Exposure
 ********************************************************************/

if (
    typeof globalThis !==
        "undefined"
) {

    globalThis
        .BlueprintAnalysisContract =
            BlueprintAnalysisContract;

}
