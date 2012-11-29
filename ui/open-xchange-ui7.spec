Name:           open-xchange-ui7
Version:        7.0.0
Release:        1
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA
Summary:        OX App Suite HTML5 client
Source:         %{name}_%{version}.orig.tar.bz2

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

%package        devel
Group:          Applications/Productivity
Summary:        SDK for the OX App Suite HTML5 client
Requires:       nodejs >= 0.4.0

%description    devel
SDK for the OX App Suite HTML5 client

%prep
%setup -q

%build

%install
sh build.sh builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}
mkdir -p "%{buildroot}/opt/open-xchange/ui7"
cp -r "%{buildroot}%{docroot}/apps" "%{buildroot}/opt/open-xchange/ui7/apps"
mkdir -p "%{buildroot}/opt/open-xchange-ui7-devel/"
sed -e 's#OX_UI7_DEV=.*#OX_UI7_DEV="/opt/open-xchange-ui7-devel"#' \
    bin/build-ui7 > "%{buildroot}/opt/open-xchange-ui7-devel/bin/build-ui7"
chmod +x "%{buildroot}/opt/open-xchange-ui7-devel/bin/build-ui7"
cp -r bin/build.sh lib Jakefile.js "%{buildroot}/opt/open-xchange-ui7-devel/"

%clean
sh build.sh clean builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}
rm -r "%{buildroot}/opt/open-xchange/ui7"
rm -r "%{buildroot}/opt/open-xchange-ui7-devel"

%files
%defattr(-,root,root)
%{docroot}
%doc readme.txt

%files manifest
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/ui7

%files devel
%defattr(-,root,root)
%dir /opt/open-xchange-ui7-devel
/opt/open-xchange-ui7-devel

%changelog
* Thu Nov 10 2011 viktor.pracht@open-xchange.com
  - Initial release
