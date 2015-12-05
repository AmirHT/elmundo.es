// |=======================================================================
// |  Class cX.Library
// |  -------------------
// |
// |  Description:
// |   Common JavaScript functions for cXense products
// |
// |
// |  Copyright 2010-2012 cXense AS
// |======================================================================


try {

// Namespace exists? If not, create.
var cX = cX || {};
cX.callQueue = cX.callQueue || [];
cX.eventReceiverBaseUrl = cX.eventReceiverBaseUrl || ('http' + (location.protocol == 'https:' ? 's://s' : '://') + 'comcluster.cxense.com/Repo/rep.html');
cX.backends = {
    production: {
        baseAdDeliveryUrl: 'http://adserver.cxad.cxense.com/adserver/search',
        secureBaseAdDeliveryUrl: 'https://s-adserver.cxad.cxense.com/adserver/search'
    },
    sandbox: {
        baseAdDeliveryUrl: 'http://adserver.sandbox.cxad.cxense.com/adserver/search',
        secureBaseAdDeliveryUrl: 'https://s-adserver.sandbox.cxad.cxense.com/adserver/search'
    }
};

// Class defined? If not, create.
if (!cX.Library) {

    /**
     * @constructor
     */
    cX.Library = function(accountId, siteId) {
        this.m_accountId = accountId;
        this.m_siteId = siteId;
        this.m_siteHostnames = new Object();
        this.add_siteHostname(location.hostname);
        this.m_pageViewReportedFor = [];
        this.m_adSpaceSpecs = {};
        this.m_rnd = Math.round(Math.random() * 2147483647).toString(36) + Math.round(Math.random() * 2147483647).toString(36);
        this.m_customParameters = [];
        this.m_scriptStartTime = new Date().getTime();
        this.m_activityState = {
            prevActivityTime: this.m_scriptStartTime,
            exitLink: '',
            activeTime: 0,
            prevScreenX: 0,
            prevScreenY: 0,
            prevScrollLeft: 0,
            prevScrollTop: 0,
            prevWindowWidth: 0,
            prevWindowHeight: 0
        };

        try {
            // Copy out previous visit state before it gets overwritten
            if (window.localStorage && window.localStorage.getItem) {
                this.m_atfr = window.localStorage.getItem('_cX_atfr');
                window.localStorage.removeItem('_cX_atfr');
            }
        } catch (e) {}
    };

    cX.Library.prototype = {

        // Properties
        m_accountId: null,
        m_siteId: null,
        m_goalId: null,
        m_pageName: null,
        m_siteHostnames: null,
        m_pageViewReported: false,
        m_rnd: null,
        m_adSpaceSpecs: null,
        m_activityState: null,
        m_atfr: null,

        setSiteId: function(siteId) {
            this.m_siteId = siteId;
        },

        setAccountId: function(accountId) {
            this.m_accountId = accountId;
        },

        setCustomParameters: function(parameters) {
            var key, value;
            for (key in parameters) {
                if (parameters.hasOwnProperty(key)) {
                    value = parameters[key];
                    // Use a maximum length of 20 the key and 15 for the value.
                    // The actual maximum length could be lower on the server
                    // side. See official API documentation for more details.
                    key = ('' + key).substring(0, 20);
                    value = ('' + value).substring(0, 15);
                    this.m_customParameters.push('cp_' + encodeURIComponent(key) + '=' + encodeURIComponent(value));
                }
            }
        },

        // Methods
        add_siteHostname: function(hostname) {
            try {
                this.m_siteHostnames[hostname] = true;
            }
            catch (e) { }
        },

        isSiteHost: function(hostname) {
            var retVal = false;
            if (this.m_siteHostnames[hostname])
                retVal = true;
            return retVal;
        },

        set_pageName: function(pageName) {
            try {
                this.m_pageName = pageName;
            }
            catch (e) { }
        },

        isInternalRequest: function() {
            try {
                return (null != navigator.userAgent.match(/cXense/i));
            }
            catch (e) {
                return false;
            }
        },

        getPageViewHasBeenReportedFor: function(reportedFor) {
            var hasBeenReported = false;
            for (var i = 0; i < this.m_pageViewReportedFor.length; i++) {
                if (this.m_pageViewReportedFor[i] === reportedFor) {
                    hasBeenReported = true;
                }
            }
            return hasBeenReported;
        },

        setPageViewHasBeenReportedFor: function(reportedFor) {
            if (!this.getPageViewHasBeenReportedFor(reportedFor)) {
                this.m_pageViewReportedFor[this.m_pageViewReportedFor.length] = reportedFor;
            }
        },

        isSafari: function() {
            try {
                return (navigator.userAgent.indexOf('Safari') > -1);
            }
            catch (e) {
                return false;
            }
        },

        sendPageViewEvent: function() {

            // Don't skew the statistics.
            if (this.isInternalRequest()) {
                return;
            }

            // Don'send event on programmatic refresh
            try {
                if (document.location && document.referrer && (document.location != '') && (document.location == document.referrer)) {
                    return;
                }
            } catch (e) { }

            // Only report once per configured target.
            var reportedFor = this.m_accountId + '_' + this.m_siteId;
            if (!this.getPageViewHasBeenReportedFor(reportedFor)) {
                this.setPageViewHasBeenReportedFor(reportedFor);

                if (document.images) {
                    var isNewUser = !(this.get_cookie('cX_P'));
                    var sessionCookie = this.get_sessionCookie();
                    var persistentCookie = this.get_persistentCookie();

                    var repSrc = cX.eventReceiverBaseUrl + '?ver=1&typ=pgv&rnd=' + this.m_rnd;
                    try { repSrc += '&acc=' + encodeURIComponent(this.m_accountId); } catch (e) { }
                    try { repSrc += '&sid=' + encodeURIComponent(this.m_siteId); } catch (e) { }
                    try { repSrc += '&loc=' + encodeURIComponent(location.href); } catch (e) { }
                    try { repSrc += '&ref=' + (document.referrer ? encodeURIComponent(document.referrer) : ''); } catch (e) { }
                    try { repSrc += '&gol=' + (this.m_goalId ? encodeURIComponent(this.m_goalId) : ''); } catch (e) { }
                    try { repSrc += '&pgn=' + (this.m_pageName ? encodeURIComponent(this.m_pageName) : ''); } catch (e) { }
                    try { repSrc += '&ltm=' + this.m_scriptStartTime; } catch (e) { }
                    try { repSrc += '&new=' + (isNewUser ? '1' : '0'); } catch (e) { }
                    try { repSrc += '&tzo=' + encodeURIComponent('' + new Date().getTimezoneOffset()); } catch (e) { }
                    try { repSrc += '&res=' + encodeURIComponent('' + window.screen.width + 'x' + window.screen.height); } catch (e) { }
                    try { repSrc += '&jav=' + (navigator.javaEnabled() ? '1' : '0'); } catch (e) { }
                    try { repSrc += '&bln=' + (navigator.browserLanguage ? encodeURIComponent(navigator.browserLanguage) : (navigator.language ? encodeURIComponent(navigator.language) : 'OO1OO')); } catch (e) { }
                    try { repSrc += '&cks=' + encodeURIComponent(sessionCookie); } catch (e) { }
                    try { repSrc += '&ckp=' + encodeURIComponent(persistentCookie); } catch (e) { }
                    try { repSrc += '&chs=' + encodeURIComponent(document.charset || ''); } catch (e) { }
                    if (this.m_customParameters.length > 0) {
                        repSrc += '&' + this.m_customParameters.join('&');
                    }
                    try { if (this.m_atfr) { repSrc += this.m_atfr; } this.m_atfr = null; } catch (e) { } // Only report once

                    // Flash detection
                    var flashVersion = '';
                    try {
                        var hasFlash = false;

                        var flashMimeTypeStr = 'application/x-shockwave-flash';
                        if (navigator.mimeTypes && navigator.mimeTypes[flashMimeTypeStr]) {
                            hasFlash = true;

                            try {
                                var flashMimeType = navigator.mimeTypes[flashMimeTypeStr];
                                if (flashMimeType.enabledPlugin && flashMimeType.enabledPlugin.description)
                                    flashVersion = flashMimeType.enabledPlugin.description;
                            }
                            catch (e) { flashVersion = ''; }
                        }
                        else if (navigator.plugins) {
                            try {
                                for (var i = 0; i < navigator.plugins.length; i++) {
                                    if (navigator.plugins[i].indexOf('Shockwave Flash') === 0) {
                                        hasFlash = true;
                                        break;
                                    }
                                }
                            } catch (e) { }
                        }
                        if (!hasFlash) {
                            try {
                                var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                                try { flashVersion = axo.GetVariable('$version'); }
                                catch (e) { flashVersion = ''; }
                                hasFlash = true;
                            } catch (e) { }
                        }

                        try { repSrc += '&fls=' + encodeURIComponent(hasFlash ? '1' : '0'); } catch (e) { }
                        try { repSrc += '&flv=' + encodeURIComponent(flashVersion); } catch (e) { }
                    } catch (e) { }

                    var iframeId = 'cx_rep_iframe_' + Math.random();
                    var repIFrame = document.createElement('iframe');
                    repIFrame.id = iframeId;
                    repIFrame.name = iframeId;
                    repIFrame.width = '1';
                    repIFrame.height = '1';
                    repIFrame.scrolling = 'no';
                    repIFrame.frameBorder = '0';

                    var repForm = document.createElement('form');
                    repForm.method = 'post';
                    repForm.target = iframeId;
                    repForm.action = repSrc;

                    var repDiv = document.createElement('div');
                    repDiv.style.display = 'none';
                    repDiv.appendChild(repIFrame);
                    repDiv.appendChild(repForm);

                    var cxRootEl = document.getElementById('cX-root');
                    if (cxRootEl) {
                        cxRootEl.appendChild(repDiv);
                    } else {
                        document.body.appendChild(repDiv);
                    }

                    if (this.isSafari()) {
                        repForm.submit();
                    } else {
                        repIFrame.src = repSrc;
                    }

                }
            }
        },

        get_sessionCookie: function() {
            // Set cookies if not set
            var sessionCookie = this.get_cookie('cX_S');
            if (!sessionCookie) {
                sessionCookie = new Date().getTime() + new String(Math.round(Math.random() * 2147483647));
                this.set_cookie('cX_S', sessionCookie, '/');
            }
            return sessionCookie;
        },


        get_persistentCookie: function() {
            var persistentCookie = this.get_cookie('cX_P');
            if (!persistentCookie) {
                persistentCookie = new Date().getTime() + new String(Math.round(Math.random() * 2147483647));
                this.set_cookie('cX_P', persistentCookie, 365, '/');
            }
            return persistentCookie;
        },


        set_cookie: function(name, value, expires, path, domain, secure) {
            var today = new Date();
            today.setTime(today.getTime());

            if (expires) {
                expires = expires * 1000 * 60 * 60 * 24;
            }
            var expires_date = new Date(today.getTime() + (expires));

            document.cookie = name + '=' + escape(value) +
            ((expires) ? ';expires=' + expires_date.toGMTString() : '') +
            ((path) ? ';path=' + path : '') +
            ((domain) ? ';domain=' + domain : '') +
            ((secure) ? ';secure' : '');
        },


        get_cookie: function(check_name) {
            var a_all_cookies = document.cookie.split(';');
            var a_temp_cookie = '';
            var cookie_name = '';
            var cookie_value = '';
            var b_cookie_found = false; // set boolean t/f default f

            for (var i = 0; i < a_all_cookies.length; i++) {
                a_temp_cookie = a_all_cookies[i].split('=');

                cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

                if (cookie_name == check_name) {
                    b_cookie_found = true;
                    if (a_temp_cookie.length > 1) {
                        cookie_value = unescape(a_temp_cookie[1].replace(/^\s+|\s+$/g, ''));
                    }
                    return cookie_value;
                    break;
                }

                a_temp_cookie = null;
                cookie_name = '';
            }

            if (!b_cookie_found) {
                return null;
            }
        },


        renderTemplate: function(templateElementId, targetElementId, data, context) {

            // Phase 1: Combine main template and nested templates
            var templateElement = document.getElementById(templateElementId);
            var templateHtml = ' ' + templateElement.innerHTML + ' ';
            var depth = 0;
            while (templateHtml.indexOf('<!--<') > -1) {
                var htmlReplaceFunc = function(str, p1, p2, offset, s) {
                    return document.getElementById(p1).innerHTML;
                }
                templateHtml = templateHtml.replace(/<!--<\s*"([^"]*)"\s*>-->/g, htmlReplaceFunc);
                depth++;
                if (depth > 40) { // Sanity check, break out of infinite template reference loops
                    break;
                }
            }

            // Phase 2: Invert the HTML with JavaScript to become a JavaScript function that writes HTML,
            // extracts values from local references, stores values to global variables and insert references
            // to the global variables.
            var code = '\nvar html = \'\';\n';
            code += 'var varPrefix = \'cXTmplMgck\' + Math.round(Math.random() * 2147483647).toString(36) + (new Date().getTime()).toString(36);\n';
            code += 'var varIndex = 0;\n';
            var parts = templateHtml.split('%-->');
            for (var i = 0; i < parts.length; i++) {
                var pair = parts[i].split('<!--%');
                var textPart = pair[0];
                if (cX.library.trim(textPart).length > 0) {
                    textPart = textPart.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/'/g, '\\\'');
                    if (textPart.indexOf('{{') > -1) {

                        // To avoid XSS, do not insert values before HTML is parsed, but rather extract values
                        // and store to global variables that can be references and replaced later.
                        code += 'var localText = \'' + textPart + '\';\n';
                        code += 'var replaceFunc = function (str, p1, p2, offset, s) {\n';
                        code += '    var varName = varPrefix + varIndex;\n';
                        code += '    varIndex++;\n';
                        code += '    window[varName] = eval(p1);\n';
                        code += '    return \'{{window[\\\'\' + varName + \'\\\']}}\';\n';
                        code += '}\n';
                        code += 'localText = localText.replace(/{{([^}]*)}}/g, replaceFunc);\n';
                        code += 'html += localText;\n';

                    } else {
                        code += 'html += \'' + textPart + '\';\n';
                    }
                }

                var codePart = '';
                if (pair.length > 1) {
                    codePart = cX.library.trim(pair[1]);
                }
                code += codePart + '\n';
            }
            code += 'return html;\n';
            var renderFunc = new Function('data', 'context', code);

            // Phase 3: Run the function to create the final HTML with only global variable references
            var renderedHtml = renderFunc(data, context);

            // Phase 4: Browser parses HTML and creates DOM elements
            var targetElement = document.getElementById(targetElementId);
            targetElement.innerHTML = renderedHtml;

            // Phase 5: Finish up DOM elements by replacing references to global variables with values and
            // moving attributes in the tmp: namespace out to the global namespace.

            // Process a node
            function processNode(node, searchResult, ad) {
                // Process attributes
                if (node.attributes && node.attributes.length && node.attributes.length > 0) {
                    var tmpAttrs = [];
                    for (var i = 0; i < node.attributes.length; i++) {
                        var attribute = node.attributes[i];
                        // IE8 (and lower) iterates over all supported attributes.
                        // We only want to look at attributes that are specified on this element.
                        if (typeof attribute.specified === 'undefined' || attribute.specified) {
                            processText(attribute);
                            if (attribute.nodeName.indexOf('tmp:') == 0) {
                                tmpAttrs[tmpAttrs.length] = attribute;
                            }
                        }
                    }
                    for (var j = 0; j < tmpAttrs.length; j++) {
                        var tmpAttribute = tmpAttrs[j];
                        var newName = tmpAttribute.nodeName.replace(/^tmp:/, '');
                        if (newName === 'style') {
                            node.style.cssText = tmpAttribute.nodeValue;
                        } else if (newName === 'class') {
                            node.className = tmpAttribute.nodeValue;
                        } else {
                            node[newName] = tmpAttribute.nodeValue;
                        }
                        // Remove old, if possible (not really necessary)
                        try { if (node.removeAttribute) { node.removeAttribute(tmpAttribute.nodeName); } } catch (e) { }
                    }
                }
                // Process text nodes
                if (node.nodeName.toLowerCase() == '#text') {
                    processText(node);
                }
                // Process child elements
                if (node.childNodes && node.childNodes.length && node.childNodes.length > 0) {
                    for (var k = 0; k < node.childNodes.length; k++) {
                        var child = node.childNodes[k];
                        processNode(child);
                    }
                }
            }

            function processText(node, searchResult, ad) {
                if (node.nodeValue && node.nodeValue.indexOf) {
                    if (node.nodeValue.indexOf('{{') > -1) {
                        var replaceFunc = function(str, p1, p2, offset, s) {
                            var value = window[p1];
                            try { // IE 8 and lower will throw exception on delete
                                delete window[p1];
                            } catch (e) { }
                            return value;
                        }
                        node.nodeValue = node.nodeValue.replace(/{{window\[\'([^\]]*)\'\]}}/g, replaceFunc);
                    }
                }
            }

            // Process the inserted nodes and replace temp tokens with actual values
            for (var k = 0; k < targetElement.childNodes.length; k++) {
                var childNode = targetElement.childNodes[k];
                processNode(childNode);
            }
        },


        loadScript: function(src, async, charset) {
            var scriptEl = document.createElement('script');
            scriptEl.type = 'text/javascript';
            if (async !== false) {
                scriptEl.async = 'async'; // Async if undefined
            }
            if (typeof charset === 'string') {
                scriptEl.charset = charset;
            }
            scriptEl.src = src;
            var headEl = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
            headEl.insertBefore(scriptEl, headEl.firstChild);
        },


        getAllText: function(object) {
            var allText = '';
            for (var key in object) {
                var node = object[key];
                if (typeof node === 'string') {
                    allText += node;
                } else if (typeof node === 'object') {
                    allText += this.getAllText(node);
                }
            }
            return allText;
        },


        createDelegate: function(instance, method) {
            return function() {
                return method.apply(instance, arguments);
            };
        },

        combineArgs: function(args1, args2) {
            var allArgs = {};
            if (args1) {
                for (var argName in args1) {
                    allArgs[argName] = args1[argName];
                }
            }
            if (args2) {
                for (var argName in args2) {
                    allArgs[argName] = args2[argName];
                }
            }
            return allArgs;
        },

        trim: function(string) {
            return string.replace(/^\s*/, '').replace(/\s*$/, '');
        },

        parseMargins: function(marginsString) {
            var margins = { left: 0, top: 0, right: 0, bottom: 0 };
            try {
                if (marginsString) {
                    var marginParts = this.trim(marginsString).replace(/\s+/g, ' ').split(' ');
                    for (var i = 0; i < marginParts.length; i++) {
                        // Convert to int
                        marginParts[i] = parseInt(marginParts[i].replace(/px/gi, ''), 10);
                    }

                    if (marginParts.length == 1) {
                        margins.top = marginParts[0];
                        margins.right = marginParts[0];
                        margins.bottom = marginParts[0];
                        margins.left = marginParts[0];
                    }
                    if (marginParts.length == 2) {
                        margins.top = marginParts[0];
                        margins.right = marginParts[1];
                        margins.bottom = marginParts[0];
                        margins.left = marginParts[1];
                    }
                    if (marginParts.length == 3) {
                        margins.top = marginParts[0];
                        margins.right = marginParts[1];
                        margins.bottom = marginParts[2];
                        margins.left = marginParts[1];
                    }
                    if (marginParts.length == 4) {
                        margins.top = marginParts[0];
                        margins.right = marginParts[1];
                        margins.bottom = marginParts[2];
                        margins.left = marginParts[3];
                    }
                }
            } catch (e) { }
            return margins;
        },

        parseHashArgs: function() {
            var hashFragment = window.location.hash || '';
            if (hashFragment.indexOf('#') === 0) {
                hashFragment = hashFragment.substr(1);
            }
            return this.decodeUrlEncodedNameValuePairs(hashFragment);
        },

        filterHashArgs: function(allHashArgs) {
            var hashArgs = {};
            for (var argName in allHashArgs) {
                if ((argName === 'media') ||
                    (argName === 'renderTemplateUrl') ||
                    (argName === 'rnd') ||
                    (argName.indexOf('lf-') === 0)) {
                    // Do not forward.
                } else if (argName === 'asId') {
                    hashArgs.adSpaceId = allHashArgs[argName];
                } else if (argName === 'auw') {
                    hashArgs.adUnitWidth = parseInt(allHashArgs.auw);
                } else if (argName === 'auh') {
                    hashArgs.adUnitHeight = parseInt(allHashArgs.auh);
                } else {
                    hashArgs[argName] = allHashArgs[argName];
                }
            }
            return hashArgs;
        },

        addEventListener: function(object, eventName, handler) {
            if (object.addEventListener) {
                object.addEventListener(eventName, handler, false);
            } else if (object.attachEvent) {
                object.attachEvent('on' + eventName, handler);
            }
        },

        decodeUrlEncodedNameValuePairs: function(urlEncodedNameValuePairs) {
            var object = {};
            var pairs = urlEncodedNameValuePairs.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pairElements = pairs[i].split('=');
                if (pairElements.length === 2) {
                    var name = decodeURIComponent(pairElements[0]);
                    var value = decodeURIComponent(pairElements[1]);
                    object[name] = value;
                }
            }
            return object;
        },

        handlePostMessage: function(message) {
            var origin = message.origin; // Don't need to check origin as the security is enforced by the random IFRAME id.
            var object = this.decodeUrlEncodedNameValuePairs(message.data);
            this.updateAdSpace(object.elementId, parseInt(object.matchedAdCount, 10), object.isVerticallyOriented !== 'false',
                parseInt(object.contentWidth, 10), parseInt(object.contentHeight, 10));
        },

        updateAdSpace: function(elementId, matchedAdCount, isVerticallyOriented, contentWidth, contentHeight) {
            var specs = this.m_adSpaceSpecs[elementId];
            if (specs) {
                var cancelEvent = false;
                if (specs.onImpressionResult && (typeof specs.onImpressionResult === 'function')) {
                    // Execute callback to custom function, allowing cancelling of default behavior.
                    var event = {
                        elementId: elementId,
                        matchedAdCount: matchedAdCount,
                        isVerticallyOriented: isVerticallyOriented,
                        contentWidth: contentWidth,
                        contentHeight: contentHeight
                    };
                    cancelEvent = specs.onImpressionResult(event) === false;
                }
                if (!cancelEvent) {
                    var iframeEl = document.getElementById(elementId);
                    if (!specs.resizeToContentSize) {
                        if (isVerticallyOriented) {
                            iframeEl.style.height = '' + this.calculateAdSpaceSize(matchedAdCount, specs.adUnitHeight, specs.margins.top, specs.margins.bottom) + 'px';
                        } else {
                            iframeEl.style.width = '' + this.calculateAdSpaceSize(matchedAdCount, specs.adUnitWidth, specs.margins.left, specs.margins.right) + 'px';
                        }
                    } else {
                        if (isVerticallyOriented) {
                            iframeEl.style.height = '' + contentHeight + 'px';
                        } else {
                            iframeEl.style.width = '' + contentWidth + 'px';
                        }
                    }
                }
            }
        },

        calculateAdSpaceSize: function(adCount, adUnitSize, marginA, marginB) {
            // Because of the floats, the margins aren't overlapping like normal, otherwise it would have had to be:
            // return adCount > 0 ? marginA + (adCount * adUnitSize) + ((adCount - 1) * Math.max(marginA, marginB)) + marginB : 0;
            return adCount * (adUnitSize + marginA + marginB);
        },

        /**
         * @param {{adSpaceId, destinationUrlParameters, secureBaseAdDeliveryUrl, targetElementId, baseAdDeliveryUrl}} args
         */
        insertAdSpace: function(args) {

            // Don't skew the statistics.
            if (this.isInternalRequest()) {
                return;
            }

            var persistentCookie = this.get_persistentCookie();

            var allArgs = window.cx_props ? this.combineArgs(window.cx_props, args) : args;

            // There are three modes we can be in when insertAdSpace is called:
            // Traditional approach:
            //  - Render an Iframe element that loads HTML media from the AdServer passing args as URL params
            // Steps 1 and 2 of templating approach:
            //  1. Render an Iframe element that loads HTML media template from a static URL passing args in the URL hash fragment
            //  2. Render a template into a target element on the page using data from the adserver passing args in URL params
            var media = 'html';
            var params = '?';
            if (allArgs.renderTemplateUrl) {
                params = '#';
            } else if (allArgs.templateElementId || allArgs.renderFunction) {
                media = 'javascript';
                if (allArgs.forwardHashArgs) {
                    allArgs = this.combineArgs(this.filterHashArgs(this.parseHashArgs()), allArgs);
                }
            }
            var adSpaceId = allArgs.adSpaceId;
            params += 'media=' + encodeURIComponent(media);
            params += '&asId=' + encodeURIComponent(adSpaceId);

            for (var argName in allArgs) {

                // Don't add functions or the base params, only the custom params
                if (typeof allArgs[argName] !== 'function' &&
                    (argName !== 'parentElementId' || media === 'html') &&
                    argName !== 'forwardHashArgs' &&
                    argName !== 'renderTemplateUrl' &&
                    argName !== 'templateElementId' &&
                    argName !== 'targetElementId' &&
                    argName !== 'onImpressionResult' &&
                    argName !== 'adSpaceId' &&
                    argName !== 'parentId' &&
                    argName !== 'adUnitWidth' &&
                    argName !== 'adUnitHeight' &&
                    argName !== 'initialVerticalAdUnits' &&
                    argName !== 'initialHorizontalAdUnits' &&
                    argName !== 'destinationUrlParameters' &&
                    argName !== 'destinationUrlPrefix' &&
                    argName !== 'secureBaseAdDeliveryUrl' &&
                    argName !== 'baseAdDeliveryUrl') {

                    params += '&' + encodeURIComponent(argName) + '=' + encodeURIComponent(allArgs[argName]);
                }

                // Pack and append all custom destination URL parameters as one parameter
                if (argName == 'destinationUrlParameters') {
                    var packedParameters = '';
                    var firstItem = true;
                    var destinationUrlParameters = allArgs.destinationUrlParameters;
                    for (var destinationUrlParameterName in destinationUrlParameters) {
                        var destinationUrlParameter = destinationUrlParameters[destinationUrlParameterName];
                        if (typeof destinationUrlParameter !== 'function') {
                            if (!firstItem) {
                                packedParameters += '&';
                            }
                            packedParameters += encodeURIComponent(destinationUrlParameterName) + '=' + encodeURIComponent(destinationUrlParameter);
                            firstItem = false;
                        }
                    }
                    params += '&' + encodeURIComponent(argName) + '=' + encodeURIComponent(packedParameters);
                }

                if (argName == 'destinationUrlPrefix') {
                    params += '&' + encodeURIComponent('dup') + '=' + encodeURIComponent(allArgs[argName]);
                }

            }

            var baseAdDeliveryUrl = args.baseAdDeliveryUrl || cX.backends[args.backend || 'production'].baseAdDeliveryUrl;
            try {
                if (location.protocol == 'https:') {
                    params += '&useSecureUrls=true';
                    baseAdDeliveryUrl = args.secureBaseAdDeliveryUrl || cX.backends[args.backend || 'production'].secureBaseAdDeliveryUrl;
                }
            } catch (e) { }
            if (allArgs.renderTemplateUrl) {
                baseAdDeliveryUrl = allArgs.renderTemplateUrl;

                // Always set the ctx param for pages that use templates in an IFrame, because the HTTP referrer header
                // will then not hold the URL to use for the context for content matching. Need to strip the URL
                // fragment here, as the # is not accepted by the restlet framework, even if it is properly URLEncoded.
                if (!allArgs.ctx) {
                    try { params += '&ctx=' + encodeURIComponent(location.href.replace(/#.*$/, '')); } catch (e) { }
                }
            }

            if (media === 'html') {
                try { params += '&auw=' + encodeURIComponent(allArgs.adUnitWidth); } catch (e) { }
                try { params += '&auh=' + encodeURIComponent(allArgs.adUnitHeight); } catch (e) { }
            }
            if (!allArgs.usi) {
                try { params += '&usi=' + encodeURIComponent(persistentCookie); } catch (e) { }
            }
            try { params += '&rnd=' + Math.round(Math.random() * 2147483647); } catch (e) { }
            // Only set the Timezone if one hasn't been passed from the page
            if (!allArgs.tzo) {
                try { params += '&tzo=' + encodeURIComponent('' + new Date().getTimezoneOffset()); } catch (e) { }
            }

            var margins = this.parseMargins(allArgs['lf-am']);

            var initialWidth = this.calculateAdSpaceSize(allArgs.initialHorizontalAdUnits, allArgs.adUnitWidth, margins.left, margins.right);
            var initialHeight = this.calculateAdSpaceSize(allArgs.initialVerticalAdUnits, allArgs.adUnitHeight, margins.top, margins.bottom);

            var iframeId = 'cxIfr_' + Math.random();

            if (media === 'html') {

                try { params += '&parentElementId=' + encodeURIComponent(iframeId); } catch (e) { }

                var ifr = document.createElement('iframe');
                ifr.id = iframeId;
                ifr.width = initialWidth;
                ifr.height = initialHeight;
                ifr.src = baseAdDeliveryUrl + params;
                ifr.setAttribute('style', 'display: block;');
                ifr.setAttribute('scrolling', 'no');
                ifr.frameBorder = '0';

                var targetElementId = args.insertBeforeElementId || args.targetElementId; // Backward compatibility
                if (!targetElementId) {
                    targetElementId = 'insertAdSpaceBeforeThis_' + adSpaceId;
                }
                var targetElement = document.getElementById(targetElementId);
                if (!targetElement) { // Backward compatibility
                    targetElementId = 'scriptForAdSpace_' + adSpaceId;
                    targetElement = document.getElementById(targetElementId);
                }
                targetElement.parentNode.insertBefore(ifr, targetElement);

            } else {

                var jsonpCallbackName = 'cX' + Math.round((Math.random() * 2147483647)).toString(36);
                cX[jsonpCallbackName] = this.createDelegate(this, function(data) {
                    if (typeof allArgs.renderFunction === 'function') {
                        allArgs.renderFunction(data, allArgs);
                    }
                    if (allArgs.templateElementId) {
                        this.renderTemplate(allArgs.templateElementId, allArgs.targetElementId, data, allArgs);
                    }

                    // Execute callback to custom function if present
                    if (typeof allArgs.onImpressionResult === 'function') {
                        var event = {};
                        if (data && data.searchResult && data.searchResult.spaces && data.searchResult.spaces[0]) {
                            var space = data.searchResult.spaces[0];
                            event.matchedAdCount = space.ads ? space.ads.length : 0;
                            event.isVerticallyOriented = space.isVerticallyOriented;
                        }
                        allArgs.onImpressionResult(event, data, allArgs);
                    }
                });
                params += '&callback=' + encodeURIComponent('cX.' + jsonpCallbackName);
                this.loadScript(baseAdDeliveryUrl + params);

            }

            // Store spec data needed for later resizing
            this.m_adSpaceSpecs[iframeId] = {
                adSpaceId: adSpaceId,
                margins: margins,
                initialHorizontalAdUnits: allArgs.initialHorizontalAdUnits,
                initialVerticalAdUnits: allArgs.initialVerticalAdUnits,
                adUnitWidth: allArgs.adUnitWidth,
                adUnitHeight: allArgs.adUnitHeight,
                resizeToContentSize: allArgs.resizeToContentSize,
                onImpressionResult: allArgs.onImpressionResult
            };
        },

        getWindowSize: function() {
            var windowSize = { width: 0, height: 0 };
            if (typeof(window.innerWidth) == 'number') {
                //Non-IE
                windowSize.width = window.innerWidth;
                windowSize.height = window.innerHeight;
            } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
                //IE 6+ in 'standards compliant mode'
                windowSize.width = document.documentElement.clientWidth;
                windowSize.height = document.documentElement.clientHeight;
            } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
                //IE 4 compatible
                windowSize.width = document.body.clientWidth;
                windowSize.height = document.body.clientHeight;
            }
            return windowSize;
        },

        getScrollPos: function() {
            var scrollPos = { left: 0, top: 0 };
            if (typeof(window.pageYOffset) == 'number') {
                //Netscape compliant
                scrollPos.top = window.pageYOffset;
                scrollPos.left = window.pageXOffset;
            } else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
                //DOM compliant
                scrollPos.top = document.body.scrollTop;
                scrollPos.left = document.body.scrollLeft;
            } else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
                //IE6 standards compliant mode
                scrollPos.top = document.documentElement.scrollTop;
                scrollPos.left = document.documentElement.scrollLeft;
            }
            return scrollPos;
        },

        onHIDEvent: function(event) {
            try {
                this.m_activityState.hadHIDActivity = true;
            } catch (e) {}
            return true;
        },

        onMouseMoveEvent: function(event) {
            try {
                var event = event || window.event;
                if (event) {
                    // Filter out jitter
                    if ((Math.abs(this.m_activityState.prevScreenX - event.screenX) > 1) ||
                        (Math.abs(this.m_activityState.prevScreenY - event.screenY) > 1)) {
                        this.m_activityState.prevScreenX = event.screenX;
                        this.m_activityState.prevScreenY = event.screenY;
                        this.m_activityState.hadHIDActivity = true;
                    }
                }
            } catch (e) {}
            return true;
        },

        onClickEvent: function(event) {
            try {
                this.m_activityState.hadHIDActivity = true;

                var event = event || window.event;
                if (event) {
                    var target = event.target || event.srcElement;
                    if (target) {
                        if (target.nodeType == 3) { // defeat Safari bug
                            target = target.parentNode;
                        }
                        if (target && target.href) {
                            this.m_activityState.exitLink = '' + target.href;
                            this.writeAtfr();
                        }
                    }
                }
            } catch (e) {}
            return true;
        },

        onPollActivity: function() {
            var hadActivity = false;

            // Check if window has been resized
            try {
                var windowSize = this.getWindowSize();
                if ((this.m_activityState.prevWindowWidth != windowSize.width) ||
                    (this.m_activityState.prevWindowHeight != windowSize.height)) {
                    this.m_activityState.prevWindowWidth = windowSize.width;
                    this.m_activityState.prevWindowHeight = windowSize.height;
                    hadActivity = true;
                }
            } catch (e) {}

            // Check if window has been scrolled
            try {
                var scrollPos = this.getScrollPos();
                if ((this.m_activityState.prevScrollLeft != scrollPos.left) ||
                    (this.m_activityState.prevScrollTop != scrollPos.top)) {
                    this.m_activityState.prevScrollLeft = scrollPos.left;
                    this.m_activityState.prevScrollTop = scrollPos.top;
                    hadActivity = true;
                }
            } catch (e) {}

            if (hadActivity || this.m_activityState.hadHIDActivity) {
                this.m_activityState.hadHIDActivity = false;

                var now = new Date().getTime();
                this.m_activityState.activeTime += Math.min(30000, now - this.m_activityState.prevActivityTime);
                this.m_activityState.prevActivityTime = now;

                this.writeAtfr();
            }

        },

        writeAtfr: function() {
            if (window.localStorage && window.localStorage.setItem) {
                var atfr = '';
                atfr += '&altm=' + this.m_scriptStartTime;
                atfr += '&arnd=' + this.m_rnd;
                atfr += '&aatm=' + Math.round(this.m_activityState.activeTime / 1000);
                atfr += '&axtl=' + encodeURIComponent(this.m_activityState.exitLink);

                var adSpaceIdx = 0;
                for (var iframeId in this.m_adSpaceSpecs) {
                    var adSpaceSpec = this.m_adSpaceSpecs[iframeId];
                    if (adSpaceSpec && typeof adSpaceSpec.adSpaceId === 'string') {
                        atfr += (adSpaceIdx == 0 ? '&aaid=' : ',') + encodeURIComponent(adSpaceSpec.adSpaceId);
                        adSpaceIdx++;
                        if (adSpaceIdx > 5) {
                            break;
                        }
                    }
                }

                window.localStorage.setItem('_cX_atfr', atfr);
            }
        },

        registerEventListeners: function() {
            this.addEventListener(window, 'message', this.createDelegate(this, this.handlePostMessage));
            this.addEventListener(document, 'keypress', this.createDelegate(this, this.onHIDEvent));
            this.addEventListener(document, 'keydown', this.createDelegate(this, this.onHIDEvent));
            this.addEventListener(document, 'keyup', this.createDelegate(this, this.onHIDEvent));
            this.addEventListener(document, 'mousedown', this.createDelegate(this, this.onClickEvent));
            this.addEventListener(document, 'mouseup', this.createDelegate(this, this.onClickEvent));
            // this.addEventListener(document, 'click', this.createDelegate(this, this.onClickEvent));
            this.addEventListener(document, 'mousemove', this.createDelegate(this, this.onMouseMoveEvent));
        }
    };

    cX.library = new cX.Library('0', '0');

    function cx_callQueueExecute() {
        try {
            var currCall = null;
            while (currCall = cX.callQueue.shift()) {
                var fnName = currCall[0];
                var fnArgs = currCall[1] || {};
                cX.library[fnName].apply(cX.library, [fnArgs]);
            }

            // Backwards compatibility:
            if (Ringo && Ringo.callQueue) {
                while (currCall = Ringo.callQueue.shift()) {
                    var fnName = currCall[0];
                    var fnArgs = currCall[1];
                    if (!fnArgs) { fnArgs = []; }
                    if (fnName === 'trackPageView') { fnName = 'sendPageViewEvent'; }
                    cX.library[fnName].apply(cX.library, fnArgs);
                }
            }
        } catch (e) {}

        setTimeout(cx_callQueueExecute, 10);
    }

    setTimeout(cx_callQueueExecute, 25);

    function cx_pollActivity() {
        try {
            cX.library.onPollActivity();
        } catch (e) {}
        setTimeout(cx_pollActivity, 500);
    }

    setTimeout(cx_pollActivity, 200);
    cX.library.registerEventListeners();
}


} catch (e) {}

