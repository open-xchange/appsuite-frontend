Name:           open-xchange-appsuite-help
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
Summary:        OX App Suite online help
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/
%else
%define docroot /srv/www/htdocs/
%endif

%description
OX App Suite help files

%package        common
Group:          Applications/Productivity
Summary:        Language-independent files of online help for OX App Suite

%description    common
Language-independent files of online help for OX App Suite

%package       de-de
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (de_DE)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   de-de
Online help for OX App Suite (de_DE)

%package       en-gb
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (en_GB)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   en-gb
Online help for OX App Suite (en_GB)

%package       en-us
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (en_US)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   en-us
Online help for OX App Suite (en_US)

%package       es-es
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (es_ES)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   es-es
Online help for OX App Suite (es_ES)

%package       es-mx
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (es_MX)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   es-mx
Online help for OX App Suite (es_MX)

%package       fr-fr
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (fr_FR)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   fr-fr
Online help for OX App Suite (fr_FR)

%package       it-it
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (it_IT)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   it-it
Online help for OX App Suite (it_IT)

%package       ja-jp
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (ja_JP)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   ja-jp
Online help for OX App Suite (ja_JP)

%package       nl-nl
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (nl_NL)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   nl-nl
Online help for OX App Suite (nl_NL)

%package       pl-pl
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (pl_PL)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   pl-pl
Online help for OX App Suite (pl_PL)

%package       zh-cn
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (zh_CN)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   zh-cn
Online help for OX App Suite (zh_CN)

%package       zh-tw
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (zh_TW)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   zh-tw
Online help for OX App Suite (zh_TW)

%prep

%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -Dlanguages=false -f build/build.xml build
for LANG in de_DE en_GB en_US es_ES es_MX fr_FR it_IT ja_JP nl_NL pl_PL zh_CN zh_TW; do
    ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -DinstallTarget=${LANG} -f build/build.xml clean build
done

%clean
%{__rm} -rf %{buildroot}

%files common
%defattr(-,root,root)
%dir %{docroot}/appsuite
%{docroot}/appsuite/help
%exclude %{docroot}/appsuite/help/l10n

%files de-de
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/de_DE

%files en-gb
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/en_GB

%files en-us
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/en_US

%files es-es
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/es_ES

%files es-mx
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/es_MX

%files fr-fr
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/fr_FR

%files it-it
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/it_IT

%files ja-jp
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/ja_JP

%files nl-nl
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/nl_NL

%files pl-pl
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/pl_PL

%files zh-cn
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/zh_CN

%files zh-tw
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/zh_TW

%changelog
