/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/switchboard/call', [
    'io.ox/switchboard/api',
    'io.ox/backbone/views/modal'
], function (api, Modal) {

    'use strict';
    var base = 'https://jitsi.ox-frontend.de/',
        ringtone = new Audio(ox.base + '/apps/io.ox/switchboard/ringtone.mp3'),
        modal;

    var call = window.call = new Backbone.Model({
        active: false,
        telco: '',
        participants: [],
        type: '',
        reset: function () {
            this.set({ participants: [], active: false, type: '', telco: '' });
            this.trigger('reset');
        }
    });

    // play ringtone or stop it
    function ring(stopRing) {
        if (stopRing) {
            ringtone.pause();
            ringtone.currentTime = 0;
            return;
        }
        ringtone.volume = 0.1;
        ringtone.play();
    }

    // get a new url to a telco
    function getNewTelco() {
        function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1); }
        return base + s4() + s4();
    }

    // close the current open modal
    function closeModal() {
        if (modal) modal.close();
    }

    // start a call with participants
    function startCall(participants) {
        var telco = getNewTelco();
        // TODO: Nice dialog
        modal = new Modal({ title: 'Calling ...', description: 'Calling ' + participants.join(', ') })
            .addCancelButton()
            .on('cancel', function () {
                cancelCall();
            })
            .on('close', function () {
                modal = null;
            })
            .open();
        window.open(telco);
        api.propagate('call', participants, { telco: telco });
        call.set({ participants: participants, active: true, type: 'caller', teclo: telco });
    }

    // cancel a call which is not yet accepted
    function cancelCall() {
        api.propagate('cancel', call.get('participants'), { telco: call.get('telco') }).then(function (ack) {
            if (ack === 'ack') {
                call.reset();
            }
        });
    }

    // decline a incoming call
    function declineCall(from) {
        api.propagate('decline', [from]);
    }

    // user get's called
    api.socket.on('call', function (from, payload) {
        ring();
        modal = new Modal({ title: 'Incoming call', description: from + ' is calling you. ' + payload.telco })
            .addCancelButton()
            .addButton({ label: 'Answer', action: 'answer' })
            .on('cancel', function () {
                declineCall(from);
                ring(true);
            })
            .on('answer', function () {
                ring(true);
                api.propagate('accepted', [from]);
                call.set({ participants: [from], active: true, type: 'called' });
                window.open(payload.telco);
            })
            .on('close', function () {
                modal = null;
            })
            .open();

        setTimeout(function () {
            if (modal) modal.close();
        }, 20000);

    });

    // caller cancels the call
    api.socket.on('cancel', function () {
        if (!modal) return;
        ring(true);
        closeModal();
    });

    // your call is declined by the participant
    api.socket.on('decline', function (participant) {
        closeModal();
        new Modal({ title: 'Call declined', description: participant + ' has declined your call.' })
            .addButton({ label: 'Close', action: 'ok' })
            .open();
    });

    // your call was accepted
    api.socket.on('accepted', function () {
        // just close the modal
        closeModal();
    });

    return {
        model: call,
        start: startCall,
        cancel: cancelCall
    };

});
