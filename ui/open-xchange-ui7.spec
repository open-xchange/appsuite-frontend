Name:           open-xchange-ui7
Version:        7.0.0
%define         ox_release 8
Release:        %{ox_release}
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA
Summary:        OX App Suite HTML5 client
Source:         %{name}_%{version}.orig.tar.bz2
Requires:       open-xchange-ui7-l10n

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  nodejs >= 0.4.0

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
Summary:        Manifest for apps included in the OX App Suite HTML5 client
Requires:       open-xchange-core

%description    manifest
OX App Suite HTML5 client

This package contains the manifest for installation on the backend.

%package        dev
Group:          Development/Libraries
Summary:        SDK for the OX App Suite HTML5 client
Requires:       nodejs >= 0.4.0

%description    dev
SDK for the OX App Suite HTML5 client

## l10n ##
#%package l10n-## lang ##
#Group: Applications/Productivity
#Summary: ## Lang ## translation of the OX App Suite HTML5 client
#Provides: open-xchange-ui7-l10n
#
#%description l10n-## lang ##
### Lang ## translation of the OX App Suite HTML5 client
## end l10n ##

%prep
%setup -q

%build

%install
sh build.sh builddir="%{buildroot}%{docroot}" l10nDir=tmp/l10n \
    manifestDir="%{buildroot}/opt/open-xchange/ui7" \
    version=%{version} revision=%{release}

find "%{buildroot}%{docroot}" -type d \
    | sed -e 's,%{buildroot},%dir ,' > tmp/files
find "%{buildroot}%{docroot}" \( -type f -o -type l \) \
    | sed -e 's,%{buildroot},,' >> tmp/files
## l10n ##
#find tmp/l10n \( -type f -o -type l \) -name '*.## Lang ##.js' \
#    | sed -e 's,tmp/l10n,%{docroot},' > tmp/files-## lang ##
## end l10n ##
cp -r tmp/l10n/apps "%{buildroot}%{docroot}/"

mkdir -p "%{buildroot}/opt/open-xchange-ui7-dev"
cp -r bin lib Jakefile.js "%{buildroot}/opt/open-xchange-ui7-dev/"
sed -i -e 's#OX_UI7_DEV=.*#OX_UI7_DEV="/opt/open-xchange-ui7-dev"#' \
    "%{buildroot}/opt/open-xchange-ui7-dev/bin/build-ui7"

%clean
sh build.sh clean builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}
rm -r "%{buildroot}/opt/open-xchange/ui7"
rm -r "%{buildroot}/opt/open-xchange-ui7-dev"

%files -f tmp/files
%defattr(-,root,root)
%doc readme.txt

%files manifest
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/ui7

%files dev
%defattr(-,root,root)
%dir /opt/open-xchange-ui7-dev
/opt/open-xchange-ui7-dev
%attr(644,root,root) /opt/open-xchange-ui7-dev/lib/sax-js/examples/switch-bench.js

## l10n ##
#%files l10n-## lang ## -f tmp/files-## lang ##
#%defattr(-,root,root)
## end l10n ##

%changelog
* Thu Nov 10 2011 viktor.pracht@open-xchange.com
  - Initial release
