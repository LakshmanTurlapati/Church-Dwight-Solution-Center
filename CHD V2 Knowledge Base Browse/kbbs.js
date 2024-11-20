(function() {
	if(input){
		var status = "failed";
        if(input.id && input.action){
			if(input.action == "subscribe"){
				subscribeKB(input.id);
				status ="success";
			}else if(input.action == "unsubscribe"){
				unSubscribeKB(input.id);
				status ="success";
			}
		}
		data.status = status;
	}else{
		data.sqaUiActive = GlidePluginManager.isActive('com.snc.knowledge.social_qa.ui');
		options.order_by = options.order_by ? options.order_by : "title";
		options.order_reverse = options.order_reverse ? options.order_reverse == 'true': false;
		data.instanceid = $sp.getDisplayValue("sys_id");
		data.kb_label = gs.getMessage('{0} -{1} knowledge base articles');
		data.kb_label_qa = gs.getMessage('{0} - {1} knowledge base articles and {2} questions');
		data.SUBSCRIBED_LABEL= gs.getMessage('Subscribed');
		data.UNSUBSCRIBE_LABEL = gs.getMessage('Unsubscribe');
		data.SUBSCRIBE_LABEL= gs.getMessage('Subscribe');

		var kbService = new KBPortalService();
		options.knowledge_bases = options.knowledge_bases || String(kbService.getServicePortalKnowledgeBases($sp.getPortalRecord().url_suffix)) || "";
		data.isMobile = kbService.isMobile();
		data.result = kbService.getMyKnowledgeBases(options.order_by,options.knowledge_bases);
		for(var i = 0; i < data.result.length; i++)
			data.result[i].iconAltText = data.result[i].icon ? gs.getMessage("{0} Knowledge base icon", data.result[i].title) :  gs.getMessage("Knowledge base icon");
    var kbCount = data.result.length;
		var articleCount = 0;
		var socailqaCount = 0;

		data.result.forEach(function(key){
			articleCount = articleCount + parseInt(key.article_count,10);
			if (data.sqaUiActive)
				socailqaCount = socailqaCount + parseInt(key.questions_count,10);

		});

		var canSuscribe = false;
		var canCreateArticle = false;
		var canPostQuestion = false;
		var kbService2 = new KBPortalService();
		canSuscribe = kbService2.canSubscribe();
		canCreateArticle = kbService2.canCreateArticle(options.knowledge_bases);
		canPostQuestion = kbService2.canPostQuestion(options.knowledge_bases);

		data.total_kb_count = kbCount;
		data.total_articles_count = articleCount;
		if (data.sqaUiActive)
			data.total_socialqa_count = socailqaCount;
		data.canSuscribe = canSuscribe;
		data.canCreateArticle = canCreateArticle;
		data.canPostQuestion = canPostQuestion;
		data.subscribeText = gs.getMessage("Subscribe to knowledge base {0}")
		data.unsubscribeText = gs.getMessage("Unsubscribe from knowledge base {0}");
		data.moreActionsLabel = gs.getMessage("Actions");
		data.moreActionsAriaLabel = gs.getMessage("More actions");
	}

function subscribeKB(kbID) {
    var context = global.ActivitySubscriptionContext.getContext();
    gs.info("Subscribing to KB with ID: " + kbID);
    context.getSubscriptionService().subscribe("722d67c367003200d358bb2d07415a9c", kbID);
}

function unSubscribeKB(kbID) {
    var context = global.ActivitySubscriptionContext.getContext();
    gs.info("Unsubscribing from KB with ID: " + kbID);
    context.getSubscriptionService().unsubscribe(kbID);
}

})();