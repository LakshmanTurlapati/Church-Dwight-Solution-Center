(function() {
    var catalog_id = $sp.getParameter("catalog_id") ? $sp.getParameter("catalog_id") + "" : "-1";
    var catalogSelectorArr = [{
        value: "-1",
        displayValue: gs.getMessage("All")
    }];
    data.selectedCatalogIndex = catalog_id == -1 ? 0 : -1;
    data.visibleCategories = 0;
    var catalogIDs = $sp.getCatalogs().value + "";
    var catalogs = catalogIDs.split(",");
    var isCatalogAccessibleViaPortal = catalog_id == -1 ? true : false;

    catalogs.forEach(function(catalogSysId) {
        if (catalog_id == catalogSysId) {
            isCatalogAccessibleViaPortal = true;
        }
    });

    var counter = 1;
    catalogs.forEach(function(catalogSysId) {
        var catalog = new sn_sc.Catalog(catalogSysId);
        var catalogObj = {
            value: catalogSysId,
            displayValue: catalog.getTitle()
        };
        if (catalog.canView()) {
            if (catalog_id === catalogSysId) {
                data.selectedCatalogIndex = counter;
            }
            catalogSelectorArr.push(catalogObj);
            counter++;
        }
    });
    data.catalogSelectorArr = catalogSelectorArr;
    data.catalog_id = catalog_id ? catalog_id : "-1";
    data.showMoreMsg = gs.getMessage("Show More {0}", options.title);
    data.pleaseWait = gs.getMessage("Please wait... fetching {0}", options.title);

    var categoryId = !$sp.getParameter('sys_id') ? "" : $sp.getParameter('sys_id') + "";
    data.categoryId = categoryId;

    var catalogIDs = (data.catalog_id && data.catalog_id !== "-1") ? data.catalog_id : $sp.getCatalogs().value + "";
    var viewType = '';
    var checkCanView = false;
    var showBadge = false;
    var nestedLayout = (options.category_layout !== "Flat");
    var dynamicCategory = false;

    var catalogArr = catalogIDs.split(",");
    var catalogs = [];
    catalogArr.forEach(function(catalogSysId) {
        var catalog = new sn_sc.Catalog(catalogSysId);
        if (catalog.canView()) {
            catalogs.push(catalogSysId);
        }
    });

    data.categoryId = categoryId;
    var msg = data.messages = {};
    msg.catalogTitle = options.catalog_title ? gs.getMessage(options.catalog_title) : gs.getMessage('Catalogs');
    msg.category = gs.getMessage("category");
    msg.selected = gs.getMessage("selected");
    msg.containing = gs.getMessage("containing");
    msg.item = gs.getMessage("item");
    msg.items = gs.getMessage("items");
    msg.expand = gs.getMessage("Expand");
    msg.collapse = gs.getMessage("Collapse");

    data.largeDataSet = gs.getProperty("glide.sc.largeSet.optimization.enable", "false");
    if (data.largeDataSet == 'true')
        nestedLayout = false;

    if (options.page) {
        var page = new GlideRecord('sp_page');
        if (page.get(options.page))
            data.page = page.id + '';
    }

    checkCanView = String(options.check_can_view) == 'true';
    showBadge = String(options.omit_badges) == 'false';

    if (!isCatalogAccessibleViaPortal) {
        return;
    }

    data.categoriesList = [];
    var categoriesInPage = options.number_of_categories_to_load || 10;
    data.limit = categoriesInPage;

    if (input && input.new_limit) {
        data.limit = input.new_limit;
    }

    if (input && input.categoriesList)
        data.categoriesList = input.categoriesList.slice();

    if (input && input.startWindow) {
        data.endWindow = input.endWindow;
    } else {
        data.startWindow = 0;
        data.endWindow = 0;
    }

    while (data.categoriesList.length < data.limit + 1) {
        data.startWindow = data.endWindow;
        data.endWindow = data.endWindow + categoriesInPage;
        var catGr = queryCategory(catalogs, nestedLayout, dynamicCategory, data.startWindow, data.endWindow);
        if (!catGr.hasNext())
            break;
        fetchCategories(catGr, data.categoriesList);
    }

    for (var i = 0; i < data.limit; i++) {
        if (data.categoriesList[i].totalCount > 0) {
            data.visibleCategories++;
        }
    }

    data.visibleCategoriesList = data.categoriesList.filter(function(category) {
        return category.totalCount > 0;
    });

    if (data.visibleCategoriesList.length > 0) {
        data.visibleCategoriesList[0].isFirstCategory = true;
    }

    if (data.visibleCategoriesList.length > data.limit)
        data.showMore = false; // Disable the Show More button
    else
        data.showMore = false;

    data.more_msg = gs.getMessage("Showing {0} categories", data.visibleCategories + "" || categoriesInPage);

    function fetchCategories(categoriesGr, categories) {
        while (categoriesGr.next()) {
            var categoryJS = new sn_sc.CatCategory(categoriesGr.getUniqueValue() + '');
            if (!categoryJS.canView()) continue;

            var categoryDetails = getCategoryDetails(categoryJS, 0);
            categoryDetails.sys_id = categoriesGr.getUniqueValue();
            categories.push(categoryDetails);
        }
    }

    function queryCategory(catalogs, nestedLayout, dynamicCategory, startWindow, endWindow) {
        var categoriesGr = new GlideRecord('sc_category');
        categoriesGr.addQuery("sc_catalog", catalogs);
        if (!dynamicCategory)
            categoriesGr.addQuery("sys_class_name", "sc_category");
        categoriesGr.addActiveQuery();
        categoriesGr.orderBy('order');
        categoriesGr.orderBy('title');
        categoriesGr.chooseWindow(startWindow, endWindow);
        categoriesGr.query();
        return categoriesGr;
    }

    function getItemCount(categoryJS) {
        if (showBadge)
            return checkCanView ? categoryJS.getViewableItemsCount(true) : categoryJS.getItemsCount(true);
        else
            return categoryJS.hasVisibleItem(true, checkCanView) ? 1 : 0;
    }

    function getCategoryDetails(categoryJS, level) {
        var categoryDetails = {};
        var showChildren = false;
        if (!categoryJS) {
            return categoryDetails;
        }
        categoryDetails.title = categoryJS.getTitle();
        categoryDetails.level = level;
        categoryDetails.description = categoryJS.getDescription();
        categoryDetails.full_description = categoryJS.getFullDescription();
        categoryDetails.icon = categoryJS.getIconSRC();
        categoryDetails.header_icon = categoryJS.getHeaderIconSRC();
        categoryDetails.homepage_image = categoryJS.getHomepageImageSRC();
        categoryDetails.sys_id = categoryJS.getID();
        categoryDetails.showChildren = (categoryDetails.sys_id === categoryId);
        categoryDetails.catalog = {
            "sys_id": categoryJS.getCatalog(),
            "title": new sn_sc.Catalog(categoryJS.getCatalog()).getTitle()
        }
        categoryDetails.count = categoryDetails.totalCount = ((data.largeDataSet != 'true') ? getItemCount(categoryJS) : 1);
        if (catalog_id == -1 && catalogSelectorArr.length > 2)
            categoryDetails.catalog_tooltip = gs.getMessage("[{0}]", categoryDetails.catalog.title);
        else
            categoryDetails.catalog_tooltip = '';

        var subCategoryCounts = 0;
        if (nestedLayout) {
            var subcategories = categoryJS.getViewableSubCategories();
            if (subcategories.length == 0) {
                categoryDetails.subcategories = [];
            } else {
                categoryDetails.subcategories = [];
                subcategories.forEach(function(subCategory) {
                    var subCategoryJS = new sn_sc.CatCategory(subCategory.sys_id + '');
                    var category = getCategoryDetails(subCategoryJS, level + 1);
                    categoryDetails.totalCount = categoryDetails.totalCount + category.totalCount;
                    categoryDetails.subcategories.push(category);
                    categoryDetails.showChildren = categoryDetails.showChildren || category.showChildren;
                });
            }
        } else {
            categoryDetails.totalCount = categoryDetails.count;
        }
        return categoryDetails;
    }
})();