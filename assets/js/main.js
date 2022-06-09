$(function () {

    "use strict";

    //===== Sticky
    $(window).on('scroll', function (event) {
        var scroll = $(window).scrollTop();
        if (scroll < 110) {
            $(".header-nav").removeClass("sticky");
        } else {
            $(".header-nav").addClass("sticky");
        }
    });

    //===== Mobile Menu 
    $(".navbar-toggler").on('click', function () {
        $(this).toggleClass('active');
    });

    $(".navbar-nav a").on('click', function () {
        $(".navbar-toggler").removeClass('active');
    });
    var subMenu = $(".sub-menu-bar .navbar-nav .sub-menu");

    if (subMenu.length) {
        subMenu.parent('li').children('a').append(function () {
            return '<button class="sub-nav-toggler"> <i class="fa fa-angle-down"></i> </button>';
        });

        var subMenuToggler = $(".sub-menu-bar .navbar-nav .sub-nav-toggler");

        subMenuToggler.on('click', function () {
            $(this).parent().parent().children(".sub-menu").slideToggle();
            return false
        });

    }

    //===== nice select
    $('select').niceSelect();


    //===== Back to top
    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 100) {
            $('#scroll_up').fadeIn();
        } else {
            $('#scroll_up').fadeOut();
        }
    });
    $('#scroll_up').on('click', function () {
        $("html, body").animate({
            scrollTop: 0
        }, 600);
        return false;
    });

});