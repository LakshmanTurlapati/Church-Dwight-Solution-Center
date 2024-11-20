function($location, spAriaFocusManager, spUtil) {

	var c = this;
	c.options.glyph = c.options.glyph || 'search';
	c.options.title = c.options.title || "${Welcome to Knowledge}";
	c.keyword = "";
	
	c.submitSearch = function() {
		if(!((!c.data.allow_empty_search && c.keyword == "") || (c.keyword && c.keyword.length < c.data.min_search_char))) {		
			var url= $location.search({
				id: 'kb_search',
				query: c.keyword
			});	

			spAriaFocusManager.navigateToLink(url.url());
		}
		else if(c.keyword && c.keyword.length < c.data.min_search_char) 
			spUtil.addInfoMessage(c.data.messages.MIN_CHARS_REQUIRED);
	};
}