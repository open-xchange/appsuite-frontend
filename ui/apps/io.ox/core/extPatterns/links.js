/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/extPatterns/links', [
    'io.ox/core/extensions',
    'io.ox/core/collection',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/a11y',
    'gettext!io.ox/core'
], function (ext, Collection, actions, MiniViewDropdown, a11y, gt) {

    'use strict';

    // common extension classes

    var Action = actions.Action;

    var Link = function (options) {

        if (ox.debug) console.warn('Link is DEPRECATED with 7.10.2 (io.ox/core/extPatterns/links.js)', options);

        _.extend(this, options);

        var self = this,
            preRendered = {
                a: $('<a>'),
                i: $('<i>')
            },
            click = function (e) {
                e.preventDefault();
                var node = $(this),
                    baton = node.data('baton'),
                    ref = node.data('ref');
                baton.e = e;
                actions.invoke(ref, this, baton, e);
                _.defer(function () { node.tooltip('hide'); });
            },
            drawDefault = function (baton) {
                var prio = _.device('smartphone') ? self.mobile : self.prio;
                var icons = self.icon && baton.options.icons !== false;
                var title = self.title || self.label;
                var attr = {
                    href: '#',
                    'data-action': self.id,
                    'draggable': options.draggable || false,
                    'role': self.role || 'menuitem',
                    'data-section': self.section || 'default',
                    'data-section-description': self.sectionDescription || self.sectionTitle,
                    'data-prio': _.device('smartphone') ? (self.mobile || 'none') : (self.prio || 'lo'),
                    'data-ref': self.ref,
                    'tabindex': -1
                };
                var a = preRendered.a.clone()
                    .addClass(self.cssClasses || 'io-ox-action-link');
                //in firefox draggable=false is not enough to prevent dragging...
                if (!options.draggable && _.device('firefox')) {
                    attr.ondragstart = 'return false;';
                }

                // add icon or text? (icons are prefered over labels)
                if (icons && prio === 'hi') {
                    // add icon and title attribut
                    a.append(preRendered.i.clone().addClass(self.icon).attr('aria-hidden', 'true'));
                } else if (title) {
                    // add text. add title unless it matches content
                    a.append($.txt(title));
                }
                // has icon?
                if (icons) a.addClass('no-underline');
                // use tooltip?
                var addTooltip = self.toolTip && prio === 'hi' && _.device('!smartphone');
                if (addTooltip) {
                    _.extend(attr, {
                        'title': self.toolTip,
                        'data-toggle': 'tooltip',
                        'data-placement': 'bottom',
                        'data-animation': 'false',
                        'data-container': 'body',
                        // tooltip removes title attribute
                        // therefore we always add aria-label to maintain screen reader support
                        'aria-label': self.toolTip
                    });
                }
                // apply attributes now in a single run
                a.attr(attr);
                // initialize tooltip
                if (addTooltip) a.tooltip({ trigger: 'hover' }).on('dispose', function () { $(this).tooltip('destroy'); });
                // done
                return a;
            };

        this.draw = this.draw || function (baton) {
            // clone was introduced as a fix for b54827
            baton = _.clone(ext.Baton.ensure(baton));
            var link = drawDefault(baton);

            this.append(
                link.data({ ref: self.ref, baton: baton }).click(click)
            );

            // call customize? (call after append; must be self - not this)
            if (self.customize) self.customize.call(link, baton);
        };

        if (this.drawDisabled === true) {
            this.drawDisabled = function (baton) {
                var link = drawDefault(baton);
                this.append(
                    link
                    .tooltip('destroy')
                    .addClass('disabled')
                    .attr('aria-disabled', true)
                );
                // call customize? (call after append; must be self - not this)
                if (self.customize) self.customize.call(link, baton);
            };
        }
    };

    function actionClick(e) {
        e.preventDefault();
        var extension = e.data.extension, baton = e.data.baton;
        baton.e = e;
        actions.invoke(extension.ref, extension, baton);
    }

    var ActionLinkDescription = function (baton, extension, link) {
        var process = this.attr('data-described') || !!extension.description;
        if (!process) return;

        // add least one desription exists so inject dividers
        if (!extension.description) return injectDescriptionDividers(this);

        // add help description
        var id = extension.ref.replace(/\//g, '-') + '-descr';
        link.attr('aria-describedby', id);
        link.parent().addClass('has-dropdown-description');
        this.append(
            $('<li>')
                .attr({
                    id: id,
                    'data-section': extension.ref,
                    role: 'presentation',
                    class: 'dropdown-header dropdown-description'
                })
                .text(extension.description)
                .on('click', { baton: baton, extension: extension }, actionClick)
        );
        // flag parent
        this.attr('data-described', true);
        // update dividers
        injectDescriptionDividers(this);
    };

    var ActionLink = function (id, extension) {
        extension = extension || {};
        extension = _.extend({
            ref: id + '/' + extension.id,
            draw: function (baton) {
                var link;
                baton = ext.Baton.ensure(baton);
                // add action
                this.append(
                    $('<li role="presentation">').append(
                        link = $('<a href="#" role="menuitem">').attr('data-action', extension.ref).text(extension.label)
                            .on('click', { baton: baton, extension: extension }, actionClick)
                    )
                );
                // handle possible
                ActionLinkDescription.call(this, baton, extension, link);
            }
        }, extension);
        ext.point(id).extend(extension);
    };

    var Button = function (options) {

        _.extend(this, options);

        var self = this,
            tag = options.tagtype ? options.tagtype : 'a',

            click = function (e) {
                if (node.hasClass('io-ox-busy')) {
                    return false;
                }
                e.preventDefault();
                var extension = e.data.extension;
                e.data.baton.e = e;
                actions.invoke(extension.ref, extension, e.data.baton);
            },
            node;

        this.draw = function (baton) {
            baton = ext.Baton.ensure(baton);
            var attr = {
                href: '#',
                role: 'button',
                'class': 'btn btn-default',
                'data-action': self.id
            };
            if (tag === 'button') attr.type = 'button';
            this.append(
                node = $('<' + tag + '>', attr)
                .addClass(self.cssClasses)
                .css(self.css || {})
                .on('click', { extension: self, baton: baton }, click)
                .append(_.isString(self.label) ? $.txt(self.label) : $())
                .append(_.isString(self.icon) ? $('<i>').addClass(self.icon) : $())
            );
        };

        this.busy = function () {
            node.busy();
        };

        this.idle = function () {
            node.idle();
        };
    };

    var getLinks = function (extension, collection, baton, args) {
        return actions.applyCollection(extension.ref, collection, baton, args);
    };

    var drawLinks = function (extension, collection, node, baton, args, bootstrapMode) {

        baton = ext.Baton.ensure(baton);

        var nav = baton.$el ||
            $('<ul class="list-unstyled" role="toolbar">')
            .addClass(extension.classes || '')
            .attr(extension.attributes || {})
            .appendTo(node),
            $li = $('<li role="presentation">');

        return getLinks(extension, collection, baton, args)
            .always(function (items) {
                // count resolved items
                var count = 0;
                // draw items
                _(items).each(function (item) {
                    var link = item.link;
                    if (item.state === false) {
                        if (_.isFunction(link.drawDisabled)) {
                            link.drawDisabled.call(bootstrapMode ? $li.clone().appendTo(nav) : nav, baton);
                            count++;
                        }
                    } else if (_.isFunction(link.draw)) {
                        link.draw.call(bootstrapMode ? $li.clone().appendTo(nav) : nav, baton);
                        count++;
                    }
                });
                nav.find('li > a').attr('tabindex', -1);
                nav.find('li > a:first').attr('tabindex', 0);
                // empty?
                if (count === 0) nav.addClass('empty').removeAttr('role');
            })
            // pipe vs then
            .pipe(function () {
                return nav;
            });
    };

    var drawInlineButtonGroup = function (extension, collection, node, baton, args, bootstrapMode) {
        baton = ext.Baton.ensure(baton);
        var group = $('<div class="btn-group">'),
            nav = $('<nav role="presentation">').append(group).appendTo(node);

        // customize
        if (extension.attributes) {
            nav.attr(extension.attributes);
        }
        if (extension.classes) {
            nav.addClass(extension.classes);
        }

        return getLinks(extension, collection, baton, args)
            .always(function (links) {
                // count resolved links
                var count = 0;
                // draw links
                _(links).each(function (item) {
                    var link = item.link;
                    if (item.state === false) {
                        if (_.isFunction(link.drawDisabled)) {
                            link.drawDisabled.call(bootstrapMode ? $('<li>').appendTo(group) : group, baton);
                            count++;
                        }
                    } else if (_.isFunction(link.draw)) {
                        link.draw.call(bootstrapMode ? $('<li>').appendTo(group) : group, baton);
                        count++;
                    }
                });
                // empty?
                if (count === 0) {
                    group.addClass('empty');
                }
            })
            .then(function () {
                return group;
            });
    };

    var ToolbarLinks = function (options) {
        var self = _.extend(this, options);
        this.draw = function (baton) {
            // paint on current node
            var args = $.makeArray(arguments);
            baton = ext.Baton.ensure(baton);
            drawLinks(self, new Collection(baton.data), this, baton, args);
        };

    };

    var ToolbarButtons = function (options) {
        var self = _.extend(this, options);
        this.draw = function (baton) {
            // paint on current node
            var args = $.makeArray(arguments);
            baton = ext.Baton.ensure(baton);
            drawLinks(self, new Collection(baton.data), this, baton, args);
            // add classes to get button style
            this.children('a').addClass('btn btn-primary');
            this.children('.dropdown').children('a').addClass('btn btn-primary');
        };
    };

    // surround action-description-block with dividers
    function injectDescriptionDividers(node) {
        // loop over all items and visually group by "section"
        var list = node.children('li');
        node.children('li').each(function (index, node) {
            node = $(node);
            // get descriptions
            if (!node.hasClass('dropdown-description')) return;
            // related link is not first child && divider not already added
            if ((index - 1 >= 1) && !node.prev().prev().hasClass('divider')) {
                $(list[index - 1]).before('<li class="divider" role="separator">');
            }
            // description is not last child
            if (index === list.length - 1) return;
            // divider not already added
            if (!node.next().hasClass('divider')) {
                node.after('<li class="divider" role="separator">');
            }
        });
    }

    function injectDividers(node) {
        // loop over all items and visually group by "section"
        var currentSection = '',
            $li = $('<li class="divider" role="separator">'),
            $section = $('<li class="dropdown-header">');
        node.children('li').each(function () {
            var node = $(this), link = node.children('a'), section = link.attr('data-section'), description = link.attr('data-section-description');
            // add divider?
            if (section === undefined) return;
            if (currentSection !== '' && currentSection !== section) {
                node.before($li.clone());
                if (description) node.before($section.clone().text(description));
            }
            currentSection = section;
        });
    }

    /**
     * @param {object}  options
     * @param {boolean} options.dropdown force usage of 'more...'
     * @param {string} add options.title for better accessibility (add context to 'Inline menu')
     * @param {boolean} options.compactDropdown = false
     *  if set to true, low prio links dropdown will use a compact hamburger icon.
     */
    var InlineLinks = function (options) {

        if (ox.debug) console.warn('InlineLinks is DEPRECATED with 7.10.2 (io.ox/core/extPatterns/links.js)', options);

        // don't use options inside this class; only "this" gets replaced properties
        var extension = _.extend(this, {
            classes: 'io-ox-inline-links',
            attributes: {
                //#. %1$s inline menu title for better accessibility
                'aria-label': gt('Inline menu %1$s', options.title || '')
            }
        }, options);

        function processItems(baton, nav) {

            // add toggle unless multi-selection
            var multiple = _.isArray(baton.data) && baton.data.length > 1,
                all = nav.children(),
                lo = all.children().filter('[data-prio="lo"]').parent(),
                hi = all.children().filter('[data-prio="hi"]').parent(),
                links = lo.find('a'),
                allDisabled = links.length === links.filter('.disabled').length,
                isSmartphone = _.device('smartphone');

            if (hi.length > 0 && !allDisabled) hi.find('a').attr('role', 'button');

            // remove unimportant links on smartphone (prio='none')
            if (isSmartphone) all.children().filter('[data-prio="none"]').parent().remove();

            if (lo.length > 1 && !allDisabled && (!multiple || extension.dropdown === true) && extension.dropdown !== false) {
                var dd = $('<a href="#" class="io-ox-action-link" draggable="false" role="button" data-toggle="dropdown" data-action="more" aria-haspopup="true" tabindex="-1">')
                    .attr('data-original-title', isSmartphone ? gt('Actions') : gt('More actions'))
                    .append(
                        isSmartphone && !extension.compactDropdown ?
                            $().add($.txt(gt('Actions'))).add($('<i class="fa fa-caret-down" aria-hidden="true">')) :
                            $('<span class="sr-only">').text(gt('Actions')).add($('<i class="fa fa-bars" aria-hidden="true">'))
                    ),
                    node = $('<ul class="dropdown-menu pull-right" role="menu">')
                        .attr('aria-label', isSmartphone ? gt('Actions') : gt('More'))
                        .append(lo);

                nav.append(
                    new MiniViewDropdown({ tagName: 'li', attributes: { role: 'presentation' }, $ul: node, $toggle: dd }).render().$el
                );

                // ugly workaround to prevent IE scrolling the parent object when Scrollbar is at the Top/Bottom and the Mousewheel/Touchpad is used
                if (_.device('IE')) {
                    node.on('wheel', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        //apply scrolling manually
                        this.scrollTop = this.scrollTop + e.originalEvent.deltaY;
                    });
                }

                if (!isSmartphone) {
                    dd.attr({
                        'data-placement': 'bottom',
                        'data-animation': 'false',
                        'data-container': 'body'
                    })
                    .tooltip({ trigger: 'hover' })
                    .parent()
                    .on('shown.bs.dropdown dispose', function () {
                        $(this).children('a').tooltip('destroy');
                    });
                }

                //in firefox draggable=false is not enough to prevent dragging...
                if (_.device('firefox')) {
                    dd.attr('ondragstart', 'return false;');
                }

                injectDividers(nav.find('ul'));
            }

            // hide if all links are disabled
            if (allDisabled) lo.hide();
            // deprecated!
            if (extension.customizeNode) extension.customizeNode(nav);
            if (extension.customize) extension.customize.call(nav, baton);

            // move to real target node at dummy's position
            if (baton.$.positionDummy) {
                baton.$.positionDummy.before(nav.children());
                // now remove dummy
                baton.$.positionDummy.remove();
                delete baton.$.positionDummy;
            }

            // clear
            all = lo = null;
        }

        this.draw = function (baton) {

            baton = ext.Baton.ensure(baton);

            // use temporary container and remember real target node
            if (baton.$el) {
                baton.$.temp = $('<div>');
                // needed to keep the position or extensionpoint index would be ignored
                baton.$.positionDummy = $('<div class="position-dummy">').hide();
                baton.$el.append(baton.$.positionDummy);
            }

            var def = drawLinks(extension, new Collection(baton.data), baton.$.temp || this, baton, $.makeArray(arguments), true);

            if (extension.noLfo) {
                def.done(_.partial(processItems, baton));
            } else {
                def.done(_.lfo(true, processItems, baton));
            }

            delete baton.$.temp;
            delete baton.$el;
            return def;
        };
    };

    var InlineButtonGroup = function (options) {
        var extension = _.extend(this, { classes: 'io-ox-inline-buttongroup' }, options);
        this.draw = function (baton) {
            baton = ext.Baton.ensure(baton);
            drawInlineButtonGroup(extension, new Collection(baton.data), this, baton, $.makeArray(arguments))
                .done(function (group) {
                    if (options.customizeNode) {
                        options.customizeNode(group);
                    }
                });
        };
    };

    var drawDropDownItems = function (options, baton, args, ul) {
        ul = this.data('ul') || ul;
        var closer;

        // race-condition
        if (!ul) return;
        // special handling for mobile menus, otherwise the "closer"
        // may be removed from menu
        if (ul.find('[data-action="close-menu"]')) {
            closer = ul.find('[data-action="close-menu"]').parent().clone(true);
        }
        baton.$el = ul.empty();
        // reappend the closer
        if (closer) baton.$el.append(closer);
        drawLinks(options, new Collection(baton.data), null, baton, args, true).done(function () {
            injectDividers(baton.$el);
            // remove items with 'none' prio
            if (_.device('smartphone')) baton.$el.find('[data-prio="none"]').closest('li').remove();
            baton.$el.parent().trigger('ready');
            // make sure the closer is at the last position
            if (closer) baton.$el.append(closer);
            delete baton.$el;
        });
    };

    var beforeOpenDropDown = function (e) {
        var baton = e.data.baton;
        baton.data = baton.model ? baton.model.toJSON() : baton.data;
        baton.options.icons = false;
        drawDropDownItems.call($(this), e.data.options, baton, e.data.args);
    };

    var drawDropDown = function (options, baton) {
        var label = baton.label || options.label,
            args = $.makeArray(arguments),
            node = baton.$el || $('<div>'),
            ul = $('<ul class="dropdown-menu" role="menu">'),
            dropdownView = new MiniViewDropdown({
                el: node.addClass('dropdown').attr('role', 'presentation'),
                $toggle: $('<a href="#" role="button" data-toggle="dropdown" aria-haspopup="true">').attr({
                    'aria-label': options.ariaLabel ? options.ariaLabel : label.textContent
                })
                .append(
                    options.icon ? $('<i aria-hidden="true">').addClass(options.icon).attr('title', label.textContent) : label,
                    options.noCaret ? $() : $('<i class="fa fa-caret-down" aria-hidden="true">')
                ),
                $ul: ul
            });

        // label: Use baton or String or DOM node
        label = _.isString(label) ? $.txt(label) : label;
        // build dropdown
        this.append(dropdownView.render().$el);
        // store reference to <ul>; we need that for mobile drop-downs
        node.data('ul', ul);

        // use smart update?
        if (baton.model) {
            node.on('show.bs.dropdown', { options: options, baton: baton, args: args }, beforeOpenDropDown);
        } else {
            _.defer(drawDropDownItems.bind(node), options, baton, args, dropdownView.$ul);
        }

        // usual customizations
        if (options.classes) node.addClass(options.classes);
        if (options.attributes) node.attr(options.attributes);

        return node;
    };

    // full dropdown; <div> <a> + <ul> + inks </div>
    var Dropdown = function (options) {
        if (ox.debug) console.warn('Dropdown is DEPRECATED with 7.10.2 (io.ox/core/extPatterns/links.js)', options);
        var o = _.extend(this, options);
        this.draw = function (baton) {
            baton = ext.Baton.ensure(baton);
            return drawDropDown.call(this, o, baton);
        };
    };

    // just the dropdown - <ul> + links; not the container
    var DropdownLinks = function (options, baton, wrap) {
        if (ox.debug) console.warn('DropdownLinks is DEPRECATED with 7.10.2 (io.ox/core/extPatterns/links.js)', options);
        options = options || {};
        baton.$el = $('<ul class="dropdown-menu" role="menu">');
        wrap = !!_.defaultValue(options.wrap, true);
        drawLinks(options, new Collection(baton.data), null, baton, [], wrap).done(function () {
            // if dropdown is emtpy and we have an empty-callback, execute it(some async drawing methods use this)
            if (!baton.$el) return;
            if (options.emptyCallback && baton.$el.hasClass('empty')) options.emptyCallback();
            injectDividers(baton.$el);
        });
        return baton.$el;
    };

    var drawButtonGroup = function (options, baton) {
        var args = $.makeArray(arguments),
            $parent = $('<div class="btn-group">').addClass(options.classes)
                .attr('data-toggle', (options.radio ? 'buttons-radio' : ''))
                .appendTo(this);
        // create & add node first, since the rest is async
        var node = $parent;
        drawLinks(options, new Collection(baton.data), node, baton, args, false);
        return $parent;
    };

    var ButtonGroup = function (id, options) {
        var o = options || {};
        o.ref = id + '/' + o.id;
        ext.point(id).extend(
            _.extend({
                ref: o.ref,
                draw: function (baton) {
                    baton = ext.Baton.ensure(baton);
                    drawButtonGroup.call(this, o, baton);
                }
            }, o)
        );
    };

    var ActionGroup = (function () {

        function preventDefault(e) {
            e.preventDefault();
        }

        function draw(extension, baton) {
            var args = $.makeArray(arguments), a, ul, div, title = [];
            this.append(
                div = $('<li class="toolbar-button dropdown">').append(
                    a = $('<a href="#" data-toggle="dropdown" title="">')
                        .attr('data-ref', extension.ref)
                        .addClass(extension.addClass)
                        .append(extension.icon()),
                    ul = $('<ul class="dropdown-menu dropdown-right-side" role="menu">')
                )
            );
            // get links
            return getLinks(extension, new Collection(baton.data), baton, args)
                .then(function (items) {
                    // filter out disabled items
                    return _.chain(items).filter(function (o) { return o.state; }).pluck('link').value();
                })
                .done(function (links) {
                    if (links.length > 1) {
                        // call draw method to fill dropdown
                        _(links).chain()
                            .filter(function (x) {
                                return _.isFunction(x.draw);
                            })
                            .each(function (x) {
                                title.push(x.label);
                                x.draw.call(ul, baton);
                            });
                        // set title attribute
                        a.attr({
                            'title': extension.label || title.join(', '),
                            'aria-label': extension.label || title.join(', '),
                            'role': 'menuitem',
                            'aria-haspopup': true
                        });

                        div.attr('role', 'toolbar');
                        // add footer label?
                        if (extension.label) {
                            ul.append(
                                $('<li class="dropdown-footer">').text(extension.label)
                            );
                        }
                    } else {
                        // disable dropdown
                        a.removeAttr('data-toggle');
                        ul.remove();
                        if (links.length === 1) {
                            // directly link actions
                            a.attr({
                                'title': links[0].label || '',
                                'aria-label': links[0].label || '',
                                'role': 'menuitem',
                                // add tooltip
                                'data-animation': 'false',
                                'data-placement': 'right',
                                'data-container': 'body'
                            })
                            .on('click', { baton: baton, extension: links[0] }, actionClick);
                            if (!_.device('touch')) {
                                a.tooltip({ trigger: 'hover' });
                            }
                        } else {
                            a.addClass('disabled').attr('aria-disabled', true).on('click', preventDefault);
                        }
                    }
                });
        }

        function icon() {
            return $('<i class="fa fa-magic" aria-hidden="true">');
        }

        return function ActionGroup(id, extension) {
            extension = extension || {};
            extension = _.extend({
                ref: id + '/' + (extension.id || 'default'),
                icon: icon,
                draw: function (baton) {
                    baton = ext.Baton.ensure(baton);
                    draw.call(this, extension, baton);
                }
            }, extension);
            // register extension
            ext.point(id).extend(extension);
        };

    }());

    return {
        Action: Action,
        Link: Link,
        Button: Button,
        ActionLink: ActionLink,
        ToolbarButtons: ToolbarButtons,
        ToolbarLinks: ToolbarLinks,
        InlineLinks: InlineLinks,
        InlineButtonGroup: InlineButtonGroup,
        Dropdown: Dropdown,
        DropdownLinks: DropdownLinks,
        ButtonGroup: ButtonGroup,
        ActionGroup: ActionGroup
    };
});
