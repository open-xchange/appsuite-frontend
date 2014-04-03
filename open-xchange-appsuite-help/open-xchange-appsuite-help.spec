Name:           open-xchange-appsuite
Version:        7.6.0
%define         ox_release 0
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA
Summary:        OX App Suite HTML5 client
Source:         %{name}_%{version}.orig.tar.gz

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%if 0%{?suse_version}
Requires:       apache2
%endif
%if 0%{?fedora_version} || 0%{?rhel_version}
Requires:       httpd
%endif

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/appsuite
%else
%define docroot /srv/www/htdocs/appsuite
%endif

%description
OX App Suite HTML5 client

%package        manifest
Group:          Applications/Productivity
Summary:        Manifest and apps included in the OX App Suite HTML5 client
Requires:       open-xchange-core
Requires(post): open-xchange-halo
Requires:       open-xchange-appsuite-l10n-en-us

%description    manifest
OX App Suite HTML5 client

This package contains the manifest for installation on the backend.

%package        help-common
Group:          Applications/Productivity
Summary:        Language-independent files of online help for OX App Suite

%description    help-common
Language-independent files of online help for OX App Suite

%package       help-de-de
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (de_DE)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-de-de
Online help for OX App Suite (de_DE)

%package       help-en-gb
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (en_GB)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-en-gb
Online help for OX App Suite (en_GB)

%package       help-en-us
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (en_US)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-en-us
Online help for OX App Suite (en_US)

%package       help-es-es
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (es_ES)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-es-es
Online help for OX App Suite (es_ES)

%package       help-es-mx
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (es_MX)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-es-mx
Online help for OX App Suite (es_MX)

%package       help-fr-fr
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (fr_FR)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-fr-fr
Online help for OX App Suite (fr_FR)

%package       help-it-it
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (it_IT)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-it-it
Online help for OX App Suite (it_IT)

%package       help-ja-jp
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (ja_JP)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-ja-jp
Online help for OX App Suite (ja_JP)

%package       help-nl-nl
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (nl_NL)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-nl-nl
Online help for OX App Suite (nl_NL)

%package       help-pl-pl
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (pl_PL)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-pl-pl
Online help for OX App Suite (pl_PL)

%package       help-zh-cn
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (zh_CN)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-zh-cn
Online help for OX App Suite (zh_CN)

%package       help-zh-tw
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (zh_TW)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   help-zh-tw
Online help for OX App Suite (zh_TW)

%package        help-drive-common
Group:          Applications/Productivity
Summary:        Language-independent files of online help for OX Drive

%description    help-drive-common
Language-independent files of online help for OX Drive

%package       help-drive-de-de
Group:         Applications/Productivity
Summary:       Online help for OX Drive (de_DE)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-de-de
Online help for OX Drive (de_DE)

%package       help-drive-en-gb
Group:         Applications/Productivity
Summary:       Online help for OX Drive (en_GB)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-en-gb
Online help for OX Drive (en_GB)

%package       help-drive-en-us
Group:         Applications/Productivity
Summary:       Online help for OX Drive (en_US)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-en-us
Online help for OX Drive (en_US)

%package       help-drive-es-es
Group:         Applications/Productivity
Summary:       Online help for OX Drive (es_ES)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-es-es
Online help for OX Drive (es_ES)

%package       help-drive-es-mx
Group:         Applications/Productivity
Summary:       Online help for OX Drive (es_MX)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-es-mx
Online help for OX Drive (es_MX)

%package       help-drive-fr-fr
Group:         Applications/Productivity
Summary:       Online help for OX Drive (fr_FR)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-fr-fr
Online help for OX Drive (fr_FR)

%package       help-drive-it-it
Group:         Applications/Productivity
Summary:       Online help for OX Drive (it_IT)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-it-it
Online help for OX Drive (it_IT)

%package       help-drive-ja-jp
Group:         Applications/Productivity
Summary:       Online help for OX Drive (ja_JP)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-ja-jp
Online help for OX Drive (ja_JP)

%package       help-drive-nl-nl
Group:         Applications/Productivity
Summary:       Online help for OX Drive (nl_NL)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-nl-nl
Online help for OX Drive (nl_NL)

%package       help-drive-pl-pl
Group:         Applications/Productivity
Summary:       Online help for OX Drive (pl_PL)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-pl-pl
Online help for OX Drive (pl_PL)

%package       help-drive-zh-cn
Group:         Applications/Productivity
Summary:       Online help for OX Drive (zh_CN)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-zh-cn
Online help for OX Drive (zh_CN)

%package       help-drive-zh-tw
Group:         Applications/Productivity
Summary:       Online help for OX Drive (zh_TW)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   help-drive-zh-tw
Online help for OX Drive (zh_TW)


%package       l10n-cs-cz
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-cs-cz
Provides:      open-xchange-appsuite-l10n

%description   l10n-cs-cz
Translation of the OX App Suite HTML5 client (cs_CZ)

%package       l10n-da-dk
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-da-dk
Provides:      open-xchange-appsuite-l10n

%description   l10n-da-dk
Translation of the OX App Suite HTML5 client (da_DK)

%package       l10n-de-de
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-de-de
Provides:      open-xchange-appsuite-l10n

%description   l10n-de-de
Translation of the OX App Suite HTML5 client (de_DE)

%package       l10n-en-gb
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-en-gb
Provides:      open-xchange-appsuite-l10n

%description   l10n-en-gb
Translation of the OX App Suite HTML5 client (en_GB)

%package       l10n-en-us
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-en-us
Provides:      open-xchange-appsuite-l10n

%description   l10n-en-us
Translation of the OX App Suite HTML5 client (en_US)

%package       l10n-es-es
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-es-es
Provides:      open-xchange-appsuite-l10n

%description   l10n-es-es
Translation of the OX App Suite HTML5 client (es_ES)

%package       l10n-es-mx
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-es-mx
Provides:      open-xchange-appsuite-l10n

%description   l10n-es-mx
Translation of the OX App Suite HTML5 client (es_MX)

%package       l10n-fi-fi
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-fi-fi
Provides:      open-xchange-appsuite-l10n

%description   l10n-fi-fi
Translation of the OX App Suite HTML5 client (fi_FI)

%package       l10n-fr-ca
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-fr-ca
Provides:      open-xchange-appsuite-l10n

%description   l10n-fr-ca
Translation of the OX App Suite HTML5 client (fr_CA)

%package       l10n-fr-fr
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-fr-fr
Provides:      open-xchange-appsuite-l10n

%description   l10n-fr-fr
Translation of the OX App Suite HTML5 client (fr_FR)

%package       l10n-hu-hu
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-hu-hu
Provides:      open-xchange-appsuite-l10n

%description   l10n-hu-hu
Translation of the OX App Suite HTML5 client (hu_HU)

%package       l10n-it-it
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-it-it
Provides:      open-xchange-appsuite-l10n

%description   l10n-it-it
Translation of the OX App Suite HTML5 client (it_IT)

%package       l10n-ja-jp
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-ja-jp
Provides:      open-xchange-appsuite-l10n

%description   l10n-ja-jp
Translation of the OX App Suite HTML5 client (ja_JP)

%package       l10n-lv-lv
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-lv-lv
Provides:      open-xchange-appsuite-l10n

%description   l10n-lv-lv
Translation of the OX App Suite HTML5 client (lv_LV)

%package       l10n-nl-nl
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-nl-nl
Provides:      open-xchange-appsuite-l10n

%description   l10n-nl-nl
Translation of the OX App Suite HTML5 client (nl_NL)

%package       l10n-pl-pl
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-pl-pl
Provides:      open-xchange-appsuite-l10n

%description   l10n-pl-pl
Translation of the OX App Suite HTML5 client (pl_PL)

%package       l10n-pt-br
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-pt-br
Provides:      open-xchange-appsuite-l10n

%description   l10n-pt-br
Translation of the OX App Suite HTML5 client (pt_BR)

%package       l10n-ro-ro
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-ro-ro
Provides:      open-xchange-appsuite-l10n

%description   l10n-ro-ro
Translation of the OX App Suite HTML5 client (ro_RO)

%package       l10n-ru-ru
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-ru-ru
Provides:      open-xchange-appsuite-l10n

%description   l10n-ru-ru
Translation of the OX App Suite HTML5 client (ru_RU)

%package       l10n-sk-sk
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-sk-sk
Provides:      open-xchange-appsuite-l10n

%description   l10n-sk-sk
Translation of the OX App Suite HTML5 client (sk_SK)

%package       l10n-sv-se
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-sv-se
Provides:      open-xchange-appsuite-l10n

%description   l10n-sv-se
Translation of the OX App Suite HTML5 client (sv_SE)

%package       l10n-zh-cn
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-zh-cn
Provides:      open-xchange-appsuite-l10n

%description   l10n-zh-cn
Translation of the OX App Suite HTML5 client (zh_CN)

%package       l10n-zh-tw
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (## Lang ##)
Requires:      open-xchange-l10n-zh-tw
Provides:      open-xchange-appsuite-l10n

%description   l10n-zh-tw
Translation of the OX App Suite HTML5 client (zh_TW)


%prep
%setup -q

%build

%install
APPSUITE=/opt/open-xchange/appsuite/


find apps \( -type f -o -type l \) -name '*.cs_CZ.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.cs_CZ.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-cs-cz

find apps \( -type f -o -type l \) -name '*.da_DK.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.da_DK.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-da-dk

find apps \( -type f -o -type l \) -name '*.de_DE.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.de_DE.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-de-de

find apps \( -type f -o -type l \) -name '*.en_GB.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.en_GB.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-en-gb

find apps \( -type f -o -type l \) -name '*.en_US.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.en_US.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-en-us

find apps \( -type f -o -type l \) -name '*.es_ES.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.es_ES.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-es-es

find apps \( -type f -o -type l \) -name '*.es_MX.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.es_MX.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-es-mx

find apps \( -type f -o -type l \) -name '*.fi_FI.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.fi_FI.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-fi-fi

find apps \( -type f -o -type l \) -name '*.fr_CA.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.fr_CA.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-fr-ca

find apps \( -type f -o -type l \) -name '*.fr_FR.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.fr_FR.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-fr-fr

find apps \( -type f -o -type l \) -name '*.hu_HU.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.hu_HU.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-hu-hu

find apps \( -type f -o -type l \) -name '*.it_IT.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.it_IT.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-it-it

find apps \( -type f -o -type l \) -name '*.ja_JP.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.ja_JP.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-ja-jp

find apps \( -type f -o -type l \) -name '*.lv_LV.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.lv_LV.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-lv-lv

find apps \( -type f -o -type l \) -name '*.nl_NL.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.nl_NL.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-nl-nl

find apps \( -type f -o -type l \) -name '*.pl_PL.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.pl_PL.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-pl-pl

find apps \( -type f -o -type l \) -name '*.pt_BR.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.pt_BR.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-pt-br

find apps \( -type f -o -type l \) -name '*.ro_RO.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.ro_RO.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-ro-ro

find apps \( -type f -o -type l \) -name '*.ru_RU.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.ru_RU.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-ru-ru

find apps \( -type f -o -type l \) -name '*.sk_SK.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.sk_SK.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-sk-sk

find apps \( -type f -o -type l \) -name '*.sv_SE.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.sv_SE.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-sv-se

find apps \( -type f -o -type l \) -name '*.zh_CN.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.zh_CN.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-zh-cn

find apps \( -type f -o -type l \) -name '*.zh_TW.js' \
    -print0 | xargs -0 -I '{}' sh -c 'mkdir -p "tmp/l10n/`dirname {}`"; mv "{}" "tmp/l10n/{}"'
find tmp/l10n/apps \( -type f -o -type l \) -name '*.zh_TW.js' \
   | sed -e "s,tmp/l10n/,$APPSUITE," > tmp/files-zh-tw


mkdir -p "%{buildroot}$APPSUITE"
mkdir -p "%{buildroot}%{docroot}"
cp -r apps "%{buildroot}%{docroot}"
cp -r apps "%{buildroot}$APPSUITE"
cp -r manifests "%{buildroot}%{docroot}"
cp -r manifests "%{buildroot}$APPSUITE"
cp core "%{buildroot}%{docroot}"
cp core "%{buildroot}$APPSUITE"
cp signin "%{buildroot}%{docroot}"
cp signin "%{buildroot}$APPSUITE"
cp *.* "%{buildroot}%{docroot}"
cp *.* "%{buildroot}$APPSUITE"
cp .htaccess "%{buildroot}%{docroot}"
cp -r help "%{buildroot}%{docroot}"
cp -r help-drive "%{buildroot}%{docroot}"

mkdir -p "%{buildroot}/opt/open-xchange/sbin"
sed -e "s:## cd ##:cd %{docroot}:" bin/touch-appsuite > \
    "%{buildroot}/opt/open-xchange/sbin/touch-appsuite"
chmod +x "%{buildroot}/opt/open-xchange/sbin/touch-appsuite"

find "%{buildroot}$APPSUITE" -type d \
    | sed -e 's,%{buildroot},%dir ,' > tmp/files
find "%{buildroot}$APPSUITE" \( -type f -o -type l \) \
    | sed -e 's,%{buildroot},,' >> tmp/files

cp -r tmp/l10n/apps "%{buildroot}$APPSUITE"
mkdir -p "%{buildroot}/opt/open-xchange/etc/languages/appsuite/"
cp i18n/*.properties "%{buildroot}/opt/open-xchange/etc/languages/appsuite/"


%clean
APPSUITE=/opt/open-xchange/appsuite/
rm -r "%{buildroot}%{docroot}"
rm -r "%{buildroot}$APPSUITE"

%define update /opt/open-xchange/appsuite/share/update-themes.sh

%post manifest
if [ $1 -eq 1 -a -x %{update} ]; then %{update}; fi

%postun manifest
if [ $1 -lt 1 ]; then
    rm -rf /opt/open-xchange/appsuite/apps/themes/*/less || true
else
    if [ -x %{update} ]; then %{update}; fi
fi

%triggerpostun manifest -- open-xchange-appsuite-manifest < 7.2.0
if [ -x %{update} ]; then %{update}; fi

%files
%defattr(-,root,root)
%doc readme.txt
%{docroot}
%exclude %{docroot}/help
%exclude %{docroot}/help-drive
%config(noreplace) %{docroot}/apps/themes/.htaccess
%dir /opt/open-xchange
%dir /opt/open-xchange/sbin
/opt/open-xchange/sbin/touch-appsuite

%files manifest -f tmp/files
%defattr(-,root,root)
%dir /opt/open-xchange

%files help-common
%defattr(-,root,root)
%{docroot}/help
%exclude %{docroot}/help/l10n


%files help-de-de
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/de_DE

%files help-en-gb
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/en_GB

%files help-en-us
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/en_US

%files help-es-es
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/es_ES

%files help-es-mx
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/es_MX

%files help-fr-fr
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/fr_FR

%files help-it-it
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/it_IT

%files help-ja-jp
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/ja_JP

%files help-nl-nl
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/nl_NL

%files help-pl-pl
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/pl_PL

%files help-zh-cn
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/zh_CN

%files help-zh-tw
%defattr(-,root,root)
%dir %{docroot}/help/l10n
%{docroot}/help/l10n/zh_TW


%files help-drive-common
%defattr(-,root,root)
%{docroot}/help-drive
%exclude %{docroot}/help-drive/l10n


%files help-drive-de-de
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/de_DE

%files help-drive-en-gb
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/en_GB

%files help-drive-en-us
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/en_US

%files help-drive-es-es
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/es_ES

%files help-drive-es-mx
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/es_MX

%files help-drive-fr-fr
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/fr_FR

%files help-drive-it-it
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/it_IT

%files help-drive-ja-jp
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/ja_JP

%files help-drive-nl-nl
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/nl_NL

%files help-drive-pl-pl
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/pl_PL

%files help-drive-zh-cn
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/zh_CN

%files help-drive-zh-tw
%defattr(-,root,root)
%dir %{docroot}/help-drive/l10n
%{docroot}/help-drive/l10n/zh_TW


%files l10n-cs-cz -f tmp/files-cs-cz
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-cs-cz.properties

%files l10n-da-dk -f tmp/files-da-dk
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-da-dk.properties

%files l10n-de-de -f tmp/files-de-de
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-de-de.properties

%files l10n-en-gb -f tmp/files-en-gb
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-en-gb.properties

%files l10n-en-us -f tmp/files-en-us
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-en-us.properties

%files l10n-es-es -f tmp/files-es-es
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-es-es.properties

%files l10n-es-mx -f tmp/files-es-mx
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-es-mx.properties

%files l10n-fi-fi -f tmp/files-fi-fi
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fi-fi.properties

%files l10n-fr-ca -f tmp/files-fr-ca
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fr-ca.properties

%files l10n-fr-fr -f tmp/files-fr-fr
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fr-fr.properties

%files l10n-hu-hu -f tmp/files-hu-hu
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-hu-hu.properties

%files l10n-it-it -f tmp/files-it-it
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-it-it.properties

%files l10n-ja-jp -f tmp/files-ja-jp
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ja-jp.properties

%files l10n-lv-lv -f tmp/files-lv-lv
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-lv-lv.properties

%files l10n-nl-nl -f tmp/files-nl-nl
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-nl-nl.properties

%files l10n-pl-pl -f tmp/files-pl-pl
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-pl-pl.properties

%files l10n-pt-br -f tmp/files-pt-br
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-pt-br.properties

%files l10n-ro-ro -f tmp/files-ro-ro
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ro-ro.properties

%files l10n-ru-ru -f tmp/files-ru-ru
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ru-ru.properties

%files l10n-sk-sk -f tmp/files-sk-sk
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-sk-sk.properties

%files l10n-sv-se -f tmp/files-sv-se
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-sv-se.properties

%files l10n-zh-cn -f tmp/files-zh-cn
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-zh-cn.properties

%files l10n-zh-tw -f tmp/files-zh-tw
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-zh-tw.properties


%changelog
