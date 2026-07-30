/******************************************************************************
 * ============================================================================
 * Enterprise Performance Intelligence™
 * ============================================================================
 *
 * Module          : FIPE-2
 * Component       : Financial CSV Reader™
 * File            : csv-reader.js
 *
 * Release         : RC1
 * Version         : 1.0.0
 *
 * PURPOSE
 *
 * Reads CSV financial datasets and converts them into the Enterprise
 * Performance Intelligence™ Unified Document Model.
 *
 * SHALL
 *
 * ✓ Read CSV files
 * ✓ Detect delimiters
 * ✓ Preserve column headers
 * ✓ Preserve row order
 * ✓ Preserve data types
 * ✓ Preserve metadata
 * ✓ Produce Unified Document Model
 *
 ******************************************************************************/

"use strict";
const CSV_READER_INFO = Object.freeze({

    module: "FIPE-2",

    component: "Financial CSV Reader",

    version: "1.0.0",

    release: "RC1"

});
const CSVReaderStatus = Object.freeze({

    IDLE: "Idle",

    LOADING: "Loading",

    READING: "Reading",

    COMPLETED: "Completed",

    FAILED: "Failed"

});
class CSVLogger {

    static info(...args) {

        console.info("[CSV]", ...args);

    }

    static warn(...args) {

        console.warn("[CSV]", ...args);

    }

    static error(...args) {

        console.error("[CSV]", ...args);

    }

}
class FinancialCSVReader {

    constructor() {

        this.status = CSVReaderStatus.IDLE;

        this.model = null;

    }
        async read(file) {

        this.status = CSVReaderStatus.LOADING;

        CSVLogger.info(

            "Loading CSV:",

            file.name

        );

        const text = await file.text();

        this.model = createDocumentModel();

        this.model.fileName = file.name;

        this.model.fileType = "csv";

        this.model.size = file.size;

        this.model.metadata = this.readMetadata(text);

        this.model.workbook.push(

            this.readCSV(text)

        );

        this.status = CSVReaderStatus.COMPLETED;

        return this.model;

    }
        readMetadata(text) {

        const lines = text.split(/\r?\n/);

        return {

            rows: Math.max(lines.length - 1, 0),

            delimiter: this.detectDelimiter(lines[0] || ""),

            createdAt: new Date().toISOString()

        };

    }
        detectDelimiter(headerLine) {

        const delimiters = [

            ",",

            ";",

            "\t",

            "|"

        ];

        let bestDelimiter = ",";

        let highestCount = 0;

        delimiters.forEach(delimiter => {

            const count = headerLine.split(delimiter).length;

            if (count > highestCount) {

                highestCount = count;

                bestDelimiter = delimiter;

            }

        });

        return bestDelimiter;

    }
        readCSV(text) {

        const lines = text.split(/\r?\n/);

        const delimiter = this.detectDelimiter(lines[0]);

        const rows = lines
            .filter(line => line.trim() !== "")
            .map(line => line.split(delimiter));

        return {

            name: "CSV",

            delimiter,

            headers: rows.length > 0 ? rows[0] : [],

            rows: rows.slice(1)

        };

    }
    }
    window.CSVReader =

    new FinancialCSVReader();
    