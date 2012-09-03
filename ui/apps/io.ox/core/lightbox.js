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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */
// TODO: Use fancy css transformations for optimization and only fall back to jquery animations if needed

define("io.ox/core/lightbox", function () {
    
    "use strict";
    
    // scaffolds
    var $underlay = $("<div/>").addClass("abs io-ox-dialog-underlay"),
        $popup = $("<div/>").addClass("abs io-ox-lightbox-popup");
    
    function Lightbox(delegate, options) {
        var nodes = {
            popup: $popup.clone().hide().appendTo("body"),
            underlay: $underlay.clone().hide().appendTo("body")
        };
        
        options = options || {};
        delegate = delegate || {};
        if (!delegate.getGhost) {
            delegate.getGhost = $.noop;
        }
        if (!delegate.buildPage) {
            delegate.buildPage = $.noop;
        }
        
        
        this.show = function () {
            var $ghost = $(delegate.getGhost());
            var $page = $(delegate.buildPage()).hide();
            var mustSwap = ($page !== null && !_.isUndefined($page));
            
            $page = $page || $ghost || $("<div><h1>You forgot to implement #getGhost and #buildPage in the delegate for this lightbox</h1></div>");
            // Determine final dimensions
            var width, height, left, top;
            
            if (options.shrinkToFit) {
                width = $page.width();
                height = $page.height();
            } else {
                width = $(window).width() * 0.9;
                height = $(window).height() * 0.9;
            }
            
            // Center it
            top = ($(window).height() / 2) - height / 2;
            left = ($(window).width() / 2) - width / 2;
            
            $page.css({
                width: width,
                height: height
            });
            
            // Display ghost, if there is one
            // then scale it, cross fade content, fade in underlay
            if ($ghost) {
                // Match the position of the ghost with the popup
                nodes.popup.css({
                    width: $ghost.width(),
                    height: $ghost.height(),
                    top: $ghost.offset().top,
                    left: $ghost.offset().left
                });
                var $ghostClone = $ghost.clone();
                nodes.popup.append($ghostClone);
                nodes.popup.show();
                
                nodes.popup.animate({
                    width: width,
                    height: height,
                    top: top,
                    left: left
                }, {
                    duration: 500,
                    complete: function () {
                        if (mustSwap) {
                            nodes.popup.empty();
                            nodes.popup.append($page);
                            $page.show();
                        }
                    }
                });
                
                
            } else {
                nodes.popup.css({
                    width: 0,
                    height: 0,
                    top: $(window).height() / 2,
                    left: $(window).width() / 2
                });
                nodes.popup.show();
                nodes.popup.append($page);
                nodes.popup.animate({
                    width: width,
                    height: height,
                    top: top,
                    left: left
                }, 1000);
            }
            nodes.underlay.fadeIn();
        };
        
        this.hide = function () {
            nodes.underlay.fadeOut();
            nodes.popup.fadeOut(function () {
                nodes.underlay.remove();
                nodes.popup.remove();
            });
        };
        
        this.option = function (a, b) {
            if (_.isObject(a)) {
                options = _(options).extend(a);
                return;
            }
            if (_.isString(a)) {
                if (_.isUndefined(a)) {
                    return options[a];
                } else {
                    options[a] = b;
                    return this;
                }
            }
        };
        
        var self = this;
        
        nodes.popup.dblclick(function () {
            self.hide();
        });
                
        nodes.underlay.click(function () {
            self.hide();
        });
    }
    
    return {
        Lightbox: Lightbox,
        createLightboxForElement: function ($elem, generator) {
            $elem = $($elem);
            generator = generator || $elem;
            if (!_.isFunction(generator)) {
                var page = $(generator);
                generator = function () {
                    return page;
                };
            }
            $elem.click(function () {
                new Lightbox({
                    getGhost: function () {
                        return $elem;
                    },
                    buildPage: generator
                }).show();
            });
        }
    };
});
