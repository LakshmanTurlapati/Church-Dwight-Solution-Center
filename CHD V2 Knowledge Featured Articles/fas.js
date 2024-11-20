(function() {
	if(input)
		return;
	else {
	options.aria_label_title = options.title || gs.getMessage('Featured Articles');
	options.title = options.title || gs.getMessage('Featured');
	options.display_field = options.display_field.split(".")[0] || "short_description"; 
	options.secondary_fields = options.secondary_fields ? options.secondary_fields.split(",") : getKnowledgeFieldsfromProperties();
	options.show_secondary_fields_label = options.show_secondary_fields_label ? options.show_secondary_fields_label == 'true' : false;
	options.max_records = options.max_records || gs.getProperty('glide.knowman.content_block_limit')|| '5';
	options.always_show = options.always_show ? options.always_show == 'true' : true;
	options.reverse = false;

	if(options.display_field != "short_description"){
		options.secondary_fields.push(options.display_field);
	} 

	var kbService = new KBPortalService();
	options.knowledge_base = options.knowledge_base || String(kbService.getServicePortalKnowledgeBases($sp.getPortalRecord().url_suffix)) || "";
	var j = 0;
	var result = [];
	var kb = kbService.getFeaturedArticles(options.max_records,options.display_field,options.secondary_fields,options.knowledge_base);
	if(kb.results){
		kb.results.forEach(function(f){
			var record = {};
			record.id = f.id+"";
			record.link = f.link;
			record.direct = f.meta.direct || false;
			record.external = f.meta.external || false;
			record.external_link = f.meta.external_link;

			if (options.display_field){
				if(options.display_field == "short_description"){
					record.display_field = f.title;
				}else{
					record.display_field = f.meta[options.display_field].display_value;
				}
			}
			record.order = j;
			j++;

			record.secondary_fields = [];
			options.secondary_fields.forEach(function(key){
				if(options.display_field != key)
				record.secondary_fields.push(f.meta[key]);
			});


			result.push(record);
		});
	}

	options.result = result;
	data.template = $sp.getWidget("kb-list-widget-template", options);
	}

	function getKnowledgeFieldsfromProperties(){

		//Generate secondary fields based on legacy properties
		var fields = [];

		if(gs.getProperty('glide.knowman.search.show_article_number','false') == 'true'){
			var kbMod = new global.KBViewModel();
			if(kbMod.isVersioningEnabled()){
				fields.push('display_number');
			}else{
				fields.push('number');
			}
		}
		if(gs.getProperty('glide.knowman.search.show_author','false') == 'true')
			fields.push('author');
		if(gs.getProperty('glide.knowman.search.show_view_count','false') == 'true')
			fields.push('sys_view_count');		
		if(gs.getProperty('glide.knowman.search.show_last_modified','false') == 'true')
			fields.push('sys_updated_on');
		if(gs.getProperty('glide.knowman.search.show_published','false') == 'true')
			fields.push('published');
		if(gs.getProperty('glide.knowman.show_unpublished','false') == 'true')
			fields.push('workflow_state');
		if(gs.getProperty('glide.knowman.search.show_rating','false') == 'true')
			fields.push('rating');

		return fields;
	}
})();