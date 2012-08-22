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
	name: "LaunchPointSearch",
	kind: "HFlexBox",
	published: {
		searchTerm: "",
		preferences:""
	},
	events: {
		onAppLaunched:""
	},
	
	kEasterStrings: ["upupdowndownleftrightleftrightbastart", "webos20090606"],
	kEasterApp: { 
	title: 'Developer Mode Enabler',  
	icon: '/usr/palm/applications/com.palm.app.devmodeswitcher/icon.png',  
	id: 'com.palm.app.devmodeswitcher', 
	params: {} 
	},
	
	components: [
		{name: "appContainerGroup",kind: "RowGroup", caption:$L("Launch"), showing:false, components:[
					{kind:"HFlexBox", name:"appContainer", domAttributes: {name: "appContainer"}
					
					}]
		},
		{kind:"PalmService", name:"appSearch", service:"palm://com.palm.applicationManager/", method:"searchApps", onResponse: "handleAppSearchResponse"},
		{kind:"PalmService", name:"listLaunchPoints", service:"palm://com.palm.applicationManager/", method:"listLaunchPoints", onResponse:"handleListLaunchPoints"},
		{kind:"PalmService", name:"launchPointChanges", service:"palm://com.palm.applicationManager/", method:"launchPointChanges", subscribe:true, onResponse:"handleLaunchPointChanges"},
		{kind:"PalmService", name:"launch", service:"palm://com.palm.applicationManager/", method:"launch"},
	],
	
	create: function() {
		this.inherited(arguments);
		this.allApps = [];
		this.searchApps = [];
		this.$.listLaunchPoints.call();
		this.$.launchPointChanges.call();
	},
	
	preferencesChanged: function() {
		if(this.preferences == "true")
			this.owner.addControllerState("apps");
		else
			this.owner.removeControllerState("apps");
	},
	
	handleListLaunchPoints: function(inSender, inResponse) {
		this.allApps = inResponse.launchPoints || [];
	},
	
	handleLaunchPointChanges: function(inSender, inResponse) {
		if (inResponse.change === "added") {
			inResponse.change = undefined; // besides the 'change' field, this is a full blown JSON app object
			this.addApplication(inResponse);
		} 
		else if (inResponse.change === "removed") {
			inResponse.change = undefined;
			this.removeApplication(inResponse.launchPointId);
		}
		else if (inResponse.change === "updated") {
			inResponse.change = undefined;
			if (!this.updateAppInfo(inResponse)) {
				enyo.log("Failed to update launchPoint " ,inResponse);
			}
		}
	},
	
	addApplication: function(newApp) {

		if (!this.updateAppInfo(newApp)) {
			this.allApps.push(newApp);
		}
	},
	
	removeApplication: function(launchPointId) {
		for (var i=0; i<this.allApps.length; i++) {
			if (this.allApps[i].launchPointId == launchPointId) {
				this.allApps.splice(i,1);
				break;
			}
		}
	},
	
	updateAppInfo: function(newAppInfo) {
		
		var success = false;
		for (var i=0; i<this.allApps.length; i++) {
			if (this.allApps[i].launchPointId == newAppInfo.launchPointId) {
				this.allApps[i] = newAppInfo;
				success = true;
				break;
			}
		}
		return success;
	},
	
	
	getAppInfo: function(launchPointId) {
		for (var i=0; i<this.allApps.length; i++) {
			if (this.allApps[i].launchPointId == launchPointId) {
				return this.allApps[i];
			}
		}
		return null;
	},
	
	
	searchTermChanged: function() {
		if(this.preferences == "false")
			return;
		this.$.appSearch.call({keyword:this.searchTerm});
	},
	
	handleAppSearchResponse: function(inSender, inResponse) {
		if(!inResponse.apps)
			return;
			
		this.searchApps.splice(0, this.searchApps.length);
		if (this.kEasterStrings.indexOf(this.searchTerm) !== -1) {
			this.searchApps.push(this.kEasterApp);
		}
			
		var matchingApps = inResponse.apps;
		var appInfoObj;
		
		for(var i = 0; i< matchingApps.length; i++) {
			appInfoObj = this.getAppInfo(matchingApps[i].launchPoint);
			if(appInfoObj != null)
				this.searchApps.push(appInfoObj);
		}
		this.updateLauncherIconsDiv();
	},
	
	updateLauncherIconsDiv: function() {
		
		var appInfo;
		this.$.appContainer.destroyControls();
		
		if(this.searchApps.length == 0) {
			this.$.appContainerGroup.setShowing(false);
			this.owner.updateControllerState("apps", "NoResult");
			return;
		}
		
		this.$.appContainerGroup.setShowing(true);
		for (var i = 0; i < this.searchApps.length; i++) {
			appInfo = this.searchApps[i];
			
			this.$.appContainer.createComponent({
				owner: this,
				onclick: "handleAppSelection",
				className:"app-wrapper",
				appInfo: appInfo,
				components: [{
					kind: "Image",
					domAttributes: {name: "appIcon"},
					src: appInfo.icon,
					className: "icon-launch"
				}, {
					domAttributes: {name: "appTitle"},
					content: Util.highlightString(this.searchTerm, appInfo.title),
					className: "name"
				}]
			});
		}
		this.$.appContainer.render();
		this.owner.updateControllerState("apps", "FoundResult");
	},
	
	cleanup: function() {
		this.$.appContainer.destroyControls();
		this.$.appContainerGroup.setShowing(false);
		this.searchApps.splice(0, this.searchApps.length);
	},
	
	handleAppSelection: function(inSender, inEvent) {
		var appInfo = inSender.appInfo;
		var target = inEvent.target;
		if(target && (target.getAttribute("name") == "appTitle" || target.getAttribute("name") == "appIcon")) {
			target = target.parentNode;
		}
		else if(target && target.getAttribute("name") == "appContainer") {
			target = target.firstChild;
		}
		target = target.querySelector('[name="appIcon"]');
		if(!target) {
			this.$.launch.call({id: appInfo.id, params:appInfo.params});
			return;
		}
		var iconWidth = target.clientWidth;
		var iconHeight = target.clientHeight;
		var iconOffset = enyo.dom.calcNodeOffset(target);
		window.PalmSystem.applyLaunchFeedback(iconOffset.left + iconWidth / 2, 
				  iconOffset.top + iconHeight / 2);
		
		this.$.launch.call({id: appInfo.id, params:appInfo.params});
	},
	
	highlightApps: function() {	
		var cont = this.$.appContainer.getControls();
		if(cont && cont.length > 0) {
			var id =  cont[0].name;
			id && this.$[id].addClass("enyo-focus-app");
		}
		this.owner.currentHighlightedControl(this.$[id]);
	},
	
	onEnterKey: function(appObj) {
		if(!appObj)
			return;
		var appInfo = appObj.appInfo;
		this.$.launch.call({id: appInfo.id, params:appInfo.params});
	}
});
