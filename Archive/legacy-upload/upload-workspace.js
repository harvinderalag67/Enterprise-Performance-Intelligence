/********************************************************************
 * Enterprise Performance Intelligence™
 *
 * Upload Workspace™ (UW™)
 *
 * Version : 1.0.0 RC1
 * Status  : Foundation
 ********************************************************************/

"use strict";

/********************************************************************
 * SECTION 1
 * Constants
 ********************************************************************/

/**
 * Module Information
 */
const UW_VERSION = "1.0.0 RC1";

const UW_MODULE_NAME = "Upload Workspace™";

const UW_STATUS = "FOUNDATION";

/**
 * Log Levels
 */
const UW_LOG_LEVEL = Object.freeze({

    DEBUG: "DEBUG",

    INFO: "INFO",

    WARNING: "WARNING",

    ERROR: "ERROR"

});

/**
 * Lifecycle
 */
const UW_LIFECYCLE = Object.freeze({

    UNINITIALIZED: "UNINITIALIZED",

    INITIALIZED: "INITIALIZED",

    RUNNING: "RUNNING",

    STOPPED: "STOPPED",

    DESTROYED: "DESTROYED"

});

/**
 * Upload Status
 */
const UW_UPLOAD_STATUS = Object.freeze({

    PENDING: "PENDING",

    UPLOADING: "UPLOADING",

    COMPLETE: "COMPLETE",

    FAILED: "FAILED",

    CANCELLED: "CANCELLED"

});

/**
 * Supported File Types
 */
const UW_FILE_TYPE = Object.freeze({

    PDF: "PDF",

    WORD: "WORD",

    EXCEL: "EXCEL",

    POWERPOINT: "POWERPOINT",

    CSV: "CSV",

    IMAGE: "IMAGE",

    TEXT: "TEXT",

    UNKNOWN: "UNKNOWN"

});
/********************************************************************
 * SECTION 2
 * Configuration
 ********************************************************************/

const DEFAULT_UW_CONFIG = Object.freeze({

    /**
     * Module
     */
    version: UW_VERSION,

    moduleName: UW_MODULE_NAME,

    /**
     * Runtime
     */
    debug: false,

    /**
     * Upload Limits
     */
    maxSessions: 25,

    maxFilesPerSession: 500,

    maxFileSizeMB: 250,

    /**
     * Allowed Extensions
     */
    allowedExtensions: [

        "pdf",

        "doc",

        "docx",

        "xls",

        "xlsx",

        "ppt",

        "pptx",

        "csv",

        "txt",

        "png",

        "jpg",

        "jpeg"

    ],

    /**
     * Logging
     */
    logLevel: UW_LOG_LEVEL.INFO

});

/**
 * Runtime State
 */

let uwLifecycleState =
    UW_LIFECYCLE.UNINITIALIZED;

let uwConfiguration = {

    ...DEFAULT_UW_CONFIG

};
/********************************************************************
 * SECTION 3
 * Data Models
 ********************************************************************/

/********************************************************************
 * SECTION 3.1
 * Upload Session Model
 ********************************************************************/

/**
 * Standard Upload Session
 */
const UW_UPLOAD_SESSION_TEMPLATE = Object.freeze({

    sessionId: null,

    createdAt: null,

    updatedAt: null,

    status: UW_LIFECYCLE.UNINITIALIZED,

    fileCount: 0,

    files: []

});

/**
 * Creates a new upload session.
 *
 * @returns {Object}
 */
function createUploadSession() {

    const now = new Date().toISOString();

    return {

        sessionId: crypto.randomUUID(),

        createdAt: now,

        updatedAt: now,

        status: UW_LIFECYCLE.INITIALIZED,

        fileCount: 0,

        files: []

    };

}
/********************************************************************
 * SECTION 3.2
 * Uploaded File Model
 ********************************************************************/

/**
 * Standard Uploaded File
 */
const UW_UPLOADED_FILE_TEMPLATE = Object.freeze({

    fileId: null,

    sessionId: null,

    name: null,

    extension: null,

    type: UW_FILE_TYPE.UNKNOWN,

    size: 0,

    mimeType: null,

    uploadedAt: null,

    status: UW_UPLOAD_STATUS.PENDING,

    validationErrors: []

});

/**
 * Creates a new uploaded file model.
 *
 * @param {File} file
 * @param {String} sessionId
 * @returns {Object}
 */
function createUploadedFile(file, sessionId) {

    return {

        fileId: crypto.randomUUID(),

        sessionId,

        name: file?.name ?? null,

        extension: file?.name?.split(".").pop().toLowerCase() ?? null,

        type: UW_FILE_TYPE.UNKNOWN,

        size: file?.size ?? 0,

        mimeType: file?.type ?? null,

        uploadedAt: new Date().toISOString(),

        status: UW_UPLOAD_STATUS.PENDING,

        validationErrors: []

    };

}
/********************************************************************
 * SECTION 3.3
 * Upload Queue Model
 ********************************************************************/

/**
 * Standard Upload Queue Item
 */
const UW_UPLOAD_QUEUE_ITEM_TEMPLATE = Object.freeze({

    queueId: null,

    sessionId: null,

    fileId: null,

    priority: 1,

    status: UW_UPLOAD_STATUS.PENDING,

    queuedAt: null,

    startedAt: null,

    completedAt: null,

    retryCount: 0

});

/**
 * Creates a new upload queue item.
 *
 * @param {String} sessionId
 * @param {String} fileId
 * @returns {Object}
 */
function createUploadQueueItem(sessionId, fileId) {

    return {

        queueId: crypto.randomUUID(),

        sessionId,

        fileId,

        priority: 1,

        status: UW_UPLOAD_STATUS.PENDING,

        queuedAt: new Date().toISOString(),

        startedAt: null,

        completedAt: null,

        retryCount: 0

    };

}

/********************************************************************
 * SECTION 4
 * Workspace Store
 ********************************************************************/

/********************************************************************
 * SECTION 4.1
 * Session Store
 ********************************************************************/

/**
 * Internal Session Store
 *
 * Key   : sessionId
 * Value : Upload Session
 */
const sessionStore = new Map();

/**
 * Session Store Manager
 */
const SessionStore = {

    /**
     * Adds a session.
     *
     * @param {Object} session
     * @returns {Boolean}
     */
    addSession(session) {

        if (!session || !session.sessionId) {

            return false;

        }

        sessionStore.set(
            session.sessionId,
            session
        );

        return true;

    },

    /**
     * Retrieves a session.
     *
     * @param {String} sessionId
     * @returns {Object|null}
     */
    getSession(sessionId) {

        return sessionStore.get(sessionId) || null;

    },

    /**
     * Checks whether a session exists.
     *
     * @param {String} sessionId
     * @returns {Boolean}
     */
    hasSession(sessionId) {

        return sessionStore.has(sessionId);

    },

    /**
     * Removes a session.
     *
     * @param {String} sessionId
     * @returns {Boolean}
     */
    removeSession(sessionId) {

        return sessionStore.delete(sessionId);

    },

    /**
     * Returns all sessions.
     *
     * @returns {Array}
     */
    listSessions() {

        return Array.from(
            sessionStore.values()
        );

    },

    /**
     * Returns the number of sessions.
     *
     * @returns {Number}
     */
    countSessions() {

        return sessionStore.size;

    },

    /**
     * Clears the session store.
     *
     * @returns {Boolean}
     */
    clearSessions() {

        sessionStore.clear();

        return true;

    }

};
/********************************************************************
 * SECTION 4.2
 * File Store
 ********************************************************************/

/**
 * Internal File Store
 *
 * Key   : fileId
 * Value : Uploaded File
 */
const fileStore = new Map();

/**
 * File Store Manager
 */
const FileStore = {

    /**
     * Adds a file.
     *
     * @param {Object} uploadedFile
     * @returns {Boolean}
     */
    addFile(uploadedFile) {

        if (!uploadedFile || !uploadedFile.fileId) {

            return false;

        }

        fileStore.set(
            uploadedFile.fileId,
            uploadedFile
        );

        return true;

    },

    /**
     * Retrieves a file.
     *
     * @param {String} fileId
     * @returns {Object|null}
     */
    getFile(fileId) {

        return fileStore.get(fileId) || null;

    },

    /**
     * Checks whether a file exists.
     *
     * @param {String} fileId
     * @returns {Boolean}
     */
    hasFile(fileId) {

        return fileStore.has(fileId);

    },

    /**
     * Removes a file.
     *
     * @param {String} fileId
     * @returns {Boolean}
     */
    removeFile(fileId) {

        return fileStore.delete(fileId);

    },

    /**
     * Returns all uploaded files.
     *
     * @returns {Array}
     */
    listFiles() {

        return Array.from(
            fileStore.values()
        );

    },

    /**
     * Returns all files belonging
     * to a specific session.
     *
     * @param {String} sessionId
     * @returns {Array}
     */
    getFilesBySession(sessionId) {

        return this.listFiles().filter(

            file =>

                file.sessionId === sessionId

        );

    },

    /**
     * Returns the number of files.
     *
     * @returns {Number}
     */
    countFiles() {

        return fileStore.size;

    },

    /**
     * Clears the file store.
     *
     * @returns {Boolean}
     */
    clearFiles() {

        fileStore.clear();

        return true;

    }

};
/********************************************************************
 * SECTION 4.3
 * Queue Store
 ********************************************************************/

/**
 * Internal Upload Queue Store
 *
 * Key   : queueId
 * Value : Upload Queue Item
 */
const queueStore = new Map();

/**
 * Queue Store Manager
 */
const QueueStore = {

    /**
     * Adds a queue item.
     *
     * @param {Object} queueItem
     * @returns {Boolean}
     */
    addQueueItem(queueItem) {

        if (!queueItem || !queueItem.queueId) {

            return false;

        }

        queueStore.set(
            queueItem.queueId,
            queueItem
        );

        return true;

    },

    /**
     * Retrieves a queue item.
     *
     * @param {String} queueId
     * @returns {Object|null}
     */
    getQueueItem(queueId) {

        return queueStore.get(queueId) || null;

    },

    /**
     * Checks whether a queue item exists.
     *
     * @param {String} queueId
     * @returns {Boolean}
     */
    hasQueueItem(queueId) {

        return queueStore.has(queueId);

    },

    /**
     * Removes a queue item.
     *
     * @param {String} queueId
     * @returns {Boolean}
     */
    removeQueueItem(queueId) {

        return queueStore.delete(queueId);

    },

    /**
     * Returns all queue items.
     *
     * @returns {Array}
     */
    listQueueItems() {

        return Array.from(queueStore.values()).sort(

    (a, b) => {

        if (a.priority !== b.priority) {

            return b.priority - a.priority;

        }

        return new Date(a.queuedAt) - new Date(b.queuedAt);

    }

);

    },

    /**
     * Returns queue items belonging
     * to a specific session.
     *
     * @param {String} sessionId
     * @returns {Array}
     */
    getQueueBySession(sessionId) {

        return this.listQueueItems().filter(

            item =>

                item.sessionId === sessionId

        );

    },

    /**
     * Returns all pending queue items.
     *
     * @returns {Array}
     */
    getPendingQueueItems() {

        return this.listQueueItems().filter(

            item =>

                item.status === UW_UPLOAD_STATUS.PENDING

        );

    },

    /**
     * Returns queue size.
     *
     * @returns {Number}
     */
    countQueueItems() {

        return queueStore.size;

    },

    /**
     * Clears the queue.
     *
     * @returns {Boolean}
     */
    clearQueue() {

        queueStore.clear();

        return true;

    }

};
/********************************************************************
 * SECTION 5
 * Upload Manager
 ********************************************************************/

const UploadManager = {

    /**
     * Creates a new upload session.
     *
     * @returns {Object}
     */
    createSession() {

        const session =
            createUploadSession();

        SessionStore.addSession(
            session
        );

        return session;

    }

};
