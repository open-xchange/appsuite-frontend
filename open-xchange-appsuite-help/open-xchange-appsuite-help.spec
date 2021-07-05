Name:           open-xchange-appsuite-help
BuildArch:      noarch
Version:        @OXVERSION@
%define         ox_release @OXREVISION@
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Julian Baeume <julian.baeume@open-xchange.com>
License:        AGPL-3.0-only
Summary:        OX App Suite online help
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%define docroot /var/www/html/

%description
OX App Suite help files

%package        common
Group:          Applications/Productivity
Summary:        Language-independent files of online help for OX App Suite
Obsoletes:      open-xchange-guard-help-common
Provides:       open-xchange-guard-help-common

%description    common
Language-independent files of online help for OX App Suite

%package       de-de
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (de_DE)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-de-de
Provides:      open-xchange-guard-help-de-de

%description   de-de
Online help for OX App Suite (de_DE)

%package       en-gb
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (en_GB)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-en-gb
Provides:      open-xchange-guard-help-en-gb

%description   en-gb
Online help for OX App Suite (en_GB)

%package       en-us
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (en_US)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-en-us
Provides:      open-xchange-guard-help-en-us

%description   en-us
Online help for OX App Suite (en_US)

%package       es-es
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (es_ES)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-es-es
Provides:      open-xchange-guard-help-es-es

%description   es-es
Online help for OX App Suite (es_ES)

%package       es-mx
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (es_MX)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-es-mx
Provides:      open-xchange-guard-help-es-mx

%description   es-mx
Online help for OX App Suite (es_MX)

%package       fr-fr
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (fr_FR)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-fr-fr
Provides:      open-xchange-guard-help-fr-fr

%description   fr-fr
Online help for OX App Suite (fr_FR)

%package       it-it
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (it_IT)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-it-it
Provides:      open-xchange-guard-help-it-it

%description   it-it
Online help for OX App Suite (it_IT)

%package       ja-jp
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (ja_JP)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-ja-jp
Provides:      open-xchange-guard-help-ja-jp

%description   ja-jp
Online help for OX App Suite (ja_JP)

%package       nl-nl
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (nl_NL)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-nl-nl
Provides:      open-xchange-guard-help-nl-nl

%description   nl-nl
Online help for OX App Suite (nl_NL)

%package       pl-pl
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (pl_PL)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-pl-pl
Provides:      open-xchange-guard-help-pl-pl

%description   pl-pl
Online help for OX App Suite (pl_PL)

%package       tr-tr
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (tr_TR)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-tr-tr
Provides:      open-xchange-guard-help-tr-tr

%description   tr-tr
Online help for OX App Suite (tr_TR)

%package       zh-cn
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (zh_CN)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-zh-cn
Provides:      open-xchange-guard-help-zh-cn

%description   zh-cn
Online help for OX App Suite (zh_CN)

%package       zh-tw
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (zh_TW)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common
Obsoletes:     open-xchange-guard-help-zh-tw
Provides:      open-xchange-guard-help-zh-tw

%description   zh-tw
Online help for OX App Suite (zh_TW)

%prep

%setup -q

%build

%install
mkdir -p "%{buildroot}%{docroot}"
cp -rv --preserve=mode htdoc/* "%{buildroot}%{docroot}"

%clean
%{__rm} -rf %{buildroot}

%files common
%defattr(-,root,root)
%dir %{docroot}/appsuite
%{docroot}/appsuite/help
%exclude %{docroot}/appsuite/help/l10n

%files de-de
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/de_DE

%files en-gb
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/en_GB

%files en-us
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/en_US

%files es-es
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/es_ES

%files es-mx
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/es_MX

%files fr-fr
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/fr_FR

%files it-it
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/it_IT

%files ja-jp
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/ja_JP

%files nl-nl
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/nl_NL

%files pl-pl
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/pl_PL

%files tr-tr
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/tr_TR

%files zh-cn
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/zh_CN

%files zh-tw
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/zh_TW

@OXCHANGELOG@
