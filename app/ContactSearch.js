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
	name:"ContactSearch",
	kind:"VFlexBox",
	published: {
		searchTerm: "",
		preferences:"",
		skypeEnabled: false
	},
	events: {
		onContactSelected:""
	},
	invalidSearchString:undefined,
	searchInProgress: false,
	components: [
	             {kind:"RowGroup", name:"contactContainer", caption:$L("Contacts"), showing:false, components:[]},
	             {kind: "DbService", dbKind: "com.palm.person:1", onFailure: "dbFailure", components: [
	                     {method:"search", name:"findContacts", onSuccess:"handleContactsResults"},
	                     {method:"search", name:"findFavContacts", onSuccess:"handleFavContactsResults"}
	             ]},
	             {name: "noResultMsg", showing:false, components: [{className: "large-empty-icon"}, {className: "empty-text",content: $L("No Search Results Found")}]}
	            ],


	
	create: function() {
		this.inherited(arguments);
		this.contactsList = [];
		this.contactDb = new ContactDbShim();
	},
	
	preferencesChanged: function() {
		if(this.preferences == "true")
			this.owner.addControllerState("contacts");
		else
			this.owner.removeControllerState("contacts");
	},
	
	searchTermChanged: function() {
		if(this.preferences == "false")
			return;
		
		if (this.searchTerm && this.searchTerm.length < this.owner.SEARCHMINLENGTH) {
			this.owner.updateControllerState("contacts", "NoResult");
			this.hideContactsDiv(false);
			return;
		}
		
		if(this.invalidSearchString && this.searchTerm.length >= this.invalidSearchString.length && this.searchTerm.substr(0, this.invalidSearchString.length) == this.invalidSearchString) {
			this.owner.updateControllerState("contacts", "NoResult");
			return;
		}
		
		if(this.searchInProgress) {
			this.$.findContacts.destroy();
			this.$.findFavContacts.destroy();
			this.searchInProgress = false;
		}
		
		this.searchInProgress = true;
		this.$.findFavContacts.call({query: this.contactDb.getFavoriteQuery(this.searchTerm)});
		
	},
	
	handleFavContactsResults: function(inSender, inResponse) {
		this.contactsList = inResponse.results;
		this.$.findContacts.call({query: this.contactDb.getQuery(this.searchTerm)});
	},
	
	handleContactsResults: function(inSender, inResponse) { 
		this.searchInProgress = false;
		this.contactsList = this.contactsList.concat(inResponse.results);
		if(this.contactsList.length == 0) {
			this.owner.updateControllerState("contacts", "NoResult");
			this.invalidSearchString = this.searchTerm;
			this.hideContactsDiv();
		}
		else {
			this.populateContactList();
		}
	},
	
	populateContactList: function() {
		var filter = this.searchTerm;
		var data = this.contactsList;
		
		this.$.contactContainer.destroyControls();
		
		for(var i = 0; i < data.length; i++) {
			this.$.contactContainer.createComponent({kind:"ContactItem", contactInfo:data[i], searchTerm:this.searchTerm, owner:this});
		}
		this.$.contactContainer.setCaption(new enyo.g11n.Template($L("Contacts (#{length})")).evaluate({length:data.length}));
		this.$.contactContainer.setShowing(true);
		this.$.contactContainer.render();
		
		if(data.length == 1) {
			var conItem = this.$.contactContainer.getControls()[0];
			if(conItem && conItem instanceof ContactItem)
				conItem.toggleOpen();
		}
		this.owner.updateControllerState("contacts", "FoundResult");
		this.showNoResultMessage(true);
	},
	
	dbFailure: function(inSender, inResponse) {
		this.searchInProgress = false;
		this.hideContactsDiv();
	},
	
	hideContactsDiv: function() {
		this.contactsList.splice(0, this.contactsList.length);
		this.$.contactContainer.destroyControls();
		this.$.contactContainer.setShowing(false);	
	},
	
	showNoResultMessage: function(forceHide) {
		if(forceHide) {
			this.$.noResultMsg.setShowing(false);
			return;
		}	
		if(this.owner.getControllerState('contacts') == "NoResult" && !this.owner.$.remoteContactSearch.isGALExist()) {
			this.$.noResultMsg.setShowing(true);
		}
		else
			this.$.noResultMsg.setShowing(false);
	},
	
	highlightContact: function() {
		var contItem = this.$.contactContainer.getControls();
		if(contItem && contItem.length == 1){
			contItem[0].highlightContactDetail();
		}
		else {
			var itemName = contItem[0].name;
			this.$[itemName].addClass("enyo-focus-first-contacts");
			this.owner.currentHighlightedControl(this.$[itemName]);
		}
	},
	
	cleanup: function() {
		this.searchTerm = null;
		this.invalidSearchString = undefined;
		this.searchInProgress = false;
		this.hideContactsDiv();
		enyo.$.justTypeApp.$.appLauncher.handlePseudoContactCancel();
	},
		
});


enyo.kind({
	name: "ContactItem",
	kind: enyo.Item,
	style:"padding: 0px",
	published: {
		contactInfo: "",
		searchTerm:"",
	},
	tapHighlight:true,
	components: [
	             {kind:"Control", name:"contactLabel", align:"center", 	style:"padding: 10px;", layoutKind:"HFlexLayout", onclick:"launchContact", components:[
					//{kind:"Image", name:"avatar", className:"list-icon"},
					{className: "icon", components: [
					                                 {name: "photo", kind: "Control", className: "img"},
					                                 {kind: "Control", className: "mask"}
					]},
					{name: "label", style:"width:460px",className:"enyo-text-ellipsis"},
					{name:"favorite", className:"fav-contact",  showing:false},
					{flex: 1, onclick:"launchContact"},                                                  			          
					{className:"expand-contact", name:"expandContactName", onclick:"toggleOpen"}
					]},
	             {kind: "BasicDrawer", name: "contactDetailsDrawer", open: false,  components: []}	
	             ],
	
	create: function() {
		this.inherited(arguments);
		if(enyo.args.mock)
			this.decorateMockContactItem();
		else
			this.decorateContactItem();
	},
	
	decorateContactItem: function() {
		var contObj = this.contactInfo.type == "galcontact" ? this.contactInfo : ContactsLib.PersonFactory.createPersonDisplayLite(this.contactInfo);
		contObj.displayName = this.contactInfo.displayName ? this.contactInfo.displayName : this.contactInfo.givenName + " " + this.contactInfo.familyName;
		contObj.favorite ? this.$.favorite.setShowing(true) : this.$.favorite.setShowing(false);
		contObj.formattedContactDisplay = Util.highlightString(this.searchTerm, contObj.displayName); 
		this.$.label.content = contObj.formattedContactDisplay;
		if(Util.isBlank(contObj.listPhotoPath))
			contObj.listPhotoPath = "images/default-avatar.png"; 
		this.$.photo.applyStyle("background-image", "url(" + contObj.listPhotoPath + ");");
	},
	
	decorateMockContactItem: function() {
		var contObj = {}; 
		contObj.displayName =  "Test Contact"; 
		contObj.favorite ? this.$.favorite.setShowing(true) : this.$.favorite.setShowing(false);
		contObj.formattedContactDisplay = Util.highlightString(this.searchTerm, contObj.displayName); 
		this.$.label.content = contObj.formattedContactDisplay;
		contObj.listPhotoPath = "images/default-avatar.png";
		this.$.photo.applyStyle("background-image", "url(" + contObj.listPhotoPath + ");");
	},
	
	createDrawerItems: function() {
		this.$.contactDetailsDrawer.destroyControls();
 
		var decoratedPerson = new ContactsLib.Person(this.contactInfo);
	    if (decoratedPerson) {
			var phoneList = [];
			var i = 0;
			
			phoneList = decoratedPerson.getPhoneNumbers().getArray();
			for (; i < phoneList.length; i++) {
				phoneList[i].addrType = 'phone';
				phoneList[i].actionIcon = 'im-image';
			}
				
			phoneList = phoneList.concat(decoratedPerson.getEmails().getArray());
			for(;i<phoneList.length; i++)
				phoneList[i].addrType = 'email';
				
			phoneList = phoneList.concat(decoratedPerson.getIms().getArray());
			for (; i < phoneList.length; i++) {
				phoneList[i].addrType = 'sms';
				if(this.owner.skypeEnabled && phoneList[i].getType() === ContactsLib.IMAddress.TYPE.SKYPE)
					phoneList[i].addrType = 'skype';
			}
			
			if(phoneList.length == 0) {
				var conInfo = {
						addrType:"contact",
						x_displayType:"",
						x_displayValue:$L("No Contact Info")
					};
				phoneList.push(conInfo);
			}
			
			for (var i = 0; i < phoneList.length; i++) {
				phoneList[i].contactId = this.contactInfo._id;
				if(i == 0)
					className = "enyo-drawer-first";
				else if(i == phoneList.length-1)
					className = "enyo-drawer-last";
				else
					className = "enyo-drawer-middle";
				this.$.contactDetailsDrawer.createComponent({
					kind:"ContactDrawerItem",
					className: className,
					owner:this,
					contactDetails: phoneList[i]
				});
			}
		}   
		this.$.contactDetailsDrawer.render();
	},
	
	createMockDrawerItems: function() {
		this.$.contactDetailsDrawer.destroyControls();
		 var phoneList = [];
			
			phoneList.push({x_displayValue:"5555-5555", x_displayType:"Home", actionIcon:"im-image", addrType:"phone"});
			phoneList.push({x_displayValue:"5555-6666", x_displayType:"Home", actionIcon:"im-image", addrType:"phone"});
			phoneList.push({x_displayValue:"dotcom.com", x_displayType:"Work", actionIcon:"", addrType:"skype"});
			for (var i = 0; i < phoneList.length; i++) {
				phoneList[i].contactId = this.contactInfo._id;
				var className;
				if(i == 0)
					className = "enyo-drawer-first";
				else if(i == phoneList.length-1)
					className = "enyo-drawer-last";
						else
							className = "enyo-drawer-middle";
				this.$.contactDetailsDrawer.createComponent({
					kind:"ContactDrawerItem",
					className: className,
					owner:this,
					contactDetails: phoneList[i]
				});
			}
			this.$.contactDetailsDrawer.render();
	},
	
	toggleOpen: function(inSender, inEvent) {
		if(this.$.contactDetailsDrawer.open == true) {
			this.$.expandContactName.removeClass("expand-contact-out");
			this.$.contactDetailsDrawer.setOpen(false);
		} else {
			enyo.args.mock ? this.createMockDrawerItems() : this.createDrawerItems();
			this.$.contactDetailsDrawer.setOpen(true);
			this.$.expandContactName.addClass("expand-contact-out");
		}
		return true;
	},
	
	launchContact: function(inSender, inEvent) {
		if(this.contactInfo.type && this.contactInfo.type == "galcontact") {
			enyo.$.justTypeApp.$.appLauncher.launchPseudoContacts(this.contactInfo);
			return;
		}
		enyo.$.justTypeApp.$.appLauncher.launchExistingContact(this.contactInfo._id);
	},
	
	highlightContactDetail: function() {
		var details = this.$.contactDetailsDrawer.getControls();
		var id = details && details.length > 0 && details[0].name;
		if(details.length > 1)
			this.$[id].addClass("enyo-focus-middle");
		else
			this.$[id].addClass("enyo-focus-last");
		
		this.owner.owner.currentHighlightedControl(this.$[id]);
	},
	
	onEnterKey : function() {
		this.toggleOpen();
	},
	
	mouseholdHandler: function(inSender, inEvent) {
		return this.$.contactDetailsDrawer.getOpen();
	},
});
enyo.kind({
	name: "ContactDrawerItem",
	kind: enyo.Item,
	tapHighlight: true,
	published: {
		contactDetails:null
	},
	components: [
	             {	kind: "VFlexBox",
	     			components: [
								{kind:"Control", align:"center", layoutKind:"HFlexLayout", components:[
								
								{name:"displayTypeIcon"},
	     			             {name: "displayValue"},
	     			             {flex: 1},
	     			             {name: "displayType"},
	     			             {name:"actionIcon"},
	     			            ]},
	     			            {kind: "Menu", name:"skypePopup", width:"150px", components:[{content:$L("Chat"), value:"chat", onclick:"skypeSelect"}, {content:$L("Voice Call"), value:"voicecall",onclick:"skypeSelect"}, {content:$L("Video Call"), value:"videocall",onclick:"skypeSelect"}]}
	     			          ]
	     		}
	],
	     	
	create: function() {
		this.inherited(arguments);
		this.decorateDrawerItem();
	},
	
	decorateDrawerItem: function() {
		this.$.displayTypeIcon.setClassName("contact-"+this.contactDetails.addrType);
		this.$.displayValue.content = this.contactDetails.x_displayValue;
		this.$.displayType.content = this.contactDetails.x_displayType;
		this.$.actionIcon.setClassName(this.contactDetails.actionIcon);
	},
	
	clickHandler: function(inSender, inEvent) {
	    var target = inEvent.target;
		var sendIM = false;
		if(inSender.hasClass("im-image")){
			sendIM = true;
		}
	    var detailObj = this.contactDetails;
	    var appLauncher = enyo.$.justTypeApp.$.appLauncher; //enyo.application.appLauncher;
	    if (detailObj) {
			if (sendIM == true){
				appLauncher.launchSMS(detailObj.x_value, detailObj.contactId);
				return true;
			}
	        switch(detailObj.addrType.toLowerCase()) {
	        	case 'email':
	        		appLauncher.launchEmail(detailObj.x_value);
	            	break;
	          	case 'phone':
	          		appLauncher.launchPhone(detailObj.x_value, detailObj.contactId, detailObj.x_type);
	            	break;
	          	case 'sms':
	          	case 'im':
	          		appLauncher.launchMessaging(detailObj.contactId, detailObj.x_value, detailObj.x_type, detailObj.serviceName, detailObj.addrType);
	            	break;
				case 'contact':
					appLauncher.launchExistingContact(detailObj.contactId);
					break;	
				case 'reminder':
					appLauncher.launchReminder(detailObj.contactId);
					break;
				case 'skype':
					this.$.skypePopup.openAroundControl(inSender);
					break;
	        }
	    }
	    return true;
	},
	
	onEnterKey : function() {
		var detailObj = this.contactDetails;
		var appLauncher = enyo.$.justTypeApp.$.appLauncher;
		switch(detailObj.addrType.toLowerCase()) {
	    	case 'email':
	    		appLauncher.launchEmail(detailObj.x_value);
	        	break;
	      	case 'phone':
	      		appLauncher.launchPhone(detailObj.x_value, detailObj.contactId, detailObj.x_type);
	        	break;
	      	case 'sms':
	      	case 'im':
	      		appLauncher.launchMessaging(detailObj.contactId, detailObj.x_value, detailObj.x_type, detailObj.serviceName, detailObj.addrType);
	        	break;
			case 'contact':
				appLauncher.launchExistingContact(detailObj.contactId);
				break;	
			case 'reminder':
				appLauncher.launchReminder(detailObj.contactId);
				break;
			case 'skype':
				this.$.skypeDetailsDrawer.toggleOpen();
				break;
			case 'galcontact':
				appLauncher.launchPseudoContacts(this.mainAssistant.getGALContact());
				break;
		}
	},
	
	skypeSelect: function(inSender, inEvent) {
	    var appLauncher = enyo.$.justTypeApp.$.appLauncher;
	    switch(inSender.getValue()) {
		case 'voicecall': appLauncher.launchSkypeCall(this.contactDetails.x_value, this.contactDetails.contactId, this.contactDetails.x_type, false);
					  break;
		case 'videocall': appLauncher.launchSkypeCall(this.contactDetails.x_value, this.contactDetails.contactId, this.contactDetails.x_type, true);
							break;
		case 'chat': appLauncher.launchMessaging(this.contactDetails.contactId, this.contactDetails.x_value, this.contactDetails.x_type, this.contactDetails.serviceName, this.contactDetails.addrType);
						break;
		}
	    return true;
	}
});