/**
 * 
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 * 
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com 
 * 
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * 
 */

$.button = function (options) {
    
    // options
    var opt = $.extend({
        label: "",
        click: $.noop,
        enabled: true,
        data: {},
        theme: "bright",
        css: {}
        // other options:
        // tabIndex, id, mousedown
    }, options || {});
    
    // class name
    var className = "io-ox-button" + (!opt.enabled ? " disabled" : "");
    
    if (opt.theme === "dark") {
        // dark theme
        className += " dark";
    }
    
    // create text node
    var text;
    if (opt.label.nodeType === 3) {
        // is text node!
        text = opt.label;
    } else {
        text = document.createTextNode(opt.label);
    }
    
    // create button
    var button = $("<button/>").addClass(className).append(
        $("<span/>").append(text)
    ).bind(
        "click", opt.data, opt.click
    );
    
    // add id?
    if (opt.id !== undefined) {
        button.attr("id", opt.id);
    }
    
    // add tabindex?
    if (opt.tabIndex !== undefined) {
        button.attr("tabindex", opt.tabIndex);
    }
    
    return button;
};

$.fn.busy = function (empty) {
    return this.each(function () {
        var self = $(this);
        clearTimeout(self.data("busy-timeout"));
        self.data("busy-timeout", setTimeout(function () {
            self.addClass("io-ox-busy");
            if (empty) {
                self.empty();
            }
        }, 200));
    });
};

$.fn.idle = function () {
    return this.each(function () {
        var self = $(this);
        clearTimeout(self.data("busy-timeout"));
        self.removeClass("io-ox-busy");
    });
};

$.fn.intoViewport = function (node) {

    if (!node || this.length === 0) {
        return this;
    }
    
    try {
        
        // get pane
        var pane = $(node),
            // get pane height
            height = 0,
            // get visible area
            y1 = pane.scrollTop(),
            y2 = 0,
            // get position
            pos = this.position(),
            top = pos.top + y1,
            h = 0;
        
        // out of visible area?
        if (top < y1) {
            // scroll up!
            top = top < 50 ? 0 : top;
            pane.scrollTop(top);
        } else {
            // scroll down!
            y2 = y1 + pane.height();
            h = this.outerHeight();
            if (top + h > y2) {
                pane.scrollTop(y1 + top + h - y2);
            }
        }
        
    } catch (e) {
        // IE sometimes crashes
        // even Chrome might get in trouble during ultra fast scrolling
        console.error("$.fn.intoViewport", this, e);
    }
    
    return this;
};

// center content via good old stupid table stuff
$.center = function (stuff) {
    // probably does not run in IE properly
    return $("<div/>")
        .addClass("abs io-ox-center")
        .append($("<div/>").append(stuff));
};

$.fail = function (msg, retry) {
    var tmp = $("<span/>").addClass("io-ox-fail").text(msg);
    if (retry) {
        tmp = tmp.add($("<span/>").text(" "))
            .add($("<span/>").text("Retry").addClass("link").bind("click", function () {
                $(this).parents(".io-ox-center").remove();
                retry.apply(this, arguments);
            }));
    }
    return $.center(tmp);
};
