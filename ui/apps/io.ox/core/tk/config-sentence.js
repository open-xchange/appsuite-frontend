/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/core/tk/config-sentence', ['io.ox/core/tk/keys'], function (KeyListener) {

    'use strict';

    var Widgets = {
        toggle: function ($anchor, attribute, options) {
            var self = this;

            // check options
            if (!options || !options.values) {
                return false;
            }

            self[attribute] = 0;
            $anchor.text(options.values[self.value]);

            $anchor.on('click', function (e) {
                e.preventDefault();
                var newValue = (self.value === 0) ? 1 : 0;
                self[attribute] = newValue;
                self.trigger('change', self);
                self.trigger('change:' + attribute, self);
                drawState();
            });

            function drawState() {
                $anchor.text(options.values[self[attribute]]);
                self.trigger('redraw', self);
            }

            this.on('change:' + attribute, drawState);
        },
        number: function ($anchor, attribute, options) {
            var self = this,
                originalContent = $anchor.html();

            // check options
            if (!options || !options.initial || !options.phrase) {
                return false;
            }

            self[attribute] = options.initial;

            function drawState() {
                var value = self[attribute];
                $anchor.text(options.phrase(value)).focus();
                self.trigger('redraw', self);
            }

            $anchor.on('click', function (e) {
                e.preventDefault();
                var type = (Modernizr.inputtypes.number && _.device('touch')) ? 'number' : 'text',
                    $numberInput = $('<input type="' + type + '" size="4" tabindex="1">').css({
                    width: (Modernizr.inputtypes.number && _.device('touch')) ? '2em' : '1em',
                    marginBottom: 0,
                    padding: 0
                }).val(self[attribute]);
                var keys = new KeyListener($numberInput);


                var $content = $('<span>' + originalContent + '</span>');
                $content.find('.number-control').empty().append(
                    $numberInput
                );
                $anchor.after($content);
                $anchor.hide();

                $numberInput.select();
                keys.include();

                // TODO: Allow only number entries
                function updateValue() {
                    var value = parseInt($numberInput.val(), 10);
                    if (isNaN(value)) {
                        value = options.initial || 1;
                    }
                    try {
                        $content.remove();
                    } catch (e) { }
                    $anchor.show();
                    self[attribute] = value;
                    self.trigger('change', self);
                    self.trigger('change:' + attribute, self);
                    drawState();
                    keys.destroy();
                }
                $numberInput.on('blur', function () {
                    updateValue();
                });

                // Enter
                keys.on('enter', function () {
                    updateValue();
                });

                // Escape
                keys.on('esc', function () {
                    $numberInput.val(self[attribute]);
                    keys.destroy();
                    try {
                        $content.remove();
                    } catch (e) { }
                    $anchor.show();
                });
            });

            this.on('change:' + attribute, drawState);
        },
        options: function ($anchor, attribute, options) {
            // First we need to wrap the anchor
            var self = this;

            // check options
            if (!options || !options.options) {
                return false;
            }

            self[attribute] = options.initial;

            var $container = $('<span class="dropdown">').css({ zIndex: 1 });
            $anchor.after($container);
            $container.append($anchor);

            function drawState() {
                var label = options.options[self[attribute]];
                if (options.chooseLabel) {
                    label = options.chooseLabel(self[attribute]);
                }
                $anchor.text(label).focus();
                self.trigger('redraw', self);
            }

            // Now build the menu
            var $menu = $('<ul class="dropdown-menu no-clone" role="menu">');
            _(options.options).each(function (label, value) {
                $menu.append(
                    $('<li>')
                        .append($('<a href="#">').attr({ tabindex: $anchor.attr('tabindex') }).text(label).on('click', function (e) {
                            e.preventDefault();
                            self[attribute] = value;
                            self.trigger('change', self);
                            self.trigger('change:' + attribute, self);
                            drawState();
                        })
                    )
                );
            });
            $container.append($menu);

            // Tell the anchor that it triggers the dropdown
            $anchor.attr({
                'data-toggle': 'dropdown',
                'aria-haspopup': true,
                role: 'menuitem'
            });

            $anchor.dropdown();

            this.on('change:' + attribute, drawState);
        },
        custom: function ($anchor, attribute, func, options) {
            func.call(this, $anchor, attribute, options);
        }
    };

    function ConfigSentence(sentence, options) {
        options = options || {};
        var self = this;
        _.extend(this, Backbone.Events);
        this.$el = $('<span>').html(sentence);
        this.$el.find('a').each(function () {
            var $anchor = $(this),
                attribute = $anchor.data('attribute') || 'value',
                widget = $anchor.data('widget'),
                opts = options[attribute] || options;
            if (options.tabindex) {
                $anchor.attr({ tabindex: options.tabindex});
            }
            // TODO: Use ExtensionPoints here
            if (Widgets[widget]) {
                Widgets[widget].call(self, $anchor, attribute, opts, options);
            }
        });

        this.set = function (key, value) {
            this[key] = value;
            this.trigger('change', this);
            this.trigger('change:' + key, this);
        };

        this.ghost = function () {
            var $ghost = this.$el.clone(false);
            $ghost.find('.no-clone, .datepicker, .popover')
                .remove();
            $ghost
                .find('*')
                .each(function () {
                    $(this).replaceWith($.txt($(this).text()));
                });
            return $ghost.text();
        };

        this.id = options.id;

    }

    return ConfigSentence;
});
