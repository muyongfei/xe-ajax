import { isFunction, isFormData, isCrossOrigin, serialize, objectAssign, getLocatOrigin } from '../core/utils'
import { XEHeaders } from '../entity/headers'

export function XERequest (options) {
  objectAssign(this, {url: '', body: null, params: null, signal: null}, options)
  this.headers = new XEHeaders(options.headers)
  this.method = String(this.method).toLocaleUpperCase()
  this.bodyType = String(this.bodyType).toLocaleUpperCase()
  this.crossOrigin = isCrossOrigin(this)
  if (this.signal && isFunction(this.signal.install)) {
    this.signal.install(this)
  }
}

objectAssign(XERequest.prototype, {
  abort: function (response) {
    this.xhr.abort(response)
  },
  getUrl: function () {
    var url = this.url
    var params = ''
    if (url) {
      if (isFunction(this.transformParams)) {
        // 避免空值报错，params 始终保持是对象
        this.params = this.transformParams(this.params || {}, this)
      }
      if (this.params && !isFormData(this.params)) {
        params = isFunction(this.paramsSerializer) ? this.paramsSerializer(this.params, this) : serialize(this.params)
      }
      if (params) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + params
      }
      if (/\w+:\/{2}.*/.test(url)) {
        return url
      }
      if (url.indexOf('/') === 0) {
        return getLocatOrigin() + url
      }
      return this.baseURL.replace(/\/$/, '') + '/' + url
    }
    return url
  },
  getBody: function () {
    var request = this
    var XEPromise = request.$Promise || Promise
    return new XEPromise(function (resolve, reject) {
      var result = null
      if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          if (isFunction(request.transformBody)) {
            // 避免空值报错，body 始终保持是对象
            request.body = request.transformBody(request.body || {}, request) || request.body
          }
          if (isFunction(request.stringifyBody)) {
            result = request.stringifyBody(request.body, request) || null
          } else {
            if (isFormData(request.body)) {
              result = request.body
            } else if (String(request.bodyType).toLocaleUpperCase() === 'FORM_DATA') {
              result = serialize(request.body)
            } else {
              result = JSON.stringify(request.body)
            }
          }
        } catch (e) {
          console.error(e)
        }
      }
      resolve(result)
    }, request.$context)
  }
})