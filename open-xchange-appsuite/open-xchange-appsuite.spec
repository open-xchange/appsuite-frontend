Name:           open-xchange-appsuite
BuildArch:      noarch
BuildRequires:  ant
BuildRequires:  ant-nodeps
BuildRequires:  java-devel >= 1.6.0
BuildRequires:  nodejs >= 0.10.0
Version:        7.6.0
%define         ox_release 0
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Julian Baeume <julian.baeume@open-xchange.com>
License:        CC-BY-NC-SA
Summary:        OX App Suite HTML5 client
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%if 0%{?suse_version}
Requires:       apache2
%endif
%if 0%{?fedora_version} || 0%{?rhel_version}
Requires:       httpd
%endif

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/
%else
%define docroot /srv/www/htdocs/
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

%package       l10n-cs-cz
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (cs_CZ)
Requires:      open-xchange-l10n-cs-cz
Provides:      open-xchange-appsuite-l10n

%description   l10n-cs-cz
Translation of the OX App Suite HTML5 client (cs_CZ)

%package       l10n-da-dk
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (da_DK)
Requires:      open-xchange-l10n-da-dk
Provides:      open-xchange-appsuite-l10n

%description   l10n-da-dk
Translation of the OX App Suite HTML5 client (da_DK)

%package       l10n-de-de
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (de_DE)
Requires:      open-xchange-l10n-de-de
Provides:      open-xchange-appsuite-l10n

%description   l10n-de-de
Translation of the OX App Suite HTML5 client (de_DE)

%package       l10n-en-gb
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (en_GB)
Requires:      open-xchange-l10n-en-gb
Provides:      open-xchange-appsuite-l10n

%description   l10n-en-gb
Translation of the OX App Suite HTML5 client (en_GB)

%package       l10n-en-us
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (en_US)
Requires:      open-xchange-l10n-en-us
Provides:      open-xchange-appsuite-l10n

%description   l10n-en-us
Translation of the OX App Suite HTML5 client (en_US)

%package       l10n-es-es
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (es_ES)
Requires:      open-xchange-l10n-es-es
Provides:      open-xchange-appsuite-l10n

%description   l10n-es-es
Translation of the OX App Suite HTML5 client (es_ES)

%package       l10n-es-mx
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (es_MX)
Requires:      open-xchange-l10n-es-mx
Provides:      open-xchange-appsuite-l10n

%description   l10n-es-mx
Translation of the OX App Suite HTML5 client (es_MX)

%package       l10n-fi-fi
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (fi_FI)
Requires:      open-xchange-l10n-fi-fi
Provides:      open-xchange-appsuite-l10n

%description   l10n-fi-fi
Translation of the OX App Suite HTML5 client (fi_FI)

%package       l10n-fr-ca
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (fr_CA)
Requires:      open-xchange-l10n-fr-ca
Provides:      open-xchange-appsuite-l10n

%description   l10n-fr-ca
Translation of the OX App Suite HTML5 client (fr_CA)

%package       l10n-fr-fr
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (fr_FR)
Requires:      open-xchange-l10n-fr-fr
Provides:      open-xchange-appsuite-l10n

%description   l10n-fr-fr
Translation of the OX App Suite HTML5 client (fr_FR)

%package       l10n-hu-hu
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (hu_HU)
Requires:      open-xchange-l10n-hu-hu
Provides:      open-xchange-appsuite-l10n

%description   l10n-hu-hu
Translation of the OX App Suite HTML5 client (hu_HU)

%package       l10n-it-it
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (it_IT)
Requires:      open-xchange-l10n-it-it
Provides:      open-xchange-appsuite-l10n

%description   l10n-it-it
Translation of the OX App Suite HTML5 client (it_IT)

%package       l10n-ja-jp
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (ja_JP)
Requires:      open-xchange-l10n-ja-jp
Provides:      open-xchange-appsuite-l10n

%description   l10n-ja-jp
Translation of the OX App Suite HTML5 client (ja_JP)

%package       l10n-lv-lv
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (lv_LV)
Requires:      open-xchange-l10n-lv-lv
Provides:      open-xchange-appsuite-l10n

%description   l10n-lv-lv
Translation of the OX App Suite HTML5 client (lv_LV)

%package       l10n-nl-nl
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (nl_NL)
Requires:      open-xchange-l10n-nl-nl
Provides:      open-xchange-appsuite-l10n

%description   l10n-nl-nl
Translation of the OX App Suite HTML5 client (nl_NL)

%package       l10n-pl-pl
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (pl_PL)
Requires:      open-xchange-l10n-pl-pl
Provides:      open-xchange-appsuite-l10n

%description   l10n-pl-pl
Translation of the OX App Suite HTML5 client (pl_PL)

%package       l10n-pt-br
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (pt_BR)
Requires:      open-xchange-l10n-pt-br
Provides:      open-xchange-appsuite-l10n

%description   l10n-pt-br
Translation of the OX App Suite HTML5 client (pt_BR)

%package       l10n-ro-ro
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (ro_RO)
Requires:      open-xchange-l10n-ro-ro
Provides:      open-xchange-appsuite-l10n

%description   l10n-ro-ro
Translation of the OX App Suite HTML5 client (ro_RO)

%package       l10n-ru-ru
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (ru_RU)
Requires:      open-xchange-l10n-ru-ru
Provides:      open-xchange-appsuite-l10n

%description   l10n-ru-ru
Translation of the OX App Suite HTML5 client (ru_RU)

%package       l10n-sk-sk
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (sk_SK)
Requires:      open-xchange-l10n-sk-sk
Provides:      open-xchange-appsuite-l10n

%description   l10n-sk-sk
Translation of the OX App Suite HTML5 client (sk_SK)

%package       l10n-sv-se
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (sv_SE)
Requires:      open-xchange-l10n-sv-se
Provides:      open-xchange-appsuite-l10n

%description   l10n-sv-se
Translation of the OX App Suite HTML5 client (sv_SE)

%package       l10n-zh-cn
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (zh_CN)
Requires:      open-xchange-l10n-zh-cn
Provides:      open-xchange-appsuite-l10n

%description   l10n-zh-cn
Translation of the OX App Suite HTML5 client (zh_CN)

%package       l10n-zh-tw
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (zh_TW)
Requires:      open-xchange-l10n-zh-tw
Provides:      open-xchange-appsuite-l10n

%description   l10n-zh-tw
Translation of the OX App Suite HTML5 client (zh_TW)

%prep

%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -Dlanguages=false -f build/build.xml build
APPSUITE=/opt/open-xchange/appsuite/
find "%{buildroot}$APPSUITE" -type d | sed -e 's,%{buildroot},%dir ,' > open-xchange-appsuite-manifest.files
find "%{buildroot}$APPSUITE" \( -type f -o -type l \) | sed -e 's,%{buildroot},,' >> open-xchange-appsuite-manifest.files
for LANG in cs_CZ da_DK de_DE en_GB en_US es_ES es_MX fi_FI fr_CA fr_FR hu_HU it_IT ja_JP lv_LV nl_NL pl_PL pt_BR ro_RO ru_RU sk_SK sv_SE zh_CN zh_TW; do
    ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -DinstallTarget=${LANG} -Dnoclean=true -f build/build.xml build
done

%clean
%{__rm} -rf %{buildroot}

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
%doc ui/readme.txt
%dir %{docroot}/appsuite
%{docroot}/appsuite
%config(noreplace) %{docroot}/appsuite/apps/themes/.htaccess
%dir /opt/open-xchange
%dir /opt/open-xchange/sbin
/opt/open-xchange/sbin/touch-appsuite

%files manifest -f open-xchange-appsuite-manifest.files
%defattr(-,root,root)
%dir /opt/open-xchange

%files l10n-cs-cz
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.cs_CZ.js
/opt/open-xchange/appsuite/apps/*/*/*.cs_CZ.js
/opt/open-xchange/appsuite/apps/*/*/*/*.cs_CZ.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-cs-cz.properties

%files l10n-da-dk
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.da_DK.js
/opt/open-xchange/appsuite/apps/*/*/*.da_DK.js
/opt/open-xchange/appsuite/apps/*/*/*/*.da_DK.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-da-dk.properties

%files l10n-de-de
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.de_DE.js
/opt/open-xchange/appsuite/apps/*/*/*.de_DE.js
/opt/open-xchange/appsuite/apps/*/*/*/*.de_DE.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-de-de.properties

%files l10n-en-gb
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.en_GB.js
/opt/open-xchange/appsuite/apps/*/*/*.en_GB.js
/opt/open-xchange/appsuite/apps/*/*/*/*.en_GB.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-en-gb.properties

%files l10n-en-us
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.en_US.js
/opt/open-xchange/appsuite/apps/*/*/*.en_US.js
/opt/open-xchange/appsuite/apps/*/*/*/*.en_US.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-en-us.properties

%files l10n-es-es
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.es_ES.js
/opt/open-xchange/appsuite/apps/*/*/*.es_ES.js
/opt/open-xchange/appsuite/apps/*/*/*/*.es_ES.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-es-es.properties

%files l10n-es-mx
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.es_MX.js
/opt/open-xchange/appsuite/apps/*/*/*.es_MX.js
/opt/open-xchange/appsuite/apps/*/*/*/*.es_MX.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-es-mx.properties

%files l10n-fi-fi
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.fi_FI.js
/opt/open-xchange/appsuite/apps/*/*/*.fi_FI.js
/opt/open-xchange/appsuite/apps/*/*/*/*.fi_FI.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fi-fi.properties

%files l10n-fr-ca
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.fr_CA.js
/opt/open-xchange/appsuite/apps/*/*/*.fr_CA.js
/opt/open-xchange/appsuite/apps/*/*/*/*.fr_CA.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fr-ca.properties

%files l10n-fr-fr
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.fr_FR.js
/opt/open-xchange/appsuite/apps/*/*/*.fr_FR.js
/opt/open-xchange/appsuite/apps/*/*/*/*.fr_FR.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fr-fr.properties

%files l10n-hu-hu
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.hu_HU.js
/opt/open-xchange/appsuite/apps/*/*/*.hu_HU.js
/opt/open-xchange/appsuite/apps/*/*/*/*.hu_HU.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-hu-hu.properties

%files l10n-it-it
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.it_IT.js
/opt/open-xchange/appsuite/apps/*/*/*.it_IT.js
/opt/open-xchange/appsuite/apps/*/*/*/*.it_IT.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-it-it.properties

%files l10n-ja-jp
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.ja_JP.js
/opt/open-xchange/appsuite/apps/*/*/*.ja_JP.js
/opt/open-xchange/appsuite/apps/*/*/*/*.ja_JP.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ja-jp.properties

%files l10n-lv-lv
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.lv_LV.js
/opt/open-xchange/appsuite/apps/*/*/*.lv_LV.js
/opt/open-xchange/appsuite/apps/*/*/*/*.lv_LV.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-lv-lv.properties

%files l10n-nl-nl
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.nl_NL.js
/opt/open-xchange/appsuite/apps/*/*/*.nl_NL.js
/opt/open-xchange/appsuite/apps/*/*/*/*.nl_NL.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-nl-nl.properties

%files l10n-pl-pl
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.pl_PL.js
/opt/open-xchange/appsuite/apps/*/*/*.pl_PL.js
/opt/open-xchange/appsuite/apps/*/*/*/*.pl_PL.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-pl-pl.properties

%files l10n-pt-br
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.pt_BR.js
/opt/open-xchange/appsuite/apps/*/*/*.pt_BR.js
/opt/open-xchange/appsuite/apps/*/*/*/*.pt_BR.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-pt-br.properties

%files l10n-ro-ro
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.ro_RO.js
/opt/open-xchange/appsuite/apps/*/*/*.ro_RO.js
/opt/open-xchange/appsuite/apps/*/*/*/*.ro_RO.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ro-ro.properties

%files l10n-ru-ru
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.ru_RU.js
/opt/open-xchange/appsuite/apps/*/*/*.ru_RU.js
/opt/open-xchange/appsuite/apps/*/*/*/*.ru_RU.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ru-ru.properties

%files l10n-sk-sk
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.sk_SK.js
/opt/open-xchange/appsuite/apps/*/*/*.sk_SK.js
/opt/open-xchange/appsuite/apps/*/*/*/*.sk_SK.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-sk-sk.properties

%files l10n-sv-se
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.sv_SE.js
/opt/open-xchange/appsuite/apps/*/*/*.sv_SE.js
/opt/open-xchange/appsuite/apps/*/*/*/*.sv_SE.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-sv-se.properties

%files l10n-zh-cn
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.zh_CN.js
/opt/open-xchange/appsuite/apps/*/*/*.zh_CN.js
/opt/open-xchange/appsuite/apps/*/*/*/*.zh_CN.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-zh-cn.properties

%files l10n-zh-tw
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.zh_TW.js
/opt/open-xchange/appsuite/apps/*/*/*.zh_TW.js
/opt/open-xchange/appsuite/apps/*/*/*/*.zh_TW.js*
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-zh-tw.properties

%changelog
