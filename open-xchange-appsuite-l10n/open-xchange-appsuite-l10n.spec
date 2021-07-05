Name:           open-xchange-appsuite-l10n
BuildArch:      noarch
Version:        @OXVERSION@
%define         ox_release @OXREVISION@
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Julian Baeume <julian.baeume@open-xchange.com>
License:        AGPL-3.0-only
Summary:        OX App Suite HTML5 client
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%description
Translation of the OX App Suite HTML5 client

%package       bg-bg
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (bg_BG)
Requires:      open-xchange-l10n-bg-bg
Provides:      open-xchange-appsuite-l10n

%description   bg-bg
Translation of the OX App Suite HTML5 client (bg_BG)

%package       ca-es
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (ca_ES)
Requires:      open-xchange-l10n-ca-es
Provides:      open-xchange-appsuite-l10n

%description   ca-es
Translation of the OX App Suite HTML5 client (ca_ES)

%package       cs-cz
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (cs_CZ)
Requires:      open-xchange-l10n-cs-cz
Provides:      open-xchange-appsuite-l10n

%description   cs-cz
Translation of the OX App Suite HTML5 client (cs_CZ)

%package       da-dk
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (da_DK)
Requires:      open-xchange-l10n-da-dk
Provides:      open-xchange-appsuite-l10n

%description   da-dk
Translation of the OX App Suite HTML5 client (da_DK)

%package       de-de
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (de_DE)
Requires:      open-xchange-l10n-de-de
Provides:      open-xchange-appsuite-l10n

%description   de-de
Translation of the OX App Suite HTML5 client (de_DE)

%package       en-gb
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (en_GB)
Requires:      open-xchange-l10n-en-gb
Provides:      open-xchange-appsuite-l10n

%description   en-gb
Translation of the OX App Suite HTML5 client (en_GB)

%package       en-us
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (en_US)
Requires:      open-xchange-l10n-en-us
Provides:      open-xchange-appsuite-l10n

%description   en-us
Translation of the OX App Suite HTML5 client (en_US)

%package       es-es
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (es_ES)
Requires:      open-xchange-l10n-es-es
Provides:      open-xchange-appsuite-l10n

%description   es-es
Translation of the OX App Suite HTML5 client (es_ES)

%package       es-mx
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (es_MX)
Requires:      open-xchange-l10n-es-mx
Provides:      open-xchange-appsuite-l10n

%description   es-mx
Translation of the OX App Suite HTML5 client (es_MX)

%package       et-ee
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (et_EE)
Requires:      open-xchange-l10n-et-ee
Provides:      open-xchange-appsuite-l10n

%description   et-ee
Translation of the OX App Suite HTML5 client (et_EE)

%package       fi-fi
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (fi_FI)
Requires:      open-xchange-l10n-fi-fi
Provides:      open-xchange-appsuite-l10n

%description   fi-fi
Translation of the OX App Suite HTML5 client (fi_FI)

%package       fr-ca
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (fr_CA)
Requires:      open-xchange-l10n-fr-ca
Provides:      open-xchange-appsuite-l10n

%description   fr-ca
Translation of the OX App Suite HTML5 client (fr_CA)

%package       fr-fr
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (fr_FR)
Requires:      open-xchange-l10n-fr-fr
Provides:      open-xchange-appsuite-l10n

%description   fr-fr
Translation of the OX App Suite HTML5 client (fr_FR)

%package       hu-hu
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (hu_HU)
Requires:      open-xchange-l10n-hu-hu
Provides:      open-xchange-appsuite-l10n

%description   hu-hu
Translation of the OX App Suite HTML5 client (hu_HU)

%package       it-it
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (it_IT)
Requires:      open-xchange-l10n-it-it
Provides:      open-xchange-appsuite-l10n

%description   it-it
Translation of the OX App Suite HTML5 client (it_IT)

%package       ja-jp
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (ja_JP)
Requires:      open-xchange-l10n-ja-jp
Provides:      open-xchange-appsuite-l10n

%description   ja-jp
Translation of the OX App Suite HTML5 client (ja_JP)

%package       lv-lv
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (lv_LV)
Requires:      open-xchange-l10n-lv-lv
Provides:      open-xchange-appsuite-l10n

%description   lv-lv
Translation of the OX App Suite HTML5 client (lv_LV)

%package       mn-mn
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (mn_MN)
Requires:      open-xchange-l10n-mn-mn
Provides:      open-xchange-appsuite-l10n

%description   mn-mn
Translation of the OX App Suite HTML5 client (mn_MN)

%package       nb-no
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (nb_NO)
Requires:      open-xchange-l10n-nb-no
Provides:      open-xchange-appsuite-l10n

%description   nb-no
Translation of the OX App Suite HTML5 client (nb_NO)
This localization package are driven by the community.

%package       nl-nl
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (nl_NL)
Requires:      open-xchange-l10n-nl-nl
Provides:      open-xchange-appsuite-l10n

%description   nl-nl
Translation of the OX App Suite HTML5 client (nl_NL)

%package       pl-pl
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (pl_PL)
Requires:      open-xchange-l10n-pl-pl
Provides:      open-xchange-appsuite-l10n

%description   pl-pl
Translation of the OX App Suite HTML5 client (pl_PL)

%package       pt-br
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (pt_BR)
Requires:      open-xchange-l10n-pt-br
Provides:      open-xchange-appsuite-l10n

%description   pt-br
Translation of the OX App Suite HTML5 client (pt_BR)

%package       ro-ro
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (ro_RO)
Requires:      open-xchange-l10n-ro-ro
Provides:      open-xchange-appsuite-l10n

%description   ro-ro
Translation of the OX App Suite HTML5 client (ro_RO)

%package       ru-ru
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (ru_RU)
Requires:      open-xchange-l10n-ru-ru
Provides:      open-xchange-appsuite-l10n

%description   ru-ru
Translation of the OX App Suite HTML5 client (ru_RU)

%package       sk-sk
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (sk_SK)
Requires:      open-xchange-l10n-sk-sk
Provides:      open-xchange-appsuite-l10n

%description   sk-sk
Translation of the OX App Suite HTML5 client (sk_SK)

%package       sv-se
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (sv_SE)
Requires:      open-xchange-l10n-sv-se
Provides:      open-xchange-appsuite-l10n

%description   sv-se
Translation of the OX App Suite HTML5 client (sv_SE)

%package       tr-tr
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (tr_TR)
Requires:      open-xchange-l10n-tr-tr
Provides:      open-xchange-appsuite-l10n

%description   tr-tr
Translation of the OX App Suite HTML5 client (tr_TR)

%package       zh-cn
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (zh_CN)
Requires:      open-xchange-l10n-zh-cn
Provides:      open-xchange-appsuite-l10n

%description   zh-cn
Translation of the OX App Suite HTML5 client (zh_CN)

%package       zh-tw
Group:         Applications/Productivity
Summary:       Translation of the OX App Suite HTML5 client (zh_TW)
Requires:      open-xchange-l10n-zh-tw
Provides:      open-xchange-appsuite-l10n

%description   zh-tw
Translation of the OX App Suite HTML5 client (zh_TW)

%prep

%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
cp -rv --preserve=mode ./* "%{buildroot}/"

%clean
%{__rm} -rf %{buildroot}

%files
%dir /opt/open-xchange
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/languages
%dir /opt/open-xchange/etc/languages/appsuite

%files bg-bg
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-bg-bg.properties

%files ca-es
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ca-es.properties


%files cs-cz
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-cs-cz.properties

%files da-dk
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-da-dk.properties

%files de-de
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-de-de.properties

%files en-gb
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-en-gb.properties

%files en-us
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-en-us.properties

%files es-es
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-es-es.properties

%files es-mx
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-es-mx.properties

%files et-ee
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-et-ee.properties

%files fi-fi
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fi-fi.properties

%files fr-ca
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fr-ca.properties

%files fr-fr
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-fr-fr.properties

%files hu-hu
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-hu-hu.properties

%files it-it
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-it-it.properties

%files ja-jp
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ja-jp.properties

%files lv-lv
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-lv-lv.properties

%files mn-mn
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-mn-mn.properties

%files nb-no
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-nb-no.properties

%files nl-nl
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-nl-nl.properties

%files pl-pl
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-pl-pl.properties

%files pt-br
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-pt-br.properties

%files ro-ro
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ro-ro.properties

%files ru-ru
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-ru-ru.properties

%files sk-sk
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-sk-sk.properties

%files sv-se
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-sv-se.properties

%files tr-tr
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-tr-tr.properties

%files zh-cn
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-zh-cn.properties

%files zh-tw
%defattr(-,root,root)
/opt/open-xchange/etc/languages/appsuite/open-xchange-appsuite-l10n-zh-tw.properties

@OXCHANGELOG@
