/*****************************************************************************\

 Javascript SOAP Client
 Forked from javascriptsoapclient.codeplex.com and improved by gtathub.

 For new versions check: https://github.com/gtathub/js-soap-client

 * Original work by Matteo Casati (based on v2.4 from 2007-12-21)
 * Improved by Gordon Tschirner (https://github.com/gtathub)
 * Licensed under GPLv2: https://github.com/gtathub/js-soap-client.git
\*****************************************************************************/

function SOAPClientParameters()
{
    var _pl = new Array();
    var _sl = new Array();
    this.add = function(name, value)
    {
        _pl[name] = value;
        return this;
    };
    this.addSchema = function(prefix, uri) {
        _sl[prefix] = uri;
        return this;
    };
    this.toXml = function()
    {
        var xml = "";
        for(var p in _pl)
        {
            switch(typeof(_pl[p]))
            {
                case "string":
                case "number":
                case "boolean":
                case "object":
                    xml += SOAPClientParameters._serialize(p, _pl[p]);
                    break;
                default:
                    break;
            }
        }
        return xml;
    };
    this.printSchemaList = function() {
        var list = [];

        for (var prefix in _sl) {
            if (_sl.hasOwnProperty(prefix)) {
                list.push('xmlns:' + prefix + '="' + _sl[prefix] + '"');
            }
        }

        return list.join(' ');
    }
}
SOAPClientParameters._serialize = function(t, o)
{
    var s = "";
    switch(typeof(o))
    {
        case "string":
            s += "<" + t + ">";
            s += o.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            s += "</" + t + ">";
            break;
        case "number":
        case "boolean":
            s += "<" + t + ">";
            s += o.toString(); 
            s += "</" + t + ">";
            break;
        case "object":
			//	if the object is null just output an empty tag
			if( o === null )
			{
				s += "<" + t + "/>";
				break;
			}
			
            // Date
            if(o.constructor.toString().indexOf("function Date()") > -1)
            {
        
                var year = o.getFullYear().toString();
                var month = (o.getMonth() + 1).toString();
                month = (month.length == 1) ? "0" + month : month;
                var date = o.getDate().toString();
                date = (date.length == 1) ? "0" + date : date;
                var hours = o.getHours().toString();
                hours = (hours.length == 1) ? "0" + hours : hours;
                var minutes = o.getMinutes().toString();
                minutes = (minutes.length == 1) ? "0" + minutes : minutes;
                var seconds = o.getSeconds().toString();
                seconds = (seconds.length == 1) ? "0" + seconds : seconds;
                var milliseconds = o.getMilliseconds().toString();
                var tzminutes = Math.abs(o.getTimezoneOffset());
                var tzhours = 0;
                while(tzminutes >= 60)
                {
                    tzhours++;
                    tzminutes -= 60;
                }
                tzminutes = (tzminutes.toString().length == 1) ? "0" + tzminutes.toString() : tzminutes.toString();
                tzhours = (tzhours.toString().length == 1) ? "0" + tzhours.toString() : tzhours.toString();
                var timezone = ((o.getTimezoneOffset() < 0) ? "+" : "-") + tzhours + ":" + tzminutes;
                s += "<" + t + ">";
                s += year + "-" + month + "-" + date + "T" + hours + ":" + minutes + ":" + seconds + "." + milliseconds + timezone;
                s += "</" + t + ">";
            }
            // Array
            else if(o.constructor.toString().indexOf("function Array()") > -1)
            {
				
                s += "<" + t + " SOAP-ENC:arrayType=\"SOAP-ENC:Array[" + o.length + "]\" xsi:type=\"SOAP-ENC:Array\">";
                for(var p in o)
                {
                    if(!isNaN(p))   // linear array
                    {
                        (/function\s+(\w*)\s*\(/ig).exec(o[p].constructor.toString());
                        var type = RegExp.$1;
                        switch(type)
                        {
                            case "":
                                type = typeof(o[p]);
                            case "String":
                                type = "string";
                                break;
                            case "Number":
                                type = "int";
                                break;
                            case "Boolean":
                                type = "bool";
                                break;
                            case "Date":
                                type = "DateTime";
                                break;
                        }
                        s += SOAPClientParameters._serialize("item", o[p]);
                    }
                    else    // associative array
                    {
                        SOAPClientParameters._serialize("item", o[p]);
                    }
                }
                s += "</" + t + ">";
            }
            // Object or custom function
            else
			{
				s += "<" + t + ">";
				for(var p in o)
					s += SOAPClientParameters._serialize(p, o[p]);
				s += "</" + t + ">";
			}
            break;
        default:
            break; // throw new Error(500, "SOAPClientParameters: type '" + typeof(o) + "' is not supported");
    }
    return s;
}

function SOAPClient() {}

SOAPClient.username = null;
SOAPClient.password = null;
SOAPClient.auth = false;
SOAPClient.authUser = null;
SOAPClient.authPass = null;
SOAPClient.explicitNS = false;
SOAPClient.interface = "";
SOAPClient.cors = false

SOAPClient.invoke = function(url, method, parameters, async, callback)
{
    if(async)
        SOAPClient._loadWsdl(url, method, parameters, async, callback);
    else
        return SOAPClient._loadWsdl(url, method, parameters, async, callback);
}

// private: wsdl cache
SOAPClient_cacheWsdl = new Array();

// private: invoke async
SOAPClient._loadWsdl = function(url, method, parameters, async, callback)
{
    // load from cache?
    var wsdl = SOAPClient_cacheWsdl[url];
    if(typeof wsdl != "undefined" && wsdl != "" && wsdl != "undefined")
        return SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
    // get wsdl
    var xmlHttp = SOAPClient._getXmlHttp();
    if (SOAPClient.userName && SOAPClient.password){
    	xmlHttp.open("GET", url + "?wsdl", async);
    	// Some WS implementations (i.e. BEA WebLogic Server 10.0 JAX-WS) don't support Challenge/Response HTTP BASIC, so we send authorization headers in the first request
        xmlHttp.setRequestHeader("Authorization", "Basic " + SOAPClient._toBase64(SOAPClient.userName + ":" + SOAPClient.password));
    }
    else {
    	xmlHttp.open("GET", url + "?wsdl", async);
    }
    if (SOAPClient.cors) {
    	xmlHttp.withCredentials = true;
    	xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    }
    if(async)
    {
        xmlHttp.onreadystatechange = function()
        {
            if(xmlHttp.readyState == 4)
                SOAPClient._onLoadWsdl(url, method, parameters, async, callback, xmlHttp);
        }
    }
    xmlHttp.send(null);
    if (!async)
        return SOAPClient._onLoadWsdl(url, method, parameters, async, callback, xmlHttp);
}
SOAPClient._onLoadWsdl = function(url, method, parameters, async, callback, req)
{
    var wsdl = req.responseXML;
    SOAPClient_cacheWsdl[url] = wsdl;	// save a copy in cache
    return SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
}
SOAPClient._sendSoapRequest = function(url, method, parameters, async, callback, wsdl)
{
    // get namespace
    var ns = (typeof wsdl.documentElement.attributes["targetNamespace"] == "undefined") ? wsdl.documentElement.attributes.getNamedItem("targetNamespace").nodeValue : wsdl.documentElement.attributes["targetNamespace"].value;
    // build SOAP request
    var sr =
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
    "<soap:Envelope " +
    "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
    "xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
    "xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" " +
    (SOAPClient.explicitNS?"xmlns:tns=\"" + ns + "\"":"") +
    parameters.printSchemaList() +
    ">" +
    (SOAPClient.auth?"<soap:Header><AuthHeader xmlns=\"" + ns + "\">" +
    "<Username>"+SOAPClient.authUser+"</Username>" +
    "<Password>"+SOAPClient.authPass+"</Password>" +
    "</AuthHeader></soap:Header>":"") +
    "<soap:Body>" +
    (SOAPClient.explicitNS?"<tns:" + method + ">":"<" + method + " xmlns=\"" + ns + "\">") +
    parameters.toXml() +
    (SOAPClient.explicitNS?"</tns:" + method + ">":"</" + method + ">") +
    "</soap:Body></soap:Envelope>";
    // send request
    var xmlHttp = SOAPClient._getXmlHttp();
    if (SOAPClient.userName && SOAPClient.password){
        xmlHttp.open("POST", url, async, SOAPClient.userName, SOAPClient.password);
        // Some WS implementations (i.e. BEA WebLogic Server 10.0 JAX-WS) don't support Challenge/Response HTTP BASIC, so we send authorization headers in the first request
        xmlHttp.setRequestHeader("Authorization", "Basic " + SOAPClient._toBase64(SOAPClient.userName + ":" + SOAPClient.password));
    }
    else{
        xmlHttp.open("POST", url, async);
    }
    var soapaction = ((ns.lastIndexOf("/") != ns.length - 1) ? ns + "/" : ns) + ((SOAPClient.interface != "") ? SOAPClient.interface + "/" : "") + method;
    xmlHttp.setRequestHeader("SOAPAction", soapaction);
    xmlHttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
    if (SOAPClient.cors) {
    	xmlHttp.withCredentials = true;
    	xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    }
    if(async)
    {
        xmlHttp.onreadystatechange = function()
        {
            if(xmlHttp.readyState == 4)
                SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
        }
    }
    xmlHttp.send(sr);
    if (!async)
        return SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
}

SOAPClient._onSendSoapRequest = function(method, async, callback, wsdl, req) 
{
    var o = null;
    var nd = SOAPClient._getElementsByTagName(req.responseXML, method + "Result");
    if(nd.length == 0)
        nd = SOAPClient._getElementsByTagName(req.responseXML, "return");	// PHP web Service?
    if(nd.length == 0)
        nd = SOAPClient._getElementsByTagName(req.responseXML, method + "Return");	// new PHP web Service?
    if(nd.length == 0)
    {
        if(req.responseXML.getElementsByTagName("faultcode").length > 0)
        {
            if(async || callback)
                o = new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue);
            else
                throw new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue);
        }
    }
    else
        o = SOAPClient._soapresult2object(nd[0], wsdl);
    if(callback)
        callback(o, req.responseXML);
    if(!async)
        return o;
}
SOAPClient._soapresult2object = function(node, wsdl)
{
    var wsdlTypes = SOAPClient._getTypesFromWsdl(wsdl);
    return SOAPClient._node2object(node, wsdlTypes);
}
SOAPClient._node2object = function(node, wsdlTypes)
{
    // null node
    if(node == null)
        return null;
    // text node
    if(node.nodeType == 3 || node.nodeType == 4)
        return SOAPClient._extractValue(node, wsdlTypes);
    // leaf node
    if (node.childNodes.length == 1 && (node.childNodes[0].nodeType == 3 || node.childNodes[0].nodeType == 4))
        return SOAPClient._node2object(node.childNodes[0], wsdlTypes);
    var isArray = false;
    var tmpNodeNameObject = new Object;
    for(var i = 0; !isArray && i< node.childNodes.length; i++) {
        if(typeof tmpNodeNameObject[node.childNodes[i].nodeName] == "undefined")
            tmpNodeNameObject[node.childNodes[i].nodeName] = true;
        else isArray = true;
            
    }
    var isarray = isArray || SOAPClient._getTypeFromWsdl(node.nodeName, wsdlTypes).toLowerCase().indexOf("arrayof") != -1;
    // object node
    if(!isarray)
    {
        var obj = null;
        if(node.hasChildNodes())
            obj = new Object();
        for(var i = 0; i < node.childNodes.length; i++)
        {
            var p = SOAPClient._node2object(node.childNodes[i], wsdlTypes);
            obj[node.childNodes[i].nodeName] = p;
        }
        return obj;
    }
    // list node
    else
    {
        // create node ref
        var l = new Array();
        for(var i = 0; i < node.childNodes.length; i++)
            l[l.length] = SOAPClient._node2object(node.childNodes[i], wsdlTypes);
        return l;
    }
    return null;
}
SOAPClient._extractValue = function(node, wsdlTypes)
{
    var value = node.nodeValue;
    switch(SOAPClient._getTypeFromWsdl(node.parentNode.nodeName, wsdlTypes).toLowerCase())
    {
        default:
        case "s:string":
            return (value != null) ? value + "" : "";
        case "s:boolean":
            return value + "" == "true";
        case "s:int":
        case "s:long":
            return (value != null) ? parseInt(value + "", 10) : 0;
        case "s:double":
            return (value != null) ? parseFloat(value + "") : 0;
        case "s:datetime":
            if(value == null)
                return null;
            else
            {
                value = value + "";
                value = value.substring(0, (value.lastIndexOf(".") == -1 ? value.length : value.lastIndexOf(".")));
                value = value.replace(/T/gi," ");
                value = value.replace(/-/gi,"/");
                var d = new Date();
                d.setTime(Date.parse(value));
                return d;
            }
    }
}
SOAPClient._getTypesFromWsdl = function(wsdl)
{
    var wsdlTypes = new Array();
    // IE
    var ell = wsdl.getElementsByTagName("s:element");
    var useNamedItem = true;
    // MOZ
    if(ell.length == 0)
    {
        ell = wsdl.getElementsByTagName("element");
        useNamedItem = false;
    }
    for(var i = 0; i < ell.length; i++)
    {
        if(useNamedItem)
        {
            if(ell[i].attributes.getNamedItem("name") != null && ell[i].attributes.getNamedItem("type") != null)
                wsdlTypes[ell[i].attributes.getNamedItem("name").nodeValue] = ell[i].attributes.getNamedItem("type").nodeValue;
        }
        else
        {
            if(ell[i].attributes["name"] != null && ell[i].attributes["type"] != null)
                wsdlTypes[ell[i].attributes["name"].value] = ell[i].attributes["type"].value;
        }
    }
    return wsdlTypes;
}
SOAPClient._getTypeFromWsdl = function(elementname, wsdlTypes)
{
    var type = wsdlTypes[elementname] + "";
    return (type == "undefined") ? "" : type;
}
// private: utils
SOAPClient._getElementsByTagName = function(document, tagName)
{
    try
    {
        // trying to get node omitting any namespaces (latest versions of MSXML.XMLDocument)
        return document.selectNodes(".//*[local-name()=\""+ tagName +"\"]");
    }
    catch (ex) {}
    // old XML parser support
    return document.getElementsByTagName(tagName);
}
// private: xmlhttp factory
SOAPClient._getXmlHttp = function() 
{
    try
    {
        if(window.XMLHttpRequest)
        {
            var req = new XMLHttpRequest();
            // some versions of Moz do not support the readyState property and the onreadystate event so we patch it!
            if(req.readyState == null)
            {
                req.readyState = 1;
                req.addEventListener("load",
                    function()
                    {
                        req.readyState = 4;
                        if(typeof req.onreadystatechange == "function")
                            req.onreadystatechange();
                    },
                    false);
            }
            return req;
        }
        if(window.ActiveXObject)
            return new ActiveXObject(SOAPClient._getXmlHttpProgID());
    }
    catch (ex) {}
    throw new Error("Your browser does not support XmlHttp objects");
}
SOAPClient._getXmlHttpProgID = function()
{
    if(SOAPClient._getXmlHttpProgID.progid)
        return SOAPClient._getXmlHttpProgID.progid;
    var progids = ["Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    var o;
    for(var i = 0; i < progids.length; i++)
    {
        try
        {
            o = new ActiveXObject(progids[i]);
            return SOAPClient._getXmlHttpProgID.progid = progids[i];
        }
        catch (ex) {};
    }
    throw new Error("Could not find an installed XML parser");
}

SOAPClient._toBase64 = function(input)
{
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
        keyStr.charAt(enc3) + keyStr.charAt(enc4);
    } while (i < input.length);

    return output;
}
