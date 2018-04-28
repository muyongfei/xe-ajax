'use strict'

var utils = require('../core/utils')
var xhrExports = require('./xhr')
var interceptorExports = require('../handle/interceptor')
var handleExports = require('../handle')

/**
 * fetch
 * @param { XERequest } request
 * @param { Promise.resolve } resolve
 * @param { Promise.reject } reject
 */
function sendFetch (request, resolve, reject) {
  var $fetch = utils.isFunction(request.$fetch) ? request.$fetch : self.fetch
  var options = {
    _request: request,
    method: request.method,
    cache: request.cache,
    credentials: request.credentials,
    body: request.getBody(),
    headers: request.headers
  }
  if (request.timeout) {
    setTimeout(function () {
      reject(new TypeError('Request timeout.'))
    }, request.timeout)
  }
  if (request.signal && request.signal.aborted) {
    reject(new TypeError('The user aborted a request.'))
  } else {
    $fetch(request.getUrl(), options).then(function (resp) {
      interceptorExports.responseInterceptor(request, handleExports.toResponse(resp, request)).then(resolve)
    }).catch(reject)
  }
}

function getRequest (request) {
  if (request.$fetch) {
    return request.signal ? xhrExports.sendXHR : sendFetch
  } else if (typeof self !== 'undefined' && self.fetch) {
    if (typeof AbortController === 'function' && typeof AbortSignal === 'function') {
      return sendFetch
    }
    return request.signal ? xhrExports.sendXHR : sendFetch
  }
  return xhrExports.sendXHR
}

function createRequestFactory () {
  if (typeof self !== 'undefined' && self.fetch) {
    return function (request, resolve, reject) {
      return getRequest(request).apply(this, arguments)
    }
  }
  return xhrExports.sendXHR
}

var sendRequest = createRequestFactory()

function fetchRequest (request, resolve, reject) {
  return interceptorExports.requestInterceptor(request).then(function () {
    return sendRequest(request, resolve, reject)
  })
}

var fetchExports = {
  fetchRequest: fetchRequest
}

module.exports = fetchExports
