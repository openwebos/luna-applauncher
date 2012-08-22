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

Util = {};
Util.debounce = function debounce(onCall, onTimeout, delay, optionalWindow) {
	var timeoutID;
	var savedArgs;
	var triggerFunc, timeoutFunc;
	optionalWindow = optionalWindow || window;
	
	timeoutFunc = function() {
		timeoutID = undefined;
		onTimeout.apply(undefined, savedArgs);
		savedArgs = undefined;
	};
	
	triggerFunc = function() {
		//savedArgs = _.toArray(arguments);
		if(timeoutID !== undefined) {
			optionalWindow.clearTimeout(timeoutID);
		}
		timeoutID = optionalWindow.setTimeout(timeoutFunc, delay*1000);
		return onCall && onCall.apply(this, arguments);
	};
	
	return triggerFunc;
};

Util.isBlank = function isBlank( str ) {
    // Use RegExp.test to check since we don't care about the matching string.
    return (/^\s*$/).test(str);
};

Util.Template = function Template(templateString, templatePath, escape) {
	this.templatePath = templatePath;
	this.templateString = templateString;
	this.escape = escape;
};
 
Util.Template.prototype.evaluate = function evaluate(propertiesSource) {
	var that = this;
	var replacer = function(matchedString, propertyName) {
		var i, value, firstPropertyNameCharacter, propertyNames,
			propertyNamesLength, currentPropertyName, renderingDiv,
			escapedValue, escapeRegex;
		var escape = that.escape;
		var firstCharacter = matchedString.charAt(0);

		if (firstCharacter === "\\") {
			return matchedString.slice(1);
		}

		firstPropertyNameCharacter = propertyName.charAt(0);
		if (firstPropertyNameCharacter === '-') {
			escape = false;
			propertyName = propertyName.slice(1);
		}

		if (propertyName.indexOf(".") !== -1) {
			value = propertiesSource;
			propertyNames = propertyName.split(".");
			propertyNamesLength = propertyNames.length;
			for (i = 0; value !== undefined && i < propertyNamesLength; i++) {
				currentPropertyName = propertyNames[i];
				value = value[currentPropertyName];
			}
		} else {
			value = propertiesSource[propertyName];
		}

		if (value === undefined || value === null) {
			value = "";
		}

		if (escape) {
			// Escape '<' and '&' to prevent raw HTML
			// Escape '\r' and '\n' so newlines are translated to <br> tags
			escapeRegex = /[<&\r\n]/;

			// toString() is needed to perform deferred translation in case
			// this is a "$LL object" instead of a string
			value = value.toString();

			if(value.match(escapeRegex)) {
				renderingDiv = document._renderingDiv;
				renderingDiv.innerText = value;
				escapedValue = renderingDiv.innerHTML;
				value = escapedValue;
			}
		}
		return value;
	};
	return that.templateString.replace(/\\*#?\{(-?[\w.\?]+)\}/g, replacer);
};

Util.ObjectType = function(model){
	if (model === null) {
		return "null";
	}
	else 
		if (model === undefined) {
			return "undefined";
		}
		else 
			if (typeof model == "number") {
				return "number";
			}
			else 
				if (typeof model == "string") {
					return "string";
				}
				else 
					if (model === true || model === false) {
						return "boolean";
					}
					else 
						if (Object.prototype.toString.call(model) == "[object Array]") {
							return "array";
						}
						else 
							if (typeof model == "function") {
								return "function";
							}
							else {
								return "object";
							}
};

Util.highlightString = function highlightString(filterText, unformattedText) {
	if(this.ObjectType(unformattedText) == "number")
		return unformattedText;
	var highlightSpan = "<span class=string-highlight>ZZZZ</span>";
	var patternStr = "\\b(" + filterText + ")";
	var beginPattern = new RegExp(patternStr, 'ig');
	
	var formatText = unformattedText.replace(beginPattern, function(whole, match) {
		return highlightSpan.replace('ZZZZ', match);
	});
	return formatText;
};

Util.deepCloneObjects = function (obj) {	
	 if (typeof obj !== 'object' || obj === null) {
         return obj;
     }
     var c = obj instanceof Array ? [] : {};
     for (var i in obj) {
         if (obj.hasOwnProperty(i)) {
             c[i] = this.deepCloneObjects(obj[i]);
         }
     }
     return c;
};

Util.isValidURL = function(s) {
	if(Util.regUrl.test(s))
		return true;
	else if(Util.urlDomainRegEx.test(s))
		return true;
	return false;
  	/*if(Util.urlInvalid.test(s))
		return false;
	else if(Util.httpRegEx.test(s) || Util.wwwRegEx.test(s))
		return true;
	else if(Util.urlDomainRegEx.test(s))
		return true;
	
  	return false;*/
};

Util.isValidEmailAddress = function(emailAddress) {
	if (Util.emailRegEx.test(emailAddress))
		return true;
	return false;
};

Util.getObjectKeys = function(object){
	var keys = [];
	for (var key in object) 
		if (object.hasOwnProperty(key))
			keys.push(key);
	return keys;
}

Util.emailRegEx = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.\@])+\.([A-Za-z]{2,4}) *$/;
Util.httpRegEx = /^(https?:\/\/)+?/;
Util.wwwRegEx = /^(www\.)+?/;
Util.urlDomainRegEx = /^([0-9a-zA-Z\-]+\.)+[a-zA-Z]{2,6}(\:[0-9]+)?(\S*)?$/;
Util.urlInvalid = /@/;
Util.regUrl = /^((((http|https){1}:[\/][\/]){1})|((www){1}[.]{1}))[-a-zA-Z0-9@:%_\+.~#?&//\=]+$/;

Util.phoneStringInvalid = /([\+]?)/;

