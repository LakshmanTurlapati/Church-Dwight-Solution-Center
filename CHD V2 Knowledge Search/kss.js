(function() {
	if(input) 
		return;
	else {
	data.instanceid = $sp.getDisplayValue("sys_id");

	data.sysparm_kb_search_table = $sp.getParameter('sysparm_kb_search_table');
	//options will be given precedence if value exit
	data.set_foccus = gs.getProperty('glide.knowman.portal_search_focus') == 'true' || false;
	data.min_search_char = parseInt(options.min_search_char || gs.getProperty('glide.knowman.search_character_limit') || 3);
	data.allow_empty_search = options.allow_empty_search ? (options.allow_empty_search == 'Use system property' ?  gs.getProperty('glide.knowman.allow_empty_search') == 'true' : options.allow_empty_search == 'Yes') : gs.getProperty('glide.knowman.allow_empty_search') == 'true' || false;
	options.placeholder = options.placeholder || gs.getMessage('Search (minimum {0} characters)',data.min_search_char+'');
	data.messages = {};
	data.messages.MIN_CHARS_REQUIRED = gs.getMessage('Include at least {0} characters in your search query.',data.min_search_char+'');
	data.messages.searchMsg = gs.getMessage("Search");
	data.sqa_ui_active = GlidePluginManager.isActive('com.snc.knowledge.social_qa.ui');
	}
})();