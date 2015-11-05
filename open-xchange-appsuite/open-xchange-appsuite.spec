Name:           open-xchange-appsuite
BuildArch:      noarch
BuildRequires:  ant
BuildRequires:  ant-nodeps
BuildRequires:  java-devel >= 1.6.0
BuildRequires:  nodejs >= 0.10.0
Version:        @OXVERSION@
%define         ox_release 27
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

%package       l10n-ca-es
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (ca_ES)
Requires:      open-xchange-l10n-ca-es
Provides:      open-xchange-appsuite-l10n

%description   l10n-ca-es
Translation of the OX App Suite HTML5 client (ca_ES)

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

%package       l10n-nb-no
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (nb_NO)
Requires:      open-xchange-l10n-nb-no
Provides:      open-xchange-appsuite-l10n

%description   l10n-nb-no
Translation of the OX App Suite HTML5 client (nb_NO)
This localization package are driven by the community.

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
ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -Dlanguages=false -DkeepCache=true -f build/build.xml build
APPSUITE=/opt/open-xchange/appsuite/
find "%{buildroot}$APPSUITE" -type d | sed -e 's,%{buildroot},%dir ,' > open-xchange-appsuite-manifest.files
find "%{buildroot}$APPSUITE" \( -type f -o -type l \) | sed -e 's,%{buildroot},,' >> open-xchange-appsuite-manifest.files
for LANG in ca_ES cs_CZ da_DK de_DE en_GB en_US es_ES es_MX fi_FI fr_CA fr_FR hu_HU it_IT ja_JP lv_LV nb_NO nl_NL pl_PL pt_BR ro_RO ru_RU sk_SK sv_SE zh_CN zh_TW; do
    ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -DinstallTarget=${LANG} -DkeepCache=true -Dnoclean=true -f build/build.xml build
done
mv "%{buildroot}/opt/open-xchange/sbin/touch-appsuite" "%{buildroot}/opt/open-xchange/sbin/touch-appsuite.tmp"
cat "%{buildroot}/opt/open-xchange/sbin/touch-appsuite.tmp" | sed -e "s:## cd ##:cd %{docroot}appsuite:" > \
    "%{buildroot}/opt/open-xchange/sbin/touch-appsuite"
chmod +x "%{buildroot}/opt/open-xchange/sbin/touch-appsuite"
rm "%{buildroot}/opt/open-xchange/sbin/touch-appsuite.tmp"

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

%files l10n-ca-es
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.ca_ES.js
/opt/open-xchange/appsuite/apps/*/*/*.ca_ES.js
/opt/open-xchange/appsuite/apps/*/*/*/*.ca_ES.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ca-es.properties


%files l10n-cs-cz
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.cs_CZ.js
/opt/open-xchange/appsuite/apps/*/*/*.cs_CZ.js
/opt/open-xchange/appsuite/apps/*/*/*/*.cs_CZ.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-cs-cz.properties

%files l10n-da-dk
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.da_DK.js
/opt/open-xchange/appsuite/apps/*/*/*.da_DK.js
/opt/open-xchange/appsuite/apps/*/*/*/*.da_DK.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-da-dk.properties

%files l10n-de-de
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.de_DE.js
/opt/open-xchange/appsuite/apps/*/*/*.de_DE.js
/opt/open-xchange/appsuite/apps/*/*/*/*.de_DE.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-de-de.properties

%files l10n-en-gb
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.en_GB.js
/opt/open-xchange/appsuite/apps/*/*/*.en_GB.js
/opt/open-xchange/appsuite/apps/*/*/*/*.en_GB.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-en-gb.properties

%files l10n-en-us
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.en_US.js
/opt/open-xchange/appsuite/apps/*/*/*.en_US.js
/opt/open-xchange/appsuite/apps/*/*/*/*.en_US.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-en-us.properties

%files l10n-es-es
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.es_ES.js
/opt/open-xchange/appsuite/apps/*/*/*.es_ES.js
/opt/open-xchange/appsuite/apps/*/*/*/*.es_ES.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-es-es.properties

%files l10n-es-mx
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.es_MX.js
/opt/open-xchange/appsuite/apps/*/*/*.es_MX.js
/opt/open-xchange/appsuite/apps/*/*/*/*.es_MX.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-es-mx.properties

%files l10n-fi-fi
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.fi_FI.js
/opt/open-xchange/appsuite/apps/*/*/*.fi_FI.js
/opt/open-xchange/appsuite/apps/*/*/*/*.fi_FI.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fi-fi.properties

%files l10n-fr-ca
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.fr_CA.js
/opt/open-xchange/appsuite/apps/*/*/*.fr_CA.js
/opt/open-xchange/appsuite/apps/*/*/*/*.fr_CA.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fr-ca.properties

%files l10n-fr-fr
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.fr_FR.js
/opt/open-xchange/appsuite/apps/*/*/*.fr_FR.js
/opt/open-xchange/appsuite/apps/*/*/*/*.fr_FR.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fr-fr.properties

%files l10n-hu-hu
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.hu_HU.js
/opt/open-xchange/appsuite/apps/*/*/*.hu_HU.js
/opt/open-xchange/appsuite/apps/*/*/*/*.hu_HU.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-hu-hu.properties

%files l10n-it-it
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.it_IT.js
/opt/open-xchange/appsuite/apps/*/*/*.it_IT.js
/opt/open-xchange/appsuite/apps/*/*/*/*.it_IT.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-it-it.properties

%files l10n-ja-jp
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.ja_JP.js
/opt/open-xchange/appsuite/apps/*/*/*.ja_JP.js
/opt/open-xchange/appsuite/apps/*/*/*/*.ja_JP.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ja-jp.properties

%files l10n-lv-lv
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.lv_LV.js
/opt/open-xchange/appsuite/apps/*/*/*.lv_LV.js
/opt/open-xchange/appsuite/apps/*/*/*/*.lv_LV.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-lv-lv.properties

%files l10n-nb-no
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.nb_NO.js
/opt/open-xchange/appsuite/apps/*/*/*.nb_NO.js
/opt/open-xchange/appsuite/apps/*/*/*/*.nb_NO.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-nb-no.properties

%files l10n-nl-nl
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.nl_NL.js
/opt/open-xchange/appsuite/apps/*/*/*.nl_NL.js
/opt/open-xchange/appsuite/apps/*/*/*/*.nl_NL.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-nl-nl.properties

%files l10n-pl-pl
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.pl_PL.js
/opt/open-xchange/appsuite/apps/*/*/*.pl_PL.js
/opt/open-xchange/appsuite/apps/*/*/*/*.pl_PL.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-pl-pl.properties

%files l10n-pt-br
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.pt_BR.js
/opt/open-xchange/appsuite/apps/*/*/*.pt_BR.js
/opt/open-xchange/appsuite/apps/*/*/*/*.pt_BR.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-pt-br.properties

%files l10n-ro-ro
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.ro_RO.js
/opt/open-xchange/appsuite/apps/*/*/*.ro_RO.js
/opt/open-xchange/appsuite/apps/*/*/*/*.ro_RO.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ro-ro.properties

%files l10n-ru-ru
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.ru_RU.js
/opt/open-xchange/appsuite/apps/*/*/*.ru_RU.js
/opt/open-xchange/appsuite/apps/*/*/*/*.ru_RU.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ru-ru.properties

%files l10n-sk-sk
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.sk_SK.js
/opt/open-xchange/appsuite/apps/*/*/*.sk_SK.js
/opt/open-xchange/appsuite/apps/*/*/*/*.sk_SK.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-sk-sk.properties

%files l10n-sv-se
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.sv_SE.js
/opt/open-xchange/appsuite/apps/*/*/*.sv_SE.js
/opt/open-xchange/appsuite/apps/*/*/*/*.sv_SE.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-sv-se.properties

%files l10n-zh-cn
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.zh_CN.js
/opt/open-xchange/appsuite/apps/*/*/*.zh_CN.js
/opt/open-xchange/appsuite/apps/*/*/*/*.zh_CN.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-zh-cn.properties

%files l10n-zh-tw
%defattr(-,root,root)
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite
/opt/open-xchange/appsuite/apps/*/*.zh_TW.js
/opt/open-xchange/appsuite/apps/*/*/*.zh_TW.js
/opt/open-xchange/appsuite/apps/*/*/*/*.zh_TW.js
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-zh-tw.properties

%changelog
* Thu Oct 29 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-11-11 (2844)
* Wed Sep 30 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch  2015-10-12 (2784)
* Thu Sep 24 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-09-28 (2767)
* Tue Sep 08 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-09-14 (2732)
* Tue Aug 18 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-08-24 (2674)
* Wed Aug 05 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-08-10
* Tue Aug 04 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-08-03 (2650)
* Fri Jul 17 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-07-20 (2614)
* Tue Jun 30 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-06-29 (2569)
* Wed Jun 10 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-06-08 (2540)
* Tue May 19 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-05-26 (2521)
* Tue May 05 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-05-04 (2496)
* Fri Apr 24 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-09-09 (2495)
* Thu Apr 23 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-04-17 (2491)
* Tue Apr 14 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-04-13 (2474)
* Fri Mar 13 2015 Markus Wagner <markus.wagner@open-xchange.com>
Twelfth candidate for 7.6.2 release
* Fri Mar 13 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-03-16
* Fri Mar 06 2015 Markus Wagner <markus.wagner@open-xchange.com>
Eleventh candidate for 7.6.2 release
* Wed Mar 04 2015 Markus Wagner <markus.wagner@open-xchange.com>
Tenth candidate for 7.6.2 release
* Tue Mar 03 2015 Markus Wagner <markus.wagner@open-xchange.com>
Nineth candidate for 7.6.2 release
* Tue Feb 24 2015 Markus Wagner <markus.wagner@open-xchange.com>
Eighth candidate for 7.6.2 release
* Thu Feb 12 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-02-23
* Wed Feb 11 2015 Markus Wagner <markus.wagner@open-xchange.com>
Seventh candidate for 7.6.2 release
* Tue Feb 10 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-02-11
* Tue Feb 03 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-02-09
* Fri Jan 30 2015 Markus Wagner <markus.wagner@open-xchange.com>
Sixth candidate for 7.6.2 release
* Tue Jan 27 2015 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.6.2 release
* Wed Jan 21 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-10-27
* Wed Jan 21 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-01-26
* Wed Jan 07 2015 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2015-01-12
* Tue Dec 16 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-12-22
* Fri Dec 12 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.6.2 release
* Wed Dec 10 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-12-15
* Mon Dec 08 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-12-15
* Fri Dec 05 2014 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.6.2 release
* Tue Nov 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-12-01
* Fri Nov 21 2014 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.6.2 release
* Thu Nov 13 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-11-17
* Fri Oct 31 2014 Markus Wagner <markus.wagner@open-xchange.com>
First candidate for 7.6.2 release
* Tue Oct 28 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-11-03
* Mon Oct 27 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-10-30
* Wed Oct 22 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-10-22
* Tue Oct 14 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.6.1 release
* Mon Oct 13 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-10-20
* Fri Oct 10 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.6.1 release
* Thu Oct 02 2014 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.6.1 release
* Tue Sep 30 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-10-06
* Thu Sep 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-10-06
* Tue Sep 23 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-10-02
* Wed Sep 17 2014 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.6.2 release
* Tue Sep 16 2014 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.6.1 release
* Thu Sep 11 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-09-15
* Fri Sep 05 2014 Markus Wagner <markus.wagner@open-xchange.com>
First release candidate for 7.6.1
* Fri Sep 05 2014 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.6.1
* Wed Aug 20 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-08-25
* Mon Aug 18 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-08-25
* Mon Aug 11 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-08-11
* Thu Aug 07 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-08-11
* Wed Jul 23 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-07-30
* Mon Jul 21 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-07-28
* Mon Jul 21 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-07-21
* Wed Jul 09 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-07-14
* Thu Jun 26 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-06-30
* Wed Jun 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Seventh candidate for 7.6.0 release
* Fri Jun 20 2014 Markus Wagner <markus.wagner@open-xchange.com>
Sixth candidate for 7.6.0 release
* Fri Jun 13 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.6.0 release
* Tue Jun 10 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-06-16
* Fri May 30 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.6.0 release
* Thu May 22 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-05-26
* Fri May 16 2014 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.6.0 release
* Mon May 05 2014 Markus Wagner <markus.wagner@open-xchange.com>
Second release candidate for 7.6.0
* Mon May 05 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-05-05
* Tue Apr 22 2014 Markus Wagner <markus.wagner@open-xchange.com>
First release candidate for 7.6.0
* Tue Apr 15 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-04-22
* Wed Apr 09 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-04-08
* Thu Apr 03 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-04-07
* Mon Mar 31 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-31
* Fri Mar 21 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-24
* Fri Mar 21 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-24
* Wed Mar 19 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-24
* Fri Mar 14 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-14
* Tue Mar 04 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-03-04
* Tue Mar 04 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-03-05
* Thu Feb 27 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-03-05
* Thu Feb 27 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-03-05
* Tue Feb 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-24
* Tue Feb 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-26
* Tue Feb 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-26
* Thu Feb 20 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-20
* Wed Feb 12 2014 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.6.0
* Tue Feb 11 2014 Markus Wagner <markus.wagner@open-xchange.com>
Sixth candidate for 7.4.2 release
* Fri Feb 07 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-07
* Thu Feb 06 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.4.2 release
* Tue Feb 04 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.4.2 release
* Tue Jan 28 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-01-30
* Fri Jan 24 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-01-22
* Thu Jan 23 2014 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.4.2 release
* Fri Jan 10 2014 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.4.2 release
* Thu Jan 02 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-12-09
* Mon Dec 23 2013 Markus Wagner <markus.wagner@open-xchange.com>
First candidate for 7.4.2 release
* Thu Dec 19 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-12-23
* Thu Dec 19 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.4.2
* Tue Dec 10 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-11-29
* Thu Dec 05 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-12-09
* Wed Nov 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.4.1 release
* Mon Nov 18 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.4.1 release
* Tue Nov 12 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-11-13
* Mon Nov 11 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-11-08
* Thu Nov 07 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.4.1 release
* Wed Oct 30 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-10-28
* Wed Oct 23 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-10-28
* Wed Oct 23 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.4.1 release
* Thu Oct 10 2013 Markus Wagner <markus.wagner@open-xchange.com>
First sprint increment for 7.4.1 release
* Wed Oct 09 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-10-09
* Wed Oct 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-10-03
* Wed Sep 25 2013 Markus Wagner <markus.wagner@open-xchange.com>
Eleventh candidate for 7.4.0 release
* Fri Sep 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.4.1 release
* Fri Sep 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
Tenth candidate for 7.4.0 release
* Tue Sep 17 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-09-26
* Fri Sep 13 2013 Markus Wagner <markus.wagner@open-xchange.com>
Ninth candidate for 7.4.0 release
* Wed Sep 11 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2013-09-12
* Wed Sep 11 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-09-12
* Mon Sep 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-09-26
* Mon Sep 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Eighth candidate for 7.4.0 release
* Tue Aug 27 2013 Markus Wagner <markus.wagner@open-xchange.com>
Seventh candidate for 7.4.0 release
* Mon Aug 26 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-08-26
* Fri Aug 23 2013 Markus Wagner <markus.wagner@open-xchange.com>
Sixth candidate for 7.4.0 release
* Tue Aug 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-08-19
* Mon Aug 19 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.4.0 release
* Tue Aug 13 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.4.0 release
* Tue Aug 06 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third release candidate for 7.4.0
* Mon Aug 05 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-08-09
* Fri Aug 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second release candidate for 7.4.0
* Mon Jul 22 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-07-22
* Wed Jul 17 2013 Markus Wagner <markus.wagner@open-xchange.com>
First release candidate for 7.4.0
* Tue Jul 16 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.4.0
* Mon Jul 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-07-25
* Thu Jul 11 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-07-09
* Tue Jul 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.2.2 release
* Fri Jun 28 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.2.2 release
* Wed Jun 26 2013 Markus Wagner <markus.wagner@open-xchange.com>
Release candidate for 7.2.2 release
* Fri Jun 21 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second feature freeze for 7.2.2 release
* Thu Jun 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-06-20
* Tue Jun 18 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-06-17
* Wed Jun 12 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-06-14
* Mon Jun 03 2013 Markus Wagner <markus.wagner@open-xchange.com>
Sprint increment for 7.2.2 release
* Mon Jun 03 2013 Markus Wagner <markus.wagner@open-xchange.com>
First sprint increment for 7.2.2 release
* Wed May 29 2013 Markus Wagner <markus.wagner@open-xchange.com>
First candidate for 7.2.2 release
* Wed May 22 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.2.1 release
* Wed May 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.2.1 release
* Wed May 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-05-10
* Thu May 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-04-23
* Mon Apr 22 2013 Markus Wagner <markus.wagner@open-xchange.com>
First candidate for 7.2.1 release
* Mon Apr 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.2.1
* Wed Apr 10 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.2.0 release
* Mon Apr 08 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.2.0 release
* Tue Apr 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.2.0 release
* Tue Mar 26 2013 Markus Wagner <markus.wagner@open-xchange.com>
First release candidate for 7.2.0
* Fri Mar 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.2.0
* Fri Mar 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.2.0
* Thu Feb 28 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2013-03-01
* Tue Feb 19 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth release candidate for 7.0.1
* Tue Feb 19 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Third release candidate for 7.0.1
* Thu Feb 14 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candiate for 7.0.1
* Fri Feb 01 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.0.1
* Fri Feb 01 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.0.1
* Tue Dec 18 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Third release candidate for 7.0.0
* Mon Dec 17 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for 7.0.0
* Thu Dec 13 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Pre release candidate for 7.0.0
* Tue Dec 11 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.0.0
* Tue Nov 13 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for EDP drop #6
* Mon Oct 22 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Third release candidate for EDP drop #5
* Mon Oct 22 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for EDP drop #5
* Fri Oct 12 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for EDP drop #5
* Tue Sep 04 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for EDP drop #4
* Tue Aug 07 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Release build for 7.0.0
* Tue Aug 07 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Release build for EDP drop #3
* Wed Nov 09 2011 Viktor Pracht <viktor.pracht@open-xchange.com>
Initial Release.
