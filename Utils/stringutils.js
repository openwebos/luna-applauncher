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

StringUtil = {}

StringUtil.isBlank = function isBlank( str ) {
    // Use RegExp.test to check since we don't care about the matching string.
    return (/^\s*$/).test(str);
};

StringUtil.escapeCharacterMap = {
	"<":"&lt;",
	">":"&gt;",
	"&":"&amp;",
	"\"":"&quot;",
	"'":"&apos;"
};

StringUtil.entityRegex =  /[<>&]/g;

StringUtil.escapeCommon = function(stringToEscape, regex, characterMap) {
	function replaceFromMap(c) {
		return characterMap[c];
	}
	return stringToEscape.replace(regex, replaceFromMap);
};

StringUtil.escapeHTML = function(stringToEscape) {
	if(Util.ObjectType(stringToEscape) == "number")
		return stringToEscape;
	return StringUtil.escapeCommon(stringToEscape, StringUtil.entityRegex, StringUtil.escapeCharacterMap);
};