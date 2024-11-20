function escHeaderController($rootScope, $scope, $window, spUtil, $location, $uibModal, cabrillo, $timeout, i18n, spContextManager, snAnalytics) {
    var c = this;

    // Events fired from/to $rootScope for responsive mobile view.
    c.SHOW_MOBILE_MEGA_MENU = 'showMobileMegaMenu';
    c.SHOW_MOBILE_MENU_ON_DESKTOP = 'showMobileMenuOnDesktop';
    c.TOGGLE_MOBILE_MENU_VISIBILITY = 'toggleMobileMenuVisibility';
    c.INITIAL_TIMEOUT = 500;
    $rootScope.isHeaderInMobileView = false;
	
	$('body').on('click', function (e) {
		$('[data-toggle=tooltip]').each(function () {
			if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.tooltip').has(e.target).length === 0) {
				$(this).tooltip('hide');
			}
		});
	});
	
    c.evaluateSearchWidgetVisibility = function () {
        if (c.data.hideSearchOnHomepage) {
            var currentUrl = $location.url();
            var params = $location.search();

            // hide on home page
            if ((params && params.id && params.id === c.data.dashboardSuffix) || (params && !params.id && currentUrl.includes(c.data.portalSuffix))) {
              $scope.showSearchBar = false;
              $scope.showViewAsHeader = false;
            } else
              $scope.showSearchBar = true;
            // show ViewAs header on viewAsPages  
            if ((params && params.id && currentUrl.includes("ec_view_as")))
              $scope.showViewAsHeader = true;
        }
    };

    function addDeferScript(src,callback) {
      var s = document.createElement('script');
      s.setAttribute('src',src);
      s.setAttribute('defer', true);
      s.onload=callback;
      document.body.appendChild(s);
    }

    if(c.data.isPersonalizedAnswer) {
      addDeferScript("/scripts/app-ex-integrated-answers-components/app-ex-integrated-answers-components.min.js");
    }

    $scope.$on('sp_loading_indicator', function(e, value) {
        $scope.loadingIndicator = value;
        // Evaluate search bar visibility once the page has completed loading.
        if(!value)
            c.evaluateSearchWidgetVisibility();
    });

    /*
    Finds the header seismic component sn-search-combobox
    as it has a shadow dom, hence direct access to the input button is not available
    So accessing the nested desktop search box component, and then setting the value
    of the input control based on query passed
    */
    function setSearchBoxValue(query) {
      var headerSearchBox = document.querySelector("sn-search-combobox");
      if(headerSearchBox) {
        var desktopSearchBox = headerSearchBox.shadowRoot.querySelector("sn-search-combobox-desktop");
        if(desktopSearchBox) {
          if(desktopSearchBox.shadowRoot.querySelector("input").value != query)
            desktopSearchBox.shadowRoot.querySelector("input").value = query;
          }
        }
    }

    /*
    Checks if showSearchBar is visible and sets the correct value from query
    $timeout is only used so that current digest cycle completes, there is no hardcoded delay added
    */
    $scope.$watch('showSearchBar', function() {
      $timeout(function() {
          try {
        if($scope.showSearchBar && $scope.query && $scope.query!='' && $scope.newUrlId !== $scope.oldUrlId){
          setSearchBoxValue($scope.query);
        }
      } catch (e) {}
      });
    })

    $scope.showSearchBar = true;
    $scope.userID = $scope.user.sys_id;
    $scope.todosPopupId = c.data.isMobile ? '#popup_todos_mobile' : '';
    $scope.casesPopupId = c.data.isMobile ? '#popup_cases_mobile' : '';
    $scope.popupType = c.data.isMobile ? 'collapse' : 'dropdown';
    $scope.expanded = false;
    $scope.isMobileViewOnDesktopExpanded = false;
    $scope.loadingIndicator = $rootScope.loadingIndicator;
    $scope.cartItemCount = 0;

    /* Below 2 scope variables (showMobileMenuOnDesktop, showMobileMegaMenu) have counterparts in EC Navigation widget also.
     So whenever we set these variables, make sure to emit an event on rootScope to update them in the former widget as well. */

    // Determines whether to show mobile view on desktop due to oveflow of items in sub navigation bar of header.
    $scope.showMobileMenuOnDesktop = false;
    // Used to hide global navigation tools on mobile while showing mega menu topics in right panel.
    $scope.showMobileMegaMenu = false;

    c.todoCountTranslation = i18n.format(c.data.todoCountLabel, String(c.data.todoCount));
    c.toursTranslation = "${Tours}";

    c.MOBILE_DEVICE_SCREEN_WIDTH = 767;
    $scope.mobileDevice = $scope.mobileDevice || c.data.isMobile || ($window.innerWidth <= c.MOBILE_DEVICE_SCREEN_WIDTH);

    if (cabrillo.isNative())
        $scope.isViewNative = true;

    $scope.navEvent = function(event, hrefParam) {
      var JOURNEYS_HREF = "?id=jny_journeys";
      if (hrefParam === JOURNEYS_HREF) {
        var payload = {};
        payload.name = "Navigate to Journey's home";
        payload.data = {};
        payload.data["Entry point"] = "Header";
        snAnalytics.addEvent(payload);
      }
    };

    // initially for first load, if the calculated width is in mobile view then update
    // isHeaderInMobileView so that Employee Center Navigation widget also goes into mobile mode
    $scope.$watch("mobileDevice", function() {
      $rootScope.isHeaderInMobileView = $scope.mobileDevice;
      $rootScope.$broadcast('isHeaderInMobileView', $scope.mobileDevice);
    }); 

    $scope.$watch('isMobileViewOnDesktopExpanded', function (oldVal, newVal) {
      if (oldVal && !newVal) {
         $timeout(c.registerClickEventHanlderOnCart, c.INITIAL_TIMEOUT);
      }
    });

    c.registerClickEventHanlderOnCart = function  () {
       $('a#cart-dropdown').on('click', function (event) {
          if ($window.innerWidth > c.MOBILE_DEVICE_SCREEN_WIDTH && $scope.isMobileViewOnDesktopExpanded) {
             $location.search({id: 'sc_cart'});
             $scope.toggleMobileMenuVisibility();
          }
       });
    }

    $scope.$on("$sp.service_catalog.cart.count", function ($evt, count) {
        $scope.cartItemCount = count;
    });

    $scope.$on("$locationChangeSuccess", function (event, data) {
        if (c.data.isMobile) {
            if ($('div#popup_todos_mobile').is(":visible"))
                $('li > a#todos_popup').click();
            else if ($('div#popup_cases_mobile').is(":visible"))
                $('li > a#cases_popup').click();
        } else {
            $('li.open > a#cases_popup').click();
            $('li.open > a#todos_popup').click();
        }

        // when location changes and have a query parameter in url, refresh the search bar so that changes will reflect
        //DEF0353060 : regression due to reload of typeahead widget, now setting search box value
        try {
          scope.query = new URL(newUrl).searchParams.get("q");
          $scope.oldUrlId = new URL(oldUrl).searchParams.get("id");
          $scope.newUrlId = new URL(newUrl).searchParams.get("id");
          if($scope.query && $scope.query!='' && $scope.newUrlId !== $scope.oldUrlId){
            setSearchBoxValue($scope.query);
          }
        } catch (e) {}
    });

    c.processWatchers = function (watcher) {
        setTimeout($scope.reloadHeader, 20);
    };

    /* Record Watchers */
    if (c.data.recordWatchers && c.data.recordWatchers.length > 0) {
        angular.forEach(c.data.recordWatchers, function (watcher) {
            spUtil.recordWatch($scope, watcher.table, watcher.filter, c.processWatchers);
        });
    }

    $scope.reloadHeader = function (actionName) {
        c.data.action = actionName || c.data.ACTION_TODO_COUNT;
        if (c.data.action == c.data.ACTION_TODO_COUNT)
            c.server.get({
                action: c.data.action
            }).then(function (resp) {
                c.data.todoCount = resp.data.todoCount;
                c.todoCountTranslation = i18n.format(c.data.todoCountLabel, String(c.data.todoCount));
            });
        else
            c.server.update();
    };

    $scope.openLogin = function () {
        $scope.modalInstance = $uibModal.open({
            templateUrl: 'modalLogin',
            scope: $scope
        });
    };

    $rootScope.$on("update.searchpage", function (e, searchPage) {
        $scope.searchPage = searchPage;
    });

    $rootScope.$on('sp.avatar_changed', function () {
        $scope.userID = '';
        $timeout(function () {
            $scope.userID = $scope.user.sys_id;
        });
    });

    $rootScope.$on(c.SHOW_MOBILE_MENU_ON_DESKTOP, function (event, showMobileMenuOnDesktop) {
      if (!(showMobileMenuOnDesktop || $scope.mobileDevice) && $scope.showMobileMenuOnDesktop) {
        $scope.isMobileViewOnDesktopExpanded = false;
      }
      $scope.showMobileMenuOnDesktop = showMobileMenuOnDesktop || $scope.mobileDevice;
    });

    $rootScope.$on(c.SHOW_MOBILE_MEGA_MENU, function (event, showMobileMegaMenu) {
       $scope.showMobileMegaMenu = showMobileMegaMenu;
    });

    $timeout(function() {
      $scope.calulatedNavbarWidth();
      resizeObserverForTopNav();
    },c.INITIAL_TIMEOUT);

    function resizeObserverForTopNav() {
      var headerSearch = document.querySelector(".header-search");
      var navbarBrand = document.querySelector(".navbar-brand-logo > img");
      var navbarRight = document.querySelector(".navbar-right > div"); 
      //fix for firefox/chrome on cmd + text zoom increase
      if(window.ResizeObserver) {
        var resizeObserver = new ResizeObserver(function(entries) {
          if(entries) {
            $scope.calulatedNavbarWidth();
          }
        });

        if(headerSearch)
          resizeObserver.observe(headerSearch);

        if(navbarBrand)
          resizeObserver.observe(navbarBrand);

        if(navbarRight)
          resizeObserver.observe(navbarRight);
      }
    }

    $scope.toggleMobileMenuVisibility = function (event) {
      if (event) {
         event.stopPropagation();
      }
      $scope.isMobileViewOnDesktopExpanded = !$scope.isMobileViewOnDesktopExpanded;
      $scope.expanded = false;
      $scope.showMobileMegaMenu = false;
      $rootScope.$emit(c.SHOW_MOBILE_MEGA_MENU, false);
    };

    $rootScope.$on(c.TOGGLE_MOBILE_MENU_VISIBILITY, function() {
       $scope.toggleMobileMenuVisibility();
    });

    $scope.handleMobileViewClick = function (event) {
      // only stop propagation for navigation menu items
      if ($(event.target).hasClass('mobile-navigation-menu-item') || $(event.target).parents('.mobile-navigation-menu-item').length || $(event.target).hasClass('back-container'))
        event.stopPropagation();
      else if ($(event.target).text().trim() != c.toursTranslation) {
        // Stop propagation for menu items eg. My Requests etc
        if (!($(event.target).parents('.main-header-item').length))
          event.stopPropagation();
      }
    };

    $scope.isHomepage = function () {
        if (!$scope.page.id)
            return true;

        if ($scope.page.id == $scope.portal.homepage_dv)
            return true;

        return false;
    };

    c.evaluateSearchWidgetVisibility();

    //remove nested ul to fix screen reader issue
    $timeout(function () {
        var cartToursWrapper = $('.navbar-header .v' + scope.data.top.menu.sys_id);

        if (!cartToursWrapper.length)
            return;

        var menu = cartToursWrapper.parent().parent();
        var menuItems = cartToursWrapper.children();
        menu.append(menuItems);
        cartToursWrapper.parent().remove();
    }, 1000);
	
	$scope.$on('sn_lp.giveFeedbackModalOpen', function() {
		$scope.toggleMobileMenuVisibility();
	});
}