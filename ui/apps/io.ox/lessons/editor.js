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
define('io.ox/lessons/editor', ['ace/ace', 'ace/mode/javascript'], function (ace, JavaScript) {
    "use strict";
    
    return {
        ace: ace,
        edit: function (el, options) {
            el = $(el);
            options = options || {};
            el.css({
                position: 'absolute',
                width: options.width || el.width(),
                height: options.height || el.height() * 1.8 + (options.padding || 0),
                border: "1px solid black"
            });
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
            
            editor.getSession().setMode(new JavaScript.Mode());
            editor.setTheme('ace/theme/eclipse');
            
            return editor;
        },
        highlight: function (el, options) {
            var editor = this.edit(el, options);
            editor.setReadOnly(true);
            return editor;
        }
    };
    
});