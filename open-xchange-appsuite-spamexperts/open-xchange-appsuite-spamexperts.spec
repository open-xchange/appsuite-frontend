Name:           open-xchange-appsuite-spamexperts
Version:        @OXVERSION@
%define         ox_release 69
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA-3.0
Summary:        Configuration UI for SpamExperts
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
%if 0%{?rhel_version} && 0%{?rhel_version} >= 700
BuildRequires:  ant
%else
BuildRequires:  ant-nodeps
%endif
BuildRequires:  java-devel >= 1.6.0
%if 0%{?suse_version}
BuildRequires:  nodejs6
BuildRequires:  npm6
%else
BuildRequires:  nodejs >= 0.10.0
%endif

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

%define update "/opt/open-xchange/appsuite/share/update-themes.sh"

%post
if [ $1 -eq 1 -a -x %{update} ]; then %{update} --later; fi

%postun
if [ -x %{update} ]; then %{update} --later; fi

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
* Wed Feb 02 2022 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2022-02-07 (6086)
* Thu Dec 02 2021 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2021-12-13 (6057)
* Wed Aug 25 2021 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2021-08-30 (6018)
* Tue Apr 20 2021 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2021-04-26 (5985)
* Wed Jun 24 2020 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2020-06-30 (5779)
* Fri Jun 05 2020 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2020-06-15 (5763)
* Mon May 04 2020 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2020-05-11 (5717)
* Wed Feb 26 2020 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2020-03-02 (5624)
* Mon Feb 03 2020 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2020-02-10 (5578)
* Mon Nov 18 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-11-25 (5482)
* Thu Oct 24 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-10-28 (5460)
* Tue Oct 08 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-10-14 (5437)
* Mon Sep 23 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-09-30 (5418)
* Mon Sep 02 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-09-09 (5395)
* Mon Aug 12 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-08-22 (5369)
* Tue Jul 23 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-07-29 (5339)
* Tue Jun 04 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-06-11 (5275)
* Mon May 06 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-05-13 (5233)
* Fri Apr 26 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-04-29 (5209)
* Mon Mar 25 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-04-01 (5178)
* Fri Feb 22 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-02-25 (5131)
* Mon Feb 04 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-02-11 (5106)
* Tue Jan 22 2019 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2019-01-28 (5074)
* Mon Dec 10 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-12-17 (5017)
* Thu Nov 15 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-11-19 (4965)
* Tue Oct 30 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-11-05 (4932)
* Thu Oct 11 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-10-15 (4917)
* Tue Sep 25 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-10-01 (4896)
* Mon Aug 27 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-09-03 (4869)
* Mon Aug 13 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-08-20 (4862)
* Mon Jul 30 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-08-06 (4850)
* Tue Jul 17 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-07-23 (4834)
* Fri Jul 06 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-07-09 (4819)
* Fri Jun 29 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-06-28 (4822)
* Tue Jun 26 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-07-03 (4817)
* Wed Jun 20 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-06-25 (4791)
* Mon Jun 11 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-06-20 (4783)
* Wed Jun 06 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-06-11 (4771)
* Tue May 22 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-05-28 (4758)
* Mon May 07 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-05-07 (4685)
* Mon Apr 23 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-04-26 (4682)
* Mon Apr 16 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-04-23 (4670)
* Thu Apr 12 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-04-23 (4673)
* Wed Apr 11 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-04-11 (4646)
* Tue Apr 03 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-04-09 (4642)
* Tue Mar 20 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-03-26 (4619)
* Mon Mar 05 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-03-12 (4602)
* Wed Feb 28 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-03-09 (4597)
* Mon Feb 19 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-02-26 (4583)
* Tue Jan 30 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-02-05 (4555)
* Mon Jan 15 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-01-22 (4538)
* Thu Jan 04 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-01-08 (hotfix-4516)
* Fri Dec 08 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-12-11 (hotfix-4473)
* Mon Nov 20 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-11-20 (4441)
* Wed Oct 25 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-10-30 (4415)
* Fri Oct 13 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-10-16 (4394)
* Thu Sep 28 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-10-02 (4377)
* Thu Sep 21 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-09-22 (4373)
* Tue Sep 12 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-09-18 (4354)
* Wed Aug 30 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-09-04 (4328)
* Tue Aug 15 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-08-21 (4318)
* Tue Aug 01 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-08-07 (4304)
* Mon Jul 17 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-07-24 (4285)
* Fri Jul 07 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-07-10 (4257)
* Wed Jun 21 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-06-26 (4233)
* Tue Jun 06 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-06-08 (4180)
* Fri May 19 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.4 release
* Thu May 04 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Second preview of 7.8.4 release
* Mon Apr 03 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
First preview of 7.8.4 release
* Fri Dec 02 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.4 release
* Tue Nov 29 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for 7.8.3 release
* Thu Nov 24 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.8.3 release
* Tue Nov 15 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Third preview for 7.8.3 release
* Sat Oct 29 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second preview for 7.8.3 release
* Fri Oct 14 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First preview of 7.8.3 release
* Tue Sep 06 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.3 release
* Tue Jul 12 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.8.2 release
* Wed Jul 06 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.2 release
* Wed Jun 29 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second preview for 7.8.2 release
* Tue Jun 14 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.8.2
* Fri Apr 08 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.2 release
* Wed Mar 30 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.8.1 release
* Fri Mar 25 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.1 release
* Tue Mar 15 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Fifth preview of 7.8.1 release
* Fri Mar 04 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth preview of 7.8.1 release
* Sat Feb 20 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Third candidate for 7.8.1 release
* Tue Feb 02 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.8.1 release
* Tue Jan 26 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.1 release
* Wed Nov 11 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-16 (2862)
* Fri Nov 06 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-09 (2840)
* Tue Nov 03 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-09 (2841)
* Thu Oct 29 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-11 (2844)
* Tue Oct 20 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-10-26 (2816)
* Mon Oct 19 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-10-26 (2812)
* Thu Oct 08 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.1 release
* Tue Oct 06 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Sixth candidate for 7.8.0 release
* Wed Sep 30 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-10-12 (2784)
* Fri Sep 25 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Fith candidate for 7.8.0 release
* Thu Sep 24 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-09-28 (2767)
* Fri Sep 18 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth candidate for 7.8.0 release
* Tue Sep 08 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-09-14 (2732)
* Mon Sep 07 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Third candidate for 7.8.0 release
* Fri Aug 21 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.8.0 release
* Tue Aug 18 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-08-24 (2674)
* Thu Aug 06 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-08-17 (2666)
* Wed Aug 05 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.0 release
* Wed Aug 05 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-08-10
* Tue Aug 04 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-08-03 (2650)
* Fri Jul 17 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-07-20 (2637)
* Fri Jul 17 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-07-20 (2614)
* Tue Jun 30 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-06-29 (2569)
* Wed Jun 24 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-06-26 (2573)
* Wed Jun 10 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-06-08 (2540)
* Tue Jun 09 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-06-08 (2539)
* Tue May 19 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-05-26 (2521)
* Fri May 15 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-05-26 (2520)
* Tue May 05 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-05-04 (2496)
* Fri Apr 24 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-09-09 (2495)
* Thu Apr 23 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-04-17 (2491)
* Tue Apr 14 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-04-13 (2473)
* Tue Apr 14 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-04-13 (2474)
* Fri Mar 27 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-03-29 (2475)
* Wed Mar 25 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-03-30 (2459)
* Mon Mar 23 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-03-30 (2446)
* Fri Mar 13 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Twelfth candidate for 7.6.2 release
* Fri Mar 13 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-03-16
* Fri Mar 06 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Eleventh candidate for 7.6.2 release
* Wed Mar 04 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Tenth candidate for 7.6.2 release
* Tue Mar 03 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Nineth candidate for 7.6.2 release
* Tue Feb 24 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Eighth candidate for 7.6.2 release
* Thu Feb 12 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-02-23
* Wed Feb 11 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Seventh candidate for 7.6.2 release
* Tue Feb 10 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-02-11
* Tue Feb 03 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-02-09
* Fri Jan 30 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Sixth candidate for 7.6.2 release
* Tue Jan 27 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Fifth candidate for 7.6.2 release
* Wed Jan 21 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2014-10-27
* Wed Jan 21 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-01-26
* Wed Jan 07 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-01-12
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
* Wed Nov 05 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.0 release
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
