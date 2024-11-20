(function() {
    // Retrieve the user's last name
    var user = gs.getUser();
    var lastName = user.getLastName();

    // Pass the last name to the client
    data.userLastName = lastName;

    // Define properties for search functionality
    data.resultMsg = gs.getMessage("Search results.");
    data.navigationMsg = gs.getMessage("To navigate, use up and down arrow keys.");
    data.portalID = $sp.getPortalRecord().getUniqueValue();
    data.searchMsg = gs.getMessage("Search");

    // Check if suggestions are enabled
    data.isSuggestionsEnabled = gs.getProperty('glide.search.suggestions.enabled') === 'true';
    data.searchTypeBehavior = gs.getProperty('glide.service_portal.search_as_you_type_behavior').toLowerCase();
})();