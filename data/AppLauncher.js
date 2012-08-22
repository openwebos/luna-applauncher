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
	name:"AppLauncher",
	kind: "Component",
	components: [
	             {kind:"PalmService", name:"launch", service:"palm://com.palm.applicationManager/", method:"open"},
	             {name: "contactPseudoDetails", kind: "com.palm.library.contactsui.detailsDialog", showDone: false, onAddToNew: "addToNewContact", onAddToExisting: "addToNewContact", onCancelClicked:"handlePseudoContactCancel"}
	],
	
	create:function() {
		this.inherited(arguments);
	},
	
	launchEmail: function(address) {
  		this.$.launch.call({target:'mailto:'+address});
  	},
  	
  	launchBrowser: function(url) {
		var params = {scene: 'page', target: url};
		this.$.launch.call({id:"com.palm.app.browser", params:params});		
	},
	
	launchMessaging: function(contactId, addr, label, serviceName, type) {
  		var params = {};
		if(serviceName && type)
    		params = {"personId":contactId, "address":addr, "serviceName":serviceName, "type":type}
		else
			params = {"compose":{"ims":[{"value":addr, "type":label}],"personId":contactId}};
		this.$.launch.call({id:'com.palm.app.messaging', params:params});    
  	},
	
	launchSMS: function(addr,contactId) {
  		var params = {};
		params = {"compose":{"phoneNumbers":[{"value":addr}], "personId":contactId}};
		this.$.launch.call({id:'com.palm.app.messaging', params:params});     
  	},
	
	launchPhone: function(number, id, label) {
		var params = {};
		if(number == 1)
			params = {"action": "voicemail"};
		else{
			if(id && label){
				params = {"address":number,"personId":id,"label":label, "service":"phone"}
			}
			else
				params = {"address": number, "service":"phone"};
		}
		params.transport = "com.palm.telephony";
		this.$.launch.call({id:'com.palm.app.phone', params:params});         
	},
	
	launchSkypeCall: function(number, id, label, isVideoCall) {
		var params = {"address":number, "service":"type_skype"};
		if(id)
			params.personId = id;
		if(label)
			params.label  = label;
		params.transport = "com.palm.skype.call";
		params.video = isVideoCall;
		this.$.launch.call({id:'com.palm.app.phone', params:params});      
	},
	
	launchSkypePhone: function(number, id, label) {
		var params = {"address":number, "service":"type_skype"};
		if(id)
			params.personId = id;
		if(label)
			params.label  = label;
		
		this.$.launch.call({id:'com.palm.app.phone', params:params});          
	},
	
	launchAddToContacts: function(number,type) {
		
		var newContact = ContactsLib.ContactFactory.createContactDisplay();
		if(type == "phone") {
			newContact.getPhoneNumbers().add(new ContactsLib.PhoneNumber({value: number}));
		}
		else if(type === "email") {
			newContact.getEmails().add(new ContactsLib.EmailAddress({value: number}));
		}
		var params = {
			launchType: "pseudo-card",
			contact:newContact
		};
		ContactsLib.App.launchContactsAppToPseudoDetailScene(params);
	},
	
	launchPseudoContacts: function(contact) {
		var contactObj =  this.createContactDisplay(contact); 
		this.$.contactPseudoDetails.validateComponents();
		this.$.contactPseudoDetails.setContact(contactObj);
		this.$.contactPseudoDetails.openAtCenter();
	},
	
	addToNewContact: function() {
		this.$.contactPseudoDetails.close();
	},
	
	handlePseudoContactCancel: function() {
		
		this.$.contactPseudoDetails.close();
	},
	
	createContactDisplay: function(contact) {
		var newContact = ContactsLib.ContactFactory.createContactDisplay();
		if(contact.givenName)
			newContact.getName().setGivenName(contact.givenName);
		if(contact.familyName)
			newContact.getName().setFamilyName(contact.familyName);
		
		if(contact.phoneNumbers) {
			for(var i=0; i<contact.phoneNumbers.length; i++) {
				var phoneNumber = contact.phoneNumbers[i];
				newContact.getPhoneNumbers().add(new ContactsLib.PhoneNumber({value: phoneNumber.value, type:phoneNumber.type}));
			}
		}
		
		if(contact.emails) {
			for(var i=0; i<contact.emails.length; i++) {
				var email = contact.emails[i];
				newContact.getEmails().add(new ContactsLib.EmailAddress({value: email.value, type:email.type}));
			}
		}
		
		if(contact.addresses) {
			for(var i=0; i<contact.addresses.length; i++) {
				var type;
				var address = contact.addresses[i];
				
				if(typeof address === "object") {
					type = address.type;
					
					if(address.value) {
						address = new enyo.g11n.Address(address.value);
					}
					newContact.getAddresses().add({
						streetAddress: address.streetAddress,
						locality: address.locality,
						region: address.region,
						postalCode: address.postalCode,
						country: address.country,
						type: type
					});
				}
			}
		}
		
		if(contact.jobTitle) {
			newContact.getOrganizations().add(new ContactsLib.Organization({title: contact.jobTitle}));
		}
		
		return newContact;
	},
	
	launchExistingContact: function(id) {
		var params = {'id': id, 'launchType':'showPerson'};
		this.$.launch.call({id:'com.palm.app.contacts', params:params});   
	},
	
	launchReminder:function(id){
		var params = {
			launchType:"reminder",
			personId:id,
			focusField:true
		}
		this.$.launch.call({id:'com.palm.app.contacts', params:params});  	
	},
	
	launchHelp: function() {
		 var params =  {target: 'http://help.palm.com/universalsearch/index.html'};
		 this.$.launch.call({id:"com.palm.app.help", params:params});
	},
	
	launchPreferences: function() {
		 this.$.launch.call({id:"com.palm.app.searchpreferences"});
	},
	
	launchApp: function(id, param) {
		this.$.launch.call({id:id, params:param});
	},
	
});