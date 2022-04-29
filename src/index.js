
const _fetch = window.fetch
const _Rock = window.Rock

export class RockClient {
  constructor (config) {
    if (_fetch === undefined) {
      throw new Error('Unsupported Browser')
    }

    if (config === undefined) {
      config = {}
    }

    if (_Rock && config === undefined) {
      this.url = `${window.location.origin}/api`
      this.sameOrigin = true
    } else {
      this.url = config.url || 'https://rock.rocksolidchurchdemo.com/'
      this.username = config.username || 'admin'
      this.password = config.password || 'admin'
      this.sameOrigin = window.location.origin.startsWith(this.url)
    }

    this.url = this.url.replace(/\/+/g, '/').replace(/\/+$/, '')
    if (!this.url.endsWith('/api')) {
      this.url += '/api'
    }
  }

  async authenticate () {
    if (!this.sameOrigin || (this.username && this.password)) {
      try {
          const response = await _fetch(`${this.url}/Auth/Login`, {  // eslint-disable-line
          method: 'POST',
          body: {
            Username: this.username,
            Password: this.password,
            Persisted: true
          }
        })

        if (response.ok) {
          this.cookie = response.headers['set-cookie'][0]

          return Promise.resolve()
        }

        return Promise.reject(response.status)
      } catch (ex) {
        return Promise.reject(ex)
      }
    }

    return Promise.resolve()
  }

  async _request (config) {
    if (typeof config !== 'object') {
      return Promise.reject(new Error('Invalid config'))
    }

    try {
      const _url = new URL(`${this.url}/${config.path}`)
      if (config.params && typeof config.params === 'object') {
        Object.keys(config.params).forEach(key => {
          const value = config.params[key]
          _url.searchParams.set(key, value)
        })
      }

      const method = config.method || 'GET'
      const headers = (this.cookie !== undefined) ? { Cookie: this.cookie } : {}

      const response = await _fetch(_url.href, {
        method,
        headers,
        body: config.data
      })

      if (response.ok) {
        const data = await response.json()
        return Promise.resolve(data)
      }

      return Promise.reject(response.status)
    } catch (ex) {
      return Promise.reject(ex)
    }
  }

  request (_resource) {
    const _self = this
    const _obj = {
      method: 'GET',
      path: undefined,
      resource: _resource,
      id: undefined,
      params: {}
    }

    return {
      method: function (method) {
        _obj.method = method || _obj.method
        return this
      },
      resource: function (resource) {
        _obj.resource = resource || _obj.resource
        return this
      },
      id: function (id) {
        _obj.id = id
        return this
      },
      parameters: function (parameters) {
        const params = parameters || {}
        _obj.params = params
        return this
      },
      addParameter: function (key, value) {
        _obj.params[key] = value
        return this
      },
      removeParameter: function (key) {
        delete _obj.params[key]
        return this
      },
      clearParameters: function () {
        if (_obj.params && typeof _obj.params === 'object') {
          for (const key in _obj.params) delete _obj.params[key]
        }
      },
      body: function (body) {
        _obj.data = body || _obj.data
        return this
      },
      clearBody: function () {
        _obj.data = undefined
        return this
      },
      request: async function () {
        if (_obj.resource === undefined) {
          return Promise.reject(new Error('Missing Resource'))
        }

        _obj.path = (_obj.id !== undefined) ? `${_obj.resource}/${_obj.id}` : _obj.resource
        return _self.request(_obj)
      },
      get: async function () {
        return this.method('GET').request()
      },
      post: async function (data) {
        return this.method('POST').body(data).request()
      },
      patch: async function (data) {
        return this.method('PATCH').body(data).request()
      },
      put: async function (data) {
        return this.method('PUT').body(data).request()
      },
      delete: async function () {
        return this.method('DELETE').request()
      }
    }
  }
}

window.DTS = window.DTS || {}
window.DTS.RockClient = RockClient
