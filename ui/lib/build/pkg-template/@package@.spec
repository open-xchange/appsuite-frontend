Name:           @package@
Version:        @version@
Release:        1
Group:          Applications/Productivity
Packager:       @maintainer@
License:        @licenseName@
Summary:        @description@
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  open-xchange-appsuite-devel

Requires:       open-xchange-appsuite

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

## l10n ##
#%package l10n-## lang ##
#Group: Applications/Productivity
#Summary: ## lang ## translation of @package@\n' +
#Requires: open-xchange-appsuite
#
#%description l10n-## lang ##
### lang ## translation of @package@
## end l10n ##

%prep
%setup -q

%build

%install
sh /opt/open-xchange-appsuite-devel/bin/build-ui7 app \
    builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}
mkdir -p "%{buildroot}/opt/open-xchange/appsuite"
cp -r "%{buildroot}%{docroot}/manifests" "%{buildroot}/opt/open-xchange/appsuite/"

%clean
sh /opt/open-xchange-appsuite-devel/bin/build-ui7 clean \
    builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}
rm -r "%{buildroot}/opt/open-xchange/appsuite"

%files
%defattr(-,root,root)
%{docroot}

%files manifest
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/appsuite

## l10n ##
#%files l10n-## lang ##
#%defattr(-,root,root)
#%{docroot}/apps/**/*.## lang ##.js
## end l10n ##
