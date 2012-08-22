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
	name: "JustType",
	kind: "VFlexBox",
	className: "search-background",
	components:[
		{
				kind: "RichText",
				hint:$L("Just type..."),
				name: "searchField",
				richContent:false,
				autoCapitalize:"lowercase",
				autocorrect: false,
				spellcheck: false,
				autoWordComplete: false,
				autoEmoticons: false,
				oninput: "onValueChange",
				onkeydown: "handleKeyPress",
				components: [{
					name: "searchFieldIcon",
					onclick: "clearSearchText",
					onmousedown:"searchFieldIconMouseDown",
					className: "enyo-search-input-search"
				}]
			}, 
			{kind: "Control", name:"tabControl", showing:false, components: [
                        {kind: "RadioGroup", onclick: "tabClickHandler", components: [
						{disabled: true,  value: 0},
                                {label: $L('All'), name: 'rgAll', value: 1, disabled: false},
                                {label: $L('Contacts'), name:'rgContacts', value: 2, disabled: false},
                                {label: $L('Content'), name:'rgContent', value: 3, disabled: false},	
								{label: $L('Actions'), name:'rgActions', value: 4, disabled: false},
								{disabled: true,  value: 5},
                        ]},
	
                ]
			},
			{kind: "Control", className: "enyo-search-header-shadow"},	
			{
				kind: "Pane",
				name: "bottompane",
				height: "100%",
				components: [
					{kind: "HomeView", viewKind:"HomeView", onRecentSearchStringSelected:"doSearchOnRecentString"},
			 		{kind: "MainView", viewKind: "MainView"}
				]
			},
			{kind: "AppMenu", components: [
			                   			{caption: $L("Preferences"), onclick: "launchPreferences"},
			                   			{kind: "HelpMenu", target: 'http://help.palm.com/universalsearch/index.html'},
			                   		]
			}
			
	],
	create: function() {
		this.inherited(arguments);
		this.loadLibraries();
		this.delayedDoSearch = Util.debounce(undefined, enyo.bind(this, "doSearch"), 0.5);
		this.wasValidEmailOrWebString = false;
		this.$.radioGroup.setValue(1);
	},
	loadLibraries: function() {
		try {
	        var contactLib = MojoLoader.require({ name: "contacts", version: "1.0" });
	        window.ContactsLib = contactLib.contacts;

	    	} catch (error) {
	                enyo.error("failed to load Contacts library" , error);
	    	  }
	},
	
	clearSearchText: function(inSender, inEvent) {
		if(inSender) {
			var cName = inSender.getClassName();
			if(cName.indexOf("enyo-search-input-cancel") == -1)
				return;
		}
		this.$.searchField.setValue("");
		this.filterText = undefined;
		this.$.searchFieldIcon.removeClass("enyo-search-input-cancel");
		this.$.bottompane.selectViewByName("homeView");
		this.wasValidEmailOrWebString = false;
		this.$.mainView.cleanup();
		this.$.tabControl.setShowing(false);
	},
	
	onValueChange: function(inSender, inEvent, inValue) {
		this.filterText = inValue;
		if (this.filterText.length == 0) {
			this.$.searchFieldIcon.removeClass("enyo-search-input-cancel");
			this.$.bottompane.selectViewByName("homeView");
			this.$.mainView.cleanup();
			this.$.tabControl.setShowing(false);
			return;
		}
		
		this.$.searchFieldIcon.addClass("enyo-search-input-cancel");
		if(this.filterText.length >= 3)
			this.updateEmailOrWebDiv();
		this.delayedDoSearch();
	},
	
	handleKeyPress: function(inSender,inEvent) {
		if(inEvent && inEvent.keyCode == 13 ) {
			enyo.stopEvent(inEvent);
			this.$.mainView.enterKeyAction();
		}
	},
	
	tabClickHandler: function(inSender, inEvent) {
		if(inSender.value === 1)
			this.$.mainView.showView("all");
		else if(inSender.value === 2)
			this.$.mainView.showView("contacts");
		else if(inSender.value === 3)
			this.$.mainView.showView("content");
		else if(inSender.value === 4)
			this.$.mainView.showView("actions");
	},
	
	forceFocus: function() {
		this.$.searchField.$.input.hasNode().focus();
		this.$.bottompane.selectViewByName("homeView");
	},
	forceBlur: function() {
		this.$.searchField.$.input.hasNode().blur();
	},
	doSearch: function() {
		if (this.filterText.length == 0) 
			return;
		this.$.tabControl.setShowing(true);
		this.$.bottompane.selectViewByName("mainView");
		this.$.mainView.setSearchTerm(this.filterText);
	},
	
	doSearchOnRecentString: function(inSender, inEvent) {
		var str = inSender.getSearchString();
		this.$.searchField.setValue(str);
		this.onValueChange(null, null, str);
	},
	
	updateEmailOrWebDiv: function() {
  		if(Util.isValidEmailAddress(this.filterText)) {
  			this.$.radioGroup.setValue(4);
  			this.$.mainView.$.actions.setPossibleActionItem('emailorweb');
  			this.$.mainView.showActionsOnly();	
  			this.wasValidEmailOrWebString = true;
		}
		else if(this.wasValidEmailOrWebString) {
			this.wasValidEmailOrWebString = false;
			this.$.radioGroup.setValue(1);
			this.$.mainView.$.actions.setPossibleActionItem('');
			this.$.mainView.showView('all');
		}		
	},
	
	getFilterText: function() {
		return this.filterText;
	},
	
	launchPreferences: function() {
		enyo.$.justTypeApp.$.appLauncher.launchPreferences();
	},
	
	justTypeDeactivated: function() {
		this.wasValidEmailOrWebString = false;
		this.$.mainView.cleanup();
		this.$.homeView.setSearchString(this.filterText);
		this.clearSearchText();
		this.forceBlur();
	},
	
	forceClearText: function() {
		this.filterText = '';
	},
	
	setViewTab: function(val) {
		this.$.radioGroup.setValue(val);
	},
	
	searchFieldIconMouseDown: function(inSender, inEvent) {
		enyo.stopEvent(inEvent);
	}
	
});
