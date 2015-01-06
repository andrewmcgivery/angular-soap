angular.module('angularSoap', [])

.factory("$soap",['$q',function($q){
	return {
		get: function(url, action, params){
			var deferred = $q.defer();
			
			//Create SOAPClientParameters
			var soapParams = new SOAPClientParameters();
			for(var param in params){
				soapParams.add(param, params[param]);
			}
			
			//Create Callback
			var soapCallback = function(e){
				if(e.constructor.toString().indexOf("function Error()") != -1){
					deferred.reject("An error has occurred.");
				} else {
					deferred.resolve(e);
				}
			}
			
			SOAPClient.invoke(url, action, soapParams, true, soapCallback);

			return deferred.promise;
		}
	}
}]);