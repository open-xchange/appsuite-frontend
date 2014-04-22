Name:           open-xchange-guidedtours
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
Summary:        The default version of the guided tours for the typical applications
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%description
The default version of the guided tours for the typical applications.

%prep

%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -f build/build.xml build

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
/opt/open-xchange/etc/settings/guidedtours.properties

%changelog
