/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */
define(['fixture!browser_support/userAgents.json'], function (userAgents) {
    describe('_.device utilities:', function () {
        afterEach(function () {
            _.device.loadUA(window.navigator);
        });

        it('should detect the testrunner', function () {
            expect(_.browser.karma).to.be.true;
            expect(_.device('karma')).to.be.true;
        });

        it('should be defined', function () {
            expect(_.device).to.be.a('function');
        });

        it('should return an object if debug param was given', function () {
            expect(_.device('debug')).to.be.an('object');
        });

        it('should extend underscore with some helper functions and objects', function () {
            expect(_.browser).to.be.an('object');
            expect(_.browserSupport).to.be.an('object');
        });

        it('should add a global function "isBrowserSupported" which returns a bool', function () {
            expect(window.isBrowserSupported).to.be.a('function');
            expect(window.isBrowserSupported()).to.be.a('boolean');
        });

        _(userAgents.valid).each(function (a, browser) {
            _(userAgents.valid[browser]).each(function (b, version) {
                it('should detect ' + browser + ' ' + version, function () {
                    _.device.loadUA(userAgents.valid[browser][version]);
                    expect(_.device(browser)).to.be.true;
                    expect(parseFloat(_.browser[browser])).to.be.at.least(version);
                });
            });
        });

        _(userAgents.valid).each(function (a, browser) {
            _(userAgents.valid[browser]).each(function (b, version) {
                if (b.supported) {
                    it('should check ' + browser + ' ' + version + ' against AS support matrix', function () {
                        _.device.loadUA(userAgents.valid[browser][version]);
                        expect(window.isBrowserSupported()).to.be.true;
                    });
                } else if (!b.unsupported) {
                    it('should check ' + browser + ' ' + version + ' against AS support matrix', function () {
                        _.device.loadUA(userAgents.valid[browser][version]);
                        expect(window.isBrowserSupported()).to.be.false;
                    });
                }
                if (b.platformSupport === true) {
                    it('should check the mobile platform' + browser + ' ' + version + ' against AS support matrix', function () {
                        _.device.loadUA(userAgents.valid[browser][version]);
                        expect(window.isPlatformSupported()).to.be.true;
                    });
                } else if (b.platformSupport === false) {
                    it('should check the unsupported mobile platform' + browser + ' ' + version + ' against AS support matrix', function () {
                        _.device.loadUA(userAgents.valid[browser][version]);
                        expect(window.isPlatformSupported()).to.be.false;
                    });
                }
            });
        });

        _(userAgents.invalid).each(function (a, number) {
            it('should use the fallback "unknown" if an unknown or broken user agent occurs', function () {
                var spy = sinon.stub(console, 'warn').callsFake(function () {});
                _.device.loadUA(userAgents.invalid[number]);
                //FIXME: really test spy
                //expect(spy).toHaveBeenCalledWithMatch('Could not detect browser, using fallback');
                expect(spy).to.have.beenCalled;
                expect(_.browser.unknown).to.be.true;
                spy.restore();
            });
        });

        it('should detect iOS Chrome as unsupported browser on a supported platform', function () {
            _.device.loadUA(userAgents.valid.ChromeiOS[56]);
            expect(window.isBrowserSupported()).to.be.false;
            expect(window.isPlatformSupported()).to.be.true;
        });

        it('should detect iOS Firefox as unsupported browser on a supported platform', function () {
            _.device.loadUA(userAgents.valid.FirefoxiOS[1]);
            expect(window.isBrowserSupported()).to.be.false;
            expect(window.isPlatformSupported()).to.be.true;
        });

        it('should detect Android Firefox as unsupported browser on a supported platform', function () {
            _.device.loadUA(userAgents.valid.FirefoxAndroid[52]);
            expect(window.isBrowserSupported()).to.be.false;
            expect(window.isPlatformSupported()).to.be.true;
        });

        it('should detect Windows Phone as an unsupported platform with an supported Browser', function () {
            _.device.loadUA(userAgents.valid.WindowsPhone[10]);
            expect(window.isBrowserSupported()).to.be.true;
            expect(window.isPlatformSupported()).to.be.false;
        });

        it.skip('should handle Chrome on Windows 8 convertible devices as non-touch devices', function () {
            _.device.loadUA(userAgents.valid.Chrome[34]);
            expect(_.device('touch')).to.be.false;
            expect(_.browser.windows8).to.be.true;
        });

    });
});
