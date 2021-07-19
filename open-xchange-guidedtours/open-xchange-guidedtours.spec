Name:           open-xchange-guidedtours
BuildArch:      noarch
Version:        @OXVERSION@
%define         ox_release @OXREVISION@
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Julian Baeume <julian.baeume@open-xchange.com>
License:        AGPLv3+
Summary:        The default version of the guided tours for the typical applications
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%description
The default version of the guided tours for the typical applications.

%prep

%setup -q

%build

%install
cp -rv --preserve=mode * %{buildroot}

%clean
%{__rm} -rf %{buildroot}

%files
%defattr(-,root,root)
%dir /opt/open-xchange
%dir /opt/open-xchange/appsuite
%dir /opt/open-xchange/appsuite/apps
%dir /opt/open-xchange/appsuite/apps/io.ox
/opt/open-xchange/appsuite/apps/io.ox/tours.??_??.js
%dir /opt/open-xchange/appsuite/apps/io.ox/tours
/opt/open-xchange/appsuite/apps/io.ox/tours
%dir /opt/open-xchange/appsuite/manifests
/opt/open-xchange/appsuite/manifests/open-xchange-guidedtours.json
%dir /opt/open-xchange/etc
%dir /opt/open-xchange/etc/settings
%config(noreplace) /opt/open-xchange/etc/settings/guidedtours.properties

@OXCHANGELOG@
