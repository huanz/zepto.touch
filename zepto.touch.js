;
(function($) {
    'use strict';
    var isFunction = $.isFunction;
    var isString = function(obj) {
        return typeof obj == 'string';
    };
    var returnFalse = function() {
        return false;
    };

    function calculateAngle(x1, x2, y1, y2) {
        var x = x1 - x2;
        var y = y1 - y2;
        var r = Math.atan2(y, x);
        var angle = Math.round(r * 180 / Math.PI);
        if (angle < 0) {
            angle = 360 - Math.abs(angle);
        }
        return angle;
    }

    function calculateDirection(x1, x2, y1, y2) {
        var angle = calculateAngle(x1, x2, y1, y2);
        if ((angle <= 45 && angle >= 0) || (angle <= 360 && angle >= 315)) {
            return 'left';
        } else if (angle >= 135 && angle <= 225) {
            return 'right';
        } else if (angle > 45 && angle < 135) {
            return 'down';
        } else {
            return 'up';
        }
    }


    var PLUGIN_NS = '_TOUCH_';
    var SUPPORTS_TOUCH = 'ontouchstart' in window;
    var SUPPORTS_POINTER_IE10 = window.navigator.msPointerEnabled && !window.navigator.pointerEnabled;
    var SUPPORTS_POINTER = window.navigator.pointerEnabled || window.navigator.msPointerEnabled;
    var useTouchEvents = SUPPORTS_TOUCH || SUPPORTS_POINTER;
    var START_EV = useTouchEvents ? (SUPPORTS_POINTER ? (SUPPORTS_POINTER_IE10 ? 'MSPointerDown' : 'pointerdown') : 'touchstart') : 'mousedown';
    var MOVE_EV = useTouchEvents ? (SUPPORTS_POINTER ? (SUPPORTS_POINTER_IE10 ? 'MSPointerMove' : 'pointermove') : 'touchmove') : 'mousemove';
    var END_EV = useTouchEvents ? (SUPPORTS_POINTER ? (SUPPORTS_POINTER_IE10 ? 'MSPointerUp' : 'pointerup') : 'touchend') : 'mouseup';
    var CANCEL_EV = (SUPPORTS_POINTER ? (SUPPORTS_POINTER_IE10 ? 'MSPointerCancel' : 'pointercancel') : 'touchcancel');

    var defaults = {
        fingers: 1,
        threshold: 75,
        fingerReleaseThreshold: 250,
        longTapThreshold: 500,
        doubleTapThreshold: 200,
        fallbackToMouseEvents: true,
        excludedElements: 'label, button, input, select, textarea, .noTouch',
        preventDefaultEvents: true
    };

    // 这个入口用来设置参数的
    $.fn.touch = function(options) {
        if (typeof options === 'object') {
            this.data(PLUGIN_NS, $.extend({}, $.fn.touch.defaults, options));
        }
    };

    $.fn.touch.defaults = defaults;

    var _tid = 1;
    var handlers = {};

    function tid(element) {
        return element._tid || (element._tid = _tid++);
    }

    function Touch(element, event, selector, data, callback) {
        var id = tid(element),
            set = (handlers[id] || (handlers[id] = []));

        if (!isString(selector) && !isFunction(callback) && callback !== false) {
            callback = data;
            data = selector;
            selector = undefined;
        }
        if (callback === undefined || data === false) {
            callback = data;
            data = undefined;
        }
        if (callback === false) {
            callback = returnFalse;
        }

        var handler = {
            e: event,
            fn: callback
        };

        var delegator;

        if (selector) {
            delegator = function(e) {
                var match = $(e.target).closest(selector, element).get(0);
                if (match && match !== element) {
                    return callback.apply(match, arguments);
                }
            };
            handler.sel = selector;
            handler.del = delegator;
        }

        handler.i = set.length;
        set.push(handler);

        this.callback = delegator || callback;
        this.el = element;
        this.$el = $(element);
        this.options = this.$el.data(PLUGIN_NS) || $.fn.touch.defaults;
        this.event = event;
        this.$el.on(START_EV, $.proxy(this.touchStart, this)).on(CANCEL_EV, $.proxy(this.touchCancel, this));
    }

    Touch.prototype = {
        _inTouch: false,
        touch: {},
        touchStart: function(e) {
            var _this = this;
            var options = this.options;
            if (this._inTouch || $(e.target).closest(options.excludedElements, this.el).length) {
                return;
            }
            var touches = e.touches;
            var evt = touches ? touches[0] : e;

            if (options.preventDefaultEvents) {
                e.preventDefault();
            }

            var fingerCount = 0;
            if (touches) {
                fingerCount = touches.length;
            }

            this.createTouchData(0, e);

            if (!touches || (fingerCount === options.fingers || options.fingers === 'all')) {
                if (this.event === 'longTap') {
                    holdTimeout = setTimeout(function() {
                        _this.trigger('longTap', e);
                    }, options.longTapThreshold);
                }
                this.setTouchProgress(true);
            } else {
                return false;
            }
        },
        touchMove: function(e) {
            if (this.event === 'longTap') {
                clearTimeout(holdTimeout);
                return;
            }

            this.updateTouchData();
            this.touch.last = e.timeStamp;

            if (this.hasSwipe()) {
                if (this.options.preventDefaultEvents) {
                    e.preventDefault();
                }
            }
        },
        touchEnd: function(e) {
            if (this.options.preventDefaultEvents) {
                e.preventDefault();
            }
            this.setTouchProgress(false);
        },
        touchCancel: function(e) {
            this.touch = {};
            this.setTouchProgress(false);
        },
        triggerHandler: function(e, status) {
            if (this.hasSwipe()) {

            }
        },
        trigger: function(eventName, event) {
            this.$el.trigger(eventName);
            if (this.event === eventName) {
                this.callback.call(this.$el, event);
            }
        },
        hasSwipe: function() {
            return /^(swipe|swipeLeft|swipeRight|swipeUp|swipeDown)$/.test(this.event);
        },
        isSwipe: function() {
            return this.getDistance() >= this.options.threshold && this.touch.x2;
        },
        createTouchData: function(e) {
            var touch = {};
            touch.x1 = touch.x2 = e.pageX || e.clientX;
            touch.y1 = touch.y2 = e.pageY || e.clientY;
            touch.now = e.timeStamp;
            this.touch = touch;
            return touch;
        },
        updateTouchData: function(e) {
            this.touch.x2 = e.pageX || e.clientX;
            this.touch.y2 = e.pageY || e.clientY;
        },
        getDirection: function() {
            var touch = this.touch;
            return calculateDirection(touch.x1, touch.x2, touch.y1, touch.y2);
        },
        getDistance: function() {
            var touch = this.touch;
            return Math.round(Math.sqrt(Math.pow(touch.x2 - touch.x1, 2) + Math.pow(touch.y2 - touch.y1, 2)));
        },
        getDuration: function() {
            return
        },
        setTouchProgress: function(isTouch) {
            if (isTouch) {
                this.$el.on(MOVE_EV, $.proxy(this.touchMove, this)).on(END_EV, $.proxy(this.touchEnd, this));
            } else {
                this.$el.off(MOVE_EV, $.proxy(this.touchMove, this)).off(END_EV, $.proxy(this.touchEnd, this));
            }
            this._inTouch = isTouch;
        }
    };

    var _on = $.fn.on;
    var _off = $.fn.off;

    $.fn.on = function(event, selector, data, callback) {
        if (event && !isString(event)) {
            return _on.apply(this, arguments);
        }
        if (/^(tap|doubleTap|longTap|swipe|swipeLeft|swipeRight|swipeUp|swipeDown)$/.test(event)) {
            this.each(function() {
                new Touch(this, event, selector, data, callback);
            });
            return this;
        } else {
            return _on.apply(this, arguments);
        }
    };

})(window.Zepto || window.jQuery);
