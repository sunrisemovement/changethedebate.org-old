// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"src/BaseElement.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BaseElement = void 0;

class BaseElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open'
    });
    this.addStyles();
  }

  connectedCallback() {
    this.importAttributes();
  }

  addStyles() {
    if ('adoptedStyleSheets' in this.shadowRoot) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(this.constructor.styles);
      this.shadowRoot.adoptedStyleSheets = [sheet];
    } else {
      const node = document.createElement('style');
      node.textContent = this.constructor.styles;
      this.shadowRoot.appendChild(node);
    }
  }

}

exports.BaseElement = BaseElement;
BaseElement.styles = '';
},{}],"src/YoutubeVideo.ts":[function(require,module,exports) {
"use strict";

var _BaseElement = require("./BaseElement");

const clamp = (min, max, value) => {
  return Math.min(Math.max(min, value), max);
};

class YoutubeVideo extends _BaseElement.BaseElement {
  constructor() {
    super(...arguments);
    this.videoId = '';
    this.startSeconds = 0;
    this.endSeconds = null;
    this.volume = 0;
    this.controls = true;
    this.modestBranding = false;
    this.disableKeyboard = false;
    this.autoplay = false;
    this.container = document.createElement('div');

    this.onChange = () => {
      switch (this.player.getPlayerState()) {
        case YT.PlayerState.UNSTARTED:
          this.setAttribute('player-state', 'unstarted');
          return;

        case YT.PlayerState.PLAYING:
          this.setAttribute('player-state', 'playing');
          this.dispatchEvent(new CustomEvent('playing'));
          return;

        case YT.PlayerState.ENDED:
          this.setAttribute('player-state', 'ended');
          this.dispatchEvent(new CustomEvent('ended'));
          return;

        case YT.PlayerState.PAUSED:
          this.dispatchEvent(new CustomEvent('paused'));

        default:
          return;
      }
    };
  }

  importAttributes() {
    this.videoId = this.getAttribute('video-id') || '';
    this.startSeconds = parseInt(this.getAttribute('start-seconds') || '0') || 0;
    this.endSeconds = parseInt(this.getAttribute('end-seconds') || '') || null;
    this.controls = this.getAttribute('controls') !== 'false';
    this.modestBranding = this.getAttribute('modest-branding') === 'true';
    this.disableKeyboard = this.getAttribute('keyboard') === 'false';
    this.autoplay = this.getAttribute('autoplay') === 'true';
    this.volume = this.parseVolume(this.getAttribute('volume') || '100');
  }

  static get observedAttributes() {
    return ['volume'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'volume':
        if (oldValue === newValue) return;
        this.volume = this.parseVolume(newValue || '100');
        this.player && this.player.setVolume(this.volume);
        return;

      default:
        return;
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.appendChild(this.container);
    await this.loadYoutubeIframeApi();
    this.player = await this.createPlayer();
    this.loadRequestedVideo();
    this.player.setVolume(this.volume);
  }

  parseVolume(attrValue) {
    const parsed = parseInt(attrValue);
    return isNaN(parsed) ? 100 : clamp(0, 100, parsed);
  }

  loadRequestedVideo() {
    this.player.loadVideoById({
      videoId: this.videoId,
      startSeconds: this.startSeconds,
      endSeconds: this.endSeconds || undefined,
      playerVars: {
        autoplay: this.autoplay,
        controls: this.controls ? 1 : 0,
        modestbranding: this.modestBranding ? 1 : 0,
        disablekb: this.disableKeyboard ? 1 : 0
      }
    });
  }

  loadYoutubeIframeApi() {
    return new Promise(resolve => {
      if (typeof YT === 'object' && YT !== null && YT.loaded === 1) {
        resolve();
        return;
      }

      window.addEventListener('youtubeiframeapiready', () => {
        resolve();
      }, {
        once: true
      });

      if (typeof window.onYouTubeIframeAPIReady !== 'function') {
        window.onYouTubeIframeAPIReady = () => {
          YT.ready(() => {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('youtubeiframeapiready'));
            });
          });
        };
      }

      if (document.getElementById('youtube-iframe-api') === null) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.id = 'youtube-iframe-api';
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }

  createPlayer() {
    return new Promise(resolve => {
      new YT.Player(this.container, {
        videoId: this.videoId,
        playerVars: {
          controls: this.controls ? 1 : 0
        },
        events: {
          onReady: e => resolve(e.target),
          onStateChange: this.onChange
        }
      });
    });
  }

}

YoutubeVideo.styles = `
    :host {
        display: inline-block;
        width: 644px;
        height: 362px;
        position: relative;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
  `;
customElements.define('youtube-video', YoutubeVideo);
},{"./BaseElement":"src/BaseElement.ts"}],"src/ActionNetworkForm.ts":[function(require,module,exports) {
"use strict";

var _BaseElement = require("./BaseElement");

class ActionNetworkForm extends _BaseElement.BaseElement {
  importAttributes() {}

  connectedCallback() {
    super.connectedCallback();
    const iframe = document.createElement('iframe');
    iframe.srcdoc = this.createIframeHtml();
    this.shadowRoot.append(iframe);
  }

  createIframeHtml() {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            h2 { display: none; }
          </style>
        </head>
        <body>
          <script src="https://actionnetwork.org/widgets/v3/form/join-us-in-detroit-to-changethedebate?format=js&source=widget"></script>
          <div id="can-form-area-join-us-in-detroit-to-changethedebate"></div>
        </body>
      </html>
    `;
  }

}

ActionNetworkForm.styles = `
    :host {
      display: block;
      min-content;
    }
    iframe {
      height: 100%;
      width: 100%;
      display: block;
      border: 0;
      background-color: white;
    }
  `;
customElements.define('action-network-form', ActionNetworkForm);
},{"./BaseElement":"src/BaseElement.ts"}],"src/Main.ts":[function(require,module,exports) {
"use strict";

require("./YoutubeVideo");

require("./ActionNetworkForm");

const video = document.querySelector('youtube-video');
},{"./YoutubeVideo":"src/YoutubeVideo.ts","./ActionNetworkForm":"src/ActionNetworkForm.ts"}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "51258" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js","src/Main.ts"], null)
//# sourceMappingURL=/Main.4e122fbc.js.map