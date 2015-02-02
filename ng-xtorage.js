;(function()
{
    "use strict";

    angular
        .module('emd.ng-xtorage', [])
        .provider('$xtorage', function()
        {
            var self = this;

            var INFINITY = 'infinity';
            var SESSION_STORAGE = 'sessionStorage';
            var LOCAL_STORAGE = 'localStorage';
            var EXPIRATION_KEY = '$xpiration';
            var CHECK_EXPIRATION = 1000 * 60;

            self.storage = LOCAL_STORAGE;
            self.storageExpiration = INFINITY;

            this.$get = ['$window', '$interval', function($window, $interval)
            {
                var DEFAULT_STORAGE = self.storage;
                var DEFAULT_EXPIRATION = self.storageExpiration;

                var _tryParseToObject = function (str, isNumber)
                {
                    var _info = null;

                    try
                    {
                        _info = angular.fromJson(str);
                    }
                    catch(e)
                    {
                        _info = (isNumber) ? parseInt(str) : str;
                    }

                    return _info;
                }

                var _isItANumber = function (str)
                {
                    var NUMBER_PATTERN = /[0-9]/;

                    if (!angular.isString(str) || !str.length)
                        return null;

                    for (var i = 0; i < str.length; i++)
                    {
                        if (!NUMBER_PATTERN.test(str[i]))
                            return false;
                    }

                    return true;
                }

                var _isArrayFilled = function (arr) {
                    return angular.isArray(arr) && arr.length;
                }

                var _getStorageType = function (options) {
                    var _options = angular.isObject(options) ? options : {};

                    return _options.storage || DEFAULT_STORAGE;
                };

                var _getExpiration = function(options)
                {
                    var _options = angular.isObject(options) ? options : {};

                    return _options.expiration || DEFAULT_EXPIRATION;
                }

                var _pushExpirationToTheStorage = function(expObject)
                {
                    var _fromLocalStorage = this.getFromLocalStorage(EXPIRATION_KEY) || [];
                    _fromLocalStorage.push(expObject)

                    var _toLocalStorage = angular.copy(_fromLocalStorage);

                    _save(EXPIRATION_KEY, _toLocalStorage, 'localStorage');
                }

                var _registerExpiration = function (key, expiration)
                {
                    var _xtorage = this;
                    var _expirationObject = {};

                    _expirationObject.key = key;
                    _expirationObject.expire = $window.Date.now() + expiration;

                    _pushExpirationToTheStorage.call(_xtorage, _expirationObject);

                    var _intervalClear = $interval(function()
                    {

                        _xtorage.removeFromLocalStorage(key);
                        _xtorage.removeFromSessionStorage(key);

                        $interval.cancel(_intervalClear);

                    }, CHECK_EXPIRATION);
                }

                var _save = function(key, info, storage)
                {
                    angular.isObject(info) ? $window[storage].setItem(key, angular.toJson(info))
                                           : $window[storage].setItem(key, info);
                }

                var _saveInStorage = function (key, info, options)
                {
                    var _storage = _getStorageType(options);
                    var _expiration = _getExpiration(options);

                    if (_isArrayFilled(key))
                    {
                        for (var i = 0; i < key.length; i++)
                        {
                            _save(key[i], info[i], _storage);

                            if (_expiration !== INFINITY)
                                _registerExpiration.call(this, key[i], _expiration);
                        }
                    }
                    else
                    {
                        _save(key, info, _storage);

                        if (_expiration !== INFINITY)
                            _registerExpiration.call(this, key, _expiration);
                    }
                };

                var _getFromStorage = function (key, options) {
                    var _storage = _getStorageType(options);
                    var _fromStorage = $window[_storage].getItem(key);
                    var _info = [];

                    if (_isArrayFilled(key))
                    {
                        for (var i = 0; i < key.length; i++)
                        {
                            var _arrayFromStorage = $window[_storage].getItem(key[i]);

                            if (_arrayFromStorage) // only push the response if it's defined
                                _info.push(_tryParseToObject(_arrayFromStorage));
                        }

                        if (!_isArrayFilled(_info))
                            _info = null;
                    }
                    else
                        _info = _tryParseToObject(_fromStorage, _isItANumber(_fromStorage));

                    return _info;
                };

                var _removeFromStorage = function (key, options)
                {
                    var _storage = _getStorageType(options);

                    if (_isArrayFilled(key))
                    {
                        for (var i = 0; i < key.length; i++)
                            $window[_storage].removeItem(key[i]);
                    }
                    else
                        $window[_storage].removeItem(key);
                };

                var _clearStorage = function (options)
                {
                    var _storage = _getStorageType(options);

                    $window[_storage].clear();
                };



                /*          PROXIES           */

                var _getFromSessionStorageProxy = function(key)
                {
                    return this.get(key, {storage: SESSION_STORAGE});
                }

                var _getFromLocalStorageProxy = function(key)
                {
                    return this.get(key, {storage: LOCAL_STORAGE});
                }

                var _saveInSessionStorageProxy = function(key, info)
                {
                    this.save(key, info, {storage: SESSION_STORAGE});
                }

                var _saveInLocalStorageProxy = function(key, info)
                {
                    this.save(key, info, {storage: LOCAL_STORAGE});
                }

                var _removeFromSessionStorageProxy = function(key)
                {
                    this.remove(key, {storage: SESSION_STORAGE});
                }

                var _removeFromLocalStorageProxy = function(key)
                {
                    this.remove(key, {storage: LOCAL_STORAGE});
                }

                var _clearSessionStorageProxy = function(key)
                {
                    this.clear(key, {storage: SESSION_STORAGE});
                }

                var _clearLocalStorageProxy = function(key)
                {
                    this.clear(key, {storage: LOCAL_STORAGE});
                }




                /*          API          */

                return {
                    get: _getFromStorage,
                    save: _saveInStorage,
                    remove: _removeFromStorage,
                    clear: _clearStorage,

                    getFromSessionStorage: _getFromSessionStorageProxy,
                    getFromLocalStorage: _getFromLocalStorageProxy,

                    saveInSessionStorage: _saveInSessionStorageProxy,
                    saveInLocalStorage: _saveInLocalStorageProxy,

                    removeFromSessionStorage: _removeFromSessionStorageProxy,
                    removeFromLocalStorage: _removeFromLocalStorageProxy,

                    clearSessionStorage: _clearSessionStorageProxy,
                    clearLocalStorage: _clearLocalStorageProxy
                };
            }];
        });
}())