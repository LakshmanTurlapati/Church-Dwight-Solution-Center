(function() {
  function isImpersonating() {
    if (gs.getCurrentScopeName() == "rhino.global")
      return GlideImpersonate().isImpersonating();
    return gs.getSession().isImpersonating();
  }

  var isPerfWidgetEnabled = (isImpersonating() || gs.hasRole('admin')) && gs.getProperty("sn_ex_sp_perf_tools.enable_perf_widget", 'true') == 'true';
  if (isPerfWidgetEnabled)
    data.perfWidget = $sp.getWidget('performance_indicator');

  data.ACTION_TODO_COUNT = 'update_todo_count';
  data.ACTION_LOAD_CASES = 'load_cases';
  data.isMobile = gs.isMobile();
  data.isFavoritesEnabled = $sp.getValue('enable_favorites') == 'true';
  data.isPersonalizedAnswer = GlidePluginManager().isActive("com.sn_app_ex_integrated_answers");

  if (data.isFavoritesEnabled) {
    var favoriteApi = new sn_ex_sp.FavoriteAPI();
    var qsConfig = $sp.getValue('quick_start_config');
    var favoriteIcon = favoriteApi.getFavoriteIcon(qsConfig);
    data.favoriteIcon = favoriteIcon.checkIcon;
  }

  // Load To-dos count
  if (!input || input.action == data.ACTION_TODO_COUNT) {
    var myTodosCountObject = new sn_hr_sp.todoPageUtils().getMyTodosCount(false, false, true);
    data.mobileViewTodoCount = myTodosCountObject.todoCount;
    data.todoCount = (myTodosCountObject.todoCount > 9) ? '9+' : myTodosCountObject.todoCount;

    data.todoCountLabel = gs.getMessage("{0} to-dos remaining");
    data.recordWatchers = myTodosCountObject.recordWatchers;

    // avoid consecutive calls
    if (input)
      return;
  }

  data.isHrCoreActive = GlidePluginManager().isActive("com.sn_hr_core");
  if (data.isHrCoreActive && gs.getProperty('sn_hr_core.esc.create_hrprofile.override', 'true') === "true") {
    // HR Profile
    var hrProfileGr = new GlideRecord('sn_hr_core_profile');
    hrProfileGr.addQuery('user', gs.getUserID());
    hrProfileGr.setLimit(1);
    hrProfileGr.query();
    if (!hrProfileGr.hasNext() && gs.getUserID() && new GlideRecord('sys_user').get(gs.getUserID())) {
      hrProfileGr.setValue('user', gs.getUserID());
      hrProfileGr.insert();
    }
  }

  // check for listening posts voluntary feedback
  data.voluntarySurveyIsActive = false;
  data.isListeningPostsActive = GlidePluginManager().isActive("sn_lp");
  if (data.isListeningPostsActive) {
    var pulseUtils = new sn_lp.PulseUserCriteriaEvaluation();
    data.voluntarySurvey = pulseUtils.getActiveVoluntarySurvey && pulseUtils.getActiveVoluntarySurvey();

    if (data.voluntarySurvey && data.voluntarySurvey.next()) {
      data.voluntarySurveyIsActive = true;
    }
  }

  // Add search functionality
  data.resultMsg = gs.getMessage("Search results.");
  data.navigationMsg = gs.getMessage("To navigate, use up and down arrow keys.");
  data.portalID = $sp.getPortalRecord().getUniqueValue();
  data.searchMsg = gs.getMessage("Search");
  data.q = $sp.getParameter('q');

  data.isSuggestionsEnabled = gs.getProperty('glide.search.suggestions.enabled');
  data.searchTypeBehavior = gs.getProperty('glide.service_portal.search_as_you_type_behavior').toLowerCase();

  var searchSources;
  data.searchType = null;
  data.searchSources = [];
  if ($sp.getParameter("id") == "search" && $sp.getParameter("t")) {
    data.searchType = $sp.getParameter("t");
    searchSources = $sp.getSearchSources(data.portalID);
  } else {
    var contextualSearchSourceIDs = options.contextual_search_sources || null;
    searchSources = $sp.getSearchSources(data.portalID, contextualSearchSourceIDs);
    if (searchSources.length == 1) {
      data.searchType = searchSources[0].id;
    }
  }

  data.searchSourceSysIds = [];
  data.typeaheadTemplates = {};
  data.searchSourceConfiguration = {};
  searchSources.forEach(function(source) {
    data.searchSourceSysIds.push(source.sys_id);
    if (source.isTypeaheadEnabled) {
      data.searchSources.push(source.id);
    }
    var sourceTemplateConfiguration = {
      sys_id: source.sys_id,
      glyph: source.typeaheadGlyph,
      linkToPage: source.typeaheadPage
    };

    if (source.isAdvancedTypeaheadConfig) {
      sourceTemplateConfiguration.type = "ADVANCED";
      sourceTemplateConfiguration.template = "sp-typeahead-" + source.id + ".html";
      data.typeaheadTemplates["sp-typeahead-" + source.id + ".html"] = $sp.translateTemplate(source.typeaheadTemplate);
    } else {
      sourceTemplateConfiguration.type = "SIMPLE";
      if (!sourceTemplateConfiguration.linkToPage)
        console.log("Warning: No typeahead page or URL provided for search source " + source.name);
    }

    data.searchSourceConfiguration[source.id] = sourceTemplateConfiguration;
  });

  if (input && input.action === "GlideSPSearchAnalyticsUpdateRank") {
    input.action = "";
    var textSearchAnalytics = new GlideSPSearchAnalytics().publish(JSON.stringify(input.payload));
    return;
  }

  data.link = '?id=hri_user_profile&sys_id=' + gs.getUserID();

  data.login_page = $sp.getValue('login_page');

  data.sub = {};
  data.top = {};
  var menu = $sp.getValue("sp_rectangle_menu");
  data.sub.menu = $sp.getWidgetFromInstance(menu);
  data.escNavigation = $sp.getWidget("employee-center-navigation");

  data.top.menu = JSON.parse(JSON.stringify(data.sub.menu));

  var configOptions = JSON.parse((data.top.menu && data.top.menu.options && data.top.menu.options.widget_parameters) || '{}');
  data.moreItemsSysId = (configOptions.enable_more_items && configOptions.enable_more_items.sysId) || '';
  var subMenu = data.sub.menu;
  var moreItems;
  if (subMenu && subMenu.data) {
    subMenu.data.replace = true;
    data.hasLogin = false;
    var subMenuDataItems = (subMenu.data.menu && subMenu.data.menu.items) || [];
    for (var i in subMenuDataItems) {
      var item = subMenuDataItems[i];
      if (item.sys_id === data.moreItemsSysId)
        moreItems = item;
      if (item.type === 'page' && item.sp_page === data.login_page)
        data.hasLogin = true;
    }
  }

  if (moreItems && moreItems.items) {
    data.moreItems = moreItems.items;
  } else if (moreItems && moreItems.scriptedItems && moreItems.scriptedItems.items) {
    data.moreItems = moreItems.scriptedItems.items;
  }

  if (moreItems && data.moreItems && moreItems.label) {
    data.moreItems = data.moreItems.filter(function(moreItem) {
      return moreItem.label;
    });

    data.moreItems.forEach(function(moreItem) {
      moreItem.shortLabel = (moreItem.label.length > 60) ? (moreItem.label.substring(0, 60) + '...') : moreItem.label;
    });
  }

  data.hideSearchOnHomepage = configOptions.exclude_search_on_homepage ? configOptions.exclude_search_on_homepage.value : false;
  data.showRequests = configOptions.enable_requests ? configOptions.enable_requests.value : true;
  data.showTodos = configOptions.enable_tasks ? configOptions.enable_tasks.value : true;
  if (data.hideSearchOnHomepage) {
    data.homepage = $sp.getValue('homepage');
    var gr = new GlideRecord('sp_page');
    gr.get(data.homepage);
    data.dashboardSuffix = gr.getValue("id");
    data.portalSuffix = $sp.getPortalRecord().getDisplayValue("url_suffix");
  }

  data.showMoreItems = (moreItems && moreItems.label && data.moreItems && configOptions.enable_more_items) ? (data.moreItems.length > 0 && configOptions.enable_more_items.value) : false;
  if (data.showMoreItems)
    data.moreItemsTitle = data.moreItems.length === 1 ? data.moreItems[0].shortLabel : moreItems.label;

  data.analyticsSupportEnabled = new GlidePluginManager().isActive('com.sn_content_analytics') && new GlidePluginManager().isActive('com.sn_content_delivery') && !sn_cd.cd_ContentDelivery.isContentPreview($sp);

  if (subMenu) {
    if (subMenu.data) {
      subMenu.data.cartWidget = {};
      subMenu.data.showTours = false;
    }
    if (subMenu.options) {
      subMenu.options.enable_cart = false;
    }
  }
  if (data.top.menu && data.top.menu.data && data.top.menu.data.menu && data.top.menu.data.menu.items)
    data.top.menu.data.menu.items = [];
})();
