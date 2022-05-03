const $cf838c15c8b009ba$var$_fetch = window.fetch;
const $cf838c15c8b009ba$var$_Rock = window.Rock;
function $cf838c15c8b009ba$var$_createCache() {
    const _cache = new Map();
    function hasExpired(time) {
        return time < Date.now();
    }
    return {
        _set: async function(key, value, ttl) {
            const _value = [
                value
            ];
            if (ttl) _value.push(new Date(Date.now() + ttl).getTime());
            _cache.set(key, _value);
            return value;
        },
        resolve: async function(key, value, ttl) {
            const _storedValue = _cache.get(key);
            if (_storedValue === undefined && value === undefined) return undefined;
            if (_storedValue === undefined && value !== undefined) {
                const _newValue = typeof value === 'function' ? await value() : value;
                this._set(key, _newValue, ttl);
                return _newValue;
            }
            const [_cachedValue, _ttl] = _storedValue;
            if (hasExpired(_ttl)) {
                if (value !== undefined) {
                    const _newValue = typeof value === 'function' ? await value() : value;
                    this._set(key, _newValue, ttl);
                    return _newValue;
                }
                _cache.delete(key);
                return undefined;
            }
            return _cachedValue;
        },
        delete: async function(key, contains) {
            if (contains) {
                const keys = Array.from(_cache.keys());
                keys.forEach((_key)=>{
                    if (_key.indexOf(key) >= 0) _cache.delete(_key);
                });
            }
            _cache.delete(key);
        },
        clear: async function() {
            _cache.clear();
        }
    };
}
class $cf838c15c8b009ba$export$8bf6809db3440abc {
    constructor(config){
        if ($cf838c15c8b009ba$var$_fetch === undefined) throw new Error('Unsupported Browser');
        config = config || {};
        if ($cf838c15c8b009ba$var$_Rock && config.url === undefined) {
            this.url = window.location.origin;
            this.sameOrigin = true;
        } else {
            this.url = config.url || window.location.origin;
            this.username = config.username;
            this.password = config.password;
            this.token = config.token;
            this.sameOrigin = window.location.origin.startsWith(this.url);
        }
        this.url = this.url.replace(/\/+/g, '/').replace(/\/+$/, '');
        if (!this.url.endsWith('/api')) this.url += '/api';
        this._memoryCache = $cf838c15c8b009ba$var$_createCache();
        this.API = {};
    }
    async authenticate() {
        if (!this.token && (!this.sameOrigin || this.username && this.password)) try {
            const response = await $cf838c15c8b009ba$var$_fetch(`${this.url}/Auth/Login`, {
                method: 'POST',
                body: {
                    Username: this.username,
                    Password: this.password,
                    Persisted: true
                }
            });
            if (response.ok) {
                this.cookie = response.headers['set-cookie'][0];
                return Promise.resolve();
            }
            return Promise.reject(response.status);
        } catch (ex) {
            return Promise.reject(ex);
        }
        return Promise.resolve();
    }
    async _request(req, ctx) {
        const _self = ctx || this;
        if (typeof req !== 'object') return Promise.reject(new Error('Invalid config'));
        try {
            const _url = new URL(`${_self.url}/${req.path}`);
            if (req.params && typeof req.params === 'object') Object.keys(req.params).forEach((key)=>{
                const value = req.params[key];
                _url.searchParams.set(key, value);
            });
            const method = req.method || 'GET';
            const headers = _self.cookie !== undefined ? {
                Cookie: _self.cookie
            } : {};
            if (_self.token) headers['Authorization-Token'] = _self.token;
            const response = await $cf838c15c8b009ba$var$_fetch(_url.href, {
                method: method,
                headers: headers,
                body: req.data
            });
            if (response.ok) {
                const data = await response.json();
                return Promise.resolve(data);
            }
            return Promise.reject(response.status);
        } catch (ex) {
            return Promise.reject(ex);
        }
    }
    async _cacheRequest(req, ctx) {
        const _self = ctx || this;
        const cacheKey = JSON.stringify(req);
        return _self._memoryCache.resolve(cacheKey, ()=>_self._request(req, ctx)
        , 300000);
    }
    request(_resource, useCache, ctx) {
        const _self = ctx || this;
        const _requestMethod = async function(req) {
            if (useCache) return _self._cacheRequest(req, _self);
            return _self._request(req, _self);
        };
        const _obj = {
            method: 'GET',
            path: undefined,
            resource: _resource,
            id: undefined,
            params: {}
        };
        return {
            newRequest: function() {
                _obj.resource = _resource;
                _obj.method = 'GET';
                _obj.path = undefined;
                _obj.id = undefined;
                _obj.params = {};
                return this;
            },
            method: function(method) {
                _obj.method = method || _obj.method;
                return this;
            },
            resource: function(resource) {
                _obj.resource = resource || _obj.resource;
                return this;
            },
            id: function(id) {
                _obj.id = id || _obj.id;
                return this;
            },
            clearId: function() {
                _obj.id = undefined;
                return this;
            },
            parameters: function(parameters) {
                const params = parameters || {};
                _obj.params = params;
                return this;
            },
            addParameter: function(key, value) {
                _obj.params[key] = value;
                return this;
            },
            removeParameter: function(key) {
                delete _obj.params[key];
                return this;
            },
            clearParameters: function() {
                if (_obj.params && typeof _obj.params === 'object') for(const key in _obj.params)delete _obj.params[key];
            },
            body: function(body) {
                _obj.data = body || _obj.data;
                return this;
            },
            clearBody: function() {
                _obj.data = undefined;
                return this;
            },
            expand: function(entities) {
                let _entities = entities || '';
                if (Array.isArray(entities)) _entities = entities.join(',').trim();
                this.addParameter('$expand', _entities);
                return this;
            },
            filter: function(query) {
                this.addParameter('$filter', query);
                return this;
            },
            select: function(fields) {
                let _fields = fields || '';
                if (Array.isArray(fields)) _fields = fields.join(',').trim();
                this.addParameter('$select', _fields);
                return this;
            },
            orderBy: function(fields) {
                let _fields = fields || '';
                if (Array.isArray(fields)) _fields = fields.join(',').trim();
                this.addParameter('$orderby', _fields);
                return this;
            },
            skip: function(page) {
                this.addParameter('$skip', page);
                return this;
            },
            top: function(limit) {
                this.addParameter('$top', limit);
                return this;
            },
            request: async function() {
                if (_obj.resource === undefined) return Promise.reject(new Error('Missing Resource'));
                _obj.path = _obj.id !== undefined ? `${_obj.resource}/${_obj.id}` : _obj.resource;
                return _requestMethod(_obj);
            },
            getAll: async function() {
                return this.clearId().method('GET').request();
            },
            paginate: async function(page, limit) {
                page = page || 0;
                limit = limit || 10;
                return this.clearId().addParameter('$skip', page).addParameter('$top', limit).method('GET').request();
            },
            get: async function(id) {
                return this.method('GET').id(id).request();
            },
            find: async function(query) {
                return this.method('GET').addParameter('$filter', query).request();
            },
            post: async function(data) {
                return this.method('POST').body(data).request();
            },
            patch: async function(id, data) {
                return this.method('PATCH').id(id).body(data).request();
            },
            put: async function(id, data) {
                return this.method('PUT').id(id).body(data).request();
            },
            delete: async function(id) {
                return this.method('DELETE').id(id).request();
            },
            attribute: function(attributeKey) {
                const _reqObj = _obj;
                const _this = this;
                const _attributeKey = attributeKey;
                return {
                    get: async function() {
                        if (_reqObj.id === undefined) return Promise.reject(new Error('Missing Id'));
                        _this.addParameter('loadAttributes', 'simple');
                        _this.addParameter('attributeKeys', _attributeKey);
                        const response = await _this.get();
                        if (response && response.AttributeValues) return Promise.resolve(response.AttributeValues[_attributeKey]);
                        return Promise.resolve();
                    },
                    set: async function(value) {
                        if (_reqObj.id === undefined) return Promise.reject(new Error('Missing Id'));
                        const _priorResource = _reqObj.resource;
                        _this.resource(`${_priorResource}/AttributeValue`);
                        _this.addParameter('attributeKey', _attributeKey);
                        _this.addParameter('attributeValue', value);
                        const response = await _this.post();
                        _this.clearParameters();
                        _this.resource(_priorResource);
                        return Promise.resolve(response);
                    },
                    delete: async function() {
                        if (_reqObj.id === undefined) return Promise.reject(new Error('Missing Id'));
                        const _priorResource = _reqObj.resource;
                        _this.resource(`${_priorResource}/AttributeValue`);
                        _this.addParameter('attributeKey', _attributeKey);
                        const response = await _this.delete();
                        _this.clearParameters();
                        _this.resource(_priorResource);
                        return Promise.resolve(response);
                    }
                };
            }
        };
    }
    _baseAPI(_resouce, _useCache) {
        const _self = this;
        const _apiResource = _resouce;
        const _apiUseCache = _useCache;
        const _baseRequest = _self.request(_apiResource, _apiUseCache, _self);
        const _baseRequestMethods = {};
        Object.keys(_baseRequest).forEach((key)=>{
            _baseRequestMethods[key] = _baseRequest[key];
        });
        return {
            ..._baseRequestMethods
        };
    }
    async generateAPI(_useCache) {
        this.API.Lava = this.Lava;
        this.API.Utility = this.Utility;
        this.API.RockDateTime = this.Utility.RockDateTime;
        const controllers = await this.request('RestControllers').select('Name').orderBy('Name').getAll();
        if (controllers && Array.isArray(controllers)) {
            const _self = this;
            controllers.forEach((controller)=>{
                if (_self.API[controller.Name] === undefined) _self.API[controller.Name] = {
                    ..._self._baseAPI(controller.Name, _useCache)
                };
            });
        }
        return Promise.resolve(this);
    }
    Lava = (function(ctx) {
        return {
            render: async function(template, additionalMergeObjects) {
                const params = {};
                if (additionalMergeObjects) params.additionalMergeObjects = additionalMergeObjects;
                const req = ctx.request('Lava/RenderTemplate');
                if (additionalMergeObjects) req.addParameter('additionalMergeObjects', additionalMergeObjects);
                let response = await req.post(template);
                if (response && (template.endsWith(' ToJSON }}') || template.endsWith(' ToJSON}}'))) response = JSON.parse(response);
                return Promise.resolve(response);
            }
        };
    })(this);
    Utility = (function(ctx) {
        return {
            RockDateTime: {
                TimeUnit: class {
                    static Years = 'y';
                    static Months = 'M';
                    static Weeks = 'w';
                    static Days = 'd';
                    static Hours = 'h';
                    static Minutes = 'm';
                    static Seconds = 's';
                },
                _getDate: async function(template) {
                    const response = await ctx.Lava.render(template);
                    if (response) try {
                        const dt = new Date(response);
                        if (dt.toISOString()) return Promise.resolve(dt) // toISOString will throw an error if the date could not parse
                        ;
                    } catch (ex) {
                        return Promise.reject(ex);
                    }
                    return Promise.reject(new Error('Invalid Server Response'));
                },
                now: async function() {
                    return this._getDate("{{ 'Now' | Date:'yyyy-MM-ddTHH:mm:ssK' }}");
                },
                add: async function(interval, timeUnit, date) {
                    if (interval === undefined) return Promise.reject(new Error('Missing interval arugment'));
                    timeUnit = timeUnit || this.TimeUnit.Days;
                    date = date || await this.now();
                    const template = `{% assign date = '${date.toISOString()}' | AsDateTime | Date:'yyyy-MM-ddTHH:mm:ssK' %}{{ date | DateAdd:${interval},'${timeUnit}' }}`;
                    return this._getDate(template);
                },
                iCalDates: async function(ical, occurrences) {
                    if (ical === undefined || typeof ical !== 'string') return Promise.reject(new Error('Missing or invalid ical arugment'));
                    occurrences = occurrences || 'All';
                    const template = `{{ ${ical} | DatesFromICal:${occurrences} | ToJSON }}`;
                    const response = await ctx.Lava.render(template);
                    if (response) try {
                        const json = typeof response !== 'object' ? JSON.parse(response) : response;
                        return Promise.resolve(json);
                    } catch (ex) {
                        return Promise.reject(ex);
                    }
                    return Promise.reject(new Error('Invalid Server Response'));
                },
                humanize: async function(date) {
                    date = date || await this.now();
                    const template = `{% assign date = '${date.toISOString()}' | AsDateTime | Date:'yyyy-MM-ddTHH:mm:ssK' %}{{ date | HumanizeDateTime }}`;
                    const response = await ctx.Lava.render(template);
                    if (response) return Promise.resolve(response);
                    return Promise.reject(new Error('Invalid Server Response'));
                },
                sunday: async function(date, week) {
                    date = date || await this.now();
                    const template = week === undefined ? `{% assign date = '${date.toISOString()}' | AsDateTime | Date:'yyyy-MM-ddTHH:mm:ssK' %}{{ date | SundayDate }}` : `{% assign date = '${date.toISOString()}' | AsDateTime | Date:'yyyy-MM-ddTHH:mm:ssK' %}{{ date | SundayDate | DateAdd:${week * 7} }}`;
                    return this._getDate(template);
                }
            }
        };
    })(this);
}
window.DTS = window.DTS || {};
window.DTS.RockClient = $cf838c15c8b009ba$export$8bf6809db3440abc;


export {$cf838c15c8b009ba$export$8bf6809db3440abc as RockClient};
//# sourceMappingURL=rockclient-module.js.map
