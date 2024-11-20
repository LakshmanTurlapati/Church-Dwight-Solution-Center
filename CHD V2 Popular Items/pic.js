function ($scope, spUtil, spScUtil, spAriaUtil, i18n, $rootScope, $location, $timeout, $window) {
	loadPage();
$scope.iconMap = {
    'issue': 'fa-exclamation-circle',            // Report an Issue/Incident
    'mdm': 'fa-mobile-alt',                      // Create MDM Incident
    'something': 'fa-question-circle',          
    'azure': 'fa-tasks',
    'gep': 'fa-key',
    'sso': 'fa-lock',
    'application': 'fa-plus-circle',
    'price': 'fa-file-alt',
    'profitability': 'fa-chart-line',
    'ace': 'fa-file',
    'igdw': 'fa-database',
    'gdw': 'fa-database',
    'business': 'fa-registered',
    'architecture': 'fa-cogs',
    'retire': 'fa-times-circle',
    'plm': 'fa-clipboard-list',
    'components': 'fa-box',
    'approvals': 'fa-paper-plane',
    'fedex': 'fa-shipping-fast',
    'salesforce': 'fa-cloud',
    'epm': 'fa-database',
    'registration': 'fa-pencil-alt',
    'connect': 'fa-plug',
    'domain': 'fa-globe',
    'blue': 'fa-robot',
    'sample': 'fa-sample',
    'salsify': 'fa-balance-scale',
    'solution': 'fa-users',
    'announcement': 'fa-bullhorn',
    'cloud': 'fa-cloud-upload-alt',
    'enhancement': 'fa-tools',
    'compliance': 'fa-check-circle',
    'itil': 'fa-shield-alt',
    'system': 'fa-desktop',
    'users': 'fa-user-plus',
    'equipment': 'fa-laptop',
    'byod': 'fa-mobile-alt',
    'device': 'fa-mobile',
    'new': 'fa-plus-square',
    'worker': 'fa-user-clock',
    'amex': 'fa-credit-card',
    'personal': 'fa-user-tag',
    'hire': 'fa-user-plus',
    'departure': 'fa-user-minus',
    'joule': 'fa-clock',
    'server': 'fa-server',
    'database': 'fa-database',
    'adm': 'fa-user',
    'admin': 'fa-user-shield',
    'asset': 'fa-database',
    'cmdb': 'fa-database',
    'updates': 'fa-sync-alt',
    'manufacturing': 'fa-industry',
    'drive': 'fa-folder-open',
    'project': 'fa-project-diagram',
    'profiling': 'fa-id-card',
    'analysts': 'fa-chart-bar',
    'survey': 'fa-poll',
    'competition': 'fa-search',
    'sku': 'fa-tags',
    'material': 'fa-box-open',
    'status': 'fa-exchange-alt',
    'band': 'fa-tags',
    'spd': 'fa-cogs',
    'finished': 'fa-sync-alt',
    'planned': 'fa-clock',
    'purchasing': 'fa-exchange-alt',
    'global': 'fa-globe',
    'pdpm': 'fa-file-alt',
    'hardening': 'fa-shield-alt',
    'secure': 'fa-book',
    'dns': 'fa-globe',
    'san': 'fa-hdd',
    'nielsen': 'fa-chart-bar',
    'access': 'fa-key',
    'marketing': 'fa-bullhorn',
    'sales': 'fa-shopping-cart',
    'tpm': 'fa-lightbulb',
    'thor': 'fa-user-secret',
    'pc': 'fa-user-shield',
    'usb': 'fa-usb',
    'testing': 'fa-shield-alt',
    'security': 'fa-lock',
    'contact': 'fa-address-book',
    'software': 'fa-download',
    'docusign': 'fa-file-signature',
    'cer': 'fa-file',
    'plant': 'fa-industry',
    'e2open': 'fa-paper-plane',
    'uploads': 'fa-upload',
    'web': 'fa-file-code',
    'update': 'fa-edit'
             // Update to a web page
};
	if ($scope.options.scroll_to_category_page)
		scrollCategoryPage();
	
	function scrollCategoryPage() {
			$timeout(function() {
					var animationDuration = 300;
					if ($scope.options.isServiceWorkspace && $window.innerWidth < 992) { //Handling for smaller devices in workspace view.
							var element = document.getElementById("sc_category_page");
							if (element)
									element.scrollIntoView();
					} else if ($window.scrollY > 0) { // Handling for smaller devices in portal view.
							$('html').animate({
									scrollTop: 0
							}, animationDuration);
					} else {
							spUtil.scrollTo('#sc_category_page', animationDuration);
					}
			}, 0);
	}
	
	function loadPage() {
		$scope.hideItemWidget = !$scope.data.category_id;
		if ($scope.data.category) {
			if (!$scope.data.categories)
				$scope.data.categories = [];
			
			$scope.data.categories.forEach(function(category, index, categories) {
				categories[index].url = category.url + '&catalog_id=' + $scope.data.catalog_id;
			});
			
			if ($scope.data.sc_catalog)
				$scope.data.categories.unshift({label: $scope.data.sc_catalog, url: '?id=' + $scope.data.sc_category_page + '&catalog_id=' + $scope.data.catalog_id});
			
			if ($scope.data.show_popular_item) {
				if ($scope.data.all_catalog_msg)
					$scope.data.categories.unshift({label: $scope.data.all_catalog_msg, url: '?id=' + $scope.data.sc_category_page + '&catalog_id=-1'});
				else
					$scope.data.categories.push({label: $scope.data.all_cat_msg, url: '#'});
			} else {
				if ($scope.data.all_catalog_msg)
					$scope.data.categories.unshift({label: $scope.data.all_catalog_msg, url: '?id=' + $scope.data.sc_category_page + '&catalog_id=-1'});

				$scope.data.categories.push({label: $scope.data.category.title, url: '#'});
			}
			$timeout(function() {
				$rootScope.$broadcast('sp.update.breadcrumbs', $scope.data.categories);
			});
			spUtil.setSearchPage('sc');
			spAriaUtil.sendLiveMessage($scope.data.category.title + ' ' + $scope.data.categorySelected);
			i18n.getMessage("Category page {0}", function (template) {
				$scope.data.categoryPageAriaLabel = i18n.format(template, $scope.data.category.title);
			});
		}
	}

	function handleTooltip() {
		if(!$scope.isTouchDevice()) {
			$timeout(function() {
				$(".item-card").each(function(index) {
					var itemNameElement = $(this).find(".catalog-item-name");
					if(itemNameElement && itemNameElement[0] && itemNameElement.width() < itemNameElement[0].scrollWidth) {
						$(this).attr('data-toggle','tooltip');
					}
				});
			});
		}
	}
	
	$scope.showCategories =  function() {
		$scope.hideItemWidget = true;
		$rootScope.$broadcast("$sp.service_catelog.show.categories_widget");
	}

	$scope.switchTab = function($event) {
		if ($event.which == 37 || $event.which == 39) {
			$event.stopPropagation();
			var layout = $scope.view === 'card' ? 'grid' : 'card';
			$scope.changeView(layout);
			$('#tab-' + layout).focus();
		}
	}
	
	var listenerForCatItems = $scope.$on("$sp.service_catelog.show.items_widget", function(event, payload) {
		if (payload.setFocusOnAllCategsLink) {
			$timeout(function() {
				var allCategsLink = angular.element('#all-categories-link');
				allCategsLink.focus();
			}, 100);
		}
		$scope.hideItemWidget = false;
	});
	/*=============== Begin link handling ===============*/

	$scope.changeView = function (view) {
		spScUtil.setPreference('catalog-item-list-view', view)
		$scope.view = view;
	}

	spScUtil.getPreference('catalog-item-list-view', function(value) {
		$scope.view = value || 'card';
	});

	$scope.isTouchDevice = function(){
		return ('ontouchstart' in $window);
	}

	$scope.loadMore = function (){
		$scope.data.new_limit = $scope.data.limit + ($scope.options.limit_item || 9);
		var itemDiffCounter = $scope.data.limit;
		$scope.stopLoader =  false;
		$scope.server.update().then(function () {
			var old_limit = $scope.data.limit - ($scope.options.limit_item || 9);
			if ($scope.data.limit > $scope.data.items.length) {
				itemDiffCounter = $scope.data.items.length - itemDiffCounter;
			} else {
				itemDiffCounter = $scope.data.limit - itemDiffCounter;
			}
			var fetchMessage;
			i18n.getMessages(["Fetched", "additional items"], function(msgs) {
				fetchMessage = msgs["Fetched"] + " " + itemDiffCounter + " " + msgs["additional items"];
				spAriaUtil.sendLiveMessage(fetchMessage);
			});
			$scope.data.items[old_limit].highlight = true;
			$scope.stopLoader =  true;
		});
	}

	$scope.onClick = function($event, item) {
		window.GlideWebAnalytics.trackEvent("Service Catalog", "Catalog Browse", "Item Clicked");
		$event.preventDefault();
		var lp = getLinkParts(item);
		if (typeof lp == "string") {
			$window.open(lp, '_blank');
			return;
		}
		var evt = {item: item, search: lp};
		// This will let a wrapper widget intercept and redirect somewhere else
		$scope.$emit($scope.options.click_event_name, evt);
	};

	function getLinkParts(item) {
		if (item.sys_class_name == 'sc_cat_item_content' && item.content_type == 'external')
			return item.url;

		return {
			id: item.page,
			sys_id: item.content_type == 'kb' ? item.kb_article : item.sys_id,
			sysparm_category: $scope.data.category_id,
			referrer:  (item.content_type != 'kb' && $scope.data.show_popular_item) ? 'popular_items' : null
		};
	}

	$scope.getItemHREF = function(item) {
		var lp = getLinkParts(item);
		if (typeof lp == "string")
			return lp;
		return "?id=" + lp.id + "&sys_id=" + lp.sys_id + "&sysparm_category=" + $scope.data.category_id + ($scope.data.catalog_id ? "&catalog_id=" + $scope.data.catalog_id : "") + (lp.referrer ? "&referrer=" + lp.referrer : "");
	}

	var unregisterCategorySelected = $rootScope.$on('$sp.service_catalog.category.selected', function(evt, arg) {
		$scope.data.category_id = arg.sys_id;
		$scope.data.catalog_id = arg.catalog_id;
		$scope.data.items = [];
		$scope.showTopLoader = true;
		$scope.data.startWindow = 0;
				
		scrollCategoryPage();
		
		$scope.server.update().then(function(result) {
				if (arg.spa == 1)
					$window.document.title = $scope.data.category.title + (!$scope.portal.hide_portal_name ? ' - ' + $scope.portal.title : '');
				loadPage();
				$scope.showTopLoader = false;
		});
	});

	var unregister = $rootScope.$on($scope.options.click_event_name, function($event, o) {
		if ("url" in o)
			$location.href = o.url;
		else
			$location.search(o.search);
	});

	if ($scope.options.isServiceWorkspace) {
			$window.postMessage({
				msg:'CATALOG_ITEM_SET_TITLE',
				title: i18n.getMessage('Catalogs')
			}, $location.origin);
	}

	var mql;

	if ($window.matchMedia) {
		mql = $window.matchMedia('screen and (max-width: 768px)');
    mql.addListener(handleMatchMedia);
    handleMatchMedia(mql);
	}

	function handleMatchMedia(mql) {
			if (!mql.matches) {
        spScUtil.getPreference('catalog-item-list-view', function(value) {
					$scope.view = value || 'card';
					$scope.isMobile = false;
				});
			}
			else {
				$timeout(function() {
					$scope.view = 'card';
					$scope.isMobile = true;
				})
			}
	}
	$scope.$on("$destroy", function() {
		unregister();
		unregisterCategorySelected();
		listenerForCatItems();
		if (mql)
			mql.removeListener(handleMatchMedia);
	});

	$scope.startItemList = function() {
		$scope.stopLoader = true;
		handleTooltip();
	}

	$scope.isTouchDevice = function() {
		return ('ontouchstart' in $window);
	}
$scope.getItemIcon = function(item) {
    var name = item.name.toLowerCase();
    for (var key in $scope.iconMap) {
        if (name.includes(key)) {
            return $scope.iconMap[key];
        }
    }
    return 'fa-question-circle';
};


	/*=============== End link handling ===============*/
}