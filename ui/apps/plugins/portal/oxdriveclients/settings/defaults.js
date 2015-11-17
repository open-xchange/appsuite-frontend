/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quat@open-xchange.com>
 */

define('plugins/portal/oxdriveclients/settings/defaults', function () {

    'use strict';

    return {
        linkTo: {
            'Android': 'https://play.google.com/store/apps/details?id=com.openexchange.drive.vanilla',
            'iOS': 'https://itunes.apple.com/us/app/ox-drive/id798570177?l=de&ls=1&mt=8',
            'Mac OS': 'https://itunes.apple.com/us/app/ox-drive/id818195014?l=de&ls=1&mt=12',
            'Windows': '/updater/installer/oxupdater-install.exe'
        },
        // list all languages for which are localized shop images available. All other will fall back to EN
        // images are located under apps/plugins/portal/oxdriveclients/img
        l10nImages: ['de', 'en', 'es', 'fr', 'it', 'nl'],
        // defaults to OX Drive with our logo
        productName: 'OX Drive',
        // App Icon as 144x144px png in base64 encoding as ready to use CSS url: url(data:image/png;base46data)
        appIconAsBase64: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAMAAADQmBKKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAYBQTFRFKWyUtcvXx9fhJ2mQJmaMGGKN2OLnAkp3JmSKNXSaFV2HJGGFLHSdq8TSVYmoR4Sn////h6zBw9Xf/v36KGyTapi09vb04+ruQ3mYA1SD+fj3J2iOMm6R9PX0Km+XdJ206/Dz+vr5KGiPnLnKBVB9f6O3ZJKuNHCVgqa75+3wPHmcdKG6/Pr4C1uK//77LnGZPHOUKGaLe6W9KnCYLnSd9/n6vtDaob3NClWCpMHR8vb5Km6V9/f1ImWOk7bLlLPF+Pv8LG6VDVmGToGf8vT1KW+Xz9zjJmOJJ2aL9PTzKGmQJWWKKGuSIGGJjLDEKWqRJ2eN9vf3N3ie8PLymrfHEVV/IGCGMm2PYY+pPnyhLmySLG+XNnabJGaNIGSMH2eRKW2VVo+wXpGvKmuRJ2WJBleHJWKGK3KbLHOdOHmgOX2j9fb19fX0LGqPb5+7krjNQYClgarCK2uRj6/BLHGaK3CYKm6WJmSJLHGZJWOHLXKbJGKGJWOILXOc9vb1////KmZhwwAAAIB0Uk5T/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wA4BUtnAAAH4UlEQVR42szc+1vayBoH8ICE0WyRVy5CsCqVqKVAgt0aUdEiVA7eeugFK0WNbOWc7Zq6XtsuXeO/fgY9XbmGBELI95den8znmXlnMgOPQ9zWZcnx52nRfvZHz3NmL57+6Viqb5+o+VPC5H6hc9ymREtQYtH+og85W0w0B5ntj/oUu7kJKHH+qI85T9SD/MVHfU3RXwvy2H/vc+zBapC/7x4s8j+A5os3Bkhx/h/Q+Y0hcv4T5LgxSBz3oITdKCB74g60eGOYLFZAiTPjgM4SGGS6MVBMGOQuGyjuW2LphZFAL5YIR9lQcRCrxgKtEqH/GiqnRNFYoCJxdmWo2InPxgLljQb6THz+bqj0BLReybURQOsCGcEhK6n8hhKOrvsFKq+T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)'
    };

});
