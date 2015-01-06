angular-soap
============

An Angular port of a <a href="http://javascriptsoapclient.codeplex.com/">JavaScript SOAP Client</a> into a factory that has a similar syntax to $http.

# Usage
Before using the factory, you must import its module:

``` javascript
angular.module('myApp', ['angularSoap']);
```

Then, wherever you are going to consume it, make a reference to the $soap service for dependency injection:

``` javascript
.factory("testService", ['$soap',function($soap){
//use it here
}])
```

$soap has one method, get, which accepts the following paramaters:

| Parameter |Description | Example |
| ------------ | ------------  | ------------  |
| url | The base URL of the service | "http://www.cooldomain.com/SoapTest/webservicedemo.asmx" |
| action | The action you want to call | "HelloWorld" |
| params | An object of parameters to pass to the service | { name: "Andrew" } |

Syntax:
``` javascript
$soap.get(url,action,params);
```

Similar to $http methods, $soap.get returns a promise that you can act upon.

``` javascript
$soap.get(url,action,params).then(function(response){
	//Do Stuff
});
```

# Example 1: Hello World
A basic "Hello World" with no parameters.

``` javascript
angular.module('myApp', ['angularSoap'])

.factory("testService", ['$soap',function($soap){
	var base_url = "http://www.cooldomain.com/SoapTest/webservicedemo.asmx";

	return {
		HelloWorld: function(){
			return $soap.get(base_url,"HelloWorld");
		}
	}
}])

.controller('MainCtrl', function($scope, testService) {

  testService.HelloWorld().then(function(response){
	$scope.response = response;
  });
  
})

```