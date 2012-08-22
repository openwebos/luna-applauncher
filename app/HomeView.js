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
	name: "HomeView",
	kind: "VFlexBox",
	published: {
		searchString: ""
	},
	events: {
		onRecentSearchStringSelected:""
	},
	recentSearchStrings: [],
	components: [
		{
			flex: 1,
			kind: "Scroller",
			components: [{
				name: "emptyMain",
				components: [{
					className: "large-empty-icon"
				}, {
					className: "empty-text",
					content: $L("Start typing to search or create")
				}]
			},
			{
					kind: "RowGroup",
					name: "recentSearchListGroup",
					caption: $L("Recent Searches")
			}
			]
		}
	],
	
	create: function() {
		this.inherited(arguments);
		this.updateView();
	},
	
	populateRecentSearchList: function() {
		this.$.recentSearchListGroup.destroyControls();
		for(var i = 0; i<this.recentSearchStrings.length; i++) {
			this.$.recentSearchListGroup.createComponent({kind:"RecentSearchStringItem", recentSearchStr: this.recentSearchStrings[i], onItemClicked:"handleRecentSearchSelected", onRowDelete:"handleItemDelete", owner: this})
		}
		this.$.recentSearchListGroup.render();
	},
	
	searchStringChanged: function() {
		if(this.searchString == '' || this.searchString == undefined)
			return;
		if(this.searchString.length == 1)
			return;
		if(this.recentSearchStrings.indexOf(this.searchString) != -1)
			return;
		this.recentSearchStrings.unshift(enyo.string.escapeHtml(this.searchString));
		
		if (this.recentSearchStrings.length > 5) {
			var itemsRemoved = this.recentSearchStrings.length - 5;
			this.recentSearchStrings.splice(5, itemsRemoved);	
		}
		this.updateView();
	},
	
	clearRecentSearches: function(inSender, inEvent) {
		this.recentSearchStrings.splice(0, this.recentSearchStrings.length);
		this.updateView();
	},
	
	updateView: function() {
		this.populateRecentSearchList();
		if(this.recentSearchStrings.length > 0) {
			this.$.recentSearchListGroup.setShowing(true);
			this.$.emptyMain.setShowing(false);
		}
		else {
			this.$.recentSearchListGroup.setShowing(false);
			this.$.emptyMain.setShowing(true);
		}	
	},
	
	handleRecentSearchSelected: function(inSender, inEvent) {
		this.searchString = inSender.getRecentSearchStr();
		this.doRecentSearchStringSelected();
	},
	
	handleItemDelete: function(inSender, inEvent) {
		var searchStr = inSender.getRecentSearchStr();
		var inIndex = this.recentSearchStrings.indexOf(searchStr);
		this.recentSearchStrings.splice(inIndex,1);
		this.updateView();
	}
});

enyo.kind({
	name: "RecentSearchStringItem",
	kind: enyo.Item,
	tapHighlight: true,
	align:"center",
	published: {
		recentSearchStr: ""
	},
	events: {
		onItemClicked:"",
		onRowDelete:"",
	},
	components: [
		{
			kind: "HFlexBox", components: [{
				flex:1, name: "label", onclick: "searchStringSelected", className:"enyo-text-ellipsis"
			},
			{kind: "IconButton", className:"iconBg", icon: "images/close-button.png", onclick: "deleteSearchString"}
			 ]
		}
	],
	
	create: function() {
		this.inherited(arguments);
		this.$.label.content = this.recentSearchStr;
	},
	
	serachStringChanged: function() {
		this.$.label.content = this.recentSearchStr;
	},
	
	searchStringSelected: function(inSender, inEvent) {
		this.doItemClicked();
	},
	
	deleteSearchString:function(inSender, inEvent) {
		this.doRowDelete();
	}
});
