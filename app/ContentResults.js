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
	name: "ContentResults",
	kind: "VFlexBox",
	published:{
		contentArray:[],
		contentTemplate:{}
	},
	components: [
	             {kind:"RowGroup", name:"contentContainer", caption:""}
	            ],
	create: function() {
		this.inherited(arguments);	
	},
	
	contentArrayChanged: function() {
		this.$.contentContainer.destroyControls();
		if(this.contentArray.length > 0) {
			this.$.contentContainer.setCaption(this.contentTemplate.displayName + " (" + this.contentArray.length + ")");
			for(var i = 0; i < this.contentArray.length; i++)
				this.$.contentContainer.createComponent({kind:"ContentItem", displayFields: this.contentTemplate.displayFields, contentDetails:this.contentArray[i], onclick:"handleContentItemTap", owner:this});
			this.$.contentContainer.render();
		}
		else 
			this.setShowing(false);
	},
	
	handleContentItemTap: function(inSender, inEvent) {
		var launchParam = {};
		launchParam[this.contentTemplate.launchParam] = inSender.getContentDetails()[this.contentTemplate.launchParamDbField];
		enyo.$.justTypeApp.$.appLauncher.launchApp(this.contentTemplate.id, launchParam);
	},
	
	cleanup: function() {
		this.$.contentContainer.destroyControls();
		this.setShowing(false);
	}
});

enyo.kind({
	name: "ContentItem",
	kind: enyo.Item,
	tapHighlight: true,
	published: {
		contentDetails: null,
		displayFields:[]
	},
	components: [
		{
			kind: "HFlexBox", align:"center", 
			components: [
			             {kind:"VFlexBox", components:[
			                                           {name:"displayField1", allowHtml:true, className:"dbcontent-display1"},
			                                           {name:"displayField2", allowHtml:true, className:"dbcontent-display2"},
			                                           {name:"displayField3", allowHtml:true, className:"dbcontent-display3"},
			             ]},
			             {flex: 1},
			             {name:"resultIcon"}
			          ]
		}
	],
	
	create: function() {
		this.inherited(arguments);
		if(this.contentDetails)
			this.decorateContentItem();
	},

	contentDetailsChanged: function() {
		this.decorateContentItem();
	},
	
	decorateContentItem: function() {
		
		var filterText = enyo.$.justTypeApp.$.justType.getFilterText();
		var obj = this.contentDetails;
		var msg;
		
		for(var j = 0; j < this.displayFields.length && j < 3; j++) {
			var fieldName = undefined;
			var fieldType = undefined;
			
			if(Util.ObjectType(this.displayFields[j]) == "object") {
				fieldName = this.displayFields[j].name;
				fieldType = this.displayFields[j].type;
			}
			else {
				fieldName = this.displayFields[j];
			}
			
			if(fieldName.indexOf('.') != -1){
				msg = Util.highlightString(filterText, StringUtil.escapeHTML(this.fetchValueFromObject(obj, fieldName) || ""));
			}
			else 
				msg = Util.highlightString(filterText, StringUtil.escapeHTML(obj[fieldName] || ""));
			
			if(fieldType && fieldType == "timestamp") {
				var value = new Date(msg);
				var DateFmt = new enyo.g11n.DateFmt({date:"long", time:"short", twelveHourFormat:true});
				msg = DateFmt.format(value) || msg;	
			}	
			this.$["displayField"+(j+1)].setContent(msg);	
		}
			
		if(obj._kind && obj._kind == "com.palm.browserbookmarks:1") 
			this.$.resultIcon.setClassName("bookmark-icon");
		else if(obj._kind && obj._kind == "com.palm.browserhistory:1")
			this.$.resultIcon.setClassName("history-icon");
	},
	
	fetchValueFromObject: function(obj, field) {
		var tokenArray = field.split(".");
		var lastElement = tokenArray.length-1;
		var localObj = enyo.clone(obj);
		
		for(var i= 0; i<lastElement; i++) {
			localObj = localObj[tokenArray[i]];
		}	
		return localObj[tokenArray[lastElement]];
	}
});