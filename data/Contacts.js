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

ContactDbShim = function(){

	this.query = {
		'where': [],
	};
}

ContactDbShim.prototype.getQuery = function(filterString) {
	var where = [];
	where.push({'prop':"favorite", 'op':"=", 'val': false});
	if(filterString)
		where.push({'prop': "searchProperty", 'op':"?", 'val': filterString, 'collate': "primary"});
	this.query.where = where;
	this.query.orderBy = "sortKey";
	this.query.select = ["_id","name","photos","phoneNumbers","emails","favorite","ims","displayName","contactIds", "organization"];
	this.query.limit = this.QUERY_LIMIT;
	
	return this.query;
}

ContactDbShim.prototype.getFavoriteQuery = function(filterString) {
	var where = [];
	where.push({'prop':"favorite", 'op':"=", 'val': true});
	if(filterString)
		where.push({'prop': "searchProperty", 'op':"?", 'val': filterString, 'collate': "primary"});
	this.query.where = where;
	this.query.orderBy = "sortKey";
	this.query.select = ["_id", "name","photos","phoneNumbers","emails","favorite","ims","displayName","contactIds","organization"];
	this.query.limit = this.QUERY_LIMIT;
	
	return this.query;
}

ContactDbShim.prototype.getSpeedDialQuery = function(filterString) {
	var where = [];
	where.push({'prop':"phoneNumbers.speedDial", 'op':"=", 'val': filterString});
	this.query.where = where;
	this.query.orderBy = undefined;
	this.query.limit = this.QUERY_LIMIT;
	
	return this.query;
}

ContactDbShim.prototype.QUERY_LIMIT = 20;
