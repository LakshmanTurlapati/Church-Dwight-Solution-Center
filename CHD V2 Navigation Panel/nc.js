function($scope, $location, $timeout, $window, $document, $rootScope, spUtil, spAriaUtil, i18n, urlTools) {
    var c = this;

    loadPage();

    function loadPage() {
        $scope.selectedCatalog = c.data.catalogSelectorArr[c.data.selectedCatalogIndex];
        $scope.hideCategoryWidgetInXS = (c.options.hide_xs == 'true');
        if (c.data.categoryId) {
            if (!$scope.hideCategoryWidgetInXS)
                $scope.hideCategoryWidgetInXS = true;
        } else {
            if ($scope.hideCategoryWidgetInXS)
                $scope.hideCategoryWidgetInXS = false;
        }
        handleToolTip();

        $(document).on('keydown', '.select2-focusser', function(e) {
            if (e.which === 40 || e.which === 38) {
                $(this).closest(".select2-container").siblings('select:enabled').select2('open');
            }
        });
    }

    function handleToolTip() {
        $timeout(function() {
            $(".group-item").each(function(index) {
                var span = $(this).find(".category");
                if (span && span[0] && span.width() >= span[0].scrollWidth) {
                    $(this).removeAttr("title");
                    $(this).removeAttr("data-original-title");
                }
            });
        }, 100);
    }

    $scope.changeCatalog = function(selectedCatalog) {
        window.GlideWebAnalytics.trackEvent("Service Catalog", "Catalog Browse", "Catalog Filter Changed");
        $timeout(function() {
            if (selectedCatalog && selectedCatalog.hasOwnProperty("value")) {
                $location.search('catalog_id', selectedCatalog.value ? selectedCatalog.value : -1);
                $location.search('sys_id', null);
                $location.search('spa', null);
            }
        });
    };

    $scope.getCategoryAriaLabel = function(category) {
        var label = c.data.messages.category + ' ' + category.title + ' ';
        if (c.options.omit_badges != 'true' && c.data.largeDataSet != 'true') {
            label += c.data.messages.containing + ' ' + category.totalCount + ' ';
            if (category.totalCount == 1)
                label += c.data.messages.item;
            else
                label += c.data.messages.items;
        }
        return label;
    };

    $scope.handleKeyPressOnCategory = function($event, category) {
        var currentElement = $($event.currentTarget);
        var allCategories = currentElement.closest('ul.category-list').find('.group-item');
        var index = -1;
        if (allCategories.length > 0) {
            index = allCategories.index(currentElement);
        }

        switch ($event.which) {
            case 40:
                $event.stopPropagation();
                $event.preventDefault();
                if (index + 1 < allCategories.length) {
                    allCategories.get(index).setAttribute('tabindex', '-1');
                    allCategories.get(index + 1).setAttribute('tabindex', '0');
                    allCategories.get(index + 1).focus();
                }
                break;
            case 38:
                $event.stopPropagation();
                $event.preventDefault();
                if (index > 0) {
                    allCategories.get(index).setAttribute('tabindex', '-1');
                    allCategories.get(index - 1).setAttribute('tabindex', '0');
                    allCategories.get(index - 1).focus();
                }
                break;
            case 37:
                $event.stopPropagation();
                $event.preventDefault();
                if (category.showChildren) {
                    $scope.displayChildren($event, category);
                } else {
                    var parentSubcategory = currentElement.closest('ul.sub-category-list');
                    if (parentSubcategory) {
                        var closestParent = parentSubcategory.parent('li').find('.group-item');
                        if (closestParent && closestParent.length > 0) {
                            currentElement.attr('tabindex', -1);
                            closestParent.get(0).setAttribute('tabindex', 0);
                            closestParent.get(0).focus();
                        }
                    }
                }
                break;
            case 39:
                $event.stopPropagation();
                $event.preventDefault();
                if (!category.showChildren) {
                    $scope.displayChildren($event, category);
                } else if (category.subcategories && category.subcategories.length > 0) {
                    var closestChild = currentElement.next().find('.group-item');
                    if (closestChild && closestChild.length > 0)
                        currentElement.attr('tabindex', -1);
                    closestChild.get(0).setAttribute('tabindex', 0);
                    closestChild.get(0).focus();
                }
                break;
        }
    };

    spUtil.getPreference('glide.ui.accessibility', function(value) {
        if (value == "true")
            $scope.tabindex = 0;
        else
            $scope.tabindex = -1;
    });

    $scope.displayChildren = function($event, category) {
        $event.stopPropagation();
        if (!category || !category.subcategories || category.subcategories.length === 0) {
            return;
        }
        category.showChildren = !category.showChildren;
        var currentElement = $($event.currentTarget);
        currentElement.closest('.list-group-item').attr('aria-expanded', category.showChildren);
        handleToolTip();
    };

    $scope.toggleSubCategories = function(val) {
        toggleSubCategories(c.data.categoriesList, val);
    };

    function toggleSubCategories(categories, val) {
        categories.forEach(function(category) {
            category.showChildren = val;
            if (category.subcategories && category.subcategories.length > 0) {
                toggleSubCategories(category.subcategories, val);
            }
        });
    }

    $scope.categorySelected = function($event, category) {
        var s = {
            'id': c.data.page || 'sc_category',
            'sys_id': category.sys_id,
            'catalog_id': c.data.catalog_id,
            'spa': 1
        };
        c.data.categoryId = category.sys_id;
        $rootScope.$broadcast('$sp.service_catalog.category.selected', s);
        $location.search(s);
        loadPage();
        $scope.displayChildren($event, category);
    };

    var listenerForBrowseCategories = $scope.$on("$sp.service_catelog.show.categories_widget", function() {
        $scope.hideCategoryWidgetInXS = false;
    });

    $scope.hideBrowseCategory = function() {
        $scope.hideCategoryWidgetInXS = true;
        $rootScope.$broadcast("$sp.service_catelog.show.items_widget", {
            setFocusOnAllCategsLink: true
        });
    }

    $scope.$on("$destroy", function() {
        listenerForBrowseCategories();
        destroyTooltips();
    });

    function destroyTooltips() {
        var tooltips = $("body > .tooltip");
        if (tooltips.length != 0)
            tooltips.remove();
    }

    $scope.isTouchDevice = function() {
        return ('ontouchstart' in $window);
    }

    $scope.getCategoryPadding = function(categoryLevel) {
        if (categoryLevel >= 4)
            categoryLevel = 4;
        return 15 * categoryLevel + "px";
    }
}