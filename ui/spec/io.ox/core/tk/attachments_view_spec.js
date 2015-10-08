/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define([
    'io.ox/core/attachments/view'
], function (Attachments) {

    'use strict';

    describe('Attachments Views:', function () {
        it('API should provide an AttachmentList view', function () {
            expect(Attachments.List).to.exist;
        });

        it('API should provide an Attachment view', function () {
            expect(Attachments.View).to.exist;
        });

        it('API should provide an Attachment view rendering with preview', function () {
            expect(Attachments.Preview).to.exist;
        });

        it('provided by the API should be extendable (Backbone views)', function () {
            expect(Attachments.List).itself.to.respondTo('extend');
            expect(Attachments.View).itself.to.respondTo('extend');
            expect(Attachments.Preview).itself.to.respondTo('extend');
        });

        describe('AttachmentList', function () {
            var EmptyAttachmentList,
                FileModel = Backbone.Model.extend({
                    isFileAttachment: sinon.stub().returns(true)
                }),
                NonFileModel = Backbone.Model.extend({
                    isFileAttachment: sinon.stub().returns(false)
                });

            beforeEach(function () {
                EmptyAttachmentList = Attachments.List.extend({
                    collection: new Backbone.Collection()
                });
            });
            it('has a constructor expecting a Collection', function () {
                var createWithCollection = function () {
                        new Attachments.List({
                            collection: new Backbone.Collection()
                        });
                    },
                    createWithoutCollection = function () {
                        new Attachments.List({});
                    };

                expect(createWithoutCollection).to.throw(Error);
                expect(createWithCollection).not.to.throw(Error);
            });

            describe('has a preview mode toggle', function () {
                var Model = Backbone.Model.extend({
                        isFileAttachment: sinon.stub().returns(true)
                    }),
                    list = new Attachments.List({
                        collection: new Backbone.Collection([new Model(), new Model()]),
                        AttachmentView: Backbone.View.extend({
                            tagName: 'li'
                        })
                    });

                list.render().onToggleDetails({ preventDefault: sinon.stub() });
                expect(list.$el.hasClass('show-preview'), 'preview is shown').to.be.false;
                list.onToggleMode({ preventDefault: sinon.stub() });
                expect(list.$el.hasClass('show-preview'), 'preview is shown').to.be.true;
            });

            it('only renders "file attachment" models', function () {
                var model = new NonFileModel({}),
                    renderMe = sinon.stub().returns({ '$el': $() }),
                    list = new EmptyAttachmentList({
                        AttachmentView: Backbone.View.extend({
                            render: renderMe
                        })
                    });

                list.collection.reset([model]);
                list.render().onToggleDetails({ preventDefault: sinon.stub() });
                expect(renderMe.called, 'render method called').to.be.false;

                model.isFileAttachment = sinon.stub().returns(true);
                list = new EmptyAttachmentList({
                    AttachmentView: Backbone.View.extend({
                        render: renderMe
                    })
                });
                list.collection.reset([model]);
                list.render().onToggleDetails({ preventDefault: sinon.stub() });
                //render twice, one time with preview, one time without
                expect(renderMe.calledTwice, 'render method called twice').to.be.true;
            });

            it('allows to provide custom attachment views', function () {
                var model = new FileModel(),
                    renderMe = sinon.stub().returns({ '$el': $() }),
                    list = new EmptyAttachmentList({
                        AttachmentView: Backbone.View.extend({
                            render: renderMe
                        })
                    });

                list.collection.reset([model]);
                list.render().onToggleDetails({ preventDefault: sinon.stub() });
                //render twice, one time with preview, one time without
                expect(renderMe.calledTwice, 'render method called twice').to.be.true;
            });

            describe('renders', function () {
                it('with empty class for empty collections', function () {
                    var list = new EmptyAttachmentList({});

                    list.render();
                    $('body').append(list.$el);
                    expect(list.$el.hasClass('empty'), 'list element has class .empty').to.be.true;
                    list.remove();
                });

                it('with "closed" and empty list for collections with more than one item', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new Attachments.List({
                            collection: new Backbone.Collection([new Model(), new Model()]),
                            AttachmentView: Backbone.View.extend({})
                        });

                    list.render();
                    expect(list.$el.hasClass('open'), 'list has class .open').to.be.false;
                    expect(list.$('ul.preview').children('li'), 'li items in ul').to.have.length(0);
                });

                it('a default header', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new Attachments.List({
                            collection: new Backbone.Collection([new Model()]),
                            AttachmentView: Backbone.View.extend({})
                        });

                    list.render();
                    expect(list.$('header'), 'header elements in list').to.have.length(1);
                });

                it('a custom header instead of default one', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new Attachments.List({
                            collection: new Backbone.Collection([new Model()]),
                            AttachmentView: Backbone.View.extend({})
                        });

                    list.renderHeader = sinon.stub();

                    list.render();
                    //custom header rendered
                    expect(list.renderHeader.calledOnce, 'renderHeader method has been called once').to.be.true;
                    //default header not rendered
                    expect(list.$('header').children(), 'header element should be empty').to.have.length(0);
                });

                it('a details toggle', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new Attachments.List({
                            collection: new Backbone.Collection([new Model()]),
                            AttachmentView: Backbone.View.extend({})
                        });

                    list.render();
                    expect(list.$('header a.toggle-details').length === 1, 'found details toggle link').to.be.true;
                });

                it('a preview mode toggle', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new Attachments.List({
                            collection: new Backbone.Collection([new Model()]),
                            AttachmentView: Backbone.View.extend({})
                        });

                    list.render();
                    expect(list.$('header a.toggle-mode').length === 1, 'found preview toggle link').to.be.true;
                });
            });

            it('has a details toggle', function () {
                var Model = Backbone.Model.extend({
                        isFileAttachment: sinon.stub().returns(true)
                    }),
                    list = new Attachments.List({
                        collection: new Backbone.Collection([new Model(), new Model()]),
                        AttachmentView: Backbone.View.extend({
                            tagName: 'li'
                        })
                    });

                list.render();
                //renders closed by default
                expect(list.$el.hasClass('open'), 'ul has class open').to.be.false;
                list.onToggleDetails({ preventDefault: sinon.stub() });
                expect(list.$el.hasClass('open'), 'ul has class open').to.be.true;
            });

            describe('can dynamically add/remove attachments', function () {
                it('attaches a new list item', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new Attachments.List({
                            collection: new Backbone.Collection([new Model(), new Model()]),
                            AttachmentView: Backbone.View.extend({
                                tagName: 'li'
                            })
                        });

                    list.render().onToggleDetails({ preventDefault: sinon.stub() });
                    expect(list.$el.hasClass('open'), 'list has class open').to.be.true;
                    expect(list.$('ul.preview').children('li'), 'li items in ul').to.have.length(2);
                    list.collection.add(new Model());
                    expect(list.$('ul.preview').children('li'), 'li items in ul').to.have.length(3);
                });

                it('updates the header', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new Attachments.List({
                            collection: new Backbone.Collection([new Model(), new Model()]),
                            AttachmentView: Backbone.View.extend({
                                tagName: 'li'
                            })
                        });

                    list.render().onToggleDetails({ preventDefault: sinon.stub() });
                    list.collection.add(new Model());
                    expect(list.$('header').text(), 'header text').to.contain('3 Anlagen');
                });
            });
        });
    });

    describe('Attachment View:', function () {
        var FakeModel = Backbone.Model.extend({
            needsUpload: sinon.stub().returns(false),
            getShortTitle: sinon.stub().returns('TestTitle'),
            getSize: sinon.stub().returns(65535)
        });

        it('should render a li item', function () {
            var view = new Attachments.View({
                model: new FakeModel()
            });
            view.render();
            expect(view.$el.is('li'), 'rendered element is a li element').to.be.true;
        });
        it('should render the title', function () {
            var view = new Attachments.View({
                model: new FakeModel()
            });
            view.render();
            expect(view.$el.text(), 'the rendered text').to.contain('TestTitle');
        });
    });
});
