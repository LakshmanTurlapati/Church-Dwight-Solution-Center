function($scope, $rootScope, spUtil) {
    var c = this;
    c.expanded = !spUtil.isMobile();

    // Function to expand the breadcrumbs on ellipsis click
    c.expand = function() {
        c.expanded = true;
    };

    // Listen to breadcrumb updates
    var deregister = $rootScope.$on("sp.update.breadcrumbs", function(e, list) {
        // Reset breadcrumbs logic
        if ($scope.page.id === 'chd_v2_service_catalog') {
            // Remove any duplicate "All Catalogs" from the list
            var uniqueBreadcrumbs = list.filter(function(item, index, self) {
                return index === self.findIndex((t) => (
                    t.label === item.label
                ));
            });

            // Ensure "All Catalogs" is added only once
            if (uniqueBreadcrumbs.length > 2) {
                c.breadcrumbs = [uniqueBreadcrumbs[0], uniqueBreadcrumbs[1], uniqueBreadcrumbs[uniqueBreadcrumbs.length - 1]];
            } else {
                c.breadcrumbs = uniqueBreadcrumbs;
            }
        } else {
            // For other pages, handle as usual
            c.breadcrumbs = list;
        }
    });

    // Clean up listener on scope destroy
    $scope.$on('$destroy', function() {
        deregister();
    });
}