Name:           @appName@
Version:        @version@
Release:        1
Group:          Applications/Productivity
Packager:       @maintainer@
License:        @licenseName@
Summary:        @description@
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  nodejs >= 0.4.0

Requires:       open-xchange-ui7

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/appsuite
%else
%define docroot /srv/www/htdocs/appsuite
%endif

%description
@description@

%package        manifest
Group:          Applications/Productivity
Summary:        @description@
Requires:       open-xchange-core

%description    manifest
@description@

This package contains the manifest for installation on the backend.

%prep
%setup -q

%build

%install
sh build.sh builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}
mkdir -p "%{buildroot}/opt/open-xchange/ui7"
cp -r "%{buildroot}%{docroot}/manifests" "%{buildroot}/opt/open-xchange/ui7/manifests"

%clean
sh build.sh clean builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}
rm -r "%{buildroot}/opt/open-xchange/ui7"

%files
%defattr(-,root,root)
%{docroot}

%files manifest
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/ui7
