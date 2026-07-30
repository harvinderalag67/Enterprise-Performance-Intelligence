/******************************************************************************
 * ============================================================================
 * Enterprise Performance Intelligence™
 * ============================================================================
 *
 * Module          : FIPE-2
 * Component       : Financial PDF Reader™
 * File            : pdf-reader.js
 *
 * Release         : RC1
 * Version         : 1.0.0
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Reads native PDF financial documents and converts them into a Unified
 * Document Model while preserving layout, tables, metadata and reading order.
 *
 * This module SHALL
 *
 * ✓ Read native PDF files
 * ✓ Extract metadata
 * ✓ Extract page text
 * ✓ Preserve page order
 * ✓ Preserve coordinates
 * ✓ Prepare for table extraction
 * ✓ Prepare for OCR fallback
 *
 ******************************************************************************/

"use strict";
const PDF_READER_INFO = Object.freeze({

    module: "FIPE-2",

    component: "Financial PDF Reader",

    version: "1.0.0",

    release: "RC1"

});
const PDFReaderStatus = Object.freeze({

    IDLE: "Idle",

    LOADING: "Loading",

    READING: "Reading",

    COMPLETED: "Completed",

    FAILED: "Failed"

});
class PDFLogger {

    static info(...args) {

        console.info("[PDF]", ...args);

    }

    static warn(...args) {

        console.warn("[PDF]", ...args);

    }

    static error(...args) {

        console.error("[PDF]", ...args);

    }

}
class FinancialPDFReader {

    constructor() {

        this.status = PDFReaderStatus.IDLE;

        this.document = null;

        this.model = null;

    }
        async read(file) {

        this.status = PDFReaderStatus.LOADING;

        PDFLogger.info(

            "Loading PDF:",

            file.name

        );

        const arrayBuffer =

            await file.arrayBuffer();

        const pdf =

            await pdfjsLib.getDocument({

                data: arrayBuffer

            }).promise;

        this.document = pdf;

        this.model = createDocumentModel();

        this.model.fileName = file.name;

        this.model.fileType = "pdf";

        this.model.size = file.size;

        this.model.metadata =

            await this.readMetadata();

        await this.readPages();

        this.status = PDFReaderStatus.COMPLETED;

        return this.model;

    }
        async readMetadata() {

        const metadata =

            await this.document.getMetadata();

        return {

            info: metadata.info,

            metadata: metadata.metadata

        };

    }
        async readPages() {

        for (

            let pageNumber = 1;

            pageNumber <= this.document.numPages;

            pageNumber++

        ) {

            const page =

                await this.document.getPage(

                    pageNumber

                );

            const content =

                await page.getTextContent();

            const pageModel = {

                pageNumber,

                text: "",

                items: []

            };

            content.items.forEach(item => {

                pageModel.text +=

                    item.str + " ";

                pageModel.items.push({

                    text: item.str,

                    x: item.transform[4],

                    y: item.transform[5],

                    width: item.width,

                    height: item.height

                });

            });

            this.model.pages.push(

                pageModel

            );

            this.model.extractedText +=

                pageModel.text + "\n";

        }

    }
    }
    window.PDFReader =

    new FinancialPDFReader();
    