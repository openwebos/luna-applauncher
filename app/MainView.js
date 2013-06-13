// @@@LICENSE
//
//      Copyright (c) 2010-2013 LG Electronics, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// LICENSE@@@

enyo.kind({
	name: "MainView",
	kind: "VFlexBox",
	published: {
		subView: "",
		searchTerm: "",
		currentContentResultItem:undefined,
	},
	events: {
		
	},
	components: [
		{
			flex: 1,
			kind: "Scroller",
			components: [
			             {
			            	 kind:"LaunchItems", name:"launchItems"
			             },
			             {
			            	 kind:"LaunchPointSearch", name:"launchPointSearch"
			             },
			             {
			            	 kind:"ContactSearch", name:"contactSearch"
			             },
					    {
					    	 kind:"RemoteContactSearch", style:"margin-bottom:8px;",name:"remoteContactSearch", showing:false
					    },
						{
							kind:"DbSearch", name:"dbSearch"
						},
						{
							kind:"LaunchAndSearch", name:"launchAndSearch"
						},
						{
							kind:"Actions", name:"actions"
						},
						{
							kind:"ContentResults", showing: false, name:"contentResults"
						}
			]
		},
		{
			kind:"PalmService", name:"getSearchEngines", service:"palm://com.palm.universalsearch/", method:"getUniversalSearchList", subscribe:true, onSuccess:"handleUniversalSearchListResponse" 
		},
		{
			kind:"PalmService", name:"getAllSearchPreference", service:"palm://com.palm.universalsearch/", method:"getAllSearchPreference", subscribe:true, onSuccess:"handleSearchPreferenceResponse"
		},
	],
	
	MIN_SEARCH_LENGTH: 2,
	ASIAN_MIN_SEARCH_LENGTH: 1,
	
	create: function() {
		this.inherited(arguments);
		this.$.getAllSearchPreference.call();
		//Controller State Managers -- format {"controllerName":<Name>, "state":<Pending, Running, NoResult, FoundResult>}
		this.currentControllerState = {};
		this.SEARCHMINLENGTH = this.getMinSearchLength();
		this.currentView = "all";
	},
	
	getMinSearchLength: function() {
		var lang = enyo.g11n.currentLocale().getLanguage();
		return (lang == "zh" || lang == "ja" || lang == "ko") ? this.ASIAN_MIN_SEARCH_LENGTH : this.MIN_SEARCH_LENGTH;
	},
	
	searchTermChanged: function() {
		if(this.currentView == "all" || this.currentView == "contacts") {
			if(this.searchTerm && this.searchTerm.length >= this.SEARCHMINLENGTH)
				this.$.remoteContactSearch.setShowing(true);
			else
				this.$.remoteContactSearch.setShowing(false);
		}
		var c = this.controls[0].components;
		for(var i = 0; i< c.length-1; i++) {
			var obj = this.$[c[i].name];
			obj.setSearchTerm(this.searchTerm);
		}
	},
	
	cleanup: function() {
		this.searchTerm = null;
		var c = this.controls[0].components;
		for(var i = 0; i< c.length-1; i++) {
			var obj = this.$[c[i].name];
			obj.cleanup();
		}
		this.showView("all");
		this.currentHighlightedControlObj && this.currentHighlightedControlObj.removeClass("enyo-focus-single");
		this.currentHighlightedControlObj = null;
		this.initializeControllerState();
	},
		
	handleSearchPreferenceResponse: function(inSender, inResponse) {
		this.$.launchAndSearch.setPreferences(inResponse.SearchPreference.defaultSearch);
		this.$.contactSearch.setPreferences(inResponse.SearchPreference.ContactSearch);
		this.$.launchPointSearch.setPreferences(inResponse.SearchPreference.AppSearch);
		this.$.remoteContactSearch.setPreferences(inResponse.SearchPreference.GAL)
		this.$.getSearchEngines.call();
	},
	
	handleUniversalSearchListResponse: function(inSender, inResponse) {
		this.$.launchAndSearch.setDefaultSearchEngine(inResponse.defaultSearchEngine);
		this.$.launchAndSearch.setLaunchAndSearchEngines(inResponse.UniversalSearchList);
		this.$.actions.setActionEngines(inResponse.ActionList);
		this.$.dbSearch.setDbSearchItems(inResponse.DBSearchItemList);
	},
	
	showView: function(viewName) {
		this.currentView = viewName;
		this.currentContentResultItem = undefined;
		this.$.contentResults.cleanup();
		this.$.scroller.scrollIntoView(0,0);
		
		this.$.dbSearch.showNoResultMessage(true);
		this.$.contactSearch.showNoResultMessage(true);
		
		if(viewName === "actions") {
			this.$.launchItems.setShowing(false);
			this.$.contactSearch.setShowing(false);
			this.$.remoteContactSearch.setShowing(false);
			this.$.launchPointSearch.setShowing(true);
			this.$.launchAndSearch.setShowing(true);
			this.$.actions.setShowing(true);
			this.$.dbSearch.setShowing(false);
		}
		else if(viewName === "contacts") {
			this.$.contactSearch.showNoResultMessage();
			this.owner.setViewTab(2);
			this.$.contactSearch.setShowing(true);
			if(this.searchTerm && this.searchTerm.length >= this.SEARCHMINLENGTH)
				this.$.remoteContactSearch.setShowing(true);
			else
				this.$.remoteContactSearch.setShowing(false);
			this.$.launchItems.setShowing(false);
			this.$.launchPointSearch.setShowing(false);
			this.$.launchAndSearch.setShowing(false);
			this.$.actions.setShowing(false);
			this.$.dbSearch.setShowing(false);
		}
		else if(viewName === "content") {
			this.$.dbSearch.showNoResultMessage();
			this.$.dbSearch.setShowing(true);
			this.$.contactSearch.setShowing(false);
			this.$.launchItems.setShowing(false);
			this.$.remoteContactSearch.setShowing(false);
			this.$.launchPointSearch.setShowing(false);
			this.$.launchAndSearch.setShowing(false);
			this.$.actions.setShowing(false);
		}
		else {
			this.owner.setViewTab(1);
			this.$.remoteContactSearch.closeGALDrawer();
			this.$.launchItems.setShowing(true);
			this.$.contactSearch.setShowing(true);
			if(this.searchTerm && this.searchTerm.length >= this.SEARCHMINLENGTH)
				this.$.remoteContactSearch.setShowing(true);
			else
				this.$.remoteContactSearch.setShowing(false);
			this.$.launchPointSearch.setShowing(true);
			this.$.launchAndSearch.setShowing(true);
			this.$.actions.setShowing(true);
			this.$.dbSearch.setShowing(true);
		}
	},
	
	hideEverything: function() {
		this.$.contactSearch.setShowing(false);
		this.$.remoteContactSearch.setShowing(false);
		this.$.launchPointSearch.setShowing(false);
		this.$.launchAndSearch.setShowing(false);
		this.$.actions.setShowing(false);
		this.$.dbSearch.setShowing(false);
		this.$.launchItems.setShowing(false);
	},
	
	showContentResults: function(result) {
		this.currentContentResultItem = result.conTemplate.id;
		this.hideEverything();
		this.$.scroller.scrollTo(0,0);
		this.$.contentResults.setContentTemplate(result.conTemplate);
		this.$.contentResults.setContentArray(result.conArray);
		this.$.contentResults.setShowing(true);
		this.owner.setViewTab(3);
		this.currentView = "content";
	},
	
	showActionsOnly: function() {
		this.$.scroller.scrollIntoView(0,0);
		this.$.contactSearch.setShowing(false);
		this.$.remoteContactSearch.setShowing(false);
		this.$.launchPointSearch.setShowing(false);
		this.$.launchAndSearch.setShowing(false);
		this.$.launchItems.setShowing(false);
		this.$.actions.setShowing(true);
		this.$.dbSearch.setShowing(false);
		this.currentView = "actions";
		
	},
	
	updateContentResults: function(result) {
		this.$.contentResults.setContentArray(result);
	},
	
	//Setting the initial state to Pending for all controllers.
	initializeControllerState: function() {
		enyo.forEach(Util.getObjectKeys(this.currentControllerState), function(item) {
			this.currentControllerState[item] = "Running";
			}, this);
	},
	
	addControllerState: function(contName) {
		enyo.setObject(contName, "Running", this.currentControllerState)
	},
	
	removeControllerState: function(contName) {
		delete this.currentControllerState[contName];
	},
	
	setControllerState: function(contName, state) {
		enyo.setObject(contName, state, this.currentControllerState)
	},
	
	getControllerState: function(contName) {
		return enyo.getObject(contName, false, this.currentControllerState);
	},
	
	updateControllerState: function(contName, state) {
		
		this.setControllerState(contName, state);
		
		var appState = this.getControllerState("apps");
		var contactState = this.getControllerState("contacts");
		
		if(this.getControllerState("dbsearch") == "FoundResult")
			this.$.dbSearch.displayDbResultInGroup();
		
		this.currentHighlightedControlObj && this.currentHighlightedControlObj.removeClass("enyo-focus-single");
		this.currentHighlightedControlObj && this.currentHighlightedControlObj.removeClass("enyo-focus-app");

		if(this.$.launchItems.$.goToWeb.getShowing()) {
			this.currentHighlightedControlObj && this.currentHighlightedControlObj.addClass("enyo-focus-single");
		}	
		else if((contactState && contactState == "NoResult") && (appState && appState == "NoResult")) {
			this.$.launchAndSearch.highlightDefaultEngine();
		}
		else if (contactState && contactState == "FoundResult") {
			this.$.contactSearch.highlightContact();
		}
		else if ((appState && appState == "FoundResult") && (contactState && contactState == "NoResult")) {
			this.$.launchPointSearch.highlightApps();
		}
		
		if(state == "NoResult") {
			if(contName == "dbsearch" && this.currentView == "content") {
				this.$.dbSearch.showNoResultMessage();
			}
			else if(contName == "contacts" && this.currentView == "contacts") {
				this.$.contactSearch.showNoResultMessage();
			}
		}
	},
	
	currentHighlightedControl: function(controlObj) {
		this.currentHighlightedControlObj = controlObj;
	},
	
	enterKeyAction: function() {
		if((this.currentHighlightedControlObj instanceof ContactItem) || (this.currentHighlightedControlObj instanceof ContactDrawerItem) ) {
			this.currentHighlightedControlObj.onEnterKey();
		}
		else if(this.currentHighlightedControlObj instanceof enyo.Item) {
			this.$.launchAndSearch.onEnterKey()
		}
		else if(this.currentHighlightedControlObj instanceof enyo.RowGroup) {
			this.$.launchItems.onEnterKey()
		}
		else
			//Call Launch Point Search object.
			this.$.launchPointSearch.onEnterKey(this.currentHighlightedControlObj);
	},
	
	removeFocusOnItem: function() {
		this.currentHighlightedControlObj && this.currentHighlightedControlObj.removeClass("enyo-focus-single");
	}
});
