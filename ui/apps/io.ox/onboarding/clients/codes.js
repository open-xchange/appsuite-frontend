/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/clients/codes', [], function () {

    'use strict';

    var codes = {

        get: function (id) {
            var hash = codes.hash;
            // single
            if (id) {
                return {
                    label: hash[id].name + ' (' + hash[id] + ')',
                    value: hash[id].code
                };
            }
            // all
            return _.map(hash, function (data) {
                return {
                    label: data.name + ' (' + data.code + ')',
                    value: data.code
                };
            });
        },

        hash: {
            'AF': {
                'name': 'Afghanistan',
                'code': '+93',
                'id': 'AF'
            },
            'AX': {
                'name': 'Aland Islands',
                'code': '+358-18',
                'id': 'AX'
            },
            'AL': {
                'name': 'Albania',
                'code': '+355',
                'id': 'AL'
            },
            'DZ': {
                'name': 'Algeria',
                'code': '+213',
                'id': 'DZ'
            },
            'AS': {
                'name': 'American Samoa',
                'code': '+1-684',
                'id': 'AS'
            },
            'AD': {
                'name': 'Andorra',
                'code': '+376',
                'id': 'AD'
            },
            'AO': {
                'name': 'Angola',
                'code': '+244',
                'id': 'AO'
            },
            'AI': {
                'name': 'Anguilla',
                'code': '+1-264',
                'id': 'AI'
            },
            'AG': {
                'name': 'Antigua and Barbuda',
                'code': '+1-268',
                'id': 'AG'
            },
            'AR': {
                'name': 'Argentina',
                'code': '+54',
                'id': 'AR'
            },
            'AM': {
                'name': 'Armenia',
                'code': '+374',
                'id': 'AM'
            },
            'AW': {
                'name': 'Aruba',
                'code': '+297',
                'id': 'AW'
            },
            'AU': {
                'name': 'Australia',
                'code': '+61',
                'id': 'AU'
            },
            'AT': {
                'name': 'Austria',
                'code': '+43',
                'id': 'AT'
            },
            'AZ': {
                'name': 'Azerbaijan',
                'code': '+994',
                'id': 'AZ'
            },
            'BS': {
                'name': 'Bahamas',
                'code': '+1-242',
                'id': 'BS'
            },
            'BH': {
                'name': 'Bahrain',
                'code': '+973',
                'id': 'BH'
            },
            'BD': {
                'name': 'Bangladesh',
                'code': '+880',
                'id': 'BD'
            },
            'BB': {
                'name': 'Barbados',
                'code': '+1-246',
                'id': 'BB'
            },
            'BY': {
                'name': 'Belarus',
                'code': '+375',
                'id': 'BY'
            },
            'BE': {
                'name': 'Belgium',
                'code': '+32',
                'id': 'BE'
            },
            'BZ': {
                'name': 'Belize',
                'code': '+501',
                'id': 'BZ'
            },
            'BJ': {
                'name': 'Benin',
                'code': '+229',
                'id': 'BJ'
            },
            'BM': {
                'name': 'Bermuda',
                'code': '+1-441',
                'id': 'BM'
            },
            'BT': {
                'name': 'Bhutan',
                'code': '+975',
                'id': 'BT'
            },
            'BO': {
                'name': 'Bolivia',
                'code': '+591',
                'id': 'BO'
            },
            'BQ': {
                'name': 'Bonaire, Saint Eustatius and Saba ',
                'code': '+599',
                'id': 'BQ'
            },
            'BA': {
                'name': 'Bosnia and Herzegovina',
                'code': '+387',
                'id': 'BA'
            },
            'BW': {
                'name': 'Botswana',
                'code': '+267',
                'id': 'BW'
            },
            'BR': {
                'name': 'Brazil',
                'code': '+55',
                'id': 'BR'
            },
            'IO': {
                'name': 'British Indian Ocean Territory',
                'code': '+246',
                'id': 'IO'
            },
            'VG': {
                'name': 'British Virgin Islands',
                'code': '+1-284',
                'id': 'VG'
            },
            'BN': {
                'name': 'Brunei',
                'code': '+673',
                'id': 'BN'
            },
            'BG': {
                'name': 'Bulgaria',
                'code': '+359',
                'id': 'BG'
            },
            'BF': {
                'name': 'Burkina Faso',
                'code': '+226',
                'id': 'BF'
            },
            'BI': {
                'name': 'Burundi',
                'code': '+257',
                'id': 'BI'
            },
            'KH': {
                'name': 'Cambodia',
                'code': '+855',
                'id': 'KH'
            },
            'CM': {
                'name': 'Cameroon',
                'code': '+237',
                'id': 'CM'
            },
            'CA': {
                'name': 'Canada',
                'code': '+1',
                'id': 'CA'
            },
            'CV': {
                'name': 'Cape Verde',
                'code': '+238',
                'id': 'CV'
            },
            'KY': {
                'name': 'Cayman Islands',
                'code': '+1-345',
                'id': 'KY'
            },
            'CF': {
                'name': 'Central African Republic',
                'code': '+236',
                'id': 'CF'
            },
            'TD': {
                'name': 'Chad',
                'code': '+235',
                'id': 'TD'
            },
            'CL': {
                'name': 'Chile',
                'code': '+56',
                'id': 'CL'
            },
            'CN': {
                'name': 'China',
                'code': '+86',
                'id': 'CN'
            },
            'CX': {
                'name': 'Christmas Island',
                'code': '+61',
                'id': 'CX'
            },
            'CC': {
                'name': 'Cocos Islands',
                'code': '+61',
                'id': 'CC'
            },
            'CO': {
                'name': 'Colombia',
                'code': '+57',
                'id': 'CO'
            },
            'KM': {
                'name': 'Comoros',
                'code': '+269',
                'id': 'KM'
            },
            'CK': {
                'name': 'Cook Islands',
                'code': '+682',
                'id': 'CK'
            },
            'CR': {
                'name': 'Costa Rica',
                'code': '+506',
                'id': 'CR'
            },
            'HR': {
                'name': 'Croatia',
                'code': '+385',
                'id': 'HR'
            },
            'CU': {
                'name': 'Cuba',
                'code': '+53',
                'id': 'CU'
            },
            'CW': {
                'name': 'Curacao',
                'code': '+599',
                'id': 'CW'
            },
            'CY': {
                'name': 'Cyprus',
                'code': '+357',
                'id': 'CY'
            },
            'CZ': {
                'name': 'Czech Republic',
                'code': '+420',
                'id': 'CZ'
            },
            'CD': {
                'name': 'Democratic Republic of the Congo',
                'code': '+243',
                'id': 'CD'
            },
            'DK': {
                'name': 'Denmark',
                'code': '+45',
                'id': 'DK'
            },
            'DJ': {
                'name': 'Djibouti',
                'code': '+253',
                'id': 'DJ'
            },
            'DM': {
                'name': 'Dominica',
                'code': '+1-767',
                'id': 'DM'
            },
            'DO': {
                'name': 'Dominican Republic',
                'code': '+1-809 and 1-829',
                'id': 'DO'
            },
            'TL': {
                'name': 'East Timor',
                'code': '+670',
                'id': 'TL'
            },
            'EC': {
                'name': 'Ecuador',
                'code': '+593',
                'id': 'EC'
            },
            'EG': {
                'name': 'Egypt',
                'code': '+20',
                'id': 'EG'
            },
            'SV': {
                'name': 'El Salvador',
                'code': '+503',
                'id': 'SV'
            },
            'GQ': {
                'name': 'Equatorial Guinea',
                'code': '+240',
                'id': 'GQ'
            },
            'ER': {
                'name': 'Eritrea',
                'code': '+291',
                'id': 'ER'
            },
            'EE': {
                'name': 'Estonia',
                'code': '+372',
                'id': 'EE'
            },
            'ET': {
                'name': 'Ethiopia',
                'code': '+251',
                'id': 'ET'
            },
            'FK': {
                'name': 'Falkland Islands',
                'code': '+500',
                'id': 'FK'
            },
            'FO': {
                'name': 'Faroe Islands',
                'code': '+298',
                'id': 'FO'
            },
            'FJ': {
                'name': 'Fiji',
                'code': '+679',
                'id': 'FJ'
            },
            'FI': {
                'name': 'Finland',
                'code': '+358',
                'id': 'FI'
            },
            'FR': {
                'name': 'France',
                'code': '+33',
                'id': 'FR'
            },
            'GF': {
                'name': 'French Guiana',
                'code': '+594',
                'id': 'GF'
            },
            'PF': {
                'name': 'French Polynesia',
                'code': '+689',
                'id': 'PF'
            },
            'GA': {
                'name': 'Gabon',
                'code': '+241',
                'id': 'GA'
            },
            'GM': {
                'name': 'Gambia',
                'code': '+220',
                'id': 'GM'
            },
            'GE': {
                'name': 'Georgia',
                'code': '+995',
                'id': 'GE'
            },
            'DE': {
                'name': 'Germany',
                'code': '+49',
                'id': 'DE'
            },
            'GH': {
                'name': 'Ghana',
                'code': '+233',
                'id': 'GH'
            },
            'GI': {
                'name': 'Gibraltar',
                'code': '+350',
                'id': 'GI'
            },
            'GR': {
                'name': 'Greece',
                'code': '+30',
                'id': 'GR'
            },
            'GL': {
                'name': 'Greenland',
                'code': '+299',
                'id': 'GL'
            },
            'GD': {
                'name': 'Grenada',
                'code': '+1-473',
                'id': 'GD'
            },
            'GP': {
                'name': 'Guadeloupe',
                'code': '+590',
                'id': 'GP'
            },
            'GU': {
                'name': 'Guam',
                'code': '+1-671',
                'id': 'GU'
            },
            'GT': {
                'name': 'Guatemala',
                'code': '+502',
                'id': 'GT'
            },
            'GG': {
                'name': 'Guernsey',
                'code': '+44-1481',
                'id': 'GG'
            },
            'GN': {
                'name': 'Guinea',
                'code': '+224',
                'id': 'GN'
            },
            'GW': {
                'name': 'Guinea-Bissau',
                'code': '+245',
                'id': 'GW'
            },
            'GY': {
                'name': 'Guyana',
                'code': '+592',
                'id': 'GY'
            },
            'HT': {
                'name': 'Haiti',
                'code': '+509',
                'id': 'HT'
            },
            'HM': {
                'name': 'Heard Island and McDonald Islands',
                'code': ' ',
                'id': 'HM'
            },
            'HN': {
                'name': 'Honduras',
                'code': '+504',
                'id': 'HN'
            },
            'HK': {
                'name': 'Hong Kong',
                'code': '+852',
                'id': 'HK'
            },
            'HU': {
                'name': 'Hungary',
                'code': '+36',
                'id': 'HU'
            },
            'IS': {
                'name': 'Iceland',
                'code': '+354',
                'id': 'IS'
            },
            'IN': {
                'name': 'India',
                'code': '+91',
                'id': 'IN'
            },
            'ID': {
                'name': 'Indonesia',
                'code': '+62',
                'id': 'ID'
            },
            'IR': {
                'name': 'Iran',
                'code': '+98',
                'id': 'IR'
            },
            'IQ': {
                'name': 'Iraq',
                'code': '+964',
                'id': 'IQ'
            },
            'IE': {
                'name': 'Ireland',
                'code': '+353',
                'id': 'IE'
            },
            'IM': {
                'name': 'Isle of Man',
                'code': '+44-1624',
                'id': 'IM'
            },
            'IL': {
                'name': 'Israel',
                'code': '+972',
                'id': 'IL'
            },
            'IT': {
                'name': 'Italy',
                'code': '+39',
                'id': 'IT'
            },
            'CI': {
                'name': 'Ivory Coast',
                'code': '+225',
                'id': 'CI'
            },
            'JM': {
                'name': 'Jamaica',
                'code': '+1-876',
                'id': 'JM'
            },
            'JP': {
                'name': 'Japan',
                'code': '+81',
                'id': 'JP'
            },
            'JE': {
                'name': 'Jersey',
                'code': '+44-1534',
                'id': 'JE'
            },
            'JO': {
                'name': 'Jordan',
                'code': '+962',
                'id': 'JO'
            },
            'KZ': {
                'name': 'Kazakhstan',
                'code': '+7',
                'id': 'KZ'
            },
            'KE': {
                'name': 'Kenya',
                'code': '+254',
                'id': 'KE'
            },
            'KI': {
                'name': 'Kiribati',
                'code': '+686',
                'id': 'KI'
            },
            'KW': {
                'name': 'Kuwait',
                'code': '+965',
                'id': 'KW'
            },
            'KG': {
                'name': 'Kyrgyzstan',
                'code': '+996',
                'id': 'KG'
            },
            'LA': {
                'name': 'Laos',
                'code': '+856',
                'id': 'LA'
            },
            'LV': {
                'name': 'Latvia',
                'code': '+371',
                'id': 'LV'
            },
            'LB': {
                'name': 'Lebanon',
                'code': '+961',
                'id': 'LB'
            },
            'LS': {
                'name': 'Lesotho',
                'code': '+266',
                'id': 'LS'
            },
            'LR': {
                'name': 'Liberia',
                'code': '+231',
                'id': 'LR'
            },
            'LY': {
                'name': 'Libya',
                'code': '+218',
                'id': 'LY'
            },
            'LI': {
                'name': 'Liechtenstein',
                'code': '+423',
                'id': 'LI'
            },
            'LT': {
                'name': 'Lithuania',
                'code': '+370',
                'id': 'LT'
            },
            'LU': {
                'name': 'Luxembourg',
                'code': '+352',
                'id': 'LU'
            },
            'MO': {
                'name': 'Macao',
                'code': '+853',
                'id': 'MO'
            },
            'MK': {
                'name': 'Macedonia',
                'code': '+389',
                'id': 'MK'
            },
            'MG': {
                'name': 'Madagascar',
                'code': '+261',
                'id': 'MG'
            },
            'MW': {
                'name': 'Malawi',
                'code': '+265',
                'id': 'MW'
            },
            'MY': {
                'name': 'Malaysia',
                'code': '+60',
                'id': 'MY'
            },
            'MV': {
                'name': 'Maldives',
                'code': '+960',
                'id': 'MV'
            },
            'ML': {
                'name': 'Mali',
                'code': '+223',
                'id': 'ML'
            },
            'MT': {
                'name': 'Malta',
                'code': '+356',
                'id': 'MT'
            },
            'MH': {
                'name': 'Marshall Islands',
                'code': '+692',
                'id': 'MH'
            },
            'MQ': {
                'name': 'Martinique',
                'code': '+596',
                'id': 'MQ'
            },
            'MR': {
                'name': 'Mauritania',
                'code': '+222',
                'id': 'MR'
            },
            'MU': {
                'name': 'Mauritius',
                'code': '+230',
                'id': 'MU'
            },
            'YT': {
                'name': 'Mayotte',
                'code': '+262',
                'id': 'YT'
            },
            'MX': {
                'name': 'Mexico',
                'code': '+52',
                'id': 'MX'
            },
            'FM': {
                'name': 'Micronesia',
                'code': '+691',
                'id': 'FM'
            },
            'MD': {
                'name': 'Moldova',
                'code': '+373',
                'id': 'MD'
            },
            'MC': {
                'name': 'Monaco',
                'code': '+377',
                'id': 'MC'
            },
            'MN': {
                'name': 'Mongolia',
                'code': '+976',
                'id': 'MN'
            },
            'ME': {
                'name': 'Montenegro',
                'code': '+382',
                'id': 'ME'
            },
            'MS': {
                'name': 'Montserrat',
                'code': '+1-664',
                'id': 'MS'
            },
            'MA': {
                'name': 'Morocco',
                'code': '+212',
                'id': 'MA'
            },
            'MZ': {
                'name': 'Mozambique',
                'code': '+258',
                'id': 'MZ'
            },
            'MM': {
                'name': 'Myanmar',
                'code': '+95',
                'id': 'MM'
            },
            'NA': {
                'name': 'Namibia',
                'code': '+264',
                'id': 'NA'
            },
            'NR': {
                'name': 'Nauru',
                'code': '+674',
                'id': 'NR'
            },
            'NP': {
                'name': 'Nepal',
                'code': '+977',
                'id': 'NP'
            },
            'NL': {
                'name': 'Netherlands',
                'code': '+31',
                'id': 'NL'
            },
            'NC': {
                'name': 'New Caledonia',
                'code': '+687',
                'id': 'NC'
            },
            'NZ': {
                'name': 'New Zealand',
                'code': '+64',
                'id': 'NZ'
            },
            'NI': {
                'name': 'Nicaragua',
                'code': '+505',
                'id': 'NI'
            },
            'NE': {
                'name': 'Niger',
                'code': '+227',
                'id': 'NE'
            },
            'NG': {
                'name': 'Nigeria',
                'code': '+234',
                'id': 'NG'
            },
            'NU': {
                'name': 'Niue',
                'code': '+683',
                'id': 'NU'
            },
            'NF': {
                'name': 'Norfolk Island',
                'code': '+672',
                'id': 'NF'
            },
            'KP': {
                'name': 'North Korea',
                'code': '+850',
                'id': 'KP'
            },
            'MP': {
                'name': 'Northern Mariana Islands',
                'code': '+1-670',
                'id': 'MP'
            },
            'NO': {
                'name': 'Norway',
                'code': '+47',
                'id': 'NO'
            },
            'OM': {
                'name': 'Oman',
                'code': '+968',
                'id': 'OM'
            },
            'PK': {
                'name': 'Pakistan',
                'code': '+92',
                'id': 'PK'
            },
            'PW': {
                'name': 'Palau',
                'code': '+680',
                'id': 'PW'
            },
            'PS': {
                'name': 'Palestinian Territory',
                'code': '+970',
                'id': 'PS'
            },
            'PA': {
                'name': 'Panama',
                'code': '+507',
                'id': 'PA'
            },
            'PG': {
                'name': 'Papua New Guinea',
                'code': '+675',
                'id': 'PG'
            },
            'PY': {
                'name': 'Paraguay',
                'code': '+595',
                'id': 'PY'
            },
            'PE': {
                'name': 'Peru',
                'code': '+51',
                'id': 'PE'
            },
            'PH': {
                'name': 'Philippines',
                'code': '+63',
                'id': 'PH'
            },
            'PN': {
                'name': 'Pitcairn',
                'code': '+870',
                'id': 'PN'
            },
            'PL': {
                'name': 'Poland',
                'code': '+48',
                'id': 'PL'
            },
            'PT': {
                'name': 'Portugal',
                'code': '+351',
                'id': 'PT'
            },
            'PR': {
                'name': 'Puerto Rico',
                'code': '+1-787 and 1-939',
                'id': 'PR'
            },
            'QA': {
                'name': 'Qatar',
                'code': '+974',
                'id': 'QA'
            },
            'CG': {
                'name': 'Republic of the Congo',
                'code': '+242',
                'id': 'CG'
            },
            'RE': {
                'name': 'Reunion',
                'code': '+262',
                'id': 'RE'
            },
            'RO': {
                'name': 'Romania',
                'code': '+40',
                'id': 'RO'
            },
            'RU': {
                'name': 'Russia',
                'code': '+7',
                'id': 'RU'
            },
            'RW': {
                'name': 'Rwanda',
                'code': '+250',
                'id': 'RW'
            },
            'BL': {
                'name': 'Saint Barthelemy',
                'code': '+590',
                'id': 'BL'
            },
            'SH': {
                'name': 'Saint Helena',
                'code': '+290',
                'id': 'SH'
            },
            'KN': {
                'name': 'Saint Kitts and Nevis',
                'code': '+1-869',
                'id': 'KN'
            },
            'LC': {
                'name': 'Saint Lucia',
                'code': '+1-758',
                'id': 'LC'
            },
            'MF': {
                'name': 'Saint Martin',
                'code': '+590',
                'id': 'MF'
            },
            'PM': {
                'name': 'Saint Pierre and Miquelon',
                'code': '+508',
                'id': 'PM'
            },
            'VC': {
                'name': 'Saint Vincent and the Grenadines',
                'code': '+1-784',
                'id': 'VC'
            },
            'WS': {
                'name': 'Samoa',
                'code': '+685',
                'id': 'WS'
            },
            'SM': {
                'name': 'San Marino',
                'code': '+378',
                'id': 'SM'
            },
            'ST': {
                'name': 'Sao Tome and Principe',
                'code': '+239',
                'id': 'ST'
            },
            'SA': {
                'name': 'Saudi Arabia',
                'code': '+966',
                'id': 'SA'
            },
            'SN': {
                'name': 'Senegal',
                'code': '+221',
                'id': 'SN'
            },
            'RS': {
                'name': 'Serbia',
                'code': '+381',
                'id': 'RS'
            },
            'SC': {
                'name': 'Seychelles',
                'code': '+248',
                'id': 'SC'
            },
            'SL': {
                'name': 'Sierra Leone',
                'code': '+232',
                'id': 'SL'
            },
            'SG': {
                'name': 'Singapore',
                'code': '+65',
                'id': 'SG'
            },
            'SX': {
                'name': 'Sint Maarten',
                'code': '+599',
                'id': 'SX'
            },
            'SK': {
                'name': 'Slovakia',
                'code': '+421',
                'id': 'SK'
            },
            'SI': {
                'name': 'Slovenia',
                'code': '+386',
                'id': 'SI'
            },
            'SB': {
                'name': 'Solomon Islands',
                'code': '+677',
                'id': 'SB'
            },
            'SO': {
                'name': 'Somalia',
                'code': '+252',
                'id': 'SO'
            },
            'ZA': {
                'name': 'South Africa',
                'code': '+27',
                'id': 'ZA'
            },
            'KR': {
                'name': 'South Korea',
                'code': '+82',
                'id': 'KR'
            },
            'SS': {
                'name': 'South Sudan',
                'code': '+211',
                'id': 'SS'
            },
            'ES': {
                'name': 'Spain',
                'code': '+34',
                'id': 'ES'
            },
            'LK': {
                'name': 'Sri Lanka',
                'code': '+94',
                'id': 'LK'
            },
            'SD': {
                'name': 'Sudan',
                'code': '+249',
                'id': 'SD'
            },
            'SR': {
                'name': 'Suriname',
                'code': '+597',
                'id': 'SR'
            },
            'SJ': {
                'name': 'Svalbard and Jan Mayen',
                'code': '+47',
                'id': 'SJ'
            },
            'SZ': {
                'name': 'Swaziland',
                'code': '+268',
                'id': 'SZ'
            },
            'SE': {
                'name': 'Sweden',
                'code': '+46',
                'id': 'SE'
            },
            'CH': {
                'name': 'Switzerland',
                'code': '+41',
                'id': 'CH'
            },
            'SY': {
                'name': 'Syria',
                'code': '+963',
                'id': 'SY'
            },
            'TW': {
                'name': 'Taiwan',
                'code': '+886',
                'id': 'TW'
            },
            'TJ': {
                'name': 'Tajikistan',
                'code': '+992',
                'id': 'TJ'
            },
            'TZ': {
                'name': 'Tanzania',
                'code': '+255',
                'id': 'TZ'
            },
            'TH': {
                'name': 'Thailand',
                'code': '+66',
                'id': 'TH'
            },
            'TG': {
                'name': 'Togo',
                'code': '+228',
                'id': 'TG'
            },
            'TK': {
                'name': 'Tokelau',
                'code': '+690',
                'id': 'TK'
            },
            'TO': {
                'name': 'Tonga',
                'code': '+676',
                'id': 'TO'
            },
            'TT': {
                'name': 'Trinidad and Tobago',
                'code': '+1-868',
                'id': 'TT'
            },
            'TN': {
                'name': 'Tunisia',
                'code': '+216',
                'id': 'TN'
            },
            'TR': {
                'name': 'Turkey',
                'code': '+90',
                'id': 'TR'
            },
            'TM': {
                'name': 'Turkmenistan',
                'code': '+993',
                'id': 'TM'
            },
            'TC': {
                'name': 'Turks and Caicos Islands',
                'code': '+1-649',
                'id': 'TC'
            },
            'TV': {
                'name': 'Tuvalu',
                'code': '+688',
                'id': 'TV'
            },
            'VI': {
                'name': 'U.S. Virgin Islands',
                'code': '+1-340',
                'id': 'VI'
            },
            'UG': {
                'name': 'Uganda',
                'code': '+256',
                'id': 'UG'
            },
            'UA': {
                'name': 'Ukraine',
                'code': '+380',
                'id': 'UA'
            },
            'AE': {
                'name': 'United Arab Emirates',
                'code': '+971',
                'id': 'AE'
            },
            'GB': {
                'name': 'United Kingdom',
                'code': '+44',
                'id': 'GB'
            },
            'US': {
                'name': 'United States',
                'code': '+1',
                'id': 'US'
            },
            'UM': {
                'name': 'United States Minor Outlying Islands',
                'code': '+1',
                'id': 'UM'
            },
            'UY': {
                'name': 'Uruguay',
                'code': '+598',
                'id': 'UY'
            },
            'UZ': {
                'name': 'Uzbekistan',
                'code': '+998',
                'id': 'UZ'
            },
            'VU': {
                'name': 'Vanuatu',
                'code': '+678',
                'id': 'VU'
            },
            'VA': {
                'name': 'Vatican',
                'code': '+379',
                'id': 'VA'
            },
            'VE': {
                'name': 'Venezuela',
                'code': '+58',
                'id': 'VE'
            },
            'VN': {
                'name': 'Vietnam',
                'code': '+84',
                'id': 'VN'
            },
            'WF': {
                'name': 'Wallis and Futuna',
                'code': '+681',
                'id': 'WF'
            },
            'EH': {
                'name': 'Western Sahara',
                'code': '+212',
                'id': 'EH'
            },
            'YE': {
                'name': 'Yemen',
                'code': '+967',
                'id': 'YE'
            },
            'ZM': {
                'name': 'Zambia',
                'code': '+260',
                'id': 'ZM'
            },
            'ZW': {
                'name': 'Zimbabwe',
                'code': '+263',
                'id': 'ZW'
            }
        }
    };
    return codes;
});
