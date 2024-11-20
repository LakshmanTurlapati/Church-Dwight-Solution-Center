function escHeaderController($rootScope, $scope, $window, $http, spUtil, $location, $uibModal, cabrillo, $timeout, i18n, spContextManager, snAnalytics) {
    var c = this;

    // Initialize search term
    c.searchTerm = '';

    // Events fired from/to $rootScope for responsive mobile view.
    c.SHOW_MOBILE_MEGA_MENU = 'showMobileMegaMenu';
    c.SHOW_MOBILE_MENU_ON_DESKTOP = 'showMobileMenuOnDesktop';
    c.TOGGLE_MOBILE_MENU_VISIBILITY = 'toggleMobileMenuVisibility';
    c.INITIAL_TIMEOUT = 500;
    $rootScope.isHeaderInMobileView = false;

     // Determine the visibility of elements based on the current page ID
    c.updateVisibility = function () {
        var currentUrlId = $location.search().id;
			console.log("Current URL ID:", currentUrlId);


        // Show "All My Incidents" and "All My Requests" only on the homepage
if (currentUrlId === null || currentUrlId === undefined || currentUrlId === 'chd_v2_homepage') {
            $scope.showIncidentsAndRequests = true;
            $scope.showHamburgerMenu = false;
            $scope.showSearchBar = false;
        }
			else if(currentUrlId === 'chd_v2_knowledge_home'){
				$scope.showIncidentsAndRequests = true;
            $scope.showHamburgerMenu = false;
            $scope.showSearchBar = false;
				
			}
			else {
            $scope.showIncidentsAndRequests = false;
            $scope.showHamburgerMenu = true;
            $scope.showSearchBar = true;
        }
    };

    // Call the function initially to handle page load and on location change
    c.updateVisibility();
    $scope.$on('$locationChangeSuccess', function () {
        c.updateVisibility();
    });
    // Handle avatar initials
    $scope.user_initials = ($scope.user.first_name.charAt(0) + $scope.user.last_name.charAt(0)).toUpperCase();
    console.log('User Initials:', $scope.user_initials);

    // Tooltip functionality
    $('body').on('click', function (e) {
        $('[data-toggle=tooltip]').each(function () {
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.tooltip').has(e.target).length === 0) {
                $(this).tooltip('hide');
            }
        });
    });

    // Mobile view handling for different menus
    $scope.showMobileMenuOnDesktop = false;
    $scope.showMobileMegaMenu = false;

    // Translate todo count label
    c.todoCountTranslation = i18n.format(c.data.todoCountLabel, String(c.data.todoCount));

    // Submit search functionality
    c.submitSearch = function (event) {
        event.preventDefault();
        if (c.searchTerm) {
            var newUrl = $location.search({
                id: 'search',
                spa: '1',
                t: c.searchType,
                q: c.searchTerm
            });
            spAriaFocusManager.navigateToLink(newUrl.url());
        }
    };

    // Show suggestions for search
    c.showSuggestions = function (query) {
        c.getSearchSuggestions(query).then(function (suggestions) {
            var suggestionsList = document.getElementById('suggestions-list');
            suggestionsList.innerHTML = '';
            suggestions.forEach(function (suggestion) {
                var li = document.createElement('li');
                li.textContent = suggestion.term;
                suggestionsList.appendChild(li);
            });
        });
    };

    // Get search suggestions
    c.getSearchSuggestions = function (query) {
        var payload = {
            params: {
                "sysparm_term": query,
                "sysparm_sp_portal_id": c.data.portalID,
                "sysparm_suggestions_limit": c.options.limit > 0 ? c.options.limit : "",
                "sysparm_search_sources": c.data.searchSourceSysIds || ""
            },
            headers: {'Accept': 'application/json'}
        };

        return $http.get("/api/now/search/sp_suggestions", payload).then(function (response) {
            var result = response.data.result;
            return result.entries.map(function (item) {
                item.term = item.name;
                return item;
            });
        });
    };

    // Function to update cart item count
    $scope.$on("$sp.service_catalog.cart.count", function ($evt, count) {
        $scope.cartItemCount = count;
    });

    // Watch for changes in mobile view
    $scope.$watch("mobileDevice", function () {
        $rootScope.isHeaderInMobileView = $scope.mobileDevice;
        $rootScope.$broadcast('isHeaderInMobileView', $scope.mobileDevice);
    });

    // Register event handlers for mobile menus
    $rootScope.$on(c.SHOW_MOBILE_MENU_ON_DESKTOP, function (event, showMobileMenuOnDesktop) {
        $scope.showMobileMenuOnDesktop = showMobileMenuOnDesktop || $scope.mobileDevice;
    });

    $rootScope.$on(c.SHOW_MOBILE_MEGA_MENU, function (event, showMobileMegaMenu) {
        $scope.showMobileMegaMenu = showMobileMegaMenu;
    });

    // Handle navigation events
    $scope.navEvent = function (event, hrefParam) {
        var JOURNEYS_HREF = "?id=jny_journeys";
        if (hrefParam === JOURNEYS_HREF) {
            var payload = {};
            payload.name = "Navigate to Journey's home";
            payload.data = {};
            payload.data["Entry point"] = "Header";
            snAnalytics.addEvent(payload);
        }
    };

    // Ensure search bar expands on focus
    $timeout(function () {
        var searchContainer = document.querySelector('.search-container');
        var searchInput = document.querySelector('.search-input');

        searchInput.addEventListener('focus', function () {
            searchContainer.classList.add('expanded');
        });

        searchInput.addEventListener('blur', function () {
            setTimeout(function () {
                searchContainer.classList.remove('expanded');
            }, 200);
        });
    }, 0);

    // Record watchers and reload logic
    c.processWatchers = function (watcher) {
        setTimeout($scope.reloadHeader, 20);
    };

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

    // Handle login modal
    $scope.openLogin = function () {
        $scope.modalInstance = $uibModal.open({
            templateUrl: 'modalLogin',
            scope: $scope
        });
    };

    // Event listener for user avatar changes
    $rootScope.$on('sp.avatar_changed', function () {
        $scope.userID = '';
        $timeout(function () {
            $scope.userID = $scope.user.sys_id;
        });
    });

    // Watch for location changes and handle query updates
    $scope.$on("$locationChangeSuccess", function (event, newUrl, oldUrl) {
        try {
            $scope.query = new URL(newUrl).searchParams.get("q");
            $scope.oldUrlId = new URL(oldUrl).searchParams.get("id");
            $scope.newUrlId = new URL(newUrl).searchParams.get("id");
            if ($scope.query && $scope.query != '' && $scope.newUrlId !== $scope.oldUrlId) {
                setSearchBoxValue($scope.query);
            }
        } catch (e) {
            // Handle errors gracefully
        }
    });

    // Set search box value
    function setSearchBoxValue(query) {
        var headerSearchBox = document.querySelector("sn-search-combobox");
        if (headerSearchBox) {
            var desktopSearchBox = headerSearchBox.shadowRoot.querySelector("sn-search-combobox-desktop");
            if (desktopSearchBox) {
                var searchInput = desktopSearchBox.shadowRoot.querySelector("input");
                if (searchInput && searchInput.value != query) {
                    searchInput.value = query;
                }
            }
        }
    }

    // Process when the search bar should be visible
    $scope.$watch('showSearchBar', function () {
        $timeout(function () {
            try {
                if ($scope.showSearchBar && $scope.query && $scope.query != '' && $scope.newUrlId !== $scope.oldUrlId) {
                    setSearchBoxValue($scope.query);
                }
            } catch (e) { }
        });
    });

    // Reload header with action (if needed)
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

    // Add defer script for personalized answer
    function addDeferScript(src, callback) {
        var s = document.createElement('script');
        s.setAttribute('src', src);
        s.setAttribute('defer', true);
        s.onload = callback;
        document.body.appendChild(s);
    }

    if (c.data.isPersonalizedAnswer) {
        addDeferScript("/scripts/app-ex-integrated-answers-components/app-ex-integrated-answers-components.min.js");
    }

    // Event listeners for modals and search visibility
    $rootScope.$on('sp_loading_indicator', function (e, value) {
        $scope.loadingIndicator = value;
        if (!value) c.toggleSearchBarVisibility();  // Ensure search bar visibility is evaluated after loading
    });
}