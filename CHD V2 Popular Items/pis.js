(function () {
    if (input && input.category_id)
        data.category_id = input.category_id;
    else
        data.category_id = $sp.getParameter("sys_id");

    data.error = '';
    data.catalog_id = $sp.getParameter("catalog_id") ? $sp.getParameter("catalog_id") + "" : "-1";
    var catalogsInPortal = ($sp.getCatalogs().value + "").split(",");
    var isCatalogAccessibleViaPortal = data.catalog_id == -1 ? true : false;

    catalogsInPortal.forEach(function (catalogSysId) {
        if (data.catalog_id == catalogSysId) {
            isCatalogAccessibleViaPortal = true;
        }
    });

    data.categorySelected = gs.getMessage('category selected');
    if (!isCatalogAccessibleViaPortal) {
        data.error = gs.getMessage("You do not have permission to see this catalog");
        return;
    }

    var catalogDisplayValue;
    if (data.catalog_id && data.catalog_id !== "-1") {
        var catalogObj = new sn_sc.Catalog(data.catalog_id);
        if (catalogObj) {
            if (!catalogObj.canView()) {
                data.error = gs.getMessage("You do not have permission to see this catalog");
                return;
            }
            catalogDisplayValue = catalogObj.getTitle();
        }
    }

    if (options && options.sys_id)
        data.category_id = options.sys_id;
    
    data.showPrices = $sp.showCatalogPrices();
    data.sc_catalog_page = $sp.getDisplayValue("sc_catalog_page") || "sc_home";
    data.sc_category_page = $sp.getDisplayValue("sc_category_page") || "sc_category";
    catalogDisplayValue = catalogDisplayValue ? catalogDisplayValue : $sp.getCatalogs().displayValue + "";
    var catalogIDs = (data.catalog_id && data.catalog_id !== "-1") ? data.catalog_id : $sp.getCatalogs().value + "";
    var catalogArr = catalogDisplayValue.split(",");
    var catalogIDArr = catalogIDs.split(",");
    data.sc_catalog = catalogArr.length > 1 ? "" : catalogArr[0];

    data.show_more = false;
    if (!data.category_id) {
        data.items = getPopularItems();
        data.show_popular_item = true;
        data.all_catalog_msg = (($sp.getCatalogs().value + "").split(",")).length > 1 ? gs.getMessage("All Catalogs") : "";
        data.all_cat_msg = gs.getMessage("All Categories");
        data.category = {
            title: gs.getMessage("Popular Items"),
            description: ''
        };
        return;
    }

    data.show_popular_item = false;
    // Does the user have permission to see this category?
    var categoryId = '' + data.category_id;
    var categoryJS = new sn_sc.CatCategory(categoryId);
    if (!categoryJS.canView()) {
        data.error = gs.getMessage("You do not have permission to see this category");
        return;
    }
    data.category = {
        title: categoryJS.getTitle(),
        description: categoryJS.getDescription()
    };

    var catalog = $sp.getCatalogs().value;

    data.items = [];
    var itemsInPage = 8;  // Default to showing 8 items
    data.limit = itemsInPage;

    if (input && input.new_limit)
        data.limit = input.new_limit;
    
    if (input && input.items) {
        data.items = input.items.slice();  // Copy the input array
    }

    if (input && input.startWindow) {
        data.endWindow = input.endWindow;
    } else {
        data.startWindow = 0;
        data.endWindow = 0;
    }

    // Fetch items and ensure we have the correct limit of items
    while (data.items.length < data.limit + 1) {
        data.startWindow = data.endWindow;
        data.endWindow = data.endWindow + itemsInPage;
        var itemGR = queryItems(catalog, categoryId, data.startWindow, data.endWindow);
        if (!itemGR.hasNext()) break;
        fetchItemDetails(itemGR, data.items);
    }

    // Show 'Show More' button if more items exist beyond the current limit
    if (data.items.length > data.limit)
        data.show_more = true;

    data.more_msg = gs.getMessage("Showing {0} items", data.limit);

    // Fetch details of items from the GlideRecord
    function fetchItemDetails(itemRecord, items) {
        while (itemRecord.next()) {
            var catalogItemJS = new sn_sc.CatItem(itemRecord.getUniqueValue());
            if (!catalogItemJS.canView()) continue;

            var catItemDetails = catalogItemJS.getItemSummary();
            var item = {};
            item.name = catItemDetails.name;
            item.short_description = catItemDetails.short_description;
            item.picture = catItemDetails.picture;
            item.price = catItemDetails.price;
            item.sys_id = catItemDetails.sys_id;
            item.hasPrice = catItemDetails.show_price;
            item.page = 'sc_cat_item';
            item.type = catItemDetails.type;
            item.order = catItemDetails.order;
            item.sys_class_name = catItemDetails.sys_class_name;
            item.titleTag = catItemDetails.name;

            if (item.type === 'order_guide') {
                item.page = 'sc_cat_item_guide';
            } else if (item.type === 'content_item') {
                item.content_type = catItemDetails.content_type;
                item.url = catItemDetails.url;
                if (item.content_type === 'kb') {
                    item.kb_article = catItemDetails.kb_article;
                    item.page = 'kb_article';
                } else if (item.content_type === 'external') {
                    item.target = '_blank';
                    item.titleTag = catItemDetails.name + " ➚";
                }
            }
            items.push(item);
        }
    }

    // Query items based on catalog and category IDs
    function queryItems(catalog, categoryId, startWindow, endWindow) {
        var scRecord = new sn_sc.CatalogSearch().search(catalog, categoryId, '', false, options.show_items_from_child != 'true');
        scRecord.addQuery('sys_class_name', 'NOT IN', 'sc_cat_item_wizard');
        scRecord.addEncodedQuery('hide_sp=false^ORhide_spISEMPTY^visible_standalone=true');
        scRecord.chooseWindow(startWindow, endWindow);
        scRecord.orderBy('order');
        scRecord.orderBy('name');
        scRecord.query();
        return scRecord;
    }

    // Fetch popular items if no category is selected
    function getPopularItems() {
        return new global.SCPopularItems().useOptimisedQuery(gs.getProperty('glide.sc.portal.popular_items.optimize', true) + '' == 'true')
            .baseQuery(options.popular_items_created + '')
            .allowedItems(getAllowedCatalogItems())
            .visibleStandalone(true)
            .visibleServicePortal(true)
            .itemsLimit(6)
            .restrictedItemTypes('sc_cat_item_guide,sc_cat_item_wizard,sc_cat_item_content,sc_cat_item_producer'.split(','))
            .itemValidator(function (item, itemDetails) {
                if (!item.canView() || !item.isVisibleServicePortal())
                    return false;

                return true;
            })
            .responseObjectFormatter(function (item, itemType, itemCount) {
                return {
                    order: 0 - itemCount,
                    name: item.name,
                    short_description: item.short_description,
                    picture: item.picture,
                    price: item.price,
                    sys_id: item.sys_id,
                    hasPrice: item.price != 0,
                    page: itemType == 'sc_cat_item_guide' ? 'sc_cat_item_guide' : 'sc_cat_item'
                };
            })
            .generate();
    }

    // Helper function to get allowed catalog items
    function getAllowedCatalogItems() {
        var allowedItems = [];
        catalogIDArr.forEach(function (catalogID) {
            var catalogObj = new sn_sc.Catalog(catalogID);
            var catItemIds = catalogObj.getCatalogItemIds();
            for (var i = 0; i < catItemIds.length; i++) {
                if (allowedItems.indexOf(catItemIds[i]) === -1)
                    allowedItems.push(catItemIds[i]);
            }
        });
        return allowedItems;
    }
})();