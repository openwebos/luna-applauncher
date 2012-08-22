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
	name:"Actions",
	kind:"VFlexBox",
	published: {
		searchTerm: "",
		actionEngines: [],
		possibleActionItem:""
	},
	events: {
		
	},
	ACTIONITEMSLIMIT: 4,
	components: [
		{
			kind: "RowGroup",
			name: "actionListGroup",
			caption: $L("Quick Actions")
		},
		{
			kind:"PalmService", name:"launch", service:"palm://com.palm.applicationManager/", method:"launch"
		}
			
	],
	
	create: function() {
		this.inherited(arguments);
	},
	
	actionEnginesChanged: function() {
		this.populateActionList(true);
	},
	
	populateActionList: function(limitItem) {
		
		this.$.actionListGroup.destroyControls();
		
		if(this.actionEngines.length == 0)
			this.$.actionListGroup.setShowing(false);
		else 
			this.$.actionListGroup.setShowing(true);
		
		var numberOfItems = 0;
		var enabledItems = 0;
		for(var j = 0; j < this.actionEngines.length; j++) {
			if(this.actionEngines[j].enabled) 
				enabledItems++;
		}
		for(var i = 0; i < this.actionEngines.length; i++) {
			if(this.actionEngines[i].enabled) {
				numberOfItems++;
				if(limitItem && numberOfItems > this.ACTIONITEMSLIMIT && (enabledItems-numberOfItems) >= 1) {
					this.$.actionListGroup.createComponent({
						kind: "ActionItem",
						actionEngineName: $L("More..."),
						actionInfo: {id:"moreactions", displayName:$L("More..."), iconFilePath:"/usr/lib/luna/system/luna-applauncher/images/search-icon-new.png"},
						onItemClicked: "handleActionItemSelected",
						owner: this
					});
					break;
				}
				
				this.$.actionListGroup.createComponent({
						kind: "ActionItem",
						actionEngineName: this.actionEngines[i].displayName,
						actionInfo: this.actionEngines[i],
						onItemClicked: "handleActionItemSelected",
						owner:this
					});
			}
		}
		
		this.$.actionListGroup.render();
		if(this.$.actionListGroup.getControls().length > 0)
			this.$.actionListGroup.setShowing(true);
		else
			this.$.actionListGroup.setShowing(false);
	},
	
	handleActionItemSelected: function(inSender, inEvent) {
		var item = inSender.getActionInfo();
		
		if(!item)
			return;
		
		if(item.id && item.id == 'moreactions') {
			this.populateActionList(false);
			return;
		}
		
		var syntax = /(^|.|\r|\n)(#|{\s*(\w+)\s*})/;
		var appinfo = {};
		appinfo.id = item.url;
		appinfo.params = {};
		
		if(appinfo.id == "com.palm.app.email" && this.possibleActionItem == 'emailorweb') {
			//Launch email with the address.
			enyo.$.justTypeApp.$.appLauncher.launchEmail(this.searchTerm);
			return;
		}

		var launchParam = this.convertLaunchParams(item.launchParam);
		var paramType = Util.ObjectType(launchParam);
		
		if (paramType == "string") {
			appinfo.params[launchParam] = enyo.$.justTypeApp.$.justType.getFilterText();
		}
		else if (paramType == "object") {
			temp = new Util.Template(item.launchParam, syntax);
			appinfo.params = temp.evaluate({searchTerms: enyo.$.justTypeApp.$.justType.getFilterText(), searchTerm: enyo.$.justTypeApp.$.justType.getFilterText()});
		}
		else {
			enyo.log("Error - Universal Search - Quick Action App Launch Parameter Type is not supported")
			return;
		}
		
		this.$.launch.call({id: appinfo.id, params:appinfo.params});
		this.owner.owner.forceClearText();
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
	
	cleanup: function() {
		this.populateActionList(true);
		this.possibleActionItem = '';
	}
	
});

enyo.kind({
	name: "ActionItem",
	kind: enyo.Item,
	tapHighlight: true,
	published: {
		actionEngineName: "",
		actionInfo:""
	},
	events: {
		onItemClicked:""
	},
	components: [
	             {kind: "HFlexBox", components:[
	                                            {kind:"Image", name:"icon", className:"list-icon"},
	                                            {name:"label",className:"action-list-label"}
	                                            ]}
	],
	
	create: function() {
		this.inherited(arguments);
		this.$.label.content = enyo.string.escapeHtml(this.actionEngineName);
		this.$.icon.setSrc(this.actionInfo.iconFilePath);
	},
	
	clickHandler: function(inSender, inEvent) {
		this.doItemClicked();
	}
});