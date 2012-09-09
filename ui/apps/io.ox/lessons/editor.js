/**
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
 */
define('io.ox/lessons/editor', ['ace/ace', 'ace/mode/javascript', 'ace/mode/html'], function (ace, JavaScript, HTML) {
    "use strict";
    var Editor = {
        ace: ace,
        edit: function (el, options) {
            var div;
            el = $(el);
            options = options || {};
            el.replaceWith(div = $("<div>").css({
                position: 'absolute',
                width: options.width || el.width(),
                height: options.height || el.height() + (options.padding || 0) + (el.data("padding") || 0),
                border: "1px solid black"
            }).html(el.html()));
            el = div;
            
            var placeholder;
            
            el.after(placeholder = $("<div>&nbsp;</div>").css({
                marginTop: el.height() + 14
            }));
            
            if (options.run) {
                placeholder.append($('<button class="btn btn-primary">').text("Try this").on("click", function () {
                    options.run(editor.getValue());
                }));
            }
            
            var editor = ace.edit(el);
            
            if (!options.language || options.language === "javascript" || options.language === "js") {
                editor.getSession().setMode(new JavaScript.Mode());
            } else if (options.language === "html") {
                editor.getSession().setMode(new HTML.Mode());
            }
            editor.setTheme('ace/theme/eclipse');
            editor.setHighlightActiveLine(false);
            
            return editor;
        },
        highlight: function (el, options) {
            var editor = this.edit(el, options);
            editor.setReadOnly(true);
            return editor;
        },
        setUp: function (node) {
            // Highlight uneditable .code elements
            node.find(".code").each(function (index, element) {
                Editor.highlight(element);
            });
            
            // Node Experiments
            node.find(".node_experiment").each(function (index, element) {
                var experimentDiv = $("<div>").css({
                    marginTop: "10px"
                });
                var firstTime = true;
                $(element).after(experimentDiv);
                
                Editor.edit(element, {
                    padding: 45,
                    run: function (jsText) {
                        experimentDiv.empty();
                        if (firstTime) {
                            firstTime = false;
                            experimentDiv.addClass("well");
                        }
                        var parentNode = experimentDiv;
                        
                        var runIt = function () {
                            eval(jsText);
                        };
                        
                        runIt.apply(parentNode);
                    }
                });
            });
        }
    };
    
    return Editor;
    
});