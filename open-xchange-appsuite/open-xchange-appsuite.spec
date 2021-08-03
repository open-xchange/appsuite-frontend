Name:           open-xchange-appsuite
BuildArch:      noarch
Version:        @OXVERSION@
%define         ox_release @OXREVISION@
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Julian Baeume <julian.baeume@open-xchange.com>
License:        AGPLv3+
Summary:        OX App Suite HTML5 client
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
Provides:       open-xchange-documents-ui-viewer = %{version}
Obsoletes:      open-xchange-documents-ui-viewer < %{version}

Requires:       httpd

%define docroot /var/www/html/

%description
OX App Suite HTML5 client

%prep

%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
APPSUITE=/opt/open-xchange/appsuite/

mkdir -p "%{buildroot}%{docroot}"

cp -rv --preserve=mode opt %{buildroot}
cp -rv --preserve=mode htdoc/* %{buildroot}%{docroot}

sed -i -e "s:## cd ##:cd %{docroot}appsuite:" "%{buildroot}/opt/open-xchange/sbin/touch-appsuite"

%clean
%{__rm} -rf %{buildroot}

%files
%defattr(-,root,root)
%dir %{docroot}/appsuite
%{docroot}/appsuite
%config(noreplace) %{docroot}/appsuite/apps/themes/.htaccess
%dir /opt/open-xchange
%dir /opt/open-xchange/sbin
/opt/open-xchange/sbin/touch-appsuite

@OXCHANGELOG@
