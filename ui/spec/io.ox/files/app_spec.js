define([
], function () {

    describe('Drive Main App', function () {
        describe.only('mediation after first launch', function () {
            beforeEach(function () {
                require.undef('io.ox/files/main');
                require.undef('io.ox/files/contextmenu');
            });

            it('should have added a context menu', function () {
                return ox.launch('io.ox/files/main').then(function () {
                    //implement me
                    const win = this.getWindow();
                    expect(win.nodes.outer.find('.dropdown [aria-label="Files context menu"]').length, 'found .dropdown elements').to.equal(1);
                });
            });

            it('should have populated app object with instance methods', function () {
                return ox.launch('io.ox/files/main').then(function () {
                    const app = this;
                    expect(app.get('state')).to.equal('running');
                    expect(app.selectFile).to.be.a('function');
                });
            });
        });
    });
});
