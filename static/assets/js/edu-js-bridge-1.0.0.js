/*! edu-js-bridge v1.0.0 | (c) 2019 ASPire | Author: maokebing */

(function () {

  function Bridge () {
    this.messageHandlers = {}  // msg 列表
    this.responseCallbacks = {} //  res 列表
    this.uniqueId = 1 // uuid
    this.eduJSCallNative = null
  }

  Bridge.prototype = {

    /*
     JS调用Native方法
     handlerName: //调用方法名 [必填]
     data: //参数 {} 或 null [可选]
     eg .{
     "errorCode":0,  //错误码[选填]
     "errorMessage":""//错误信息[选填]
     "image_b64": "SSSSSSSS"
     }
     responseCallback //响应方法 [可选]
     */
    callHandler: function (handlerName, data, responseCallback) {
      var _that = this;
      var message = {}
      message.handlerName = handlerName
      message.data = data

      if (responseCallback != null) {
        message.callbackId = 'edujsbridge_cb' + (this.uniqueId++) + '_' + new Date().getTime();
        this.responseCallbacks[message.callbackId] = responseCallback
      }
      console.log(this)
      this.postMessageToNative(message)
    },


    /*
     JS注册方法，方便Native来调用
     handlerName: //调用方法名 [必填]
     handler //外理方法 [可选]
     */
    registerHandler: function (handlerName, handler) {
      this.messageHandlers[handlerName] = handler;
    },



    /*
     这里是Native调用JS方法【只给原生调用】
     参数 value 是JSON 串
     举例:eg.
     {
     "handlerName": "album_image"
     "callbackId": "",//回调id
     "responseId": "",//响应id
     "data": {
     "errorCode":0,  //错误码[选填]
     "errorMessage":""//错误信息[选填]
     "image_b64": "SSSSSSSS"
     }
     }
     */
    postMessageToJS: function (value) {
      //解析返回值
      var message = JSON.parse(value)
      var responseCallback = null;
      var _that = this;

      //处理回调
      if (message.responseId != null) {
        responseCallback = this.responseCallbacks[message.responseId]
        if (responseCallback) {
          this.responseCallbacks[message.responseId] = null
          responseCallback(message.data)
        }
      }

      //处理请求
      if (message.callbackId != null) {
        responseCallback = function (data) {
          var toMsg = {}
          toMsg.responseId = message.callbackId
          toMsg.handlerName = message.handlerName
          toMsg.data = data
          _that.postMessageToNative(toMsg)
        };
      }

      //handler
      var handler = this.messageHandlers[message.handlerName]
      if (handler) {
        handler(message.data, responseCallback)
      }
    },
    //Rest
    reset: function () {
      this.messageHandlers = {}
      this.responseCallbacks = {}
      this.uniqueId = 1
    },

    // 私有方法
    postMessageToNative: function (message) {
      //iOS[WKWebView iOS 8.0+ 推荐方式]
      if (window.webkit
        && window.webkit.messageHandlers
        && window.webkit.messageHandlers.eduJSBridge) {
        window.webkit.messageHandlers.eduJSBridge.postMessage(JSON.stringify(message))
        return;
      }

      //iOS[UIWebView iOS 10.0 以上被废弃] 或 Android
      if (window.eduJSBridgeMessageHandler) {
        window.eduJSBridgeMessageHandler.postMessage(JSON.stringify(message))
        return;
      }

      //logit
      this.log('** native inject eduJSCallNative Faild. **')
    },

    log: function (value) {
      //Faild
      console.log(value)
      //logTxt
      //document.getElementById("logtxt").innerHTML = value;
    }
  }
  // 公出
  window.eduJSBridge = new Bridge();
})();
