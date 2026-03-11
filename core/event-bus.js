// PAP Global Namespace and Event Bus
window.PAP = window.PAP || {};

PAP.EventBus = (function () {
    const listeners = {};

    return {
        on(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },

        off(event, callback) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(cb => cb !== callback);
        },

        emit(event, data) {
            if (!listeners[event]) return;
            for (const cb of listeners[event]) {
                cb(data);
            }
        },

        once(event, callback) {
            const wrapper = (data) => {
                callback(data);
                this.off(event, wrapper);
            };
            this.on(event, wrapper);
        },

        clear(event) {
            if (event) {
                delete listeners[event];
            } else {
                for (const key in listeners) delete listeners[key];
            }
        }
    };
})();
