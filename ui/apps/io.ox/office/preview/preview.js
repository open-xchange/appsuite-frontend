/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

define('io.ox/office/preview/preview',
    ['io.ox/core/event',
     'less!io.ox/office/preview/style.css'], function (Events) {

    'use strict';

    // class Preview ==========================================================

    /**
     * The preview.
     */
    function Preview() {

        var // self reference
            self = this,

            // the root node containing the previewed document
            node = $('<div>').addClass('io-ox-office-preview-page'),

            // all slides to be shown in the preview
            pages = $(),

            // current page index (one-based!)
            curPage = 0;

        // private methods ----------------------------------------------------

        function showPage(page) {
            if ((page !== curPage) && (1 <= page) && (page <= pages.length)) {
                pages.eq(curPage - 1).hide();
                curPage = page;
                pages.eq(curPage - 1).show();
                self.trigger('showpage', curPage);
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the root DOM element representing this previewer.
         */
        this.getNode = function () {
            return node;
        };

        this.setPreviewDocument = function (htmlPreview) {

            htmlPreview =
                '<!DOCTYPE HTML>' +
                '<html>' +
                '<head>' +
                '<meta charset="UTF-8"/>' +
                '</head>' +
                '<body>' +
                '<p id="pres_page_1">' +
                '<?xml version="1.0" encoding="UTF-8"?>' +
                '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
                '<svg width="210mm" height="297mm" viewBox="0 0 21000 29700" stroke-width="28.222" stroke-linejoin="round" xml:space="preserve">' +
                ' <rect fill="none" stroke="none" x="2501" y="1252" width="15997" height="26848"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="259657" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="14566" y="110890" width="4128" height="3651"/>' +
                ' <rect fill="none" stroke="none" x="11074" y="93105" width="7303" height="5080"/>' +
                ' <rect fill="none" stroke="none" x="17106" y="123624" width="1072" height="1072"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="138132" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="133518" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="4089" y="169074" width="12054" height="1757"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="175602" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="190167" width="1072" height="1072"/>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="332" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="4773" y="24180">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5351" y="24180">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5063,24103 L 5325,24103 5325,24129 5063,24129 5063,24103 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5063,24001 L 5325,24001 5325,24027 5063,24027 5063,24001 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4167" y="24180">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4747,24001 L 4483,24001 4483,24027 4747,24027 4747,24001 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4747,24103 L 4483,24103 4483,24129 4747,24129 4747,24103 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="7273" y="24103">O</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6799" y="24384">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 7221,24052 L 7063,24154"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="7800" y="24384">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 7589,24052 L 7748,24154"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11459" y="24231">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11459" y="23669">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 11643,23950 L 11669,23950 11669,23695 11643,23695 11643,23950 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 11538,23950 L 11564,23950 11564,23695 11538,23695 11538,23950 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10722" y="24512">H</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10959" y="24512">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 11432,24180 L 11274,24282"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11986" y="24512">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12275,24205 L 12432,24205 12432,24231 12275,24231 12275,24205 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 11775,24180 L 11933,24282"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13855" y="24282">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="230" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="14117" y="24027">+</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8800,24027 L 9985,24027 9985,24052 8800,24052 8800,24027 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8800,24180 L 9985,24180 9985,24205 8800,24205 8800,24180 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9537,23925 L 9958,24027"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9248,24282 L 8800,24180"/>' +
                '  <path fill="rgb(255,255,255)" stroke="none" d="M 6036,23771 L 6352,23771 6352,24333 6036,24333 6036,23771 Z"/>' +
                '  <path fill="none" stroke="rgb(255,255,255)" d="M 6036,23771 L 6326,23771 6326,24308 6036,24308 6036,23771 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="511" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6063" y="24256">+</text>' +
                '  <path fill="rgb(255,255,255)" stroke="none" d="M 12907,23797 L 13223,23797 13223,24384 12907,24384 12907,23797 Z"/>' +
                '  <path fill="none" stroke="rgb(255,255,255)" d="M 12907,23797 L 13196,23797 13196,24359 12907,24359 12907,23797 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12933" y="24282">+</text>' +
                '  <rect fill="none" stroke="none" x="4089" y="23310" width="10319" height="1455"/>' +
                '  <rect fill="none" stroke="none" x="5994" y="5994" width="8573" height="6401"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Garamond" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="1642">' +
                '   <tspan x="2505 2787 2974 3115 3327 3539 3726 3937 4149 4361 4572 4713 4900 5066 5253 5373 5479 5715 5902 6043 6160 6371 6558 6700 6887 7028 7239 7426 7544">Carboanhydrase: Partnerarbeit</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12977" y="1642">' +
                '   <tspan x="12977 13282 13494 13610 13797 13914 14030 14242 14453 14667 14789 14894 15270 15482 15598 15785 15972 16184 16300 16487 16634 16739 17115 17327 17538 17725 17842 17958 18075 18286">Anleitung: Molecular Modelling</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="564" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="7978" y="3452">' +
                '   <tspan x="7978 8511 8793 8948 9199 9449 9765 9920 10202 10444 10585 11118 11400 11714 11964 12121 12277 12432 12746">Molecular Modelling</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="529" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="2653" y="4491">' +
                '   <tspan x="2653 3173 3320 3556 3849 4143 4436 4703 4835 5128 5422 5717 5849 6260 6498 6937 7375 7670 7964 8230 8363 8656 8892 9118 9250 9631 9894 10130 10423 10688 10954 11248 11539 11808 12100 12337 12601 12806 13042 13175 13439 13730 13908 14041 14478 14744 14893 15129 15422 15715 15863 16127 16353 16588 16814 16946 17299 17591 17828 18121">Wirkung und Hemmung der Carboanhydrase auf molekularer Ebene</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="494" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="2505" y="14360">1</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3267" y="14360">' +
                '   <tspan x="3267 3623 3897 4063 4309 4556 4832 5049 5214 5338 5639 5886 6105 6269 6544 6763 6982 7229 7447 7723 7941 8079">Aufgabe: Partnerarbeit</tspan></text>' +
                ' </g>' +
                ' <g fill="none" stroke="none" font-family="Symbol" font-size="318" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="15453"></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="15453">' +
                '   <tspan x="3006 3288 3405 3521 3733 3920 4135 4241 4477 4594 4782 4888 5052 5239 5356 5567 5733 5849 6036 6248 6460 6576 6791 6897 7155 7462 7649 7765 7952 8093 8305 8446 8658 8869 9081 9268 9479 9589">Bilden Sie selbständig Zweiergruppen. </tspan></text>' +
                ' </g>' +
                ' <g fill="none" stroke="none" font-family="Symbol" font-size="318" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="15940"></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="15940">' +
                '   <tspan x="3006 3242 3359 3570 3782 3899 4086 4227 4414 4629 4735 4971 5087 5276 5382 5569 5781 5968 6109 6274 6393 6499 6710 6827 7015 7121 7379 7495 7707 7823 8010 8128 8245 8456 8668 8885 8991 9203 9414 9626 9732 9943 10060 10249 10354 10660 10871 11012 11199 11411 11575 11741 11928 12044 12231 12443 12654 12866 13053 13265">Studieren Sie zuerst die Einleitung und die Voraussetzungen.</tspan></text>' +
                ' </g>' +
                ' <g fill="none" stroke="none" font-family="Symbol" font-size="318" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="16427"></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="16427">' +
                '   <tspan x="3006 3264 3475 3641 3828 4041 4147 4384 4500 4687 4793 5004 5191 5518 5705 5871 6040 6146 6287 6499 6615 6827 7014 7225 7437 7624 7767 7873 8179 8391 8508 8695 8811 8927 9139 9351 9566 9672 9883 10000 10189 10294 10601 10813 10954 11166 11353 11564 11751 11965 12071 12258 12587 12693 12976 13187 13512 13723 13935 14053 14240 14381 14492 14598 14905 15020 15186 15291 15549 15736 15877 16089 16300 16512 16724 16840 16981 17193 17309 17428 17620">Lösen Sie gemäss folgender Anleitung die Aufgaben am Computer. Als Lernkontrolle </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="16914">' +
                '   <tspan x="3006 3218 3405 3592 3803 3920 4227 4438 4579 4696 4883 5098 5204 5440 5557 5745 5851 6038 6345 6461 6627 6814 7026 7213 7425 7636 7848 7989 8176 8389 8495 8753 8940 9081 9293 9479 9691 9832 10044 10231 10443 10630 10841 10952">beantworten Sie zwischendurch Lernaufgaben. </tspan></text>' +
                ' </g>' +
                ' <g fill="none" stroke="none" font-family="Symbol" font-size="318" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="17401"></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="17401">' +
                '   <tspan x="3006 3288 3475 3641 3853 3994 4181 4368 4579 4766 4980 5086 5322 5438 5627 5733 5920 6250 6356 6592 6779 6991 7107 7319 7485 7650 7756 7873 8084 8190 8497 8613 8800 8941 9128 9270 9481 9622 9834 10046 10257 10444 10660 10765 10977 11093 11282 11388 11646 11833 11974 12185 12372 12584 12725 12937 13124 13335 13522 13734 13845 13951 14256 14443 14584 14701 14912 15029 15219 15325 15583 15770 15981 16122 16309 16450 16567 16683 16900 17006 17313 17429 17570 17782">Besprechen Sie am Schluss in Vierergruppen die Lernaufgaben. Der/die Lehrer/in wird </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="17888">' +
                '   <tspan x="3006 3147 3359 3570 3757 3971 4077 4288 4475 4592 4733 4920 5131 5239 5345 5486 5673 5789 5906 6073 6179 6416 6532 6721 6827 7038 7225 7342 7553 7744 7850 8061 8248 8573 8762 8878 9090 9255 9444 9771 9965 10070 10328 10540 10705 10917 11129 11340 11446 11587 11704 11915 12127 12314 12526">Ihnen helfen, falls Sie keine gemeinsame Lösung finden.</tspan></text>' +
                ' </g>' +
                ' <g fill="none" stroke="none" font-family="Symbol" font-size="318" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="18374"></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="18374">' +
                '   <tspan x="3006 3242 3454 3595 3701 3913 4098 4264 4369 4747 4959 5170 5357 5474 5590 5707 5918 6133 6239 6451 6663 6874 6980 7192 7308 7497 7603 7860 8047 8188 8400 8587 8799 8940 9151 9338 9550 9737 9954 10060 10367 10554 10695 10906 11093 11305 11411 11647 11764 11952 12058 12270 12482 12693 12880 13021 13208 13420 13563 13669 13880 14092 14198 14522 14639 14851 14962 15067 15209 15420 15561 15667 15879 15995 16186 16292 16574 16759 16925 17137 17278 17465 17652 17863 18075 18287">Für das Modelling und die Lernaufgaben werden Sie ungefähr 85 min, für die Besprechung</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18500" y="18374"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="18861">' +
                '   <tspan x="3006 3122 3336 3442 3653 3840 4052 4158 4465 4581 4768 4909 5096 5237 5449 5590 5802 6013 6225 6412 6627 6733 6945 7156 7262 7587 7703 7920 8026 8238 8425 8636 8777 8964 9176 9363 9575 9762 9973">in den Vierergruppen 15 min gebrauchen.</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="494" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="2505" y="20812">2</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3267" y="20812">' +
                '   <tspan x="3267 3595 3733 4008 4145 4364 4502 4666 4941 5216">Einleitung</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="21906">' +
                '   <tspan x="2505 2812 2928 3117 3223 3505 3692 3833 4045 4257 4444 4655 4869 5071 5285 5428 5615 5781 5973 6079 6290 6477 6594 6781 6901 7103 7271 7389 7578 7719 7841 7947 8158 8275 8465 8571 8853 9040 9227 9439 9555 9672 9883 10099 10204 10416 10628 10839 10945 11250 11462 11674 11790 11977 12189 12400 12517 12729 12940 13057 13274 13379 13704 13822 13944 14050 14448 14635 14799 14965 15152 15295 15401 15588 15799">Die Carboanhydrase katalysiert die Reaktion von Kohlendioxid mit Wasser zu </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="22393">' +
                '   <tspan x="2505 2814 3017 3228 3369 3581 3794 3981 4193 4382 4569 4710 4922 5133 5345 5534 5655 5761 5973 6184 6396 6502 6738 6879 7091 7208 7419 7631 7737 7843 8149 8266 8455 8560 8772 8959 9075 9287 9474 9688 9793 10030 10241 10451 10617 10734 10875 11062 11178 11370 11476 11688 11804 12016 12228 12415 12628 12734 12850 13180 13286 13473 13685 13801 13917 14129 14316 14531 14637 14895 15082 15293 15410 15551 15764 16096 16202 16413 16600 16766 16872 17106 17248 17459 17576 17763 17879 18091 18278">Hydrogencarbonat und Proton. Die beiden Substrate binden im aktiven Zentrum des Proteines</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18447" y="22393"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="22879">' +
                '   <tspan x="2505 2692 2905 3011 3198 3315 3528 3634 3891 4008 4220 4431 4548 4759 4974 5080 5292 5504 5715 5821 5962 6149 6336 6548 6664 6851 6992 7179 7395 7500 7687 7901 8007 8218 8405 8617 8723 8959 9100 9312 9524 9735 9947 10063 10250 10462 10570">an ein Zinkion und reagieren zu den Produkten. </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="25800">' +
                '   <tspan x="2505 2812 2997 3304 3420 3586 3752 3939 4045 4281 4493 4609 4750 4962 5174 5361 5687 5803 6017 6209 6315 6527 6714 7040 7366 7555 7772 7878 8089 8206 8395 8500 8783 8970 9111 9322 9534 9721 9933 10146 10349 10562 10705 10892 11058 11245 11356 11462 11698 11815 12004 12109 12321 12437 12649 12861 13048 13261 13367 13485 13815 13921 14108 14320 14436 14552 14764 14951 15166 15272 15530 15717 15928 16045 16186 16399 16729 16835 17022 17235">Gewisse Sulfonamide hemmen die Carboanhydrase. Sie binden im aktiven Zentrum an </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="26287">' +
                '   <tspan x="2505 2717 2904 3045 3211 3398 3514 3726 3913 4128 4234 4470 4586 4773 4890 5006 5197 5303 5609 5726 5915 6020 6232 6417 6583 6689 6901 7088 7204 7416 7557 7673 7790 7977 8190 8382 8488 8723 8934 9146 9312 9428 9569 9756 9876 9982 10194 10405 10617 10723 10935 11122 11263 11474 11591 11802 12014 12201 12342 12556 12661 12827 13039 13145 13356 13542 13707 13813 14120 14332 14448 14635 14847 15034 15175 15388 15494 15706 15918 16129 16235 16517 16704 16891 17103 17219 17406 17547 17734 17951">derselben Stelle wie das natürliche Substrat und verhindern so das Anlagern und Reagieren </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="26774">' +
                '   <tspan x="2505 2717 2904 3069 3175 3410 3622 3833 3999 4115 4257 4444 4560 4747 4913 5020 5126 5363 5479 5668 5773 5985 6102 6313 6525 6712 6925 7031 7172 7359 7571 7758 7899 8065 8181 8393 8580 8700 8806 8924 9254 9359 9546 9758 9875 9991 10203 10390 10605 10711 10968 11155 11367 11483 11624 11838 12169 12275 12487 12699 12910 13016 13228 13439 13651 13863 14050 14261 14367 14531 14743 15069 15186 15307 15413 15625 15812 15932 16038 16225 16341 16553 16740 16882">des Substrates. Sie binden reversibel im aktiven Zentrum und können somit bei einer </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10400" y="28009">1</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="5769" y="37572">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5788" y="36860">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4699" y="37188">S</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5898,36913 L 5886,37286"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5883,36906 L 5913,36906 5901,37293 5871,37293 5883,36906 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5238,36480 L 5746,36665"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5238,36499 L 5231,36480 5246,36469 5758,36649 5746,36676 5238,36499 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5283,36631 L 5702,36785"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5272,36646 L 5283,36616 5713,36770 5705,36796 5272,36646 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4895,36928 L 5226,36487"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4899,36943 L 4876,36925 5216,36476 5231,36480 5238,36499 4899,36943 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5197,37625 L 4910,37207"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5208,37613 L 5204,37632 5185,37636 4895,37210 4917,37192 5208,37613 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5208,37632 L 5724,37474"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,37644 L 5204,37632 5208,37613 5724,37459 5736,37489 5219,37644 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5261,37482 L 5687,37350"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5261,37497 L 5250,37467 5690,37335 5697,37365 5261,37497 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5099" y="38483">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5204,38201 L 5208,38201 5208,37636 5204,37636 5204,38201 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,38201 L 5185,38201 5185,37636 5204,37632 5219,37644 5219,38201 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5091" y="39191">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5204,38916 L 5208,38916 5208,38540 5204,38540 5204,38916 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,38916 L 5185,38916 5185,38532 5219,38532 5219,38916 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5792" y="38483">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5754,38276 L 5344,38276 5344,38280 5754,38280 5754,38276 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5758,38261 L 5758,38292 5339,38292 5339,38261 5758,38261 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5754,38405 L 5344,38405 5344,38408 5754,38408 5754,38405 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5758,38390 L 5758,38419 5339,38419 5339,38390 5758,38390 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4372" y="38483">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4654,38405 L 5069,38405 5069,38408 4654,38408 4654,38405 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4650,38419 L 4650,38390 5072,38390 5072,38419 4650,38419 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4654,38276 L 5069,38276 5069,38280 4654,38280 4654,38276 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4650,38292 L 4650,38261 5072,38261 5072,38292 4650,38292 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5592" y="39696">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5581,39425 L 5355,39199"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5596,39421 L 5574,39440 5336,39207 5359,39183 5596,39421 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4590" y="39696">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4828,39428 L 5050,39202"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4831,39443 L 4809,39421 5042,39183 5065,39207 4831,39443 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5118" y="35915">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5231,35968 L 5234,35968 5234,36480 5231,36480 5231,35968 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5216,35961 L 5246,35961 5246,36469 5231,36480 5216,36476 5216,35961 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5841,35422 L 5378,35686"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5834,35407 L 5849,35418 5864,35426 5381,35704 5366,35678 5834,35407 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4620" y="35414">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4884,35422 L 5106,35648"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4868,35426 L 4888,35403 5121,35640 5099,35662 4868,35426 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9315" y="37399">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,37117 L 9424,37117 9424,36552 9420,36552 9420,37117 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9435,37120 L 9405,37120 9405,36552 9420,36544 9435,36552 9435,37120 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9307" y="38106">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,37828 L 9424,37828 9424,37455 9420,37455 9420,37828 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9435,37831 L 9405,37831 9405,37448 9435,37448 9435,37831 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10008" y="37399">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,37192 L 9560,37192 9560,37195 9974,37195 9974,37192 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,37176 L 9974,37207 9556,37207 9556,37176 9974,37176 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,37320 L 9560,37320 9560,37323 9974,37323 9974,37320 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,37305 L 9974,37335 9556,37335 9556,37305 9974,37305 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8587" y="37399">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8871,37320 L 9288,37320 9288,37323 8871,37323 8871,37320 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8866,37335 L 8866,37305 9288,37305 9288,37335 8866,37335 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8871,37192 L 9288,37192 9288,37195 8871,37195 8871,37192 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8866,37207 L 8866,37176 9288,37176 9288,37207 8866,37207 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9808" y="38611">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9797,38341 L 9571,38114"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9812,38336 L 9789,38359 9556,38122 9578,38099 9812,38336 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8927,38461 L 9266,38118"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8938,38472 L 8920,38468 8912,38449 9258,38099 9281,38122 8938,38472 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13071" y="38483">S</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13060" y="39191">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,38916 L 13176,38916 13176,38540 13173,38540 13173,38916 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13191,38916 L 13158,38916 13158,38532 13191,38532 13191,38916 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13760" y="38483">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13723,38276 L 13316,38276 13316,38280 13723,38280 13723,38276 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13727,38261 L 13727,38292 13309,38292 13309,38261 13727,38261 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13723,38405 L 13316,38405 13316,38408 13723,38408 13723,38405 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13727,38390 L 13727,38419 13309,38419 13309,38390 13727,38390 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12340" y="38483">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12623,38405 L 13053,38405 13053,38408 12623,38408 12623,38405 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12615,38419 L 12615,38390 13056,38390 13056,38419 12615,38419 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12623,38276 L 13053,38276 13053,38280 12623,38280 12623,38276 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12615,38292 L 12615,38261 13056,38261 13056,38292 12615,38292 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13561" y="39696">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13546,39425 L 13328,39199"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13565,39421 L 13542,39440 13309,39207 13331,39183 13565,39421 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12558" y="39696">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12796,39428 L 13019,39202"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12800,39443 L 12777,39421 13014,39183 13037,39207 12800,39443 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9876,36288 L 9424,36540"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9865,36273 L 9880,36280 9899,36292 9435,36552 9420,36544 9420,36525 9865,36273 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9778,36231 L 9424,36427"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9778,36212 L 9793,36239 9428,36446 9413,36420 9778,36212 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9880,35753 L 9884,35753 9884,36280 9880,36280 9880,35753 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9865,35757 L 9880,35750 9899,35738 9899,36292 9880,36280 9865,36273 9865,35757 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9424,35486 L 9876,35742"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,35501 L 9420,35482 9435,35471 9899,35738 9880,35750 9865,35757 9420,35501 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9424,35599 L 9778,35799"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9413,35606 L 9428,35580 9793,35791 9778,35817 9413,35606 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8969,35742 L 9413,35486"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8976,35757 L 8961,35750 8945,35738 9405,35471 9420,35482 9420,35501 8976,35757 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8961,36280 L 8964,36280 8964,35753 8961,35753 8961,36280 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8976,36273 L 8961,36280 8945,36292 8945,35738 8961,35750 8976,35757 8976,36273 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9058,36224 L 9062,36224 9062,35809 9058,35809 9058,36224 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9074,36228 L 9040,36228 9040,35802 9074,35802 9074,36228 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9413,36540 L 8969,36288"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,36525 L 9420,36544 9405,36552 8945,36292 8961,36280 8976,36273 9420,36525 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9307" y="35090">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,35144 L 9424,35144 9424,35478 9420,35478 9420,35144 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9405,35136 L 9435,35136 9435,35471 9420,35482 9405,35471 9405,35136 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9684" y="34718">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9643,34729 L 9545,34827"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9639,34710 L 9658,34732 9548,34845 9526,34823 9639,34710 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8934" y="34718">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9194,34725 L 9293,34827"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9180,34732 L 9198,34710 9311,34820 9288,34842 9180,34732 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12536" y="36465">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12909,35863 L 13436,35863 13436,35866 12909,35866 12909,35863 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12913,35878 L 12906,35863 12913,35848 13448,35848 13441,35863 13429,35878 12913,35878 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12713,36194 L 12898,35866"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12720,36209 L 12695,36194 12887,35863 12906,35863 12913,35878 12720,36209 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12898,36778 L 12740,36491"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12913,36766 L 12906,36781 12887,36785 12720,36495 12747,36480 12913,36766 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13436,36781 L 12909,36781 12909,36785 13436,36785 13436,36781 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13429,36766 L 13441,36781 13426,36800 12916,36800 12906,36781 12913,36766 13429,36766 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13369,36879 L 12980,36879 12980,36883 13369,36883 13369,36879 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13369,36864 L 13369,36894 12973,36894 12973,36864 13369,36864 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13696,36329 L 13444,36778"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13686,36326 L 13701,36326 13711,36341 13456,36785 13441,36781 13429,36766 13686,36326 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13696,36318 L 13444,35866"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13711,36307 L 13701,36326 13686,36326 13429,35878 13441,35863 13448,35848 13711,36307 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12638" y="37433">S</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12785,37151 L 12906,36788"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12800,37161 L 12769,37154 12887,36785 12906,36781 12916,36800 12800,37161 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13166,37598 L 12891,37399"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,37583 L 13173,37602 13158,37610 12875,37406 12894,37380 13173,37583 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13595,37297 L 13176,37598"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13583,37286 L 13598,37289 13618,37297 13188,37610 13173,37602 13173,37583 13583,37286 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13482,37259 L 13176,37478"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13478,37240 L 13497,37267 13181,37497 13161,37470 13478,37240 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13598,37286 L 13441,36788"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13618,37297 L 13598,37289 13583,37286 13426,36800 13441,36781 13456,36785 13618,37297 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,37610 L 13176,37610 13176,38201 13173,38201 13173,37610 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13158,37610 L 13173,37602 13188,37610 13188,38201 13158,38201 13158,37610 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12136" y="36092">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12359,36115 L 12506,36261"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12344,36123 L 12367,36099 12525,36254 12502,36277 12344,36123 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12427,36047 L 12566,36182"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12412,36054 L 12435,36032 12582,36179 12558,36201 12412,36054 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12136" y="36842">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12401,36623 L 12540,36484"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12408,36641 L 12386,36619 12536,36469 12558,36491 12408,36641 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12332,36555 L 12480,36412"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12340,36574 L 12318,36552 12476,36397 12499,36416 12340,36574 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12160" y="35542">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="12386" y="35610">3</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="12525" y="35542">C</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12740,35573 L 12898,35855"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12720,35573 L 12747,35557 12913,35848 12906,35863 12887,35863 12720,35573 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="14123" y="36465">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14096,36326 L 13708,36326 13708,36329 14096,36329 14096,36326 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14100,36307 L 14100,36341 13711,36341 13701,36326 13711,36307 14100,36307 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 14608,35953 L 14360,36201"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14608,35930 L 14612,35945 14620,35964 14368,36216 14345,36194 14608,35930 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="15030" y="36092">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="15256" y="36092">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="15482" y="36156">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14993,35945 L 14620,35945 14620,35949 14993,35949 14993,35945 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14993,35930 L 14993,35964 14620,35964 14612,35945 14608,35930 14993,35930 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="14390" y="36925">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 14412,36634 L 14348,36510"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14435,36631 L 14405,36646 14329,36510 14356,36495 14435,36631 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5736" y="35030">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5962" y="35030">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6188" y="35095">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5849,35087 L 5852,35087 5852,35414 5849,35414 5849,35087 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5834,35079 L 5864,35079 5864,35426 5849,35418 5834,35407 5834,35079 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6188" y="35829">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 6199,35561 L 5852,35365"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 6214,35554 L 6199,35580 5841,35377 5856,35346 6214,35554 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 6153,35644 L 5807,35452"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 6165,35637 L 6150,35662 5792,35459 5807,35429 6165,35637 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="376" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="4194" y="40995">A</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4443" y="40995">c</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4632" y="40995">e</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4843" y="40995">t</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4941" y="40995">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5152" y="40995">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5339" y="40995">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5547" y="40995">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5630" y="40995">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5841" y="40995">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6153" y="40995">i</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6237" y="40995">d</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12314" y="40995">D</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12585" y="40995">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12793" y="40995">r</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12916" y="40995">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13105" y="40995">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13316" y="40995">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13399" y="40995">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13603" y="40995">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13915" y="40995">i</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13998" y="40995">d</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8076" y="40995">S</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8327" y="40995">u</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8535" y="40995">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8618" y="40995">f</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8724" y="40995">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8930" y="40995">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9239" y="40995">e</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9450" y="40995">t</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9552" y="40995">h</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9759" y="40995">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9970" y="40995">x</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10159" y="40995">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10366" y="40995">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10554" y="40995">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10762" y="40995">l</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8275" y="38611">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8098" y="39112">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8920,38472 L 9085,38969"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8908,38483 L 8920,38468 8938,38472 9104,38981 9085,38977 9066,38969 8908,38483 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8527,38468 L 8920,38468 8920,38472 8527,38472 8527,38468 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8520,38483 L 8520,38449 8912,38449 8920,38468 8908,38483 8520,38483 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8527,38562 L 8847,38562 8847,38566 8527,38566 8527,38562 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8520,38577 L 8520,38547 8851,38547 8851,38577 8520,38577 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8263,38837 L 8320,38672"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8279,38845 L 8248,38837 8309,38660 8335,38672 8279,38845 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8648,39278 L 8373,39082"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8652,39266 L 8652,39286 8636,39293 8358,39090 8373,39067 8652,39266 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8660,39278 L 9077,38981"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8667,39293 L 8652,39286 8652,39266 9066,38969 9085,38977 9104,38981 8667,39293 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8660,39161 L 8964,38943"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8663,39180 L 8644,39153 8961,38924 8979,38950 8663,39180 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8538" y="39963">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8765" y="39963">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8991" y="40027">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8652,39681 L 8655,39681 8655,39289 8652,39289 8652,39681 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8667,39681 L 8636,39681 8636,39293 8652,39286 8667,39293 8667,39681 Z"/>' +
                '  <rect fill="none" stroke="none" x="4195" y="34431" width="11430" height="6625"/>' +
                ' </g>' +
                '</svg>' +
                '</p><hr>' +
                '<p id="pres_page_2">' +
                '<?xml version="1.0" encoding="UTF-8"?>' +
                '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
                '<svg width="210mm" height="297mm" viewBox="0 0 21000 29700" stroke-width="28.222" stroke-linejoin="round" xml:space="preserve">' +
                ' <rect fill="none" stroke="none" x="2501" y="1252" width="15997" height="26848"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="229455" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="14566" y="80689" width="4128" height="3651"/>' +
                ' <rect fill="none" stroke="none" x="11074" y="62904" width="7303" height="5080"/>' +
                ' <rect fill="none" stroke="none" x="17106" y="93423" width="1072" height="1072"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="107931" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="103316" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="4089" y="138873" width="12054" height="1757"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="145401" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="159965" width="1072" height="1072"/>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="332" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="4773" y="-6022">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5351" y="-6022">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5063,-6099 L 5325,-6099 5325,-6073 5063,-6073 5063,-6099 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5063,-6201 L 5325,-6201 5325,-6175 5063,-6175 5063,-6201 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4167" y="-6022">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4747,-6201 L 4483,-6201 4483,-6175 4747,-6175 4747,-6201 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4747,-6099 L 4483,-6099 4483,-6073 4747,-6073 4747,-6099 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="7273" y="-6099">O</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6799" y="-5818">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 7221,-6150 L 7063,-6048"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="7800" y="-5818">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 7589,-6150 L 7748,-6048"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11459" y="-5971">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11459" y="-6533">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 11643,-6252 L 11669,-6252 11669,-6507 11643,-6507 11643,-6252 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 11538,-6252 L 11564,-6252 11564,-6507 11538,-6507 11538,-6252 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10722" y="-5690">H</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10959" y="-5690">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 11432,-6022 L 11274,-5920"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11986" y="-5690">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12275,-5997 L 12432,-5997 12432,-5971 12275,-5971 12275,-5997 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 11775,-6022 L 11933,-5920"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13855" y="-5920">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="230" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="14117" y="-6175">+</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8800,-6175 L 9985,-6175 9985,-6150 8800,-6150 8800,-6175 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8800,-6022 L 9985,-6022 9985,-5997 8800,-5997 8800,-6022 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9537,-6277 L 9958,-6175"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9248,-5920 L 8800,-6022"/>' +
                '  <path fill="rgb(255,255,255)" stroke="none" d="M 6036,-6431 L 6352,-6431 6352,-5869 6036,-5869 6036,-6431 Z"/>' +
                '  <path fill="none" stroke="rgb(255,255,255)" d="M 6036,-6431 L 6326,-6431 6326,-5894 6036,-5894 6036,-6431 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="511" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6063" y="-5946">+</text>' +
                '  <path fill="rgb(255,255,255)" stroke="none" d="M 12907,-6405 L 13223,-6405 13223,-5818 12907,-5818 12907,-6405 Z"/>' +
                '  <path fill="none" stroke="rgb(255,255,255)" d="M 12907,-6405 L 13196,-6405 13196,-5843 12907,-5843 12907,-6405 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12933" y="-5920">+</text>' +
                '  <rect fill="none" stroke="none" x="4089" y="-6892" width="10319" height="1455"/>' +
                '  <rect fill="none" stroke="none" x="5994" y="-24208" width="8573" height="6401"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Garamond" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="1642">' +
                '   <tspan x="2505 2787 2974 3115 3327 3539 3726 3937 4149 4361 4572 4713 4900 5066 5253 5373 5479 5715 5902 6043 6160 6371 6558 6700 6887 7028 7239 7426 7544">Carboanhydrase: Partnerarbeit</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12977" y="1642">' +
                '   <tspan x="12977 13282 13494 13610 13797 13914 14030 14242 14453 14667 14789 14894 15270 15482 15598 15785 15972 16184 16300 16487 16634 16739 17115 17327 17538 17725 17842 17958 18075 18286">Anleitung: Molecular Modelling</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="2896">' +
                '   <tspan x="2505 2810 3022 3233 3420 3607 3819 3936 4077 4264 4382 4498 4710 4922 5087 5274 5415 5627 5839 6050 6262 6474 6691 6797 7008 7195 7361 7467 7678 7865 7982 8194 8335 8451 8567 8754 8966 9153 9370 9476 9712 9924 10134 10300 10416 10557 10744 10861 11048 11217 11323 11630 11746 11933 12145 12332 12475 12580 12792 12979 13120 13332 13473 13660 13872 14083 14201 14307 14614 14801 14942 15154 15341 15552 15660 15766 16142 16329 16540 16646 16858 17045 17256 17468 17588 17694 17860 17976 18163">Konzentrationserhöhung des natürlichen Substrates wieder verdrängt werden. Man nennt sie </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="3383">' +
                '   <tspan x="2505 2717 2904 3069 3281 3468 3585 3798 3904 4115 4327 4652 4863 5052 5170 5287 5405 5521 5733 5925 6031 6338 6525 6851 7178 7366 7509 7631 7737 7903 8019 8206 8312 8523 8735 8947 9158 9370 9511 9652 9839 10051 10238 10354 10541 10682 10869 11086 11192 11517 11635 11757 11862 12074 12261 12591 12697 12933 13145 13355 13520 13637 13778 13965 14085 14191 14402 14731 14836 15048 15164 15355 15461 15743 15859 16071 16283 16470 16636 16752 16939 17055 17172 17359">deshalb kompetitive Hemmer; sie konkurrenzieren mit dem Substrat um die Bindestelle.</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="3870">' +
                '   <tspan x="2505 2741 2953 3069 3281 3468 3680 3891 4080 4186 4422 4634 4750 4892 5103 5315 5504 5828 5945 6158 6350 6456 6763 6950 7091 7303 7490 7701 7807 8114 8231 8372 8478 8594 8924 9030 9407 9619 9830 10017 10134 10250 10367 10578 10794 10899 11086 11298 11441 11547 11663 11875 12016 12205 12310 12617 12804 13131 13455 13764 13880 14021 14233 14445 14656 14873 14979 15096 15283 15448 15565 15752 15963">Folgende Sulfonamide werden wir im Modelling auf ihre Hemmwirkung testen:</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="11659">' +
                '   <tspan x="2505 2812 2997 3163 3269 3505 3646 3858 3974 4161 4278 4493 4599 4923 5041 5163 5269 5481 5668 5998 6103 6290 6502 6618 6735 6946 7133 7349 7454 7712 7899 8111 8227 8368 8582 8913 9019 9231 9442 9654 9760 9972 10159 10370 10476 10688 10875 11086 11298 11510 11721 11908 12120 12307 12522 12628 12863 13074 13284 13450 13566 13707 13894 14011 14198 14409 14521 14626 14861 15002 15214 15425 15637 15849 15965 16152 16366 16471 16683 16895 17082 17225">Das Protein mit dem aktiven Zentrum und den gebundenen Substraten, Produkten oder </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="12146">' +
                '   <tspan x="2505 2812 2999 3325 3652 3840 3981 4198 4304 4421 4608 4773 4939 5056 5161 5327 5444 5631 5844 5950 6274 6393 6514 6620 6807 6924 7135 7324 7654 7760 7971 8158 8345 8462 8673 8885 9072 9188 9375 9592 9698 9980 10192 10517 10728 10942 11058 11245 11386 11598 11739 11951 12162 12305 12494 12820 13155 13261 13473 13660 13801 13967 14083 14270 14387 14503 14690 14902">Hemmern lässt sich mit einem geeigneten Computerprogramm darstellen.</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="12633">' +
                '   <tspan x="2505 2812 2928 3115 3281 3468 3574 3831 4018 4205 4417 4629 4745 4962 5068 5280 5467 5678 5890 6008 6114 6438 6625 6842 6948 7137 7513 7724 7841 8028 8215 8426 8543 8730 8876 8982 9358 9569 9781 9968 10084 10201 10317 10529 10741 10931">Diese Technik nennt man „Molecular Modelling“.</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="494" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="2505" y="14097">3</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3267" y="14097">' +
                '   <tspan x="3267 3625 3872 4091 4336 4611 4802 4992 5211 5377 5595 5871 6146 6393 6611">Voraussetzungen</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="15191">' +
                '   <tspan x="2505 2812 2999 3323 3442 3563 3669 3976 4093 4234 4339 4551 4668 4856 4962 5149 5361 5549 5754 6080 6269 6387 6506 6673 6860 7073 7260 7477 7583 7865 7982 8194 8405 8617 8829 9040 9206 9418 9605 9746 9957 10144 10261 10377 10589 10705 10871 11037 11227 11333 11545 11732 11873 12039 12155 12342 12459 12575 12762 12979 13085 13296 13508 13720 13931 14118 14330 14436 14542 14866 15078 15244 15410 15597 15812 15918 16105 16412 16598 16717">Damit wir die enzymatischen Bindungsverhältnisse darstellen können, müssen zwei </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="15677">' +
                '   <tspan x="2505 2810 3022 3163 3350 3562 3727 3893 4080 4197 4384 4595 4807 5019 5206 5421 5527 5714 5855 5996 6207 6324 6440 6560 6666 6832 7019 7135 7347">Voraussetzungen erfüllt sein:</tspan></text>' +
                ' </g>' +
                ' <g fill="none" stroke="none" font-family="Symbol" font-size="318" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="16651"></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="3006" y="16651">' +
                '   <tspan x="3006 3313 3429 3618 3724 3960 4147 4334 4451 4687 4802 5160 5345 5580 5745 5862 6073 6310 6521 6638 6828 6934 7169 7310 7497 7733 7970 8109 8345 8534 8640 8876 9061 9227 9333 9614 9850 10033 10247 10605 10767 10873 11231 11346 11485 11591 11827 12012 12178 12344 12531 12767 12873 13155 13272 13506 13743 13977 14214 14425 14589 14826 15037 15224 15366 15602 15789 15976 16214 16320 16676 16911 17075 17237">Die dreidimensionale Struktur des Enzyms mit dessen Bindungspartnern muss </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="17138">' +
                '   <tspan x="3006 3242 3429 3666 3876 4112 4348 4489 4595 4759 4946 5063 5299">bekannt sein.</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="18048">' +
                '   <tspan x="3006 3242 3454 3570 3757 3969 4158 4264 4571 4782 4899 5086 5227 5393 5604 5791 6003 6215 6426 6638 6825 7038 7144 7451 7638 7779 7991 8178 8389 8495 8707 8894 9106 9222 9412 9518 9730 9942 10083 10270 10483 10589 10776 10988 11127 11434 11621 11833 12044 12161 12372 12563 12669 12926 13113 13300 13512 13723 13840 14051 14238 14455 14561 14868 14985 15172">Solche Untersuchungen werden heute durch aufwändige Techniken wie </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="18535">' +
                '   <tspan x="3006 3288 3500 3712 3828 4040 4227 4438 4604 4721 4862 5073 5285 5401 5613 5754 5941 6153 6342 6461 6664 6832 7026 7132 7343 7555 7767 7873 8178 8555">Röntgenstrukturanalyse und NMR</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="245" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8837" y="18369">1</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8961" y="18535">' +
                '   <tspan x="8961 9067 9279 9490 9631 9818 10030 10242 10429 10570 10781 10993 11134 11254 11360 11572 11783 11995 12101 12217 12429 12535 12700 12912 13124 13311 13522 13709 13921 14133 14249 14436 14651"> durchgeführt und in sogenannten </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="italic" font-weight="400" text-decoration="none">' +
                '  <text x="14757" y="18535">' +
                '   <tspan x="14757 15015 15321 15579 15722 16027 16239 16355 16542 16658 16845">PDB-Dateien</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="17060" y="18535"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="19022">' +
                '   <tspan x="3006 3218 3405 3570 3782 3969 4086 4272 4484 4671 4812 4934 5040 5179 5415 5722 6005 6121 6227 6463 6604 6816 6932 7119 7236 7451 7557 7862 8049 8165 8352 8568 8673 8956 9143 9354 9566 9672 9778 10102 10291 10407 10573 10695 10801 11125 11243 11365 11471 11683 11870 12011 12116 12374 12586 12797 13009 13221 13434 13540 13646 13752 13963 14175 14387 14528 14634">gespeichert (PDB: Protein Daten Bank, meist mit der Endung  .pdb). </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="19509">' +
                '   <tspan x="3006 3313 3429 3641 3828 4040 4156 4272 4459 4671 4858 4999 5306 5493 5610 5775 5968 6073 6239 6356 6543 6754 6941 7155 7261 7472 7589 7776 7941 8130 8236 8543 8730 8846 9033 9150 9337 9552 9658 9763 9880 10093 10199 10411 10552 10693 10880 11092 11208 11325 11441 11628 11845 11951 12138 12349 12561 12748 12960 13171 13288 13404 13591 13803 13990 14207 14313 14619 14806 14923 15110 15321 15533 15720 15932 16143 16330 16546 16651 16863 17075 17262 17405 17510 17722 17909 18075">Glücklicherweise stehen diese Dateien  in öffentlich zugänglichen Datenbanken über das </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="19995">' +
                '   <tspan x="3006 3147 3359 3475 3662 3803 4015 4202 4322 4428 4615 4826 4969 5075 5382 5569 5710 5851 6063 6274 6486 6698 6909 7015 7121 7428 7544 7731 7837 8144 8356 8497 8682 8848 9014 9201 9307 9518 9705 9848 9954 10261 10377 10564 10776 10892 11009 11220 11386 11503 11690 11905 12011 12318 12505 12621 12808 13020 13231 13418 13630 13845 13951 14067 14254 14466 14582 14769 14886 15008">Internet zur Verfügung. Die Adresse der wichtigsten Datenbank lautet: </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="20482">' +
                '   <tspan x="3006 3218 3334 3451 3662 3779 3895 4011 4318 4625 4932 5038 5179 5366 5532 5744 5849 6061 6202 6414">http://www.rcsb.org/</tspan></text>' +
                ' </g>' +
                ' <g fill="none" stroke="none" font-family="Symbol" font-size="318" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="21879"></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="3006" y="21879">' +
                '   <tspan x="3006 3286 3452 3558 3916 4151 4315 4477 4583 4770 4886 5123 5229 5486 5673 5885 6096 6283 6493 6850 7204 7310 7522 7709 7894 8037 8273 8485 8721 8933 9120 9225 9391 9578 9695 9931 10037 10143 10501 10615 10755 10861 11097 11282 11637 11743 12000 12307 12589 12730 13035 13247 13388 13575 13692 13879 14119 14224 14459 14671 14858 15069 15256 15422 15563 15750 15867 15983 16128 16233 16546 16731 16916 17152 17338 17574">Es muss ein Programm verfügbar sein, mit dem PDB-Dateien dargestellt werden </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="22366">' +
                '   <tspan x="3006 3242 3452 3689 3925 4112 4348 4454">können. </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="23276">' +
                '   <tspan x="3006 3311 3523 3710 3923 4029 4193 4405 4521 4708 4920 5110 5216 5451 5592 5804 6015 6156 6345 6671 6998 7192 7298 7463 7580 7767 7978 8165 8379 8485 8672 8883 9213 9319 9626 9742 9954 10141 10353 10458 10670 10882 11048 11164 11351 11563 11679 11891 12058 12164 12351 12563 12704 12810 13117 13304 13445 13586 13797 14009 14221 14432 14644 14750 14856 15163 15350 15561 15748 15962 16068 16279 16466 16796 16902 17184 17325 17535 17840 18006 18193 18334">Auch solche Programme stehen zum Glück kostenlos zur Verfügung. Neben dem Browser-</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="23763">' +
                '   <tspan x="3006 3242 3359 3570 3782 3899 4112">Plugin </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="italic" font-weight="400" text-decoration="none">' +
                '  <text x="4217" y="23763">' +
                '   <tspan x="4217 4499 4711 4898 5203 5369 5556 5767 5979 6168 6274 6556 6768 6884 7191">Chemscape Chime</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="7380" y="23763">' +
                '   <tspan x="7380 7486 7592 7916 8034 8156 8262 8474 8661 8990 9096 9378 9495 9708 10033 10245 10363 10550 10761 10973 11091 11283 11389 11601 11717 11859 12045 12257 12377 12483 12599 12811 12917 13104 13220 13432 13621 13952 14058 14340 14481 14691 14996 15162 15349 15490 15631 15818 16030 16196 16312 16499 16644 16750 16961 17148 17265 17406 17593 17780 17992 18108 18297">, mit dem Biomoleküle direkt in einem Browserfenster betrachtet</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18419" y="23763"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="24250">' +
                '   <tspan x="3006 3218 3429 3641 3747 3934 4145 4262 4378 4495 4682 4825 4946 5052 5359 5546 5687 5899 6086 6297 6403 6615 6827 7038 7250 7437 7649 7756 7862 7978 8144 8261 8366 8578 8790 8931 9037 9224 9340 9457 9645 9977 10083 10294 10481 10647 10753 10869 11056 11173 11339 11455 11667 11878 12090 12256 12422 12538 12725 12866 13078 13268 13374 13611 13752 13963 14175 14316 14503 14829 15163">und editiert werden können, ist vor allem das leistungsstarke Programm </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="italic" font-weight="400" text-decoration="none">' +
                '  <text x="15268" y="24250">' +
                '   <tspan x="15268 15480 15762 15878 16042 16208 16466 16773 17030 17173 17431 17547 17734 18016 18203">SwissPDB-Viewer</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="18373" y="24250"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="24737">' +
                '   <tspan x="3006 3193 3406 3512 3699 3839 4145 4332 4544 4756 4943 5154 5262 5368 5694 5811 5932 6038 6250 6439 6768 6874 7181 7298 7439 7544 7661 7991 8097 8331 8543 8659 8871 9058 9270 9481 9668 9883 9989 10176 10388 10575 10788 10894 11081 11222 11434 11621 11737 11854 12041 12258 12363 12670 12857 12998 13210 13397 13609">zu erwähnen, mit dem wir im Folgenden auch arbeiten werden.</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="245" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="13714" y="24571">2</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Palatino" font-size="205" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="25688">1</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Garamond" font-size="353" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="25825"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3755" y="25825">' +
                '   <tspan x="3755 3951 4127 4245 4334 4510 4609 4764 4852 5067 5244 5343 5597 5695 5851 6027 6126 6302 6478 6657 6745 6833 7009 7186 7362 7450 7704 8017 8253 8371 8586 8742 8897 9073 9250 9348 9525 9680 9860 9948 10103 10280 10400 10488 10742 10918 11073 11172 11349 11486 11643 11731 11908 12063 12183 12271 12447 12701 12820 13015 13114 13231 13407 13583 13682 13859 13977 14065 14241 14418 14594 14682 14917 15016 15190 15465 15642 15741 15896 16072 16249 16347 16503 16681 16769 16924 17041 17217 17316 17471 17570 17672 17760 17937 18092 18210">Für die Entwicklung  von NMR-Techniken zur Analyse der 3D-Struktur von Biomolekülen erhielt der </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3006" y="26250">' +
                '   <tspan x="3006 3204 3359 3535 3789 3944 4043 4198 4354 4475 4564 4800 4976 5131 5407 5505 5682 5837 5955 6043 6297 6474 6590 6691 6779 7111 7287 7386 7562 7679 7777 7933 8112 8201 8377 8553 8730 8906 8994 9171 9326 9502 9591 9845 10021 10197 10353 10451 10628 10744 10899 10998 11136">Schweizer Chemiker Kurt Wüthrich 2002 den Nobelpreis.</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Palatino" font-size="205" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="26538">2</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Garamond" font-size="353" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3006" y="26675"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3755" y="26675">' +
                '   <tspan x="3755 4009 4164 4304 4392 4589 4706 4882 5059 5175 5330 5605 5882 5970 6166 6420 6519 6657 6792 6990 7242 7479 7597 7851 7950 8105 8359 8514 8636 8724 8821 8958 9057 9145 9262 9438 9556 9645 9976 10075 10251 10428 10604 10858 10998 11086 11262 11439 11594 11712 11800 12114 12269 12428 12516 12693 12869 13123 13299 13398 13575 13730 13906 14083 14238 14358 14446 14622 14799 14897 15053 15169 15270">Das Programm SwissPDB-Viewer ist für Windows oder Mac downloadbar unter: </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,255)" stroke="none" font-family="Garamond" font-size="353" font-style="normal" font-weight="400" text-decoration="underline ">' +
                '  <text x="3006" y="27100">' +
                '   <tspan x="3006 3182 3279 3378 3555 3653 3750 3849 4103 4357 4611 4699 4855 5031 5207 5363 5500 5677 5765 5943 6059 6236 6334 6472 6648 6825 7001 7178 7276 7552 7707 7806 7982 8158 8314 8492 8647 8735 8912 9010 9285">http://www.expasy.org/spdbv/mainpage.html</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="10400" y="28009">2</text>' +
                '  <rect fill="rgb(0,0,0)" stroke="none" x="2501" y="25381" width="3999" height="18"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="5769" y="7370">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5788" y="6658">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4699" y="6986">S</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5898,6711 L 5886,7084"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5883,6704 L 5913,6704 5901,7091 5871,7091 5883,6704 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5238,6278 L 5746,6463"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5238,6297 L 5231,6278 5246,6267 5758,6448 5746,6474 5238,6297 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5283,6429 L 5702,6583"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5272,6444 L 5283,6414 5713,6568 5705,6594 5272,6444 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4895,6726 L 5226,6286"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4899,6741 L 4876,6723 5216,6274 5231,6278 5238,6297 4899,6741 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5197,7423 L 4910,7005"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5208,7411 L 5204,7430 5185,7434 4895,7008 4917,6990 5208,7411 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5208,7430 L 5724,7272"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,7442 L 5204,7430 5208,7411 5724,7257 5736,7287 5219,7442 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5261,7280 L 5687,7148"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5261,7295 L 5250,7265 5690,7133 5697,7163 5261,7295 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5099" y="8281">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5204,7999 L 5208,7999 5208,7434 5204,7434 5204,7999 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,7999 L 5185,7999 5185,7434 5204,7430 5219,7442 5219,7999 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5091" y="8989">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5204,8714 L 5208,8714 5208,8338 5204,8338 5204,8714 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,8714 L 5185,8714 5185,8330 5219,8330 5219,8714 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5792" y="8281">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5754,8075 L 5344,8075 5344,8078 5754,8078 5754,8075 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5758,8059 L 5758,8090 5339,8090 5339,8059 5758,8059 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5754,8203 L 5344,8203 5344,8206 5754,8206 5754,8203 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5758,8188 L 5758,8217 5339,8217 5339,8188 5758,8188 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4372" y="8281">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4654,8203 L 5069,8203 5069,8206 4654,8206 4654,8203 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4650,8217 L 4650,8188 5072,8188 5072,8217 4650,8217 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4654,8075 L 5069,8075 5069,8078 4654,8078 4654,8075 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4650,8090 L 4650,8059 5072,8059 5072,8090 4650,8090 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5592" y="9494">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5581,9223 L 5355,8997"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5596,9219 L 5574,9238 5336,9005 5359,8981 5596,9219 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4590" y="9494">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4828,9226 L 5050,9000"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4831,9241 L 4809,9219 5042,8981 5065,9005 4831,9241 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5118" y="5713">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5231,5766 L 5234,5766 5234,6278 5231,6278 5231,5766 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5216,5759 L 5246,5759 5246,6267 5231,6278 5216,6274 5216,5759 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5841,5220 L 5378,5484"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5834,5205 L 5849,5216 5864,5224 5381,5502 5366,5476 5834,5205 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4620" y="5212">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4884,5220 L 5106,5446"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4868,5224 L 4888,5201 5121,5438 5099,5460 4868,5224 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9315" y="7197">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,6915 L 9424,6915 9424,6350 9420,6350 9420,6915 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9435,6918 L 9405,6918 9405,6350 9420,6342 9435,6350 9435,6918 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9307" y="7905">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,7626 L 9424,7626 9424,7253 9420,7253 9420,7626 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9435,7629 L 9405,7629 9405,7246 9435,7246 9435,7629 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10008" y="7197">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,6990 L 9560,6990 9560,6993 9974,6993 9974,6990 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,6974 L 9974,7005 9556,7005 9556,6974 9974,6974 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,7118 L 9560,7118 9560,7121 9974,7121 9974,7118 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,7103 L 9974,7133 9556,7133 9556,7103 9974,7103 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8587" y="7197">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8871,7118 L 9288,7118 9288,7121 8871,7121 8871,7118 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8866,7133 L 8866,7103 9288,7103 9288,7133 8866,7133 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8871,6990 L 9288,6990 9288,6993 8871,6993 8871,6990 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8866,7005 L 8866,6974 9288,6974 9288,7005 8866,7005 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9808" y="8409">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9797,8139 L 9571,7913"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9812,8134 L 9789,8157 9556,7920 9578,7897 9812,8134 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8927,8259 L 9266,7916"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8938,8270 L 8920,8266 8912,8247 9258,7897 9281,7920 8938,8270 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13071" y="8281">S</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13060" y="8989">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,8714 L 13176,8714 13176,8338 13173,8338 13173,8714 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13191,8714 L 13158,8714 13158,8330 13191,8330 13191,8714 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13760" y="8281">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13723,8075 L 13316,8075 13316,8078 13723,8078 13723,8075 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13727,8059 L 13727,8090 13309,8090 13309,8059 13727,8059 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13723,8203 L 13316,8203 13316,8206 13723,8206 13723,8203 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13727,8188 L 13727,8217 13309,8217 13309,8188 13727,8188 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12340" y="8281">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12623,8203 L 13053,8203 13053,8206 12623,8206 12623,8203 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12615,8217 L 12615,8188 13056,8188 13056,8217 12615,8217 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12623,8075 L 13053,8075 13053,8078 12623,8078 12623,8075 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12615,8090 L 12615,8059 13056,8059 13056,8090 12615,8090 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13561" y="9494">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13546,9223 L 13328,8997"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13565,9219 L 13542,9238 13309,9005 13331,8981 13565,9219 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12558" y="9494">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12796,9226 L 13019,9000"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12800,9241 L 12777,9219 13014,8981 13037,9005 12800,9241 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9876,6086 L 9424,6338"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9865,6071 L 9880,6078 9899,6090 9435,6350 9420,6342 9420,6323 9865,6071 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9778,6029 L 9424,6225"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9778,6010 L 9793,6037 9428,6244 9413,6218 9778,6010 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9880,5551 L 9884,5551 9884,6078 9880,6078 9880,5551 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9865,5555 L 9880,5548 9899,5536 9899,6090 9880,6078 9865,6071 9865,5555 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9424,5284 L 9876,5540"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,5299 L 9420,5280 9435,5269 9899,5536 9880,5548 9865,5555 9420,5299 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9424,5397 L 9778,5597"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9413,5404 L 9428,5378 9793,5589 9778,5615 9413,5404 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8969,5540 L 9413,5284"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8976,5555 L 8961,5548 8945,5536 9405,5269 9420,5280 9420,5299 8976,5555 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8961,6078 L 8964,6078 8964,5551 8961,5551 8961,6078 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8976,6071 L 8961,6078 8945,6090 8945,5536 8961,5548 8976,5555 8976,6071 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9058,6022 L 9062,6022 9062,5607 9058,5607 9058,6022 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9074,6026 L 9040,6026 9040,5600 9074,5600 9074,6026 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9413,6338 L 8969,6086"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,6323 L 9420,6342 9405,6350 8945,6090 8961,6078 8976,6071 9420,6323 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9307" y="4888">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,4942 L 9424,4942 9424,5276 9420,5276 9420,4942 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9405,4934 L 9435,4934 9435,5269 9420,5280 9405,5269 9405,4934 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9684" y="4516">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9643,4527 L 9545,4625"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9639,4508 L 9658,4530 9548,4643 9526,4621 9639,4508 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8934" y="4516">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9194,4523 L 9293,4625"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9180,4530 L 9198,4508 9311,4618 9288,4640 9180,4530 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12536" y="6263">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12909,5661 L 13436,5661 13436,5664 12909,5664 12909,5661 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12913,5676 L 12906,5661 12913,5646 13448,5646 13441,5661 13429,5676 12913,5676 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12713,5992 L 12898,5664"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12720,6007 L 12695,5992 12887,5661 12906,5661 12913,5676 12720,6007 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12898,6576 L 12740,6289"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12913,6564 L 12906,6579 12887,6583 12720,6293 12747,6278 12913,6564 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13436,6579 L 12909,6579 12909,6583 13436,6583 13436,6579 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13429,6564 L 13441,6579 13426,6598 12916,6598 12906,6579 12913,6564 13429,6564 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13369,6677 L 12980,6677 12980,6681 13369,6681 13369,6677 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13369,6662 L 13369,6692 12973,6692 12973,6662 13369,6662 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13696,6127 L 13444,6576"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13686,6124 L 13701,6124 13711,6139 13456,6583 13441,6579 13429,6564 13686,6124 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13696,6116 L 13444,5664"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13711,6105 L 13701,6124 13686,6124 13429,5676 13441,5661 13448,5646 13711,6105 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12638" y="7231">S</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12785,6949 L 12906,6586"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12800,6959 L 12769,6952 12887,6583 12906,6579 12916,6598 12800,6959 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13166,7396 L 12891,7197"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,7381 L 13173,7400 13158,7408 12875,7204 12894,7178 13173,7381 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13595,7095 L 13176,7396"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13583,7084 L 13598,7087 13618,7095 13188,7408 13173,7400 13173,7381 13583,7084 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13482,7057 L 13176,7276"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13478,7038 L 13497,7065 13181,7295 13161,7268 13478,7038 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13598,7084 L 13441,6586"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13618,7095 L 13598,7087 13583,7084 13426,6598 13441,6579 13456,6583 13618,7095 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,7408 L 13176,7408 13176,7999 13173,7999 13173,7408 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13158,7408 L 13173,7400 13188,7408 13188,7999 13158,7999 13158,7408 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12136" y="5890">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12359,5913 L 12506,6059"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12344,5921 L 12367,5897 12525,6052 12502,6075 12344,5921 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12427,5845 L 12566,5980"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12412,5852 L 12435,5830 12582,5977 12558,5999 12412,5852 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12136" y="6640">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12401,6421 L 12540,6282"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12408,6439 L 12386,6417 12536,6267 12558,6289 12408,6439 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12332,6353 L 12480,6210"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12340,6372 L 12318,6350 12476,6195 12499,6214 12340,6372 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12160" y="5340">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="12386" y="5408">3</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="12525" y="5340">C</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12740,5371 L 12898,5653"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12720,5371 L 12747,5355 12913,5646 12906,5661 12887,5661 12720,5371 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="14123" y="6263">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14096,6124 L 13708,6124 13708,6127 14096,6127 14096,6124 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14100,6105 L 14100,6139 13711,6139 13701,6124 13711,6105 14100,6105 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 14608,5751 L 14360,5999"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14608,5728 L 14612,5743 14620,5762 14368,6014 14345,5992 14608,5728 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="15030" y="5890">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="15256" y="5890">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="15482" y="5954">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14993,5743 L 14620,5743 14620,5747 14993,5747 14993,5743 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14993,5728 L 14993,5762 14620,5762 14612,5743 14608,5728 14993,5728 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="14390" y="6723">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 14412,6432 L 14348,6308"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14435,6429 L 14405,6444 14329,6308 14356,6293 14435,6429 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5736" y="4829">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5962" y="4829">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6188" y="4893">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5849,4885 L 5852,4885 5852,5212 5849,5212 5849,4885 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5834,4877 L 5864,4877 5864,5224 5849,5216 5834,5205 5834,4877 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6188" y="5627">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 6199,5359 L 5852,5163"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 6214,5352 L 6199,5378 5841,5175 5856,5144 6214,5352 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 6153,5442 L 5807,5250"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 6165,5435 L 6150,5460 5792,5258 5807,5227 6165,5435 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="376" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="4194" y="10793">A</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4443" y="10793">c</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4632" y="10793">e</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4843" y="10793">t</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4941" y="10793">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5152" y="10793">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5339" y="10793">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5547" y="10793">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5630" y="10793">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5841" y="10793">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6153" y="10793">i</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6237" y="10793">d</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12314" y="10793">D</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12585" y="10793">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12793" y="10793">r</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12916" y="10793">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13105" y="10793">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13316" y="10793">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13399" y="10793">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13603" y="10793">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13915" y="10793">i</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13998" y="10793">d</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8076" y="10793">S</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8327" y="10793">u</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8535" y="10793">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8618" y="10793">f</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8724" y="10793">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8930" y="10793">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9239" y="10793">e</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9450" y="10793">t</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9552" y="10793">h</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9759" y="10793">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9970" y="10793">x</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10159" y="10793">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10366" y="10793">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10554" y="10793">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10762" y="10793">l</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8275" y="8409">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8098" y="8910">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8920,8270 L 9085,8767"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8908,8281 L 8920,8266 8938,8270 9104,8779 9085,8775 9066,8767 8908,8281 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8527,8266 L 8920,8266 8920,8270 8527,8270 8527,8266 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8520,8281 L 8520,8247 8912,8247 8920,8266 8908,8281 8520,8281 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8527,8360 L 8847,8360 8847,8364 8527,8364 8527,8360 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8520,8375 L 8520,8345 8851,8345 8851,8375 8520,8375 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8263,8635 L 8320,8470"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8279,8643 L 8248,8635 8309,8458 8335,8470 8279,8643 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8648,9076 L 8373,8880"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8652,9064 L 8652,9084 8636,9091 8358,8888 8373,8865 8652,9064 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8660,9076 L 9077,8779"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8667,9091 L 8652,9084 8652,9064 9066,8767 9085,8775 9104,8779 8667,9091 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8660,8959 L 8964,8741"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8663,8978 L 8644,8951 8961,8722 8979,8748 8663,8978 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8538" y="9761">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8765" y="9761">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8991" y="9825">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8652,9479 L 8655,9479 8655,9087 8652,9087 8652,9479 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8667,9479 L 8636,9479 8636,9091 8652,9084 8667,9091 8667,9479 Z"/>' +
                '  <rect fill="none" stroke="none" x="4195" y="4230" width="11430" height="6625"/>' +
                ' </g>' +
                '</svg>' +
                '</p><hr>' +
                '<p id="pres_page_3">' +
                '<?xml version="1.0" encoding="UTF-8"?>' +
                '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
                '<svg width="210mm" height="297mm" viewBox="0 0 21000 29700" stroke-width="28.222" stroke-linejoin="round" xml:space="preserve">' +
                ' <rect fill="none" stroke="none" x="2501" y="1252" width="15997" height="26848"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="199254" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="14566" y="50488" width="4128" height="3651"/>' +
                ' <rect fill="none" stroke="none" x="11074" y="32703" width="7303" height="5080"/>' +
                ' <rect fill="none" stroke="none" x="17106" y="63221" width="1072" height="1072"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="77729" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="73115" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="4089" y="108671" width="12054" height="1757"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="115200" width="1058" height="1058"/>' +
                ' <rect fill="none" stroke="none" x="17424" y="129764" width="1072" height="1072"/>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="332" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="4773" y="-36222">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5351" y="-36222">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5063,-36299 L 5325,-36299 5325,-36273 5063,-36273 5063,-36299 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5063,-36401 L 5325,-36401 5325,-36375 5063,-36375 5063,-36401 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4167" y="-36222">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4747,-36401 L 4483,-36401 4483,-36375 4747,-36375 4747,-36401 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4747,-36299 L 4483,-36299 4483,-36273 4747,-36273 4747,-36299 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="7273" y="-36299">O</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6799" y="-36018">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 7221,-36350 L 7063,-36248"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="7800" y="-36018">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 7589,-36350 L 7748,-36248"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11459" y="-36171">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11459" y="-36733">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 11643,-36452 L 11669,-36452 11669,-36707 11643,-36707 11643,-36452 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 11538,-36452 L 11564,-36452 11564,-36707 11538,-36707 11538,-36452 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10722" y="-35890">H</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10959" y="-35890">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 11432,-36222 L 11274,-36120"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="11986" y="-35890">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12275,-36197 L 12432,-36197 12432,-36171 12275,-36171 12275,-36197 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 11775,-36222 L 11933,-36120"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13855" y="-36120">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="230" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="14117" y="-36375">+</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8800,-36375 L 9985,-36375 9985,-36350 8800,-36350 8800,-36375 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8800,-36222 L 9985,-36222 9985,-36197 8800,-36197 8800,-36222 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9537,-36477 L 9958,-36375"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9248,-36120 L 8800,-36222"/>' +
                '  <path fill="rgb(255,255,255)" stroke="none" d="M 6036,-36631 L 6352,-36631 6352,-36069 6036,-36069 6036,-36631 Z"/>' +
                '  <path fill="none" stroke="rgb(255,255,255)" d="M 6036,-36631 L 6326,-36631 6326,-36094 6036,-36094 6036,-36631 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="511" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6063" y="-36146">+</text>' +
                '  <path fill="rgb(255,255,255)" stroke="none" d="M 12907,-36605 L 13223,-36605 13223,-36018 12907,-36018 12907,-36605 Z"/>' +
                '  <path fill="none" stroke="rgb(255,255,255)" d="M 12907,-36605 L 13196,-36605 13196,-36043 12907,-36043 12907,-36605 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12933" y="-36120">+</text>' +
                '  <rect fill="none" stroke="none" x="4089" y="-37093" width="10319" height="1455"/>' +
                '  <rect fill="none" stroke="none" x="5994" y="-54409" width="8573" height="6401"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Garamond" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="1642">' +
                '   <tspan x="2505 2787 2974 3115 3327 3539 3726 3937 4149 4361 4572 4713 4900 5066 5253 5373 5479 5715 5902 6043 6160 6371 6558 6700 6887 7028 7239 7426 7544">Carboanhydrase: Partnerarbeit</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12977" y="1642">' +
                '   <tspan x="12977 13282 13494 13610 13797 13914 14030 14242 14453 14667 14789 14894 15270 15482 15598 15785 15972 16184 16300 16487 16634 16739 17115 17327 17538 17725 17842 17958 18075 18286">Anleitung: Molecular Modelling</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="494" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="2505" y="3387">4</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3267" y="3387">' +
                '   <tspan x="3267 3623 3898 4036 4255 4391 4556 4830 5105 5352 5475 5879 6019 6190 6313 6641 6860 7079 7354 7601 7876 8042 8289 8534 8809 9028">Anleitung mit Lernaufgaben</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="4480">' +
                '   <tspan x="2505 2812 2999 3323 3442 3563 3669 3906 4022 4211 4317 4528 4645 4833 4939 5080 5292 5408 5620 5807 6019 6230 6417 6631 6737 6973 7160 7372 7513 7629 7746 7862 8054 8160 8372 8583 8724 8911 9123 9264 9476 9688 9829 10016 10229 10335 10547 10758 10970 11182 11369 11580 11686 11792 12116 12328 12494 12660 12847 13062 13168 13404 13520 13709 13815 13933 14120 14237 14424 14544 14649 14836 14953 15164 15351 15567 15672 15955 16166 16491 16703 16914 17031 17218 17364 17470 17682 17893 18034">Damit Sie die folgenden Schritte durchführen können, müssen Sie jetzt einen Computer vor </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="4967">' +
                '   <tspan x="2505 2671 2787 2974 3188 3293 3505 3692 3904 4091 4302 4410 4516 4728 4914 5056 5161 5486 5604 5726 5832 6043 6230 6560 6666 6807 7019 7135 7322 7463 7675 7862 7984 8089 8301 8488 8629 8841 9053 9264 9476 9663 9876 9982 10099 10264 10381 10487 10698 10910 11122 11227 11414 11626 11769 11875 12086 12273 12603 12709 12921 13108 13274 13379 13614 13755 13967 14178 14320 14507 14833 15166 15272 15507 15814 15930 16094 16260 16494 16801 17084 17225 17532 17648 17835 18142 18329">sich haben, der mit dem Internet verbunden ist und auf dem das Programm SwissPDB-Viewer</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18470" y="4967"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="5454">' +
                '   <tspan x="2505 2621 2833 2999 3115 3302 3419 3535 3653 3840 3981 4103 4209 4325 4491 4608">installiert ist.</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="459" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="2505" y="6884">' +
                '   <tspan x="2505 2733 2849">4.1</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3521" y="6884">' +
                '   <tspan x="3521 3853 3978 4182 4297 4629 4858 5063 5317 5546 5775 6029 6283 6516 6770 6975 7202 7380 7585 7700 8077 8206 8363 8478 8705 8910 9164 9418 9672 9926 10130 10384 10591 10975 11090 11444 11675 11929 12134 12363 12591 12796 13050 13254 13482 13686 13940 14170 14424 14653">Die Carboanhydrase mit gebundenem Hydrogencarbonat</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="2505" y="8394">' +
                '   <tspan x="2505 2717 2823 3034 3140">4.1.1</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3775" y="8394">' +
                '   <tspan x="3775 4033 4220 4431 4643 4830 5040 5396 5751 5856 6020 6162 6373 6560 6701 6888 7126 7232 7467 7701 7938 8044 8349 8560 8702 8889 9008 9114 9231 9442 9679 9866">Programm starten und Datei laden</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="353" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="3256" y="9409">' +
                '   <tspan x="3256 3510 3686 3962 4117 4233 4410 4586 4764 4937">Anmerkung:</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5505" y="9409">' +
                '   <tspan x="5505 5616 5897 5985 6179 6355 6454 6629 6784 6960 7138 7294 7475 7563 7719 7895 7994 8131 8308 8424 8523 8678 8855 8953 9042 9197 9296 9472 9629 9717 9932 10086 10266 10365 10500 10599 10754 10853 10952 11109 11197 11294">Im Folgenden entspricht eine Textstelle in</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="353" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="11471" y="9409">' +
                '   <tspan x="11471 11559 11679 11834 11951 12067 12222 12383 12471 12669 12822 13020 13175 13272 13392"> fetter Schrift</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="353" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="13508" y="9409">' +
                '   <tspan x="13508 13596 13751 13928 14027 14281 14436 14612 14767 14889 14977 15133 15231 15408 15563 15840 15928 16138 16237 16413 16590 16683 16771 16948 17103 17221"> entweder einem Link, der </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5505" y="9816">' +
                '   <tspan x="5505 5660 5837 6011 6166 6343 6442 6540 6696 6872 6974 7063 7317 7472 7588 7765 7920 8101 8190 8463 8639 8777 8915 9003 9091 9246 9345 9521 9677 9954 10042 10257 10410 10589 10687 10776 10864 11040 11195 11315 11403 11559 11657 11834 12007 12164 12338 12495 12673 12829 13010 13099 13353 13508 13624 13801 13956 14136 14224 14499 14675 14813 14951 15039 15215 15392 15547 15665 15753 15908 16007 16184 16339 16459 16547 16801 16977 17074 17173 17350 17526 17614 17702 17879 17977 18134">angeklickt werden muss, einem Text, der eingegeben werden muss oder einer Aktion, die </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5505" y="10224">' +
                '   <tspan x="5505 5660 5837 5974 6149 6304 6420 6597 6775 6891 6994 7082 7336 7491 7608 7784 7939 8121 8209 8484 8661 8796 8934">ausgeführt werden muss.</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="11183">' +
                '   <tspan x="2505 2717">1)</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="11183">' +
                '   <tspan x="3140 3447 3634 3846 4033 4244 4350 4586 4703 4892 4997 5114 5444 5549 5832 5973 6184 6490 6655 6842 6985 7091 7303 7419 7608 7714 7855 8067 8183 8370 8511 8723 8910 9026 9213 9425 9566 9753 9919 10084 10275 10381 10592 10779 10922 11028 11263 11570 11852 11993 12298 12485 12602 12788 13000 13212 13399 13610 13826 13931 14118 14235 14447 14566">Geben Sie im Browser die Internetadresse der PDB-Datenbank ein: </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="14672" y="11183">' +
                '   <tspan x="14672 14908 15049 15189 15425 15566 15683 15797 16108 16416 16727 16831 17016 17201 17365 17600 17706 17918 18105">http://www.rcsb.org</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="2505" y="12157">' +
                '   <tspan x="2505 2717">2)</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="12157">' +
                '   <tspan x="3140 3281 3611 3717 3951 4163 4350 4562 4703 4890 5006 5221 5327 5498 5735 5922 6109 6250 6437 6652 6758 6874 7086 7275 7380 7686 7827 8014 8225 8342 8553 8740 8917 9023 9128 9340 9527 9739 9952 10058 10270 10457 10644 10857 10963 11197 11503 11785 11926 12233 12420 12536 12723 12840 13027 13244 13349 13561 13746 13912 14124 14311 14522 14642 14748 15053 15240 15381 15593 15780 15992 16112 16217 16404 16616 16733 17039 17226 17438 17625 17768 17874 18198 18317">Im Suchfeld &quot;Search the Archive&quot;  kann nach PDB-Dateien gesucht werden: entweder mit</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18438" y="12157"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="12644">' +
                '   <tspan x="3140 3281 3468 3680 3891 4008 4124 4290 4477 4689 4876 5087 5232 5338 5574 5786 5973 6184 6396 6583 6795 6936 7052 7193 7335 7522 7737 7843 8054 8266 8453 8594 8700 9026 9143 9264 9370 9582 9769 9912 10017 10252 10559 10841 10982 11123 11335 11522 11734 11850 11967 12108 12224 12436 12623 12741 12857 13069 13281">(englischen) Suchbegriffen oder mit der PDB-Identifikations</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13450" y="12644">' +
                '   <tspan x="13450 13662 13873 14200 14526 14715 14856 14967 15073 15380 15567 15778 15965 16177 16283 16519 16636 16824 16930 17047 17258 17424">nummer. Geben Sie ins </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="13130">' +
                '   <tspan x="3140 3376 3588 3775 3987 4128 4315 4431 4645 4750 4962 5149 5363 5468 5703 5915 6102 6313 6525 6712 6924 7065 7181 7322 7467">Suchfeld den Suchbegriff </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="7572" y="13130">' +
                '   <tspan x="7572 7877 8089 8276 8512 8724 8960 9077 9265 9371 9676 9911 10146 10359 10595 10782 10994 11160 11347">Carbonic Anhydrase </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="11453" y="13130">' +
                '   <tspan x="11453 11594 11781 11993 12204 12321 12437 12603 12790 13005 13111 13252 13464 13605 13711 13993 14180 14321 14533 14744 14931 15143 15356 15559 15773 15916 16103 16268 16455">(englisch für Carboanhydrase)</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="italic" font-weight="400" text-decoration="none">' +
                '  <text x="16602" y="13130"> </text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="16708" y="13130">' +
                '   <tspan x="16708 16895 17011 17225 17331 17542 17754 17966">ein und </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="13617">' +
                '   <tspan x="3140 3256 3468 3634 3821 4034 4140 4376 4493 4680 4786 4997 5114 5303 5408 5645 5856 6043 6255 6444 6550 6761 6973 7114 7301 7513 7619 7925 8042 8158 8345 8557 8744 8959 9065 9252 9464 9606">lösen Sie die Suche durch Klicken auf </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="9712" y="13617">' +
                '   <tspan x="9712 9970 10086 10322 10559 10665 10876 10982 11148 11289 11476 11712 11899 12040 12277 12464">Find a structure</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="italic" font-weight="400" text-decoration="none">' +
                '  <text x="12652" y="13617"> </text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="12758" y="13617">' +
                '   <tspan x="12758 12945 13157 13322">aus.</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="14591">' +
                '   <tspan x="2505 2717">3)</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="14591">' +
                '   <tspan x="3140 3447 3563 3752 3858 4024 4140 4327 4539 4655 4844 4950 5184 5491 5773 5915 6222 6408 6525 6712 6832 6938 7149 7361 7573 7678 7890 8102 8289 8500 8606 8933 9049 9171 9277 9488 9675 9818 9924 10159 10465 10748 10889 11028 11335 11476 11781 11993 12319 12646 12834 12981">Die siebte PDB-Datei von oben mit der PDB-ID-Nummer </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="italic" font-weight="400" text-decoration="none">' +
                '  <text x="13086" y="14591">' +
                '   <tspan x="13086 13298 13555 13696">1BIC</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="13981" y="14591">' +
                '   <tspan x="13981 14087 14193 14309 14475 14593 14699 14911 15027 15216 15322 15628 15815 15955 16121 16237 16424 16540 16657 16868 17080 17297">  ist die Darstellung </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="15078">' +
                '   <tspan x="3140 3352 3562 3727 3914 4055 4242 4410 4516 4773 4985 5174 5378 5705 5879 5985 6310 6428 6550 6655 6867 7054 7266 7477 7689 7901 8088 8299 8488 8818 8924 9232 9435 9647 9788 10000 10213 10400 10612 10801 10988 11129 11340 11552 11764 11952 12069 12180 12286 12497 12684 13014 13120 13332 13519 13635 13847 13988 14104 14221 14408 14621 14808 15025 15131 15366 15507 15718 15930 16142 16353 16471 16577 16789 16999 17165 17352 17493 17680 17823">unseres Enzyms mit gebundenem Hydrogencarbonat, dem natürlichen Produkt unserer </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="15565">' +
                '   <tspan x="3140 3422 3609 3796 4008 4124 4241 4452 4664 4773 4879 5186 5303 5419 5606 5818 6005 6220 6326 6562 6678 6867 6973 7185 7372 7490 7596 7807 7924 8111 8276 8463 8606 8712 9019 9206 9322 9509 9629 9735 9922 10134 10275 10381 10592 10779 10993 11099 11356 11473 11684 11898">Reaktion. Klicken Sie bei dieser Datei auf den Link </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="12003" y="15565">' +
                '   <tspan x="12003 12285 12493 12730 12846 13058 13245">Explore</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="13437" y="15565">' +
                '   <tspan x="13437 13543 13649 13860 14190 14296 14483 14695 14836 14942 15083 15294 15435 15647 15788 16113 16302 16420 16536 16748 16959 17125 17291 17478 17594 17713 17905">, um zur Informationsseite </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="16051">' +
                '   <tspan x="3140 3352 3539 3682 3787 4022 4327 4609 4750 5057 5244 5361 5548 5668 5773 5960 6174 6280 6491 6678 6795 6982 7193 7405 7592 7804">der PDB-Datei zu gelangen.</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="17025">' +
                '   <tspan x="2505 2717">4)</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="17025">' +
                '   <tspan x="3140 3447 3775 3881 4093 4209 4398 4503 4810 4997 5114 5301 5421 5527 5738 5925 6066 6278 6490 6606 6793 6934 7121 7333 7449 7636 7850 8037 8248 8359 8465 8677 8793 8910 9097 9308 9495 9710 9816 10053 10169 10358 10464 10651 10862 11003 11109 11321 11508 11721 11827 12085 12201 12413 12626">Um die Datei herunterzuladen, klicken Sie auf den Link </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="12732" y="17025">' +
                '   <tspan x="12732 13037 13247 13559 13794 13909 14120 14330 14566 14683 14990 15106 15272 15508 15625 15835 16050 16156 16413 16530 16646">Download/Display File</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="16836" y="17025">' +
                '   <tspan x="16836 16942 17058 17175 17386 17598 17766"> links </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="17512">' +
                '   <tspan x="3140 3352 3563 3750 3962">oben.</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="18486">' +
                '   <tspan x="2505 2717">5)</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="18486">' +
                '   <tspan x="3140 3539 3726 3937 4054 4241 4456 4562 4798 4914 5103 5209 5325 5539 5645 5856 6043 6184 6290 6477 6784 6971 7088 7204 7391 7606 7712 7970 8157 8368 8555 8672 8790 8982 9088 9259 9495 9802 10084 10257 10363 10550 10667 10832 10938 11175 11291 11407 11596 11702 11938 12150 12291 12616 12804 12926 13032 13244 13455 13667 13773 13946 14157 14369 14581 14768 14940 15046 15233 15350 15517 15623 15810 16022 16346 16558 16699 16886 17052 17218 17334 17546 17763 17868 18080 18292">Wählen Sie in der zweiten Tabelle &quot;PDB&quot; als File Format und &quot;none&quot; als compression und</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18503" y="18486"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="18972">' +
                '   <tspan x="3140 3352 3468 3585 3771 3983 4170 4385 4491 4728 4844 5033 5138 5350 5537 5703">klicken Sie das </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="5808" y="18972">' +
                '   <tspan x="5808 5995 6231 6371 6536 6773 6960 7147 7334 7570 7757 7993 8230 8419 8524 8852 9039 9226 9465">entsprechende Kreuz</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="9654" y="18972">' +
                '   <tspan x="9654 9760 10084 10203 10324 10430 10642 10829 10972 11077 11219 11406 11593 11804 11921 12108 12323 12429 12806 12993 13203 13369 13485 13672 13838 13954 14145 14251 14438 14649 14755 14861 15025 15237 15343 15554 15741 15907 16073 16179 16366 16482 16695 16801 17179 17366 17577 17789"> mit der rechten Maustaste an, so dass ein Menu </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="19459">' +
                '   <tspan x="3140 3327 3468 3634 3821 4033 4220 4336 4548 4664 4773 4879 5278 5465 5676 5793 5980 6195 6301 6467 6583 6772 6878 7089 7276 7488 7700 7805 8017 8204 8418">erscheint. Wählen sie dann den </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="8523" y="19459">' +
                '   <tspan x="8523 8828 9038 9350 9585 9700 9911 10121 10357 10499 10781 10966 11111 11298 11534">Download-Befehl</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="11652" y="19459">' +
                '   <tspan x="11652 11758 11945 12156 12322 12428 12534 12859 12977 13098 13204 13416 13603 13933 14039 14275 14391 14580 14686 14898 15014 15203 15309 15615 15802 15919 16106 16226 16332 16504 16716 16998 17139 17422 17528 17739 17951 18163 18335"> aus, mit dem Sie die Datei &quot;1BIC.pdb&quot; </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="19946">' +
                '   <tspan x="3140 3327 3539 3682 3787 3999 4184 4350 4456 4763 4950 5116 5327 5444 5655 5867 5973 6114 6326 6467 6654 6819 6925 7208 7419 7744 7955 8167 8285 8472 8613 8783 8889 9100 9312 9524 9640 9827 9968 10155 10370 10476 10688 10899 11111 11323 11510 11721 11827 11968 12155 12342 12450 12556 12767 12979 13191 13296 13603 13886 14027">auf das Desktop Ihres Computers kopieren können (ca. 200 KB).</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="20920">' +
                '   <tspan x="2505 2717">6)</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="20920">' +
                '   <tspan x="3140 3376 3493 3680 3821 3937 4124 4369 4505 4742 4858 5077 5213 5424 5609 5805 5941 6177 6319 6530 6742 6883 7070 7396 7790">Starten Sie das Programm </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="7895" y="20920">' +
                '   <tspan x="7895 8128 8440 8555 8719 8885 9140 9447 9729 9871 10172 10290 10476 10790 10977">SwissPDB-Viewer</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="11164" y="20920">' +
                '   <tspan x="11164 11300 11436 11741 11882 12023 12235 12422 12665 12801 13037 13154 13372 13508 13720 13930 14096 14283 14424 14642 14778 15085 15272 15389 15575 15725 15861">. Öffnen Sie unsere Datei &quot;</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="16036" y="20920">' +
                '   <tspan x="16036 16248 16528 16694">1BIC</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="17000" y="20920">' +
                '   <tspan x="17000 17173 17309 17445 17561 17773 17984 18173">&quot;, indem</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18503" y="20920"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="21407">' +
                '   <tspan x="3140 3376 3493 3689 3801 3918 4255 4368 4675 4862 5073 5285 5401 5728 5915 6126 6350 6463 6650 6862 7017">Sie im Hauptmenu auf </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="7123" y="21407">' +
                '   <tspan x="7123 7381 7497 7613">File</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="7805" y="21407">' +
                '   <tspan x="7805 7925 8137 8348 8567 8680 8892 9079 9290"> und dann</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="9504" y="21407">' +
                '   <tspan x="9504 9624 9836 10164 10400 10587 10830 10943 11201 11508 11797 11910 12167 12284 12400 12587 12693 12799 12905 13129 13242 13478 13594 13711 13898 14134 14321"> „Open PDB File...“ klicken</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="14559" y="21407">' +
                '   <tspan x="14559 14672 14785 15042 15159 15379 15492 15728 15915 16127 16293 16409 16596 16746 16859 17046 17187 17353 17540 17752 17939 18055 18267 18383">. Ein Fenster erscheint:</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18505" y="21407"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="21893">' +
                '   <tspan x="3140 3539 3726 3937 4054 4241 4456 4562 4798 4914 5103 5209 5421 5631 5796 5983 6125 6313 6419 6726 6913 7029 7216 7336 7442 7629 7841 7982 8088 8299 8488 8818 8924 9229 9416 9582 9793 9910 10121 10333">Wählen Sie unsere Datei auf dem Desktop.</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="2505" y="23008">' +
                '   <tspan x="2505 2717">7)</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="3140" y="23008">' +
                '   <tspan x="3140 3468 3585 3701 3888 4124 4311">Klicken</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="4551" y="23008">' +
                '   <tspan x="4551 4657 4893 5010 5198 5304 5491 5703 5890 6031 6197 6315 6421 6632 6819 6985"> Sie zuerst das </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="7091" y="23008">' +
                '   <tspan x="7091 7349 7536 7772 7938 8079 8266 8454 8560 8795 8959 9195 9430 9666 9807 9924 10135 10347 10453 10594 10802 10943 11183 11289 11601 11786">Fenster &quot;Inputlog.txt&quot; weg</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="11994" y="23008">' +
                '   <tspan x="11994 12100 12206 12513 12629 12816 12982 13169 13335 13440 13652 13793 13980 14192 14379 14590 14777 14991 15097 15404 15520 15661 15767 15979 16095 16282 16494 16610">. Dieses brauchen wir nicht.</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="23495">' +
                '   <tspan x="3140 3376 3493 3682 3787 3953 4140 4352 4539 4750 4856 4974 5161 5278 5465 5585 5691 5902 6043 6230 6349 6454 6691 6878 7089 7255 7372 7559 7701 7807 8019 8231 8372 8478 8643 8760 8947 9158 9264 9370 9582 9698 9887 9993 10300 10416 10557 10663 10875 11062 11203 11510 11697 11908 12120 12307 12520 12626 12933 13120 13261 13473 13660 13872 13979 14085 14224 14461 14648 14764 14880 15048 15154 15366 15552 15718 15824 15990 16177 16389 16600 16741 16928 17115 17327 17443 17634">Sie sehen jetzt drei Fenster vor sich, die wir verwenden werden. (Falls das senkrechte </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="italic" font-weight="400" text-decoration="none">' +
                '  <text x="3140" y="23982">' +
                '   <tspan x="3140 3422 3634 3846 3962 4128 4339 4458 4563 4821 5033 5244">Control Pane</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="5433" y="23982">' +
                '   <tspan x="5433 5551 5657 5798 5985 6126 6232 6444 6560 6747 6959 7079 7185 7350 7467 7654 7865 7982 8193 8380 8525 8631 8797 8984 9100 9312 9418 9583 9795 9912 10028 10144 10331 10441 10547 10758 10970 11182 11393 11580 11794 11899 12136 12252 12439 12545 12732 12898 13004 13120 13450">l (c) nicht sichtbar sein sollte, können Sie es im </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="700" text-decoration="none">' +
                '  <text x="13555" y="23982">' +
                '   <tspan x="13555 13883 14095 14331 14567 14707 15065 15250 15485 15719 15825 16248 16365 16601 16838 17046 17358">Hauptmenu Windows</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="17521" y="23982"> </text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="24469">' +
                '   <tspan x="3140 3352 3539 3680 3891 4103 4244 4456 4668 4784 4971 5183 5288">hervorholen.)</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3140" y="25379">' +
                '   <tspan x="3140 3327">a)</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5045" y="25379">' +
                '   <tspan x="5045 5352 5537 5703">Das </tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="italic" font-weight="400" text-decoration="none">' +
                '  <text x="5808" y="25379">' +
                '   <tspan x="5808 6113 6325 6536 6748 6865 6981 7168 7380 7545 7662 7849">Hauptfenster</tspan></text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Times New Roman" font-size="423" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8019" y="25379">' +
                '   <tspan x="8019 8125 8449 8568 8689 8795 9007 9194 9337 9442 9654 9795 9982 10099 10310 10428 10755 10942 11153 11319 11436 11647 11859 12048 12164 12351 12568 12674 12981 13168"> mit der dreidimensionalen Dar</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13309" y="25379">' +
                '   <tspan x="13309 13475 13591 13778">stel</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13896" y="25379">' +
                '   <tspan x="13896 14012 14224 14436 14649 14755 14967 15154 15319 15425 15683 15894 16083 16288 16614 16789 16895 17011 17223 17329 17540 17727 17870">lung des Enzyms in der </tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3775" y="25866">' +
                '   <tspan x="3775 4152 4269 4385 4502 4689 4798 4904 5161 5327 5433 5740 5856 5998 6209 6315 6431 6645 6751 6962 7149 7290 7396 7583 7795 7982 8125 8231 8442 8654 8866 9077 9264 9405 9571 9688 9875 10086 10203 10319 10437 10624 10836 11023 11240 11346 11518 11917 12034 12175 12362 12503 12644 12833 13159 13346 13519 13665 13972 14159 14300 14466 14582 14769 14886 15002 15214 15425 15641 15747 15958 16145 16332 16519 16636 16847 16969 17075 17216 17387 17694 17835 18022 18234">Mitte. Es wird in der eher unübersichtlichen &quot;Wireframe&quot;-Darstellung gezeigt (&quot;Draht</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="18352" y="25866">-</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="3775" y="26353">' +
                '   <tspan x="3775 3987 4103 4220 4336 4523 4664 4837 4978 5089 5195 5430 5641 5828 5945 6132 6276 6382 6689 6876 7017 7229 7416 7627 7733 8040 8157 8298 8403 8615 8827 9014">gitter&quot;). Später werden wir über</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9156" y="26353">' +
                '   <tspan x="9156 9322 9438 9625 9837 9953 10070 10186 10373 10587 10773 10915 11107 11213 11520 11707 11846 12012 12128 12315">sichtlichere Darstel</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12435" y="26353">' +
                '   <tspan x="12435 12551 12763 12975 13186 13352 13493 13705 13846 14171 14358 14575 14680 14892 15079">lungsformen ver</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="15222" y="26353">' +
                '   <tspan x="15222 15529 15716 15928 16139 16326 16538">wenden.</tspan></text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10400" y="28009">3</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="5769" y="-22831">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5788" y="-23543">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4699" y="-23215">S</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5898,-23490 L 5886,-23117"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5883,-23497 L 5913,-23497 5901,-23110 5871,-23110 5883,-23497 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5238,-23923 L 5746,-23738"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5238,-23904 L 5231,-23923 5246,-23934 5758,-23754 5746,-23727 5238,-23904 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5283,-23772 L 5702,-23618"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5272,-23757 L 5283,-23787 5713,-23633 5705,-23607 5272,-23757 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4895,-23475 L 5226,-23916"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4899,-23460 L 4876,-23479 5216,-23927 5231,-23923 5238,-23904 4899,-23460 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5197,-22778 L 4910,-23196"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5208,-22790 L 5204,-22771 5185,-22767 4895,-23193 4917,-23212 5208,-22790 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5208,-22771 L 5724,-22929"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,-22759 L 5204,-22771 5208,-22790 5724,-22944 5736,-22914 5219,-22759 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5261,-22921 L 5687,-23053"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5261,-22906 L 5250,-22937 5690,-23068 5697,-23038 5261,-22906 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5099" y="-21920">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5204,-22202 L 5208,-22202 5208,-22767 5204,-22767 5204,-22202 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,-22202 L 5185,-22202 5185,-22767 5204,-22771 5219,-22759 5219,-22202 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5091" y="-21212">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5204,-21487 L 5208,-21487 5208,-21863 5204,-21863 5204,-21487 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5219,-21487 L 5185,-21487 5185,-21871 5219,-21871 5219,-21487 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5792" y="-21920">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5754,-22127 L 5344,-22127 5344,-22123 5754,-22123 5754,-22127 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5758,-22142 L 5758,-22111 5339,-22111 5339,-22142 5758,-22142 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5754,-21998 L 5344,-21998 5344,-21995 5754,-21995 5754,-21998 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5758,-22014 L 5758,-21984 5339,-21984 5339,-22014 5758,-22014 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4372" y="-21920">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4654,-21998 L 5069,-21998 5069,-21995 4654,-21995 4654,-21998 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4650,-21984 L 4650,-22014 5072,-22014 5072,-21984 4650,-21984 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4654,-22127 L 5069,-22127 5069,-22123 4654,-22123 4654,-22127 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4650,-22111 L 4650,-22142 5072,-22142 5072,-22111 4650,-22111 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5592" y="-20707">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5581,-20978 L 5355,-21204"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5596,-20982 L 5574,-20963 5336,-21196 5359,-21220 5596,-20982 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4590" y="-20707">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4828,-20975 L 5050,-21201"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4831,-20960 L 4809,-20982 5042,-21220 5065,-21196 4831,-20960 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5118" y="-24488">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5231,-24435 L 5234,-24435 5234,-23923 5231,-23923 5231,-24435 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5216,-24442 L 5246,-24442 5246,-23934 5231,-23923 5216,-23927 5216,-24442 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 5841,-24981 L 5378,-24718"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5834,-24996 L 5849,-24985 5864,-24977 5381,-24699 5366,-24726 5834,-24996 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4620" y="-24989">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 4884,-24981 L 5106,-24755"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 4868,-24977 L 4888,-25000 5121,-24763 5099,-24741 4868,-24977 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9315" y="-23004">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,-23286 L 9424,-23286 9424,-23851 9420,-23851 9420,-23286 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9435,-23283 L 9405,-23283 9405,-23851 9420,-23860 9435,-23851 9435,-23283 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9307" y="-22297">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,-22575 L 9424,-22575 9424,-22948 9420,-22948 9420,-22575 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9435,-22572 L 9405,-22572 9405,-22955 9435,-22955 9435,-22572 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10008" y="-23004">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,-23212 L 9560,-23212 9560,-23208 9974,-23208 9974,-23212 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,-23227 L 9974,-23196 9556,-23196 9556,-23227 9974,-23227 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,-23083 L 9560,-23083 9560,-23080 9974,-23080 9974,-23083 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9974,-23099 L 9974,-23068 9556,-23068 9556,-23099 9974,-23099 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8587" y="-23004">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8871,-23083 L 9288,-23083 9288,-23080 8871,-23080 8871,-23083 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8866,-23068 L 8866,-23099 9288,-23099 9288,-23068 8866,-23068 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8871,-23212 L 9288,-23212 9288,-23208 8871,-23208 8871,-23212 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8866,-23196 L 8866,-23227 9288,-23227 9288,-23196 8866,-23196 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9808" y="-21792">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9797,-22062 L 9571,-22289"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9812,-22067 L 9789,-22044 9556,-22281 9578,-22304 9812,-22067 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8927,-21942 L 9266,-22285"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8938,-21931 L 8920,-21935 8912,-21954 9258,-22304 9281,-22281 8938,-21931 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13071" y="-21920">S</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13060" y="-21212">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,-21487 L 13176,-21487 13176,-21863 13173,-21863 13173,-21487 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13191,-21487 L 13158,-21487 13158,-21871 13191,-21871 13191,-21487 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13760" y="-21920">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13723,-22127 L 13316,-22127 13316,-22123 13723,-22123 13723,-22127 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13727,-22142 L 13727,-22111 13309,-22111 13309,-22142 13727,-22142 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13723,-21998 L 13316,-21998 13316,-21995 13723,-21995 13723,-21998 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13727,-22014 L 13727,-21984 13309,-21984 13309,-22014 13727,-22014 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12340" y="-21920">O</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12623,-21998 L 13053,-21998 13053,-21995 12623,-21995 12623,-21998 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12615,-21984 L 12615,-22014 13056,-22014 13056,-21984 12615,-21984 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12623,-22127 L 13053,-22127 13053,-22123 12623,-22123 12623,-22127 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12615,-22111 L 12615,-22142 13056,-22142 13056,-22111 12615,-22111 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13561" y="-20707">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13546,-20978 L 13328,-21204"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13565,-20982 L 13542,-20963 13309,-21196 13331,-21220 13565,-20982 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12558" y="-20707">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12796,-20975 L 13019,-21201"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12800,-20960 L 12777,-20982 13014,-21220 13037,-21196 12800,-20960 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9876,-24115 L 9424,-23863"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9865,-24130 L 9880,-24123 9899,-24111 9435,-23851 9420,-23860 9420,-23878 9865,-24130 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9778,-24172 L 9424,-23976"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9778,-24191 L 9793,-24164 9428,-23957 9413,-23983 9778,-24191 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9880,-24650 L 9884,-24650 9884,-24123 9880,-24123 9880,-24650 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9865,-24646 L 9880,-24653 9899,-24665 9899,-24111 9880,-24123 9865,-24130 9865,-24646 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9424,-24917 L 9876,-24661"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,-24902 L 9420,-24921 9435,-24932 9899,-24665 9880,-24653 9865,-24646 9420,-24902 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9424,-24804 L 9778,-24604"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9413,-24797 L 9428,-24823 9793,-24612 9778,-24586 9413,-24797 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8969,-24661 L 9413,-24917"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8976,-24646 L 8961,-24653 8945,-24665 9405,-24932 9420,-24921 9420,-24902 8976,-24646 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8961,-24123 L 8964,-24123 8964,-24650 8961,-24650 8961,-24123 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8976,-24130 L 8961,-24123 8945,-24111 8945,-24665 8961,-24653 8976,-24646 8976,-24130 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9058,-24179 L 9062,-24179 9062,-24594 9058,-24594 9058,-24179 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9074,-24175 L 9040,-24175 9040,-24601 9074,-24601 9074,-24175 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9413,-23863 L 8969,-24115"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,-23878 L 9420,-23860 9405,-23851 8945,-24111 8961,-24123 8976,-24130 9420,-23878 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9307" y="-25313">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9420,-25260 L 9424,-25260 9424,-24925 9420,-24925 9420,-25260 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9405,-25268 L 9435,-25268 9435,-24932 9420,-24921 9405,-24932 9405,-25268 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9684" y="-25685">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9643,-25674 L 9545,-25576"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9639,-25693 L 9658,-25671 9548,-25558 9526,-25580 9639,-25693 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8934" y="-25685">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 9194,-25678 L 9293,-25576"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 9180,-25671 L 9198,-25693 9311,-25584 9288,-25561 9180,-25671 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12536" y="-23938">S</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12909,-24540 L 13436,-24540 13436,-24537 12909,-24537 12909,-24540 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12913,-24525 L 12906,-24540 12913,-24556 13448,-24556 13441,-24540 13429,-24525 12913,-24525 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12713,-24209 L 12898,-24537"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12720,-24194 L 12695,-24209 12887,-24540 12906,-24540 12913,-24525 12720,-24194 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12898,-23625 L 12740,-23912"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12913,-23637 L 12906,-23622 12887,-23618 12720,-23908 12747,-23923 12913,-23637 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13436,-23622 L 12909,-23622 12909,-23618 13436,-23618 13436,-23622 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13429,-23637 L 13441,-23622 13426,-23603 12916,-23603 12906,-23622 12913,-23637 13429,-23637 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13369,-23524 L 12980,-23524 12980,-23520 13369,-23520 13369,-23524 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13369,-23539 L 13369,-23509 12973,-23509 12973,-23539 13369,-23539 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13696,-24074 L 13444,-23625"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13686,-24078 L 13701,-24078 13711,-24062 13456,-23618 13441,-23622 13429,-23637 13686,-24078 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13696,-24085 L 13444,-24537"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13711,-24096 L 13701,-24078 13686,-24078 13429,-24525 13441,-24540 13448,-24556 13711,-24096 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12638" y="-22970">S</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12785,-23252 L 12906,-23615"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12800,-23242 L 12769,-23249 12887,-23618 12906,-23622 12916,-23603 12800,-23242 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13166,-22805 L 12891,-23004"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,-22820 L 13173,-22801 13158,-22793 12875,-22997 12894,-23023 13173,-22820 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13595,-23106 L 13176,-22805"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13583,-23117 L 13598,-23114 13618,-23106 13188,-22793 13173,-22801 13173,-22820 13583,-23117 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13482,-23144 L 13176,-22925"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13478,-23163 L 13497,-23136 13181,-22906 13161,-22933 13478,-23163 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 13598,-23117 L 13441,-23615"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13618,-23106 L 13598,-23114 13583,-23117 13426,-23603 13441,-23622 13456,-23618 13618,-23106 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13173,-22793 L 13176,-22793 13176,-22202 13173,-22202 13173,-22793 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 13158,-22793 L 13173,-22801 13188,-22793 13188,-22202 13158,-22202 13158,-22793 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12136" y="-24311">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12359,-24289 L 12506,-24142"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12344,-24280 L 12367,-24304 12525,-24149 12502,-24127 12344,-24280 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12427,-24356 L 12566,-24221"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12412,-24349 L 12435,-24371 12582,-24224 12558,-24202 12412,-24349 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12136" y="-23561">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12401,-23780 L 12540,-23919"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12408,-23762 L 12386,-23784 12536,-23934 12558,-23912 12408,-23762 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12332,-23848 L 12480,-23991"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12340,-23829 L 12318,-23851 12476,-24006 12499,-23987 12340,-23829 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12160" y="-24861">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="12386" y="-24793">3</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="12525" y="-24861">C</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 12740,-24831 L 12898,-24548"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 12720,-24831 L 12747,-24846 12913,-24556 12906,-24540 12887,-24540 12720,-24831 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="14123" y="-23938">N</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14096,-24078 L 13708,-24078 13708,-24074 14096,-24074 14096,-24078 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14100,-24096 L 14100,-24062 13711,-24062 13701,-24078 13711,-24096 14100,-24096 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 14608,-24450 L 14360,-24202"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14608,-24473 L 14612,-24458 14620,-24439 14368,-24187 14345,-24209 14608,-24473 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="15030" y="-24311">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="15256" y="-24311">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="15482" y="-24247">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14993,-24458 L 14620,-24458 14620,-24454 14993,-24454 14993,-24458 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14993,-24473 L 14993,-24439 14620,-24439 14612,-24458 14608,-24473 14993,-24473 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="14390" y="-23479">H</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 14412,-23769 L 14348,-23893"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 14435,-23772 L 14405,-23757 14329,-23893 14356,-23908 14435,-23772 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5736" y="-25373">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5962" y="-25373">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6188" y="-25308">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5849,-25317 L 5852,-25317 5852,-24989 5849,-24989 5849,-25317 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 5834,-25324 L 5864,-25324 5864,-24977 5849,-24985 5834,-24996 5834,-25324 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Arial" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="6188" y="-24574">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 6199,-24842 L 5852,-25038"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 6214,-24849 L 6199,-24823 5841,-25026 5856,-25057 6214,-24849 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 6153,-24759 L 5807,-24951"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 6165,-24766 L 6150,-24741 5792,-24944 5807,-24974 6165,-24766 Z"/>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="376" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="4194" y="-19408">A</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4443" y="-19408">c</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4632" y="-19408">e</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4843" y="-19408">t</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="4941" y="-19408">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5152" y="-19408">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5339" y="-19408">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5547" y="-19408">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5630" y="-19408">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="5841" y="-19408">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6153" y="-19408">i</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="6237" y="-19408">d</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12314" y="-19408">D</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12585" y="-19408">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12793" y="-19408">r</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="12916" y="-19408">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13105" y="-19408">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13316" y="-19408">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13399" y="-19408">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13603" y="-19408">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13915" y="-19408">i</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="13998" y="-19408">d</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8076" y="-19408">S</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8327" y="-19408">u</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8535" y="-19408">l</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8618" y="-19408">f</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8724" y="-19408">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8930" y="-19408">m</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9239" y="-19408">e</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9450" y="-19408">t</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9552" y="-19408">h</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9759" y="-19408">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="9970" y="-19408">x</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10159" y="-19408">a</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10366" y="-19408">z</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10554" y="-19408">o</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="10762" y="-19408">l</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="312" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8275" y="-21792">N</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8098" y="-21291">O</text>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8920,-21931 L 9085,-21434"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8908,-21920 L 8920,-21935 8938,-21931 9104,-21423 9085,-21426 9066,-21434 8908,-21920 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8527,-21935 L 8920,-21935 8920,-21931 8527,-21931 8527,-21935 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8520,-21920 L 8520,-21954 8912,-21954 8920,-21935 8908,-21920 8520,-21920 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8527,-21841 L 8847,-21841 8847,-21837 8527,-21837 8527,-21841 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8520,-21826 L 8520,-21856 8851,-21856 8851,-21826 8520,-21826 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8263,-21566 L 8320,-21731"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8279,-21558 L 8248,-21566 8309,-21743 8335,-21731 8279,-21558 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8648,-21125 L 8373,-21321"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8652,-21137 L 8652,-21117 8636,-21110 8358,-21313 8373,-21336 8652,-21137 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8660,-21125 L 9077,-21423"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8667,-21110 L 8652,-21117 8652,-21137 9066,-21434 9085,-21426 9104,-21423 8667,-21110 Z"/>' +
                '  <path fill="none" stroke="rgb(0,0,0)" d="M 8660,-21242 L 8964,-21460"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8663,-21223 L 8644,-21250 8961,-21480 8979,-21453 8663,-21223 Z"/>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8538" y="-20440">C</text>' +
                '  <text fill="rgb(0,0,0)" stroke="none" x="8765" y="-20440">H</text>' +
                ' </g>' +
                ' <g fill="rgb(0,0,0)" stroke="none" font-family="Helvetica CE" font-size="252" font-style="normal" font-weight="400" text-decoration="none">' +
                '  <text x="8991" y="-20376">3</text>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8652,-20722 L 8655,-20722 8655,-21114 8652,-21114 8652,-20722 Z"/>' +
                '  <path fill="rgb(0,0,0)" stroke="none" d="M 8667,-20722 L 8636,-20722 8636,-21110 8652,-21117 8667,-21110 8667,-20722 Z"/>' +
                '  <rect fill="none" stroke="none" x="4195" y="-25972" width="11430" height="6625"/>' +
                ' </g>' +
                '</svg>' +
                '</p>' +
                '</body>' +
                '</html>';

            if (_.isString(htmlPreview)) {
                // import the passed HTML markup
                node.html(htmlPreview);
                // TODO: remove 'hr's in backend, so we don't need to remove it
                // here for cost reasons
                node.children('hr').hide();
                // use all top-level p elements as pages to be displayed
                pages = node.children('p[id^="pres_page"]').css('display', 'inline-block').hide();
            } else {
                node.empty();
                pages = $();
            }

            curPage = pages.length ? 1 : 0;
            pages.first().show();
            self.trigger('showpage', curPage);
        };

        this.getPage = function () {
            return curPage;
        };

        this.getPageCount = function () {
            return pages.length;
        };

        this.firstAvail = function () {
            return curPage > 1;
        };

        this.previousAvail = function () {
            return this.firstAvail();
        };

        this.nextAvail = function () {
            return this.lastAvail();
        };

        this.lastAvail = function () {
            return curPage < pages.length;
        };

        /**
         * Navigating to the first page
         */
        this.firstPage = function () {
            showPage(1);
        };

        /**
         * Navigating to the previous page
         */
        this.previousPage = function () {
            showPage(curPage - 1);
        };

        /**
         * Navigating to the next page
         */
        this.nextPage = function () {
            showPage(curPage + 1);
        };

        /**
         * Navigating to the last page
         */
        this.lastPage = function () {
            showPage(pages.length);
        };

        this.destroy = function () {
            this.events.destroy();
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class Preview

    // exports ================================================================

    return Preview;

});
