/*=============================================================================
    Enterprise Performance Intelligence™
    Landing Page Controller
    ---------------------------------------------------------------------------
    Module:
        Section 3A
        Executive Diagnostic Blueprints™

    Version:
        RC1

    Copyright:
        Hargun Intelligence Compass™

=============================================================================*/

"use strict";

/*=============================================================================
    LOGGER
=============================================================================*/

class LandingLogger {

    static info(message) {

        console.log(

            `%c[EPI Landing] ${message}`,

            "color:#1D4ED8;font-weight:600;"

        );

    }

    static warn(message) {

        console.warn(

            `[EPI Landing] ${message}`

        );

    }

}

/*=============================================================================
    EXECUTIVE BLUEPRINT IDENTIFIERS
=============================================================================*/

const BlueprintIds = Object.freeze({

    EBITDA: "PB-001",

    PROFIT: "PB-002",

    REVENUE: "PB-003",

    CASH: "PB-004",

    CUSTOMER: "PB-005",

    BUSINESS_UNIT: "PB-006",

    OPERATING_COST: "PB-007",

    INVESTMENT: "PB-008",

    RISK: "PB-009",

    PRIORITY: "PB-010"

});

/*=============================================================================
    LANDING PAGE CONTROLLER
=============================================================================*/

class LandingPageController {

    constructor() {

        this.selectedBlueprint = null;

        this.blueprintCards = [];

        this.initialize();

    }

    /*=========================================================================
        INITIALIZATION
    =========================================================================*/

    initialize() {

        LandingLogger.info(

            "Landing Page Controller initialized."

        );

        this.cacheBlueprintCards();

        this.attachBlueprintEvents();

        this.initializeAgreement();

        this.initializeUploadWorkspace();

        this.initializeProcessingConsole();

        this.initializePipelineEvents();

    }
    

    /*=========================================================================
        CACHE CARDS
    =========================================================================*/

    cacheBlueprintCards() {

        this.blueprintCards = [

            ...document.querySelectorAll(

                ".blueprint-card"

            )

        ];

        LandingLogger.info(

            `${this.blueprintCards.length} blueprint cards detected.`

        );

    }

    /*=========================================================================
        EVENT REGISTRATION
    =========================================================================*/

    attachBlueprintEvents() {

        this.blueprintCards.forEach(card => {

            card.addEventListener(

                "click",

                () => {

                    this.selectBlueprint(card);

                }

            );

        });

    }

    /*=========================================================================
        CARD SELECTION
    =========================================================================*/

    selectBlueprint(card) {

        this.clearSelection();

        card.classList.add(

            "selected"

        );

        this.selectedBlueprint =

            card.dataset.blueprint;

        sessionStorage.setItem(

            "selected_blueprint",

            this.selectedBlueprint

        );

        LandingLogger.info(

            `Blueprint Selected : ${this.selectedBlueprint}`

        );

        this.dispatchBlueprintSelected();

    }

    /*=========================================================================
        CLEAR CURRENT SELECTION
    =========================================================================*/

    clearSelection() {

        this.blueprintCards.forEach(card => {

            card.classList.remove(

                "selected"

            );

        });

    }

    /*=========================================================================
        EVENT DISPATCH
    =========================================================================*/

    dispatchBlueprintSelected() {

        document.dispatchEvent(

            new CustomEvent(

                "epi:blueprint-selected",

                {

                    detail: {

                        blueprint:

                            this.selectedBlueprint

                    }

                }

            )

        );

    }

    /*=========================================================================
        PUBLIC API
    =========================================================================*/

    getSelectedBlueprint() {

        return this.selectedBlueprint;

    }
/*=============================================================================
    EXECUTIVE CONFIDENTIALITY AGREEMENT
=============================================================================*/

initializeAgreement() {

    this.agreementBoxes = [

        document.getElementById("ack-authority"),

        document.getElementById("ack-confidentiality"),

        document.getElementById("ack-processing"),

        document.getElementById("ack-retention")

    ];

    this.continueButton =

        document.getElementById("continue-upload");

    if (

        !this.continueButton ||

        this.agreementBoxes.includes(null)

    ) {

        return;

    }

    this.agreementBoxes.forEach(box => {

        box.addEventListener(

            "change",

            () => this.validateAgreement()

        );

    });

}

validateAgreement() {

    const accepted =

        this.agreementBoxes.every(

            box => box.checked

        );

    this.continueButton.disabled = !accepted;

    if (accepted) {

        LandingLogger.info(

            "Executive Confidentiality Agreement accepted."

        );

        sessionStorage.setItem(

            "ndaAccepted",

            "true"

        );
    }

    }
/*=========================================================================
    UPLOAD WORKSPACE
=========================================================================*/

initializeUploadWorkspace() {

    this.uploadInput =
        document.getElementById("financial-file-input");

    this.dropZone =
        document.getElementById("upload-drop-zone");

    this.browseButton =
        document.getElementById("browse-files-button");

    if (
        !this.uploadInput ||
        !this.dropZone ||
        !this.browseButton
    ) {

        LandingLogger.warn(
            "Upload Workspace not found."
        );

        return;

    }

    this.browseButton.addEventListener(

        "click",

        () => this.uploadInput.click()

    );

    this.dropZone.addEventListener(

        "dragover",

        event => {

            event.preventDefault();

            this.dropZone.classList.add(
                "dragover"
            );

        }

    );

    this.dropZone.addEventListener(

        "dragleave",

        () => {

            this.dropZone.classList.remove(
                "dragover"
            );

        }

    );

    this.dropZone.addEventListener(

        "drop",

        event => {

            event.preventDefault();

            this.dropZone.classList.remove(
                "dragover"
            );

            this.handleSelectedFiles(
                event.dataTransfer.files
            );

        }

    );

    this.uploadInput.addEventListener(

        "change",

        event => {

            this.handleSelectedFiles(
                event.target.files
            );

        }

    );

    LandingLogger.info(
        "Upload Workspace initialized."
    );

}

/*=========================================================================
    HANDLE FILES
=========================================================================*/

handleSelectedFiles(fileList) {

    if (!fileList || !fileList.length) {

        LandingLogger.warn(
            "No files selected."
        );

        return;
    }

    this.renderUploadQueue(fileList);

    if (window.UploadManager) {

        window.UploadManager.addSelectedFiles(fileList);

    }
this.updateProcessingStep(

    "step-validation",

    "active"

);

    LandingLogger.info(

        `${fileList.length} document(s) selected.`

    );

}

renderUploadQueue(fileList) {

    const placeholder =
        document.getElementById(
            "queue-placeholder"
        );

    const container =
        document.getElementById(
            "queue-container"
        );

    const button = document.getElementById(
    "begin-analysis-button"
);

if (button) {

    button.addEventListener(

        "click",

        () => {

            if (
                window.UploadManager
            ) {

                window.UploadManager.begin();

            }

        }

    );

}

    if (
        !container ||
        !placeholder
    ) {
        return;
    }

    placeholder.style.display = "none";

    container.innerHTML = "";

    [...fileList].forEach(file => {

        const card = document.createElement("div");

        card.className = "document-card";

        card.innerHTML = `
            <div class="document-info">
                <div class="document-name">
                    ${file.name}
                </div>
                <div class="document-meta">
                    ${this.formatFileSize(file.size)}
                </div>
            </div>
            <div class="document-status">
                Ready
            </div>
        `;

        container.appendChild(card);

    });

    if (button) {
        button.disabled = false;
    }

}

formatFileSize(size) {

    if (typeof size !== "number" || size < 0) {
        return "0 KB";
    }

    const units = ["bytes", "KB", "MB", "GB", "TB"];
    let index = 0;
    let normalized = size;

    while (normalized >= 1024 && index < units.length - 1) {
        normalized /= 1024;
        index++;
    }

    return `${normalized.toFixed(1)} ${units[index]}`;

}
initializeProcessingConsole(){

    this.processingSteps = [

        "step-validation",
        "step-security",
        "step-reader",
        "step-extractor",
        "step-normalizer",
        "step-package",
        "step-ai",
        "step-report"

    ];

}

updateProcessingStep(stepId,status){

    const step=document.getElementById(stepId);

    if(!step){

        return;

    }

    step.classList.remove(

        "pending",

        "active",

        "completed"

    );

    step.classList.add(status);

}

    /*========================================================================= 
        FIPE EVENT SUBSCRIPTIONS
    =========================================================================*/

    initializePipelineEvents() {

        document.addEventListener(

            "epi:validation-complete",

            () => {

                this.updateProcessingStep(
                    "step-validation",
                    "completed"
                );

                this.updateProcessingStep(
                    "step-security",
                    "active"
                );

                if (window.UploadManager) {

                    window.UploadManager.on(

                        "processing:ready",

                        manifest => {

                            this.updateProcessingStep(
                                "step-validation",
                                "completed"
                            );

                            this.updateProcessingStep(
                                "step-security",
                                "completed"
                            );

                            this.updateProcessingStep(
                                "step-reader",
                                "active"
                            );

                            console.info(
                                "[Landing]",
                                "Upload ready for FIPE-2",
                                manifest
                            );

                        }

                    );

                }

            }

        );

        document.addEventListener(

            "epi:reader-complete",

            () => {

                this.updateProcessingStep(
                    "step-security",
                    "completed"
                );

                this.updateProcessingStep(
                    "step-reader",
                    "completed"
                );

                this.updateProcessingStep(
                    "step-extractor",
                    "active"
                );

            }

        );

        document.addEventListener(

            "epi:extractor-complete",

            () => {

                this.updateProcessingStep(
                    "step-extractor",
                    "completed"
                );

                this.updateProcessingStep(
                    "step-normalizer",
                    "active"
                );

            }

        );

        document.addEventListener(

            "epi:normalizer-complete",

            () => {

                this.updateProcessingStep(
                    "step-normalizer",
                    "completed"
                );

                this.updateProcessingStep(
                    "step-package",
                    "active"
                );

            }

        );

        document.addEventListener(

            "epi:package-complete",

            () => {

                this.updateProcessingStep(
                    "step-package",
                    "completed"
                );

                this.updateProcessingStep(
                    "step-ai",
                    "active"
                );

            }

        );

        document.addEventListener(

            "epi:analysis-complete",

            () => {

                this.updateProcessingStep(
                    "step-ai",
                    "completed"
                );

                this.updateProcessingStep(
                    "step-report",
                    "completed"
                );

            }

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

    }

}


/*=============================================================================
    APPLICATION BOOTSTRAP
=============================================================================*/

window.addEventListener(

    "DOMContentLoaded",

    () => {

        window.EPILanding =

            new LandingPageController();

    }
);

