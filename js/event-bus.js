/**
 * ============================================================================
 * Enterprise Performance Intelligence™
 * ============================================================================
 *
 * Runtime Kernel
 *
 * File:
 *      event-bus.js
 *
 * Version:
 *      1.0.0
 *
 * Description:
 *      Production-grade publish/subscribe Event Bus used throughout the
 *      Enterprise Performance Intelligence Runtime Kernel.
 *
 * Responsibilities
 * ----------------
 * • Publish domain events
 * • Subscribe to events
 * • One-time subscriptions
 * • Wildcard subscriptions
 * • Event history
 * • Correlation IDs
 * • Runtime statistics
 * • Debug logging
 * • Error isolation
 * • Zero dependencies
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
     * ------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------
     */

    const VERSION = "1.0.0";

    const DEFAULT_HISTORY_SIZE = 1000;

    const WILDCARD_EVENT = "*";

    /**
     * ------------------------------------------------------------
     * EventBus
     * ------------------------------------------------------------
     */

    class EventBus {

        constructor(options = {}) {

            this.version = VERSION;

            this.debug = Boolean(options.debug);

            this.maxHistory =
                options.maxHistory || DEFAULT_HISTORY_SIZE;

            /**
             * Event Registry
             *
             * Map<
             *      EventName,
             *      Set<Listener>
             * >
             */

            this.registry = new Map();

            /**
             * Event History
             */

            this.history = [];

            /**
             * Runtime statistics
             */

            this.stats = {

                published: 0,

                delivered: 0,

                failed: 0,

                subscriptions: 0,

                unsubscriptions: 0

            };

        }

        /**
         * --------------------------------------------------------
         * Enable debug mode
         * --------------------------------------------------------
         */

        enableDebug() {

            this.debug = true;

            return this;

        }

        /**
         * --------------------------------------------------------
         * Disable debug mode
         * --------------------------------------------------------
         */

        disableDebug() {

            this.debug = false;

            return this;

        }

        /**
         * --------------------------------------------------------
         * Generate unique ID
         * --------------------------------------------------------
         */

        generateId(prefix = "evt") {

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
         * --------------------------------------------------------
         * Generate Event Envelope
         * --------------------------------------------------------
         */

        createEnvelope(type, payload = {}, source = "system") {

            return {

                id: this.generateId(),

                correlationId:
                    payload.correlationId ||
                    this.generateId("corr"),

                type,

                source,

                timestamp:
                    new Date().toISOString(),

                data:
                    payload.data !== undefined
                        ? payload.data
                        : payload

            };

        }
                /**
         * --------------------------------------------------------
         * Register Event Listener
         * --------------------------------------------------------
         *
         * @param {String} eventName
         * @param {Function} listener
         *
         * @returns {Function}
         */

        subscribe(eventName, listener) {

            if (

    typeof eventName !== "string" ||

    eventName.trim() === ""

) {

    throw new TypeError(

        "Event name must be a non-empty string."

    );

}

            if (typeof listener !== "function") {

                throw new TypeError(
                    "Listener must be a function."
                );

            }

            if (!this.registry.has(eventName)) {

                this.registry.set(
                    eventName,
                    new Set()
                );

            }

            this.registry
                .get(eventName)
                .add(listener);

            this.stats.subscriptions++;

            if (this.debug) {

                console.info(

                    "[EventBus] Subscribed:",

                    eventName

                );

            }

            /**
             * Return unsubscribe function
             */

            return () => {

                this.unsubscribe(
                    eventName,
                    listener
                );

            };

        }

        /**
         * --------------------------------------------------------
         * Register One-Time Listener
         * --------------------------------------------------------
         */

        once(eventName, listener) {

            if (typeof listener !== "function") {

                throw new TypeError(
                    "Listener must be a function."
                );

            }

            const wrapper = (event) => {

                this.unsubscribe(
                    eventName,
                    wrapper
                );

                listener(event);

            };

            return this.subscribe(
                eventName,
                wrapper
            );

        }

        /**
         * --------------------------------------------------------
         * Remove Event Listener
         * --------------------------------------------------------
         */

        unsubscribe(eventName, listener) {

            if (!this.registry.has(eventName)) {

                return false;

            }

            const listeners =
                this.registry.get(eventName);

            const removed =
                listeners.delete(listener);

            if (listeners.size === 0) {

                this.registry.delete(
                    eventName
                );

            }

            if (removed) {

                this.stats.unsubscriptions++;

                if (this.debug) {

                    console.info(

                        "[EventBus] Unsubscribed:",

                        eventName

                    );

                }

            }

            return removed;

        }

        /**
         * --------------------------------------------------------
         * Check if Event Exists
         * --------------------------------------------------------
         */

        hasEvent(eventName) {

            return this.registry.has(
                eventName
            );

        }

        /**
         * --------------------------------------------------------
         * Get Listener Count
         * --------------------------------------------------------
         */

        listenerCount(eventName) {

            if (!this.registry.has(eventName)) {

                return 0;

            }

            return this.registry
                .get(eventName)
                .size;

        }

        /**
         * --------------------------------------------------------
         * Return Registered Event Names
         * --------------------------------------------------------
         */

        events() {

            return Array.from(

                this.registry.keys()

            );

        }
                /**
         * --------------------------------------------------------
         * Publish Event
         * --------------------------------------------------------
         *
         * Publishes an event to all registered listeners.
         *
         * Processing sequence:
         *
         * 1. Create standardized event envelope
         * 2. Store event in history
         * 3. Deliver to specific listeners
         * 4. Deliver to wildcard listeners
         * 5. Update runtime statistics
         *
         * @param {String} type
         * @param {Object} payload
         * @param {String} source
         *
         * @returns {Object}
         */

        publish(type, payload = {}, source = "system") {

            if (

                typeof type !== "string" ||
                type.trim() === ""

) {

    throw new TypeError(

        "Event type must be a non-empty string."

    );

}

            const envelope =
                this.createEnvelope(
                    type,
                    payload,
                    source
                );

            this.stats.published++;

            this.addToHistory(envelope);

            if (this.debug) {

                console.groupCollapsed(

                    `[EventBus] ${type}`

                );

                console.log(envelope);

                console.groupEnd();

            }

            this.dispatch(
                type,
                envelope
            );

            this.dispatch(
                WILDCARD_EVENT,
                envelope
            );

            return envelope;

        }

        /**
         * --------------------------------------------------------
         * Internal Dispatcher
         * --------------------------------------------------------
         *
         * Executes listeners while isolating failures so
         * that one listener cannot interrupt the remainder
         * of the event pipeline.
         */

        dispatch(eventName, envelope) {

            const listeners =
                this.registry.get(eventName);

            if (!listeners) {

                return;

            }

            for (const listener of listeners) {

                try {

                    listener(envelope);

                    this.stats.delivered++;

                }

                catch (error) {

                    this.stats.failed++;

                    console.error(

                        "[EventBus] Listener Failure",

                        {

                            event:
                                eventName,

                            envelope,

                            error

                        }

                    );

                }

            }

        }

        /**
         * --------------------------------------------------------
         * Publish Async
         * --------------------------------------------------------
         *
         * Queues event publication in the JavaScript
         * microtask queue.
         */

        publishAsync(
            type,
            payload = {},
            source = "system"
        ) {

            return Promise.resolve()

                .then(() =>

                    this.publish(

                        type,

                        payload,

                        source

                    )

                );

        }

        /**
         * --------------------------------------------------------
         * Request / Response Pattern
         * --------------------------------------------------------
         *
         * Generates a correlation ID so downstream
         * modules can respond to the originating request.
         */

        request(
            type,
            data = {},
            source = "system"
        ) {

            const correlationId =
                this.generateId("corr");

            return this.publish(

                type,

                {

                    correlationId,

                    data

                },

                source

            );

        }
                /**
         * --------------------------------------------------------
         * Add Event to History
         * --------------------------------------------------------
         *
         * Maintains a bounded history of recently published events.
         * The oldest entries are discarded when the configured
         * history size is exceeded.
         *
         * @param {Object} envelope
         */

        addToHistory(envelope) {

            this.history.push(envelope);

            while (this.history.length > this.maxHistory) {

                this.history.shift();

            }

        }

        /**
         * --------------------------------------------------------
         * Get Event History
         * --------------------------------------------------------
         *
         * @param {Number|null} limit
         *
         * @returns {Array}
         */

        getHistory(limit = null) {

            if (
                limit === null ||
                limit >= this.history.length
            ) {

                return [...this.history];

            }

            return this.history.slice(-limit);

        }

        /**
         * --------------------------------------------------------
         * Clear Event History
         * --------------------------------------------------------
         */

        clearHistory() {

            this.history.length = 0;

            return this;

        }

        /**
         * --------------------------------------------------------
         * Retrieve Runtime Statistics
         * --------------------------------------------------------
         */

        getStats() {

            return {

                version: this.version,

                debug: this.debug,

                maxHistory: this.maxHistory,

                registeredEvents:
                    this.registry.size,

                historySize:
                    this.history.length,

                published:
                    this.stats.published,

                delivered:
                    this.stats.delivered,

                failed:
                    this.stats.failed,

                subscriptions:
                    this.stats.subscriptions,

                unsubscriptions:
                    this.stats.unsubscriptions

            };

        }

        /**
         * --------------------------------------------------------
         * Reset Runtime Statistics
         * --------------------------------------------------------
         */

        resetStats() {

            this.stats = {

                published: 0,

                delivered: 0,

                failed: 0,

                subscriptions: 0,

                unsubscriptions: 0

            };

            return this;

        }

        /**
         * --------------------------------------------------------
         * Determine Whether Event History Exists
         * --------------------------------------------------------
         */

        hasHistory() {

            return this.history.length > 0;

        }

        /**
         * --------------------------------------------------------
         * Get Most Recent Event
         * --------------------------------------------------------
         */

        latestEvent() {

            if (!this.history.length) {

                return null;

            }

            return this.history[
                this.history.length - 1
            ];

        }
                /**
         * --------------------------------------------------------
         * Clear Listeners
         * --------------------------------------------------------
         *
         * Removes listeners for a specific event or, when no
         * event name is supplied, removes all registered listeners.
         *
         * @param {String|null} eventName
         *
         * @returns {EventBus}
         */

        clear(eventName = null) {

            if (eventName === null) {

                this.registry.clear();

            } else {

                this.registry.delete(eventName);

            }

            return this;

        }

        /**
         * --------------------------------------------------------
         * Destroy Event Bus
         * --------------------------------------------------------
         *
         * Completely resets the runtime.
         *
         * @returns {EventBus}
         */

        destroy() {

            this.registry.clear();

            this.history.length = 0;

            this.resetStats();

            return this;

        }

        /**
         * --------------------------------------------------------
         * Export Runtime Snapshot
         * --------------------------------------------------------
         *
         * Produces a serializable snapshot that can be logged,
         * persisted, or inspected by diagnostic tools.
         *
         * @returns {Object}
         */

        snapshot() {

            return {

                version: this.version,

                debug: this.debug,

                timestamp:
                    new Date().toISOString(),

                events:
                    this.events(),

                statistics:
                    this.getStats(),

                history:
                    this.getHistory()

            };

        }

        /**
         * --------------------------------------------------------
         * Get Runtime State
         * --------------------------------------------------------
         *
         * Returns a lightweight summary of the current Event Bus.
         *
         * @returns {Object}
         */

        state() {

            return {

                version:
                    this.version,

                debug:
                    this.debug,

                registeredEvents:
                    this.registry.size,

                listenerCount:

                    Array.from(

                        this.registry.values()

                    ).reduce(

                        (count, listeners) =>

                            count + listeners.size,

                        0

                    ),

                historySize:
                    this.history.length

            };

        }

        /**
         * --------------------------------------------------------
         * Is Debug Enabled
         * --------------------------------------------------------
         */

        isDebugEnabled() {

            return this.debug;

        }

        /**
         * --------------------------------------------------------
         * Set Maximum History Size
         * --------------------------------------------------------
         *
         * @param {Number} size
         *
         * @returns {EventBus}
         */

        setHistorySize(size) {

            if (

                !Number.isInteger(size) ||

                size < 1

            ) {

                throw new TypeError(

                    "History size must be a positive integer."

                );

            }

            this.maxHistory = size;

            while (

                this.history.length >

                this.maxHistory

            ) {

                this.history.shift();

            }

            return this;

        }

        /**
         * --------------------------------------------------------
         * Get Maximum History Size
         * --------------------------------------------------------
         */

        getHistorySize() {

            return this.maxHistory;

        }
                /**
         * --------------------------------------------------------
         * Register Publish Observer
         * --------------------------------------------------------
         *
         * Registers a callback that is invoked every time an
         * event is published. This is implemented using the
         * wildcard event subscription.
         *
         * @param {Function} observer
         *
         * @returns {Function}
         */

        observe(observer) {

            return this.subscribe(

                WILDCARD_EVENT,

                observer

            );

        }

        /**
         * --------------------------------------------------------
         * Wait For Event
         * --------------------------------------------------------
         *
         * Returns a Promise that resolves the next time the
         * specified event is published.
         *
         * @param {String} eventName
         *
         * @returns {Promise<Object>}
         */

        waitFor(eventName) {

            return new Promise(resolve => {

                this.once(

                    eventName,

                    resolve

                );

            });

        }

        /**
         * --------------------------------------------------------
         * Log Runtime State
         * --------------------------------------------------------
         */

        logState() {

            console.group(

                "EventBus Runtime State"

            );

            console.table(

                this.state()

            );

            console.groupEnd();

            return this;

        }

        /**
         * --------------------------------------------------------
         * Log Runtime Statistics
         * --------------------------------------------------------
         */

        logStatistics() {

            console.group(

                "EventBus Statistics"

            );

            console.table(

                this.getStats()

            );

            console.groupEnd();

            return this;

        }

        /**
         * --------------------------------------------------------
         * Log Registered Events
         * --------------------------------------------------------
         */

        logEvents() {

            const rows = this.events().map(

                eventName => ({

                    event: eventName,

                    listeners:

                        this.listenerCount(

                            eventName

                        )

                })

            );

            console.group(

                "Registered Events"

            );

            console.table(rows);

            console.groupEnd();

            return this;

        }

        /**
         * --------------------------------------------------------
         * Dump Complete Runtime
         * --------------------------------------------------------
         *
         * Produces a comprehensive diagnostic object suitable
         * for troubleshooting or exporting.
         */

        dump() {

            return {

                version:

                    this.version,

                state:

                    this.state(),

                statistics:

                    this.getStats(),

                events:

                    this.events(),

                history:

                    this.getHistory()

            };

        }

        /**
         * --------------------------------------------------------
         * Health Check
         * --------------------------------------------------------
         *
         * Performs a lightweight validation of the runtime.
         */

        health() {

            return {

                healthy:

    this.registry instanceof Map &&

    Array.isArray(this.history),

                version:

                    this.version,

                timestamp:

                    new Date().toISOString(),

                registeredEvents:

                    this.registry.size,

                listenerCount:

                    Array.from(

                        this.registry.values()

                    ).reduce(

                        (total, listeners) =>

                            total +

                            listeners.size,

                        0

                    ),

                historySize:

                    this.history.length

            };

        }
            } // End EventBus class

    /**
     * ============================================================
     * Create Singleton Instance
     * ============================================================
     *
     * The Enterprise Performance Intelligence Runtime uses a
     * single Event Bus instance shared across every module.
     */

    const eventBus = new EventBus({

        debug: false,

        maxHistory: DEFAULT_HISTORY_SIZE

    });

    /**
     * ============================================================
     * Global Runtime Exposure
     * ============================================================
     */

    global.EventBus = eventBus;

    /**
     * ============================================================
     * Convenience Alias
     * ============================================================
     *
     * Short alias for cleaner module code.
     */

    global.events = eventBus;

    /**
     * ============================================================
     * Runtime Metadata
     * ============================================================
     */

    Object.defineProperty(

        global,

        "EventBusVersion",

        {

            value: VERSION,

            enumerable: true,

            configurable: false,

            writable: false

        }

    );

    /**
 * ============================================================
 * Runtime Initialization
 * ============================================================
 */

    /**
     * ============================================================
     * Startup Banner (Debug Mode Only)
     * ============================================================
     */

    if (eventBus.isDebugEnabled()) {

        console.group(

            "Enterprise Performance Intelligence™"

        );

        console.info(

            "Runtime Kernel Initialised"

        );

        console.info(

            "Module : Event Bus"

        );

        console.info(

            "Version:",

            VERSION

        );

        console.info(

            "History Capacity:",

            eventBus.getHistorySize()

        );

        console.groupEnd();

    }

        /**
     * ============================================================
     * Protect Global References
     * ============================================================
     *
     * Prevent accidental replacement of the global EventBus
     * references while allowing the EventBus instance itself
     * to maintain its internal mutable runtime state.
     */

    Object.defineProperty(global, "EventBus", {

        value: eventBus,

        writable: false,

        configurable: false,

        enumerable: true

    });

    Object.defineProperty(global, "events", {

        value: eventBus,

        writable: false,

        configurable: false,

        enumerable: true

    });

    /**
     * ============================================================
     * Runtime Self-Test
     * ============================================================
     */

    function runtimeSelfTest() {

    try {

        return (

            eventBus instanceof EventBus &&

            eventBus.registry instanceof Map &&

            Array.isArray(eventBus.history)

        );

    }

    catch (error) {

        console.error(

            "EventBus self-test failed.",

            error

        );

        return false;

    }

}

    /**
     * ============================================================
     * Execute Self-Test
     * ============================================================
     */

    const runtimeReady = runtimeSelfTest();

    if (eventBus.isDebugEnabled()) {

        console.info(

            "EventBus Ready:",

            runtimeReady

        );

    }
if (runtimeReady) {

    eventBus.publish(

        "runtime.eventbus.initialised",

        {

            version: VERSION,

            timestamp: new Date().toISOString()

        },

        "runtime"

    );

}

    /**
     * ============================================================
     * Browser Compatibility
     * ============================================================
     */

})(typeof window !== "undefined" ? window : globalThis);

/**
 * ================================================================
 * END OF FILE
 * ================================================================
 */
