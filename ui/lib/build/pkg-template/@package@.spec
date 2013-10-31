Name:           @package@
Version:        @version@
%define         ox_release 1
Release:        %{ox_release}
Group:          Applications/Productivity
Packager:       @maintainer@
License:        @licenseName@
Summary:        @description@
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  open-xchange-appsuite-dev

Requires:       open-xchange-appsuite-manifest >= 7.4.1
Requires(post): open-xchange-appsuite-manifest >= 7.4.1

%description
@description@

## Uncomment for multiple packages (1/4)
#%if 0%{?rhel_version} || 0%{?fedora_version}
#%define docroot /var/www/html/appsuite
#%else
#%define docroot /srv/www/htdocs/appsuite
#%endif
#
#%package        static
#Group:          Applications/Productivity
#Summary:        @description@
#Requires:       open-xchange-appsuite
#
#%description    static
#@description@
#
#This package contains the static files for the theme.

%prep
%setup -q

%build

%install
sh /opt/open-xchange-appsuite-dev/bin/build-appsuite app skipLess=1 \
    builddir="%{buildroot}/opt/open-xchange/appsuite"

## Uncomment for multiple packages (2/4)
#files=$(find "%{buildroot}/opt/open-xchange/appsuite/" -type f \
#             ! -regex '.*\.\(js\|css\|less\|json\)' -printf '%%P ')
#for i in $files
#do
#    mkdir -p "%{buildroot}%{docroot}/$(dirname $i)"
#    cp "%{buildroot}/opt/open-xchange/appsuite/$i" "%{buildroot}%{docroot}/$i" 
#done

%clean
sh /opt/open-xchange-appsuite-dev/bin/build-appsuite clean skipLess=1 \
    builddir="%{buildroot}/opt/open-xchange/appsuite"

## Uncomment for multiple packages (3/4)
#rm -r "%{buildroot}%{docroot}"

%define update_flag "%{_localstatedir}/run/open-xchange-appsuite.update"
%define update /opt/open-xchange/appsuite/share/update-themes.sh

%post
if [ $1 -eq 1 ]; then touch "%{update_flag}"; fi

%postun
if [ $1 -lt 1 ]; then
    rm -f "%{update_flag}"
    if [ -x %{update} ]; then %{update}; fi
else
    touch "%{update_flag}"
fi

%posttrans
if [ -f "%{update_flag}" ]; then
    rm "%{update_flag}"
    if [ -x %{update} ]; then %{update}; fi
fi


%files
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/appsuite

## Uncomment for multiple packages (4/4)
#%files static
#%defattr(-,root,root)
#%{docroot}
