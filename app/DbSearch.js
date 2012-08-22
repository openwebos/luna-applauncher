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
	name:"DbSearch",
	kind:"VFlexBox",
	published: {
		searchTerm:"",
		dbSearchItems:[]
	},
	event: {
		onDbResultItemSelected:""
	},
	components:[
	            {name:"dbContainer", components:[]},
	            {name:"dbServiceList", kind:"PalmService", service:"palm://com.palm.db/", onResponse:"handleDbSearchResults", components:[]},
	            {name: "noResultMsg", showing:false, components: [{className: "large-empty-icon"}, {className: "empty-text",content: $L("No Search Results Found")}]}    
    ],
    
    SEARCHMINLENGTH: 2,
    invalidSearchString:undefined,
    dbItems: [],
    dbRTItems: [],
    DbSearchItems: {},
    DbSearchResults:[],
    
    create: function() {
		this.inherited(arguments);
		this.delayedDbSearch = Util.debounce(undefined, enyo.bind(this, "startSearchInDb"), 0.5);
		this.dbExpandedNodeResult = [];
		this.dbExpandedNodeId = null;
	},
	
	dbSearchItemsChanged: function() {
		//clear the Items.
		this.DbSearchItems = {};
		this.removeServiceAndContainerComponents();
		this.createDbServiceComponents();
		this.populateDbSearchNodes();
	},
	
	populateDbSearchNodes: function() {
		this.dbExpandedNodeId = null;
		for(var i = 0; i < this.dbItems.length; i++) {
			this.$.dbContainer.createComponent(
				{kind: "RowGroup", name:"dbGroup-"+this.dbItems[i], showing:false, owner:this, components:[
					{kind:"DbSearchItem", name:"dbNode-"+this.dbItems[i], 
						dbSearchItemName: this.DbSearchItems[this.dbItems[i]].displayName, 
						iconFilePath:this.DbSearchItems[this.dbItems[i]].iconFilePath, 
						dbSearchItemId: this.dbItems[i], 
						onclick: "handleDbSearchItemTap", 
						owner:this
					}
			]}
					);
			if(this.dbItems[i] == "com.palm.app.email") {
				this.$["dbGroup-"+this.dbItems[i]].createComponent(
					{kind:"Item", className:"", name:"dbGroupInnerDrawerItem", showing:false, owner:this, 
					components: [
						{name: "dbGroupInnerDrawer", kind: "BasicDrawer", open:false, owner:this, components: [
							{kind: "VirtualRepeater", name:"dbGroupInnerList", onSetupRow: "getDbContentItem", components:[
								{kind:"ContentItem", name:"dbGroupInnerListContent"
								}],
								onclick:"handleContentItemTap", 
								owner:this
								}
							]}
						]});
				this.$["dbGroup-"+this.dbItems[i]];
				this.dbExpandedNodeId = this.dbItems[i];
			}
		}
		this.$.dbContainer.render();
		if(this.dbItems.length > 0)
			this.owner.addControllerState("dbsearch");
		else
			this.owner.removeControllerState("dbsearch");
	},
	
	createDbServiceComponents: function() {	
		this.dbItems.splice(0, this.dbItems.length);
		
		for(var i = 0; i < this.dbSearchItems.length; i++) {
			var dbItem = this.dbSearchItems[i];
			if(dbItem.enabled) {
				this.DbSearchItems[dbItem.id] = dbItem;
				this.DbSearchItems[dbItem.id].dbQueryOriginal = Util.deepCloneObjects(dbItem.dbQuery);
				var selectFields = ["_id", "_kind"];
				for(var f = 0; f < this.DbSearchItems[dbItem.id].displayFields.length; f++) {
					
					if(Util.ObjectType(this.DbSearchItems[dbItem.id].displayFields[f]) === "object") {
						selectFields = selectFields.concat(this.DbSearchItems[dbItem.id].displayFields[f].name);
					}
					else {
						selectFields = selectFields.concat(this.DbSearchItems[dbItem.id].displayFields[f]);
					}
				}
				this.DbSearchItems[dbItem.id].dbQueryOriginal.select = selectFields;
				var methodToUse = dbItem.batchQuery ? "batch" : "search";
				this.$.dbServiceList.createComponent({name:"service-"+dbItem.id, method:methodToUse, owner:this})
				this.dbItems.push(dbItem.id);
			}
		}
	},
	
	removeServiceAndContainerComponents: function() {
		for(var i = 0; i < this.dbItems.length; i++) {
			this.$["service-"+this.dbItems[i]] && this.$["service-"+this.dbItems[i]].destroy();
			this.$["dbNode-"+this.dbItems[i]] && this.$["dbNode-"+this.dbItems[i]].destroy();
			this.$["dbGroup-"+this.dbItems[i]] && this.$["dbGroup-"+this.dbItems[i]].destroy();
		}
		if(this.dbExpandedNodeId) {
			this.$.dbGroupInnerDrawerItem && this.$.dbGroupInnerDrawerItem.destroy();
			this.$.dbGroupInnerDrawer && this.$.dbGroupInnerDrawer.destroy();
			this.$.dbGroupInnerList && this.$.dbGroupInnerList.destroy();
			this.$.dbGroupInnerListContent && this.$.dbGroupInnerListContent.destroy();
		}
	},
	
	searchTermChanged: function() {
		if(this.dbItems.length == 0)
			return;
		if(this.searchTerm.length < this.SEARCHMINLENGTH) {
			this.owner.updateControllerState("dbsearch", "NoResult");
			return;
		}
		
		if(this.invalidSearchString && this.searchTerm.length >= this.invalidSearchString.length && this.searchTerm.substr(0, this.invalidSearchString.length) == this.invalidSearchString) {
			this.owner.updateControllerState("dbsearch", "NoResult");
			return;
		}
		else
			this.invalidSearchString = undefined;
		
		this.delayedDbSearch();
	},
	
	startSearchInDb: function() {
		enyo.cloneArray(this.dbItems, 0, this.dbRTItems);
		this.DbSearchResults.splice(0, this.DbSearchResults.length);
		var nodeId;
		//update Query object with current filter
		for (var it = 0; it < this.dbItems.length; it++) {
			nodeId = this.dbItems[it];
			this.DbSearchItems[nodeId].dbQuery = Util.deepCloneObjects(this.DbSearchItems[nodeId].dbQueryOriginal);
			if(this.DbSearchItems[nodeId].batchQuery) {
					for(var j=0; j < this.DbSearchItems[nodeId].dbQuery.length; j++) {
						var query = this.DbSearchItems[nodeId].dbQuery[j];
						query.params.query.where[0].val = this.searchTerm; 
					}
			}	
			else {
				for (var i = 0; i < this.DbSearchItems[nodeId].dbQuery.where.length; i++) {
					if(Util.isBlank(this.DbSearchItems[nodeId].dbQuery.where[i].val))
						this.DbSearchItems[nodeId].dbQuery.where[i].val = this.searchTerm;
				}
			}
		}
		//calling first service...
		nodeId = this.dbRTItems[0];
		if(this.DbSearchItems[nodeId].batchQuery) {
			this.$["service-"+nodeId].call({operations:this.DbSearchItems[nodeId].dbQuery});
		}
		else {
			this.$["service-"+nodeId].call({query:this.DbSearchItems[nodeId].dbQuery});
		}
		this.dbRTItems.splice(0,1);
	},
	
	handleDbSearchResults: function(inSender, inResponse) {
		var nodeId = inSender.name.substr(8);
		var wrappedResult = {item: nodeId};
		if(inResponse && inResponse.returnValue) {
			wrappedResult.result = inResponse; 
		}
		else {
			wrappedResult.result = {};
		}
		this.DbSearchResults.push(wrappedResult);
		
		if(this.dbRTItems.length == 0) {
			var foundResult = false;
			for(var i = 0; i<this.DbSearchResults.length; i++) {
				var nodeId = this.DbSearchResults[i].item;
				this.$["dbNode-"+nodeId].setDbSearchResult(this.DbSearchResults[i].result);
				
				if(this.$["dbNode-"+nodeId].getResultObj().length > 0)
					foundResult = true;
			}
			if(foundResult) {
				this.owner.updateControllerState("dbsearch", "FoundResult");
				this.showNoResultMessage(true);
			}
			else {
				this.owner.updateControllerState("dbsearch", "NoResult");
				this.invalidSearchString = this.searchTerm;
			}
			
			if(this.owner.getCurrentContentResultItem()) {
				var resultObj;
				resultObj = this.$["dbNode-"+this.owner.getCurrentContentResultItem()].getResultObj() || []; 
				if(resultObj && resultObj.length == 0)                                                                                       
                    this.owner.showView("content");    
				else                                       
                    this.owner.updateContentResults(resultObj);
			}
		}
		else {
			nodeId = this.dbRTItems[0];
			if(this.DbSearchItems[nodeId].batchQuery) {
				this.$["service-"+nodeId].call({operations:this.DbSearchItems[nodeId].dbQuery});
			}
			else {
				this.$["service-"+nodeId].call({query:this.DbSearchItems[nodeId].dbQuery});
			}
			this.dbRTItems.splice(0,1);
		}
	},
	
	handleDbSearchItemTap: function(inSender, inEvent) {
		var resultObj = {};
		resultObj.conArray = inSender.getResultObj() || [];
		resultObj.conTemplate = this.DbSearchItems[inSender.getDbSearchItemId()];
		this.owner.showContentResults(resultObj);
	},
	
	displayDbResultInGroup: function() {
		if(this.owner.getCurrentContentResultItem())
			return;
		if(!this.dbExpandedNodeId)
			return;
		if(this.$["dbNode-"+this.dbExpandedNodeId].getResultObj().length > 0 && this.$["dbNode-"+this.dbExpandedNodeId].getResultObj().length <= 5) {
			this.dbExpandedNodeResult = this.$["dbNode-"+this.dbExpandedNodeId].getResultObj();
			this.$["dbGroup-"+this.dbExpandedNodeId].render();
			this.$.dbGroupInnerDrawerItem.setShowing(true);
			this.$.dbGroupInnerDrawer.setOpen(true);
		}
		else {
			this.dbExpandedNodeResult.splice(0, this.dbExpandedNodeResult.length);
			this.$.dbGroupInnerList && this.$.dbGroupInnerList.render();
			this.$.dbGroupInnerDrawer && this.$.dbGroupInnerDrawer.setOpen(false);
			this.$.dbGroupInnerDrawer && this.$.dbGroupInnerDrawerItem.setShowing(false);	
		}
	},
	
	getDbContentItem: function(inSender, inIndex) {
		if(inIndex < this.dbExpandedNodeResult.length) {
			this.$.dbGroupInnerListContent.setDisplayFields(this.DbSearchItems[this.dbExpandedNodeId].displayFields);
			this.$.dbGroupInnerListContent.setContentDetails(this.dbExpandedNodeResult[inIndex]);
			if(inIndex == this.dbExpandedNodeResult.length-1)
				this.$.dbGroupInnerListContent.addClass("enyo-last");
			return true;
		}
	},
	
	handleContentItemTap: function(inSender, inEvent) {
		var launchParam = {};
		var item = this.dbExpandedNodeResult[inEvent.rowIndex];
		launchParam[this.DbSearchItems[this.dbExpandedNodeId].launchParam] = item[this.DbSearchItems[this.dbExpandedNodeId].launchParamDbField];
		enyo.$.justTypeApp.$.appLauncher.launchApp(this.DbSearchItems[this.dbExpandedNodeId].id, launchParam);
	},
	
	showNoResultMessage: function(forceHide) {
		if(forceHide) {
			this.$.noResultMsg.setShowing(false);
			return;
		}
			
		if(this.owner.getControllerState('dbsearch') == "NoResult") {
			var dbComponents = this.$.dbContainer.getControls();
			for(var i = 0; i < dbComponents.length; i++) {
				dbComponents[i].setShowing(false);
			}
			this.$.noResultMsg.setShowing(true);
		}
		else
			this.$.noResultMsg.setShowing(false);
	},
	
	cleanup: function() {
		this.invalidSearchString = undefined;
		this.$.noResultMsg.setShowing(false);
		this.DbSearchResults.splice(0, this.DbSearchResults.length);
		
		this.dbExpandedNodeResult.splice(0, this.dbExpandedNodeResult.length);
		this.$.dbGroupInnerList && this.$.dbGroupInnerList.render();
		this.$.dbGroupInnerDrawer && this.$.dbGroupInnerDrawer.setOpen(false);
		this.$.dbGroupInnerDrawer && this.$.dbGroupInnerDrawerItem.setShowing(false);
		
		var dbComponents = this.$.dbContainer.getControls();
		for(var i = 0; i < dbComponents.length; i++) {
			dbComponents[i].setShowing(false);
		}
	}

});

enyo.kind({
	name: "DbSearchItem",
	kind: enyo.Item,
	tapHighlight: true,
	published: {
		dbSearchItemName: "",
		dbSearchItemId: "",
		iconFilePath:"",
		dbSearchResult: {},
		resultObj : []
	},
	components: [
		{
			kind: "HFlexBox",
			align: "center",
			components: [
				{name:"icon", className:"list-icon"},
				{name: "label"},
				{flex : 1},
				{name: "resultCountContainer", className:"results-count-container", components:[
				                                                                                {name:"resultsCount", className:"results-count"}
				]}
			]
		}
	],
	create: function() {
		this.inherited(arguments);
		this.$.label.content = enyo.string.escapeHtml(this.dbSearchItemName);
		if(this.dbSearchItemId == "com.palm.app.email" || this.dbSearchItemId == "com.palm.app.enyo-email")
			this.$.icon.addClass("email");
		else if(this.dbSearchItemId == "com.palm.app.browser")
			this.$.icon.addClass("web");
		else if(this.iconFilePath && !Util.isBlank(this.iconFilePath))
			this.$.icon.applyStyle("background-image", "url(" + this.iconFilePath + ")");
		else
			this.$.icon.addClass("generic");
	},
	
	dbSearchResultChanged: function() {
		this.resultObj.splice(0, this.resultObj.length);
		if(this.dbSearchResult.responses) {
			for(var i=0; i < this.dbSearchResult.responses.length; i++) {
				this.resultObj = this.resultObj.concat(this.dbSearchResult.responses[i].results);
			}
		}
		else 
			this.resultObj = this.dbSearchResult.results || [];
		
		if(!this.resultObj)
			return;
		if(this.resultObj.length == 0) {
			this.container.setShowing(false);
			return;
		}
		else {
			this.container.setShowing(true);
			this.$.resultsCount.setContent(this.resultObj.length);
			this.$.resultCountContainer.addClass('visible');
		}
	}
});