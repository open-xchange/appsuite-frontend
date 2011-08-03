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
        title: "",
        click: $.noop,
        enabled: true,
        data: {},
        theme: "bright",
        css: {}
        // other options:
        // tabIndex, id, mousedown
    }, options || {});
    
    // class name
    var className = "ox-button" + (!opt.enabled ? " ox-button-disabled" : "");
    
    if (opt.theme === "dark") {
        // dark theme
        className += " dark";
    }
    
    if (ox.browser.Gecko) {
        // firefox
        className += " firefox";
    } else if (ox.browser.WebKit) {
        // webkit
        className += " webkit";
    }
    
    // create text node
    var text;
    if (opt.title.nodeType === 3) {
        // is text node!
        text = opt.title;
    } else {
        text = document.createTextNode(opt.title);
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