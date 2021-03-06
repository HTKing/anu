/**
 * IE6+，有问题请加QQ 370262116 by 司徒正美 Copyright 2017-08-21
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.React = factory());
}(this, (function () {

var __type = Object.prototype.toString;
var __push = Array.prototype.push;

var HTML_KEY = "dangerouslySetInnerHTML";

/**
 * 复制一个对象的属性到另一个对象
 *
 * @param {any} obj
 * @param {any} props
 * @returns
 */
function extend(obj, props) {
  if (props) {
    for (var i in props) {
      if (props.hasOwnProperty(i)) obj[i] = props[i];
    }
  }
  return obj;
}
/**
 * 一个空函数
 *
 * @export
 */
function noop() {}

/**
 * 类继承
 *
 * @export
 * @param {any} SubClass
 * @param {any} SupClass
 */
function inherit(SubClass, SupClass) {
  function Bridge() {}
  Bridge.prototype = SupClass.prototype;

  var fn = SubClass.prototype = new Bridge();

  // 避免原型链拉长导致方法查找的性能开销
  extend(fn, SupClass.prototype);
  fn.constructor = SubClass;
  return fn;
}

/**
 * 收集一个元素的所有孩子
 *
 * @export
 * @param {any} dom
 * @returns
 */
function getNodes(dom) {
  var ret = [],
      c = dom.childNodes || [];
  // eslint-disable-next-line
  for (var i = 0, el; el = c[i++];) {
    ret.push(el);
  }
  return ret;
}

var lowerCache = {};
/**
 * 小写化的优化
 * 
 * @export
 * @param {any} s 
 * @returns 
 */
function toLowerCase(s) {
  return lowerCache[s] || (lowerCache[s] = s.toLowerCase());
}

function clearArray(a) {
  return a.splice(0, a.length);
}

/**
 *
 *
 * @param {any} obj
 * @returns
 */
function isFn(obj) {
  return typeNumber(obj) === 5;
}

var rword = /[^, ]+/g;

function oneObject(array, val) {
  if (typeNumber(array) === 4) {
    array = array.match(rword) || [];
  }
  var result = {},

  //eslint-disable-next-line
  value = val !== void 666 ? val : 1;
  for (var i = 0, n = array.length; i < n; i++) {
    result[array[i]] = value;
  }
  return result;
}

function getChildContext(instance, context) {
  if (instance.getChildContext) {
    return Object.assign({}, context, instance.getChildContext());
  }
  return context;
}
var rcamelize = /[-_][^-_]/g;

function camelize(target) {
  //提前判断，提高getStyle等的效率
  if (!target || target.indexOf("-") < 0 && target.indexOf("_") < 0) {
    return target;
  }
  //转换为驼峰风格
  return target.replace(rcamelize, function (match) {
    return match.charAt(1).toUpperCase();
  });
}

var options = {
  beforeUnmount: noop,
  afterMount: noop,
  afterUpdate: noop
};

function checkNull(vnode, type) {
  if (Array.isArray(vnode) && vnode.length === 1) {
    vnode = vnode[0];
  }
  if (vnode === null || vnode === false) {
    return { type: "#comment", text: "empty", vtype: 0 };
  } else if (!vnode || !vnode.vtype) {
    throw new Error("@" + type.name + "#render:You may have returned undefined, an array or some other invalid object");
  }
  return vnode;
}
var numberMap = {
  //null undefined IE6-8这里会返回[object Object]
  "[object Boolean]": 2,
  "[object Number]": 3,
  "[object String]": 4,
  "[object Function]": 5,
  "[object Symbol]": 6,
  "[object Array]": 7
};
// undefined: 0, null: 1, boolean:2, number: 3, string: 4, function: 5, array: 6, object:8
function typeNumber(data) {
  if (data === null) {
    return 1;
  }
  if (data === void 666) {
    return 0;
  }
  var a = numberMap[__type.call(data)];
  return a || 8;
}

function getComponentProps(vnode) {
  var defaultProps = vnode.type.defaultProps;
  var props = vnode.props;
  if (defaultProps) {
    for (var i in defaultProps) {
      //eslint-disable-next-line
      if (props[i] === void 666) {
        props[i] = defaultProps[i];
      }
    }
  }
  return props;
}

var recyclables = {
  "#text": [],
  "#comment": []
};

var stack = [];
var EMPTY_CHILDREN = [];

var CurrentOwner = {
    cur: null
};
/**
 * 创建虚拟DOM
 *
 * @param {string} type
 * @param {object} props
 * @param {array} ...children
 * @returns
 */

function createElement(type, configs) {
    var props = {},
        key = null,
        ref = null,
        vtype = 1,
        checkProps = 0;

    for (var i = 2, n = arguments.length; i < n; i++) {
        stack.push(arguments[i]);
    }
    if (configs) {
        // eslint-disable-next-line
        for (var _i in configs) {
            var val = configs[_i];
            switch (_i) {
                case "key":
                    key = val + "";
                    break;
                case "ref":
                    ref = val;
                    break;
                case "children":
                    //只要不是通过JSX产生的createElement调用，props内部就千奇百度，
                    //children可能是一个数组，也可能是一个字符串，数字，布尔，
                    //也可能是一个虚拟DOM
                    if (!stack.length && val) {
                        if (Array.isArray(val)) {
                            __push.apply(stack, val);
                        } else {
                            stack.push(val);
                        }
                    }
                    break;
                default:
                    checkProps = 1;
                    props[_i] = val;
            }
        }
    }

    var children = flattenChildren(stack);

    if (typeNumber(type) === 5) {
        //fn
        vtype = type.prototype && type.prototype.render ? 2 : 4;
        if (children.length) props.children = children;
    } else {
        props.children = children;
    }

    return new Vnode(type, props, key, ref, vtype, checkProps);
}

function flattenChildren(stack) {
    var lastText,
        child,
        children = [];

    while (stack.length) {
        //比较巧妙地判定是否为子数组
        if ((child = stack.pop()) && child.pop) {
            if (child.toJS) {
                //兼容Immutable.js
                child = child.toJS();
            }
            for (var i = 0; i < child.length; i++) {
                stack[stack.length] = child[i];
            }
        } else {
            // eslint-disable-next-line
            var childType = typeNumber(child);
            if (childType < 3 // 0, 1,2
            ) {
                    continue;
                }

            if (childType < 6) {
                //!== 'object'
                //不是对象就是字符串或数字
                if (lastText) {
                    lastText.text = child + lastText.text;
                    continue;
                }
                child = {
                    type: "#text",
                    text: child + "",
                    vtype: 0
                };
                lastText = child;
            } else {
                lastText = null;
            }

            children.unshift(child);
        }
    }
    if (!children.length) {
        children = EMPTY_CHILDREN;
    }
    return children;
}

//fix 0.14对此方法的改动，之前refs里面保存的是虚拟DOM
function getDOMNode() {
    return this;
}
function __ref(dom) {
    var instance = this._owner;
    if (dom && instance) {
        dom.getDOMNode = getDOMNode;
        instance.refs[this.__refKey] = dom;
    }
}
function Vnode(type, props, key, ref, vtype, checkProps) {
    this.type = type;
    this.props = props;
    this.vtype = vtype;
    this._owner = CurrentOwner.cur;
    if (key) {
        this.key = key;
    }

    if (vtype === 1) {
        this.checkProps = checkProps;
    }
    var refType = typeNumber(ref);
    if (refType === 4) {
        //string
        this.__refKey = ref;
        this.ref = __ref;
    } else if (refType === 5) {
        //function
        this.ref = ref;
    }
    /*
      this._hostNode = null
      this._instance = null
    */
}

Vnode.prototype = {
    getDOMNode: function getDOMNode() {
        return this._hostNode || null;
    },

    $$typeof: 1
};

function cloneElement(vnode, props) {
    if (Array.isArray(vnode)) {
        vnode = vnode[0];
    }
    if (!vnode.vtype) {
        return Object.assign({}, vnode);
    }
    var obj = {};
    if (vnode.key) {
        obj.key = vnode.key;
    }

    if (vnode.__refKey) {
        obj.ref = vnode.__refKey;
    } else if (vnode.ref) {
        obj.ref = vnode.ref;
    }
    return createElement(vnode.type, Object.assign(obj, vnode.props, props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.props.children);
}

//用于后端的元素节点
function DOMElement(type) {
  this.nodeName = type;
  this.style = {};
  this.children = [];
}
var fn$1 = DOMElement.prototype = {
  contains: Boolean
};
String("replaceChild,appendChild,removeAttributeNS,setAttributeNS,removeAttribute,setAttribute" + ",getAttribute,insertBefore,removeChild,addEventListener,removeEventListener,attachEvent" + ",detachEvent").replace(/\w+/g, function (name) {
  fn$1[name] = function () {
    console.log("fire " + name); // eslint-disable-line
  };
});

//用于后端的document
var fakeDoc = new DOMElement();
fakeDoc.createElement = fakeDoc.createElementNS = fakeDoc.createDocumentFragment = function (type) {
  return new DOMElement(type);
};
fakeDoc.createTextNode = fakeDoc.createComment = Boolean;
fakeDoc.documentElement = new DOMElement("html");
fakeDoc.nodeName = "#document";
fakeDoc.textContent = "";
try {
  var w = window;
  var b = !!w.alert;
} catch (e) {
  b = false;
  w = {
    document: fakeDoc
  };
}


var win = w;

var document = w.document || fakeDoc;
var isStandard = "textContent" in document;
var fragment = document.createDocumentFragment();
function emptyElement(node) {
  var child;
  while (child = node.firstChild) {
    if (child.nodeType === 1) {
      emptyElement(child);
    }
    node.removeChild(child);
  }
}

function removeDOMElement(node) {
  if (node.nodeType === 1) {
    if (isStandard) {
      node.textContent = "";
    } else {
      emptyElement(node);
    }
    node.__events = null;
  } else if (node.nodeType === 3) {
    //只回收文本节点
    recyclables["#text"].push(node);
  }
  fragment.appendChild(node);
  fragment.removeChild(node);
}

var versions = {
  88: 7, //IE7-8 objectobject
  80: 6, //IE6 objectundefined
  "00": NaN, // other modern browsers
  "08": NaN
};
/* istanbul ignore next  */
var msie = document.documentMode || versions[typeNumber(document.all) + "" + typeNumber(XMLHttpRequest)];

var modern = /NaN|undefined/.test(msie) || msie > 8;

function createDOMElement(vnode) {
  var type = vnode.type;
  if (type === "#text") {
    //只重复利用文本节点
    var node = recyclables[type].pop();
    if (node) {
      node.nodeValue = vnode.text;
      return node;
    }
    return document.createTextNode(vnode.text);
  }

  if (type === "#comment") {
    return document.createComment(vnode.text);
  }

  try {
    if (vnode.ns) {
      return document.createElementNS(vnode.ns, type);
    }
    //eslint-disable-next-line
  } catch (e) {}
  return document.createElement(type);
}
// https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math
// http://demo.yanue.net/HTML5element/
var mhtml = {
  meter: 1,
  menu: 1,
  map: 1,
  meta: 1,
  mark: 1
};
var svgTags = oneObject("" +
// structure
"svg,g,defs,desc,metadata,symbol,use," +
// image & shape
"image,path,rect,circle,line,ellipse,polyline,polygon," +
// text
"text,tspan,tref,textpath," +
// other
"marker,pattern,clippath,mask,filter,cursor,view,animate," +
// font
"font,font-face,glyph,missing-glyph", svgNs);

var rmathTags = /^m/;
var mathNs = "http://www.w3.org/1998/Math/MathML";
var svgNs = "http://www.w3.org/2000/svg";
var mathTags = {
  semantics: mathNs
};

function getNs(type) {
  if (svgTags[type]) {
    return svgNs;
  } else if (mathTags[type]) {
    return mathNs;
  } else {
    if (!mhtml[type] && rmathTags.test(type)) {
      //eslint-disable-next-line
      return mathTags[type] = mathNs;
    }
  }
}

/**
 *组件的基类
 *
 * @param {any} props
 * @param {any} context
 */

function Component(props, context) {
    CurrentOwner.cur = this; //防止用户在构造器生成JSX
    this.context = context;
    this.props = props;
    this.refs = {};
    this.state = null;
    this.__dirty = true;
    this.__pendingCallbacks = [];
    this.__pendingStates = [];
    this.__pendingRefs = [];
    /*
    * this.__dirty = true 表示组件不能更新
    * this.__hasRendred = true 表示组件已经渲染了一次
    * this.__rerender = true 表示组件需要再渲染一次
    * this.__hasDidMount = true 表示组件及子孙已经都插入DOM树
    * this.__updating = true 表示组件处于componentWillUpdate与componentDidUpdate中
    * this.__forceUpdate = true 用于强制组件更新，忽略shouldComponentUpdate的结果
    */
}

Component.prototype = {
    replaceState: function replaceState() {
        console.warn("此方法末实现"); // eslint-disable-line
    },
    setState: function setState(state, cb) {
        setStateImpl.call(this, state, cb);
    },
    forceUpdate: function forceUpdate(cb) {
        setStateImpl.call(this, true, cb);
    },

    __collectRefs: function __collectRefs(fn) {
        this.__pendingRefs.push(fn);
    },
    __mergeStates: function __mergeStates(props, context) {
        var n = this.__pendingStates.length;
        if (n === 0) {
            return this.state;
        }
        var states = clearArray(this.__pendingStates);
        var nextState = extend({}, this.state);
        for (var i = 0; i < n; i++) {
            var partial = states[i];
            extend(nextState, isFn(partial) ? partial.call(this, nextState, props, context) : partial);
        }
        return nextState;
    },

    render: function render() {}
};

function setStateImpl(state, cb) {
    var _this = this;

    if (isFn(cb)) {
        this.__pendingCallbacks.push(cb);
    }
    // forceUpate是同步渲染
    if (state === true) {
        if (!this.__dirty && (this.__dirty = true)) {
            this.__forceUpdate = true;
            options.refreshComponent(this, []);
        }
    } else {
        // setState是异步渲染
        this.__pendingStates.push(state);
        // 子组件在componentWillReiveProps调用父组件的setState方法
        if (this.__updating) {
            devolveCallbacks.call(this, '__tempUpdateCbs');
            this.__rerender = true;
        } else if (!this.__hasDidMount) {
            //如果在componentDidMount中调用setState方法，那么setState的所有回调，都会延迟到componentDidUpdate中执行
            if (this.__hasRendered) devolveCallbacks.call(this, '__tempMountCbs');
            if (!this.__dirty && (this.__dirty = true)) {
                defer(function () {
                    if (_this.__dirty) {
                        _this.__pendingCallbacks = _this.__tempMountCbs;
                        options.refreshComponent(_this, []);
                    }
                });
            }
        } else if (!this.__dirty && (this.__dirty = true)) {
            options.refreshComponent(this, []);
        }
    }
}

function devolveCallbacks(name) {
    var args = this.__pendingCallbacks;
    var list = this[name] = this[name] || [];
    list.push.apply(list, args);
    this.__pendingCallbacks = [];
}
var defer = win.requestAnimationFrame || win.webkitRequestAnimationFrame || function (job) {
    setTimeout(job, 16);
};

var hasOwnProperty = Object.prototype.hasOwnProperty;
function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) {
    return true;
  }
  //确保objA, objB都是对象
  if (typeNumber(objA) < 7 || typeNumber(objB) < 7) {
    return false;
  }
  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwnProperty.call(objB, keysA[i]) || !Object.is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

function PureComponent(props, context) {
    Component.call(this, props, context);
}

var fn = inherit(PureComponent, Component);

fn.shouldComponentUpdate = function shallowCompare(nextProps, nextState) {
    var a = shallowEqual(this.props, nextProps);
    var b = shallowEqual(this.state, nextState);
    return !a || !b;
};
fn.isPureComponent = true;

var Children = {
    only: function only(children) {
        return children && children[0] || null;
    },
    count: function count(children) {
        return children && children.length || 0;
    },
    forEach: function forEach(children, callback, context) {
        children.forEach(callback, context);
    },
    map: function map(children, callback, context) {
        return children.map(callback, context);
    },
    toArray: function toArray(children) {
        return children == null ? [] : Array.isArray(children) ? children.slice(0) : [children];
    }
};

/**
 * 为了兼容0.13之前的版本
 */
var MANY = "DEFINE_MANY";
var MANY_MERGED = "MANY_MERGED";
var ReactClassInterface = {
  mixins: MANY,
  statics: MANY,
  propTypes: MANY,
  contextTypes: MANY,
  childContextTypes: MANY,
  getDefaultProps: MANY_MERGED,
  getInitialState: MANY_MERGED,
  getChildContext: MANY_MERGED,
  render: "ONCE",
  componentWillMount: MANY,
  componentDidMount: MANY,
  componentWillReceiveProps: MANY,
  shouldComponentUpdate: "DEFINE_ONCE",
  componentWillUpdate: MANY,
  componentDidUpdate: MANY,
  componentWillUnmount: MANY
};

var specHandle = {
  displayName: function displayName(Ctor, value, name) {
    Ctor[name] = value;
  },
  mixins: function mixins(Ctor, value) {
    if (value) {
      for (var i = 0; i < value.length; i++) {
        mixSpecIntoComponent(Ctor, value[i]);
      }
    }
  },

  propTypes: mergeObject,
  childContextTypes: mergeObject,
  contextTypes: mergeObject,

  getDefaultProps: function getDefaultProps(Ctor, value, name) {
    if (Ctor[name]) {
      Ctor[name] = createMergedResultFunction(Ctor[name], value);
    } else {
      Ctor[name] = value;
    }
  },
  statics: function statics(Ctor, value) {
    extend(Ctor, Object(value));
  },

  autobind: noop
};

function mergeObject(fn, value, name) {
  fn[name] = Object.assign({}, fn[name], value);
}

//防止覆盖Component内部一些重要的方法或属性
var protectedProps = {
  mixin: 1,
  setState: 1,
  forceUpdate: 1,
  __processPendingState: 1,
  __pendingCallbacks: 1,
  __pendingStates: 1
};

function mixSpecIntoComponent(Ctor, spec) {
  if (!spec) {
    return;
  }
  if (isFn(spec)) {
    console.warn("createClass(spec)中的spec不能为函数，只能是纯对象"); // eslint-disable-line
  }

  var proto = Ctor.prototype;
  var autoBindPairs = proto.__reactAutoBindPairs;

  if (spec.hasOwnProperty("mixin")) {
    specHandle.mixins(Ctor, spec.mixins);
  }

  for (var name in spec) {
    if (!spec.hasOwnProperty(name)) {
      continue;
    }
    if (protectedProps[name] === 1) {
      continue;
    }

    var property = spec[name];
    var isAlreadyDefined = proto.hasOwnProperty(name);

    if (specHandle.hasOwnProperty(name)) {
      specHandle[name](Ctor, property, name);
    } else {
      var isReactClassMethod = ReactClassInterface.hasOwnProperty(name);
      var shouldAutoBind = isFn(property) && !isReactClassMethod && !isAlreadyDefined && spec.autobind !== false;

      if (shouldAutoBind) {
        autoBindPairs.push(name, property);
        proto[name] = property;
      } else {
        if (isAlreadyDefined) {
          var specPolicy = ReactClassInterface[name];
          //合并多个同名函数
          if (specPolicy === MANY_MERGED) {
            //这个是有返回值
            proto[name] = createMergedResultFunction(proto[name], property);
          } else if (specPolicy === MANY) {
            //这个没有返回值
            proto[name] = createChainedFunction(proto[name], property);
          }
        } else {
          proto[name] = property;
        }
      }
    }
  }
}

function mergeOwnProperties(one, two) {
  for (var key in two) {
    if (two.hasOwnProperty(key)) {
      one[key] = two[key];
    }
  }
  return one;
}

function createMergedResultFunction(one, two) {
  return function mergedResult() {
    var a = one.apply(this, arguments);
    var b = two.apply(this, arguments);
    if (a == null) {
      return b;
    } else if (b == null) {
      return a;
    }
    var c = {};
    mergeOwnProperties(c, a);
    mergeOwnProperties(c, b);
    return c;
  };
}

function createChainedFunction(one, two) {
  return function chainedFunction() {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

function bindAutoBindMethod(component, method) {
  var boundMethod = method.bind(component);
  return boundMethod;
}

function bindAutoBindMethods(component) {
  var pairs = component.__reactAutoBindPairs;
  for (var i = 0; i < pairs.length; i += 2) {
    var autoBindKey = pairs[i];
    var method = pairs[i + 1];
    component[autoBindKey] = bindAutoBindMethod(component, method);
  }
}

//创建一个构造器
function newCtor(className) {
  var curry = Function("ReactComponent", "bindAutoBindMethods", "return function " + className + "(props, context) {\n    ReactComponent.call(this, props, context);\n    this.state = this.getInitialState ? this.getInitialState() : {};\n    if (this.__reactAutoBindPairs.length) {\n      bindAutoBindMethods(this);\n    }\n  };");
  return curry(Component, bindAutoBindMethods);
}
var warnOnce = 1;
function createClass(spec) {
  if (warnOnce) {
    warnOnce = 0;
    console.warn("createClass已经过时，强烈建议使用es6方式定义类"); // eslint-disable-line
  }
  var Constructor = newCtor(spec.displayName || "Component");
  var proto = inherit(Constructor, Component);
  proto.__reactAutoBindPairs = [];
  delete proto.render;

  mixSpecIntoComponent(Constructor, spec);
  if (isFn(Constructor.getDefaultProps)) {
    Constructor.defaultProps = Constructor.getDefaultProps();
  }

  //性能优化，为了防止在原型链进行无用的查找，直接将用户没有定义的生命周期钩子置为null
  for (var methodName in ReactClassInterface) {
    if (!proto[methodName]) {
      proto[methodName] = null;
    }
  }

  return Constructor;
}

//为了兼容yo
var check = function check() {
  return check;
};
check.isRequired = check;
var PropTypes = {
  array: check,
  bool: check,
  func: check,
  number: check,
  object: check,
  string: check,
  any: check,
  arrayOf: check,
  element: check,
  instanceOf: check,
  node: check,
  objectOf: check,
  oneOf: check,
  oneOfType: check,
  shape: check
};

var rnumber = /^-?\d+(\.\d+)?$/;
/**
     * 为元素样子设置样式
     * 
     * @export
     * @param {any} dom 
     * @param {any} oldStyle 
     * @param {any} newStyle 
     */
function patchStyle(dom, oldStyle, newStyle) {
  if (oldStyle === newStyle) {
    return;
  }

  for (var name in newStyle) {
    var val = newStyle[name];
    if (oldStyle[name] !== val) {
      name = cssName(name, dom);
      if (val !== 0 && !val) {
        val = ""; //清除样式
      } else if (rnumber.test(val) && !cssNumber[name]) {
        val = val + "px"; //添加单位
      }
      try {
        //node.style.width = NaN;node.style.width = 'xxxxxxx';
        //node.style.width = undefine 在旧式IE下会抛异常
        dom.style[name] = val; //应用样式
      } catch (e) {
        console.log("dom.style[" + name + "] = " + val + "throw error"); // eslint-disable-line
      }
    }
  }
  // 如果旧样式存在，但新样式已经去掉
  for (var _name in oldStyle) {
    if (!(_name in newStyle)) {
      dom.style[_name] = ""; //清除样式
    }
  }
}

var cssNumber = oneObject("animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom");

//var testStyle = document.documentElement.style
var prefixes = ["", "-webkit-", "-o-", "-moz-", "-ms-"];
var cssMap = oneObject("float", "cssFloat");

/**
 * 转换成当前浏览器可用的样式名
 * 
 * @param {any} name 
 * @returns 
 */
function cssName(name, dom) {
  if (cssMap[name]) {
    return cssMap[name];
  }
  var host = dom && dom.style || {};
  for (var i = 0, n = prefixes.length; i < n; i++) {
    var camelCase = camelize(prefixes[i] + name);
    if (camelCase in host) {
      return cssMap[name] = camelCase;
    }
  }
  return null;
}

var globalEvents = {};
var eventPropHooks = {}; //用于在事件回调里对事件对象进行
var eventHooks = {}; //用于在元素上绑定特定的事件
//根据onXXX得到其全小写的事件名, onClick --> click, onClickCapture --> click,
// onMouseMove --> mousemove

var eventLowerCache = {
    onClick: "click",
    onChange: "change",
    onWheel: "wheel"
};
/**
 * 判定否为与事件相关
 *
 * @param {any} name
 * @returns
 */
function isEventName(name) {
    return (/^on[A-Z]/.test(name)
    );
}
var isTouch = "ontouchstart" in document;

function dispatchEvent(e, type, one) {
    //__type__ 在injectTapEventPlugin里用到
    e = new SyntheticEvent(e);
    if (type) {
        e.type = type;
    }
    var bubble = e.type;

    var hook = eventPropHooks[bubble];
    if (hook && false === hook(e)) {
        return;
    }

    var paths = collectPaths(e);
    if (one) {
        paths = paths.slice(0, 1);
    }
    var captured = bubble + "capture";
    triggerEventFlow(paths, captured, e);

    if (!e._stopPropagation) {
        triggerEventFlow(paths.reverse(), bubble, e);
    }
}

function collectPaths(e) {
    var target = e.target;
    var paths = [];
    do {
        var events = target.__events;
        if (events) {
            paths.push({ dom: target, events: events });
        }
    } while ((target = target.parentNode) && target.nodeType === 1);
    // target --> parentNode --> body --> html
    return paths;
}

function triggerEventFlow(paths, prop, e) {
    for (var i = paths.length; i--;) {
        var path = paths[i];
        var fn = path.events[prop];
        if (isFn(fn)) {
            e.currentTarget = path.dom;
            fn.call(path.dom, e);
            if (e._stopPropagation) {
                break;
            }
        }
    }
}

function addGlobalEvent(name) {
    if (!globalEvents[name]) {
        globalEvents[name] = true;
        addEvent(document, name, dispatchEvent);
    }
}

function addEvent(el, type, fn, bool) {
    if (el.addEventListener) {
        // Unable to preventDefault inside passive event listener due to target being
        // treated as passive
        el.addEventListener(type, fn, /true|false/.test(bool) ? bool : supportsPassive ? {
            passive: false
        } : false);
    } else if (el.attachEvent) {
        el.attachEvent("on" + type, fn);
    }
}

var ron = /^on/;
var rcapture = /Capture$/;
function getBrowserName(onStr) {
    var lower = eventLowerCache[onStr];
    if (lower) {
        return lower;
    }
    var camel = onStr.replace(ron, "").replace(rcapture, "");
    lower = camel.toLowerCase();
    eventLowerCache[onStr] = lower;
    return lower;
}
var supportsPassive = false;
try {
    var opts = Object.defineProperty({}, "passive", {
        get: function get() {
            supportsPassive = true;
        }
    });
    document.addEventListener("test", null, opts);
} catch (e) {
    // no catch
}
eventPropHooks.click = function (e) {
    return !e.target.disabled;
};

/* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
            firefox DOMMouseScroll detail 下3 上-3
            firefox wheel detlaY 下3 上-3
            IE9-11 wheel deltaY 下40 上-40
            chrome wheel deltaY 下100 上-100 */
/* istanbul ignore next  */
var fixWheelType = "onmousewheel" in document ? "mousewheel" : document.onwheel !== void 666 ? "wheel" : "DOMMouseScroll";
var fixWheelDelta = fixWheelType === "mousewheel" ? "wheelDetla" : fixWheelType === "wheel" ? "deltaY" : "detail";
eventHooks.wheel = function (dom) {
    addEvent(dom, fixWheelType, function (e) {
        var delta = e[fixWheelDelta] > 0 ? -120 : 120;
        var deltaY = ~~dom._ms_wheel_ + delta;
        dom._ms_wheel_ = deltaY;
        e = new SyntheticEvent(e);
        e.type = "wheel";
        e.deltaY = deltaY;
        dispatchEvent(e);
    });
};

var fixFocus = {};
"blur,focus".replace(/\w+/g, function (type) {
    eventHooks[type] = function (dom) {
        if (!fixFocus[type]) {
            fixFocus[type] = true;
            addEvent(document, type, dispatchEvent, true);
        }
    };
});
/**
 * 
DOM通过event对象的relatedTarget属性提供了相关元素的信息。这个属性只对于mouseover和mouseout事件才包含值；
对于其他事件，这个属性的值是null。IE不支持realtedTarget属性，但提供了保存着同样信息的不同属性。
在mouseover事件触发时，IE的fromElement属性中保存了相关元素；
在mouseout事件出发时，IE的toElement属性中保存着相关元素。
可以把下面这个跨浏览器取得相关元素的方法添加到EventUtil对象中：
 */
function getRelatedTarget(e) {
    return e.relatedTarget || e.toElement || e.fromElement || null;
}
function contains(a, b) {
    if (b) {
        while (b = b.parentNode) {
            if (b === a) {
                return true;
            }
        }
    }
    return false;
}

String("mouseenter,mouseleave").replace(/\w+/g, function (type) {
    eventHooks[type] = function (dom, name) {
        var mark = "__" + name;
        if (!dom[mark]) {
            dom[mark] = true;
            var mask = name === "mouseenter" ? "mouseover" : "mouseout";
            addEvent(dom, mask, function (e) {
                var t = getRelatedTarget(e);
                if (!t || t !== dom && !contains(dom, t)) {
                    //由于不冒泡，因此paths长度为1 
                    dispatchEvent(e, name, true);
                }
            });
        }
    };
});

if (isTouch) {
    eventHooks.click = noop;
    eventHooks.clickcapture = noop;
}

function SyntheticEvent(event) {
    if (event.nativeEvent) {
        return event;
    }
    for (var i in event) {
        if (!eventProto[i]) {
            this[i] = event[i];
        }
    }
    if (!this.target) {
        this.target = event.srcElement;
    }
    this.fixEvent();
    this.timeStamp = new Date() - 0;
    this.nativeEvent = event;
}

var eventProto = SyntheticEvent.prototype = {
    fixEvent: function fixEvent() {}, //留给以后扩展用
    preventDefault: function preventDefault() {
        var e = this.nativeEvent || {};
        e.returnValue = this.returnValue = false;
        if (e.preventDefault) {
            e.preventDefault();
        }
    },
    fixHooks: function fixHooks() {},
    stopPropagation: function stopPropagation() {
        var e = this.nativeEvent || {};
        e.cancelBubble = this._stopPropagation = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    },
    stopImmediatePropagation: function stopImmediatePropagation() {
        this.stopPropagation();
        this.stopImmediate = true;
    },
    toString: function toString() {
        return "[object Event]";
    }
};
/* istanbul ignore next  */


var boolAttributes = oneObject("autofocus,autoplay,async,allowTransparency,checked,controls,declare,disabled,def" + "er,defaultChecked,defaultSelected,isMap,loop,multiple,noHref,noResize,noShade,op" + "en,readOnly,selected", true);

var builtIdProperties = oneObject("accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan,dateTime,def" + "aultValue,contentEditable,frameBorder,maxLength,marginWidth,marginHeight,rowSpan" + ",tabIndex,useMap,vSpace,valueType,vAlign," + //驼蜂风格
"value,id,title,alt,htmlFor,name,type,longDesc,className", 1);

var booleanTag = oneObject("script,iframe,a,map,video,bgsound,form,select,input,textarea,option,keygen,optgr" + "oup,label");
var xlink = "http://www.w3.org/1999/xlink";

/**
 *
 * 修改dom的属性与事件
 * @export
 * @param {any} nextProps
 * @param {any} lastProps
 * @param {any} vnode
 * @param {any} lastVnode
 */
function diffProps(nextProps, lastProps, vnode, lastVnode, dom) {
    /* istanbul ignore if */
    if (vnode.ns === "http://www.w3.org/2000/svg") {
        return diffSVGProps(nextProps, lastProps, vnode, lastVnode, dom);
    }
    //eslint-disable-next-line
    for (var name in nextProps) {
        var val = nextProps[name];
        if (val !== lastProps[name]) {
            var hookName = getHookType(name, val, vnode.type, dom);
            propHooks[hookName](dom, name, val, lastProps);
        }
    }
    //如果旧属性在新属性对象不存在，那么移除DOM eslint-disable-next-line
    for (var _name2 in lastProps) {
        if (!nextProps.hasOwnProperty(_name2)) {
            var hookName2 = getHookType(_name2, false, vnode.type, dom);
            propHooks[hookName2](dom, _name2, builtIdProperties[_name2] ? "" : false, lastProps);
        }
    }
}

function diffSVGProps(nextProps, lastProps, vnode, lastVnode, dom) {
    // http://www.w3school.com.cn/xlink/xlink_reference.asp
    // https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#notable-enh
    // a ncements xlinkActuate, xlinkArcrole, xlinkHref, xlinkRole, xlinkShow,
    // xlinkTitle, xlinkType eslint-disable-next-line
    for (var name in nextProps) {
        var val = nextProps[name];
        if (val !== lastProps[name]) {
            var hookName = getHookTypeSVG(name, val, vnode.type, dom);
            propHooks[hookName](dom, name, val, lastProps);
        }
    }
    //eslint-disable-next-line
    for (var _name3 in lastProps) {
        if (!nextProps.hasOwnProperty(_name3)) {
            var _val = nextProps[_name3];
            var hookName2 = getHookTypeSVG(_name3, _val, vnode.type, dom);
            propHooks[hookName2](dom, _name3, false, lastProps);
        }
    }
}
var controlled = {
    value: 1,
    defaultValue: 1
};

var specialProps = {
    children: 1,
    style: 1,
    className: 1,
    dangerouslySetInnerHTML: 1
};

function getHookType(name, val, type, dom) {
    if (specialProps[name]) return name;
    if (boolAttributes[name] && booleanTag[type]) {
        return "boolean";
    }
    if (isEventName(name)) {
        return "__event__";
    }
    if (typeNumber(val) < 3 && !val) {
        return "removeAttribute";
    }
    return name.indexOf("data-") === 0 || dom[name] === void 666 ? "setAttribute" : "property";
}

function getHookTypeSVG(name, val, type, dom) {
    if (name === "className") {
        return "svgClass";
    }

    if (specialProps[name]) return name;

    if (isEventName(name)) {
        return "__event__";
    }
    return "svgAttr";
}

var svgprops = {
    xlinkActuate: "xlink:actuate",
    xlinkArcrole: "xlink:arcrole",
    xlinkHref: "xlink:href",
    xlinkRole: "xlink:role",
    xlinkShow: "xlink:show"
};
var emptyStyle = {};
var propHooks = {
    boolean: function boolean(dom, name, val, lastProp) {
        // 布尔属性必须使用el.xxx = true|false方式设值 如果为false, IE全系列下相当于setAttribute(xxx,''),
        // 会影响到样式,需要进一步处理 eslint-disable-next-line
        dom[name] = !!val;
        if (!val) {
            dom.removeAttribute(name);
        }
    },
    removeAttribute: function removeAttribute(dom, name) {
        dom.removeAttribute(name);
    },
    setAttribute: function setAttribute(dom, name, val) {
        try {
            dom.setAttribute(name, val);
        } catch (e) {
            console.log("setAttribute error", name, val);
        }
    },
    svgClass: function svgClass(dom, name, val, lastProp) {
        if (!val) {
            dom.removeAttribute("class");
        } else {
            dom.setAttribute("class", val);
        }
    },
    svgAttr: function svgAttr(dom, name, val) {
        var method = typeNumber(val) < 3 && !val ? "removeAttribute" : "setAttribute";
        if (svgprops[name]) {
            dom[method + "NS"](xlink, svgprops[name], val || "");
        } else {
            dom[method](toLowerCase(name), val || "");
        }
    },
    property: function property(dom, name, val) {
        if (name !== "value" || dom[name] !== val) {
            dom[name] = val;
            if (controlled[name]) {
                dom._lastValue = val;
            }
        }
    },
    children: noop,
    className: function className(dom, _, val, lastProps) {
        dom.className = val;
    },
    style: function style(dom, _, val, lastProps) {
        patchStyle(dom, lastProps.style || emptyStyle, val || emptyStyle);
    },
    __event__: function __event__(dom, name, val, lastProps) {
        var events = dom.__events || (dom.__events = {});

        if (val === false) {
            delete events[toLowerCase(name.slice(2))];
        } else {
            if (!lastProps[name]) {
                //添加全局监听事件
                var _name = getBrowserName(name);
                addGlobalEvent(_name);
                var hook = eventHooks[_name];
                if (hook) {
                    hook(dom, _name);
                }
            }
            //onClick --> click, onClickCapture --> clickcapture
            events[toLowerCase(name.slice(2))] = val;
        }
    },

    dangerouslySetInnerHTML: function dangerouslySetInnerHTML(dom, name, val, lastProps) {
        var oldhtml = lastProps[name] && lastProps[name].__html;
        var html = val && val.__html;
        if (html !== oldhtml) {
            dom.innerHTML = html;
        }
    }
};

/**
 input, select, textarea这几个元素如果指定了value/checked的**状态属性**，就会包装成受控组件或非受控组件
 受控组件是指，用户除了为它指定**状态属性**，还为它指定了onChange/onInput/disabled等用于控制此状态属性
 变动的属性
 反之，它就是非受控组件，非受控组件会在框架内部添加一些事件，阻止**状态属性**被用户的行为改变，只能被setState改变
 */
function processFormElement(vnode, dom, props) {
  var domType = dom.type;
  var duplexType = duplexMap[domType];
  if (duplexType) {
    var data = duplexData[duplexType];
    var duplexProp = data[0];
    var keys = data[1];
    var eventName = data[2];
    if (duplexProp in props && !hasOtherControllProperty(props, keys)) {
      // eslint-disable-next-line
      console.warn("\u4F60\u4E3A" + vnode.type + "[type=" + domType + "]\u5143\u7D20\u6307\u5B9A\u4E86" + duplexProp + "\u5C5E\u6027\uFF0C\u4F46\u662F\u6CA1\u6709\u63D0\u4F9B\u53E6\u5916\u7684" + Object.keys(keys) + "\u7B49\u7528\u4E8E\u63A7\u5236" + duplexProp + "\n\n      \u53D8\u5316\u7684\u5C5E\u6027\uFF0C\u90A3\u4E48\u5B83\u662F\u4E00\u4E2A\u975E\u53D7\u63A7\u7EC4\u4EF6\uFF0C\u7528\u6237\u65E0\u6CD5\u901A\u8FC7\u8F93\u5165\u6539\u53D8\u5143\u7D20\u7684" + duplexProp + "\u503C");
      dom[eventName] = data[3];
    }
    if (duplexType === 3) {
      postUpdateSelectedOptions(vnode);
    }
  }
}

function hasOtherControllProperty(props, keys) {
  for (var key in props) {
    if (keys[key]) {
      return true;
    }
  }
}
var duplexMap = {
  color: 1,
  date: 1,
  datetime: 1,
  "datetime-local": 1,
  email: 1,
  month: 1,
  number: 1,
  password: 1,
  range: 1,
  search: 1,
  tel: 1,
  text: 1,
  time: 1,
  url: 1,
  week: 1,
  textarea: 1,
  checkbox: 2,
  radio: 2,
  "select-one": 3,
  "select-multiple": 3
};

function preventUserInput(e) {
  var target = e.target;
  var name = e.type === "textarea" ? "innerHTML" : "value";
  target[name] = target._lastValue;
}

function preventUserClick(e) {
  e.preventDefault();
}

function preventUserChange(e) {
  var target = e.target;
  var value = target._lastValue;
  var options$$1 = target.options;
  if (target.multiple) {
    updateOptionsMore(options$$1, options$$1.length, value);
  } else {
    updateOptionsOne(options$$1, options$$1.length, value);
  }
}

var duplexData = {
  1: ["value", {
    onChange: 1,
    onInput: 1,
    readOnly: 1,
    disabled: 1
  }, "oninput", preventUserInput],
  2: ["checked", {
    onChange: 1,
    onClick: 1,
    readOnly: 1,
    disabled: 1
  }, "onclick", preventUserClick],
  3: ["value", {
    onChange: 1,
    disabled: 1
  }, "onchange", preventUserChange]
};

function postUpdateSelectedOptions(vnode) {
  var props = vnode.props,
      multiple = !!props.multiple,
      value = typeNumber(props.value) > 1 ? props.value : typeNumber(props.defaultValue) > 1 ? props.defaultValue : multiple ? [] : "",
      options$$1 = [];
  collectOptions(vnode, props, options$$1);
  if (multiple) {
    updateOptionsMore(options$$1, options$$1.length, value);
  } else {
    updateOptionsOne(options$$1, options$$1.length, value);
  }
}

/**
 * 收集虚拟DOM select下面的options元素，如果是真实DOM直接用select.options
 *
 * @param {VNode} vnode
 * @param {any} props
 * @param {Array} ret
 */
function collectOptions(vnode, props, ret) {
  var arr = props.children;
  for (var i = 0, n = arr.length; i < n; i++) {
    var el = arr[i];
    if (el.type === "option") {
      ret.push(el);
    } else if (el.type === "optgroup") {
      collectOptions(el, el.props, ret);
    }
  }
}

function updateOptionsOne(options$$1, n, propValue) {
  var selectedValue = "" + propValue;
  for (var i = 0; i < n; i++) {
    var option = options$$1[i];
    var value = getOptionValue(option, option.props);
    if (value === selectedValue) {
      getOptionSelected(option, true);
      return;
    }
  }
  if (n) {
    getOptionSelected(options$$1[0], true);
  }
}

function updateOptionsMore(options$$1, n, propValue) {
  var selectedValue = {};
  try {
    for (var i = 0; i < propValue.length; i++) {
      selectedValue["&" + propValue[i]] = true;
    }
  } catch (e) {
    /* istanbul ignore next */
    console.warn('<select multiple="true"> 的value应该对应一个字符串数组'); // eslint-disable-line
  }
  for (var _i = 0; _i < n; _i++) {
    var option = options$$1[_i];
    var value = getOptionValue(option, option.props);
    var selected = selectedValue.hasOwnProperty("&" + value);
    getOptionSelected(option, selected);
  }
}

function getOptionValue(option, props) {
  if (!props) {
    return getDOMOptionValue(option);
  }
  return props.value === undefined ? props.children[0].text : props.value;
}

function getDOMOptionValue(node) {
  if (node.hasAttribute && node.hasAttribute("value")) {
    return node.getAttribute("value");
  }
  var attr = node.getAttributeNode("value");
  if (attr && attr.specified) {
    return attr.value;
  }
  return node.innerHTML.trim();
}

function getOptionSelected(option, selected) {
  var dom = option._hostNode || option;
  dom.selected = selected;
}

function disposeVnode(vnode) {
    if (!vnode || vnode._disposed) {
        return;
    }
    switch (vnode.vtype) {
        case 1:
            disposeElement(vnode);
            break;
        case 2:
            disposeComponent(vnode);
            break;
        case 4:
            disposeStateless(vnode);
            break;
    }
    vnode._disposed = true;
}

function disposeStateless(vnode) {
    var instance = vnode._instance;
    if (instance) {
        disposeVnode(instance._renderedVnode);
        vnode._instance = null;
    }
}

function disposeElement(vnode) {
    var props = vnode.props;

    var children = props.children;
    for (var i = 0, n = children.length; i < n; i++) {
        disposeVnode(children[i]);
    }
    //eslint-disable-next-line
    vnode.ref && vnode.ref(null);
}

function disposeComponent(vnode) {
    var instance = vnode._instance;
    if (instance) {
        options.beforeUnmount(instance);
        if (instance.componentWillUnmount) {
            instance.componentWillUnmount();
        }
        //在执行componentWillUnmount后才将关联的元素节点解绑，防止用户在钩子里调用 findDOMNode方法
        var dom = instance._currentElement._hostNode;
        if (dom) {
            dom._component = null;
        }
        vnode.ref && vnode.ref(null);
        vnode._instance = instance._currentElement = null;
        disposeVnode(vnode._renderedVnode);
    }
}

/**
 * ReactDOM.render 方法
 *
 */
function render(vnode, container, callback) {
    return renderByAnu(vnode, container, callback);
}
/**
 * ReactDOM.unstable_renderSubtreeIntoContainer 方法， React.render的包装
 *
 */
var warnOne = 1;
function unstable_renderSubtreeIntoContainer(component, vnode, container, callback) {
    if (warnOne) {
        console.warn("unstable_renderSubtreeIntoContainer未见于文档的内部方法，不建议使用"); // eslint-disable-line
        warnOne = 0;
    }
    var parentContext = component && component.context || {};
    return renderByAnu(vnode, container, callback, parentContext);
}
function unmountComponentAtNode(dom) {
    var prevVnode = dom._component;
    if (prevVnode) {
        var component = prevVnode._instance;
        alignVnode(prevVnode, {
            type: "#text",
            text: "empty",
            vtype: 0
        }, dom.firstChild, component, []);
    }
}
function isValidElement(vnode) {
    return vnode && vnode.vtype;
}

function clearRefsAndMounts(queue) {
    queue.forEach(function (el) {
        var refFns = el.__pendingRefs;
        if (refFns) {
            for (var i = 0, refFn; refFn = refFns[i++];) {
                refFn();
            }
            refFns.length = 0;

            if (el.componentDidMount) {
                el.componentDidMount();
                el.componentDidMount = null;
            }

            clearArray(el.__pendingCallbacks).forEach(function (fn) {
                fn.call(el);
            });
        }
        el.__hasDidMount = true;
    });
    queue.length = 0;
}

function renderByAnu(vnode, container, callback, parentContext) {
    if (!isValidElement(vnode)) {
        throw new Error(vnode + "\u5FC5\u987B\u4E3A\u7EC4\u4EF6\u6216\u5143\u7D20\u8282\u70B9, \u4F46\u73B0\u5728\u4F60\u7684\u7C7B\u578B\u5374\u662F" + Object.prototype.toString.call(vnode));
    }
    if (!container || container.nodeType !== 1) {
        console.warn(container + "\u5FC5\u987B\u4E3A\u5143\u7D20\u8282\u70B9"); // eslint-disable-line
        return;
    }
    var mountQueue = [];
    var lastVnode = container._component;
    mountQueue.mountAll = true;

    parentContext = parentContext || {};
    var rootNode = lastVnode ? alignVnode(lastVnode, vnode, container.firstChild, parentContext, mountQueue) : genVnodes(vnode, container, parentContext, mountQueue);

    // 如果存在后端渲染的对象（打包进去），那么在ReactDOM.render这个方法里，它就会判定容器的第一个孩子是否元素节点
    // 并且它有data-reactroot与data-react-checksum，有就根据数据生成字符串，得到比较数

    if (rootNode.setAttribute) {
        rootNode.setAttribute("data-reactroot", "");
    }

    var instance = vnode._instance;
    container._component = vnode;
    if (callback) {
        callback();
    }
    clearRefsAndMounts(mountQueue);
    return instance || rootNode;
    //组件返回组件实例，而普通虚拟DOM 返回元素节点
}

function genVnodes(vnode, container, context, mountQueue) {
    var nodes = getNodes(container);
    var prevRendered = null;
    //eslint-disable-next-line
    for (var i = 0, el; el = nodes[i++];) {
        if (el.getAttribute && el.getAttribute("data-reactroot") !== null) {
            prevRendered = el;
        } else {
            el.parentNode.removeChild(el);
        }
    }

    var rootNode = mountVnode(vnode, context, prevRendered, mountQueue);
    container.appendChild(rootNode);

    return rootNode;
}

var formElements = {
    select: 1,
    textarea: 1,
    input: 1
};

var patchAdapter = {
    0: mountText,
    1: mountElement,
    2: mountComponent,
    4: mountStateless,
    10: updateText,
    11: updateElement,
    12: updateComponent,
    14: updateStateless
};

function mountText(vnode, context, prevRendered) {
    var node = prevRendered && prevRendered.nodeName === vnode.type ? prevRendered : createDOMElement(vnode);
    vnode._hostNode = node;
    return node;
}

function mountVnode(vnode, context, prevRendered, mountQueue) {
    return patchAdapter[vnode.vtype](vnode, context, prevRendered, mountQueue);
}

function genMountElement(vnode, type, prevRendered) {
    if (prevRendered && toLowerCase(prevRendered.nodeName) === type) {
        return prevRendered;
    } else {
        vnode.ns = getNs(type);
        var dom = createDOMElement(vnode);
        if (prevRendered) while (prevRendered.firstChild) {
            dom.appendChild(prevRendered.firstChild);
        }

        return dom;
    }
}

function mountElement(vnode, context, prevRendered, mountQueue) {
    var type = vnode.type,
        props = vnode.props,
        _owner = vnode._owner,
        ref = vnode.ref;

    var dom = genMountElement(vnode, type, prevRendered);
    vnode._hostNode = dom;
    var method = prevRendered ? alignChildren : mountChildren;
    method(vnode, dom, context, mountQueue);

    if (vnode.checkProps) {
        diffProps(props, {}, vnode, {}, dom);
    }

    if (ref && _owner) {
        _owner.__collectRefs(ref.bind(vnode, dom));
    }
    if (formElements[type]) {
        processFormElement(vnode, dom, props);
    }

    return dom;
}

//将虚拟DOM转换为真实DOM并插入父元素
function mountChildren(vnode, parentNode, context, mountQueue) {
    var children = vnode.props.children;
    for (var i = 0, n = children.length; i < n; i++) {
        var el = children[i];
        var curNode = mountVnode(el, context, null, mountQueue);

        parentNode.appendChild(curNode);
    }
}

function alignChildren(vnode, parentNode, context, mountQueue) {
    var children = vnode.props.children,
        childNodes = parentNode.childNodes,
        insertPoint = childNodes[0] || null,
        j = 0,
        n = children.length;
    for (var i = 0; i < n; i++) {
        var el = children[i];
        var lastDom = childNodes[j];
        var dom = mountVnode(el, context, lastDom, mountQueue);
        if (dom === lastDom) {
            j++;
        }
        parentNode.insertBefore(dom, insertPoint);
        insertPoint = dom.nextSibling;
    }
    while (childNodes[n]) {
        parentNode.removeChild(childNodes[n]);
    }
}
function mountComponent(vnode, context, prevRendered, mountQueue) {
    var type = vnode.type,
        ref = vnode.ref;


    var props = getComponentProps(vnode);
    var instance = new type(props, context); //互相持有引用
    vnode._instance = instance;
    instance.props = instance.props || props;
    instance.context = instance.context || context;

    if (instance.componentWillMount) {
        instance.componentWillMount();
        instance.state = instance.__mergeStates(props, context);
    }

    // 如果一个虚拟DOM vnode的type为函数，那么对type实例化所得的对象instance来说 instance._currentElement =
    // vnode instance有一个render方法，它会生成下一级虚拟DOM ，如果是返回false或null，则变成 空虚拟DOM {type:
    // '#comment', text: 'empty', vtype: 0} 这个下一级虚拟DOM，对于instance来说，为其_rendered属性

    var rendered = renderComponent(instance, type, vnode, context);
    instance.__dirty = false;
    instance.__hasRendered = true;

    var dom = mountVnode(rendered, instance._childContext, prevRendered, mountQueue);
    vnode._hostNode = dom;

    mountQueue.push(instance);
    if (ref) {
        instance.__collectRefs(ref.bind(vnode, instance));
    }
    options.afterMount(instance);
    return dom;
}

function renderComponent(instance, type, vnode, context) {
    CurrentOwner.cur = instance;
    var rendered = instance.render();
    instance._currentElement = vnode;
    CurrentOwner.cur = null;
    rendered = checkNull(rendered, type);
    vnode._renderedVnode = rendered;
    instance._childContext = rendered.vtype ? getChildContext(instance, context) : context;
    return rendered;
}

function Stateless(render) {
    this.refs = {};
    this.type = render;
    this.__collectRefs = noop;
}

Stateless.prototype.render = function (vnode, context) {
    var props = getComponentProps(vnode);
    var rendered = this.type(props, context);
    rendered = checkNull(rendered, this.type);
    this.context = context;
    this.props = props;
    vnode._instance = this;
    this._currentElement = vnode;
    vnode._renderedVnode = rendered;
    return rendered;
};
function mountStateless(vnode, context, prevRendered, mountQueue) {
    var instance = new Stateless(vnode.type);
    var rendered = instance.render(vnode, context);
    var dom = mountVnode(rendered, context, prevRendered, mountQueue);
    return vnode._hostNode = dom;
}

function updateStateless(lastTypeVnode, nextTypeVnode, node, context, mountQueue) {
    var instance = lastTypeVnode._instance;
    var lastVnode = lastTypeVnode._renderedVnode;
    var nextVnode = instance.render(nextTypeVnode, context);
    var dom = alignVnode(lastVnode, nextVnode, node, context, mountQueue);
    nextTypeVnode._hostNode = nextVnode._hostNode = dom;
    return dom;
}

options.refreshComponent = refreshComponent;

function refreshComponent(instance, mountQueue) {
    // shouldComponentUpdate为false时不能阻止setState/forceUpdate cb的触发
    var dom = instance._currentElement._hostNode;

    dom = _refreshComponent(instance, dom, mountQueue);
    instance.__forceUpdate = false;

    clearArray(instance.__pendingCallbacks).forEach(function (fn) {
        fn.call(instance);
    });

    if (instance.__reRender) {
        instance.__pendingCallbacks = instance.__tempUpdateCbs;
        instance.__reRender = instance.__tempUpdateCbs = null;

        return refreshComponent(instance, []);
    }
    return dom;
}

function _refreshComponent(instance, dom, mountQueue) {
    var lastProps = instance.lastProps,
        lastContext = instance.lastContext,
        lastState = instance.state,
        nextContext = instance.context,
        vnode = instance._currentElement,
        nextProps = instance.props,
        type = instance.constructor;


    lastProps = lastProps || nextProps;
    var nextState = instance.__mergeStates(nextProps, nextContext);
    instance.props = lastProps;
    if (!instance.__forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(nextProps, nextState, nextContext) === false) {
        instance.__dirty = false;
        return dom;
    }

    //生命周期 componentWillUpdate(nextProps, nextState, nextContext)
    if (instance.componentWillUpdate) {
        instance.componentWillUpdate(nextProps, nextState, nextContext);
    }
    instance.__updating = true;
    instance.props = nextProps;
    instance.state = nextState;

    var lastRendered = vnode._renderedVnode;
    var nextElement = instance._nextElement || vnode;
    if (!lastRendered._hostNode) {
        lastRendered._hostNode = dom;
    }
    var rendered = renderComponent(instance, type, nextElement, nextContext);
    delete instance._nextElement;

    dom = alignVnode(lastRendered, rendered, dom, instance._childContext, mountQueue);

    nextElement._hostNode = dom;

    if (instance.componentDidUpdate) {
        instance.componentDidUpdate(lastProps, lastState, lastContext);
    }
    instance.__updating = false;
    instance.__dirty = false;
    instance.__reRender = instance.__rerender;

    delete instance.__rerender;
    options.afterUpdate(instance);
    return dom;
}

function alignVnode(lastVnode, nextVnode, node, context, mountQueue) {

    var dom = node;
    //eslint-disable-next-line
    if (lastVnode.type !== nextVnode.type || lastVnode.key !== nextVnode.key) {

        disposeVnode(lastVnode);
        var innerMountQueue = mountQueue.mountAll ? mountQueue : nextVnode.vtype === 2 ? [] : mountQueue;
        dom = mountVnode(nextVnode, context, null, innerMountQueue);
        var p = node.parentNode;
        if (p) {
            p.replaceChild(dom, node);
            removeDOMElement(node);
        }
        if (innerMountQueue !== mountQueue) {
            clearRefsAndMounts(innerMountQueue);
        }
    } else if (lastVnode !== nextVnode) {
        dom = updateVnode(lastVnode, nextVnode, node || lastVnode._hostNode, context, mountQueue);
    }

    return dom;
}

function findDOMNode(ref) {
    if (ref == null) {
        return null;
    }
    if (ref.nodeType === 1) {
        return ref;
    }
    var vnode = ref._currentElement;
    return vnode._hostNode || null;
}

function updateText(lastVnode, nextVnode, dom) {
    nextVnode._hostNode = dom;
    if (lastVnode.text !== nextVnode.text) {
        dom.nodeValue = nextVnode.text;
    }
    return dom;
}

function updateElement(lastVnode, nextVnode, node, context, mountQueue) {
    var lastProps = lastVnode.props;
    var nextProps = nextVnode.props;
    nextVnode._hostNode = node;
    if (nextProps[HTML_KEY]) {
        lastProps.children.forEach(function (el) {
            disposeVnode(el);
        });
    } else {
        if (lastProps[HTML_KEY]) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            mountChildren(nextVnode, node, context, mountQueue);
        } else {
            updateChildren(lastVnode, nextVnode, node, context, mountQueue);
        }
    }

    if (lastVnode.checkProps || nextVnode.checkProps) {
        diffProps(nextProps, lastProps, nextVnode, lastVnode, node);
    }
    if (nextVnode.type === "select") {
        postUpdateSelectedOptions(nextVnode);
    }
    if (nextVnode.ref) {
        nextVnode.ref(node);
    }
    return node;
}

function updateComponent(lastVnode, nextVnode, node, context, mountQueue) {
    var instance = nextVnode._instance = lastVnode._instance;
    instance._nextElement = nextVnode;

    var nextProps = getComponentProps(nextVnode);
    instance.lastProps = instance.props;
    instance.lastContext = instance.context;

    if (instance.componentWillReceiveProps) {
        instance.__dirty = true;
        instance.componentWillReceiveProps(nextProps, context);
        instance.__dirty = false;
    }

    instance.props = nextProps;
    instance.context = context;
    if (nextVnode.ref) {
        nextVnode.ref(instance);
    }
    return refreshComponent(instance, mountQueue);
}

function updateVnode(lastVnode, nextVnode, node, context, mountQueue) {
    return patchAdapter[lastVnode.vtype + 10](lastVnode, nextVnode, node, context, mountQueue);
}

function updateChildren(lastVnode, nextVnode, parentNode, context, mountQueue) {
    var lastChildren = lastVnode.props.children;
    var nextChildren = nextVnode.props.children;
    var childNodes = parentNode.childNodes;
    var mountAll = mountQueue.mountAll;
    if (nextChildren.length == 0) {
        lastChildren.forEach(function (el) {
            var node = el._hostNode;
            if (node) {
                removeDOMElement(node);
            }
            disposeVnode(el);
        });
        return;
    }

    var hashcode = {};
    lastChildren.forEach(function (el) {
        var key = el.type + (el.key || "");
        var list = hashcode[key];
        if (list) {
            list.push(el);
        } else {
            hashcode[key] = [el];
        }
    });
    nextChildren.forEach(function (el) {
        var key = el.type + (el.key || "");
        var list = hashcode[key];
        if (list) {
            var old = list.shift();
            if (old) {
                el.old = old;
            } else {
                delete hashcode[key];
            }
        }
    });
    for (var i in hashcode) {
        var list = hashcode[i];
        if (Array.isArray(list)) {
            list.forEach(function (el) {
                var node = el._hostNode;
                if (node) {
                    removeDOMElement(node);
                }
                disposeVnode(el);
            });
        }
    }
    nextChildren.forEach(function (el, index) {
        var old = el.old,
            ref = void 0,
            dom = void 0,
            queue = mountAll ? mountQueue : [];
        if (old) {
            delete el.old;

            if (el === old && old._hostNode) {
                //cloneElement
                dom = old._hostNode;
            } else {
                dom = updateVnode(old, el, old._hostNode, context, queue);
            }
        } else {
            dom = mountVnode(el, context, null, queue);
        }
        ref = childNodes[index];
        if (dom !== ref) insertDOM(parentNode, dom, ref);
        if (!mountAll) {
            clearRefsAndMounts(queue);
        }
    });
}
function insertDOM(parentNode, dom, ref) {
    if (!ref) {
        parentNode.appendChild(dom);
    } else {
        parentNode.insertBefore(dom, ref);
    }
}

//Ie6-8 oninput使用propertychange进行冒充，触发一个ondatasetchanged事件
function fixIEInputHandle(e) {
  if (e.propertyName === "value") {
    dispatchEvent(e, "input");
  }
}
function fixIEInput(dom) {
  addEvent(dom, "propertychange", fixIEInputHandle);
}

function fixIEChangeHandle(e) {
  var dom = e.srcElement;
  if (dom.type === "select-one") {
    var idx = dom.selectedIndex,
        option,
        attr;
    if (idx > -1) {
      //IE 下select.value不会改变
      option = dom.options[idx];
      attr = option.attributes.value;
      dom.value = attr && attr.specified ? option.value : option.text;
    }
  }

  dispatchEvent(e, "change");
}
function fixIEChange(dom) {
  //IE6-8, radio, checkbox的点击事件必须在失去焦点时才触发
  var mask = dom.type === "radio" || dom.type === "checkbox" ? "click" : "change";
  addEvent(dom, mask, fixIEChangeHandle);
}

function fixIESubmit(dom) {
  if (dom.nodeName === "FORM") {
    addEvent(dom, "submit", dispatchEvent);
  }
}

if (msie < 9) {
  propHooks[HTML_KEY] = function (dom, name, val, lastProps) {
    var oldhtml = lastProps[name] && lastProps[name].__html;
    var html = val && val.__html;
    if (html !== oldhtml) {
      //IE8-会吃掉最前面的空白
      dom.innerHTML = String.fromCharCode(0xFEFF) + html;
      var textNode = dom.firstChild;
      if (textNode.data.length === 1) {
        dom.removeChild(textNode);
      } else {
        textNode.deleteData(0, 1);
      }
    }
  };

  String("focus,blur").replace(/\w+/g, function (type) {
    eventHooks[type] = function (dom, name) {
      var mark = '__' + name;
      if (!dom[mark]) {
        dom[mark] = true;
        var mask = name === "focus" ? "focusin" : "focusout";
        addEvent(dom, mask, function (e) {
          //https://www.ibm.com/developerworks/cn/web/1407_zhangyao_IE11Dojo/
          //window
          var tagName = e.srcElement.tagName;
          if (!tagName) {
            return;
          }
          // <body> #document
          var tag = toLowerCase(tagName);
          if (tag == "#document" || tag == "body") {
            return;
          }
          e.target = dom; //因此focusin事件的srcElement有问题，强行修正
          dispatchEvent(e, name, true);
        });
      }
    };
  });

  Object.assign(eventPropHooks, oneObject("mousemove, mouseout,mouseenter, mouseleave, mouseout,mousewheel, mousewheel, whe" + "el, click", function (event) {
    if (!("pageX" in event)) {
      var doc = event.target.ownerDocument || document;
      var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement;
      event.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0);
      event.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0);
    }
  }));

  Object.assign(eventPropHooks, oneObject("keyup, keydown, keypress", function (event) {
    /* istanbul ignore next  */
    if (event.which == null && event.type.indexOf("key") === 0) {
      /* istanbul ignore next  */
      event.which = event.charCode != null ? event.charCode : event.keyCode;
    }
  }));

  //IE8中select.value不会在onchange事件中随用户的选中而改变其value值，也不让用户直接修改value 只能通过这个hack改变
  try {
    Object.defineProperty(HTMLSelectElement.prototype, "value", {
      set: function set(v) {
        this._fixIEValue = v;
      },
      get: function get() {
        return this._fixIEValue;
      }
    });
  } catch (e) {
    // no catch
  }
  eventHooks.input = fixIEInput;
  eventHooks.inputcapture = fixIEInput;
  eventHooks.change = fixIEChange;
  eventHooks.changecapture = fixIEChange;
  eventHooks.submit = fixIESubmit;
}

var React = {
  version: "1.0.8",
  PropTypes: PropTypes,
  Children: Children, //为了react-redux
  render: render,
  findDOMNode: findDOMNode,
  options: options,
  unstable_renderSubtreeIntoContainer: unstable_renderSubtreeIntoContainer,
  unmountComponentAtNode: unmountComponentAtNode,
  isValidElement: isValidElement,
  createClass: createClass,
  createElement: createElement,
  cloneElement: cloneElement,
  PureComponent: PureComponent,
  Component: Component,
  createFactory: function createFactory(type) {
    console.warn("createFactory将被废弃"); // eslint-disable-line
    var factory = createElement.bind(null, type);
    factory.type = type;
    return factory;
  }
};

win.React = win.ReactDOM = React;

return React;

})));
