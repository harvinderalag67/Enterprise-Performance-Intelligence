/******************************************************************************
 * ============================================================================
 * Enterprise Performance Intelligence™
 * ============================================================================
 *
 * Module          : FIPE-2
 * Component       : Financial Workbook Reader™
 * File            : workbook-reader.js
 *
 * Release         : RC1
 * Version         : 1.0.0
 *
 * PURPOSE
 *
 * Reads Microsoft Excel workbooks (.xlsx/.xls) and converts them into the
 * Enterprise Performance Intelligence™ Unified Document Model.
 *
 * SHALL
 *
 * ✓ Read XLSX
 * ✓ Read XLS
 * ✓ Read worksheets
 * ✓ Preserve sheet order
 * ✓ Preserve merged cells
 * ✓ Preserve formulas
 * ✓ Preserve comments
 * ✓ Preserve hyperlinks
 * ✓ Preserve workbook metadata
 *
 ******************************************************************************/

"use strict";
const WORKBOOK_READER_INFO = Object.freeze({

    module: "FIPE-2",

    component: "Financial Workbook Reader",

    version: "1.0.0",

    release: "RC1"

});
const WorkbookReaderStatus = Object.freeze({

    IDLE: "Idle",

    LOADING: "Loading",

    READING: "Reading",

    COMPLETED: "Completed",

    FAILED: "Failed"

});
class WorkbookLogger {

    static info(...args) {

        console.info("[Workbook]", ...args);

    }

    static warn(...args) {

        console.warn("[Workbook]", ...args);

    }

    static error(...args) {

        console.error("[Workbook]", ...args);

    }

}
class FinancialWorkbookReader {

    constructor() {

        this.status = WorkbookReaderStatus.IDLE;

        this.workbook = null;

        this.model = null;

    }
        async read(file) {

        this.status = WorkbookReaderStatus.LOADING;

        WorkbookLogger.info(

            "Loading Workbook:",

            file.name

        );

        const buffer = await file.arrayBuffer();

        this.workbook = XLSX.read(buffer, {

            type: "array",

            cellFormula: true,

            cellStyles: true,

            cellDates: true,

            cellNF: true,

            cellHTML: false

        });

        this.model = createDocumentModel();

        this.model.fileName = file.name;

        this.model.fileType = "workbook";

        this.model.size = file.size;

        this.model.metadata = this.readMetadata();

        this.readSheets();

        this.status = WorkbookReaderStatus.COMPLETED;

        return this.model;

    }
        readMetadata() {

        return {

            sheetCount: this.workbook.SheetNames.length,

            sheetNames: [...this.workbook.SheetNames],

            properties: this.workbook.Props || {},

            customProperties: this.workbook.Custprops || {}

        };

    }
        readSheets() {

        this.workbook.SheetNames.forEach(

            sheetName => {

                const worksheet =

                    this.workbook.Sheets[sheetName];

                const json =

                    XLSX.utils.sheet_to_json(

                        worksheet,

                        {

                            header: 1,

                            raw: true,

                            defval: null

                        }

                    );

                this.model.workbook.push({

                    name: sheetName,

                    rows: json

                });

            }

        );

    }
    }
    window.WorkbookReader =

    new FinancialWorkbookReader();
    