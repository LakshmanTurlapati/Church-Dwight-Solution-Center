function escHeaderController($rootScope, $scope, $window, $http, spUtil, $location, $uibModal, cabrillo, $timeout, i18n, spContextManager, snAnalytics) {
    var c = this;

    // Watch for the last name passed from the server script
    $scope.$watch("data.userLastName", function(lastName) {
        if (lastName) {
            $scope.userLastName = lastName;
        }
    });

    // Initialize search term
    c.searchTerm = '';

    // Function to submit search
    c.submitSearch = function(event) {
        event.preventDefault();
        if (c.searchTerm) {
            // Redirect to search results page with the search query
            var newUrl = $location.search({
                id: 'search',
                spa: '1',
                q: c.searchTerm // Pass the search term as query parameter
            });
            spAriaFocusManager.navigateToLink(newUrl.url());
        }
    };

    // Function to fetch search suggestions
    c.showSuggestions = function(query) {
        if (!query) return;

        c.getSearchSuggestions(query).then(function(suggestions) {
            var suggestionsList = document.getElementById('suggestions-list');
            suggestionsList.innerHTML = '';

            suggestions.forEach(function(suggestion) {
                var li = document.createElement('li');
                li.textContent = suggestion.term;
                suggestionsList.appendChild(li);
            });
        });
    };

    // Fetch suggestions from the backend
    c.getSearchSuggestions = function(query) {
        var payload = {
            params: {
                "sysparm_term": query,
                "sysparm_sp_portal_id": c.data.portalID,
                "sysparm_suggestions_limit": 5 // Limit number of suggestions
            },
            headers: {'Accept': 'application/json'}
        };

        return $http.get("/api/now/search/sp_suggestions", payload).then(function(response) {
            var result = response.data.result;
            return result.entries.map(function(item) {
                item.term = item.name;
                return item;
            });
        });
    };

    // Initialize search on page load
    $scope.$on('$locationChangeSuccess', function () {
        c.toggleSearchBarVisibility();
    });

    // Toggle search bar visibility based on page
    c.toggleSearchBarVisibility = function () {
        var currentUrlId = $location.search().id;

        // Hide search bar on knowledge home page (example)
        if (currentUrlId === 'chd_v2_knowledge_home') {
            $scope.showCustomSearchBar = false;
        } else {
            $scope.showCustomSearchBar = true;
        }
    };
}