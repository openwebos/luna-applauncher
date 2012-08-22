// @@@LICENSE
//
//      Copyright (c) 2010-2012 Hewlett-Packard Development Company, L.P.
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
	name:"LaunchAndSearch",
	kind:"VFlexBox",
	published: {
		searchTerm: "",
		defaultSearchEngine: null,
		preferences: "",
		launchAndSearchEngines: []
	},
	events: {
		
	},
	SEARCHITEMSLIMIT: 4,
	defaultSearchEngineInfo: undefined,
	components: [
			{
				kind: "RowGroup",
				name: "defaultSearchEngineGroup",
				showing: false,
				components: [{
					kind: "Item",
					layoutKind: "HFlexLayout",
					name: "defaultSearchEngineItem",
					align: "center",
					tapHighlight: true,
					onclick:"searchInDefaultEngine",
					components: [
						{kind:"Image", name:"searchSuggestIcon", className:"list-icon"},
							{name: "searchSuggestLabel", flex:1},
								{kind: "Spinner", spinning: false, name:"searchSuggestSpinner", showing:false}, 
									{
										kind:"Button",
										name: "searchSuggestButton",
										label:$L("Suggest"),
										onclick:"getSearchSuggest",
									}
								]
				},
				{kind:"Item", name:"searchSuggestDrawerItem", className: "", components: [
				                                          {name: "drawer", kind: "BasicDrawer", open: false,  components: []}
				]}
			]
			},
			{
				kind: "RowGroup",
				name: "launchAndSearchListGroup",
				caption: $L("Search Using...")
			},
		{
			kind:"WebService", name:"suggestSearch", onSuccess:"handleSearchSuggestion",headers: {"Content-Type": "application/json","Connection": "close"}
		},
		{
			kind:"PalmService", name:"launch", service:"palm://com.palm.applicationManager/", method:"launch"
		},
		{
			kind:"PalmService", name:"getAutoLocate", service:"palm://com.palm.location/", method:"getAutoLocate", onSuccess:"handleGPSAutoLocate" 
		},
		{
			kind:"PalmService", name:"getCurrentPosition", service:"palm://com.palm.location/", method:"getCurrentPosition", onSuccess:"handleGPSCurrentPosition" 
		}
			
	],
	
	create: function() {
		this.inherited(arguments);
	},
	
	launchAndSearchEnginesChanged: function() {
		this.updateDefaultSearchEngineDiv();
		this.populateLaunchAndSearchList(true);
	},
	
	preferencesChanged: function() {
		this.$.defaultSearchEngineGroup.setShowing(this.preferences == "true" ? true : false);
	},
	
	populateLaunchAndSearchList: function(limitItem) {
		
		this.$.launchAndSearchListGroup.destroyControls();
		var numberOfItems = 0;
		var enabledItems = 0;
		for(var j = 0; j < this.launchAndSearchEngines.length; j++) {
			if(this.launchAndSearchEngines[j].enabled && this.launchAndSearchEngines[j].id != this.defaultSearchEngine) 
				enabledItems++;
		}
		for(var i = 0; i < this.launchAndSearchEngines.length; i++) {
			if(this.launchAndSearchEngines[i].enabled && this.launchAndSearchEngines[i].id != this.defaultSearchEngine) {
				numberOfItems++;
				if(limitItem && numberOfItems > this.SEARCHITEMSLIMIT && (enabledItems-numberOfItems) >= 1) {
					this.$.launchAndSearchListGroup.createComponent({
						kind: "LaunchAndSearchItem",
						searchEngineName: $L("More..."),
						searchInfo: {id:"moresearchitem", displayName:$L("More..."), iconFilePath:"/usr/lib/luna/system/luna-applauncher/images/search-icon-new.png"},
						onItemClicked: "handleLaunchAndSearchSelected",
						owner: this
					});
					break;
				}
				if(!this.launchAndSearchEngines[i].iconFilePath)
					this.launchAndSearchEngines[i].iconFilePath = "/usr/lib/luna/system/luna-applauncher/images/search-icon-generic.png";
				this.$.launchAndSearchListGroup.createComponent({
						kind: "LaunchAndSearchItem",
						searchEngineName: this.launchAndSearchEngines[i].displayName,
						searchInfo: this.launchAndSearchEngines[i],
						onItemClicked: "handleLaunchAndSearchSelected",
						owner: this
					});
			}
		}
		this.$.launchAndSearchListGroup.render();
		
		if(this.$.launchAndSearchListGroup.getControls().length > 0)
			this.$.launchAndSearchListGroup.setShowing(true);
		else
			this.$.launchAndSearchListGroup.setShowing(false);
	},
	
	updateDefaultSearchEngineDiv: function() {
		if(this.preferences == "false")
			return;
		
		this.defaultSearchEngineInfo = undefined;
		
		for(var i = 0; i< this.launchAndSearchEngines.length; i++) {
			if(this.launchAndSearchEngines[i].id == this.defaultSearchEngine && this.launchAndSearchEngines[i].type != 'app') {
				this.defaultSearchEngineInfo = this.launchAndSearchEngines[i];
				break;
			}
		}

		if(!this.defaultSearchEngineInfo) {
			this.$.defaultSearchEngineGroup.setShowing(false);
			return;
		}
		
		this.$.defaultSearchEngineGroup.setShowing(true);
		this.$.searchSuggestIcon.setSrc(this.defaultSearchEngineInfo.iconFilePath);
		this.$.searchSuggestLabel.setContent(new enyo.g11n.Template($L("Search #{displayName}")).evaluate(this.defaultSearchEngineInfo));
		
		if (this.defaultSearchEngineInfo.suggestURL) {
			this.$.searchSuggestButton.setShowing(true);
		}
		else
			this.$.searchSuggestButton.setShowing(false);
		this.$.defaultSearchEngineItem.removeClass("enyo-first");
		this.$.defaultSearchEngineItem.addClass("enyo-single");
	},
	
	highlightDefaultEngine: function() {
		if(this.preferences == "false")
			return;
		this.$.defaultSearchEngineItem.addClass("enyo-focus-single");
		this.owner.currentHighlightedControl(this.$.defaultSearchEngineItem);
	},
	
	handleLaunchAndSearchSelected: function(inSender, inEvent) {
		var item = inSender.getSearchInfo();
		
		if(!item)
			return;
			
		var syntax = /(^|.|\r|\n)(#|{\s*(\w+)\s*})/; //matches symbols like '{field}'
		var searchString = encodeURIComponent(enyo.$.justTypeApp.$.justType.getFilterText());
		var temp;
		if(item.type == "web" || item.type == "opensearch") {
			temp = new Util.Template(item.url, syntax);
			var params = {scene: 'page', target: temp.evaluate({
				searchTerms: searchString, searchTerm: searchString, "startPage?":''
			})};
			this.$.launch.call({id:"com.palm.app.browser", params:params});
		}
		else if(item.type == "app") {
			var appinfo = {};
			appinfo.id = item.url;
			appinfo.params = {};

			var launchParam = this.convertLaunchParams(item.launchParam);
			var paramType = Util.ObjectType(launchParam);
			if (paramType == "string") {
				appinfo.params[launchParam] = searchString;
			}
			else if (paramType == "object") {
				temp = new Util.Template(item.launchParam, syntax);
				appinfo.params = temp.evaluate({searchTerms: searchString, searchTerm: searchString});
			}
			else {
				enyo.log("Error - Universal Search - App Launch Parameter Type is not supported")
				return;
			}
			if(appinfo.id == "com.palm.app.maps") {
				this.appinfo = appinfo;
				this.appinfo.params[launchParam] = decodeURIComponent(searchString);
				this.$.getAutoLocate.call();
			}
			else
				this.$.launch.call({id: appinfo.id, params:appinfo.params});
		}
		else 
			if(inSender.getSearchInfo().id == "moresearchitem") {
				this.populateLaunchAndSearchList(false);
			}
	},
	
	convertLaunchParams: function(launchParams) {
		if(typeof launchParams == "string") {
			try {
				var params = JSON.parse(launchParams);
				return params;
			} catch (error) {
			}
		}
		if(typeof launchParams == "string") {
			return launchParams;
		}
	},
	
	searchTermChanged: function() {
		var syntax = /(^|.|\r|\n)(#|{\s*(\w+)\s*})/; //matches symbols like '{field}'
		if(this.defaultSearchEngineInfo) {
			var t = new Util.Template(this.defaultSearchEngineInfo.suggestURL, syntax);
			this.$.suggestSearch.setUrl(t.evaluate( {searchTerms: encodeURIComponent(this.searchTerm)}));
		}
		if(this.$.drawer.getOpen()) {
			this.$.suggestSearch.call();
		}
	},
	
	getSearchSuggest: function(inSender, inEvent) {
		if (!this.$.drawer.getOpen()) {
			this.$.searchSuggestSpinner.setShowing(true);
			this.$.suggestSearch.call();
		}
		else {
			this.$.drawer.setAnimate(true);
			this.$.drawer.setOpen(false);
			this.$.defaultSearchEngineItem.removeClass("enyo-first");
		}
		return true;
	},
	
	handleSearchSuggestion: function(inSender, inResponse) {
		var suggestItems = inResponse[1] || [];
		suggestItems.splice(5,suggestItems.length);
		this.$.searchSuggestSpinner.setShowing(false);
		if(suggestItems.length == 0) {
			this.$.defaultSearchEngineItem.removeClass("enyo-first");
			this.$.defaultSearchEngineItem.addClass("enyo-single");
			this.$.drawer.setOpen(false);
			return;
		}
		this.$.drawer.destroyControls();
		var className;
		for(var i = 0; i< suggestItems.length; i++) { 
			if(i == 0)
				className = "enyo-first";
			else if(i == suggestItems.length -1)
				className = "enyo-last";
			else
				className = "enyo-item enyo-middle";
			this.$.drawer.createComponent({
				kind:"Item",
				tapHighlight: true,
				owner:this,
				className: className,
				content: enyo.string.escapeHtml(suggestItems[i]),
				onclick:"handleSuggestItemSelected"
			});
		}
		this.$.drawer.render();
		this.$.defaultSearchEngineItem.addClass("enyo-first");
		this.$.defaultSearchEngineItem.removeClass("enyo-single");
		this.$.drawer.setAnimate(true);
		this.$.drawer.setOpen(true);
	},
	
	handleSuggestItemSelected: function(inSender, inEvent) {
		var syntax = /(^|.|\r|\n)(#|{\s*(\w+)\s*})/; //matches symbols like '{field}'
		var temp = new Util.Template(this.defaultSearchEngineInfo.url, syntax);
		var params = {scene: 'page', target: temp.evaluate({
				searchTerms: encodeURIComponent(inSender.getContent() || this.searchTerm)
			})};
		this.$.launch.call({id:"com.palm.app.browser", params:params});
	},
	
	searchInDefaultEngine: function(inSender, inEvent) {
		var syntax = /(^|.|\r|\n)(#|{\s*(\w+)\s*})/; //matches symbols like '{field}'
		var temp = new Util.Template(this.defaultSearchEngineInfo.url, syntax);
		var params = {scene: 'page', target: temp.evaluate({
				searchTerms: encodeURIComponent(enyo.$.justTypeApp.$.justType.getFilterText()), "startPage?":''
			})};
		this.$.launch.call({id:"com.palm.app.browser", params:params});
	},
	
	onEnterKey: function() {
		this.searchInDefaultEngine();
	},
	
	cleanup: function() {
		this.$.defaultSearchEngineItem.removeClass("enyo-first");
		this.$.defaultSearchEngineItem.addClass("enyo-single");
		this.$.drawer.setAnimate(false);
		this.$.drawer.destroyControls();
		this.$.searchSuggestSpinner.setShowing(false);
		this.$.drawer.setOpen(false);
		
		this.populateLaunchAndSearchList(true);
	},
	
	handleGPSAutoLocate: function(inSender, inResponse) {
		if(inResponse.autoLocate == true)
			this.$.getCurrentPosition.call({appId:"com.palm.launcher",accuracy:3,maximumAge:900,responseTime:1 })
		else {
			this.appinfo.params.location = "null";
			this.$.launch.call({id: this.appinfo.id, params:this.appinfo.params});
		}	
	},

	handleGPSCurrentPosition:function(inSender, inResponse) {
		if (inResponse.errorCode == 0) {
			this.appinfo.params.location = {
				lat: inResponse.latitude,
				lng: inResponse.longitude,
				acc: inResponse.horizAccuracy
			}
		}
		else
			this.appinfo.params.location = "null";
		this.$.launch.call({id: this.appinfo.id, params:this.appinfo.params});
	}
	
});

enyo.kind({
	name: "LaunchAndSearchItem",
	kind: enyo.Item,
	tapHighlight: true,
	published: {
		searchEngineName: "",
		searchInfo:""
	},
	events: {
		onItemClicked:""
	},
	components: [
		{
			kind: "HFlexBox",
			align:"center",
			components: [
				{kind:"Image", name:"icon", className:"list-icon"},
				{name: "label", style:"width:600px",className:"enyo-text-ellipsis"}
			]
		}
	],
	
	create: function() {
		this.inherited(arguments);
		this.$.label.content = enyo.string.escapeHtml(this.searchEngineName);
		this.$.icon.setSrc(this.searchInfo.iconFilePath);
	},
	
	clickHandler: function(inSender, inEvent) {
		this.doItemClicked();
	}
});