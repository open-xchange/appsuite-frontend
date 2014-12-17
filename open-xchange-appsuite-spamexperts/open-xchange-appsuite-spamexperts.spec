Name:           open-xchange-appsuite-spamexperts
Version:        @OXVERSION@
%define         ox_release 4
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA-3.0
Summary:        Configuration UI for SpamExperts
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  ant-nodeps
BuildRequires:  java-devel >= 1.6.0
BuildRequires:  nodejs >= 0.10.0

Requires(post): open-xchange-appsuite-manifest

%description
Configuration UI for SpamExperts

## Uncomment for multiple packages (1/4)
#%if 0%{?rhel_version} || 0%{?fedora_version}
#%define docroot /var/www/html/appsuite
#%else
#%define docroot /srv/www/htdocs/appsuite
#%endif
#
#%package        static
#Group:          Applications/Productivity
#Summary:        Configuration UI for SpamExperts
#Requires:       open-xchange-appsuite
#
#%description    static
#Configuration UI for SpamExperts
#
#This package contains the static files for the theme.

%prep
%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -DkeepCache=true -f build/build.xml build

## Uncomment for multiple packages (2/4)
#files=$(find "%{buildroot}/opt/open-xchange/appsuite/" -type f \
#             ! -regex '.*\.\(js\|css\|less\|json\)' -printf '%%P ')
#for i in $files
#do
#    mkdir -p "%{buildroot}%{docroot}/$(dirname $i)"
#    cp "%{buildroot}/opt/open-xchange/appsuite/$i" "%{buildroot}%{docroot}/$i"
#done

%clean
%{__rm} -rf %{buildroot}

## Uncomment for multiple packages (3/4)
#rm -r "%{buildroot}%{docroot}"

%define update /opt/open-xchange/appsuite/share/update-themes.sh

%post
if [ $1 -eq 1 -a -x %{update} ]; then %{update}; fi

%postun
if [ -x %{update} ]; then %{update}; fi

%files
%defattr(-,root,root)
%dir /opt/open-xchange
%dir /opt/open-xchange/appsuite
%dir /opt/open-xchange/appsuite/apps
%dir /opt/open-xchange/appsuite/apps/com.spamexperts
%dir /opt/open-xchange/appsuite/apps/com.spamexperts/settings
/opt/open-xchange/appsuite/apps/com.spamexperts/*
/opt/open-xchange/appsuite/apps/com.spamexperts/settings/*
%dir /opt/open-xchange/appsuite/manifests
/opt/open-xchange/appsuite/manifests/open-xchange-appsuite-spamexperts.json

## Uncomment for multiple packages (4/4)
#%files static
#%defattr(-,root,root)
#%{docroot}

%changelog
* Tue Dec 16 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-12-22
* Fri Dec 12 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth candidate for 7.6.2 release
* Wed Dec 10 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-12-15
* Fri Dec 05 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Third candidate for 7.6.2 release
* Tue Nov 25 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-12-01
* Fri Nov 21 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.6.2 release
* Thu Nov 13 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-11-17
* Fri Oct 31 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.6.2 release
* Tue Oct 28 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-11-03
* Mon Oct 27 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-10-30
* Wed Oct 22 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-10-22
* Tue Oct 14 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Fifth candidate for 7.6.1 release
* Mon Oct 13 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-10-20
* Fri Oct 10 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth candidate for 7.6.1 release
* Thu Oct 02 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Third candidate for 7.6.1 release
* Tue Sep 30 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-10-06
* Tue Sep 23 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-10-02
* Wed Sep 17 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.6.2 release
* Tue Sep 16 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.6.1 release
* Thu Sep 11 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-09-15
* Fri Sep 05 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.6.1
* Fri Sep 05 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.6.1
* Wed Aug 20 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-08-25
* Mon Aug 11 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-08-11
* Wed Jul 23 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-07-30
* Mon Jul 21 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-07-21
* Wed Jun 25 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Seventh candidate for 7.6.0 release
* Fri Jun 20 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Sixth candidate for 7.6.0 release
* Fri Jun 13 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Fifth candidate for 7.6.0 release
* Thu Jan 23 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Initial Release.
