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
    'io.ox/core/tk/attachments'
], function (attachments) {

    'use strict';
    var views = attachments.view;

    describe.only('Attachments Views:', function () {
        it('API should provide an AttachmentList view', function () {
            expect(views.AttachmentList).to.exist;
        });

        it('API should provide an Attachment view', function () {
            expect(views.Attachment).to.exist;
        });

        it('provided by the API should be extendable (Backbone views)', function () {
            expect(views.AttachmentList).itself.to.respondTo('extend');
            expect(views.Attachment).itself.to.respondTo('extend');
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
                EmptyAttachmentList = views.AttachmentList.extend({
                    collection: new Backbone.Collection()
                });
            });
            it('has a constructor expecting a Collection', function () {
                var createWithCollection = function () {
                        new views.AttachmentList({
                            collection: new Backbone.Collection()
                        });
                    },
                    createWithoutCollection = function () {
                        new views.AttachmentList({});
                    };

                expect(createWithoutCollection).to.throw(Error);
                expect(createWithCollection).not.to.throw(Error);
            });

            describe('has a preview option', function () {
                it('that renders a .preview class', function () {
                    var list1 = new EmptyAttachmentList({}),
                        list2 = new EmptyAttachmentList({
                            preview: true
                        });

                    list1.render();
                    list2.render();
                    expect(list1.$el.hasClass('preview'), 'has class .preview').not.to.be.true;
                    expect(list2.$el.hasClass('preview'), 'has class .preview').to.be.true;
                });
                it('that can be toggled live', function () {
                    var list = new EmptyAttachmentList({});
                    list.render();
                    expect(list.$el.hasClass('preview'), 'has class .preview').not.to.be.true;
                    list.togglePreview();
                    expect(list.$el.hasClass('preview'), 'has class .preview').to.be.true;
                });

                it('changes the icon on toggle', function () {
                        var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model(), new Model()]),
                            attachmentView: Backbone.View.extend({
                                tagName: 'li'
                            })
                        });

                    list.render().toggleContent('open');
                    expect(list.$('header a.preview-toggle i').hasClass('fa-th-large'), 'preview toggle item shows "fa-th-large"').to.be.true;
                    expect(list.$('header a.preview-toggle i').hasClass('fa-list'), 'preview toggle item shows "fa-list"').to.be.false;
                    expect(list.$('ul li'), 'li elements within the ul after open').to.have.length(2);
                    list.togglePreview();
                    expect(list.$('header a.preview-toggle i').hasClass('fa-th-large'), 'preview toggle item shows "fa-th-large"').to.be.false;
                    expect(list.$('header a.preview-toggle i').hasClass('fa-list'), 'preview toggle item shows "fa-list"').to.be.true;
                    expect(list.$('ul li'), 'li elements within the ul after toggle preview').to.have.length(2);
                });
            });

            it('only renders "file attachment" models', function () {
                var model = new NonFileModel({}),
                    renderMe = sinon.spy(),
                    list = new EmptyAttachmentList({
                        attachmentView: Backbone.View.extend({
                            render: renderMe
                        })
                    });

                list.collection.reset([model]);
                list.render().toggleContent('show');
                expect(renderMe.called, 'render method called').to.be.false;

                model.isFileAttachment = sinon.stub().returns(true);
                list = new EmptyAttachmentList({
                    attachmentView: Backbone.View.extend({
                        render: renderMe
                    })
                });
                list.collection.reset([model]);
                list.render().toggleContent('open');
                expect(renderMe.calledOnce, 'render method called once').to.be.true;
            });

            it('allows to provide custom attachment views', function () {
                var model = new FileModel(),
                    renderMe = sinon.spy(),
                    list = new EmptyAttachmentList({
                        attachmentView: Backbone.View.extend({
                            render: renderMe
                        })
                    });

                 list.collection.reset([model]);
                 list.render().toggleContent('open');
                 expect(renderMe.calledOnce, 'render method called once').to.be.true;
            });

            describe('renders', function () {
                it('no header for empty collections', function () {
                    var list = new EmptyAttachmentList({});

                    list.render();
                    expect(list.$('header'), 'header elements in list').to.have.length(0);
                    expect(list.$el.hasClass('empty'), '.empty class for list element').to.be.true;
                });

                it('with "closed" and empty list for collections with more than one item', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model(), new Model()]),
                            attachmentView: Backbone.View.extend({})
                        });

                   list.render();
                   expect(list.$ul.hasClass('open'), 'ul has class .open').to.be.false;
                   expect(list.$ul.hasClass('empty'), 'ul has class .empty').to.be.true;
                   expect(list.$ul.children('li'), 'li items in ul').to.have.length(0);
                });

                it('with "opened" list for collections with one item', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model()]),
                            attachmentView: Backbone.View.extend({
                                tagName: 'li'
                            })
                        });

                    list.render();
                    expect(list.$ul.hasClass('open'), 'ul has class .open').to.be.true;
                    expect(list.$ul.children('li'), 'li items in ul').to.have.length(1);
                });

                it('a default header', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model()]),
                            attachmentView: Backbone.View.extend({})
                        });

                   list.render();
                   expect(list.$('header'), 'header elements in list').to.have.length(1);
                });

                it('a custom header instead of default one', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model()]),
                            attachmentView: Backbone.View.extend({})
                        });

                    list.renderCustomHeader = sinon.stub();

                    list.render();
                    //custom header rendered
                    expect(list.renderCustomHeader.calledOnce, 'renderCustomHeader method has been called once').to.be.true;
                    //default header not rendered
                    expect(list.$('header'), 'header elements in list').to.have.length(0);
                });

                it('a content toggle', function () {
                    var Model = Backbone.Model.extend({
                        isFileAttachment: sinon.stub().returns(true)
                    }),
                   list = new views.AttachmentList({
                       collection: new Backbone.Collection([new Model()]),
                       attachmentView: Backbone.View.extend({})
                   });

                   list.render();
                   expect(list.$('header a.content-toggle').length === 1, 'found content toggle link').to.be.true;
                });

                it('a preview toggle', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model()]),
                            attachmentView: Backbone.View.extend({})
                        });

                    list.render();
                    expect(list.$('header a.preview-toggle').length === 1, 'found preview toggle link').to.be.true;
                });
            });

            describe('has a content toggle', function () {
                it('that can be used to force open the content', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model(), new Model()]),
                            attachmentView: Backbone.View.extend({
                                tagName: 'li'
                            })
                        });

                    list.render();
                    //renders closed by default
                    expect(list.$ul.hasClass('open'), 'ul has class open').to.be.false;
                    expect(list.$ul.children('li'), 'li items in ul').to.have.length(0);
                    list.toggleContent('open');
                    expect(list.$ul.hasClass('open'), 'ul has class open').to.be.true;
                    expect(list.$ul.children('li'), 'li items in ul').to.have.length(2);
                    list.toggleContent('open');
                    expect(list.$ul.hasClass('open'), 'ul has class open').to.be.true;
                    expect(list.$ul.children('li'), 'li items in ul').to.have.length(2);
                });
            });

            describe('can dynamically add/remove attachments', function () {
                it('attaches a new list item', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model(), new Model()]),
                            attachmentView: Backbone.View.extend({
                                tagName: 'li'
                            })
                        });

                   list.render().toggleContent('open');
                   expect(list.$ul.hasClass('open'), 'ul has class open').to.be.true;
                   expect(list.$ul.children('li'), 'li items in ul').to.have.length(2);
                   list.collection.add(new Model());
                   expect(list.$ul.children('li'), 'li items in ul').to.have.length(3);
                });

                it('updates the header', function () {
                    var Model = Backbone.Model.extend({
                            isFileAttachment: sinon.stub().returns(true)
                        }),
                        list = new views.AttachmentList({
                            collection: new Backbone.Collection([new Model(), new Model()]),
                            attachmentView: Backbone.View.extend({
                                tagName: 'li'
                            })
                        });

                   list.render().toggleContent('open');
                   list.collection.add(new Model());
                   expect(list.$('header').text(), 'header text').to.contain('3 Attachments');
                });
            });
        });
    });
});
