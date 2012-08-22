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
	name:"RemoteContactSearch",
	kind:"VFlexBox",
	published: {
		searchTerm:"",
		preferences: "false",
	},
	components:[
	            {name:"remoteContactContainer", components:[]},
	            {name:"remoteContactServiceList", kind:"PalmService", onResponse:"handleRemoteContactResults"},
	            {name: "accounts", kind: "Accounts.getAccounts", onGetAccounts_AccountsAvailable: "collectRemoteSearchItems"}         
    ],
    
    invalidSearchString:undefined,
    remoteContactItems: {},
    remoteContactAccounts: [],
    rcItems: [],
    
    RCSearchResults: [],
    
    autoStart: false,
    
    create: function() {
		this.inherited(arguments);
		this.delayedRCSearch = Util.debounce(undefined, enyo.bind(this, "startRemoteContactSearch"), 1.5);
		this.getInitialValue();
		this.galDrawerOpen = false;
	},
	
	getInitialValue: function() {
		this.$.accounts.getAccounts({capability: ['REMOTECONTACTS', 'PHONE']});
	},

	collectRemoteSearchItems: function(inSender, inResponse) {
		this.remoteContactItems = {};
		this.remoteContactAccounts = [];
		var remoteAccounts = [];
		this.owner.$.contactSearch.setSkypeEnabled(false);
		var accounts = inResponse.accounts;
		for(var i = 0; i < accounts.length; i++) {
			if(accounts[i].templateId === "com.palm.skype") {
				this.owner.$.contactSearch.setSkypeEnabled(true);
			}
			if(accounts[i].templateId != "com.palm.eas") //EAS support only for now.
				continue;
			enyo.forEach(accounts[i].capabilityProviders, function(capabilityProvider) {
	            if ( capabilityProvider.capability === "REMOTECONTACTS" ) {
					  	var item = {};
					  	item.id = accounts[i]._id;
					  	item.queryUri = "palm://com.palm.eas/queryGal";//capabilityProvider.query;
					  	item.queryParams = {accountId: accounts[i]._id,query: "",limit: 100}; //set the limit to 50 search results.
						remoteAccounts.push(item);
	            }
	        }, this);
		}
		
		//Merging multiple accounts into one object.
		if(remoteAccounts.length > 0) {
			var remoteLookupItem = {};
			remoteLookupItem.id = remoteAccounts[0].id;
			remoteLookupItem.displayName = $L("Address Lookup");
			remoteLookupItem.queries = [];
			for(var i = 0; i < remoteAccounts.length; i++) {
				remoteLookupItem.queries[i] = {
					"queryUri": remoteAccounts[i].queryUri,
					"queryParams": remoteAccounts[i].queryParams
				};	
			}
			this.remoteContactAccounts.push(remoteLookupItem.id);
			this.remoteContactItems[remoteLookupItem.id] = remoteLookupItem;
			this.populateRemoteContactNodes();
		}
		else
			this.$.remoteContactContainer.destroyControls();
	},
	
	populateRemoteContactNodes: function() {
		this.$.remoteContactContainer.destroyControls();
		for(var i = 0; i < this.remoteContactAccounts.length; i++) {
			this.$.remoteContactContainer.createComponent({kind: "RowGroup", name:"rcNodeGroup-"+this.remoteContactAccounts[i], owner:this, components:[{kind:"RCSearchItem", name:"rcNode-"+this.remoteContactAccounts[i], rcSearchItemName: this.remoteContactItems[this.remoteContactAccounts[i]].displayName, rcSearchItemId: "GAL-" + this.remoteContactAccounts[i], onclick: "handleRemoteContactSearchTap"}]});			                                                                                                                                                           
		}
		this.$.remoteContactContainer.render();
	},
	
	searchTermChanged: function() {
		
		this.RCSearchResults.splice(0, this.RCSearchResults.length);
		if(this.preferences == "false" && !this.galDrawerOpen)
			return;

		if(this.remoteContactAccounts.length == 0)
			return;
		if(this.searchTerm.length < this.owner.SEARCHMINLENGTH)
			return;
		
		if(this.invalidSearchString && this.searchTerm.length >= this.invalidSearchString.length && this.searchTerm.substr(0, this.invalidSearchString.length) == this.invalidSearchString) {
			return;
		}
		else
			this.invalidSearchString = undefined;
		
		this.delayedRCSearch();
	},
	
	startRemoteContactSearch: function() {
		var item;
		
		item = this.remoteContactItems[this.remoteContactAccounts[0]];
		
		this.$["rcNode-"+ this.remoteContactAccounts[0]].setShowSpinner(true);
		
		//update Query object with current filter
		for (var it = 0; it < item.queries.length; it++) {
			item.queries[it].queryParams.query = this.searchTerm;
			item.queries[it].queryParams.limit = 50;
		}
		
		this.RCSearchResults.splice(0, this.RCSearchResults.length);
		if(this.rcItems.length > 0) {
			this.$.remoteContactServiceList.cancel();
			this.rcItems.splice(0, this.rcItems.length);
		}
		enyo.cloneArray(item.queries, 0, this.rcItems);
		var ind = this.rcItems[0].queryUri.lastIndexOf("/");
		this.$.remoteContactServiceList.setService(this.rcItems[0].queryUri.substr(0,ind+1));
		this.$.remoteContactServiceList.setMethod(this.rcItems[0].queryUri.substr(ind+1));
		this.$.remoteContactServiceList.call(this.rcItems[0].queryParams);
		
		this.rcItems.splice(0,1);
		
	},
	
	handleRemoteContactSearchTap: function(inSender, inEvent) {
		if(this.RCSearchResults.length == 0) {
			this.startRemoteContactSearch();
		}
		else {
			if(this.galDrawerOpen)
				return;
			this.owner.showView("contacts");
			this.displayRemoteContactSearchResults();
		}
	},
	
	handleRemoteContactResults: function(inSender, inResponse) {
		if(inResponse && inResponse.results) {
			this.RCSearchResults = this.RCSearchResults.concat(inResponse.results);
		}
		else {
			this.RCSearchResults = this.RCSearchResults.concat([]);
		}
		
		if(this.rcItems.length == 0) {
			//display
			//Display the Counter
			this.$["rcNode-"+ this.remoteContactAccounts[0]].setRcSearchResult(this.RCSearchResults);
			if(this.galDrawerOpen || this.RCSearchResults.length <= 5)
				this.displayRemoteContactSearchResults();
		}
		else {
			var ind = this.rcItems[0].queryUri.lastIndexOf("/");
			this.$.remoteContactServiceList.setService(this.rcItems[0].queryUri.substr(0,ind+1));
			this.$.remoteContactServiceList.setMethod(this.rcItems[0].queryUri.substr(ind+1));
			this.$.remoteContactServiceList.call(this.rcItems[0].queryParams);
			
			this.rcItems.splice(0,1);
		}
	},
	
	displayRemoteContactSearchResults: function() {
		this.galDrawerOpen = true;
		var comps = this.$["rcNodeGroup-"+this.remoteContactAccounts[0]] && this.$["rcNodeGroup-"+this.remoteContactAccounts[0]].getControls();
		for(var i = 0; i < comps.length; i++) {
			if(comps[i] instanceof RCSearchItem)
				continue;
			comps[i].destroy();
		}
		//Santize the strings.
		for (var i = 0; i < this.RCSearchResults.length; i++) {
			var obj = this.RCSearchResults[i];
			if(!obj.displayName || StringUtil.isBlank(obj.displayName)) {
				if(obj.givenName || obj.familyName) {
					obj.displayName = (obj.givenName ? obj.givenName:"") + " " + (obj.familyName ? obj.familyName:"");
					
				}
				else {
					if (obj.addresses.length > 0) 
						obj.formattedContactDisplay = obj.addresses[0].value;
				}
			}
			obj.favorite = false;
			obj.type = "galcontact"; 
			obj.listPhotoPath = "";
			this.$["rcNodeGroup-"+this.remoteContactAccounts[0]].createComponent({kind:"ContactItem", className: "enyo-item enyo-drawer", contactInfo:obj, searchTerm:this.searchTerm, owner:this});
		}
		this.$["rcNodeGroup-"+this.remoteContactAccounts[0]].render();
	},
	
	handleDbSearchItemTap: function(inSender, inEvent) {
		var resultObj = {};
		resultObj.conArray = inSender.getResultObj() || [];
		resultObj.conTemplate = this.DbSearchItems[inSender.getDbSearchItemId()];
		this.owner.showContentResults(resultObj);
	},
	
	cleanup: function() {
		this.invalidSearchString = undefined;
		this.galDrawerOpen = false;
		var comps = this.$["rcNodeGroup-"+this.remoteContactAccounts[0]] && this.$["rcNodeGroup-"+this.remoteContactAccounts[0]].getControls() || [];
		for(var i = 0; i < comps.length; i++) {
			if(comps[i] instanceof RCSearchItem)
				continue;
			comps[i].destroy();
		}
		this.RCSearchResults.splice(0, this.RCSearchResults.length);
		this.$["rcNode-"+ this.remoteContactAccounts[0]] && this.$["rcNode-"+ this.remoteContactAccounts[0]].setRcSearchResult(this.RCSearchResults);
		this.$["rcNode-"+ this.remoteContactAccounts[0]] && this.$["rcNode-"+ this.remoteContactAccounts[0]].removeClass("enyo-first");
		this.$["rcNode-"+ this.remoteContactAccounts[0]] && this.$["rcNode-"+ this.remoteContactAccounts[0]].addClass("enyo-single");
		this.rcItems.splice(0, this.rcItems.length);
	},
	
	closeGALDrawer: function() {
		this.galDrawerOpen = false;
		var comps = this.$["rcNodeGroup-"+this.remoteContactAccounts[0]] && this.$["rcNodeGroup-"+this.remoteContactAccounts[0]].getControls() || [];
		for(var i = 0; i < comps.length; i++) {
			if(comps[i] instanceof RCSearchItem)
				continue;
			comps[i].destroy();
		}
	},
	
	isGALExist: function() {
		return this.remoteContactAccounts.length > 0;
	}
});

enyo.kind({
	name: "RCSearchItem",
	kind: enyo.Item,
	tapHighlight: true,
	published: {
		rcSearchItemName: "",
		rcSearchItemId: "",
		rcSearchResult: [],
		showSpinner: false
	},
	components: [
		{
			kind: "HFlexBox",
			align: "center",
			components: [
				{name:"icon", className:"list-icon gal"},
				{name: "label"},
				{flex : 1},
				{name: "resultCountContainer", showing:false,className:"results-count-container", components:[
				         {components: [
				                {name:"resultsCount", className:"results-count"}
				         ]}
				]},
				{kind: "Spinner", name:"galSpinner"}
			]
		}
	],
 
	
	create: function() {
		this.inherited(arguments);
		this.$.label.setContent(this.rcSearchItemName);
		this.showSpinner ? this.$.galSpinner.show() : this.$.galSpinner.hide();
	},
	
	showSpinnerChanged: function() {
		this.showSpinner ? this.$.galSpinner.show() : this.$.galSpinner.hide();
	},
	
	rcSearchResultChanged: function() {
		this.$.galSpinner.hide();
		if(this.rcSearchResult && this.rcSearchResult.length == 0) {
			this.$.resultsCount.setContent(this.rcSearchResult.length);
			this.$.resultCountContainer.hide();
		}
		else {
			this.$.resultsCount.setContent(this.rcSearchResult.length);
			this.$.resultCountContainer.show();
		}
	}
});