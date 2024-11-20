function($http,$rootScope, $filter,$timeout,spAriaUtil) {
	var c = this;
	c.options.title = c.options.title || "${Explore our Knowledge Bases}";
	c.options.post_question_label = c.options.post_question_label || "${Ask a Question}";
	c.options.create_article_label = c.options.create_article_label || "${Create Article}";
	c.isFirefox = false;
	c.showMoreLink = true;
	c.subscribedText = "${Subscribed}";
	c.unSubscribeText = "${Unsubscribe}";

	if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
		c.isFirefox = true;
	}
	$rootScope.kb_count = c.data.total_kb_count;
	$rootScope.articles_count = c.data.total_articles_count;
	if (c.data.sqaUiActive)
		$rootScope.socialqa_count = c.data.total_socialqa_count;
	$rootScope.isMobile = c.data.isMobile;

	c.getOrderedItems = function() {
		return $filter('orderBy')(c.data.result, c.options.order_by, c.options.order_reverse);
	}
	c.focusFirstElement= function(e){
		$timeout(function(){$('div.kb-action-btns').children('ul').children('li:first-child').children('a').focus();})
	}
}