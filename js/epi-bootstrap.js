/********************************************************************
 * ENTERPRISE PERFORMANCE INTELLIGENCE™
 * EPI APPLICATION BOOTSTRAP
 *
 * FILE:
 * epi-bootstrap.js
 *
 * VERSION:
 * 1.0.0 RC1
 *
 * MVP RESPONSIBILITY:
 *
 * 1. Confirm required runtime components exist.
 * 2. Load the canonical PB-001–PB-012 registry.
 * 3. Initialize and start the Blueprint Knowledge Base.
 * 4. Register exactly the 12 canonical blueprints into BKB.
 * 5. Verify canonical registry integrity.
 * 6. Attach the qualified BKB singleton to BIE.
 * 7. Initialize and start the BIE runtime.
 * 8. Expose bootstrap status for qualification.
 *
 * THIS FILE DOES NOT:
 *
 * - define canonical blueprints
 * - duplicate blueprint semantics
 * - select blueprints
 * - perform financial analysis
 * - perform AI reasoning
 * - calculate confidence
 * - generate executive intelligence
 * - render reports
 *
 * CANONICAL BLUEPRINT AUTHORITY:
 *
 * /config/canonical-blueprints-v2.0.0.json
 *
 ********************************************************************/


/********************************************************************
 * SECTION 1
 * Bootstrap Identity
 ********************************************************************/

const EPI_BOOTSTRAP_IDENTITY = Object.freeze({

    name:
        "EPI_APPLICATION_BOOTSTRAP",

    version:
        "1.0.0 RC1"

});


/********************************************************************
 * SECTION 2
 * Bootstrap Status
 ********************************************************************/

const EPI_BOOTSTRAP_STATUS = Object.freeze({

    CREATED:
        "CREATED",

    RUNNING:
        "RUNNING",

    COMPLETE:
        "COMPLETE",

    FAILED:
        "FAILED"

});


/********************************************************************
 * SECTION 3
 * Canonical Source
 ********************************************************************/

const EPI_CANONICAL_BLUEPRINT_SOURCE =
    "./config/canonical-blueprints-v2.0.0.json";


const EPI_EXPECTED_BLUEPRINT_IDS =
    Object.freeze(

        Array.from(

            {
                length:
                    12
            },

            (_, index) =>

                `PB-${String(
                    index + 1
                ).padStart(
                    3,
                    "0"
                )}`

        )

    );


/********************************************************************
 * SECTION 4
 * Internal Bootstrap State
 ********************************************************************/

let epiBootstrapState = {

    status:
        EPI_BOOTSTRAP_STATUS.CREATED,

    startedAt:
        null,

    completedAt:
        null,

    failedAt:
        null,

    canonicalSource:
        EPI_CANONICAL_BLUEPRINT_SOURCE,

    canonicalBlueprintCount:
        0,

    registeredBlueprintCount:
        0,

    registeredBlueprintIds:
        [],

    bkbLifecycle:
        null,

    bieStatus:
        null,

    bkbAttachedToBIE:
    false,

bkbAttachedToAnalysisContract:
    false,

error:
    null

};


let epiBootstrapPromise =
    null;


/********************************************************************
 * SECTION 5
 * Utilities
 ********************************************************************/

/**
 * Defensive clone for bootstrap-owned data.
 *
 * @param {*} value
 * @returns {*}
 */
function cloneEPIBootstrapValue(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return value;

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


/**
 * Returns sorted unique values.
 *
 * @param {Array} values
 * @returns {Array}
 */
function getUniqueSortedValues(values) {

    return Array.from(

        new Set(
            values
        )

    ).sort();

}


/**
 * Confirms exact PB-001–PB-012 identity set.
 *
 * @param {Array} ids
 * @returns {Boolean}
 */
function hasExactCanonicalBlueprintIds(ids) {

    if (
        !Array.isArray(
            ids
        )
    ) {

        return false;

    }


    const actual =
        getUniqueSortedValues(
            ids
        );


    const expected =
        Array.from(
            EPI_EXPECTED_BLUEPRINT_IDS
        ).sort();


    return (

        actual.length ===
            12 &&

        JSON.stringify(
            actual
        ) ===
            JSON.stringify(
                expected
            )

    );

}


/**
 * Resolves canonical blueprint array from the canonical registry.
 *
 * No semantic transformation is performed.
 *
 * @param {Object} registry
 * @returns {Array|null}
 */
function getCanonicalBlueprintArray(
    registry
) {

    if (
        !registry ||
        typeof registry !==
            "object"
    ) {

        return null;

    }


    if (
        !Array.isArray(
            registry.blueprints
        )
    ) {

        return null;

    }


    return registry.blueprints;

}


/********************************************************************
 * SECTION 6
 * Runtime Dependency Resolution
 ********************************************************************/

/**
 * Returns the globally exposed BKB singleton.
 *
 * @returns {Object|null}
 */
function getEPIBootstrapBKB() {

    const candidate =
        globalThis
            ?.BlueprintKnowledgeBase;


    if (
        !candidate ||
        typeof candidate !==
            "object"
    ) {

        return null;

    }


    return candidate;

}


/**
 * Returns the globally exposed BIE singleton.
 *
 * @returns {Object|null}
 */
function getEPIBootstrapBIE() {

    const candidate =

        globalThis
            ?.BlueprintIntelligenceEngine ||

        globalThis
            ?.BIE;


    if (
        !candidate ||
        typeof candidate !==
            "object"
    ) {

        return null;

    }


    return candidate;

}


/********************************************************************
 * SECTION 7
 * BKB API Qualification
 ********************************************************************/

/**
 * Confirms the minimum BKB API required by bootstrap.
 *
 * @param {*} bkb
 * @returns {Boolean}
 */
function hasRequiredBKBAPI(bkb) {

    const requiredMethods = [

        "initialize",

        "start",

        "registerBlueprint",

        "getBlueprint",

        "hasBlueprint",

        "listBlueprints",

        "validateBlueprint",

        "getLifecycleState"

    ];


    return Boolean(

        bkb &&

        requiredMethods.every(

            method =>

                typeof bkb[method] ===
                    "function"

        )

    );

}


/********************************************************************
 * SECTION 8
 * BIE API Qualification
 ********************************************************************/

/**
 * Confirms the minimum BIE API required by bootstrap.
 *
 * @param {*} bie
 * @returns {Boolean}
 */
function hasRequiredBIEAPI(bie) {

    const requiredMethods = [

        "initialize",

        "start",

        "getStatus",

        "attachBlueprintKnowledgeBase",

        "getBlueprintKnowledgeBase"

    ];


    return Boolean(

        bie &&

        requiredMethods.every(

            method =>

                typeof bie[method] ===
                    "function"

        )

    );

}


/********************************************************************
 * SECTION 9
 * Canonical Registry Loader
 ********************************************************************/

/**
 * Loads the canonical blueprint registry.
 *
 * @returns {Promise<Object>}
 */
async function loadCanonicalBlueprintRegistry() {

    const response =
        await fetch(

            EPI_CANONICAL_BLUEPRINT_SOURCE,

            {
                cache:
                    "no-store"
            }

        );


    if (
        !response.ok
    ) {

        throw new Error(

            `Canonical blueprint registry load failed. HTTP ${response.status}.`

        );

    }


    const registry =
        await response.json();


    const blueprints =
        getCanonicalBlueprintArray(
            registry
        );


    if (
        !blueprints
    ) {

        throw new Error(

            "Canonical blueprint registry does not contain a valid blueprints array."

        );

    }


    if (
        blueprints.length !==
            12
    ) {

        throw new Error(

            `Canonical blueprint registry must contain exactly 12 blueprints. Found ${blueprints.length}.`

        );

    }


    const ids =
        blueprints.map(

            blueprint =>
                blueprint?.id

        );


    if (
        !hasExactCanonicalBlueprintIds(
            ids
        )
    ) {

        throw new Error(

            "Canonical blueprint registry does not contain exactly PB-001 through PB-012."

        );

    }


    return {

        registry,

        blueprints

    };

}


/********************************************************************
 * SECTION 10
 * BKB Lifecycle Bootstrap
 ********************************************************************/

/**
 * Ensures BKB is initialized and running.
 *
 * @param {Object} bkb
 * @returns {String}
 */
function ensureBKBRunning(bkb) {

    let lifecycle =
        bkb.getLifecycleState();


    if (
        lifecycle ===
            "UNINITIALIZED"
    ) {

        const initializeResult =
            bkb.initialize();


        if (
            initializeResult ===
                false
        ) {

            throw new Error(

                "BKB initialization failed."

            );

        }


        lifecycle =
            bkb.getLifecycleState();

    }


    if (
        lifecycle ===
            "INITIALIZED"
    ) {

        const startResult =
            bkb.start();


        if (
            startResult ===
                false
        ) {

            throw new Error(

                "BKB start failed."

            );

        }


        lifecycle =
            bkb.getLifecycleState();

    }


    if (
        lifecycle !==
            "RUNNING"
    ) {

        throw new Error(

            `BKB is not RUNNING. Current lifecycle: ${String(
                lifecycle
            )}.`

        );

    }


    return lifecycle;

}


/********************************************************************
 * SECTION 11
 * Controlled Canonical Registration
 ********************************************************************/

/**
 * Registers the canonical PB-001–PB-012 set into BKB.
 *
 * Existing canonical IDs are verified rather than duplicated.
 *
 * @param {Object} bkb
 * @param {Array} blueprints
 * @returns {Object}
 */
function registerCanonicalBlueprints(
    bkb,
    blueprints
) {

    for (
        const blueprint of
        blueprints
    ) {

        const validation =
            bkb.validateBlueprint(
                blueprint
            );


        if (
            !validation ||
            validation.valid !==
                true
        ) {

            const errors =
                Array.isArray(
                    validation?.errors
                )
                    ? validation.errors.join(
                        "; "
                    )
                    : "Unknown validation error";


            throw new Error(

                `BKB validation failed for ${blueprint?.id}: ${errors}`

            );

        }


        const alreadyExists =
            bkb.hasBlueprint(
                blueprint.id
            );


        if (
            alreadyExists
        ) {

            const existing =
                bkb.getBlueprint(
                    blueprint.id
                );


            if (
                !existing ||
                existing.id !==
                    blueprint.id ||
                existing.canonicalQuestion !==
                    blueprint.canonicalQuestion
            ) {

                throw new Error(

                    `Existing BKB record does not match canonical identity for ${blueprint.id}.`

                );

            }


            continue;

        }


        const registerResult =
            bkb.registerBlueprint(
                blueprint
            );


        if (
            registerResult !==
                true
        ) {

            throw new Error(

                `BKB registration failed for ${blueprint.id}.`

            );

        }

    }


    const registered =
        bkb.listBlueprints();


    if (
        !Array.isArray(
            registered
        )
    ) {

        throw new Error(

            "BKB listBlueprints() did not return an array."

        );

    }


    const registeredIds =
        registered.map(

            blueprint =>
                blueprint?.id

        );


    if (
        registered.length !==
            12 ||
        !hasExactCanonicalBlueprintIds(
            registeredIds
        )
    ) {

        throw new Error(

            "BKB registry integrity failed after canonical registration."

        );

    }


    return {

        count:
            registered.length,

        ids:
            getUniqueSortedValues(
                registeredIds
            )

    };

}
/********************************************************************
 * SECTION 11.1
 * Blueprint Analysis Contract Attachment
 ********************************************************************/

/**
 * Attaches the canonical BKB singleton to the
 * Blueprint Selection + Analysis Contract layer.
 *
 * BKB remains the sole canonical blueprint knowledge owner.
 *
 * @param {Object} bkb
 * @returns {Boolean}
 */
function attachBKBToBlueprintAnalysisContract(
    bkb
) {

    const analysisContractLayer =
        globalThis
            ?.BlueprintAnalysisContract;


    if (
        !analysisContractLayer ||
        typeof analysisContractLayer !==
            "object"
    ) {

        throw new Error(

            "Blueprint Analysis Contract runtime is unavailable."

        );

    }


    if (
        typeof analysisContractLayer
            .attachBlueprintKnowledgeBase !==
            "function" ||

        typeof analysisContractLayer
            .getBlueprintKnowledgeBase !==
            "function"
    ) {

        throw new Error(

            "Blueprint Analysis Contract runtime does not expose the required BKB attachment API."

        );

    }


    const attachmentResult =
        analysisContractLayer
            .attachBlueprintKnowledgeBase(
                bkb
            );


    if (
        attachmentResult !==
            true
    ) {

        throw new Error(

            "Blueprint Analysis Contract layer rejected Blueprint Knowledge Base attachment."

        );

    }


    if (
        analysisContractLayer
            .getBlueprintKnowledgeBase() !==
            bkb
    ) {

        throw new Error(

            "Blueprint Analysis Contract/BKB service identity reconciliation failed."

        );

    }


    return true;

}

/********************************************************************
 * SECTION 12
 * BIE Attachment and Lifecycle
 ********************************************************************/

/**
 * Attaches BKB to BIE and ensures BIE is initialized and running.
 *
 * @param {Object} bie
 * @param {Object} bkb
 * @returns {Object}
 */
function ensureBIERunning(
    bie,
    bkb
) {

    const attachmentResult =
        bie.attachBlueprintKnowledgeBase(
            bkb
        );


    if (
        attachmentResult !==
            true
    ) {

        throw new Error(

            "BIE rejected Blueprint Knowledge Base attachment."

        );

    }


    if (
        bie.getBlueprintKnowledgeBase() !==
            bkb
    ) {

        throw new Error(

            "BIE/BKB service identity reconciliation failed."

        );

    }


    let status =
        bie.getStatus();


    if (
        status ===
            "CREATED"
    ) {

        const initializeResult =
            bie.initialize();


        if (
            typeof initializeResult !==
                "string" ||
            initializeResult.length ===
                0
        ) {

            throw new Error(

                "BIE initialization failed to create a valid analysis session."

            );

        }


        status =
            bie.getStatus();

    }


    if (
        status ===
            "INITIALIZED" ||
        status ===
            "STOPPED"
    ) {

        const startResult =
            bie.start();


        if (
            startResult !==
                true
        ) {

            throw new Error(

                "BIE start failed."

            );

        }


        status =
            bie.getStatus();

    }


    if (
        status !==
            "RUNNING"
    ) {

        throw new Error(

            `BIE is not RUNNING. Current status: ${String(
                status
            )}.`

        );

    }


    return {

        status,

        attached:
            bie.getBlueprintKnowledgeBase() ===
                bkb

    };

}


/********************************************************************
 * SECTION 13
 * Main Bootstrap
 ********************************************************************/

/**
 * Executes the minimal EPI MVP bootstrap.
 *
 * Idempotent at the bootstrap-call level.
 *
 * @returns {Promise<Object>}
 */
async function runEPIBootstrap() {

    if (
        epiBootstrapPromise
    ) {

        return epiBootstrapPromise;

    }


    epiBootstrapPromise =
        (async function () {

            epiBootstrapState.status =
                EPI_BOOTSTRAP_STATUS.RUNNING;

            epiBootstrapState.startedAt =
                new Date().toISOString();

            epiBootstrapState.completedAt =
                null;

            epiBootstrapState.failedAt =
                null;

            epiBootstrapState.error =
                null;


            try {

                /*
                 * Resolve runtime dependencies.
                 */

                const bkb =
                    getEPIBootstrapBKB();

                const bie =
                    getEPIBootstrapBIE();


                if (
                    !hasRequiredBKBAPI(
                        bkb
                    )
                ) {

                    throw new Error(

                        "Required Blueprint Knowledge Base runtime is unavailable."

                    );

                }


                if (
                    !hasRequiredBIEAPI(
                        bie
                    )
                ) {

                    throw new Error(

                        "Required Blueprint Intelligence Engine runtime is unavailable."

                    );

                }


                /*
                 * Load canonical semantic authority.
                 */

                const {

                    registry,
                    blueprints

                } =
                    await loadCanonicalBlueprintRegistry();


                epiBootstrapState
                    .canonicalBlueprintCount =
                        blueprints.length;


                /*
                 * Ensure BKB lifecycle.
                 */

                const bkbLifecycle =
                    ensureBKBRunning(
                        bkb
                    );


                /*
 * Register canonical PB-001–PB-012.
 */

const registration =
    registerCanonicalBlueprints(

        bkb,
        blueprints

    );


/*
 * Attach the same canonical BKB singleton to the
 * Blueprint Selection + Analysis Contract layer.
 */

const analysisContractAttachment =
    attachBKBToBlueprintAnalysisContract(
        bkb
    );


/*
 * Attach BKB to BIE and start BIE.
 */

const bieRuntime =
    ensureBIERunning(

        bie,
        bkb

    );


                /*
                 * Final reconciliation.
                 */

                epiBootstrapState
                    .registeredBlueprintCount =
                        registration.count;

                epiBootstrapState
                    .registeredBlueprintIds =
                        registration.ids;

                epiBootstrapState
                    .bkbLifecycle =
                        bkbLifecycle;

                epiBootstrapState
                    .bieStatus =
                        bieRuntime.status;

                epiBootstrapState
    .bkbAttachedToBIE =
        bieRuntime.attached;

epiBootstrapState
    .bkbAttachedToAnalysisContract =
        analysisContractAttachment ===
            true;

epiBootstrapState
    .status =
        EPI_BOOTSTRAP_STATUS.COMPLETE;

                epiBootstrapState
                    .completedAt =
                        new Date().toISOString();


                return {

                    success:
                        true,

                    bootstrap:
                        cloneEPIBootstrapValue(
                            epiBootstrapState
                        ),

                    canonicalContract:
                        registry?.contract
                            ? cloneEPIBootstrapValue(
                                registry.contract
                            )
                            : null

                };

            }

            catch (error) {

                epiBootstrapState.status =
                    EPI_BOOTSTRAP_STATUS.FAILED;

                epiBootstrapState.failedAt =
                    new Date().toISOString();

                epiBootstrapState.error = {

                    name:
                        error?.name ||
                        "Error",

                    message:
                        error?.message ||
                        String(error)

                };


                console.error(

                    "EPI BOOTSTRAP FAILED:",

                    epiBootstrapState.error

                );


                return {

                    success:
                        false,

                    bootstrap:
                        cloneEPIBootstrapValue(
                            epiBootstrapState
                        )

                };

            }

        })();


    return epiBootstrapPromise;

}


/********************************************************************
 * SECTION 14
 * Public Bootstrap API
 ********************************************************************/

const EPIBootstrap = Object.freeze({

    getVersion() {

        return EPI_BOOTSTRAP_IDENTITY
            .version;

    },


    getStatus() {

        return epiBootstrapState
            .status;

    },


    getState() {

        return cloneEPIBootstrapValue(
            epiBootstrapState
        );

    },


    run() {

        return runEPIBootstrap();

    }

});


/********************************************************************
 * SECTION 15
 * Global Exposure
 ********************************************************************/

if (
    typeof globalThis !==
        "undefined"
) {

    globalThis.EPIBootstrap =
        EPIBootstrap;

}


/********************************************************************
 * SECTION 16
 * Automatic Application Bootstrap
 *
 * Runs after this script is loaded.
 *
 * Required dependency scripts must therefore appear before
 * epi-bootstrap.js in index.html.
 ********************************************************************/

runEPIBootstrap()
    .then(

        result => {

            if (
                result?.success ===
                    true
            ) {

                console.log(

                    "EPI BOOTSTRAP COMPLETE:",

                    result.bootstrap

                );

            }

        }

    )
    .catch(

        error => {

            console.error(

                "EPI BOOTSTRAP UNHANDLED ERROR:",

                error

            );

        }

    );


/********************************************************************
 * END — EPI APPLICATION BOOTSTRAP
 ********************************************************************/
