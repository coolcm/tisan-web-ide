/**
 * Created by ywen on 15/3/25.
 * This the js-bridge webview side initial libary.
 */

(function(global) {
    'use strict';
    if (global.Base64) return;
    var version = "2.1.1";
    // if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        buffer = require('buffer').Buffer;
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                + fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                   + fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                    + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                    + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                    + fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
            b64chars.charAt( ord >>> 18),
            b64chars.charAt((ord >>> 12) & 63),
            padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
            padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
        return chars.join('');
    };
    var btoa = global.btoa || function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer
        ? function (u) { return _utf8_encode((new buffer(u)).toString('base64')) } 
    : function (u) { return _utf8_encode(btoa(utob(u))) }
    ;
    var encode = function(u, urisafe) {
        return !urisafe 
            ? _encode(u)
            : _encode(u).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true) };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
            return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
        case 3:
            return fromCharCode(
                ((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
            );
        default:
            return  fromCharCode(
                ((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
            );
        }
    };
    var _utf8_encode = function ( string ) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
 
        for (var n = 0; n < string.length; n++) {
 
            var c = string.charCodeAt(n);
 
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
 
        }
 
        return utftext;
    };
    var _utf8_decode = function (utftext) {
        var string = "";
        var i = 0;
        var c, c1, c2;
        c = c1 = c2 = 0;
 
        while ( i < utftext.length ) {
 
            c = utftext.charCodeAt(i);
 
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
 
        }
 
        return string;
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
        chars = [
            fromCharCode( n >>> 16),
            fromCharCode((n >>>  8) & 0xff),
            fromCharCode( n         & 0xff)
        ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob || function(a){
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer
        ? function(a) { return (new buffer(a, 'base64')).toString() }
    : function(a) { return btou(atob(a)) };
    var decode = function(a){
        a = _utf8_decode( a );
        return _decode(
            a.replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true)
                }));
        };
    }
    // that's it!
})(this);;//==========================pandoJSBridge===============
window.initFreeIOTJSBridge = function(){
  var DEBUG = false;
    if (window.PandoJSBridge) { return ;}
    var messagingIframe;
    var sendMessageQueue = [];
    var messageHandlers = {};

    var CUSTOM_PROTOCOL_SCHEME = 'pando';
    var responseCallbacks = {};
    var uniqueId = 1;

    function _createQueueReadyIframe(doc) {
        console.log("createQueueReadyIframe...");
        messagingIframe = doc.createElement('iframe');
        messagingIframe.style.display = 'none';
        doc.documentElement.appendChild(messagingIframe);
    }


    //set default messageHandler
    function init(messageHandler) {
        if (PandoJSBridge._messageHandler) { 
          return;
          // throw new Error('PandoJSBridge.init called twice'); 
        }
        PandoJSBridge._messageHandler = messageHandler;
        if (DEBUG) {
          console.log("init... ");
        };
        
    }

    function isAndroid(){
        var ua = navigator.userAgent.toLowerCase();
        return ua.indexOf("android") > -1;
    }

    function isIOS() {
        var ua = navigator.userAgent.toLowerCase();
        return ua.indexOf("iphone") > -1 || ua.indexOf("ios") > -1
    }

    function send(data, responseCallback) {
        _doSend({ data:data }, responseCallback);
    }

    function registerHandler(handlerName, handler) {
        messageHandlers[handlerName] = handler;
    }

    function callHandler(handlerName, data, responseCallback) {
        _doSend({ handlerName:handlerName, data:data }, responseCallback);
    }

    //sendMessage add message, 触发native处理 sendMessage
    function _doSend(message, responseCallback) {
        if (responseCallback) {
            var callbackId = 'cb_'+(uniqueId++)+'_'+new Date().getTime();
            responseCallbacks[callbackId] = responseCallback;
            message['callbackId'] = callbackId;
        }
        sendMessageQueue.push(message);
        var messageQueueString = Base64.encode(JSON.stringify(sendMessageQueue));
        sendMessageQueue = [];

        var newUrl = CUSTOM_PROTOCOL_SCHEME + '://invoke/' + messageQueueString;
        if (DEBUG) {
          console.log(newUrl);
        };
        
        if (isIOS()) {
            messagingIframe.src = newUrl;
        } else if (isAndroid()) {
            alert(encodeURI(newUrl));
        } else {
            messagingIframe.src = newUrl;
        }
        
    }


    //提供给native调用
    function _handleMessageFromNative(messageJSON) {
        if (DEBUG) {
            console.log("handleMessageFromNative..." + messageJSON);
        };
        
        setTimeout(
            function _timeoutdispatchMessageFromNative() {
            if (DEBUG) {
              console.log(messageJSON);
            };
            
            messageJSON = Base64.decode(messageJSON);
            var message = JSON.parse(messageJSON);

            var messageHandler;
            //回调
            if (DEBUG) {
              console.log("message.responseId =>" + message.responseId);
            };
            if (message.responseId) {

                var responseCallback = responseCallbacks[message.responseId];
                if (!responseCallback) {
                    return;
                }

                responseCallback(message.responseData);
                delete responseCallbacks[message.responseId];
            }

        }
        , 0)
    }

    window.OnPandoJSBridgeReady = function(callback){
        if (window.PandoJSBridge) {
            console.log("has PandoJSBridge...");
            callback(PandoJSBridge)
        } else {
            console.log("PandoJSBridge not init...");
            document.addEventListener('PandoJSBridgeReady',
            function() {
                callback(PandoJSBridge)
            },
            false)
        }
    }

    window.PandoJSBridge = {
        init: init,
        send: send,
        registerHandler: registerHandler,
        callHandler: callHandler,
        _handleMessageFromNative: _handleMessageFromNative
    };

    var doc = document;
    _createQueueReadyIframe(doc);
    var readyEvent = doc.createEvent('Events');
    readyEvent.initEvent('PandoJSBridgeReady');
    readyEvent.bridge = PandoJSBridge;
    doc.dispatchEvent(readyEvent);

    window.pando = {};
    window.pando.getDeviceStatus = function(responseCallback) {
        callHandler('currentStatus', {}, responseCallback);
    };
    window.pando.sendCommand = function(data, responseCallback) {
        callHandler('sendCommand', data, responseCallback);
    };
    window.pando.getCurrentStatus = function(responseCallback) {
        callHandler('getCurrentStatus', {}, responseCallback);
    };
    window.pando.setCurrentStatus = function(responseCallback) {
        callHandler('setCurrentStatus', data, responseCallback);
    }
}





;window.initFreeIOTWechat = function(){
  function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)","i");
    var r = window.location.search.substr(1).match(reg);
    if (r!=null&&r.length>1) return (r[2]); return null;
  }
  var identifier = getQueryString('identifier');

  var getCurrentStatus = function(responseCallback) {
    $.ajax({
      url:'http://freeiot.pandocloud.com/api/device/status/current?identifier='+identifier,
      crossDomain:true,
      type:'get',
      success:function(r){
        console.log(r);
        responseCallback(r);
      }
    });
  };
  var setCurrentStatus = function(data,responseCallback) {
    $.ajax({
      type:'post',
      url:'http://freeiot.pandocloud.com/api/device/status/current?identifier='+identifier,
      crossDomain:true,
      data:JSON.stringify(data),
      contentType:'application/json',
      success:function(r){
        console.log(r);
        responseCallback(r);
      }
    });
  };

  window.pando = {};
  window.pando.getCurrentStatus = function(responseCallback) {
        getCurrentStatus(responseCallback);
  };
  window.pando.setCurrentStatus = function(data, responseCallback) {
        setCurrentStatus(data, responseCallback);
  };

};!function(){
  if (!window.iotboard){
    console.log("iotboard not initialized!");
    return;
  }

  function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)","i");
    var r = window.location.search.substr(1).match(reg);
    if (r!=null&&r.length>1) return (r[2]); return null;
  }

  if(getQueryString('from')=='wechat' || getQueryString('from')=='ide') {
    window.initFreeIOTWechat();
  } else {
    window.initFreeIOTJSBridge();
  }

  var model = {
    getStatusPending: false,
    getStatusQueue: []
  };

  function resetModel (){
    model.getStatusPending = false;
    model.getStatusQueue = [];
  }

  function waitForGettingStatus(label, callback) {
    var q = model.getStatusQueue;
    if (!model.getStatusPending) {
      model.getStatusPending = true;
      q.push({
        label: label,
        callback: callback
      });
      window.pando.getCurrentStatus(function(responseData) {
        if(responseData.code != 0) {
          alert(responseData.msg);
          return resetModel();
        }
        var status = responseData.data;
        for(var i=0; i<q.length; i++){
          q[i].callback(status[q[i].label]);
        }
        resetModel();
      });
    } else {
      q.push({
        label: label,
        callback: callback
      });
    }
  }

  /**
   * called when widget's status is changed.
   * @param  {String} widget [the widget name]
   * @param  {String} label  [the widget label to distinguish different widget of same type/name]
   * @param  {Object} status [the new status of widget]
   * @return {None}
   */
  model.onWidgetStatusChanged = function(widget, label, status){
    var data = {};
    data[label] = status;
    window.pando.setCurrentStatus(data, function(responseData) {
      console.log("responseData: " + responseData);
      if(responseData.code != 0) {
        alert(responseData.msg);
      }
    });
  }

  /**
   * get widget current status 
   * @param  {String} widget [the widget name]
   * @param  {String} label  [the widget label to distinguish different widget of same type/name]
   * @param  {callback} callback [the result status will be passed through callback(status)]
   * @return {None}
   */
  model.getCurrentStatus = function(widget, label, callback) {
    waitForGettingStatus(label, callback);
  }

  window.iotboard.setModel(model);
}();