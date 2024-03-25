Name:           open-xchange-appsuite-manifest
BuildArch:      noarch
Version:        @OXVERSION@
%define         ox_release @OXREVISION@
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Julian Baeume <julian.baeume@open-xchange.com>
License:        AGPLv3+
Summary:        Manifest and apps included in the OX App Suite HTML5 client
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
Autoreqprov:    no
Requires:       bash
Requires:       coreutils
Requires:       open-xchange-core
Requires(post): open-xchange-halo
Requires:       open-xchange-appsuite-l10n-en-us
Provides:       open-xchange-appsuite-saml = %{version}
Obsoletes:      open-xchange-appsuite-saml < %{version}

# Turn off automatic python bytecompilation after install step to keep files
# section intact
%undefine py_auto_byte_compile

%description

This package contains the manifest for installation on the backend.

%prep

%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
APPSUITE=/opt/open-xchange/appsuite/

mkdir -p "%{buildroot}/"
cp -rv --preserve=mode ./* "%{buildroot}/"

find "%{buildroot}$APPSUITE" -type d | sed -e 's,%{buildroot},%dir ,' > open-xchange-appsuite-manifest.files
find "%{buildroot}$APPSUITE" \( -type f -o -type l \) | sed -e 's,%{buildroot},,' >> open-xchange-appsuite-manifest.files

%clean
%{__rm} -rf %{buildroot}

%define update "/opt/open-xchange/appsuite/share/update-themes.sh"

%post
if [ $1 -eq 1 -a -x %{update} ]; then %{update} --later; fi

%postun
if [ $1 -lt 1 ]; then
    rm -rf /opt/open-xchange/appsuite/apps/themes/*/less || true
else
    if [ -x %{update} ]; then %{update} --later; fi
fi

%triggerpostun -- open-xchange-appsuite-manifest < 7.2.0
if [ -x %{update} ]; then %{update}; fi

%files -f open-xchange-appsuite-manifest.files
%defattr(-,root,root)
%dir /opt/open-xchange

@OXCHANGELOG@
