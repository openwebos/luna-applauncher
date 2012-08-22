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
	name: "LaunchItems",
	kind: "VFlexBox",
	published:{
		searchTerm:''
	},
	components: [
	             {name:"goToWeb", kind:"RowGroup", showing:false, onclick:"launchWeb", 
					components:[{kind:"Item", layoutKind:"HFlexLayout", tapHighlight:true, 
						components:[
						{className:"go-url"}, 
						{content:$L("Go to website"), style:"line-height: 32px;"}
						]}
					]},
	            ],
	create: function() {
		this.inherited(arguments);	
	},
	searchTermChanged: function() {
		if (this.searchTerm && this.searchTerm.length < 3) {
			this.$.goToWeb.setShowing(false);
			return;
		}
	
		if(Util.isValidURL(this.searchTerm)) {	
			this.$.goToWeb.setShowing(true);
			this.owner.removeFocusOnItem();
			this.owner.currentHighlightedControl(this.$.goToWeb);
		}
		else {
			this.$.goToWeb.setShowing(false);
			this.owner.currentHighlightedControl(null);
		}
	},
	
	onEnterKey: function() {
		this.launchWeb();
	},
	
	launchWeb: function(inSender, inEvent) {
		enyo.$.justTypeApp.$.appLauncher.launchBrowser(enyo.$.justTypeApp.$.justType.getFilterText());
	},
	
	cleanup: function() {
		this.$.goToWeb.setShowing(false);
	}
});