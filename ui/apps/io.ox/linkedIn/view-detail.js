/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/linkedIn/view-detail',
    ['io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'io.ox/core/http',
     'gettext!io.ox/portal',
     'less!io.ox/linkedIn/style'
    ], function (ext, dialogs, http, gt) {

    'use strict';

    var actionPoint = ext.point('io.ox/linkedIn/details/actions');
    var rendererPoint = ext.point('io.ox/linkedIn/details/renderer');

    function draw(data) {
        var $node = $('<div>').addClass('linkedIn').css({ overflow: 'auto' }),
            $detailNode = $('<div>').addClass('details').appendTo($node),
            $table = $('<table><tr><td class="t10"></td><td class="t11"></td></tr><tr><td class="r2" colspan="2"></td></tr><table>').appendTo($detailNode),
            $pictureNode = $table.find('.t10'),
            $nameNode = $table.find('.t11');

        $pictureNode.append(
            $('<img>', {
                src: data.pictureUrl || (ox.base + '/apps/themes/default/dummypicture.png'),
                alt: data.firstName + ' ' + data.lastName
            })
            .css({ margin: '0 5px 0 0' })
        );

        $nameNode
            .append($('<div>').addClass('name').text(data.firstName && data.lastName ? data.firstName + ' ' + data.lastName : ''))
            .append($('<div>').addClass('headline').text(data.headline ? data.headline : ''));

        var $actionsNode = $('<div>').addClass('actions').appendTo($node);
        actionPoint.each(function (ext) {
            if (!ext.available || ext.available(data)) {
                $actionsNode.append($('<a>', { href: '#' }).text(ext.label).click(function (e) {
                    // don't change url hash
                    e.preventDefault();
                    ext.action(data);
                }));
            }
        });

        rendererPoint.each(function (ext) {
            $node.append(ext.draw({data: data, win: $node}));
        });

        return $node;
    }

    actionPoint.extend({
        id: 'linkedin/details/connect',
        label: gt('Open on LinkedIn'),
        action: function (data) {
            window.open(data.publicProfileUrl);
        },
        available: function (data) {
            return !!data.publicProfileUrl;
        },
        index: 100
    });

    // Detail renderers

    // Past Engagements
    rendererPoint.extend({
        id: 'linkein/details/renderer/experience',
        draw: function (options) {
            var data = options.data;
            var win = options.win;

            var $myNode = $('<div>').addClass('pastEngagements extension');
            if (data.positions && data.positions.values && data.positions.values.length !== 0) {
                var pastEngagements = [];

                _(data.positions.values).each(function (position) {
                    var $posNode = $('<div>').addClass('position').appendTo($myNode);
                    if (position.isCurrent) {
                        $posNode.addClass('current');
                    } else {
                        $posNode.hide();
                        pastEngagements.push($posNode);
                    }
                    if (position.startDate && position.startDate.year) {
                        var timeSpentThere = position.startDate.year;
                        if (position.endDate && position.endDate.year) {
                            timeSpentThere += ' - ' + position.endDate.year;
                        } else if (position.isCurrent) {
                            timeSpentThere += ' - Present';
                        }
                        $('<span>').text(timeSpentThere).appendTo($posNode).addClass('timeSpent');
                    }
                    if (position.title) {
                        $('<span>').appendTo($posNode).text(position.title).addClass('title');
                    }
                    if (position.company && position.company.name) {
                        $('<div>').text(position.company.name).appendTo($posNode).addClass('companyName');
                    }
                });
                if (pastEngagements.length !== 0) {
                    var pastEngagementsVisible = false;
                    var $moreToggle = $('<a>', { href: '#' }).text('More...').click(function (e) {
                        e.preventDefault();
                        pastEngagementsVisible = !pastEngagementsVisible;
                        if (pastEngagementsVisible) {
                            $moreToggle.text('Show less');
                            _(pastEngagements).invoke('show');
                            win.animate({scrollTop: _(pastEngagements).first().offset().top - 50}, 500);
                        } else {
                            $moreToggle.text('More...');
                            _(pastEngagements).invoke('hide');
                        }
                    }).appendTo($myNode);
                }
            }
            return $myNode;
        },
        index: 100
    });

    rendererPoint.extend({
        id: 'linkein/details/renderer/relations',
        draw: function (options) {

            var data = options.data,
                $myNode = $('<div>').addClass('relations extension');

            if (data.relationToViewer && data.relationToViewer.connections && data.relationToViewer.connections.values && data.relationToViewer.connections.values !== 0) {

                $('<div>')
                    // TODO: make CSS class
                    .css({ marginBottom: '5px', fontWeight: 'bold' })
                    .text('Connections you share with ' + data.firstName + ' ' + data.lastName)
                    .appendTo($myNode);

                var open = function (popup, e, target) {

                        var person = target.data('object-data');
                        popup.append(draw(person));
                        var busy = $('<div/>').css('min-height', '100px').busy().appendTo(popup);

                        http.GET({
                            module: 'integrations/linkedin/portal',
                            params: {
                                action: 'fullProfile',
                                id: person.id
                            }
                        })
                        .done(function (completeProfile) {
                            busy.idle();
                            popup.empty()
                                .append(draw(completeProfile));
                        });
                    };

                new dialogs.SidePopup({ tabTrap: true })
                    .delegate($myNode, '.linkedin-profile-picture', open);

                _(data.relationToViewer.connections.values).each(function (relation) {
                    var imageUrl;
                    if (relation.person && relation.person.pictureUrl) {
                        imageUrl = relation.person.pictureUrl;
                    } else {
                        imageUrl = ox.base + '/apps/themes/default/dummypicture.png';
                    }
                    $('<img>')
                        .addClass('linkedin-profile-picture')
                        .css({ margin: '0 5px 0 0', cursor: 'pointer' })
                        .attr('src', imageUrl)
                        .attr('alt', relation.person.firstName + ' ' + relation.person.lastName)
                        .data('object-data', relation.person)
                        .appendTo($myNode);

                });
            }

            return $myNode;
        },
        index: 200
    });

    return {
        draw: draw
    };
});
