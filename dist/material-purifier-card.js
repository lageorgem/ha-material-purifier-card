function t(t,e,i,s){var a,n=arguments.length,r=n<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var o=t.length-1;o>=0;o--)(a=t[o])&&(r=(n<3?a(r):n>3?a(e,i,r):a(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),a=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=a.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&a.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(i,t,s)},o=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,v=m.trustedTypes,f=v?v.emptyScript:"",g=m.reactiveElementPolyfillSupport,b=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},_=(t,e)=>!l(t,e),w={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:_};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=w){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:a}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const n=s?.call(this);a?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??w}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),a=e.litNonce;void 0!==a&&s.setAttribute("nonce",a),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==a?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),a="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const n=a.fromAttribute(e,t.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(t,e,i,s=!1,a){if(void 0!==t){const n=this.constructor;if(!1===s&&(a=this[t]),i??=n.getPropertyOptions(t),!((i.hasChanged??_)(a,e)||i.useDefault&&i.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:a},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==a||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[b("elementProperties")]=new Map,x[b("finalized")]=new Map,g?.({ReactiveElement:x}),(m.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,k=t=>t,E=$.trustedTypes,C=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,A="?"+M,P=`<${A}>`,z=document,N=()=>z.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,D=Array.isArray,F="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,q=/-->/g,L=/>/g,I=RegExp(`>|${F}(?:([^\\s"'>=/]+)(${F}*=${F}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,U=/"/g,V=/^(?:script|style|textarea|title)$/i,j=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),H=j(1),B=j(2),W=Symbol.for("lit-noChange"),K=Symbol.for("lit-nothing"),Q=new WeakMap,Y=z.createTreeWalker(z,129);function X(t,e){if(!D(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(e):e}const J=(t,e)=>{const i=t.length-1,s=[];let a,n=2===e?"<svg>":3===e?"<math>":"",r=T;for(let e=0;e<i;e++){const i=t[e];let o,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===T?"!--"===l[1]?r=q:void 0!==l[1]?r=L:void 0!==l[2]?(V.test(l[2])&&(a=RegExp("</"+l[2],"g")),r=I):void 0!==l[3]&&(r=I):r===I?">"===l[0]?(r=a??T,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?I:'"'===l[3]?U:R):r===U||r===R?r=I:r===q||r===L?r=T:(r=I,a=void 0);const h=r===I&&t[e+1].startsWith("/>")?" ":"";n+=r===T?i+P:c>=0?(s.push(o),i.slice(0,c)+S+i.slice(c)+M+h):i+M+(-2===c?e:h)}return[X(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class G{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let a=0,n=0;const r=t.length-1,o=this.parts,[l,c]=J(t,e);if(this.el=G.createElement(l,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Y.nextNode())&&o.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=c[n++],i=s.getAttribute(t).split(M),r=/([.?@])?(.*)/.exec(e);o.push({type:1,index:a,name:r[2],strings:i,ctor:"."===r[1]?st:"?"===r[1]?at:"@"===r[1]?nt:it}),s.removeAttribute(t)}else t.startsWith(M)&&(o.push({type:6,index:a}),s.removeAttribute(t));if(V.test(s.tagName)){const t=s.textContent.split(M),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],N()),Y.nextNode(),o.push({type:2,index:++a});s.append(t[e],N())}}}else if(8===s.nodeType)if(s.data===A)o.push({type:2,index:a});else{let t=-1;for(;-1!==(t=s.data.indexOf(M,t+1));)o.push({type:7,index:a}),t+=M.length-1}a++}}static createElement(t,e){const i=z.createElement("template");return i.innerHTML=t,i}}function Z(t,e,i=t,s){if(e===W)return e;let a=void 0!==s?i._$Co?.[s]:i._$Cl;const n=O(e)?void 0:e._$litDirective$;return a?.constructor!==n&&(a?._$AO?.(!1),void 0===n?a=void 0:(a=new n(t),a._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=a:i._$Cl=a),void 0!==a&&(e=Z(t,a._$AS(t,e.values),a,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??z).importNode(e,!0);Y.currentNode=s;let a=Y.nextNode(),n=0,r=0,o=i[0];for(;void 0!==o;){if(n===o.index){let e;2===o.type?e=new et(a,a.nextSibling,this,t):1===o.type?e=new o.ctor(a,o.name,o.strings,this,t):6===o.type&&(e=new rt(a,this,t)),this._$AV.push(e),o=i[++r]}n!==o?.index&&(a=Y.nextNode(),n++)}return Y.currentNode=z,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=K,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Z(this,t,e),O(t)?t===K||null==t||""===t?(this._$AH!==K&&this._$AR(),this._$AH=K):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>D(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==K&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(z.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=G.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Q.get(t.strings);return void 0===e&&Q.set(t.strings,e=new G(t)),e}k(t){D(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const a of t)s===e.length?e.push(i=new et(this.O(N()),this.O(N()),this,this.options)):i=e[s],i._$AI(a),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,a){this.type=1,this._$AH=K,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=K}_$AI(t,e=this,i,s){const a=this.strings;let n=!1;if(void 0===a)t=Z(this,t,e,0),n=!O(t)||t!==this._$AH&&t!==W,n&&(this._$AH=t);else{const s=t;let r,o;for(t=a[0],r=0;r<a.length-1;r++)o=Z(this,s[i+r],e,r),o===W&&(o=this._$AH[r]),n||=!O(o)||o!==this._$AH[r],o===K?t=K:t!==K&&(t+=(o??"")+a[r+1]),this._$AH[r]=o}n&&!s&&this.j(t)}j(t){t===K?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===K?void 0:t}}class at extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==K)}}class nt extends it{constructor(t,e,i,s,a){super(t,e,i,s,a),this.type=5}_$AI(t,e=this){if((t=Z(this,t,e,0)??K)===W)return;const i=this._$AH,s=t===K&&i!==K||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,a=t!==K&&(i===K||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Z(this,t)}}const ot=$.litHtmlPolyfillSupport;ot?.(G,et),($.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;let ct=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let a=s._$litPart$;if(void 0===a){const t=i?.renderBefore??null;s._$litPart$=a=new et(e.insertBefore(N(),t),t,void 0,i??{})}return a._$AI(t),a})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}};ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const dt=lt.litElementPolyfillSupport;dt?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");const ht={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:_},pt=(t=ht,e,i)=>{const{kind:s,metadata:a}=i;let n=globalThis.litPropertyMetadata.get(a);if(void 0===n&&globalThis.litPropertyMetadata.set(a,n=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),n.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const a=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,a,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const a=this[s];e.call(this,i),this.requestUpdate(s,a,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ut(t){return(e,i)=>"object"==typeof i?pt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function mt(t){return ut({...t,state:!0,attribute:!1})}function vt(t,e){return(e,i,s)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(e,i,{get(){return e=this,e.renderRoot?.querySelector(t)??null;var e}})}var ft,gt;function bt(){return(bt=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var s in i)Object.prototype.hasOwnProperty.call(i,s)&&(t[s]=i[s])}return t}).apply(this,arguments)}!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(ft||(ft={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(gt||(gt={}));var yt=function(t,e,i,s){s=s||{},i=null==i?{}:i;var a=new Event(e,{bubbles:void 0===s.bubbles||s.bubbles,cancelable:Boolean(s.cancelable),composed:void 0===s.composed||s.composed});return a.detail=i,t.dispatchEvent(a),a};const _t=t=>(...e)=>({_$litDirective$:t,values:e});let wt=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const xt="important",$t=" !"+xt,kt=_t(class extends wt{constructor(t){if(super(t),1!==t.type||"style"!==t.name||t.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(t){return Object.keys(t).reduce((e,i)=>{const s=t[i];return null==s?e:e+`${i=i.includes("-")?i:i.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${s};`},"")}update(t,[e]){const{style:i}=t.element;if(void 0===this.ft)return this.ft=new Set(Object.keys(e)),this.render(e);for(const t of this.ft)null==e[t]&&(this.ft.delete(t),t.includes("-")?i.removeProperty(t):i[t]=null);for(const t in e){const s=e[t];if(null!=s){this.ft.add(t);const e="string"==typeof s&&s.endsWith($t);t.includes("-")||e?i.setProperty(t,e?s.slice(0,-11):s,e?xt:""):i[t]=s}}return W}}),Et="material-purifier-card",Ct="Material Purifier Card",St=100;function Mt(t){return"number"==typeof t.width&&t.width>0?Math.max(10,Math.min(St,10*Math.round(t.width/10))):["percentage-tile","entity-tile","speed-wheel","filter-vacuum"].includes(t.type)?50:St}const At=r`
  :host {
    --mp-primary: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mp-on-primary: var(--md-sys-color-on-primary, #ffffff);
    --mp-primary-container: var(--md-sys-color-primary-container, rgba(103, 80, 164, 0.16));
    --mp-on-primary-container: var(
      --md-sys-color-on-primary-container,
      var(--primary-text-color, #21005d)
    );

    --mp-surface: var(--md-sys-color-surface, var(--card-background-color, #fef7ff));
    /* Surface containers. Under material-you-theme the real M3 tokens are used.
       Everywhere else we tint the card background toward the on-surface color so
       tiles/lists read as a distinct, slightly elevated surface instead of
       blending into the card (the tint darkens in light themes and lightens in
       dark themes — the right direction for elevation in both). The steps mirror
       M3's container / high / highest elevation ladder. */
    --mp-surface-bg: var(--ha-card-background, var(--card-background-color, #f3edf7));
    --mp-surface-container: var(
      --md-sys-color-surface-container,
      color-mix(in srgb, var(--mp-on-surface) 8%, var(--mp-surface-bg))
    );
    --mp-surface-container-high: var(
      --md-sys-color-surface-container-high,
      color-mix(in srgb, var(--mp-on-surface) 11%, var(--mp-surface-bg))
    );
    --mp-surface-container-highest: var(
      --md-sys-color-surface-container-highest,
      color-mix(in srgb, var(--mp-on-surface) 14%, var(--mp-surface-bg))
    );

    --mp-on-surface: var(--md-sys-color-on-surface, var(--primary-text-color, #1c1b1f));
    --mp-on-surface-variant: var(
      --md-sys-color-on-surface-variant,
      var(--secondary-text-color, #49454f)
    );

    --mp-secondary-container: var(--md-sys-color-secondary-container, rgba(103, 80, 164, 0.14));
    --mp-on-secondary-container: var(
      --md-sys-color-on-secondary-container,
      var(--primary-text-color, #1d192b)
    );

    --mp-outline: var(--md-sys-color-outline, var(--divider-color, #79747e));
    --mp-outline-variant: var(--md-sys-color-outline-variant, var(--divider-color, #cac4d0));
    --mp-error: var(--md-sys-color-error, var(--error-color, #b3261e));

    /* Filled "selected" segment color (matches the stock card's accent). */
    --mp-selected-bg: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mp-selected-fg: var(--md-sys-color-on-primary, #ffffff);

    --mp-shape-card: var(--md-sys-shape-corner-extra-large, 28px);
    --mp-shape-chip-square: var(--md-sys-shape-corner-large, 16px);
    --mp-shape-full: var(--md-sys-shape-corner-full, 9999px);

    /* State layer opacities per M3 spec. */
    --mp-state-hover: 0.08;
    --mp-state-pressed: 0.12;

    /* Motion — prefer Material You theme motion tokens, fall back to M3 defaults. */
    --mp-motion-dur: var(--md-sys-motion-duration-medium2, 280ms);
    --mp-motion-ease: var(--md-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
  }
`;function Pt(t){const e=t.toLowerCase();return/auto/.test(e)?"mdi:fan-auto":/silent|sleep|night/.test(e)?"mdi:weather-night":/favou?rite/.test(e)?"mdi:heart":/manual/.test(e)?"mdi:fan":/turbo|max|boost|high/.test(e)?"mdi:fan-plus":/low/.test(e)?"mdi:fan-minus":"off"===e?"mdi:power":"mdi:fan"}function zt(t){const e=t.toLowerCase(),i="var(--md-sys-color-primary, var(--primary-color, #6750a4))";return/auto/.test(e)?i:/silent|sleep|night/.test(e)?"var(--state-fan-silent-color, #5c7cfa)":/favou?rite/.test(e)?"var(--md-sys-color-tertiary, #7d5260)":"off"===e?"var(--state-fan-off-color, #8a8a8a)":i}function Nt(t,e){if(!e?.length)return t;const i=new Set(t),s=e.filter(t=>i.has(t)),a=new Set(s);return[...s,...t.filter(t=>!a.has(t))]}function Ot(t){const e=t.trim().toLowerCase();return""===e||"off"===e||"none"===e||"false"===e||"null"===e||"0"===e||"unavailable"===e||"unknown"===e}function Dt(t){return"heat_cool"===t?"Heat/Cool":t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}const Ft=[{max:9,color:"#00E400",key:"good"},{max:35.4,color:"#FFFF00",key:"moderate"},{max:55.4,color:"#FF7E00",key:"sensitive"},{max:125.4,color:"#FF0000",key:"unhealthy"},{max:225.4,color:"#8F3F97",key:"very_unhealthy"},{max:1/0,color:"#7E0023",key:"hazardous"}],Tt={2024:[[0,9,0,50],[9.1,35.4,51,100],[35.5,55.4,101,150],[55.5,125.4,151,200],[125.5,225.4,201,300],[225.5,325.4,301,500]],2012:[[0,12,0,50],[12.1,35.4,51,100],[35.5,55.4,101,150],[55.5,150.4,151,200],[150.5,250.4,201,300],[250.5,350.4,301,400],[350.5,500.4,401,500]]},qt=[[0,35,0,50],[35,75,50,100],[75,115,100,150],[115,150,150,200],[150,250,200,300],[250,350,300,400],[350,500,400,500]];function Lt(t,e,i=!1){let s=e[0];for(const a of e)if(s=a,t<=a[i?3:1])break;const[a,n,r,o]=s;return i?(n-a)/(o-r)*(t-r)+a:(o-r)/(n-a)*(t-a)+r}function It(t,e="2024"){const i=Math.floor(10*Math.max(0,t))/10;return Math.min(999,Math.round(Lt(i,Tt[e])))}function Rt(t,e,i,s="2024"){if(e===i)return t;const a="us_aqi"===e?function(t,e="2024"){return Math.max(0,Lt(Math.max(0,t),Tt[e],!0))}(t,s):"cn_aqi"===e?(n=t,Math.max(0,Lt(Math.max(0,n),qt,!0))):t;var n;return"us_aqi"===i?It(a,s):"cn_aqi"===i?function(t){return Math.min(999,Math.ceil(Lt(Math.max(0,t),qt)))}(a):a}const Ut=[{index:0,key:"good",label:"Good",color:"#00E400"},{index:1,key:"moderate",label:"Moderate",color:"#FFFF00"},{index:2,key:"sensitive",label:"Unhealthy for sensitive groups",color:"#FF7E00"},{index:3,key:"unhealthy",label:"Unhealthy",color:"#FF0000"},{index:4,key:"very_unhealthy",label:"Very unhealthy",color:"#8F3F97"},{index:5,key:"hazardous",label:"Hazardous",color:"#7E0023"}],Vt=["Excellent","Good","Lightly polluted","Moderately polluted","Heavily polluted","Severely polluted"];function jt(t,e,i="2024"){const s="pm25"===e?It(t,i):t,a=s<=50?0:s<=100?1:s<=150?2:s<=200?3:s<=300?4:5,n=Ut[a];return{...n,label:"cn_aqi"===e?Vt[a]:n.label}}function Ht(t){return"pm25"===t?"µg/m³":"AQI"}function Bt(t,e){return"pm25"!==e||t>=10?Math.round(t).toString():t.toFixed(1).replace(/\.0$/,"")}function Wt(t,e){const i=t.entities,s=i?.[e]?.device_id;return i&&s?Object.values(i).filter(t=>t.entity_id!==e&&t.device_id===s).map(t=>t.entity_id):[]}function Kt(t,e){return Wt(t,e).find(e=>e.startsWith("sensor.")&&"rpm"===String(t.states[e]?.attributes.unit_of_measurement??"").trim().toLowerCase())}function Qt(t){const e=t?.scale??("cn_aqi"===t?.metric?"cn":"us");return"pm25"===t?.metric?"pm25":"cn"===e?"cn_aqi":"us_aqi"}function Yt(t,e){return"pm25"!==t?"pm25":Qt({...e,metric:"pm25"===e?.metric?"aqi":e?.metric})}function Xt(t,e,i){const s=i?.entity??function(t,e){return Wt(t,e).find(e=>{if(!e.startsWith("sensor."))return!1;const i=t.states[e]?.attributes;if(!i)return!1;const s=String(i.unit_of_measurement??"").trim().toLowerCase().replace(/[µμ]/g,"u").replace(/³/g,"3");return"pm25"===i.device_class||"ug/m3"===s})}(t,e)??null,a=null===s?void 0:t.states[s],n=i?.attribute?a?.attributes[i.attribute]:a?.state,r=Number.parseFloat(String(n)),o=i?.source??function(t,e){const i=(t??"").trim().toLowerCase().replace(/[µμ]/g,"u").replace(/³/g,"3");return"pm25"===e||"ug/m3"===i?"pm25":"aqi"===i?"us_aqi":"pm25"}(a?.attributes.unit_of_measurement,a?.attributes.device_class);return{value:Number.isFinite(r)?r:null,source:o,entity:s}}function Jt(t,e,i="2024"){if(null===t.value||!Number.isFinite(t.value))return{text:"—",value:null,level:null};const s=Rt(t.value,t.source,e,i);return{text:Bt(s,e),value:s,level:jt(s,e,i)}}function Gt(t,e){const i=Number.parseFloat(void 0===e?"":t.states[e]?.state??"");return Number.isFinite(i)?i:null}function Zt(t){return`material-purifier-card:metric:${t}`}function te(t){const e=t.features?.find(t=>"speed-wheel"===t.type),i={};for(const s of["entity","preset","display","estimate_auto","show_coverage"]){const a=e?.[s]??("show_coverage"===s?void 0:t.speed?.[s]);void 0!==a&&Object.assign(i,{[s]:a})}return i}function ee(t,e,i){if(!Number.isFinite(t)||!Number.isFinite(e)||!Number.isFinite(i)||i<=0||e<t)return 1;const s=(e-t)/i,a=Math.floor(s+1e-9);return a+1+(s-a>1e-9?1:0)}function ie(t,e){if(null===e)return null;const i=ee(t.min,t.max,t.step);if(!Number.isFinite(e)||t.step<=0||1===i)return 0;const s=Math.max(0,Math.min(i-2,Math.round((e-t.min)/t.step))),a=t.min+s*t.step;return Math.abs(e-t.max)<=Math.abs(e-a)?i-1:s}function se(t,e,i,s){const a=s??i?.entity,n={kind:"none",entity:a??null,available:!1,min:0,max:0,step:1,value:null,unit:""};if(void 0!==a){const e=a.split(".")[0],i=t.states[a];if(!i||"number"!==e&&"input_number"!==e)return n;const s=parseFloat(i.state);return{kind:e,entity:a,available:!["unavailable","unknown"].includes(i.state),min:i.attributes.min??0,max:i.attributes.max??100,step:i.attributes.step??1,value:Number.isNaN(s)?null:s,unit:i.attributes.unit_of_measurement??""}}const r=t.states[e];if(!(r&&1&(r.attributes.supported_features??0)))return n;const o=r.attributes.percentage_step??1;return{kind:"fan_percentage",entity:e,available:!["unavailable","unknown"].includes(r.state),min:o,max:100,step:o,value:"on"===r.state?r.attributes.percentage??null:null,unit:"%"}}function ae(t,e){return!1===e?.preset?null:"string"==typeof e?.preset?e.preset:t?.attributes.preset_modes?.find(t=>/favou?rite|manual/i.test(t))??null}function ne(t){const[e,i]=t.toString().split("e");return Math.max(0,(e.split(".")[1]?.length??0)-Number(i??0))}async function re(t,e,i,s,a){if(!i.available||"none"===i.kind)return;const n=Math.min(i.max,Math.max(i.min,s)),r=i.min+Math.round((n-i.min)/i.step)*i.step,o=Math.min(100,Math.max(ne(i.min),ne(i.step))),l=Number.EPSILON*Math.max(1,Math.abs(i.max))*8,c=s>=i.max-l?i.max:Math.min(i.max,Math.max(i.min,Number(r.toFixed(o)))),d=t.states[e],h=ae(d,a);!h||"on"===d?.state&&d.attributes.preset_mode===h?"on"!==d?.state&&"fan_percentage"!==i.kind&&await t.callService("fan","turn_on",{entity_id:e}):await t.callService("fan","set_preset_mode",{entity_id:e,preset_mode:h}),"fan_percentage"===i.kind?await t.callService("fan","set_percentage",{entity_id:e,percentage:c}):await t.callService(i.kind,"set_value",{entity_id:i.entity,value:c})}function oe(t,e,i="percent"){return null===e?"—":"percent"===i?`${function(t,e){if(null===e)return null;if("fan_percentage"===t.kind)return e;const i=ie(t,e);return null===i?null:Math.round((i+1)/ee(t.min,t.max,t.step)*100)}(t,e)}%`:"fan_percentage"===t.kind?`${e}%`:""===t.unit?`Level ${e}`:`${e} ${t.unit}`}function le(t){const e=[...t].sort((t,e)=>t-e),i=Math.floor(e.length/2);return e.length%2?e[i]:(e[i-1]+e[i])/2}function ce(t){const e=new Map;for(const{detent:i,rpm:s}of t){if(!Number.isFinite(i)||i<0||!Number.isFinite(s)||s<=0)continue;const t=e.get(i)??[];t.push(s),e.set(i,t)}const i=[...e].sort(([t],[e])=>t-e).map(([t,e])=>({detent:t,rpm:le(e)})),s=[];i.forEach((t,e)=>{for(s.push({from:e,to:e,sum:t.rpm,count:1});s.length>1;){const t=s[s.length-1],e=s[s.length-2];if(e.sum/e.count<=t.sum/t.count)break;s.splice(-2,2,{from:e.from,to:t.to,sum:e.sum+t.sum,count:e.count+t.count})}});for(const t of s)for(let e=t.from;e<=t.to;e++)i[e].rpm=t.sum/t.count;const a=i.filter((t,e)=>0===e||t.rpm!==i[e-1].rpm);return a.length>=2?{points:a}:null}function de(t,e){return ce((t??[]).filter(({value:t})=>Number.isFinite(t)).map(({value:t,rpm:i})=>({detent:ie(e,t),rpm:i})))}function he(t){if(void 0!==t.max_rpm&&Number.isFinite(t.max_rpm)&&t.max_rpm>0)return t.max_rpm;let e=0;for(const{rpm:i}of t.calibration??[])Number.isFinite(i)&&i>e&&(e=i);return e>0?e:null}function pe(t,e,i){if(!Number.isFinite(e)||e<=0||!Number.isFinite(i)||i<0||t.points.length<2)return null;const s=t.points;let a=0;for(;a<s.length-2&&e>s[a+1].rpm;)a++;const n=s[a],r=s[a+1];if(r.rpm<=n.rpm)return null;const o=n.detent+(e-n.rpm)/(r.rpm-n.rpm)*(r.detent-n.detent);return Math.max(0,Math.min(i,o))}function ue(t){if("string"!=typeof t||""===t.trim())return null;const e=parseFloat(t);return Number.isFinite(e)?e:null}const me="material-purifier-card:cal:",ve=`${me}v3:`,fe=new Map,ge=new Map;function be(t,e){return Number.isFinite(t.at)&&e>=t.at&&e-t.at<(null===t.points?18e5:216e5)}function ye(t,e){for(fe.set(t,e);fe.size>16;)fe.delete(fe.keys().next().value)}const _e=.22,we=(t,e,i)=>Math.min(i,Math.max(e,Number.isNaN(t)?e:t));function xe(t){const e=we((t-_e)/.5,0,1);return e*e*(3-2*e)}function $e(t,e){return null===t?0:(.05+.95*we(t,0,1)**1.7)*(1+1.5*(1-we(e,0,1)))}const ke=new Float64Array(101);class Ee{constructor(t,e={}){this.canvas=t,this.live=0,this.population=0,this.carry=0,this.target=null,this.effective=0,this.velocity=0,this.color="#ffffff",this.cssSize=0,this.dpr=1,this.frame=null,this.baseline=0,this.intersecting=!0,this.observer=null,this.listening=!1,this.disposed=!1,this.onMotionChanged=()=>this.refreshMotion(),this.onVisibility=()=>this.syncLoop(),this.onFrame=()=>{this.frame=null;const t=this.now();this.step((t-this.baseline)/1e3),this.baseline=t,this.syncLoop()},this.context=t.getContext("2d"),this.raf=e.raf??(t=>requestAnimationFrame(t)),this.caf=e.caf??(t=>cancelAnimationFrame(t)),this.now=e.now??(()=>performance.now()),this.random=e.random??Math.random,this.reducedMotion=e.reducedMotion??(()=>{if(!this.motionQuery&&"function"==typeof matchMedia){const t=matchMedia("(prefers-reduced-motion: reduce)");this.motionQuery=t,"function"==typeof t.addEventListener&&"function"==typeof t.removeEventListener?(t.addEventListener("change",this.onMotionChanged),this.removeMotionListener=()=>t.removeEventListener("change",this.onMotionChanged)):"function"==typeof t.addListener&&"function"==typeof t.removeListener&&(t.addListener(this.onMotionChanged),this.removeMotionListener=()=>t.removeListener(this.onMotionChanged))}return this.motionQuery?.matches??!1});const i=e.maxParticles??120;this.pool=Array.from({length:Number.isFinite(i)?Math.max(0,Math.floor(i)):120},()=>({radius:0,angle:0,size:0,age:0,lifetime:0,calmAge:0,phase:0}))}get count(){return this.live}setColor(t){this.disposed||(this.color=t,this.draw(),this.syncLoop())}setDensity(t){this.disposed||(this.population=function(t,e=120){return null===t||Number.isNaN(t)||t<=0?0:Math.min(e,Math.round(3+.6*t))}(t,this.pool.length),0===this.population&&(this.carry=0),this.reducedMotion()&&this.staticField(),this.syncLoop())}setSpeed(t){this.disposed||(this.target=null===t?null:we(t,0,1),this.syncLoop())}refreshMotion(){this.disposed||(this.reducedMotion()&&this.staticField(),this.syncLoop())}resize(t,e=globalThis.devicePixelRatio||1){if(this.disposed)return;const i=Number.isFinite(t)?Math.max(0,t):0,s=Number.isFinite(e)&&e>0?Math.min(2,e):1,a=Math.round(i*s);this.cssSize===i&&this.dpr===s&&this.canvas.width===a&&this.canvas.height===a||(this.cssSize=i,this.dpr=s,this.canvas.width!==a&&(this.canvas.width=a),this.canvas.height!==a&&(this.canvas.height=a),this.canvas.style.width=`${this.cssSize}px`,this.canvas.style.height=`${this.cssSize}px`,this.reducedMotion()?this.staticField():this.draw(),this.syncLoop())}seed(t){t.radius=.8+this.random()*(1-.8),t.angle=this.random()*Math.PI*2,t.size=1.2+1.4*this.random(),t.age=0,t.lifetime=4+3*this.random(),t.calmAge=0,t.phase=this.random()*Math.PI*2}staticField(){if(!this.context)return;const t=this.live;this.live=this.population;for(let e=t;e<this.live;e+=1)this.seed(this.pool[e]),this.pool[e].age=.4;t>0&&0===this.live&&this.clear(),this.draw(!0)}step(t){if(this.disposed||!this.context||this.reducedMotion())return;const e=Number.isFinite(t)?we(t,0,.1):0,i=this.live,s=1-Math.exp(-e/.6);this.effective+=((this.target??0)-this.effective)*s,this.velocity+=($e(this.target,1)-this.velocity)*s,this.carry+=this.population/function(t){if(null===t)return 5.5;const e=Math.round(100*we(t,0,1));if(0!==ke[e])return ke[e];let i=.9,s=0;for(;i>_e;){const t=.001*$e(e/100,i);s+=.001*Math.min(1,(i-_e)/t),i-=t}return ke[e]=s,s}(null===this.target?null:this.effective)*e;const a=Math.floor(this.carry);this.carry-=a;const n=Math.min(a,this.pool.length-this.live);for(let t=0;t<n;t+=1)this.seed(this.pool[this.live++]);for(let t=0;t<this.live;){const i=this.pool[t];i.age+=e;const s=this.particleSpeed(i);i.angle+=.25*s*e/Math.max(_e,i.radius),i.radius-=s*e,null===this.target&&(i.calmAge+=e),i.radius<=_e||null===this.target&&i.calmAge>=i.lifetime?(this.live-=1,this.pool[t]=this.pool[this.live],this.pool[this.live]=i):t+=1}i>0&&0===this.live&&this.clear(),this.draw(!1)}clear(){this.context?.clearRect(0,0,this.canvas.width,this.canvas.height)}particleSpeed(t){const e=this.velocity*(1+1.5*(1-we(t.radius,0,1)));return null===this.target&&e*Math.hypot(1,.25)<.01?0:e}draw(t=this.reducedMotion()){const e=this.context;if(!e||0===this.live)return;this.clear(),e.fillStyle=this.color,e.strokeStyle=this.color,e.lineCap="round";const i=this.cssSize*this.dpr/2;for(let s=0;s<this.live;s+=1){const a=this.pool[s],n=xe(a.radius),r=t?1:we((a.lifetime-a.calmAge)/.6,0,1);e.globalAlpha=.85*Math.min(1,a.age/.4)*n*r;const o=Math.min(a.radius*i,Math.max(0,i-3*this.dpr)),l=Math.cos(a.angle),c=Math.sin(a.angle),d=i+l*o,h=i+c*o,p=a.size*this.dpr*(.6+.4*n),u=this.particleSpeed(a),m=we((u-.3)/.3,0,1);if(!t&&m>0){const t=.25*u,s=(-u*l-t*c)*i,a=(-u*c+t*l)*i,n=Math.hypot(s,a),r=Math.min(14*this.dpr,.035*n)*m,o=-s/n*r,v=-a/n*r,f=e.globalAlpha;e.globalAlpha=f*m;for(let t=0;t<3;t+=1)e.lineWidth=p*(1-t/3),e.beginPath(),e.moveTo(d+o*t/3,h+v*t/3),e.lineTo(d+o*(t+1)/3,h+v*(t+1)/3),e.stroke();e.globalAlpha=f}e.beginPath(),e.arc(d,h,p,0,2*Math.PI),e.fill()}e.globalAlpha=1}observe(t){this.disposed||(this.observer?.disconnect(),"function"==typeof IntersectionObserver&&(this.intersecting=!1,this.observer=new IntersectionObserver(e=>{for(const i of e)i.target===t&&(this.intersecting=i.isIntersecting);this.syncLoop()}),this.observer.observe(t)),this.listening||(document.addEventListener("visibilitychange",this.onVisibility),this.listening=!0),this.syncLoop())}syncLoop(){!this.disposed&&this.context&&this.intersecting&&!document.hidden&&!this.reducedMotion()&&(this.live>0||this.population>0)?null===this.frame&&(this.baseline=this.now(),this.frame=this.raf(this.onFrame)):(null!==this.frame&&this.caf(this.frame),this.frame=null)}dispose(){this.disposed||(this.disposed=!0,null!==this.frame&&this.caf(this.frame),this.frame=null,this.observer?.disconnect(),this.listening&&document.removeEventListener("visibilitychange",this.onVisibility),this.removeMotionListener?.(),this.removeMotionListener=void 0)}}try{CSS.registerProperty?.({name:"--mp-aqi-color",syntax:"<color>",inherits:!0,initialValue:"#34a853"})}catch{}class Ce extends ct{constructor(){super(...arguments),this.value=null,this.unit="AQI",this.category="",this.color="#34a853",this.running=!1,this.available=!0,this.speedFraction=null,this.density=null,this.status="",this.allowCycle=!1,this.disabled=!1,this.modeIcon="mdi:fan-auto",this.modeLabel="Change mode",this.modeAvailable=!1,this._cssSize=0,this._reducedMotion=()=>this._motionQuery?.matches??!1,this._motionChanged=()=>{this._field?.refreshMotion()},this._dprChanged=()=>{this._field?.resize(this._cssSize),this._watchDpr()}}get _active(){return this.running&&this.available}_watchDpr(){if(this._removeDprListener?.(),this._removeDprListener=void 0,!this.isConnected||"function"!=typeof window.matchMedia)return;const t=window.matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);"function"==typeof t.addEventListener&&"function"==typeof t.removeEventListener?(t.addEventListener("change",this._dprChanged),this._removeDprListener=()=>t.removeEventListener("change",this._dprChanged)):"function"==typeof t.addListener&&"function"==typeof t.removeListener&&(t.addListener(this._dprChanged),this._removeDprListener=()=>t.removeListener(this._dprChanged))}connectedCallback(){if(super.connectedCallback(),"function"==typeof window.matchMedia){const t=window.matchMedia("(prefers-reduced-motion: reduce)");this._motionQuery=t,"function"==typeof t.addEventListener&&"function"==typeof t.removeEventListener?(t.addEventListener("change",this._motionChanged),this._removeMotionListener=()=>t.removeEventListener("change",this._motionChanged)):"function"==typeof t.addListener&&"function"==typeof t.removeListener&&(t.addListener(this._motionChanged),this._removeMotionListener=()=>t.removeListener(this._motionChanged))}this.hasUpdated&&this.updateComplete.then(()=>{this.isConnected&&this._createField()})}disconnectedCallback(){clearTimeout(this._colorTimeout),this._colorTimeout=void 0,this._resizeObserver?.disconnect(),this._resizeObserver=void 0,this._field?.dispose(),this._field=void 0,this._removeMotionListener?.(),this._removeMotionListener=void 0,this._motionQuery=void 0,this._removeDprListener?.(),this._removeDprListener=void 0,super.disconnectedCallback()}firstUpdated(){this.isConnected&&this._createField()}updated(t){this.isConnected&&((t.has("running")||t.has("available")||t.has("speedFraction"))&&this._syncSpeed(),(t.has("density")||t.has("available"))&&this._field?.setDensity(this.available?this.density:null),(t.has("color")||t.has("running")||t.has("available"))&&(this._syncColor(),this._scheduleColorSync()))}_createField(){if(this._field)return;const t=this.renderRoot.querySelector("canvas"),e=this.renderRoot.querySelector(".dial");t&&e&&(this._field=new Ee(t,{reducedMotion:this._reducedMotion}),this._cssSize=e.getBoundingClientRect().width,this._field.resize(this._cssSize),this._watchDpr(),"function"==typeof ResizeObserver&&(this._resizeObserver=new ResizeObserver(t=>{const i=t.find(t=>t.target===e);i&&(this._cssSize=i.contentRect.width,this._field?.resize(this._cssSize))}),this._resizeObserver.observe(e)),this._syncColor(),this._scheduleColorSync(),this._field.setDensity(this.available?this.density:null),this._syncSpeed(),this._field.observe(this))}_syncSpeed(){this._field?.setSpeed(this._active?this.speedFraction??.35:null)}_syncColor(){const t=this.renderRoot.querySelector(".dial");if(!t||!this._field)return;const e=getComputedStyle(t).getPropertyValue("--mp-aqi-color").trim();if(e&&!e.includes("var("))this._field.setColor(e);else{const t=this.renderRoot.querySelector(".halo");t&&this._field.setColor(getComputedStyle(t).color)}}_scheduleColorSync(){clearTimeout(this._colorTimeout),this._colorTimeout=setTimeout(()=>{this._colorTimeout=void 0,this.isConnected&&this._syncColor()},600)}_colorTransitionEnded(t){"--mp-aqi-color"===t.propertyName&&t.target===t.currentTarget&&(clearTimeout(this._colorTimeout),this._colorTimeout=void 0,this._syncColor())}_cycle(){this.allowCycle&&this.dispatchEvent(new CustomEvent("metric-cycle",{bubbles:!0,composed:!0,detail:{}}))}_chipKeydown(t){"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),t.repeat||this._cycle())}_toggle(){this.disabled||this.dispatchEvent(new CustomEvent("power-toggle",{bubbles:!0,composed:!0,detail:{}}))}_cycleMode(){this.modeAvailable&&this.available&&!this.disabled&&this.dispatchEvent(new CustomEvent("mode-cycle",{bubbles:!0,composed:!0,detail:{}}))}render(){return H`
      <div
        class="dial ${this._active?"active":"neutral"}"
        style=${kt({"--mp-aqi-color":this._active?this.color:"var(--mp-outline)"})}
        @transitionend=${this._colorTransitionEnded}
      >
        ${B`
          <svg viewBox="0 0 320 320" aria-hidden="true" focusable="false">
            <defs>
              <radialGradient id="aqi-halo">
                <stop offset="0%" stop-opacity=".30"></stop>
                <stop offset="35%" stop-opacity=".24"></stop>
                <stop offset="55%" stop-opacity=".15"></stop>
                <stop offset="75%" stop-opacity=".06"></stop>
                <stop offset="90%" stop-opacity=".015"></stop>
                <stop offset="100%" stop-opacity="0"></stop>
              </radialGradient>
            </defs>
            <circle class="halo" cx="160" cy="160" r="134" fill="url(#aqi-halo)"></circle>
          </svg>
        `}
        <canvas aria-hidden="true"></canvas>
        <div class="overlay">
          <div class="category" title=${this.category}>${this.category}</div>
          <div class="value" title=${this.value??"—"}>${this.value??"—"}</div>
          ${this.allowCycle?H`<button
                    class="unit"
                    type="button"
                    aria-describedby="metric-cycle-description"
                    @click=${this._cycle}
                    @keydown=${this._chipKeydown}
                  >
                    ${this.unit}
                  </button>
                  <span id="metric-cycle-description" class="visually-hidden"
                    >Tap to change air quality metric</span
                  >`:H`<span class="unit">${this.unit}</span>`}
          <div class="status" title=${this.available?this.status:"Unavailable"}>
            ${this.available?this.status:"Unavailable"}
          </div>
        </div>
        <button
          class="power ${this._active?"filled":""}"
          type="button"
          aria-label=${this.running?"Turn off":"Turn on"}
          aria-pressed=${String(this.running)}
          ?disabled=${this.disabled}
          @click=${this._toggle}
        >
          <ha-icon icon="mdi:power" aria-hidden="true"></ha-icon>
        </button>
        ${this.modeAvailable?H`<button
                class="mode"
                type="button"
                aria-label=${this.modeLabel}
                ?disabled=${!this.available||this.disabled}
                @click=${this._cycleMode}
              >
                <ha-icon icon=${this.modeIcon} aria-hidden="true"></ha-icon>
              </button>`:""}
      </div>
    `}}Ce.styles=[At,r`
      :host {
        display: block;
        width: 100%;
        --mp-dial-max-size: 320px;
        --mp-dial-chip-height: 32px;
        --mp-dial-power-size: clamp(40px, 15cqi, 48px);
        --mp-dial-control-inset: 0;
        --mp-dial-stack-gap: clamp(4px, 2.5cqi, 8px);
        --mp-dial-value-half-height: 11cqi;
        --mp-dial-focus-width: 2px;
        --mp-dial-color-duration: 600ms;
        --mp-dial-color-ease: cubic-bezier(0.2, 0, 0, 1);
        --mp-dial-press-duration: 200ms;
        --mp-dial-press-ease: cubic-bezier(0.2, 0.8, 0.2, 1.2);
        font-family: var(--md-sys-typescale-body-medium-font, inherit);
      }
      .dial {
        position: relative;
        width: 100%;
        max-width: var(--mp-dial-max-size);
        aspect-ratio: 1;
        margin: auto;
        container-type: inline-size;
        transition: --mp-aqi-color var(--mp-dial-color-duration) var(--mp-dial-color-ease);
      }
      svg,
      canvas {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      stop {
        stop-color: var(--mp-aqi-color);
      }
      .halo {
        color: var(--mp-aqi-color);
      }
      .overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        color: var(--mp-on-surface-variant);
      }
      .category,
      .status,
      .value,
      .unit {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        max-width: 72%;
        box-sizing: border-box;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        text-align: center;
        flex-shrink: 0;
      }
      .category {
        bottom: calc(50% + var(--mp-dial-value-half-height) + var(--mp-dial-stack-gap));
        font-size: clamp(11px, 4.375cqi, var(--md-sys-typescale-label-large-size, 14px));
        font-weight: var(--md-sys-typescale-label-large-weight, 500);
        line-height: 1.2;
      }
      .value {
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 22cqi;
        font-weight: 400;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        color: var(--mp-on-surface);
      }
      .neutral .value {
        color: var(--mp-on-surface-variant);
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .status {
        top: calc(
          50% + var(--mp-dial-value-half-height) + var(--mp-dial-chip-height) + 2 *
            var(--mp-dial-stack-gap)
        );
        font-size: clamp(11px, 4.375cqi, var(--md-sys-typescale-body-medium-size, 14px));
        font-weight: var(--md-sys-typescale-body-medium-weight, 400);
        line-height: 1.2;
      }
      button {
        position: relative;
        border: none;
        font-family: inherit;
        cursor: pointer;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
      }
      .unit {
        top: calc(50% + var(--mp-dial-value-half-height) + var(--mp-dial-stack-gap));
        display: inline-block;
        height: var(--mp-dial-chip-height);
        line-height: var(--mp-dial-chip-height);
        padding: 0 var(--mp-shape-chip-square);
        border-radius: var(--mp-shape-full);
        background: color-mix(
          in srgb,
          var(--mp-aqi-color) 24%,
          var(--mp-surface-container-highest)
        );
        color: var(--mp-on-surface);
        font-size: clamp(11px, 3.75cqi, var(--md-sys-typescale-label-medium-size, 12px));
        font-weight: var(--md-sys-typescale-label-medium-weight, 500);
      }
      .power,
      .mode {
        position: absolute;
        bottom: var(--mp-dial-control-inset);
        display: grid;
        place-items: center;
        padding: 0;
        width: var(--mp-dial-power-size);
        height: var(--mp-dial-power-size);
        flex-shrink: 0;
        border-radius: 50%;
        background: var(--mp-surface-container-highest);
        color: var(--mp-on-surface-variant);
        transition: border-radius var(--mp-dial-press-duration) var(--mp-dial-press-ease);
      }
      .power {
        left: var(--mp-dial-control-inset);
      }
      .mode {
        right: var(--mp-dial-control-inset);
      }
      .power.filled {
        background: var(--mp-primary);
        color: var(--mp-on-primary);
      }
      .power:active:not(:disabled) {
        border-radius: var(--mp-shape-chip-square);
      }
      button::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: currentColor;
        opacity: 0;
        pointer-events: none;
      }
      button:hover:not(:disabled)::after {
        opacity: var(--mp-state-hover);
      }
      button:active:not(:disabled)::after {
        opacity: var(--mp-state-pressed);
      }
      button:focus-visible {
        outline: var(--mp-dial-focus-width) solid var(--mp-primary);
        outline-offset: var(--mp-dial-focus-width);
      }
      button:disabled {
        cursor: default;
        opacity: 0.5;
      }
      @media (prefers-reduced-motion: reduce) {
        .dial,
        .power,
        .mode {
          transition: none;
        }
      }
    `],t([ut({type:String})],Ce.prototype,"value",void 0),t([ut({type:String})],Ce.prototype,"unit",void 0),t([ut({type:String})],Ce.prototype,"category",void 0),t([ut({type:String})],Ce.prototype,"color",void 0),t([ut({type:Boolean})],Ce.prototype,"running",void 0),t([ut({type:Boolean})],Ce.prototype,"available",void 0),t([ut({type:Number})],Ce.prototype,"speedFraction",void 0),t([ut({type:Number})],Ce.prototype,"density",void 0),t([ut({type:String})],Ce.prototype,"status",void 0),t([ut({type:Boolean})],Ce.prototype,"allowCycle",void 0),t([ut({type:Boolean})],Ce.prototype,"disabled",void 0),t([ut({type:String})],Ce.prototype,"modeIcon",void 0),t([ut({type:String})],Ce.prototype,"modeLabel",void 0),t([ut({type:Boolean})],Ce.prototype,"modeAvailable",void 0),customElements.get("mp-purifier-dial")||customElements.define("mp-purifier-dial",Ce);const Se=_t(class extends wt{constructor(t){if(super(t),1!==t.type||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(t=>""!==t)));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return W}}),Me=r`
  .tile {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    /* 40px icon chip + 24px vertical padding = 64px. Capped title/value
       line-heights keep the text shorter than the chip, so every tile variant
       (full, icon-only, and the dropdown/climate tiles) lands on the same 64px
       height and lines up in a mixed feature row. */
    min-height: 64px;
    box-sizing: border-box;
    border: none;
    /* "off" tiles are squarer rounded rectangles; "on" tiles morph to the
       extra-rounded card shape (see the .tile.on rule below). */
    border-radius: var(--mp-shape-chip-square);
    background: var(--mp-surface-container);
    color: var(--mp-on-surface);
    cursor: pointer;
    font: inherit;
    text-align: left;
    transition:
      background-color 200ms cubic-bezier(0.2, 0, 0, 1),
      border-radius 260ms cubic-bezier(0.2, 0, 0, 1),
      color 200ms cubic-bezier(0.2, 0, 0, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .tile:hover {
    background: color-mix(in srgb, var(--mp-on-surface) 6%, var(--mp-surface-container));
  }
  .tile:active {
    background: color-mix(in srgb, var(--mp-on-surface) 12%, var(--mp-surface-container));
  }
  .tile.on {
    /* extra-rounded corners + a soft tint of the accent (the HVAC mode color
       for the climate selector, else the primary). */
    border-radius: var(--mp-shape-card);
    background: color-mix(
      in srgb,
      var(--mp-tile-accent, var(--mp-primary)) 16%,
      var(--mp-surface-container)
    );
    color: var(--mp-tile-accent, var(--mp-primary));
  }
  .tile.on:hover {
    background: color-mix(
      in srgb,
      var(--mp-tile-accent, var(--mp-primary)) 22%,
      var(--mp-surface-container)
    );
  }
  .tile .ic {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: var(--mp-shape-full);
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--mp-on-surface-variant) 14%, transparent);
    color: var(--mp-on-surface-variant);
    transition:
      background-color 200ms cubic-bezier(0.2, 0, 0, 1),
      color 200ms cubic-bezier(0.2, 0, 0, 1);
  }
  .tile.on .ic {
    background: color-mix(in srgb, var(--mp-tile-accent, var(--mp-primary)) 26%, transparent);
    color: var(--mp-tile-accent, var(--mp-primary));
  }
  .tile .ic ha-icon {
    --mdc-icon-size: 22px;
  }
  .tile .ic .dot {
    background: currentColor;
  }
  .tile .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .tile .title {
    font-size: var(--md-sys-typescale-label-medium-size, 13px);
    line-height: 1.2;
    font-weight: 500;
    color: var(--mp-on-surface-variant);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tile.on .title {
    color: currentColor;
  }
  .tile .value {
    font-size: var(--md-sys-typescale-body-large-size, 16px);
    line-height: 1.2;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--mp-on-surface-variant);
    flex: 0 0 auto;
  }
`;class Ae extends ct{constructor(){super(...arguments),this.items=[],this.placeholder="",this.variant="pill",this.label="",this.forceOff=!1,this._open=!1,this._up=!1,this._alignRight=!1,this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)},this._onOtherOpen=t=>{t.detail!==this&&(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick),document.addEventListener("mt-dropdown-open",this._onOtherOpen)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick),document.removeEventListener("mt-dropdown-open",this._onOtherOpen)}get _active(){return this.items.find(t=>t.active)??this.items[0]}get _tileOn(){if(this.forceOff)return!1;const t=this.items.find(t=>t.active);return!!t&&!Ot(t.value)}_toggle(t){if(t.stopPropagation(),!this._open){const t=this.getBoundingClientRect();this._up=t.bottom>.55*window.innerHeight,this._alignRight=t.left+t.width/2>.5*window.innerWidth,document.dispatchEvent(new CustomEvent("mt-dropdown-open",{detail:this}))}this._open=!this._open}_select(t,e){t.stopPropagation(),this._open=!1,this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:e}}))}render(){const t=this._active,e="tile"===this.variant?this._renderTile(t):this._renderPill(t);return H`${e}${this._open?this._renderMenu():K}`}_renderPill(t){return H`
      <button
        class=${Se({trigger:!0,open:this._open})}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        ${t?.icon?H`<ha-icon class="lead" icon=${t.icon}></ha-icon>`:H`<span class="dot"></span>`}
        <span class="label">${t?.label??this.placeholder}</span>
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
    `}_renderTile(t){const e=t?.color?`--mp-tile-accent: ${t.color}`:K;return H`
      <button
        class=${Se({tile:!0,on:this._tileOn,open:this._open})}
        style=${e}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        <div class="ic">
          ${t?.icon?H`<ha-icon icon=${t.icon}></ha-icon>`:H`<span class="dot"></span>`}
        </div>
        <div class="text">
          ${this.label?H`<div class="title">${this.label}</div>`:K}
          <div class="value">${t?.label??this.placeholder}</div>
        </div>
      </button>
    `}_renderMenu(){return H`<div
      class=${Se({menu:!0,up:this._up,right:this._alignRight})}
      role="listbox"
    >
      ${this.items.map(t=>H`<button
            class=${Se({opt:!0,active:!!t.active})}
            role="option"
            aria-selected=${t.active?"true":"false"}
            @click=${e=>this._select(e,t.value)}
          >
            ${t.icon?H`<ha-icon icon=${t.icon}></ha-icon>`:H`<span class="dot"></span>`}
            <span class="label">${t.label}</span>
            ${t.active?H`<ha-icon class="check" icon="mdi:check"></ha-icon>`:K}
          </button>`)}
    </div>`}}Ae.styles=[At,Me,r`
      :host {
        position: relative;
        display: block;
        width: 100%;
      }
      .trigger {
        width: 100%;
        height: 48px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        border: none;
        border-radius: var(--mp-shape-full);
        background: var(--mp-surface-container);
        color: var(--mp-on-surface);
        cursor: pointer;
        font: inherit;
        transition: background-color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .trigger:hover {
        background: color-mix(in srgb, var(--mp-on-surface) 6%, var(--mp-surface-container));
      }
      .trigger .label {
        flex: 1;
        text-align: left;
        font-size: var(--md-sys-typescale-body-large-size, 16px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .trigger .lead {
        --mdc-icon-size: 22px;
        color: var(--mp-on-surface-variant);
      }
      .trigger .chev {
        --mdc-icon-size: 24px;
        color: var(--mp-on-surface-variant);
        transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
      }
      .trigger.open .chev {
        transform: rotate(180deg);
      }
      .menu {
        position: absolute;
        left: 0;
        right: auto;
        top: calc(100% + 6px);
        z-index: 20;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 6px;
        /* Grow to fit options, capped to the viewport. */
        min-width: 100%;
        width: max-content;
        max-width: min(360px, 85vw);
        background: var(--mp-surface-container-high);
        border-radius: 20px;
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.2);
        max-height: 280px;
        overflow-y: auto;
        animation: mp-pop 130ms cubic-bezier(0.2, 0, 0, 1);
      }
      .menu.right {
        left: auto;
        right: 0;
      }
      .menu.up {
        top: auto;
        bottom: calc(100% + 6px);
      }
      .opt {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        background: transparent;
        color: var(--mp-on-surface);
        border-radius: var(--mp-shape-full);
        cursor: pointer;
        font: inherit;
        text-align: left;
      }
      .opt .label {
        flex: 1;
        white-space: nowrap;
      }
      .opt ha-icon {
        --mdc-icon-size: 22px;
      }
      .opt:hover {
        background: color-mix(in srgb, var(--mp-on-surface) 8%, transparent);
      }
      .opt.active {
        background: var(--mp-secondary-container);
        color: var(--mp-on-secondary-container);
      }
      .opt .check {
        --mdc-icon-size: 20px;
        color: var(--mp-on-secondary-container);
      }
      @keyframes mp-pop {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `],t([ut({attribute:!1})],Ae.prototype,"items",void 0),t([ut()],Ae.prototype,"placeholder",void 0),t([ut()],Ae.prototype,"variant",void 0),t([ut()],Ae.prototype,"label",void 0),t([ut({type:Boolean})],Ae.prototype,"forceOff",void 0),t([mt()],Ae.prototype,"_open",void 0),t([mt()],Ae.prototype,"_up",void 0),t([mt()],Ae.prototype,"_alignRight",void 0),customElements.get("mp-dropdown")||customElements.define("mp-dropdown",Ae);class Pe extends ct{constructor(){super(...arguments),this.items=[],this.display="icons",this.forceOff=!1}_select(t){this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:t},bubbles:!0,composed:!0}))}render(){if(!this.items.length)return K;if("tile"===this.display)return this._renderTile();const t="dropdown"===this.display?this._renderDropdown():this._renderIcons();return H`${this.label?H`<div class="title">${this.label}</div>`:K}${t}`}_renderIcons(){return H`
      <div class="chips" role="group" aria-label=${this.label??"options"}>
        ${this.items.map(t=>H`
            <button
              class=${Se({chip:!0,active:!!t.active})}
              ?disabled=${t.disabled}
              title=${t.label}
              aria-label=${t.label}
              aria-pressed=${t.active?"true":"false"}
              @click=${()=>this._select(t.value)}
            >
              ${t.icon?H`<ha-icon icon=${t.icon}></ha-icon>`:H`<span class="chip-text">${t.label}</span>`}
            </button>
          `)}
      </div>
    `}_renderDropdown(){return H`<mp-dropdown
      .items=${this.items}
      .placeholder=${this.label??""}
      @item-selected=${t=>this._select(t.detail.value)}
    ></mp-dropdown>`}_renderTile(){return H`<mp-dropdown
      variant="tile"
      .items=${this.items}
      .label=${this.label??""}
      .forceOff=${this.forceOff}
      @item-selected=${t=>this._select(t.detail.value)}
    ></mp-dropdown>`}}Pe.styles=[At,r`
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .title {
        color: var(--mp-on-surface-variant);
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        font-weight: 500;
        padding: 0 4px 6px;
      }
      .chips {
        display: flex;
        align-items: center;
        justify-content: safe center;
        gap: 4px;
        padding: 4px 2px;
        background: var(--mp-surface-container);
        border-radius: var(--mp-shape-full);
        /* Shrink to the container and scroll rather than squish the chips. */
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
      }
      .chips::-webkit-scrollbar {
        display: none;
      }
      .chip {
        flex: 1 1 44px;
        height: 44px;
        min-width: 44px;
        max-width: 120px;
        display: grid;
        place-items: center;
        border: none;
        border-radius: var(--mp-shape-full);
        background: transparent;
        color: var(--mp-on-surface-variant);
        cursor: pointer;
        padding: 0 8px;
        transition:
          background-color 180ms cubic-bezier(0.2, 0, 0, 1),
          color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .chip ha-icon {
        --mdc-icon-size: 24px;
      }
      .chip-text {
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        font-weight: 500;
        white-space: nowrap;
      }
      .chip:hover:not(.active):not([disabled]) {
        background: color-mix(in srgb, var(--mp-on-surface) 8%, transparent);
      }
      .chip:active:not([disabled]) {
        background: color-mix(in srgb, var(--mp-on-surface) 12%, transparent);
      }
      .chip.active {
        background: var(--mp-selected-bg, var(--mp-primary));
        color: var(--mp-selected-fg, var(--mp-on-primary));
      }
      .chip[disabled] {
        opacity: 0.38;
        cursor: default;
      }
    `],t([ut({attribute:!1})],Pe.prototype,"items",void 0),t([ut()],Pe.prototype,"display",void 0),t([ut()],Pe.prototype,"label",void 0),t([ut({type:Boolean})],Pe.prototype,"forceOff",void 0),customElements.get("mp-selector-row")||customElements.define("mp-selector-row",Pe);class ze extends ct{constructor(){super(...arguments),this.config={type:"fan-presets"}}get _stateObj(){return this.hass?.states?.[this.entity]}_build(){const t=this._stateObj;if(!t)return[];const e=new Map;(this.config.options??[]).forEach(t=>e.set(t.value,t));const i=t.attributes.preset_modes??[];return Nt(this.config.show_off?["off",...i]:i,this.config.order).filter(t=>!e.get(t)?.hide).map(i=>({value:i,label:e.get(i)?.label??Dt(i),icon:e.get(i)?.icon??Pt(i),color:e.get(i)?.color??zt(i),active:"off"===i?"off"===t.state:"on"===t.state&&t.attributes.preset_mode===i,disabled:"unavailable"===t.state}))}_onSelect(t){const e=this._build().find(e=>e.value===t.detail.value);!e||e.active||e.disabled||("off"===e.value?this.hass.callService("fan","turn_off",{entity_id:this.entity}):this.hass.callService("fan","set_preset_mode",{entity_id:this.entity,preset_mode:e.value}))}render(){const t=this._build();return t.length?H`<mp-selector-row
      .items=${t}
      display=${this.config.display??"icons"}
      .label=${this.config.label}
      @item-selected=${this._onSelect}
    ></mp-selector-row>`:K}}t([ut({attribute:!1})],ze.prototype,"hass",void 0),t([ut()],ze.prototype,"entity",void 0),t([ut({attribute:!1})],ze.prototype,"config",void 0),customElements.get("mp-fan-presets")||customElements.define("mp-fan-presets",ze);class Ne{constructor(t){this.positionValue=0,this.phaseValue="idle",this.startPosition=0,this.samples=[],this.wheelResidual=0,this.animationStart=0,this.animationPosition=0,this.animationTarget=0,this.animationTimeConstant=120,Ne.validateCount(t.count),this.count=t.count,this.pxPerDetent=t.pxPerDetent??22,this.timeConstantMs=t.timeConstantMs??325,this.minFlickVelocity=t.minFlickVelocity??.25,this.wheelPxPerDetent=t.wheelPxPerDetent??60,this.rubberBand=t.rubberBand??.35}get position(){return this.positionValue}get detent(){return this.clamp(Math.round(this.positionValue))}get phase(){return this.phaseValue}setCount(t){Ne.validateCount(t),this.count=t,this.positionValue=this.clamp(this.positionValue),this.cancel()}setDetent(t){this.positionValue=this.clamp(Math.round(t)),this.cancel()}dragStart(t){this.tick(t),this.startPosition=this.positionValue,this.samples=[{time:t,dy:0}],this.wheelResidual=0,this.phaseValue="dragging"}dragMove(t,e){if("dragging"!==this.phaseValue)return;const i=this.startPosition-t/this.pxPerDetent,s=this.clamp(i);this.positionValue=s+(i-s)*this.rubberBand,this.recordSample(t,e)}dragEnd(t){if("dragging"!==this.phaseValue)return;const e=this.samples[this.samples.length-1];this.recordSample(e.dy,t);const i=this.samples[0],s=t-i.time,a=s>0?(e.dy-i.dy)/s:0,n=Math.abs(a)>=this.minFlickVelocity,r=n?this.positionValue-a*this.timeConstantMs/this.pxPerDetent:this.clamp(this.positionValue);this.animationTarget=this.clamp(Math.round(r)),this.animationPosition=this.positionValue,this.animationStart=t,this.animationTimeConstant=n?this.timeConstantMs:120,this.phaseValue=n?"coasting":"snapping",this.samples=[]}wheel(t,e){const i=this.detent;let s=0;if(0===e){0!==t&&this.wheelResidual*t<0&&(this.wheelResidual=0),this.wheelResidual+=t;const e=Math.trunc(this.wheelResidual/this.wheelPxPerDetent);this.wheelResidual-=e*this.wheelPxPerDetent,s=-e}else this.wheelResidual=0,s=-Math.sign(t);return this.positionValue=this.clamp(i+s),this.phaseValue="idle",this.samples=[],this.detent-i}step(t){this.setDetent(this.detent+t)}tick(t){if("coasting"!==this.phaseValue&&"snapping"!==this.phaseValue)return!1;const e=Math.max(0,t-this.animationStart);return this.positionValue=this.animationTarget-(this.animationTarget-this.animationPosition)*Math.exp(-e/this.animationTimeConstant),!(Math.abs(this.animationTarget-this.positionValue)<.01&&(this.positionValue=this.animationTarget,this.phaseValue="idle",1))}recordSample(t,e){this.samples=this.samples.filter(t=>t.time>=e-100);const i=this.samples[this.samples.length-1];i?.time===e?i.dy=t:this.samples.push({time:e,dy:t})}clamp(t){return Math.max(0,Math.min(this.count-1,t))}cancel(){this.phaseValue="idle",this.samples=[],this.wheelResidual=0}static validateCount(t){if(!Number.isInteger(t)||t<1)throw new RangeError("Wheel detent count must be a positive integer.")}}const Oe=85*Math.PI/180,De=new Set(["ArrowUp","ArrowRight","ArrowDown","ArrowLeft","PageUp","PageDown","Home","End"]);class Fe extends ct{constructor(){super(...arguments),this.min=0,this.max=100,this.step=1,this.value=null,this.disabled=!1,this.label="Fan speed",this.valueText="",this._physics=new Ne({count:101,pxPerDetent:22}),this._pointer=null,this._startY=0,this._startDetent=0,this._lastDetent=0,this._dirty=!1,this._frame=null,this._wheelTimer=null,this._observer=null,this._ridges=[],this._radius=60,this._ridgeWidth=40,this._onPointerDown=t=>{if(!this.disabled&&0===t.button&&null===this._pointer){try{this.setPointerCapture(t.pointerId)}catch(t){if(!(t instanceof DOMException)||"NotFoundError"!==t.name)throw t}t.preventDefault(),this.focus({preventScroll:!0}),this._clearWheelTimer(),null!==this._frame&&cancelAnimationFrame(this._frame),this._frame=null,this._pointer=t.pointerId,this._startY=t.clientY,this._physics.dragStart(performance.now()),this._startDetent=this._physics.detent,this._paint()}},this._onPointerMove=t=>{this.disabled||this._pointer!==t.pointerId||(this._physics.dragMove(t.clientY-this._startY,performance.now()),this._trackDetent())},this._onPointerEnd=t=>{if(this._pointer===t.pointerId){if("pointerup"!==t.type)return this._cancelInteraction(),this._physics.setDetent(this._startDetent),this._trackDetent(),void(this._dirty=!1);this._pointer=null,this.hasPointerCapture(t.pointerId)&&this.releasePointerCapture(t.pointerId),window.matchMedia("(prefers-reduced-motion: reduce)").matches?this._physics.setDetent(this._physics.detent):this._physics.dragEnd(performance.now()),this._trackDetent(),this._animate()}},this._tick=t=>{this._frame=null,this.isConnected&&!this.disabled&&(this._physics.tick(t),this._trackDetent(),this._animate())},this._onWheel=t=>{if(this.disabled)return;const e=this._interacting,i=this._physics.detent;this._physics.wheel(t.deltaY,t.deltaMode),(i!==this._physics.detent||e)&&(t.preventDefault(),this._clearWheelTimer(),this._wheelTimer=setTimeout(()=>{this._wheelTimer=null,null===this._pointer?this._animate():this._paint()},300),this._trackDetent())},this._onKeyDown=t=>{if(this.disabled||null!==this._pointer||!De.has(t.key))return;t.preventDefault(),this._clearWheelTimer(),null!==this._frame&&cancelAnimationFrame(this._frame),this._frame=null,this._physics.setDetent(this._physics.detent);const e=Math.max(1,Math.round(this._count/10));switch(t.key){case"ArrowUp":case"ArrowRight":this._physics.step(1);break;case"ArrowDown":case"ArrowLeft":this._physics.step(-1);break;case"PageUp":this._physics.step(e);break;case"PageDown":this._physics.step(-e);break;case"Home":this._physics.setDetent(0);break;case"End":this._physics.setDetent(this._count-1)}this._trackDetent(),this._settle()},this._layoutRidges=()=>{const t=this.renderRoot.querySelector(".ridges");if(!t)return;const{width:e,height:i}=this.getBoundingClientRect();this._radius=Math.max(60,i/2),this._ridgeWidth=Math.max(1,e-23),t.setAttribute("viewBox",`${-e/2} ${-this._radius} ${e} ${2*this._radius}`);const s=t.querySelector(".notch");s?.setAttribute("cx",String(e/2-3-2));const a=Math.ceil(Math.PI*this._radius/11)+4;this._ridges.length!==a&&(this._ridges=Array.from({length:a},()=>{const t=document.createElementNS("http://www.w3.org/2000/svg","path");return t.setAttribute("class","ridge"),t.setAttribute("stroke-width",String(3)),t}),t.querySelector(".ridge-pool").replaceChildren(...this._ridges)),this._paint()}}get _count(){if(!Number.isFinite(this.min)||!Number.isFinite(this.max)||!Number.isFinite(this.step)||this.step<=0||this.max<this.min)return 1;const t=(this.max-this.min)/this.step,e=Math.floor(t+1e-9);return e+1+(t-e>1e-9?1:0)}get _interacting(){return null!==this._pointer||"idle"!==this._physics.phase||null!==this._wheelTimer}_precision(t){const[e,i="0"]=t.toString().toLowerCase().split("e");return Math.max(0,(e.split(".")[1]?.length??0)-Number(i))}get _currentValue(){if(this._count>1&&this._physics.detent===this._count-1)return this.max;const t=Math.min(100,Math.max(this._precision(this.step),this._precision(this.min)));return Math.min(this.max,Number((this.min+this._physics.detent*this.step).toFixed(t)))}_syncValue(){const t=this.value??this.min;let e=0;if(Number.isFinite(t)&&this.step>0&&this._count>1){const i=Math.max(0,Math.min(this._count-2,Math.round((t-this.min)/this.step))),s=this.min+i*this.step;e=Math.abs(t-this.max)<=Math.abs(t-s)?this._count-1:i}this._physics.detent!==e&&this._physics.setDetent(e),this._lastDetent=this._physics.detent}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this._onKeyDown),this.addEventListener("wheel",this._onWheel,{passive:!1}),this.addEventListener("pointerdown",this._onPointerDown),this.addEventListener("pointermove",this._onPointerMove),this.addEventListener("pointerup",this._onPointerEnd),this.addEventListener("pointercancel",this._onPointerEnd),this.addEventListener("lostpointercapture",this._onPointerEnd),this.updateComplete.then(()=>{this.isConnected&&!this._observer&&(this._observer=new ResizeObserver(this._layoutRidges),this._observer.observe(this),this._layoutRidges())})}disconnectedCallback(){this._cancelInteraction(),this._observer?.disconnect(),this._observer=null,this.removeEventListener("keydown",this._onKeyDown),this.removeEventListener("wheel",this._onWheel),this.removeEventListener("pointerdown",this._onPointerDown),this.removeEventListener("pointermove",this._onPointerMove),this.removeEventListener("pointerup",this._onPointerEnd),this.removeEventListener("pointercancel",this._onPointerEnd),this.removeEventListener("lostpointercapture",this._onPointerEnd),super.disconnectedCallback()}updated(t){t.has("disabled")&&this.disabled&&this._cancelInteraction();const e=t.has("min")||t.has("max")||t.has("step");e&&this._physics.setCount(this._count),this._interacting||!t.has("value")&&!e||this._syncValue(),this._paint()}_clearWheelTimer(){null!==this._wheelTimer&&clearTimeout(this._wheelTimer),this._wheelTimer=null}_cancelInteraction(){this._clearWheelTimer(),null!==this._frame&&cancelAnimationFrame(this._frame),this._frame=null;const t=this._pointer;this._pointer=null,null!==t&&this.hasPointerCapture(t)&&this.releasePointerCapture(t),this._physics.setDetent(this._physics.detent),this._dirty=!1,this._paint()}_emit(t){this.dispatchEvent(new CustomEvent(t,{detail:{value:this._currentValue},bubbles:!0,composed:!0}))}_trackDetent(){this._paint(),this._lastDetent!==this._physics.detent&&(this._lastDetent=this._physics.detent,this._dirty=!0,this._emit("value-changing"),window.dispatchEvent(new CustomEvent("haptic",{detail:"selection"})))}_settle(){this._paint(),this._interacting||(this._dirty&&(this._dirty=!1,this._emit("value-changed")),this._interacting||(this._syncValue(),this._paint()))}_animate(){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){let t=performance.now();for(let e=0;e<100&&"idle"!==this._physics.phase;e++)t+=1e5,this._physics.tick(t),this._trackDetent();return void this._settle()}"idle"===this._physics.phase?this._settle():null===this._frame&&(this._frame=requestAnimationFrame(this._tick))}_paint(){const t={role:"slider",tabindex:this.disabled?"-1":"0","aria-label":this.label,"aria-orientation":"vertical","aria-disabled":String(this.disabled),"aria-valuemin":String(this.min),"aria-valuemax":String(this.max),"aria-valuenow":String(this._currentValue),"aria-valuetext":this.valueText||String(this._currentValue)};for(const[e,i]of Object.entries(t))this.getAttribute(e)!==i&&this.setAttribute(e,i);this.hasAttribute("interacting")!==this._interacting&&this.toggleAttribute("interacting",this._interacting);const e=(2*-this._physics.position%1+1)%1,i=Math.floor(this._ridges.length/2);this._ridges.forEach((t,s)=>{const a=11*(s-i+e)/this._radius,n=Math.max(0,Math.cos(a)),r=this._ridgeWidth*(.55+.45*n),o=Math.max(.6/3,n),l=.35*Math.sin(a)*(r/2),c=this._radius*Math.sin(a),d=Math.abs(a)<=Oe&&Math.abs(c+l)+3*o/2<=this._radius;t.setAttribute("d",d?`M ${-r/2} 0 Q 0 ${2*l/o} ${r/2} 0`:"M 0 0 Q 0 0 0 0"),t.setAttribute("transform",`translate(0 ${d?c:0}) scale(1 ${o})`),t.setAttribute("opacity",d?String(.2+.8*n):"0")})}render(){return H`<div class="drum" aria-hidden="true">
      ${B`<svg class="ridges" focusable="false" preserveAspectRatio="none">
        <g class="ridge-pool"></g>
        <circle class="notch" r="${2}" cy="0"></circle>
      </svg>`}
    </div>`}}Fe.styles=[At,r`
      :host {
        --mp-wheel-width: 56px;
        --mp-wheel-min-height: 120px;
        --mp-wheel-radius: 28px;
        --mp-wheel-outline: 2px;
        display: block;
        width: var(--mp-wheel-width);
        height: 100%;
        min-height: var(--mp-wheel-min-height);
        touch-action: none;
        user-select: none;
        outline: none;
        cursor: grab;
      }
      :host([disabled]) {
        opacity: 0.38;
        cursor: not-allowed;
      }
      .drum {
        /* Animate the resolved color, not an unregistered custom property, so
           the ends track the tile's background transition without observers. */
        color: var(
          --mp-wheel-fade,
          var(--mp-surface-container-high, var(--ha-card-background, #fff))
        );
        transition: color 200ms cubic-bezier(0.2, 0, 0, 1);
        position: relative;
        width: 100%;
        height: 100%;
        min-height: var(--mp-wheel-min-height);
        border-radius: var(--mp-wheel-radius);
        background: linear-gradient(
          to bottom,
          currentColor,
          var(--mp-surface-container-highest) 42%,
          color-mix(in srgb, var(--mp-surface-container-highest) 96%, white) 50%,
          var(--mp-surface-container-highest) 58%,
          currentColor
        );
        /* The gradient owns cylinder shading. Offset inset shadows paint a
           second capsule edge beside the outline; keep one fixed silhouette. */
        overflow: hidden;
        pointer-events: none;
      }
      @media (prefers-reduced-motion: reduce) {
        .drum {
          transition: none;
        }
      }
      :host([interacting]) .drum {
        outline: var(--mp-wheel-outline) solid var(--mp-primary);
      }
      :host(:focus-visible) .drum {
        outline: var(--mp-wheel-outline) solid var(--mp-primary);
      }
      .ridges {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .ridge-pool {
        mask-image: linear-gradient(transparent, black 18%, black 82%, transparent);
      }
      .ridge {
        fill: none;
        stroke: var(--mp-on-surface-variant);
        stroke-linecap: round;
      }
      .drum::after {
        content: '';
        position: absolute;
        top: 43%;
        left: 12px;
        right: 12px;
        height: 1px;
        border-radius: var(--mp-wheel-radius);
        background: rgb(255 255 255 / 10%);
      }
      .notch {
        fill: var(--mp-primary);
      }
    `],t([ut({type:Number})],Fe.prototype,"min",void 0),t([ut({type:Number})],Fe.prototype,"max",void 0),t([ut({type:Number})],Fe.prototype,"step",void 0),t([ut({type:Number})],Fe.prototype,"value",void 0),t([ut({type:Boolean,reflect:!0})],Fe.prototype,"disabled",void 0),t([ut({type:String})],Fe.prototype,"label",void 0),t([ut({type:String,attribute:"value-text"})],Fe.prototype,"valueText",void 0),customElements.get("mp-speed-wheel")||customElements.define("mp-speed-wheel",Fe);class Te extends ct{constructor(){super(...arguments),this.entity="",this._optimistic=null,this._optimisticMode=null,this._calibration=null,this._calibrationIdentity=null,this._calibrationRequested=!1,this._calibrationNullAt=null,this._calibrationRevision=0,this._manualSince=null,this._debounce=null,this._expiry=null,this._revision=0,this._inFlight=!1,this._pending=null,this._toggles=[],this._lastTogglePreset=null,this._resolvedIdentity=null,this._optimismExpired=!1,this._modeExpiry=null,this._pointerStart=null,this._dragged=!1,this._onPointerDown=t=>{this._pointerStart={x:t.clientX,y:t.clientY},this._dragged=!1},this._onPointerMove=t=>{this._pointerStart&&Math.hypot(t.clientX-this._pointerStart.x,t.clientY-this._pointerStart.y)>5&&(this._dragged=!0)},this._onPointerUp=t=>{this._onPointerMove(t),this._pointerStart=null,this.requestUpdate()},this._onPointerCancel=()=>{this._pointerStart=null,this._dragged=!0,this.requestUpdate()},this._onToggle=t=>{if(t.composedPath().some(t=>t instanceof Element&&"mp-speed-wheel"===t.localName))return;const e=0===t.detail&&t.composedPath().some(t=>t instanceof HTMLButtonElement);if(this._dragged&&!e)return;if(!this.isConnected)return;const i=this._target();if(this._syncTarget(i),this._disabled(i))return;const s=this.hass.states[this.entity],a=ae(s,this._speedSource()),n=this._optimisticMode?.active??this._reportedActive(),r=s.attributes.preset_modes??[],o=null===a?null:n?r.find(t=>/auto/i.test(t)&&t.toLowerCase()!==a.toLowerCase())??r.find(t=>t.toLowerCase()!==a.toLowerCase())??null:a;if(null!==a&&null===o)return;this._revision++,this._pending=null,this._clearDebounce(),this._clearOptimistic(),this._optimismExpired=!1,this._clearModeOptimistic();const l={active:!n,preset:o};this._optimisticMode=l,this._modeExpiry=setTimeout(()=>this._clearModeOptimistic(),5e3);const c=this._identity(i),d=this.hass,h=this.entity;this._toggles.push({identity:c,run:async()=>{try{await d.callService("fan",null===a?"toggle":"set_preset_mode",{entity_id:h,...null===o?{}:{preset_mode:o}}),this.isConnected&&c===this._resolvedIdentity&&(this._lastTogglePreset=o)}catch(t){console.warn("mp-speed-wheel-tile: failed to toggle Manual mode",t),this._optimisticMode===l&&c===this._resolvedIdentity&&this._clearModeOptimistic()}}}),this._drain()},this._onChanging=t=>{if(!this.isConnected)return;const e=this._target();this._syncTarget(e),this._disabled(e)||Number.isFinite(t.detail.value)&&(this._revision++,this._pending=null,this._clearExpiry(),this._clearDebounce(),this._optimistic=t.detail.value,this._dragged=!0,this._optimismExpired=!1,this._expiry=setTimeout(()=>{this._expiry=null,this._optimismExpired=!0,this._inFlight||this._clearOptimistic()},5e3))},this._onChanged=t=>{if(this._onChanging(t),!this.isConnected||this._disabled(this._target()))return;const e=t.detail.value;if(!Number.isFinite(e))return;const i=this._revision,s=this._identity(this._target());this._debounce=setTimeout(()=>{this._debounce=null,this._commit(e,i,s)},600)}}_speedSource(){const t={...te(this.cardConfig??{entity:this.entity})};for(const e of["entity","preset","display","estimate_auto","show_coverage"]){const i=this.config[e];void 0!==i&&Object.assign(t,{[e]:i})}return t}_activeCalibration(t){return de(this.cardConfig?.calibration,t)??this._calibration}_canEstimate(t){return!1!==this._speedSource().estimate_auto&&!this._disabled(t)&&"on"===this.hass.states[this.entity]?.state&&!this._reportedActive()&&null===this._optimistic&&null===this._optimisticMode&&null===this._pointerStart&&!this._inFlight&&null===this._pending&&null===this._debounce}_calibrationSource(t){if("number"!==t.kind&&"input_number"!==t.kind||!t.entity)return null;const e=this.rpmEntity??Kt(this.hass,this.entity),i=ae(this.hass.states[this.entity],this._speedSource());return e&&i?{fanEntity:this.entity,speedEntity:t.entity,rpmEntity:e,speedPreset:i,target:t}:null}_syncCalibration(t,e){const i=this._calibrationSource(t),s=i?JSON.stringify([i.fanEntity,i.speedEntity,i.rpmEntity,i.speedPreset,t.kind,t.min,t.max,t.step]):null;s!==this._calibrationIdentity&&(this._calibrationRevision++,this._calibrationIdentity=s,this._calibrationRequested=!1,this._calibrationNullAt=null,this._calibration=null,this._manualSince=null);let a=!1;if(e&&(this._reportedActive()?this._manualSince??=Date.now():null!==this._manualSince&&(a=Date.now()-this._manualSince>=3e4,this._manualSince=null,this._revision++,this._pending=null,this._clearDebounce(),this._clearOptimistic(),this._optimismExpired=!1)),e&&null!==this._calibrationNullAt&&Date.now()-this._calibrationNullAt>=18e5&&(this._calibrationRequested=!1,this._calibrationNullAt=null),!i||!this.isConnected||null!==de(this.cardConfig?.calibration,t)||!1===this._speedSource().estimate_auto||!a&&(!this._canEstimate(t)||this._calibrationRequested))return;this._calibrationRequested=!0;const n=this._calibrationRevision;Te.calibrationProvider(this.hass,i,{force:a}).then(t=>{this.isConnected&&n===this._calibrationRevision&&(this._calibration=t,this._calibrationNullAt=null===t?Date.now():null)})}_estimatedValue(t){if(!this._canEstimate(t))return null;if("fan_percentage"===t.kind){const t=this.hass.states[this.entity]?.attributes.percentage;return"number"==typeof t&&Number.isFinite(t)?t:null}const e=this._calibrationSource(t),i=e?Gt(this.hass,e.rpmEntity):null,s=this._activeCalibration(t);if(!s||null===i)return null;const a=ee(t.min,t.max,t.step)-1,n=pe(s,i,a);if(null===n||!Number.isFinite(n))return null;const r=Math.max(0,Math.min(a,Math.round(n)));return r===a?t.max:Number((t.min+r*t.step).toPrecision(15))}_reportedActive(){const t=this.hass.states[this.entity],e=ae(t,this._speedSource());return"on"===t?.state&&(null===e||t.attributes.preset_mode?.toLowerCase()===e.toLowerCase())}_clearModeOptimistic(){null!==this._modeExpiry&&clearTimeout(this._modeExpiry),this._modeExpiry=null,this._optimisticMode=null}_drain(){if(this._inFlight)return;const t=this._toggles.shift();if(t)return void this._commitToggle(t);const e=this._pending;this._pending=null,e&&this._commit(e.value,e.revision,e.identity),!this._inFlight&&this._optimismExpired&&this._clearOptimistic()}async _commitToggle(t){if(!this.isConnected)return;const e=this._target();if(this._syncTarget(e),t.identity!==this._identity(e)||this._disabled(e))this._drain();else{this._inFlight=!0;try{await t.run()}finally{this._inFlight=!1,this._drain(),this.requestUpdate()}}}_target(){return se(this.hass,this.entity,this._speedSource())}_disabled(t){const e=this.hass.states[this.entity];return"none"===t.kind||!t.available||!e||["unavailable","unknown"].includes(e.state)}_identity(t){return JSON.stringify([this.entity,t.kind,t.entity])}_clearExpiry(){null!==this._expiry&&clearTimeout(this._expiry),this._expiry=null}_clearDebounce(){null!==this._debounce&&clearTimeout(this._debounce),this._debounce=null}_clearOptimistic(){this._clearExpiry(),this._optimistic=null}willUpdate(t){if(!this.hass||!this.config)return;const e=this._target();this._syncTarget(e),this._syncCalibration(e,t.has("hass"))}_syncTarget(t){const e=this._identity(t);e!==this._resolvedIdentity||this._disabled(t)?(this._revision++,this._pending=null,this._toggles=[],this._lastTogglePreset=null,this._clearDebounce(),this._clearOptimistic(),this._clearModeOptimistic(),this._optimismExpired=!1):null!==this._optimistic&&t.value===this._optimistic&&this._clearOptimistic(),this._resolvedIdentity=e;const i=this._optimisticMode,s=this.hass.states[this.entity];!i||(null===i.preset?this._reportedActive()!==i.active:s?.attributes.preset_mode?.toLowerCase()!==i.preset.toLowerCase()||i.active&&"on"!==s.state)||this._clearModeOptimistic()}async _commit(t,e,i){if(!this.isConnected)return;const s=this._target();if(this._syncTarget(s),e===this._revision&&i===this._identity(s))if(this._inFlight)this._pending={value:t,revision:e,identity:i};else if(this._disabled(s))this._clearOptimistic();else{this._inFlight=!0;try{const a=this.hass,n=this.entity,r=this._speedSource(),o=a.states[n],l=ae(o,r);if(l&&null!==this._lastTogglePreset&&this._lastTogglePreset!==l&&"on"===o?.state&&o.attributes.preset_mode===l&&await a.callService("fan","set_preset_mode",{entity_id:n,preset_mode:l}),this._lastTogglePreset=null,await re(a,n,s,t,r),!this.isConnected||e!==this._revision||i!==this._identity(this._target()))return;this._target().value===t&&this._clearOptimistic()}catch(t){console.warn("mp-speed-wheel-tile: failed to set fan speed",t),this.isConnected&&e===this._revision&&this._clearOptimistic()}finally{this._inFlight=!1,this._drain(),this.requestUpdate()}}}connectedCallback(){super.connectedCallback(),this.requestUpdate()}disconnectedCallback(){this._calibrationRevision++,this._calibrationIdentity=null,this._calibrationRequested=!1,this._calibrationNullAt=null,this._calibration=null,this._manualSince=null,this._revision++,this._pending=null,this._toggles=[],this._lastTogglePreset=null,this._clearDebounce(),this._clearOptimistic(),this._clearModeOptimistic(),this._pointerStart=null,this._dragged=!1,super.disconnectedCallback()}render(){if(!this.hass||!this.entity||!this.config)return K;const t=this._target(),e=this._estimatedValue(t),i=t.available?this._optimistic??e??t.value:null,s=this.config.label??"Fan speed",a=this.hass.states[this.entity],n="off"===a?.state&&null===this._optimistic,r="on"===a?.state&&t.available&&!(this._optimisticMode?.active??this._reportedActive())&&null===this._optimistic&&null===e,o=Dt(this._optimisticMode?.preset??a?.attributes.preset_mode??""),l=n?"Off":r?o:oe(t,i,this._speedSource().display??"percent"),c=r?Gt(this.hass,this.rpmEntity??Kt(this.hass,this.entity)):null,d=this._activeCalibration(t),h=ie(t,i),p=null!==i&&this.cardConfig?"fan_percentage"===t.kind?void 0===this.cardConfig.cadr?null:this.cardConfig.cadr*i/100:d&&null!==h?function(t,e){const i=he(t),s=t.cadr;return null===e||!Number.isFinite(e)||null===i||void 0===s||!Number.isFinite(s)||s<=0?null:s*Math.max(0,Math.min(1,e/i))}(this.cardConfig,function(t,e){if(!Number.isFinite(e)||t.points.length<2)return null;const i=t.points;let s=0;for(;s<i.length-2&&e>i[s+1].detent;)s++;const a=i[s],n=i[s+1];if(n.detent<=a.detent)return null;const r=a.rpm+(e-a.detent)/(n.detent-a.detent)*(n.rpm-a.rpm);return Number.isFinite(r)?Math.max(0,r):null}(d,h)):null:null,u=n||r||!1===this._speedSource().show_coverage?null:function(t){return null===t?null:`${t[0]}–${t[1]} m²`}(null===(m=p)||!Number.isFinite(m)||m<=0?null:[Math.round(.07*m),Math.round(.12*m)]);var m;const v="none"===t.kind;return H`
      <div
        class=${Se({tile:!0,on:this._optimisticMode?.active??this._reportedActive()})}
        style=${`--mp-tile-accent: ${this.config.color??"var(--mp-primary)"}`}
        @click=${this._onToggle}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerCancel}
      >
        <button
          class="ic"
          type="button"
          aria-label="Manual mode"
          aria-pressed=${String(this._optimisticMode?.active??this._reportedActive())}
          ?disabled=${this._disabled(t)}
        >
          <ha-icon icon=${this.config.icon??"mdi:fan"}></ha-icon>
        </button>
        <div class="text">
          <div class="title">${s}</div>
          <div
            class=${Se({value:!0,percent:!v&&!n&&!r&&"level"!==this._speedSource().display})}
          >
            ${v?"No speed control":l}
          </div>
          ${u?H`<div class="secondary coverage">${u}</div>`:K}
          ${null!==c&&c>0?H`<div class="secondary">${Math.round(c).toLocaleString()} rpm</div>`:K}
          ${v?H`<div class="secondary">Add a speed entity</div>`:K}
          ${v||t.available?K:H`<div class="secondary">Speed control unavailable</div>`}
        </div>
        <mp-speed-wheel
          .min=${t.min}
          .max=${t.max}
          .step=${t.step}
          .value=${i}
          .disabled=${this._disabled(t)}
          .label=${s}
          .valueText=${r?`${o} mode`:`${null!==e?"Current speed ":""}${l}${u?", "+u:""}`}
          @value-changing=${this._onChanging}
          @value-changed=${this._onChanged}
        ></mp-speed-wheel>
      </div>
    `}}Te.calibrationProvider=function(t,e,i={}){const s=(i.now??new Date).getTime();!function(t){try{for(let e=localStorage.length-1;e>=0;e--){const i=localStorage.key(e);if(!i?.startsWith(me))continue;let s=!1;if(i.startsWith(ve))try{const e=JSON.parse(localStorage.getItem(i)??"null");s=null!==e&&"object"==typeof e&&(null===e.points||Array.isArray(e.points))&&be(e,t)}catch{}s||localStorage.removeItem(i)}}catch{}}(s);for(const[t,e]of fe)be(e,s)||fe.delete(t);const a=`${ve}${JSON.stringify({fanEntity:e.fanEntity,speedEntity:e.speedEntity,rpmEntity:e.rpmEntity,speedPreset:e.speedPreset.toLowerCase(),kind:e.target.kind,min:e.target.min,max:e.target.max,step:e.target.step})}`,n=ge.get(a);if(n)return n;const r=(async()=>{let n,r=i.force?void 0:fe.get(a);if(!r&&!i.force)try{const t=JSON.parse(localStorage.getItem(a)??"null");if(t&&"object"==typeof t&&"at"in t&&"points"in t&&"number"==typeof t.at&&(null===t.points||Array.isArray(t.points))){const e=t.points?.filter(t=>null!==t&&"object"==typeof t&&"number"==typeof t.detent&&"number"==typeof t.rpm),i=e?ce(e):null;(null===t.points||i)&&(r={at:t.at,points:i?.points??null})}}catch{}if(r&&be(r,s))return ye(a,r),null===r.points?null:{points:r.points};try{n=await async function(t,e,i={}){const s=(i.now??new Date).getTime(),a=s-864e5*(i.days??30),n=i.settleMs??15e3;if(!Number.isFinite(a)||!Number.isFinite(s)||a>=s||!Number.isFinite(n)||n<0)return null;const r=await t.callWS({type:"history/history_during_period",start_time:new Date(a).toISOString(),end_time:new Date(s).toISOString(),entity_ids:[e.fanEntity,e.speedEntity],minimal_response:!1,no_attributes:!1,significant_changes_only:!1}),o=await t.callWS({type:"history/history_during_period",start_time:new Date(a).toISOString(),end_time:new Date(s).toISOString(),entity_ids:[e.rpmEntity],minimal_response:!0,no_attributes:!0,significant_changes_only:!1}),l=[...(r[e.fanEntity]??[]).map(t=>({state:t,fan:!0})),...(r[e.speedEntity]??[]).map(t=>({state:t,fan:!1}))].filter(({state:t})=>Number.isFinite(t.lu)&&1e3*t.lu<=s).sort((t,e)=>t.state.lu-e.state.lu);let c,d={},h=null,p=null;const u=[];for(let t=0;t<l.length;){const i=1e3*l[t].state.lu;do{const e=l[t++];e.fan?(c=e.state.s,void 0!==e.state.a&&(d=e.state.a)):h=ue(e.state.s)}while(t<l.length&&1e3*l[t].state.lu===i);const s="on"===c&&"string"==typeof d.preset_mode&&d.preset_mode.toLowerCase()===e.speedPreset.toLowerCase()?h:null;p&&s!==p.value&&(u.push({...p,end:Math.max(a,i)}),p=null),null===s||p||(p={start:Math.max(a,i),value:s})}p&&u.push({...p,end:s});const m=(o[e.rpmEntity]??[]).filter(t=>Number.isFinite(t.lu)).sort((t,e)=>t.lu-e.lu),v=[],f=new Map;let g=0;for(const t of u){const i=t.start+n,s=ie(e.target,t.value);if(null!==s){for(f.set(s,(f.get(s)??0)+1);g<m.length&&1e3*m[g].lu<i;)g++;for(;g<m.length&&1e3*m[g].lu<=t.end;){const t=ue(m[g++].s);null!==t&&t>0&&v.push({detent:s,rpm:t})}}}const b=new Map;for(const t of v)b.set(t.detent,(b.get(t.detent)??0)+1);return ce(v.filter(({detent:t})=>b.get(t)>=2||1===f.get(t)))}(t,e,i)}catch{n=null}const o={at:s,points:n?.points??null};ye(a,o);try{localStorage.setItem(a,JSON.stringify(o))}catch{}return n})();return ge.set(a,r),r.finally(()=>ge.delete(a)),r},Te.styles=[At,Me,r`
      :host {
        display: block;
        min-width: 0;
        height: 100%;
        container-type: inline-size;
      }
      .tile {
        --mp-wheel-fade: var(--mp-surface-container);
        --mp-tile-radius: var(--mp-shape-chip-square);
        --mp-corner-base: 12px;
        --mp-edge-inline: 16px;
        --mp-corner-optical: 2px;
        --mp-gap-compact: 4px;
        --mp-edge-compact: 8px;
        --mp-wheel-block-inset: 4px;
        /* Equal clearance from the corner arc, not just the straight edges. */
        --mp-corner-inset: max(
          var(--mp-corner-base),
          calc(var(--mp-tile-radius) - (var(--mp-tile-radius) - var(--mp-corner-base)) * 0.7071)
        );
        --mp-corner-inline: max(
          var(--mp-edge-inline),
          calc(var(--mp-corner-inset) + var(--mp-corner-optical))
        );
        display: grid;
        grid-template-columns: minmax(0, 1fr) 56px;
        grid-template-rows: auto auto;
        gap: 8px 12px;
        align-items: start;
        min-height: 136px;
        height: 100%;
        padding: 0 var(--mp-edge-inline) 0 0;
        cursor: default;
      }
      .tile.on {
        --mp-wheel-fade: color-mix(
          in srgb,
          var(--mp-tile-accent, var(--mp-primary)) 16%,
          var(--mp-surface-container)
        );
        --mp-tile-radius: var(--mp-shape-card);
      }
      .tile:hover {
        --mp-wheel-fade: color-mix(in srgb, var(--mp-on-surface) 6%, var(--mp-surface-container));
      }
      .tile:active {
        --mp-wheel-fade: color-mix(in srgb, var(--mp-on-surface) 12%, var(--mp-surface-container));
      }
      .tile.on:hover {
        --mp-wheel-fade: color-mix(
          in srgb,
          var(--mp-tile-accent, var(--mp-primary)) 22%,
          var(--mp-surface-container)
        );
      }
      @media (prefers-reduced-motion: reduce) {
        .tile {
          transition: none;
        }
      }
      .tile,
      .tile.on {
        border-radius: var(--mp-tile-radius);
      }
      .ic {
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        grid-column: 1;
        grid-row: 1;
        margin-top: var(--mp-corner-inset);
        margin-left: var(--mp-corner-inline);
      }
      .ic:focus-visible {
        outline: 2px solid var(--mp-tile-accent, var(--mp-primary));
        outline-offset: 2px;
      }
      .ic:disabled {
        cursor: default;
      }
      .text {
        grid-column: 1;
        grid-row: 2;
        align-self: end;
        padding-left: var(--mp-corner-inline);
        padding-bottom: var(--mp-corner-inset);
        /* The explicit grid track supplies width despite inline-size containment. */
        container-type: inline-size;
      }
      .tile .title {
        font-size: var(--md-sys-typescale-label-medium-size, 12px);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        white-space: normal;
        overflow-wrap: anywhere;
        text-overflow: clip;
      }
      .tile .value {
        font-size: clamp(
          var(--md-sys-typescale-body-large-size, 16px),
          22cqi,
          var(--md-sys-typescale-title-large-size, 22px)
        );
        /* Raw levels and setup guidance can wrap; percentages stay on one line. */
        white-space: normal;
        overflow-wrap: anywhere;
        text-overflow: clip;
      }
      @container (width < 160px) {
        .tile {
          column-gap: var(--mp-edge-compact);
        }
      }
      @container (width < 150px) {
        .tile {
          /* Recover track width without sacrificing corner clearance or the drum. */
          padding-right: var(--mp-edge-compact);
          column-gap: var(--mp-gap-compact);
        }
        .tile .title {
          display: none;
        }
      }
      .tile .value:not(:empty) {
        line-height: 1.2;
      }
      .coverage {
        white-space: nowrap;
      }
      .tile .value.percent {
        white-space: nowrap;
        overflow-wrap: normal;
      }
      .secondary {
        font-size: var(--md-sys-typescale-body-small-size, 12px);
        line-height: 1.2;
        color: var(--mp-on-surface-variant);
      }
      mp-speed-wheel {
        grid-column: 2;
        grid-row: 1 / 3;
        width: 56px;
        height: calc(100% - 2 * var(--mp-wheel-block-inset));
        margin-block: var(--mp-wheel-block-inset);
        min-height: 112px;
        align-self: stretch;
      }
    `],t([ut({attribute:!1})],Te.prototype,"hass",void 0),t([ut({type:String})],Te.prototype,"entity",void 0),t([ut({attribute:!1})],Te.prototype,"config",void 0),t([ut({attribute:!1})],Te.prototype,"cardConfig",void 0),t([ut({type:String})],Te.prototype,"rpmEntity",void 0),t([mt()],Te.prototype,"_optimistic",void 0),t([mt()],Te.prototype,"_optimisticMode",void 0),t([mt()],Te.prototype,"_calibration",void 0),customElements.get("mp-speed-wheel-tile")||customElements.define("mp-speed-wheel-tile",Te);const qe={low:25e4,medium:125e3,high:62500};function Le(t,e="medium"){switch(t?.trim().toLowerCase()){case"low":case"light":return"low";case"medium":case"med":case"moderate":case"normal":return"medium";case"high":case"heavy":return"high";default:return e}}function Ie(t,e,i){return null!==t&&Number.isFinite(t)?null===e||null===i||!Number.isFinite(e)||!Number.isFinite(i)||e<=0||i<=0?null:Math.max(0,t)*e/i:null}function Re(t,e,i,s){if(null!==s&&Number.isFinite(s)&&Number.isFinite(e)){const t=(e-s)/36e5;if(t>=.25&&null!==i&&Number.isFinite(i)&&i>=0)return i/t}const a=t.filter(({start:t,change:e})=>Number.isFinite(t)&&Number.isFinite(e));if(0===a.length)return null;const n=a.reduce((t,e)=>Math.min(t,e.start),1/0),r=(a.reduce((t,e)=>Math.max(t,e.start),-1/0)+36e5-n)/36e5;return r<1?null:a.reduce((t,e)=>t+Math.max(0,e.change),0)/r}class Ue extends ct{constructor(){super(...arguments),this._changes=[],this._asking=!1,this._pending=!1,this._error="",this._lastFetch=-1/0,this._source="",this._generation=0,this._moreInfo=()=>{!this._asking&&this.config.counter_entity&&this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:this.config.counter_entity},bubbles:!0,composed:!0}))},this._restartTimer=()=>{this._asking&&(void 0!==this._timer&&clearTimeout(this._timer),this._timer=setTimeout(this._cancel,1e4))},this._ask=t=>{t.stopPropagation(),this.config.counter_entity&&this.hass&&!this._pending&&null!==this._numericState(this.config.counter_entity)&&(this._asking=!0,this._restartTimer(),this._focusControl(".confirm"))},this._cancel=t=>{t?.stopPropagation(),this._clearConfirmation(),this._focusControl(".reset")},this._keydown=t=>{this._asking&&("Escape"===t.key?(t.preventDefault(),this._cancel(t)):this._restartTimer())},this._markVacuumed=async t=>{t.stopPropagation();const e=this.config.counter_entity,i=this._numericState(e);e&&null!==i&&this.hass&&!this._pending&&this._asking&&(this._clearConfirmation(),await this._service("utility_meter","reset",{entity_id:e}),this._focusControl(".reset"))}}connectedCallback(){super.connectedCallback(),this.requestUpdate()}disconnectedCallback(){super.disconnectedCallback(),this._generation++,this._lastFetch=-1/0,this._clearConfirmation()}updated(){if(!this.isConnected||!this.hass||!this.config)return;const t=this.config.counter_entity,e=t??"";if(e!==this._source&&(this._source=e,this._generation++,this._lastFetch=-1/0,this._changes=[]),!t||null!==Re([],Date.now(),this._numericState(t),this._lastReset)||Date.now()-this._lastFetch<=36e5)return;this._lastFetch=Date.now();const i=++this._generation;(async function(t,e,i=14,s=new Date){try{const a=await t.callWS({type:"recorder/statistics_during_period",start_time:new Date(s.getTime()-864e5*i).toISOString(),statistic_ids:[e],period:"hour",types:["change"]}),n=a?.[e];return Array.isArray(n)?n.filter(t=>"number"==typeof t?.start&&Number.isFinite(t.start)&&"number"==typeof t?.change&&Number.isFinite(t.change)).map(({start:t,change:e})=>({start:t,change:e})):[]}catch{return[]}})(this.hass,t).then(t=>{this.isConnected&&i===this._generation&&(this._changes=t)})}get _level(){if(this.config.dust_level)return Le(this.config.dust_level);const t=this.config.dust_level_entity;return Le(t?this.hass?.states[t]?.state:void 0,"medium")}get _lastReset(){const t=this.config.counter_entity,e=t?this.hass?.states[t]?.attributes.last_reset:void 0;if("string"!=typeof e)return null;const i=Date.parse(e);return Number.isFinite(i)?i:null}_numericState(t){const e=t?this.hass?.states[t]?.state:void 0;if(!e?.trim())return null;const i=Number(e);return Number.isFinite(i)?i:null}_clearConfirmation(){void 0!==this._timer&&clearTimeout(this._timer),this._timer=void 0,this._asking=!1}async _focusControl(t){await this.updateComplete,this.isConnected&&this.shadowRoot?.querySelector(t)?.focus()}async _service(t,e,i){this._pending=!0,this._error="";try{await this.hass.callService(t,e,i)}catch{this._error="Unable to update. Try again."}finally{this._pending=!1}}render(){if(!this.config)return K;const t=this._numericState(this.config.counter_entity),e=this.cardConfig?.cadr??null,i=this.cardConfig?he(this.cardConfig):null,s=Ie(t,e,i),a=null!==s,n=function(t,e){const i=Number.isNaN(t)?0:Math.max(0,t),s=i/e;return{fraction:Math.min(1,Math.max(0,s)),rawFraction:s,remainingM3:Math.max(0,e-i),due:i>=e}}(s??0,function(t,e){const i=e?.[t];return"number"==typeof i&&Number.isFinite(i)&&i>0?i:qe[t]}(this._level,this.config.thresholds)),r=a&&n.due,o=Re(this._changes,Date.now(),t,this._lastReset),l=Ie(null===o?null:24*o,e,i),c=this.config.counter_entity?null===e||!Number.isFinite(e)||e<=0?"Add CADR in card settings":null===i?"Calibrate fan speed in card settings":a?r?"Due now":function(t){if(null===t)return"No estimate yet";if(t<=0)return"Due now";if(t<1)return"Due today";if(t<1.5)return"In 1 day";if(t<14)return`In ${Math.round(t)} days`;if(t<=28)return`In ${Math.round(t/7)} weeks`;const e=Math.max(1,Math.round(t/30.44));return 1===e?"In 1 month":`In ${e} months`}((d=n.remainingM3,null===(h=l)||!Number.isFinite(h)||h<=0?null:d<=0?0:d/h)):"Tracking unavailable":"Set up tracking in the editor";var d,h;const p=this.config.label??"Vacuum filter",u=this._asking,m=r?"var(--mp-error)":this.config.color??"var(--mp-primary)";return H`
      <div
        class="tile ${r?"on due":""} ${u?"asking":""}"
        style=${`--mp-tile-accent: ${m}`}
        @keydown=${this._keydown}
      >
        <button
          class="more-info"
          aria-label=${`${p}: ${c}. Show counter details`}
          ?disabled=${u||!this.config.counter_entity}
          @click=${this._moreInfo}
        ></button>
        <div class="top">
          <div class="ic ring">
            ${B`
              <svg viewBox="0 0 44 44" aria-hidden="true">
                <circle class="track" cx="22" cy="22" r="20" fill="none" stroke-width="4" />
                <circle class="arc" cx="22" cy="22" r="20" fill="none" stroke-width="4"
                  pathLength="1" stroke-dasharray="${n.fraction} 1"
                  stroke-linecap="round" opacity="${a&&n.fraction>0?1:0}"
                  transform="rotate(-90 22 22)" />
              </svg>
            `}
            <ha-icon icon=${this.config.icon??"mdi:vacuum"}></ha-icon>
            ${r?H`<span class="dot badge" aria-hidden="true"></span>`:K}
          </div>
          ${this.config.counter_entity&&!u?H`
                  <button
                    class="reset"
                    aria-label="Mark filter as vacuumed"
                    title="Mark vacuumed"
                    ?disabled=${this._pending||null===t}
                    @click=${this._ask}
                  >
                    <ha-icon icon="mdi:check"></ha-icon>
                  </button>
                `:K}
        </div>
        <div class="text">
          <div class="title" id="vacuum-title">
            ${u?"Did you vacuum the filter?":p}
          </div>
          ${u?H`
                  <div
                    class="actions"
                    role="group"
                    aria-labelledby="vacuum-title"
                    @focusin=${this._restartTimer}
                    @pointerdown=${this._restartTimer}
                  >
                    <button
                      class="segment confirm"
                      aria-label="Yes, I vacuumed the filter"
                      ?disabled=${this._pending||null===t}
                      @click=${this._markVacuumed}
                    >
                      <ha-icon icon="mdi:check"></ha-icon>
                    </button>
                    <button class="segment cancel" aria-label="Cancel" @click=${this._cancel}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                `:H` <div class="value">${c}</div> `}
        </div>
        ${this._error?H`<div class="error" role="alert">${this._error}</div>`:K}
      </div>
    `}}Ue.styles=[At,Me,r`
      :host {
        --mp-vacuum-connected-gap: 2px;
        --mp-vacuum-connected-radius: var(--md-sys-shape-corner-extra-small, 4px);
        --mp-vacuum-action-height: 40px;
        --mp-vacuum-action-min-width: 48px;
        --mp-vacuum-question-gap: 8px;
        display: block;
        min-width: 0;
        height: 100%;
        container-type: inline-size;
        container-name: filter-vacuum;
      }
      .tile {
        position: relative;
        min-height: 136px;
        height: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: 44px auto;
        gap: 0;
        align-items: start;
      }
      .more-info {
        position: absolute;
        inset: 0;
        border: 0;
        background: transparent;
        border-radius: inherit;
        cursor: pointer;
      }
      .top {
        position: relative;
        min-width: 0;
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr);
        align-items: start;
      }
      .tile .text {
        align-self: end;
        container-type: inline-size;
        pointer-events: none;
      }
      .tile .ring {
        position: relative;
        width: 44px;
        height: 44px;
        pointer-events: none;
        background: transparent;
        color: var(--mp-tile-accent);
      }
      .tile .ring ha-icon {
        --mdc-icon-size: 20px;
      }
      .ring svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .track {
        stroke: var(--mp-surface-container-highest);
      }
      .arc {
        stroke: var(--mp-tile-accent);
      }
      .badge {
        position: absolute;
        right: 0;
        top: 0;
        background: var(--mp-error);
      }
      .tile .value {
        font-size: clamp(14px, 13cqi, var(--md-sys-typescale-title-medium-size, 16px));
        white-space: normal;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      .due .value,
      .error {
        color: var(--mp-error);
      }
      .reset {
        position: relative;
        border: 0;
        border-radius: var(--mp-shape-full);
        font: inherit;
      }
      .reset {
        position: absolute;
        top: 0;
        right: 0;
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        background: var(--mp-secondary-container);
        color: var(--mp-on-secondary-container);
        cursor: pointer;
      }
      .reset::after {
        content: '';
        position: absolute;
        inset: -2px;
      }
      .reset ha-icon {
        --mdc-icon-size: 22px;
      }
      .asking .title {
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        line-height: var(--md-sys-typescale-label-large-line-height, 20px);
        font-weight: var(--md-sys-typescale-label-large-weight, 500);
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
      }
      .tile.asking {
        grid-template-rows: minmax(0, 1fr);
        overflow: hidden;
      }
      .asking .top {
        display: none;
      }
      .tile.asking .text {
        align-self: stretch;
        min-height: 0;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: var(--mp-vacuum-question-gap);
      }
      .asking .title {
        align-self: start;
      }
      .asking .actions {
        margin-top: 0;
      }
      .actions {
        position: relative;
        display: grid;
        grid-template-columns: repeat(2, minmax(var(--mp-vacuum-action-min-width), 1fr));
        gap: var(--mp-vacuum-connected-gap);
        margin-top: var(--mp-vacuum-question-gap);
        pointer-events: auto;
      }
      .segment {
        height: var(--mp-vacuum-action-height);
        border: 0;
        padding: 0;
        display: grid;
        place-items: center;
        cursor: pointer;
        background: var(--mp-surface-container-highest);
        color: var(--mp-on-surface);
        border-radius: var(--mp-vacuum-connected-radius) var(--mp-shape-full) var(--mp-shape-full)
          var(--mp-vacuum-connected-radius);
      }
      .segment.confirm {
        background: var(--mp-primary);
        color: var(--mp-on-primary);
        border-radius: var(--mp-shape-full) var(--mp-vacuum-connected-radius)
          var(--mp-vacuum-connected-radius) var(--mp-shape-full);
      }
      .segment ha-icon {
        --mdc-icon-size: 22px;
      }
      button:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .reset:hover,
      .segment:hover {
        filter: brightness(0.95);
      }
      .reset:active,
      .segment:active {
        filter: brightness(0.9);
      }
      button:disabled {
        opacity: 0.5;
        cursor: wait;
      }
      .error {
        pointer-events: none;
        position: relative;
        font-size: var(--md-sys-typescale-label-medium-size, 13px);
        overflow-wrap: anywhere;
      }
      @media (prefers-reduced-motion: reduce) {
        .tile,
        .tile .ic {
          transition: none;
        }
      }
    `],t([ut({attribute:!1})],Ue.prototype,"hass",void 0),t([ut({attribute:!1})],Ue.prototype,"config",void 0),t([ut({attribute:!1})],Ue.prototype,"rpmEntity",void 0),t([ut({attribute:!1})],Ue.prototype,"cardConfig",void 0),t([mt()],Ue.prototype,"_changes",void 0),t([mt()],Ue.prototype,"_asking",void 0),t([mt()],Ue.prototype,"_pending",void 0),t([mt()],Ue.prototype,"_error",void 0),customElements.get("mp-filter-vacuum")||customElements.define("mp-filter-vacuum",Ue);class Ve extends ct{constructor(){super(...arguments),this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entity]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();return Nt(t.attributes.options??[],this.order).filter(t=>!e.get(t)?.hide).map(i=>({value:i,label:e.get(i)?.label??Dt(i),icon:e.get(i)?.icon,active:i===t.state,color:e.get(i)?.color}))}_onSelect(t){if(!this._stateObj)return;const e=this.entity.split(".")[0];"input_select"===e||"select"===e?this.hass.callService(e,"select_option",{entity_id:this.entity,option:t.detail.value}):console.warn(`mp-input-select: unsupported entity domain for ${this.entity}`)}render(){const t=this._build();return t.length?H`<mp-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mp-selector-row>`:K}}t([ut({attribute:!1})],Ve.prototype,"hass",void 0),t([ut()],Ve.prototype,"entity",void 0),t([ut()],Ve.prototype,"display",void 0),t([ut()],Ve.prototype,"label",void 0),t([ut({attribute:!1})],Ve.prototype,"options",void 0),t([ut({attribute:!1})],Ve.prototype,"order",void 0),customElements.get("mp-input-select")||customElements.define("mp-input-select",Ve);class je extends ct{constructor(){super(...arguments),this.entities=[],this.display="icons"}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon,active:"on"===e?.state,disabled:!e||"unavailable"===e.state,color:t.color}})}async _onSelect(t){const e=t.detail.value,i=(this.entities??[]).map(t=>t.entity).filter(t=>t&&t!==e&&"on"===this.hass.states[t]?.state);i.length&&await this.hass.callService("homeassistant","turn_off",{entity_id:i}),await this.hass.callService("homeassistant","turn_on",{entity_id:e})}render(){const t=this._build();return t.length?H`<mp-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mp-selector-row>`:K}}t([ut({attribute:!1})],je.prototype,"hass",void 0),t([ut({attribute:!1})],je.prototype,"entities",void 0),t([ut()],je.prototype,"display",void 0),t([ut()],je.prototype,"label",void 0),customElements.get("mp-switch-group")||customElements.define("mp-switch-group",je);class He extends ct{constructor(){super(...arguments),this.entities=[]}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:toggle-switch-variant",active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}_onSelect(t){this.hass.callService("homeassistant","toggle",{entity_id:t.detail.value})}render(){const t=this._build();return t.length?H`<mp-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mp-selector-row>`:K}}function Be(t,e,i){switch(i.split(".")[0]){case"button":e.callService("button","press",{entity_id:i});break;case"input_button":e.callService("input_button","press",{entity_id:i});break;case"scene":e.callService("scene","turn_on",{entity_id:i});break;case"script":e.callService("script","turn_on",{entity_id:i});break;case"switch":case"light":case"fan":case"input_boolean":e.callService("homeassistant","toggle",{entity_id:i});break;default:yt(t,"hass-more-info",{entityId:i})}}function We(t,e,i,s){const a=s??{action:"default"};switch(a.action){case"none":return;case"more-info":return void yt(t,"hass-more-info",{entityId:a.entity??i});case"toggle":return void e.callService("homeassistant","toggle",{entity_id:i});case"url":return void(a.url_path&&window.open(a.url_path));case"navigate":return void(a.navigation_path&&(window.history.pushState(null,"",a.navigation_path),yt(t,"location-changed",{replace:!1})));case"call-service":case"perform-action":{const t=a.perform_action??a.service;if(!t||!t.includes("."))return;const[i,s]=t.split(".");return void e.callService(i,s,a.data??a.service_data??{},a.target)}default:Be(t,e,i)}}t([ut({attribute:!1})],He.prototype,"hass",void 0),t([ut({attribute:!1})],He.prototype,"entities",void 0),t([ut()],He.prototype,"label",void 0),customElements.get("mp-switch-list")||customElements.define("mp-switch-list",He);class Ke extends ct{constructor(){super(...arguments),this.items=[]}_build(){return(this.items??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:gesture-tap-button",active:!1,disabled:!e||"unavailable"===e.state}})}_onSelect(t){Be(this,this.hass,t.detail.value)}render(){const t=this._build();return t.length?H`<mp-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mp-selector-row>`:K}}t([ut({attribute:!1})],Ke.prototype,"hass",void 0),t([ut({attribute:!1})],Ke.prototype,"items",void 0),t([ut()],Ke.prototype,"label",void 0),customElements.get("mp-button-list")||customElements.define("mp-button-list",Ke);const Qe={sensor:"mdi:gauge",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb",fan:"mdi:fan",button:"mdi:gesture-tap-button",input_button:"mdi:gesture-tap-button",scene:"mdi:palette",script:"mdi:script-text"};class Ye extends ct{constructor(){super(...arguments),this.forceOff=!1,this._tap=()=>{this.config.entity&&We(this,this.hass,this.config.entity,this.config.tap_action)}}get _stateObj(){return this.hass?.states?.[this.config.entity]}get _tileOn(){if(this.forceOff)return!1;const t=this._stateObj;return!!t&&!Ot(t.state)}_secondary(){const t=this._stateObj;if(!t)return;const e=this.config.entity.split(".")[0];if("sensor"===e){const e=t.attributes.unit_of_measurement;return e?`${t.state} ${e}`:t.state}return["switch","light","fan","input_boolean","binary_sensor"].includes(e)?"on"===t.state?"On":"Off":["button","input_button","scene","script"].includes(e)?void 0:t.state}render(){if(!this.config?.entity)return K;const t=this._stateObj,e=this.config.entity.split(".")[0],i=this.config.name??t?.attributes.friendly_name??this.config.entity,s=this.config.icon??t?.attributes.icon??Qe[e]??"mdi:eye",a=this._secondary(),n=this._tileOn;if("icon"===(this.config.display??"tile"))return H`
        <button
          class=${Se({tile:!0,icon:!0,on:n})}
          @click=${this._tap}
          aria-label=${i}
          title=${i}
        >
          <ha-icon icon=${s}></ha-icon>
        </button>
      `;const r=this.config.color?`--mp-tile-accent: ${this.config.color}`:K;return H`
      <button
        class=${Se({tile:!0,on:n})}
        style=${r}
        @click=${this._tap}
        aria-label=${i}
      >
        <div class="ic"><ha-icon icon=${s}></ha-icon></div>
        <div class="text">
          <div class="title">${i}</div>
          ${a?H`<div class="value">${a}</div>`:K}
        </div>
      </button>
    `}}Ye.styles=[At,Me,r`
      :host {
        display: block;
      }
      /* Icon display: a bare centered icon (no circle chip), at the same height
         as the full tile (inherits the shared .tile min-height) so mixed rows
         line up. Width is left to the user's configured column span. Still
         follows the tile roundness/color rules via .tile / .tile.on. */
      .tile.icon {
        justify-content: center;
      }
      .tile.icon:not(.on) {
        color: var(--mp-on-surface-variant);
      }
      .tile.icon ha-icon {
        --mdc-icon-size: 24px;
      }
    `],t([ut({attribute:!1})],Ye.prototype,"hass",void 0),t([ut({attribute:!1})],Ye.prototype,"config",void 0),t([ut({type:Boolean})],Ye.prototype,"forceOff",void 0),customElements.get("mp-entity-tile")||customElements.define("mp-entity-tile",Ye);class Xe extends ct{constructor(){super(...arguments),this.items=[]}_value(t){const e=this.hass?.states?.[t.entity];if(!e||"unknown"===e.state||"unavailable"===e.state)return"—";const i=e.attributes.unit_of_measurement;return i?`${e.state} ${i}`:e.state}render(){const t=(this.items??[]).filter(t=>t.entity);return t.length?H`
      ${this.label?H`<div class="label">${this.label}</div>`:K}
      <div class="card">
        ${t.map(t=>{const e=this.hass?.states?.[t.entity],i=t.label??e?.attributes.friendly_name??t.entity;return H`<div class="row">
            ${t.icon?H`<ha-icon class="icon" icon=${t.icon}></ha-icon>`:K}
            <div class="title" title=${i}>${i}</div>
            <div class="val">${this._value(t)}</div>
          </div>`})}
      </div>
    `:K}}Xe.styles=[At,r`
      :host {
        display: block;
      }
      .label {
        color: var(--mp-on-surface-variant);
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        font-weight: 500;
        padding: 0 4px 6px;
      }
      /* One container for all sensors (à la Google Home), large M3 radius. */
      .card {
        background: var(--mp-surface-container);
        border-radius: var(--mp-shape-card);
        padding: 6px 0;
        overflow: hidden;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
      }
      .icon {
        flex: 0 0 auto;
        /* same height as the text, no circle/padding/outline */
        --mdc-icon-size: 18px;
        color: var(--mp-on-surface-variant);
        display: inline-flex;
        align-items: center;
      }
      .title {
        flex: 1;
        min-width: 0;
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        font-weight: 400;
        color: var(--mp-on-surface-variant);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .val {
        flex: 0 0 auto;
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        font-weight: 700;
        color: var(--mp-on-surface);
        white-space: nowrap;
      }
    `],t([ut({attribute:!1})],Xe.prototype,"hass",void 0),t([ut({attribute:!1})],Xe.prototype,"items",void 0),t([ut()],Xe.prototype,"label",void 0),customElements.get("mp-sensor-list")||customElements.define("mp-sensor-list",Xe);class Je extends ct{constructor(){super(...arguments),this.forceOff=!1,this._tap=()=>{We(this,this.hass,this.config.entity,this.config.tap_action??{action:"more-info"})},this._keydown=t=>{"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),t.repeat||this._tap())}}render(){if(!this.config?.entity)return K;const t=this.hass?.states?.[this.config.entity],e=this.config.attribute?t?.attributes[this.config.attribute]??t?.state:t?.state,i=null==e?NaN:Number.parseFloat(String(e)),s=Number.isFinite(i)?i:null,a=!this.forceOff&&null!==s,n=this.config.min??0,r=this.config.max??100,o=function(t,e=0,i=100){if(null===t||Number.isNaN(t)||i<=e)return null;const s=100*Math.min(1,Math.max(0,(t-e)/(i-e)));return Number.isNaN(s)?null:s}(s,n,r),l=a?function(t,e,i){return null===t||Number.isNaN(t)?i:e?.find((i,s)=>t>=(i.from??-1/0)&&(t<(i.to??1/0)||s===e.length-1&&t===i.to))?.color??i}(s,this.config.ranges,this.config.color??"var(--mp-primary)"):void 0,c=this.config.name??t?.attributes.friendly_name??this.config.entity,d=this.config.icon??t?.attributes.icon??"mdi:gauge",h=t?.attributes.unit_of_measurement??"";let p="—";if(null!==s&&t){const i=this.hass.formatEntityState;let s=i?i.call(this.hass,{...t,state:String(e)}):String(e);h&&s.trimEnd().endsWith(h)&&(s=s.trimEnd().slice(0,-h.length).trimEnd()),p=`${s}${h?" "+h:""}`}const u=a&&null!==o&&o>0?"1":"0";return H`
      <div
        class=${Se({tile:!0,on:a})}
        role="meter"
        tabindex="0"
        aria-label=${c}
        aria-valuemin=${n}
        aria-valuemax=${r}
        aria-valuenow=${null!==s&&null!==o?Math.min(r,Math.max(n,s)):K}
        aria-valuetext=${p}
        style=${kt({"--mp-tile-accent":l})}
        @click=${this._tap}
        @keydown=${this._keydown}
      >
        <div
          class="fill"
          aria-hidden="true"
          style=${kt({width:`${o??0}%`,opacity:u})}
        ></div>
        <div
          class="fade"
          aria-hidden="true"
          style=${kt({left:`${o??0}%`,opacity:u})}
        ></div>
        <div class="ic"><ha-icon icon=${d}></ha-icon></div>
        <div class="text">
          <div class="title">${c}</div>
          <div class="value">${p}</div>
        </div>
      </div>
    `}}Je.styles=[At,Me,r`
      :host {
        display: block;
      }
      .tile {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        --mp-percentage-fill: color-mix(
          in srgb,
          var(--mp-on-surface-variant) 16%,
          var(--mp-surface-container-high)
        );
      }
      .tile.on {
        --mp-percentage-fill: color-mix(
          in srgb,
          var(--mp-tile-accent) 38%,
          var(--mp-surface-container-high)
        );
      }
      .tile.on,
      .tile.on:hover,
      .tile.on:active {
        background: var(--mp-surface-container-high);
      }
      .tile:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .fill,
      .fade {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: -1;
        pointer-events: none;
      }
      .fill {
        left: 0;
        background: var(--mp-percentage-fill);
        transition:
          width 450ms cubic-bezier(0.2, 0, 0, 1),
          opacity 450ms cubic-bezier(0.2, 0, 0, 1),
          background-color 200ms cubic-bezier(0.2, 0, 0, 1);
      }
      .fade {
        width: 10%;
        background: linear-gradient(to right, var(--mp-percentage-fill), transparent);
        transition:
          left 450ms cubic-bezier(0.2, 0, 0, 1),
          opacity 450ms cubic-bezier(0.2, 0, 0, 1);
      }
      @media (prefers-reduced-motion: reduce) {
        .tile,
        .tile .ic,
        .fill,
        .fade {
          transition: none;
        }
      }
    `],t([ut({attribute:!1})],Je.prototype,"hass",void 0),t([ut({attribute:!1})],Je.prototype,"config",void 0),t([ut({type:Boolean})],Je.prototype,"forceOff",void 0),customElements.get("mp-percentage-tile")||customElements.define("mp-percentage-tile",Je);class Ge extends ct{constructor(){super(...arguments),this.parentOff=!1}willUpdate(t){var e;t.has("feature")&&this.feature&&(this.style.gridColumn=`span ${e=Mt(this.feature),Math.max(1,Math.min(10,Math.round(e/10)))}`)}render(){const t=this.feature;if(!t)return K;switch(t.type){case"percentage-tile":return H`<mp-percentage-tile
          .hass=${this.hass}
          .config=${t}
          .forceOff=${this.parentOff}
        ></mp-percentage-tile>`;case"fan-presets":return H`<mp-fan-presets
          .hass=${this.hass}
          .entity=${this.entity}
          .config=${t}
        ></mp-fan-presets>`;case"speed-wheel":return H`<mp-speed-wheel-tile
          .hass=${this.hass}
          .entity=${this.entity}
          .config=${t}
          .cardConfig=${this.cardConfig}
          .rpmEntity=${this.rpmEntity}
        ></mp-speed-wheel-tile>`;case"filter-vacuum":return H`<mp-filter-vacuum
          .hass=${this.hass}
          .config=${t}
          .rpmEntity=${this.rpmEntity}
          .cardConfig=${this.cardConfig}
        ></mp-filter-vacuum>`;case"input-select":return H`<mp-input-select
          .hass=${this.hass}
          .entity=${t.entity}
          .display=${t.display??"icons"}
          .label=${t.label}
          .options=${t.options}
          .order=${t.order}
        ></mp-input-select>`;case"switch-group":return H`<mp-switch-group
          .hass=${this.hass}
          .entities=${t.entities}
          .display=${t.display??"icons"}
          .label=${t.label}
        ></mp-switch-group>`;case"switch-list":return H`<mp-switch-list
          .hass=${this.hass}
          .entities=${t.entities}
          .label=${t.label}
        ></mp-switch-list>`;case"button-list":return H`<mp-button-list
          .hass=${this.hass}
          .items=${t.items}
          .label=${t.label}
        ></mp-button-list>`;case"entity-tile":return H`<mp-entity-tile
          .hass=${this.hass}
          .config=${t}
          .forceOff=${this.parentOff}
        ></mp-entity-tile>`;case"sensor-list":return H`<mp-sensor-list
          .hass=${this.hass}
          .items=${t.items}
          .label=${t.label}
        ></mp-sensor-list>`;default:return H`<div class="error">
          Unknown feature: ${t.type}
        </div>`}}}Ge.styles=r`
    :host {
      display: block;
      min-width: 0;
    }
    .error {
      color: var(--mp-error);
      font-size: var(--md-sys-typescale-body-small-size, small);
      font-weight: var(--md-sys-typescale-body-small-weight, normal);
      line-height: var(--md-sys-typescale-body-small-line-height, normal);
      overflow-wrap: anywhere;
    }
  `,t([ut({attribute:!1})],Ge.prototype,"hass",void 0),t([ut()],Ge.prototype,"entity",void 0),t([ut({attribute:!1})],Ge.prototype,"feature",void 0),t([ut({attribute:!1})],Ge.prototype,"cardConfig",void 0),t([ut()],Ge.prototype,"rpmEntity",void 0),t([ut({type:Boolean})],Ge.prototype,"parentOff",void 0),customElements.get("mp-feature-row")||customElements.define("mp-feature-row",Ge);class Ze extends ct{constructor(){super(...arguments),this._metric="us_aqi",this._widthPx=0}setConfig(t){if(!t||"string"!=typeof t.entity||!t.entity.startsWith("fan."))throw new Error("Specify a fan entity");this._config={...t,features:t.features??[]};const e=Qt(t.aqi),i=!0===t.aqi?.allow_cycle?function(t,e){try{const e=localStorage.getItem(Zt(t));if("us_aqi"===e||"cn_aqi"===e||"pm25"===e)return e}catch{}return e}(t.entity,e):e;this._metric="pm25"===i?i:Yt("pm25",t.aqi)}getCardSize(){return 7+(this._config?.features?.length??0)-(!1===this._config?.show_name?1:0)}getGridOptions(){return{columns:12,rows:"auto",min_columns:6}}static async getConfigElement(){return await Promise.resolve().then(function(){return qi}),document.createElement("material-purifier-card-editor")}static getStubConfig(t){return{type:`custom:${Et}`,entity:Object.keys(t.states).find(t=>t.startsWith("fan."))??"",features:[{type:"fan-presets",display:"tile"},{type:"speed-wheel"}]}}_trackedEntityIds(t){const e=this._config,i=new Set([e.entity]),s=t=>{t&&i.add(t)};s(e.aqi?.entity),s(Xt(t,e.entity,e.aqi).entity),s(e.motor_speed_entity??Kt(t,e.entity));const a=te(e);s(a.entity),s(se(t,e.entity,a).entity);for(const t of e.features??[])"entity"in t&&s(t.entity),"entities"in t&&t.entities.forEach(t=>s(t.entity)),"items"in t&&t.items.forEach(t=>s(t.entity)),"counter_entity"in t&&s(t.counter_entity),"dust_level_entity"in t&&s(t.dust_level_entity);return i}shouldUpdate(t){if(t.has("_config")||t.has("_metric")||t.has("_widthPx"))return!0;if(!this._config||!this.hass)return!1;if(t.has("hass")){const e=t.get("hass");if(!e||this._config.theme&&e.themes!==this.hass.themes)return!0;const i=this._config;return Xt(e,i.entity,i.aqi).entity!==Xt(this.hass,i.entity,i.aqi).entity||((i.motor_speed_entity??Kt(e,i.entity))!==(i.motor_speed_entity??Kt(this.hass,i.entity))||[...new Set([...this._trackedEntityIds(e),...this._trackedEntityIds(this.hass)])].some(t=>e.states[t]!==this.hass.states[t]))}return!1}updated(t){if(this._config?.theme&&this.hass&&(t.has("hass")||t.has("_config"))){const e=t.get("hass");e&&e.themes===this.hass.themes&&!t.has("_config")||function(t,e,i,s){void 0===s&&(s=!1),t._themes||(t._themes={});var a=e.default_theme;("default"===i||i&&e.themes[i])&&(a=i);var n=bt({},t._themes);if("default"!==a){var r=e.themes[a];Object.keys(r).forEach(function(e){var i="--"+e;t._themes[i]="",n[i]=r[e]})}if(t.updateStyles?t.updateStyles(n):window.ShadyCSS&&window.ShadyCSS.styleSubtree(t,n),s){var o=document.querySelector("meta[name=theme-color]");if(o){o.hasAttribute("default-content")||o.setAttribute("default-content",o.getAttribute("content"));var l=n["--primary-color"]||o.getAttribute("default-content");o.setAttribute("content",l)}}}(this,this.hass.themes,this._config.theme)}}connectedCallback(){super.connectedCallback(),this._resizeObserver||"undefined"==typeof ResizeObserver||(this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width??0,i=Math.max(0,e-32);Math.abs(i-this._widthPx)>=1&&(this._widthPx=i)}),this._resizeObserver.observe(this))}disconnectedCallback(){super.disconnectedCallback(),this._resizeObserver?.disconnect(),this._resizeObserver=void 0}_featureWidthPct(t){return Mt(t)}_layout(){const t=this._config?.features??[],e=t.length?Math.max(...t.map(t=>this._featureWidthPct(t))):St,i=this._widthPx*(100-e)/100;return t.length>0&&e<St&&this._widthPx>=560&&i>=240?{wide:!0,dialStyle:{flex:"1 1 auto"},featureStyle:{flex:`0 0 ${e}%`},gridCols:Math.max(1,e/10)}:{wide:!1,dialStyle:{},featureStyle:{},gridCols:10}}_cycleMetric(){this._config&&!0===this._config.aqi?.allow_cycle&&(this._metric=Yt(this._metric,this._config.aqi),function(t,e){try{localStorage.setItem(Zt(t),e)}catch{}}(this._config.entity,this._metric))}_cycleMode(){if(!this._config||!this.hass)return;const t=this.hass.states[this._config.entity];if(!t||"unavailable"===t.state)return;const e=t.attributes.preset_modes??[];if(e.length<2)return;const i=e[(e.indexOf(t.attributes.preset_mode)+1)%e.length];this.hass.callService("fan","set_preset_mode",{entity_id:this._config.entity,preset_mode:i})}_togglePower(){if(!this._config||!this.hass)return;const t=this.hass.states[this._config.entity];t&&"unavailable"!==t.state&&this.hass.callService("fan","on"===t.state?"turn_off":"turn_on",{entity_id:this._config.entity})}render(){if(!this._config||!this.hass)return H``;const t=this._config,e=this.hass.states[t.entity],i=!!e&&"unavailable"!==e.state,s="on"===e?.state,a=Xt(this.hass,t.entity,t.aqi),n=Jt(a,this._metric,t.aqi?.us_breakpoints??"2024"),r=null===a.value?null:Rt(a.value,a.source,"pm25",t.aqi?.us_breakpoints??"2024"),o=t.motor_speed_entity??Kt(this.hass,t.entity),l=te(t),c=se(this.hass,t.entity,l),d=he(t),h=e?.attributes.percentage,p=(null===d?null:function(t,e,i=2200){const s=Gt(t,e);return null===s||i<=0?null:Math.min(1,Math.max(0,s/i))}(this.hass,o,d))??function(t){const e=t.value;return null===e||t.max<=t.min?null:Math.min(1,Math.max(0,(e-t.min)/(t.max-t.min)))}(c)??("number"==typeof h&&Number.isFinite(h)?h/100:null),u=[],m=e?.attributes.preset_mode,v="string"==typeof m?m:void 0;"string"==typeof m&&m&&u.push(Dt(m));const f=ae(e,l),g="fan_percentage"===c.kind||null===f||"string"==typeof m&&m.toLowerCase()===f.toLowerCase();"none"!==c.kind&&null!==c.value&&g&&u.push(oe(c,c.value,l.display??"percent"));const b=Gt(this.hass,o);null!==b&&b>0&&u.push(`${Math.round(b).toLocaleString()} rpm`);const y=i?s?u.join(" · ")||"On":"Off":"Unavailable",_=t.name??e?.attributes.friendly_name??t.entity,w=this._layout();return H`
      <ha-card aria-label=${!1===t.show_name?_:K}>
        ${!1===t.show_name?K:H`<div class="header"><div class="name" title=${_}>${_}</div></div>`}
        <div class=${"body "+(w.wide?"wide":"stacked")}>
          <div class="dial-wrap" style=${kt(w.dialStyle)}>
            <mp-purifier-dial
              .value=${null===n.value?null:n.text}
              .density=${r}
              .unit=${Ht(this._metric)}
              .category=${n.level?.label??(a.entity?"No reading":"No air quality sensor")}
              .color=${function(t){if(null===t||Number.isNaN(t))return null;const e=Math.floor(10*Math.max(0,t))/10;return Ft.find(({max:t})=>e<=t)?.color??null}(r)??"var(--mp-outline)"}
              .running=${s}
              .available=${i}
              .speedFraction=${p}
              .status=${y}
              .allowCycle=${!0===t.aqi?.allow_cycle}
              .disabled=${!i}
              .modeAvailable=${i&&(e?.attributes.preset_modes?.length??0)>=2}
              .modeIcon=${v?Pt(v):"mdi:fan-auto"}
              .modeLabel=${`Mode: ${Dt(v??"none")}. Change mode`}
              @mode-cycle=${this._cycleMode}
              @metric-cycle=${this._cycleMetric}
              @power-toggle=${this._togglePower}
            ></mp-purifier-dial>
          </div>
          ${t.features?.length?H`<div
                  class="features"
                  style=${kt({...w.featureStyle,gridTemplateColumns:`repeat(${w.gridCols}, minmax(0, 1fr))`})}
                >
                  ${t.features.map(e=>H`<mp-feature-row
                        .hass=${this.hass}
                        .entity=${t.entity}
                        .feature=${e}
                        .cardConfig=${t}
                        .rpmEntity=${o}
                        .parentOff=${!s}
                      ></mp-feature-row>`)}
                </div>`:K}
        </div>
      </ha-card>
    `}}Ze.styles=[At,r`
      :host {
        display: block;
      }
      ha-card {
        padding: 16px;
        border-radius: var(--ha-card-border-radius, var(--mp-radius-card, var(--mp-shape-card)));
        overflow: visible;
      }
      .header {
        display: grid;
        align-items: center;
        min-height: 36px;
        min-width: 0;
      }
      .name {
        text-align: left;
        font-size: var(--md-sys-typescale-title-large-size, 20px);
        color: var(--mp-on-surface);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .body {
        display: flex;
        margin-top: 8px;
      }
      ha-card[aria-label] > .body {
        margin-top: 0;
      }
      .body.stacked {
        flex-direction: column;
        gap: 12px;
      }
      .body.wide {
        flex-direction: row;
        align-items: center;
        gap: 16px;
      }
      .dial-wrap {
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        min-width: 0;
      }
      mp-purifier-dial {
        width: 100%;
        max-width: ${320}px;
      }
      .features {
        box-sizing: border-box;
        display: grid;
        align-content: flex-start;
        align-items: start;
        gap: 12px;
        min-width: 0;
      }
    `],t([ut({attribute:!1})],Ze.prototype,"hass",void 0),t([mt()],Ze.prototype,"_config",void 0),t([mt()],Ze.prototype,"_metric",void 0),t([mt()],Ze.prototype,"_widthPx",void 0),customElements.get(Et)||customElements.define(Et,Ze),console.info(`%c ${Ct} %c v1.0.1 `,"color: white; background: #6750a4; font-weight: bold;","color: #6750a4; background: #eaddff;");const ti=window;function ei(t){if(void 0===t||""===t.trim())return null;const e=Number(t);return Number.isFinite(e)?e:null}function ii(t){if(!t.length)return null;const e=[...t].sort((t,e)=>t-e),i=Math.floor(e.length/2);return e.length%2?e[i]:(e[i-1]+e[i])/2}ti.customCards=ti.customCards??[],ti.customCards.push({type:Et,name:Ct,description:"A Material 3 Expressive air purifier card with an animated AQI dial, a scroll-wheel fan speed knob and configurable tiles.",preview:!0,documentationURL:"https://github.com/lageorgem/ha-material-purifier-card"});class si extends ct{constructor(){super(...arguments),this.items=[],this.value="",this.placeholder="Search…",this.allowCustom=!1,this.customPrefix="",this._query=""}firstUpdated(){this._searchInput?.focus()}_filtered(){const t=this._query.trim().toLowerCase();return t?this.items.filter(e=>e.value.toLowerCase().includes(t)||e.primary.toLowerCase().includes(t)||(e.secondary?.toLowerCase().includes(t)??!1)||(e.keywords?.some(e=>e.toLowerCase().includes(t))??!1)).slice(0,50):this.items.slice(0,50)}_customValue(){const t=this._query.trim();return this.customPrefix&&!t.includes(":")?this.customPrefix+t:t}_pick(t){this.dispatchEvent(new CustomEvent("pick",{detail:{value:t},bubbles:!0,composed:!0}))}_onKey(t){"Escape"===t.key?(t.stopPropagation(),this.dispatchEvent(new CustomEvent("dismiss",{bubbles:!0,composed:!0}))):"Enter"===t.key&&this.allowCustom&&this._query.trim()&&this._pick(this._customValue())}render(){const t=this._filtered(),e=this._customValue(),i=this.allowCustom&&this._query.trim().length>0&&!t.some(t=>t.value===e);return H`
      <input
        class="search"
        type="text"
        placeholder=${this.placeholder}
        .value=${this._query}
        @input=${t=>this._query=t.target.value}
        @keydown=${this._onKey}
      />
      <div class="results" role="listbox">
        ${t.map(t=>H`<button
              type="button"
              class=${Se({opt:!0,active:t.value===this.value})}
              role="option"
              @click=${()=>this._pick(t.value)}
            >
              ${t.icon?H`<ha-icon icon=${t.icon}></ha-icon>`:K}
              <span class="opt-text">
                <span class="opt-name">${t.primary}</span>
                ${t.secondary?H`<span class="opt-sub">${t.secondary}</span>`:K}
              </span>
            </button>`)}
        ${i?H`<button type="button" class="opt custom" @click=${()=>this._pick(e)}>
                <ha-icon icon=${this.customPrefix?e:"mdi:plus"}></ha-icon>
                <span class="opt-text"><span class="opt-name">Use “${e}”</span></span>
              </button>`:K}
        ${0!==t.length||i?K:H`<div class="empty">No matches</div>`}
      </div>
    `}}si.styles=r`
    :host {
      display: block;
    }
    .search {
      width: 100%;
      box-sizing: border-box;
      height: 38px;
      padding: 0 12px;
      margin-bottom: 6px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container, var(--card-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      font: inherit;
      font-size: 14px;
      outline: none;
    }
    .search:focus {
      border-color: var(--md-sys-color-primary, var(--primary-color));
    }
    .results {
      max-height: 240px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .opt {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      border-radius: 10px;
      cursor: pointer;
      font: inherit;
      text-align: left;
    }
    .opt:hover {
      background: color-mix(in srgb, currentColor 8%, transparent);
    }
    .opt.active {
      background: var(--md-sys-color-secondary-container, rgba(127, 127, 127, 0.18));
    }
    .opt ha-icon {
      --mdc-icon-size: 20px;
      flex: 0 0 auto;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .opt-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .opt-name {
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .opt-sub {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty {
      padding: 10px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      font-size: 13px;
      text-align: center;
    }
  `,t([ut({attribute:!1})],si.prototype,"items",void 0),t([ut()],si.prototype,"value",void 0),t([ut()],si.prototype,"placeholder",void 0),t([ut({type:Boolean})],si.prototype,"allowCustom",void 0),t([ut()],si.prototype,"customPrefix",void 0),t([mt()],si.prototype,"_query",void 0),t([vt(".search")],si.prototype,"_searchInput",void 0),customElements.get("mp-search-panel")||customElements.define("mp-search-panel",si);const ai={sensor:"mdi:gauge",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb",fan:"mdi:fan",input_boolean:"mdi:toggle-switch",input_select:"mdi:format-list-bulleted",button:"mdi:gesture-tap-button",input_button:"mdi:gesture-tap-button",scene:"mdi:palette",script:"mdi:script-text",climate:"mdi:thermostat"};class ni extends ct{constructor(){super(...arguments),this.value="",this.label="Entity",this.allowCustom=!1,this._open=!1,this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick)}_iconFor(t,e){return e??ai[t.split(".")[0]]??"mdi:tag"}_items(){const t=this.hass?.states??{};return Object.keys(t).filter(t=>!this.includeDomains||this.includeDomains.includes(t.split(".")[0])).map(e=>{const i=t[e].attributes;return{value:e,primary:i.friendly_name??e,secondary:e,icon:this._iconFor(e,i.icon)}}).sort((t,e)=>t.primary.localeCompare(e.primary))}_selected(){if(!this.value)return;const t=this.hass?.states?.[this.value]?.attributes;return{name:t?.friendly_name??this.value,icon:this._iconFor(this.value,t?.icon)}}_toggle(t){t.stopPropagation(),this._open=!this._open}_onPick(t){this._open=!1,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}render(){const t=this._selected();return H`
      <button
        type="button"
        class=${Se({trigger:!0,open:this._open})}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        ${t?H`<ha-icon class="lead" icon=${t.icon}></ha-icon>
                <span class="text">${t.name}</span>`:H`<span class="text muted">${this.label}</span>`}
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${this._open?H`<div class="panel">
              <mp-search-panel
                .items=${this._items()}
                .value=${this.value}
                .allowCustom=${this.allowCustom}
                placeholder="Search entities…"
                @pick=${this._onPick}
                @dismiss=${()=>this._open=!1}
              ></mp-search-panel>
            </div>`:K}
    `}}ni.styles=r`
    :host {
      display: block;
      position: relative;
    }
    .trigger {
      width: 100%;
      box-sizing: border-box;
      height: 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px 0 14px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      -webkit-tap-highlight-color: transparent;
    }
    .trigger .lead {
      --mdc-icon-size: 20px;
      flex: 0 0 auto;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .trigger .text {
      flex: 1;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .trigger .text.muted {
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .trigger .chev {
      flex: 0 0 auto;
      --mdc-icon-size: 20px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    .trigger.open .chev {
      transform: rotate(180deg);
    }
    .panel {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      padding: 8px;
      box-sizing: border-box;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
    }
  `,t([ut({attribute:!1})],ni.prototype,"hass",void 0),t([ut()],ni.prototype,"value",void 0),t([ut()],ni.prototype,"label",void 0),t([ut({attribute:!1})],ni.prototype,"includeDomains",void 0),t([ut({type:Boolean})],ni.prototype,"allowCustom",void 0),t([mt()],ni.prototype,"_open",void 0),customElements.get("mp-entity-picker")||customElements.define("mp-entity-picker",ni);const ri=t=>t??K;class oi extends ct{constructor(){super(...arguments),this.value="",this.label="",this.type="text",this.flatLeft=!1}_onInput(t){const e=t.target.value;this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:!0,composed:!0}))}render(){return H`<input
      type=${this.type}
      class=${Se({"flat-left":this.flatLeft})}
      .value=${this.value??""}
      placeholder=${this.placeholder??this.label}
      min=${ri("number"===this.type?this.min:void 0)}
      max=${ri("number"===this.type?this.max:void 0)}
      step=${ri("number"===this.type?this.step:void 0)}
      aria-label=${this.label}
      @input=${this._onInput}
    />`}}oi.styles=r`
    :host {
      display: block;
      min-width: 0;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      height: 40px;
      padding: 0 14px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      font: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    input::placeholder {
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    input[type='number'] {
      appearance: textfield;
      -moz-appearance: textfield;
    }
    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input:focus {
      border-color: var(--md-sys-color-primary, var(--primary-color));
    }
    /* Attach seamlessly to a control on the left (e.g. the color pill). */
    input.flat-left {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-left: none;
    }
  `,t([ut()],oi.prototype,"value",void 0),t([ut()],oi.prototype,"label",void 0),t([ut()],oi.prototype,"type",void 0),t([ut()],oi.prototype,"placeholder",void 0),t([ut()],oi.prototype,"min",void 0),t([ut()],oi.prototype,"max",void 0),t([ut()],oi.prototype,"step",void 0),t([ut({type:Boolean})],oi.prototype,"flatLeft",void 0),customElements.get("mp-text-field")||customElements.define("mp-text-field",oi);class li extends ct{constructor(){super(...arguments),this.label="",this.options=[],this.disabled=!1,this._open=!1,this._active=-1,this._outsideClick=t=>{this._open&&!t.composedPath().includes(this)&&this._close()}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._outsideClick)}disconnectedCallback(){document.removeEventListener("click",this._outsideClick),this._open=!1,super.disconnectedCallback()}willUpdate(t){this.disabled&&(this._open=!1),(t.has("options")||t.has("value"))&&(this._active=this.options.findIndex(t=>t.value===this.value),this._active<0&&this.options.length&&(this._active=0))}updated(){this._open&&this._active>=0&&this.shadowRoot?.getElementById(`option-${this._active}`)?.scrollIntoView({block:"nearest"})}_focus(){this.shadowRoot?.querySelector(".trigger")?.focus()}_close(){this._open=!1,this._focus()}_show(){if(this.disabled)return;const t=this.options.findIndex(t=>t.value===this.value);this._active=t>=0?t:this.options.length?0:-1,this._open=!0,this._focus()}_toggle(){this.disabled||(this._open?this._close():this._show())}_select(t){const e=this.options[t];!this.disabled&&e&&(this.value=e.value,this._close(),this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e.value},bubbles:!0,composed:!0})))}_keydown(t){if(this.disabled)return;const e=t.key;"Tab"!==e?["Enter"," ","ArrowDown","ArrowUp","Escape","Home","End"].includes(e)&&(this._open?(t.preventDefault(),"Escape"===e?this._close():"Enter"===e||" "===e?this._select(this._active):this.options.length&&(this._active="Home"===e?0:"End"===e?this.options.length-1:(this._active+("ArrowDown"===e?1:-1)+this.options.length)%this.options.length)):["Enter"," ","ArrowDown"].includes(e)&&(t.preventDefault(),this._show())):this._open=!1}render(){const t=this.options.find(t=>t.value===this.value);return H`
      <div class="field">
        <button
          id="field"
          type="button"
          class=${Se({trigger:!0,open:this._open})}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${String(this._open)}
          aria-controls="menu"
          aria-label=${this.label}
          aria-describedby=${this.helper?"helper":K}
          aria-activedescendant=${this._open&&this._active>=0?`option-${this._active}`:K}
          ?disabled=${this.disabled}
          @click=${this._toggle}
          @keydown=${this._keydown}
        >
          <span class=${Se({text:!0,muted:!t})}
            >${t?.label??this.placeholder??this.label}</span
          >
          <ha-icon class="chev" icon="mdi:chevron-down" aria-hidden="true"></ha-icon>
        </button>
        ${this._open?H`<div id="menu" class="menu" role="listbox" aria-label=${this.label}>
                ${this.options.map((t,e)=>H`<button
                      type="button"
                      tabindex="-1"
                      id=${`option-${e}`}
                      role="option"
                      aria-selected=${String(t.value===this.value)}
                      class=${Se({opt:!0,selected:t.value===this.value,active:e===this._active})}
                      @mousedown=${t=>t.preventDefault()}
                      @click=${()=>this._select(e)}
                      @keydown=${this._keydown}
                    >
                      <span class="text">${t.label}</span>
                      ${t.value===this.value?H`<ha-icon class="check" icon="mdi:check" aria-hidden="true"></ha-icon>`:K}
                    </button>`)}
                ${this.options.length?K:H`<div class="empty" role="status">No options available</div>`}
              </div>`:K}
      </div>
      ${this.helper?H`<div id="helper" class="helper">${this.helper}</div>`:K}
    `}}let ci;function di(){return ci||(ci=(async()=>{if(customElements.get("ha-form")&&customElements.get("ha-entity-picker")&&customElements.get("ha-icon-picker"))return;const t=window.loadCardHelpers;if(t)try{const e=await t(),i=await e.createCardElement({type:"entities",entities:[]}),s=i?.constructor;s?.getConfigElement&&await s.getConfigElement()}catch{}})(),ci)}li.styles=[At,r`
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .field {
        position: relative;
      }
      .trigger {
        width: 100%;
        box-sizing: border-box;
        height: 40px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px 0 14px;
        border-radius: var(--md-sys-shape-corner-full, 9999px);
        border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
        background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
        color: var(--md-sys-color-on-surface, var(--primary-text-color));
        cursor: pointer;
        font: inherit;
        font-size: 14px;
        -webkit-tap-highlight-color: transparent;
      }
      .trigger:focus {
        outline: none;
        border-color: var(--md-sys-color-primary, var(--primary-color));
      }
      .trigger:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .trigger:hover:not(:disabled) {
        border-color: var(--mp-primary);
      }
      .trigger:active:not(:disabled) {
        border-color: var(--mp-primary);
      }
      .trigger:disabled {
        cursor: not-allowed;
        opacity: 0.38;
      }
      .text {
        flex: 1;
        min-width: 0;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .muted,
      .chev {
        color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      }
      .chev {
        flex: 0 0 auto;
        --mdc-icon-size: 20px;
        transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
      }
      .open .chev {
        transform: rotate(180deg);
      }
      .menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        z-index: 30;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 6px;
        box-sizing: border-box;
        max-height: 280px;
        overflow-y: auto;
        background: var(--mp-surface-container-high);
        border-radius: var(--mp-shape-chip-square);
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.2);
      }
      .opt {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 44px;
        padding: 10px 12px;
        box-sizing: border-box;
        border: none;
        background: transparent;
        color: var(--mp-on-surface);
        border-radius: var(--mp-shape-full);
        cursor: pointer;
        font: inherit;
        text-align: left;
      }
      .opt:hover,
      .opt.active {
        background: color-mix(in srgb, var(--mp-on-surface) 8%, transparent);
      }
      .opt.selected {
        background: var(--mp-secondary-container);
        color: var(--mp-on-secondary-container);
      }
      .opt.active {
        outline: 2px solid var(--mp-primary);
        outline-offset: -2px;
      }
      .check {
        --mdc-icon-size: 20px;
        flex: 0 0 auto;
        color: var(--mp-on-secondary-container);
      }
      .helper,
      .empty {
        padding: 6px 14px;
        color: var(--mp-on-surface-variant);
        font-size: var(--md-sys-typescale-body-small-size, 12px);
        overflow-wrap: anywhere;
      }
      @media (prefers-reduced-motion: reduce) {
        .chev {
          transition: none;
        }
      }
    `],t([ut()],li.prototype,"label",void 0),t([ut()],li.prototype,"value",void 0),t([ut({attribute:!1})],li.prototype,"options",void 0),t([ut()],li.prototype,"placeholder",void 0),t([ut({type:Boolean})],li.prototype,"disabled",void 0),t([ut()],li.prototype,"helper",void 0),t([mt()],li.prototype,"_open",void 0),t([mt()],li.prototype,"_active",void 0),customElements.get("mp-select-field")||customElements.define("mp-select-field",li);const hi=[{value:"icons",label:"Icons",icon:"mdi:dots-grid"},{value:"dropdown",label:"Dropdown",icon:"mdi:form-dropdown"},{value:"tile",label:"Tile",icon:"mdi:card-text-outline"}];class pi extends ct{constructor(){super(...arguments),this.value="icons",this.options=hi}_set(t){t!==this.value&&this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return H`
      <div class="seg">
        ${this.options.map(t=>H`<button
              class=${this.value===t.value?"on":""}
              @click=${()=>this._set(t.value)}
            >
              <ha-icon icon=${t.icon}></ha-icon><span>${t.label}</span>
            </button>`)}
      </div>
    `}}pi.styles=r`
    .seg {
      display: inline-flex;
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      overflow: hidden;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: 14px;
    }
    button + button {
      border-left: 1px solid var(--divider-color);
    }
    button.on {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    ha-icon {
      --mdc-icon-size: 18px;
    }
  `,t([ut()],pi.prototype,"value",void 0),t([ut({attribute:!1})],pi.prototype,"options",void 0),customElements.get("mp-display-toggle")||customElements.define("mp-display-toggle",pi);const ui=new Set(["ArrowRight","ArrowUp","ArrowLeft","ArrowDown","PageUp","PageDown","Home","End"]);class mi extends ct{constructor(){super(...arguments),this.disabled=!1,this.step=1,this.min=1,this.max=4,this.tooltipMode="interaction",this._pressed=!1,this._tooltipVisible=!1,this._onPointerDown=t=>{this.disabled||(t.preventDefault(),this._slider.setPointerCapture(t.pointerId),this._pressed=!0,this._tooltipVisible=!0,this.value=this._range*this._pctFromX(t.clientX))},this._onPointerMove=t=>{this._pressed&&!this.disabled&&(this.value=this._range*this._pctFromX(t.clientX),this._emit("slider-moved",this._stepped(this._bounded(this.value))))},this._onPointerUp=t=>{this._pressed&&(this._slider.releasePointerCapture(t.pointerId),this._pressed=!1,this._tooltipVisible=!1,this.value=this._stepped(this._bounded(this._range*this._pctFromX(t.clientX))),this._emit("value-changed",this.value))},this._onKeyDown=t=>{if(this.disabled||!ui.has(t.key))return;t.preventDefault();const e=this.value??this.min;switch(t.key){case"ArrowRight":case"ArrowUp":this.value=this._bounded(e+this.step);break;case"ArrowLeft":case"ArrowDown":this.value=this._bounded(e-this.step);break;case"PageUp":this.value=this._stepped(this._bounded(e+this._bigStep));break;case"PageDown":this.value=this._stepped(this._bounded(e-this._bigStep));break;case"Home":this.value=this.min;break;case"End":this.value=this.max}this._emit("value-changed",this.value)}}get _range(){return this.range??this.max}_bounded(t){return Math.min(Math.max(t,this.min),this.max)}_stepped(t){return Math.round(t/this.step)*this.step}_valueToPct(t){return this._bounded(t)/this._range}_pctFromX(t){const e=this._slider.getBoundingClientRect();return Math.max(0,Math.min(1,(t-e.left)/e.width))}updated(t){if(t.has("value")){const t=this._stepped(this.value??0).toString();this.setAttribute("aria-valuenow",t),this.setAttribute("aria-valuetext",t)}t.has("min")&&this.setAttribute("aria-valuemin",this.min.toString()),t.has("max")&&this.setAttribute("aria-valuemax",this.max.toString())}connectedCallback(){super.connectedCallback(),this.setAttribute("role","slider"),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.setAttribute("aria-orientation","horizontal"),this.addEventListener("keydown",this._onKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._onKeyDown)}get _bigStep(){return Math.max(this.step,(this.max-this.min)/10)}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:{value:e},bubbles:!0,composed:!0}))}_renderTooltip(){if("never"===this.tooltipMode)return K;const t="always"===this.tooltipMode||this._tooltipVisible&&"interaction"===this.tooltipMode,e=this._bounded(this._stepped(this.value??0));return H`<span aria-hidden="true" class=${Se({tooltip:!0,visible:t})}
      >${e}</span
    >`}render(){const t=Math.round(this._range/this.step);return H`
      <div
        class=${Se({container:!0,pressed:this._pressed})}
        style=${kt({"--value":`${this._valueToPct(this.value??0)}`})}
      >
        <div
          id="slider"
          class="slider"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
        >
          <div class="track">
            <div class="background"></div>
            <div
              class="active"
              style=${kt({"--min":""+this.min/this._range,"--max":""+(1-this.max/this._range)})}
            ></div>
          </div>
          ${Array(t).fill(0).map((e,i)=>0===i?K:H`<div class="dot" style=${kt({"--value":""+i/t})}></div>`)}
          ${void 0!==this.value?H`<div class="handle"></div>`:K}
          ${this._renderTooltip()}
        </div>
      </div>
    `}}mi.styles=r`
    :host {
      display: block;
      height: 36px;
      width: 100%;
      outline: none;
    }
    /* Keyboard focus: a soft ring on the handle only — NOT a box around the whole
       control, which read as a stray colored band over the editor background. */
    :host(:focus-visible) .handle::after {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 45%, transparent);
    }
    .container {
      position: relative;
      height: 100%;
      width: 100%;
    }
    .slider {
      position: relative;
      height: 100%;
      width: 100%;
      transform: translateZ(0);
      overflow: visible;
      cursor: pointer;
      touch-action: pan-y;
    }
    .slider * {
      pointer-events: none;
      user-select: none;
    }
    .track {
      position: absolute;
      inset: 0;
      margin: auto;
      height: 16px;
      width: 100%;
      border-radius: var(--ha-border-radius-md, 8px);
      overflow: hidden;
    }
    /* The unfilled track is transparent so it reads as the surrounding surface
       (the editor's feature panel) rather than a stray tinted band. */
    .background {
      position: absolute;
      inset: 0;
      background: transparent;
    }
    .active {
      position: absolute;
      background: var(--primary-color, #6750a4);
      border-radius: var(--ha-border-radius-md, 8px);
      top: 0;
      right: calc(var(--max) * 100%);
      bottom: 0;
      left: calc(var(--min) * 100%);
    }
    .handle {
      position: absolute;
      top: 0;
      height: 100%;
      width: 16px;
      transform: translate(-50%, 0);
      background: var(--card-background-color, #1c1b22);
      left: calc(var(--value, 0) * 100%);
      transition: left 180ms ease-in-out;
    }
    .handle::after {
      position: absolute;
      inset: 0;
      width: 4px;
      border-radius: 2px;
      height: 100%;
      margin: auto;
      background: var(--primary-color, #6750a4);
      content: '';
    }
    .dot {
      position: absolute;
      top: 0;
      bottom: 0;
      opacity: 0.6;
      margin: auto;
      width: 4px;
      height: 4px;
      flex-shrink: 0;
      transform: translate(-50%, 0);
      background: var(--card-background-color, #1c1b22);
      left: calc(var(--value, 0) * 100%);
      border-radius: 2px;
    }
    :host([disabled]) .slider {
      cursor: not-allowed;
    }
    :host([disabled]) .track {
      opacity: 0.5;
    }
    :host([disabled]) .handle::after,
    :host([disabled]) .active {
      background: var(--disabled-color, #bdbdbd);
    }
    .tooltip {
      position: absolute;
      top: 0;
      left: calc(min(max(var(--value) * 100%, 0%), 100%));
      transform: translate3d(-50%, calc(-100% - 4px), 0);
      background-color: var(--clear-background-color, var(--card-background-color, #2b2933));
      color: var(--primary-text-color, #e6e1e9);
      font-size: var(--control-slider-tooltip-font-size, 14px);
      border-radius: var(--ha-border-radius-lg, 12px);
      padding: 0.2em 0.4em;
      opacity: 0;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      transition:
        opacity 180ms ease-in-out,
        left 180ms ease-in-out;
    }
    .tooltip.visible {
      opacity: 1;
    }
    .pressed .handle {
      transition: none;
    }
  `,t([ut({type:Boolean,reflect:!0})],mi.prototype,"disabled",void 0),t([ut({type:Number})],mi.prototype,"value",void 0),t([ut({type:Number})],mi.prototype,"step",void 0),t([ut({type:Number})],mi.prototype,"min",void 0),t([ut({type:Number})],mi.prototype,"max",void 0),t([ut({type:Number})],mi.prototype,"range",void 0),t([ut({attribute:"tooltip-mode"})],mi.prototype,"tooltipMode",void 0),t([mt()],mi.prototype,"_pressed",void 0),t([mt()],mi.prototype,"_tooltipVisible",void 0),t([vt("#slider")],mi.prototype,"_slider",void 0),customElements.get("mp-grid-slider")||customElements.define("mp-grid-slider",mi);class vi extends ct{constructor(){super(...arguments),this.default=St}_emit(t){this.dispatchEvent(new CustomEvent("width-changed",{detail:{value:t},bubbles:!0,composed:!0}))}_onChanged(t){const e=t.detail?.value;this._emit("number"==typeof e?e:void 0)}_reset(){null!=this.value&&this._emit(void 0)}render(){const t=null!=this.value,e=this.value??this.default;return H`
      <div class="label">Width (% of card)</div>
      <div class="control">
        <button
          class="reset"
          aria-label="Reset width to full"
          title="Reset to full width"
          ?disabled=${!t}
          @click=${this._reset}
        >
          <ha-icon icon="mdi:restore"></ha-icon>
        </button>
        <mp-grid-slider
          .value=${e}
          .min=${10}
          .max=${St}
          .step=${10}
          tooltip-mode="always"
          @value-changed=${this._onChanged}
        ></mp-grid-slider>
      </div>
      ${t?K:H`<div class="hint">
              Default — ${this.default===St?"full width":`${this.default}%`}.
            </div>`}
    `}}vi.styles=r`
    :host {
      display: block;
    }
    .label {
      color: var(--secondary-text-color);
      font-size: 0.85rem;
      margin-bottom: 4px;
    }
    .control {
      display: flex;
      align-items: center;
      gap: 8px;
      /* room above the slider for the floating value tooltip */
      padding-top: 20px;
    }
    .reset {
      flex: 0 0 auto;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: grid;
      place-items: center;
      -webkit-tap-highlight-color: transparent;
    }
    .reset:hover:not([disabled]) {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
    }
    .reset[disabled] {
      opacity: 0.38;
      cursor: default;
    }
    .reset ha-icon {
      --mdc-icon-size: 20px;
    }
    mp-grid-slider {
      flex: 1 1 auto;
      min-width: 0;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 0.78rem;
      margin-top: 4px;
    }
  `,t([ut({attribute:!1})],vi.prototype,"hass",void 0),t([ut({type:Number})],vi.prototype,"value",void 0),t([ut({type:Number})],vi.prototype,"default",void 0),customElements.get("mp-width-field")||customElements.define("mp-width-field",vi);const fi=["thermostat","thermostat-auto","thermometer","snowflake","snowflake-variant","sun-snowflake-variant","fire","water-percent","air-conditioner","air-filter","air-humidifier","air-purifier","heat-pump","radiator","radiator-disabled","fan","fan-auto","fan-off","fan-plus","fan-minus","fan-speed-1","fan-speed-2","fan-speed-3","fan-chevron-up","fan-chevron-down","leaf","sofa","sofa-outline","bed","sleep","power-sleep","home","home-outline","home-thermometer","home-automation","home-export-outline","run-fast","rocket-launch","cancel","snowman","sun-thermometer","snowflake-thermometer","coolant-temperature","weather-sunny","weather-night","weather-cloudy","weather-partly-cloudy","weather-rainy","weather-pouring","weather-snowy","weather-windy","weather-fog","weather-lightning","weather-hail","weather-sunset","white-balance-sunny","umbrella","power","flash","lightning-bolt","battery","solar-power","transmission-tower","ev-station","gauge","speedometer","meter-electric","lightbulb","lightbulb-group","ceiling-light","floor-lamp","lamp","led-strip","led-on","brightness-5","brightness-6","palette","door","door-open","garage","garage-variant","gate","window-closed","window-open","blinds","curtains","fence","television","speaker","music","volume-high","play","pause","stop","motion-sensor","smoke-detector","fire-alert","water","water-alert","valve","pump","eye","eye-off","lock","lock-open","bell","alarm","fridge","stove","microwave","dishwasher","washing-machine","tumble-dryer","robot-vacuum","vacuum","broom","shower","bathtub","toilet","water-boiler","grill","pool","tree","flower","sprout","watering-can","sprinkler","car","tune","tune-variant","cog","sync","refresh","restart","arrow-up","arrow-down","arrow-left","arrow-right","arrow-all","arrow-up-down","arrow-left-right","swap-vertical","account","account-group","calendar","clock","clock-outline","timer-outline","molecule","blur","star","heart","flag","map-marker","tag"];let gi;class bi extends ct{constructor(){super(...arguments),this.label="Icon",this._open=!1,this._alignRight=!1,this._icons=[],this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)}}get _none(){return""===this.value}get _custom(){return!!this.value}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick)}_emit(t){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:!0,composed:!0}))}_hostBounds(){const t=this.getRootNode().host;return t?t.getBoundingClientRect():null}_toggle(t){if(t.stopPropagation(),!this._open){const t=this.getBoundingClientRect(),e=this._hostBounds(),i=e?(e.left+e.right)/2:window.innerWidth/2;this._alignRight=t.left+t.width/2>i}this._open=!this._open,this._open&&0===this._icons.length&&async function(){if(gi)return gi;const t=fi.map(t=>({value:`mdi:${t}`,primary:`mdi:${t}`,icon:`mdi:${t}`,keywords:t.split("-")})),e=window.customIcons;if(e)for(const i of Object.keys(e)){const s=e[i]?.getIconList;if("function"==typeof s)try{const e=await s();for(const s of e)t.push({value:`${i}:${s.name}`,primary:`${i}:${s.name}`,icon:`${i}:${s.name}`,keywords:s.keywords})}catch{}}return gi=t,gi}().then(t=>{this._icons=t})}_toggleNone(t){t.stopPropagation(),this._open=!1,this._emit(this._none?void 0:"")}_onPick(t){this._open=!1,this._emit(t.detail.value)}render(){const t=this._none,e=this._custom,i=e?this.value:this.defaultIcon??"mdi:image-plus";return H`
      <div class="pill">
        <button
          type="button"
          class=${Se({seg:!0,icon:!0,active:e,preview:!e})}
          aria-haspopup="listbox"
          aria-expanded=${this._open?"true":"false"}
          title=${this.label}
          @click=${this._toggle}
        >
          <ha-icon icon=${i}></ha-icon>
        </button>
        <button
          type="button"
          class=${Se({seg:!0,cancel:!0,active:t})}
          aria-pressed=${t?"true":"false"}
          title=${t?"No icon — click to use the default":"No icon"}
          @click=${this._toggleNone}
        >
          <ha-icon icon="mdi:cancel"></ha-icon>
        </button>
      </div>
      ${this._open?H`<div class=${Se({panel:!0,right:this._alignRight})}>
              <mp-search-panel
                .items=${this._icons}
                .value=${this.value||""}
                .allowCustom=${!0}
                customPrefix="mdi:"
                placeholder="Search icons…"
                @pick=${this._onPick}
                @dismiss=${()=>this._open=!1}
              ></mp-search-panel>
            </div>`:K}
    `}}bi.styles=r`
    :host {
      display: inline-block;
      position: relative;
    }
    .pill {
      display: inline-flex;
      height: 40px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      overflow: hidden;
    }
    .seg {
      width: 40px;
      height: 100%;
      padding: 0;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background-color 150ms cubic-bezier(0.2, 0, 0, 1),
        color 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    .seg + .seg {
      border-left: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
    }
    .seg:hover {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    .seg.active {
      background: var(--md-sys-color-primary, var(--primary-color));
      color: var(--md-sys-color-on-primary, var(--text-primary-color, #fff));
    }
    /* The faded "this is just the default / add an icon" preview. */
    .seg.icon.preview:not(.active) ha-icon {
      opacity: 0.5;
    }
    .seg ha-icon {
      --mdc-icon-size: 20px;
    }
    /* Rounded search panel anchored under the pill (matches mp-entity-picker). */
    .panel {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      width: 256px;
      box-sizing: border-box;
      padding: 8px;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
    }
    /* Anchored to the right edge of the pill so it grows leftward (used near the
       viewport's right edge to avoid horizontal overflow/scroll). */
    .panel.right {
      left: auto;
      right: 0;
    }
  `,t([ut({attribute:!1})],bi.prototype,"hass",void 0),t([ut()],bi.prototype,"value",void 0),t([ut()],bi.prototype,"label",void 0),t([ut()],bi.prototype,"defaultIcon",void 0),t([mt()],bi.prototype,"_open",void 0),t([mt()],bi.prototype,"_alignRight",void 0),t([mt()],bi.prototype,"_icons",void 0),customElements.get("mp-icon-field")||customElements.define("mp-icon-field",bi);class yi extends ct{constructor(){super(...arguments),this.defaultColor="var(--md-sys-color-primary, var(--primary-color, #6750a4))",this.label="Color",this.attached=!1,this._open=!1,this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick)}_emit(t){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:!0,composed:!0}))}_toggle(t){t.stopPropagation(),this._open=!this._open}_onInput(t){t.stopPropagation(),this._emit(t.target.value)}_reset(t){t.stopPropagation(),this._open=!1,this._emit(void 0)}_resolveHex(){if(this.value)return this.value;const t=document.createElement("span");t.style.color=this.defaultColor,this.shadowRoot.appendChild(t);const e=getComputedStyle(t).color;t.remove();const i=e.match(/\d+/g);return i?"#"+i.slice(0,3).map(t=>Number(t).toString(16).padStart(2,"0")).join(""):"#000000"}render(){return H`
      <button
        type="button"
        class="swatch"
        style=${`--swatch-color: ${this.value??this.defaultColor}`}
        aria-haspopup="dialog"
        aria-expanded=${this._open?"true":"false"}
        title=${this.label}
        @click=${this._toggle}
      ></button>
      ${this._open?H`<div class="popover" role="dialog">
              <input
                type="color"
                aria-label=${this.label}
                .value=${this._resolveHex()}
                @input=${this._onInput}
              />
              ${this.value?H`<button type="button" class="reset" @click=${this._reset}>
                      Reset to default
                    </button>`:K}
            </div>`:K}
    `}}yi.styles=r`
    :host {
      --color-field-height: 40px;
      --color-field-width: 56px;
      --color-field-inset: 4px;
      display: inline-flex;
      position: relative;
      flex-shrink: 0;
    }
    .swatch {
      position: relative;
      box-sizing: border-box;
      width: var(--color-field-width);
      height: var(--color-field-height);
      padding: 0;
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .swatch::before {
      content: '';
      position: absolute;
      inset: var(--color-field-inset);
      border-radius: inherit;
      background: var(--swatch-color);
      pointer-events: none;
    }
    /* MpTextField.flatLeft has no left border: retain ours as the single seam. */
    :host([attached]) .swatch {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    .popover {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      /* Fixed width so the color preview fills a proper rectangle — otherwise,
         with no reset button (default color), a percentage-width input collapses
         to a sliver inside a shrink-to-fit popover and shows no visible color. */
      width: 180px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
    }
    .popover input[type='color'] {
      width: 100%;
      height: 44px;
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 10px;
      background: none;
      cursor: pointer;
      padding: 2px;
    }
    .reset {
      border: none;
      background: transparent;
      color: var(--md-sys-color-primary, var(--primary-color));
      cursor: pointer;
      font: inherit;
      font-size: 13px;
      padding: 4px;
      border-radius: 8px;
    }
    .reset:hover {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
  `,t([ut()],yi.prototype,"value",void 0),t([ut()],yi.prototype,"defaultColor",void 0),t([ut()],yi.prototype,"label",void 0),t([ut({type:Boolean,reflect:!0})],yi.prototype,"attached",void 0),t([mt()],yi.prototype,"_open",void 0),customElements.get("mp-color-field")||customElements.define("mp-color-field",yi);const _i=async function(t,e){let i,s,a;try{const n=await t.callApi("POST","config/config_entries/flow",{handler:"integration"});if(!n.flow_id)throw new Error("Integration setup did not return a flow id");const r=`config/config_entries/flow/${n.flow_id}`,o=await t.callApi("POST",r,{name:`${e.name} motor runtime`,source:e.rpmEntity,unit_time:"h",method:"left",round:2,max_sub_interval:{hours:0,minutes:5,seconds:0}});if("form"===o.type){try{await t.callApi("DELETE",r)}catch{}throw new Error(`Integration setup failed: ${Object.entries(o.errors??{}).map(([t,e])=>`${t}: ${e}`).join(", ")||"unexpected form"}`)}if(s=o.result?.entry_id,"create_entry"!==o.type||!s)throw new Error("Integration setup did not create an entry");for(let e=0;e<10;e++){const a=await t.callWS({type:"config/entity_registry/list"});if(i=a.find(t=>t.config_entry_id===s&&t.entity_id.startsWith("sensor."))?.entity_id,i)break;e<9&&await new Promise(t=>setTimeout(t,300))}if(!i)throw new Error("Created integration sensor is not yet in the entity registry");const l=await t.callApi("POST","config/config_entries/flow",{handler:"utility_meter"});if(!l.flow_id)throw new Error("Utility Meter setup did not return a flow id");const c=`config/config_entries/flow/${l.flow_id}`,d=await t.callApi("POST",c,{name:`${e.name} runtime since vacuum`,source:i,cycle:"none",offset:0,tariffs:[],net_consumption:!1,delta_values:!1,periodically_resetting:!1,always_available:!0});if("form"===d.type){try{await t.callApi("DELETE",c)}catch{}throw new Error(`Utility Meter setup failed: ${Object.entries(d.errors??{}).map(([t,e])=>`${t}: ${e}`).join(", ")||"unexpected form"}`)}const h=d.result?.entry_id;if("create_entry"!==d.type||!h)throw new Error("Utility Meter setup did not create an entry");for(let e=0;e<10;e++){const i=await t.callWS({type:"config/entity_registry/list"});if(a=i.find(t=>t.config_entry_id===h&&t.entity_id.startsWith("sensor."))?.entity_id,a)break;e<9&&await new Promise(t=>setTimeout(t,300))}if(!a)throw new Error("Created utility meter sensor is not yet in the entity registry");return await t.callService("utility_meter","reset",{entity_id:a}),{runtimeEntity:i,counterEntity:a}}catch(t){const e=function(t){const e=t;return[e?.status,e?.status_code,e?.code].some(t=>401===t||403===t||"401"===t||"403"===t||"unauthorized"===t||"forbidden"===t)?new Error("Setting up tracking needs an administrator account"):t instanceof Error?t:new Error(String(t))}(t),n=i??(s?`integration entry ${s}`:void 0);if(n)throw new Error(`${e.message}. Already created ${n}${a?` and ${a}`:""}; these helpers were not deleted.`);throw e}};class wi extends ct{constructor(){super(...arguments),this.fanEntity="",this.rpmEntity="",this._settingUp=!1,this._setupError="",this._rangeDrafts=[],this._computeLabel=t=>"show_off"===t.name?"Show Off option":t.name}willUpdate(t){t.has("feature")&&this.feature!==this._emittedFeature&&(this._rangeDrafts="percentage-tile"===this.feature?.type?(this.feature.ranges??[]).map(t=>({...t})):[])}connectedCallback(){super.connectedCallback(),di().then(()=>this.requestUpdate())}_emit(t){const e={...this.feature,...t};for(const[i,s]of Object.entries(t))void 0===s&&delete e[i];if("speed-wheel"===e.type&&(e.entity||delete e.entity,""===e.preset&&delete e.preset,"percent"===e.display&&delete e.display,!1!==e.estimate_auto&&delete e.estimate_auto,!1!==e.show_coverage&&delete e.show_coverage),"percentage-tile"===e.type){for(const t of["attribute","name","icon","color","min","max","width"])""!==e[t]&&void 0!==e[t]||delete e[t];const t=this._rangeDrafts.filter(t=>t.color.trim()).map(t=>({...t}));t.length?e.ranges=t:delete e.ranges,this._emittedFeature=e,this.feature=e}this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:e},bubbles:!0,composed:!0}))}_values(){const t=this.hass?.states?.[this.fanEntity]?.attributes.preset_modes;return Array.isArray(t)?t.filter(t=>"string"==typeof t):[]}_orderedValues(){return Nt([...this._values()],"fan-presets"===this.feature.type?this.feature.order:void 0)}_moveOption(t){t.stopPropagation();const e=this._orderedValues(),{oldIndex:i,newIndex:s}=t.detail;if(!Number.isInteger(i)||!Number.isInteger(s)||i<0||s<0||i>=e.length||s>=e.length)return;const[a]=e.splice(i,1);e.splice(s,0,a),this._emit({order:e})}_setOverride(t,e){if("fan-presets"!==this.feature.type)return;const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),a={...s>=0?i[s]:{value:t},...e};a.label||delete a.label,void 0===a.icon&&delete a.icon,a.color||delete a.color,a.hide||delete a.hide;const n=Object.keys(a).some(t=>"value"!==t);s>=0?n?i[s]=a:i.splice(s,1):n&&i.push(a),this._emit({options:i})}_formChanged(t){t.stopPropagation();const e={},i={..."filter-vacuum"===this.feature.type?this.feature.thresholds:void 0};let s=!1;for(const[a,n]of Object.entries(t.detail.value)){const t=""===n||null==n;if(a.startsWith("threshold_")){const e=a.slice(10);s=!0,t?delete i[e]:"number"==typeof n&&Number.isFinite(n)&&n>0&&(i[e]=n)}else e[a]=t?void 0:n}s&&(e.thresholds=Object.keys(i).length?i:void 0),this._emit(e)}_thresholdChanged(t,e){if("filter-vacuum"!==this.feature.type)return;const i=e.target.shadowRoot.querySelector("input");if(!i.checkValidity())return;const s={...this.feature.thresholds};""===i.value?delete s[t]:s[t]=i.valueAsNumber,this._emit({thresholds:Object.keys(s).length?s:void 0})}async _setupTracking(){if(this._settingUp||!this.rpmEntity||"filter-vacuum"!==this.feature.type)return;const t=this.feature;this._settingUp=!0,this._setupError="";try{const e=this.hass.states[this.fanEntity]?.attributes.friendly_name,i=await _i(this.hass,{rpmEntity:this.rpmEntity,name:"string"==typeof e?e:this.fanEntity});if(!this.isConnected||this.feature!==t)return;this._emit({counter_entity:i.counterEntity}),this.feature={...t,counter_entity:i.counterEntity}}catch{this.feature===t&&(this._setupError="Could not set up tracking. Check your connection and permissions, then try again.")}finally{this._settingUp=!1}}_renderSpeed(t){return H`
      <div class="field-column">
        <span class="field-label">Speed entity</span>
        <mp-entity-picker
          .hass=${this.hass}
          .value=${t.entity??""}
          label="Speed entity"
          .includeDomains=${["number","input_number"]}
          .allowCustom=${!0}
          @value-changed=${t=>this._emit({entity:t.detail.value||void 0})}
        ></mp-entity-picker>
        <p class="hint">Leave empty to use the fan's percentage</p>
      </div>
      <div class="short-row">
        <div class="field-column short-field">
          <span class="field-label">Preset</span>
          <mp-select-field
            label="Preset"
            .value=${!1===t.preset?"none":t.preset?`preset:${t.preset}`:""}
            .options=${[{value:"",label:"Auto-detect"},{value:"none",label:"None"},...this._values().map(t=>({value:`preset:${t}`,label:t}))]}
            @value-changed=${t=>this._emit({preset:"none"!==t.detail.value&&(t.detail.value?t.detail.value.slice(7):void 0)})}
          ></mp-select-field>
        </div>
        <div class="field-column short-field">
          <span class="field-label">Display</span>
          <mp-select-field
            label="Display"
            .value=${t.display??"percent"}
            .options=${[{value:"percent",label:"Percent"},{value:"level",label:"Level"}]}
            @value-changed=${t=>this._emit({display:"level"===t.detail.value?"level":void 0})}
          ></mp-select-field>
        </div>
      </div>
      ${["estimate_auto","show_coverage"].map(e=>H`
          <div class="field-column">
            <span class="field-label"
              >${"estimate_auto"===e?"Show live speed in Auto":"Show room coverage"}</span
            >
            <label class="toggle">
              <input
                type="checkbox"
                data-field=${e}
                .checked=${!1!==t[e]}
                @change=${t=>this._emit({[e]:!!t.target.checked&&void 0})}
              />
              ${"estimate_auto"===e?"Show live speed in Auto":"Show room coverage"}
            </label>
          </div>
        `)}
      ${void 0===this.cardConfig?.cadr?H`<p class="hint">Needs CADR in card settings</p>`:K}
    `}_renderTracking(t){return t.counter_entity?H`
          <p class="hint" role="status">Counting motor runtime since the last vacuum</p>
          <details>
            <summary>Advanced</summary>
            <div class="editor">
              <div class="field-column">
                <span class="field-label">Tracking counter</span>
                <mp-entity-picker
                  .hass=${this.hass}
                  .value=${t.counter_entity}
                  label="Counter entity"
                  .includeDomains=${["sensor"]}
                  .allowCustom=${!0}
                  @value-changed=${t=>this._emit({counter_entity:t.detail.value||void 0})}
                ></mp-entity-picker>
                <p class="hint">
                  Utility Meter (no cycle) over an Integration of the motor speed sensor
                </p>
              </div>
            </div>
          </details>
        `:H`
          <button
            type="button"
            class="setup-tracking"
            ?disabled=${!this.rpmEntity||this._settingUp}
            aria-describedby="tracking-status"
            @click=${this._setupTracking}
          >
            Set up tracking
          </button>
          <p id="tracking-status" class="hint" role="status">
            ${this._settingUp?"Setting up tracking…":this.rpmEntity?"":"Choose a motor speed sensor in card settings"}
          </p>
          ${this._setupError?H`<p class="hint" role="alert">${this._setupError}</p>`:K}
        `}render(){if(!this.feature)return H``;const t=this.feature;return"percentage-tile"===t.type?this._renderPercentage(t):H`<div class="editor">
      ${"filter-vacuum"===t.type?H`
              <div class="vacuum-info" role="note">
                <ha-icon icon="mdi:information-outline" aria-hidden="true"></ha-icon>
                <div>
                  <div class="vacuum-info-title">What this tracks</div>
                  <p>
                    Dust and hair collect on the outer mesh of the purifier's cylindrical filter.
                    Vacuuming it regularly keeps air flowing and the filter working longer. This
                    tile counts how much air has passed through since you last vacuumed it and tells
                    you when it's time again. Tap ✓ on the tile after vacuuming to start a new
                    count.
                  </p>
                </div>
              </div>
            `:K}
      <div class="field-column">
        <span class="field-label">Title</span>
        <mp-text-field
          label="Title (optional)"
          .value=${t.label??""}
          @value-changed=${t=>this._emit({label:t.detail.value||void 0})}
        ></mp-text-field>
      </div>
      ${"fan-presets"===t.type?H`
              <div class="field-column">
                <span class="field-label">Display</span>
                <mp-display-toggle
                  .value=${t.display??"tile"}
                  @value-changed=${t=>this._emit({display:t.detail.value})}
                ></mp-display-toggle>
              </div>
              <div class="field-column">
                <span class="field-label">Show Off option</span>
                <ha-form
                  .hass=${this.hass}
                  .data=${{show_off:t.show_off??!1}}
                  .schema=${[{name:"show_off",selector:{boolean:{}}}]}
                  .computeLabel=${this._computeLabel}
                  @value-changed=${this._formChanged}
                ></ha-form>
              </div>
            `:K}
      ${"speed-wheel"===t.type?this._renderSpeed(t):K}
      ${"filter-vacuum"===t.type?H`${this._renderTracking(t)}
              <div class="field-column">
                <span class="field-label">Household dust level</span>
                <mp-select-field
                  label="Household dust level"
                  .value=${t.dust_level??(t.dust_level_entity?void 0:"medium")}
                  .options=${["low","medium","high"].map(t=>({value:t,label:Dt(t)}))}
                  @value-changed=${t=>this._emit({dust_level:t.detail.value||void 0})}
                ></mp-select-field>
              </div>
              <div class="field-column">
                <span class="field-label">Air filtered between vacuums</span>
                <p class="hint">
                  How many m³ of air the purifier can clean before the pre-filter needs vacuuming.
                  The household dust level picks which one applies.
                </p>
                <div class="thresholds">
                  ${["low","medium","high"].map(e=>H`
                      <div class="field-column">
                        <span class="field-label">${Dt(e)} dust (m³)</span>
                        <mp-text-field
                          type="number"
                          label=${`${Dt(e)} threshold (m³)`}
                          min="1"
                          step="any"
                          data-level=${e}
                          placeholder=${String(qe[e])}
                          .value=${void 0===t.thresholds?.[e]?"":String(t.thresholds[e])}
                          @value-changed=${t=>this._thresholdChanged(e,t)}
                        ></mp-text-field>
                      </div>
                    `)}
                </div>
                <p class="hint">
                  Leave empty to use the defaults shown. Medium is about 2 months of mostly-Auto use
                  on a 360 m³/h purifier.
                </p>
              </div>
              <div class="field-column">
                <span class="field-label">Dust level helper (optional)</span>
                <mp-entity-picker
                  .hass=${this.hass}
                  .value=${t.dust_level_entity??""}
                  label="Dust level entity"
                  .includeDomains=${["input_select","select"]}
                  .allowCustom=${!0}
                  @value-changed=${t=>this._emit({dust_level_entity:t.detail.value||void 0})}
                ></mp-entity-picker>
                <p class="hint">
                  Optional: read the level from a helper when no dust level is set (read-only)
                </p>
              </div>`:K}
      ${"fan-presets"!==t.type?H`<div class="appearance-row">
              <div class="field-column">
                <span class="field-label">Icon</span>
                <mp-icon-field
                  .hass=${this.hass}
                  .value=${t.icon}
                  .defaultIcon=${"speed-wheel"===t.type?"mdi:fan":"mdi:vacuum"}
                  @value-changed=${t=>this._emit({icon:t.detail.value})}
                ></mp-icon-field>
              </div>
              <div class="field-column">
                <span class="field-label">Color</span>
                <mp-color-field
                  .value=${t.color}
                  @value-changed=${t=>this._emit({color:t.detail.value||void 0})}
                ></mp-color-field>
              </div>
            </div>`:K}
      <div class="field-column">
        <span class="field-label">Width</span>
        <mp-width-field
          .hass=${this.hass}
          .value=${t.width}
          .default=${"fan-presets"===t.type?St:50}
          @width-changed=${t=>this._emit({width:t.detail.value})}
        ></mp-width-field>
      </div>
      ${"fan-presets"===t.type?this._renderOptions():K}
    </div>`}_percentageNumber(t,e){const i=e.target.shadowRoot.querySelector("input");i.checkValidity()&&this._emit({[t]:""===i.value?void 0:i.valueAsNumber})}_rangeChanged(t,e){this._rangeDrafts=this._rangeDrafts.map((i,s)=>{if(s!==t)return i;const a={...i,...e};return void 0===a.from&&delete a.from,void 0===a.to&&delete a.to,a}),this._emit({})}_renderPercentage(t){return H`<div class="editor">
      <div class="field-column">
        <span class="field-label">Entity</span>
        <mp-entity-picker
          .hass=${this.hass}
          .value=${t.entity}
          label="Entity"
          .includeDomains=${["sensor","number","input_number"]}
          .allowCustom=${!0}
          @value-changed=${t=>this._emit({entity:t.detail.value})}
        ></mp-entity-picker>
      </div>
      <div class="short-row">
        ${["attribute","name"].map(e=>H`<div class="field-column short-field">
              <span class="field-label">${"name"===e?"Name":"Attribute (optional)"}</span>
              <mp-text-field
                label=${"name"===e?"Name":"Attribute"}
                .value=${t[e]??""}
                @value-changed=${t=>this._emit({[e]:t.detail.value||void 0})}
              ></mp-text-field>
            </div>`)}
      </div>
      <div class="appearance-row">
        <div class="field-column">
          <span class="field-label">Icon</span>
          <mp-icon-field
            .hass=${this.hass}
            .value=${t.icon}
            .defaultIcon=${"mdi:gauge"}
            @value-changed=${t=>this._emit({icon:t.detail.value||void 0})}
          ></mp-icon-field>
        </div>
        <div class="field-column">
          <span class="field-label">Color</span>
          <mp-color-field
            .value=${t.color}
            label="Fallback color"
            @value-changed=${t=>this._emit({color:t.detail.value||void 0})}
          ></mp-color-field>
        </div>
      </div>
      <div class="thresholds">
        ${["min","max"].map(e=>H`<div class="field-column">
              <span class="field-label">${"min"===e?"Min":"Max"}</span>
              <mp-text-field
                type="number"
                label=${"min"===e?"Min":"Max"}
                step="any"
                data-field=${e}
                placeholder=${"min"===e?"0":"100"}
                .value=${void 0===t[e]?"":String(t[e])}
                @value-changed=${t=>this._percentageNumber(e,t)}
              ></mp-text-field>
            </div>`)}
      </div>
      <div class="field-label">Color ranges</div>
      <div class="ranges">
        <div class="range-header"><span>From</span><span>To</span><span>Color</span></div>
        ${this._rangeDrafts.length?K:H`<p class="hint">No ranges. The fallback color applies.</p>`}
        ${this._rangeDrafts.map((t,e)=>H`<div class="range">
              ${["from","to"].map(i=>H`<mp-text-field
                    label=${"from"===i?"From":"To"}
                    placeholder="—"
                    type="number"
                    step="any"
                    data-field=${i}
                    .value=${void 0===t[i]?"":String(t[i])}
                    @value-changed=${t=>{const s=t.target.shadowRoot.querySelector("input");s.checkValidity()&&this._rangeChanged(e,{[i]:""===s.value?void 0:s.valueAsNumber})}}
                  ></mp-text-field>`)}
              <mp-color-field
                label="Color"
                .value=${t.color}
                @value-changed=${t=>this._rangeChanged(e,{color:t.detail.value||""})}
              ></mp-color-field>
              <button
                class="opt-hide"
                type="button"
                aria-label="Remove range"
                @click=${()=>{this._rangeDrafts=this._rangeDrafts.filter((t,i)=>i!==e),this._emit({})}}
              >
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>`)}
      </div>
      <button
        class="add-range"
        type="button"
        aria-label="Add range"
        @click=${()=>{this._rangeDrafts=[...this._rangeDrafts,{color:""}]}}
      >
        Add range
      </button>
      <div class="field-column">
        <span class="field-label">Width</span>
        <mp-width-field
          .hass=${this.hass}
          .value=${t.width}
          .default=${50}
          @width-changed=${t=>this._emit({width:t.detail.value})}
        ></mp-width-field>
      </div>
    </div>`}_renderOptions(){return this._values().length?H`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
      <div class="options">${this._orderedValues().map(t=>this._renderOption(t))}</div>
    </ha-sortable>`:H`<p class="hint">
        Pick a fan entity that exposes preset modes to customize them.
      </p>`}_renderOption(t){const e="fan-presets"===this.feature.type?this.feature.options?.find(e=>e.value===t):void 0;return H`<div class="opt">
      <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
      <div class="opt-name" title=${t}>${Dt(t)}</div>
      <div class="title-group field-column">
        <span class="field-label">Name</span>
        <mp-text-field
          label=${Dt(t)}
          .value=${e?.label??""}
          @value-changed=${e=>this._setOverride(t,{label:e.detail.value})}
        ></mp-text-field>
      </div>
      <div class="appearance-row option-appearance">
        <div class="field-column">
          <span class="field-label">Icon</span>
          <mp-icon-field
            .hass=${this.hass}
            .value=${e?.icon}
            .defaultIcon=${Pt(t)}
            @value-changed=${e=>this._setOverride(t,{icon:e.detail.value})}
          ></mp-icon-field>
        </div>
        <div class="field-column">
          <span class="field-label">Color</span>
          <mp-color-field
            .value=${e?.color}
            .defaultColor=${zt(t)}
            @value-changed=${e=>this._setOverride(t,{color:e.detail.value})}
          ></mp-color-field>
        </div>
      </div>
      <button
        class="opt-hide"
        aria-pressed=${String(!!e?.hide)}
        aria-label=${e?.hide?"Show option":"Hide option"}
        @click=${()=>this._setOverride(t,{hide:!e?.hide})}
      >
        <ha-icon icon=${e?.hide?"mdi:eye-off":"mdi:eye"}></ha-icon>
      </button>
    </div>`}}wi.styles=[At,r`
      .editor,
      .options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .vacuum-info {
        display: flex;
        align-items: start;
        gap: 12px;
        background: var(--mp-surface-container-high);
        border-radius: var(--mp-shape-chip-square);
        padding: 12px 16px;
        color: var(--mp-on-surface);
        font-family: var(--md-sys-typescale-body-medium-font, inherit);
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        font-weight: var(--md-sys-typescale-body-medium-weight, 400);
        line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      }
      .vacuum-info ha-icon {
        flex: none;
        color: var(--mp-on-surface-variant);
      }
      .vacuum-info-title {
        font-family: var(--md-sys-typescale-label-large-font, inherit);
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        font-weight: var(--md-sys-typescale-label-large-weight, 500);
        line-height: var(--md-sys-typescale-label-large-line-height, 20px);
      }
      .vacuum-info p {
        margin: 4px 0 0;
      }
      .field {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .appearance-row,
      .short-row {
        display: flex;
        align-items: start;
        gap: 12px;
        min-width: 0;
      }
      .field-column {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--mp-on-surface-variant);
        min-width: 0;
      }
      .short-field {
        flex: 1;
      }
      .option-appearance {
        grid-column: 1 / 3;
      }
      .ranges {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .range-header,
      .range {
        display: grid;
        grid-template-columns: minmax(0, 88px) minmax(0, 88px) 56px 40px;
        gap: 8px;
        align-items: center;
      }
      .range-header {
        color: var(--mp-on-surface-variant);
      }
      .range .opt-hide {
        align-self: center;
        width: 40px;
        height: 40px;
        padding: 0;
      }
      .add-range {
        align-self: start;
        min-height: 40px;
        padding: 8px 16px;
        border: none;
        border-radius: var(--mp-shape-full);
        background: var(--mp-secondary-container);
        color: var(--mp-on-secondary-container);
        font: inherit;
        cursor: pointer;
      }
      .add-range:hover {
        background: var(--mp-surface-container-highest);
        color: var(--mp-on-surface);
      }
      .add-range:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .field-label,
      .hint,
      .opt-name {
        color: var(--mp-on-surface-variant);
      }
      .hint {
        margin: 0;
        font-size: 13px;
      }
      .opt {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
      }
      .opt-name {
        grid-column: 2 / -1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .title-group {
        display: flex;
        align-items: stretch;
        min-width: 0;
        grid-column: 1 / 3;
      }
      .title-group mp-text-field {
        flex: 1;
        min-width: 0;
      }
      .handle {
        cursor: grab;
        color: var(--mp-on-surface-variant);
      }
      .opt-hide {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: var(--mp-shape-full);
        color: var(--mp-on-surface-variant);
        background: transparent;
        cursor: pointer;
      }
      .opt-hide[aria-pressed='true'] {
        color: var(--mp-error);
      }
      .opt-hide:hover {
        background: var(--mp-surface-container-highest);
      }
      .opt-hide:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .thresholds {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
      }
      .thresholds label {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--mp-on-surface-variant);
      }
      .thresholds input {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        min-height: 44px;
        padding: 8px 12px;
        border: 1px solid var(--mp-outline-variant);
        border-radius: var(--mp-shape-full);
        background: var(--mp-surface-container-high);
        color: var(--mp-on-surface);
        font: inherit;
      }
      .thresholds input:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .thresholds input::placeholder {
        color: var(--mp-on-surface-variant);
      }
      .toggle,
      summary {
        display: flex;
        align-items: center;
        min-height: 44px;
        gap: 12px;
        cursor: pointer;
      }
      summary {
        display: list-item;
      }
      .toggle input {
        accent-color: var(--mp-primary);
      }
      .setup-tracking {
        min-height: 44px;
        padding: 8px 12px;
        border: 1px solid var(--mp-outline-variant);
        border-radius: var(--mp-shape-full);
        background: var(--mp-surface-container-high);
        color: var(--mp-on-surface);
        font: inherit;
        cursor: pointer;
      }
      .setup-tracking:hover:not(:disabled) {
        background: var(--mp-surface-container-highest);
      }
      .setup-tracking:disabled {
        color: var(--mp-on-surface-variant);
        cursor: not-allowed;
      }
      .setup-tracking:focus-visible,
      summary:focus-visible,
      .toggle input:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      [role='alert'] {
        color: var(--mp-error);
      }
    `],t([ut({attribute:!1})],wi.prototype,"hass",void 0),t([ut({attribute:!1})],wi.prototype,"feature",void 0),t([ut()],wi.prototype,"fanEntity",void 0),t([ut({attribute:!1})],wi.prototype,"cardConfig",void 0),t([ut()],wi.prototype,"rpmEntity",void 0),t([mt()],wi.prototype,"_settingUp",void 0),t([mt()],wi.prototype,"_setupError",void 0),t([mt()],wi.prototype,"_rangeDrafts",void 0),customElements.get("mp-purifier-feature-editor")||customElements.define("mp-purifier-feature-editor",wi);const xi=[{value:"icon",label:"Icon",icon:"mdi:card-outline"},{value:"tile",label:"Tile",icon:"mdi:card-text-outline"}];class $i extends ct{get _display(){return this.feature.display??"tile"}_patch(t){const e={...this.feature,...t};e.name||delete e.name,void 0===e.icon&&delete e.icon,e.color||delete e.color,this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:e},bubbles:!0,composed:!0}))}render(){const t=this._display,e="tile"===t,i=this.hass?.states?.[this.feature.entity]?.attributes?.icon;return H`
      <div class="editor">
        <div class="field">
          <span class="field-label">Display</span>
          <mp-display-toggle
            .value=${t}
            .options=${xi}
            @value-changed=${t=>this._patch({display:t.detail.value})}
          ></mp-display-toggle>
        </div>

        <mp-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          .default=${50}
          @width-changed=${t=>this._patch({width:t.detail.value})}
        ></mp-width-field>

        <div class="item">
          <mp-entity-picker
            .hass=${this.hass}
            .value=${this.feature.entity??""}
            label="Entity"
            .allowCustom=${!0}
            @value-changed=${t=>this._patch({entity:t.detail.value})}
          ></mp-entity-picker>
          <div class="row2">
            <div class="title-group">
              ${e?H`<mp-color-field
                      .attached=${!0}
                      .value=${this.feature.color}
                      @value-changed=${t=>this._patch({color:t.detail.value})}
                    ></mp-color-field>`:K}
              <mp-text-field
                class="title-field"
                label="Custom title"
                .flatLeft=${e}
                .value=${this.feature.name??""}
                @value-changed=${t=>this._patch({name:t.detail.value})}
              ></mp-text-field>
            </div>
            <mp-icon-field
              .hass=${this.hass}
              .value=${this.feature.icon}
              .defaultIcon=${i}
              @value-changed=${t=>this._patch({icon:t.detail.value})}
            ></mp-icon-field>
          </div>
        </div>
      </div>
    `}}$i.styles=r`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .field-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    /* Two lines: the entity picker, then the color pill + title and the icon
       pill below — mirroring the entity-list editor's item. */
    .item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }
    .row2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    /* Color pill + title field attach into a single pill. */
    .title-group {
      display: flex;
      align-items: stretch;
      flex: 1;
      min-width: 0;
    }
    .title-field {
      flex: 1;
      min-width: 0;
    }
  `,t([ut({attribute:!1})],$i.prototype,"hass",void 0),t([ut({attribute:!1})],$i.prototype,"feature",void 0),customElements.get("mp-entity-tile-editor")||customElements.define("mp-entity-tile-editor",$i);class ki extends ct{constructor(){super(...arguments),this.itemsKey="entities",this.showDisplay=!1}get _items(){return this.feature[this.itemsKey]??[]}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setItems(t){this._emit({[this.itemsKey]:t})}_updateItem(t,e){const i=[...this._items],s={...i[t],...e};""===s.label&&delete s.label,void 0===s.icon&&delete s.icon,s.color||delete s.color,i[t]=s,this._setItems(i)}_addItem(){this._setItems([...this._items,{entity:""}])}_moveItem(t){t.stopPropagation();const{oldIndex:e,newIndex:i}=t.detail,s=[...this._items],[a]=s.splice(e,1);s.splice(i,0,a),this._setItems(s)}_removeItem(t){const e=[...this._items];e.splice(t,1),this._setItems(e)}render(){const t=this.feature.display??"icons",e=this.showDisplay&&"tile"===t;return H`
      <div class="editor">
        <mp-text-field
          label="Row label (optional)"
          .value=${this.feature.label??""}
          @value-changed=${t=>this._emit({label:t.detail.value||void 0})}
        ></mp-text-field>

        ${this.showDisplay?H`<div class="field">
                <span class="field-label">Display</span>
                <mp-display-toggle
                  .value=${t}
                  @value-changed=${t=>this._emit({display:t.detail.value})}
                ></mp-display-toggle>
              </div>`:K}

        <mp-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          @width-changed=${t=>this._emit({width:t.detail.value})}
        ></mp-width-field>

        <ha-sortable handle-selector=".handle" @item-moved=${this._moveItem}>
          <div class="items">
            ${this._items.map((t,i)=>{const s=this.hass?.states?.[t.entity]?.attributes?.icon;return H`<div class="item">
                <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
                <div class="body">
                  <mp-entity-picker
                    .hass=${this.hass}
                    .value=${t.entity??""}
                    label="Entity"
                    .includeDomains=${this.includeDomains}
                    .allowCustom=${!0}
                    @value-changed=${t=>this._updateItem(i,{entity:t.detail.value})}
                  ></mp-entity-picker>
                  <div class="row2">
                    <mp-icon-field
                      .hass=${this.hass}
                      .value=${t.icon}
                      .defaultIcon=${s}
                      @value-changed=${t=>this._updateItem(i,{icon:t.detail.value})}
                    ></mp-icon-field>
                    <div class="title-group">
                      ${e?H`<mp-color-field
                              .value=${t.color}
                              @value-changed=${t=>this._updateItem(i,{color:t.detail.value})}
                            ></mp-color-field>`:K}
                      <mp-text-field
                        class="title-field"
                        label="Custom title"
                        .flatLeft=${e}
                        .value=${t.label??""}
                        @value-changed=${t=>this._updateItem(i,{label:t.detail.value})}
                      ></mp-text-field>
                    </div>
                  </div>
                </div>
                <button class="del" title="Remove" @click=${()=>this._removeItem(i)}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>`})}
          </div>
        </ha-sortable>

        <ha-button @click=${this._addItem}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add entity
        </ha-button>
      </div>
    `}}ki.styles=r`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .field-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    /* Two lines per item: entity picker on top, then the icon pill + custom
       title below. The drag handle and delete button flank both lines. */
    .item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }
    .row2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    /* Color pill + title field attach into a single pill. */
    .title-group {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }
    .title-field {
      flex: 1;
      min-width: 0;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
      display: grid;
      place-items: center;
    }
    .handle ha-icon {
      --mdc-icon-size: 20px;
    }
    .del {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .del:hover {
      color: var(--error-color);
    }
    ha-button {
      align-self: flex-start;
      --mdc-theme-primary: var(--primary-color);
    }
  `,t([ut({attribute:!1})],ki.prototype,"hass",void 0),t([ut({attribute:!1})],ki.prototype,"feature",void 0),t([ut()],ki.prototype,"itemsKey",void 0),t([ut({type:Boolean})],ki.prototype,"showDisplay",void 0),t([ut({attribute:!1})],ki.prototype,"includeDomains",void 0),customElements.get("mp-entity-list-editor")||customElements.define("mp-entity-list-editor",ki);class Ei extends ct{_values(){return this.hass?.states?.[this.feature.entity]?.attributes?.options??[]}_orderedValues(){return Nt(this._values(),this.feature.order)}_moveOption(t){t.stopPropagation();const{oldIndex:e,newIndex:i}=t.detail,s=this._orderedValues(),[a]=s.splice(e,1);s.splice(i,0,a),this._emit({order:s})}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),a={...s>=0?i[s]:{value:t},...e};""===a.label&&delete a.label,void 0===a.icon&&delete a.icon,a.hide||delete a.hide,a.color||delete a.color;const n=void 0!==a.label||void 0!==a.icon||!!a.hide||!!a.color;s>=0?n?i[s]=a:i.splice(s,1):n&&i.push(a),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return H`
      <div class="editor">
        <mp-entity-picker
          .hass=${this.hass}
          .value=${this.feature.entity??""}
          .includeDomains=${["input_select"]}
          label="Input select entity"
          .allowCustom=${!0}
          @value-changed=${t=>this._emit({entity:t.detail.value})}
        ></mp-entity-picker>

        <mp-text-field
          label="Row label (optional)"
          .value=${this.feature.label??""}
          @value-changed=${t=>this._emit({label:t.detail.value||void 0})}
        ></mp-text-field>

        <div class="field">
          <span class="field-label">Display</span>
          <mp-display-toggle
            .value=${e}
            @value-changed=${t=>this._emit({display:t.detail.value})}
          ></mp-display-toggle>
        </div>

        <mp-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          @width-changed=${t=>this._emit({width:t.detail.value})}
        ></mp-width-field>

        ${0===t.length?H`<p class="hint">Pick an input_select entity to customize its options.</p>`:H`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
                <div class="options">
                  ${this._orderedValues().map(t=>{const i=this._override(t),s=!!i?.hide,a="tile"===e;return H`<div class="opt">
                      <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
                      <div class="opt-name" title=${t}>${Dt(t)}</div>
                      <div class="title-group">
                        ${a?H`<mp-color-field
                                .value=${i?.color}
                                @value-changed=${e=>this._setOverride(t,{color:e.detail.value})}
                              ></mp-color-field>`:K}
                        <mp-text-field
                          label=${Dt(t)}
                          .flatLeft=${a}
                          .value=${i?.label??""}
                          @value-changed=${e=>this._setOverride(t,{label:e.detail.value})}
                        ></mp-text-field>
                      </div>
                      <mp-icon-field
                        .hass=${this.hass}
                        .value=${i?.icon}
                        @value-changed=${e=>this._setOverride(t,{icon:e.detail.value})}
                      ></mp-icon-field>
                      <button
                        class="opt-hide ${s?"on":""}"
                        title=${s?"Hidden":"Visible"}
                        @click=${()=>this._setOverride(t,{hide:!s})}
                      >
                        <ha-icon icon=${s?"mdi:eye-off":"mdi:eye"}></ha-icon>
                      </button>
                    </div>`})}
                </div>
              </ha-sortable>`}
      </div>
    `}}Ei.styles=r`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    mp-entity-picker {
      display: block;
      width: 100%;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .field-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    .options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .opt {
      display: grid;
      grid-template-columns: auto minmax(60px, 1fr) 2fr auto auto;
      align-items: center;
      gap: 8px;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
      display: grid;
      place-items: center;
    }
    .handle ha-icon {
      --mdc-icon-size: 20px;
    }
    .opt-name {
      font-size: 13px;
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .title-group {
      display: flex;
      align-items: center;
      min-width: 0;
    }
    .title-group mp-text-field {
      flex: 1;
      min-width: 0;
    }
    mp-icon-field {
      min-width: 0;
    }
    .opt-hide {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .opt-hide.on {
      color: var(--error-color);
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      margin: 0;
    }
  `,t([ut({attribute:!1})],Ei.prototype,"hass",void 0),t([ut({attribute:!1})],Ei.prototype,"feature",void 0),customElements.get("mp-input-select-editor")||customElements.define("mp-input-select-editor",Ei);const Ci={run:async function(t,e){const{fanEntity:i,rpmEntity:s,target:a,signal:n}=e,r=t();if(null===ei(r.states[s]?.state))throw new Error("RPM entity must have a numeric state");if("none"===a.kind||!a.available||!a.entity)throw new Error("Speed target is unavailable");const o=r.states[i];if(!o||!["on","off"].includes(o.state))throw new Error("Fan is unavailable");const l=function(t,e=2){const{min:i,max:s,step:a}=t;if("none"===t.kind||![i,s,a].every(Number.isFinite)||a<=0||s<i)return[];const n=(s-i)/a,r=Math.ceil(n-1e-9),o=Number.isFinite(e)?Math.max(2,Math.floor(e)):2,l=new Set;for(let t=0;t<Math.min(o,r+1);t++){const e=Math.round(t*r/(Math.min(o,r+1)-1||1));l.add(e===r?s:Number((i+e*a).toPrecision(15)))}return[...l].sort((t,e)=>t-e)}(a);if(l.length<2)throw new Error("Speed target needs at least two levels");const c="off"===o.state,d=o.attributes.preset_mode,h="fan_percentage"===a.kind&&"number"==typeof o.attributes.percentage?o.attributes.percentage:a.value;if(!(null!==h&&Number.isFinite(h)||c&&"fan_percentage"===a.kind))throw new Error("Previous speed value is unavailable");const p=e.pollMs??500,u=e.stepTimeoutMs??9e4;if(!Number.isFinite(p)||p<=0||!Number.isFinite(u)||u<=0)throw new Error("Polling interval and step timeout must be positive");const m=e.sleep??(t=>new Promise(e=>setTimeout(e,t))),v=e.now??(()=>Date.now()),f=()=>{if(n?.aborted){const t=new Error("Calibration aborted");throw t.name="AbortError",t}};let g,b=0,y=null,_=null;const w=t=>{e.onProgress?.({step:b,total:l.length,value:y,rpm:_,phase:t,stable:g})},x=[];let $=!1;const k=()=>{const e=t().states[s],i=e?.last_reported;return{rpm:ei(e?.state),timestamp:i??e?.last_updated,updated:e?.last_updated,reported:void 0!==i}};try{for(const s of[...l].reverse()){f(),b++,y=s,_=null,g=void 0;let n=k().timestamp;w("switching"),f();const r=t(),o=ae(r.states[i],e.speed);null!==o&&o!==d&&($=!0),await re(r,i,a,s,e.speed),f();const l=v();for(w("settling");v()-l<Math.min(2e3,u);)f(),await m(Math.min(p,Math.min(2e3,u)-(v()-l))),f();w("sampling");const c=[];g=!1;const h=[];let E,C,S=null,M=v();for(;;){f();const t=k(),e=v();if(t.rpm===C?.rpm&&t.updated===C?.updated||(M=e),C=t,t.timestamp!==n){n=t.timestamp;const e=Date.parse(t.timestamp??"");e>l+2e3&&(void 0===E||e>E)&&(null!==t.rpm?(void 0!==E&&h.push(e-E),c.push(t.rpm),g=t.reported&&S===t.rpm,S=t.reported?t.rpm:null,E=e):(c.length=0,h.length=0,E=void 0,S=null))}if(g||=null!==t.rpm&&void 0!==t.updated&&c.length>=2&&c[c.length-1]===t.rpm&&e-M>=Math.max(6e3,2*(ii(h)??0)),g||v()-l>=u)break;await m(Math.min(p,u-(v()-l)))}_=g?c[c.length-1]??null:ii(c.slice(-3)),w("sampling"),null!==_&&x.push({value:s,rpm:_})}if(f(),x.length<2)throw new Error("Not enough readings")}finally{const e=async t=>{try{await t()}catch(t){console.warn("Purifier calibration restoration failed",t)}};await e(()=>w("restoring")),null!==h&&Number.isFinite(h)&&await e(()=>"fan_percentage"===a.kind?t().callService("fan","set_percentage",{entity_id:i,percentage:h}):t().callService(a.kind,"set_value",{entity_id:a.entity,value:h})),c?await e(()=>t().callService("fan","turn_off",{entity_id:i})):"string"!=typeof d||!$&&t().states[i]?.attributes.preset_mode===d||await e(()=>t().callService("fan","set_preset_mode",{entity_id:i,preset_mode:d}))}return f(),w("done"),x.sort((t,e)=>t.value-e.value)}},Si=[{name:"entity",required:!0,selector:{entity:{domain:"fan"}}},{name:"name",selector:{text:{}}},{name:"show_name",selector:{boolean:{}}},{name:"theme",selector:{theme:{}}}];const Mi=[{value:"aqi",label:"AQI"},{value:"pm25",label:"µg/m³"}],Ai=[{name:"aqi_allow_cycle",selector:{boolean:{}}}],Pi=[{value:"",label:"Auto-detect"},{value:"pm25",label:"PM2.5 µg/m³"},{value:"us_aqi",label:"US AQI"},{value:"cn_aqi",label:"CN AQI"}],zi=[{value:"us",label:"US (EPA)"},{value:"cn",label:"China (HJ 633)"}],Ni=[{value:"2024",label:"2024"},{value:"2012",label:"2012"}],Oi=[{type:"fan-presets",label:"Fan presets",icon:"mdi:fan-auto"},{type:"speed-wheel",label:"Speed wheel",icon:"mdi:fan"},{type:"filter-vacuum",label:"Vacuum filter",icon:"mdi:air-filter"},{type:"entity-tile",label:"Entity tile",icon:"mdi:card-outline"},{type:"sensor-list",label:"Sensor list",icon:"mdi:format-list-bulleted"},{type:"switch-list",label:"Switch list",icon:"mdi:toggle-switch"},{type:"switch-group",label:"Switch group",icon:"mdi:toggle-switch-outline"},{type:"button-list",label:"Button list",icon:"mdi:gesture-tap-button"},{type:"input-select",label:"Input select",icon:"mdi:form-dropdown"},{type:"percentage-tile",label:"Percentage tile",icon:"mdi:percent"}];function Di(t){switch(t){case"fan-presets":return{type:t,display:"tile"};case"speed-wheel":case"filter-vacuum":return{type:t};case"entity-tile":case"percentage-tile":case"input-select":return{type:t,entity:""};case"sensor-list":case"button-list":return{type:t,items:[]};case"switch-list":case"switch-group":return{type:t,entities:[]}}}const Fi={entity:"Fan entity (required)",name:"Name",show_name:"Show name",theme:"Theme",aqi_entity:"Air quality sensor",aqi_attribute:"Attribute (optional)",aqi_source:"Reported value",aqi_scale:"AQI scale",aqi_metric:"Shown value",aqi_allow_cycle:"Allow tapping the unit to switch AQI ↔ µg/m³",aqi_us_breakpoints:"US breakpoints",motor_speed_entity:"Motor speed sensor",max_rpm:"Max RPM (optional)",cadr:"CADR (m³/h)"};class Ti extends ct{constructor(){super(...arguments),this._editingIndex=null,this._addOpen=!1,this._confirmCalibration=!1,this._calibrating=!1,this._progress=null,this._calibrationMessage="",this._calibrationError=!1,this._abort=null,this._computeLabel=t=>Fi[t.name]??t.name,this._computeHelper=()=>""}connectedCallback(){super.connectedCallback(),di().then(()=>this.requestUpdate())}setConfig(t){this._config&&t.entity!==this._config.entity&&this._abort?.abort(),this._config=t}disconnectedCallback(){this._abort?.abort(),super.disconnectedCallback()}_emit(t){t.entity!==this._config.entity&&this._abort?.abort();const e=t.features?.findIndex(t=>"speed-wheel"===t.type)??-1;if(t.speed&&e>=0){const i=[...t.features],s=i[e];"speed-wheel"===s.type&&(i[e]={...s,...void 0===s.entity&&void 0!==t.speed.entity?{entity:t.speed.entity}:{},...void 0===s.preset&&void 0!==t.speed.preset?{preset:t.speed.preset}:{},...void 0===s.display&&void 0!==t.speed.display?{display:t.speed.display}:{},...void 0===s.estimate_auto&&void 0!==t.speed.estimate_auto?{estimate_auto:t.speed.estimate_auto}:{}},delete(t={...t,features:i}).speed)}this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}_fieldChanged(t,e){e.stopPropagation();let i=e.detail.value;if(("cadr"===t||"max_rpm"===t)&&""!==i){const t=Number(i);if(!Number.isFinite(t)||t<=0)return;i=t}this._formChanged(new CustomEvent("value-changed",{detail:{value:{[t]:i}}}))}_formChanged(t){t.stopPropagation();const e={...this._config},i={...e.aqi},s=t.detail.value;(s.aqi_metric||s.aqi_scale)&&(i.scale=i.scale??("cn_aqi"===i.metric?"cn":"us"),i.metric="pm25"===i.metric?"pm25":"aqi");for(const[s,a]of Object.entries(t.detail.value)){const t=s.startsWith("aqi_")?i:e,n=s.startsWith("aqi_")?s.slice(4):s,r=t;""===a||null==a||"show_name"===s&&!0===a?delete r[n]:r[n]=a}Object.keys(i).length?e.aqi=i:delete e.aqi,this._emit(e)}get _features(){return this._config.features??[]}_setFeatures(t){this._emit({...this._config,features:t})}_pickFeature(t){this._addOpen=!1,this._editingIndex=this._features.length,this._setFeatures([...this._features,Di(t)])}_removeFeature(t){this._editingIndex=null,this._setFeatures(this._features.filter((e,i)=>i!==t))}_moveFeature(t){t.stopPropagation();const{oldIndex:e,newIndex:i}=t.detail,s=[...this._features];if(!Number.isInteger(e)||!Number.isInteger(i)||e<0||i<0||e>=s.length||i>=s.length)return;const[a]=s.splice(e,1);s.splice(i,0,a),this._editingIndex=null,this._setFeatures(s)}_featureChanged(t,e){e.stopPropagation();const i=[...this._features];i[t]=e.detail.feature,this._setFeatures(i)}_form(t,e){return H`<ha-form
      .hass=${this.hass}
      .schema=${t}
      .data=${e}
      .computeLabel=${this._computeLabel}
      .computeHelper=${this._computeHelper}
      @value-changed=${this._formChanged}
    ></ha-form>`}get _rpmEntity(){return this._config.motor_speed_entity??Kt(this.hass,this._config.entity)}get _calibrationDisabledReason(){if(!this._rpmEntity||!this.hass.states[this._rpmEntity])return"Select a motor speed sensor to calibrate.";const t=se(this.hass,this._config.entity,te(this._config));return"none"===t.kind?"No speed control available. Configure a speed-wheel feature or a fan with speed control.":t.available?"":"Speed control is unavailable."}async _startCalibration(){if(this._calibrating||this._calibrationDisabledReason)return;const t=this._config.entity,e=this._rpmEntity,i=te(this._config),s=se(this.hass,t,i),a=new AbortController;this._abort=a,this._confirmCalibration=!1,this._calibrating=!0,this._calibrationMessage="",this._calibrationError=!1,this._progress=null;try{const n=await Ci.run(()=>this.hass,{fanEntity:t,rpmEntity:e,target:s,speed:i,signal:a.signal,onProgress:t=>{this._progress=t}});a.signal.aborted||this._config.entity!==t?a.signal.aborted&&(this._calibrationMessage="Calibration stopped."):(this._emit({...this._config,calibration:n}),this._calibrationMessage="Calibration complete.")}catch{this._calibrationError=!a.signal.aborted,this._calibrationMessage=a.signal.aborted?"Calibration stopped.":"Calibration failed. Check the motor speed sensor and speed control, then try again."}finally{this._calibrating=!1,this._abort=null}}_calibrationSummary(){const t=he({...this._config,max_rpm:void 0});if(null===t)return"";const e=te(this._config),i=se(this.hass,this._config.entity,e),s=de(this._config.calibration,i),a=Gt(this.hass,this._rpmEntity),n=`Max ${t.toLocaleString()} rpm`;if(!s||null===a||"none"===i.kind)return n;const r=ee(i.min,i.max,i.step)-1,o=pe(s,a,r);if(null===o)return n;const l=Math.max(0,Math.min(r,Math.round(o)));return`${n} · now ${oe(i,Math.min(i.max,i.min+l*i.step),e.display??"percent")}`}_renderCalibration(){const t=this._calibrationDisabledReason,e=this._progress;return H`<div class="calibration">
      <button
        class="add-btn calibrate"
        ?disabled=${Boolean(t)||this._calibrating}
        aria-describedby="calibration-reason"
        @click=${()=>{this._confirmCalibration=!0,this._calibrationMessage=""}}
      >
        Calibrate fan speed
      </button>
      <p class="hint" id="calibration-reason">${t}</p>
      ${this._confirmCalibration?H`<div class="warning" role="group" aria-label="Confirm fan speed calibration">
              <p>
                The purifier will run at its lowest and highest speed for up to a minute or two,
                then return to its current mode.
              </p>
              <div class="actions">
                <button
                  class="add-btn start-calibration"
                  ?disabled=${Boolean(t)}
                  @click=${this._startCalibration}
                >
                  Start
                </button>
                <button
                  class="add-opt cancel-calibration"
                  @click=${()=>this._confirmCalibration=!1}
                >
                  Cancel
                </button>
              </div>
            </div>`:K}
      ${this._calibrating?H`<div class="actions">
              <p class="hint" role="status">
                ${this._abort?.signal.aborted?"Stopping · restoring previous mode…":"restoring"===e?.phase?"Restoring previous mode…":e?`Step ${e.step} of ${e.total}${null===e.rpm?"":` · ${Math.round(e.rpm).toLocaleString("en-US")} rpm`}`:"Starting calibration…"}
              </p>
              <button
                class="add-opt stop-calibration"
                ?disabled=${this._abort?.signal.aborted}
                @click=${()=>{this._abort?.abort(),this.requestUpdate()}}
              >
                Stop
              </button>
            </div>`:K}
      ${this._calibrationMessage?H`<p class="hint" role=${this._calibrationError?"alert":"status"}>${this._calibrationMessage}</p>`:K}
      ${this._calibrationSummary()?H`<p class="hint">${this._calibrationSummary()}</p>`:K}
    </div>`}updated(){for(const t of["aqi_entity","motor_speed_entity"]){const e=this.shadowRoot?.querySelector(`mp-entity-picker[data-key="${t}"]`);e&&e.updateComplete.then(()=>{e.shadowRoot?.querySelector("button")?.setAttribute("aria-label",Fi[t])})}for(const t of["cadr","max_rpm"]){const e=this.shadowRoot?.querySelector(`mp-text-field[data-key="${t}"]`);e&&e.updateComplete.then(()=>{const i=e.shadowRoot?.querySelector("input");if(!i)return;i.type="number",i.min="0",i.step="any",i.inputMode="decimal";const s="max_rpm"===t?he({...this._config,max_rpm:void 0}):null;i.placeholder=null===s?Fi[t]:`Calibrated: ${Math.round(s)}`,i.setAttribute("aria-description","cadr"===t?"From your purifier's datasheet; used for air volume and room coverage":"Leave empty to use calibration")})}}_labeledField(t,e,i){return H`<div class="field-column">
      <span class="field-label">${Fi[t]}</span>
      ${e} ${i?H`<p class="hint">${i}</p>`:K}
    </div>`}_select(t,e,i){return this._labeledField(t,H`<mp-select-field
        data-key=${t}
        .label=${Fi[t]}
        .value=${e}
        .options=${i}
        @value-changed=${e=>this._fieldChanged(t,e)}
      ></mp-select-field>`)}_renderAqi(){const t=this._config.aqi,e=Qt(t),i=Xt(this.hass,this._config.entity,t),s=Jt(i,e,t?.us_breakpoints),a=`${Ht(e)}${"pm25"===e?"":"cn_aqi"===e?" (CN)":" (US)"}`;return H`<div class="fields">
      ${this._labeledField("aqi_entity",H`<mp-entity-picker
          data-key="aqi_entity"
          .hass=${this.hass}
          .label=${Fi.aqi_entity}
          .includeDomains=${["sensor"]}
          .value=${t?.entity??""}
          @value-changed=${t=>this._fieldChanged("aqi_entity",t)}
        ></mp-entity-picker>`)}
      <div class="field-row halves">
        ${this._labeledField("aqi_attribute",H`<mp-text-field
            data-key="aqi_attribute"
            .label=${Fi.aqi_attribute}
            .value=${t?.attribute??""}
            @value-changed=${t=>this._fieldChanged("aqi_attribute",t)}
          ></mp-text-field>`)}
        ${this._select("aqi_source",t?.source??"",Pi)}
      </div>
      <p class="hint aqi-preview" role="status">
        ${null===i.value?"No reading available. Select an air quality sensor with a numeric reading.":`Sensor: ${i.value} ${Ht(i.source)} → Shown: ${s.text} ${a}`}
      </p>
      <div class="field-row thirds">
        ${this._select("aqi_scale",t?.scale??("cn_aqi"===t?.metric?"cn":"us"),zi)}
        ${this._select("aqi_metric","pm25"===t?.metric?"pm25":"aqi",Mi)}
        ${this._select("aqi_us_breakpoints",t?.us_breakpoints??"2024",Ni)}
      </div>
      ${this._form(Ai,{aqi_allow_cycle:t?.allow_cycle??!1})}
    </div>`}_renderMotor(){return H`<div class="fields">
      ${this._labeledField("motor_speed_entity",H`<mp-entity-picker
          data-key="motor_speed_entity"
          .hass=${this.hass}
          .label=${Fi.motor_speed_entity}
          .includeDomains=${["sensor"]}
          .value=${this._config.motor_speed_entity??""}
          @value-changed=${t=>this._fieldChanged("motor_speed_entity",t)}
        ></mp-entity-picker>`)}
      <div class="field-row halves">
        ${["cadr","max_rpm"].map(t=>this._labeledField(t,H`<mp-text-field
              data-key=${t}
              .label=${Fi[t]}
              .value=${String(this._config[t]??"")}
              @value-changed=${e=>this._fieldChanged(t,e)}
            ></mp-text-field>`,"cadr"===t?"From your purifier's datasheet; used for air volume and room coverage":"Leave empty to use calibration"))}
      </div>
      ${this._renderCalibration()}
    </div>`}render(){if(!this._config||!this.hass)return H``;const t=this._config;return H`<div class="editor">
      ${this._form(Si,{entity:t.entity,name:t.name,show_name:!1!==t.show_name,theme:t.theme})}
      <details>
        <summary>Air quality</summary>
        ${this._renderAqi()}
      </details>
      <details>
        <summary>Motor speed and CADR</summary>
        ${this._renderMotor()}
      </details>
      <div class="features-header">Features</div>
      ${this._features.length?K:H`<p class="hint">No features yet. Add a feature below.</p>`}
      <ha-sortable handle-selector=".handle" @item-moved=${this._moveFeature}>
        <div class="features">
          ${this._features.map((t,e)=>this._renderFeatureRow(t,e))}
        </div>
      </ha-sortable>
      <div class="add">
        <button
          class="add-btn"
          aria-expanded=${String(this._addOpen)}
          @click=${()=>this._addOpen=!this._addOpen}
        >
          <ha-icon icon=${this._addOpen?"mdi:close":"mdi:plus"}></ha-icon>Add feature
        </button>
        ${this._addOpen?H`<div class="add-menu">${Oi.map(t=>H`<button class="add-opt" @click=${()=>this._pickFeature(t.type)}>${t.label}</button>`)}</div>`:K}
      </div>
    </div>`}_summary(t){return"entities"in t?`${t.entities.length} entities`:"items"in t?`${t.items.length} entities`:"entity"in t?t.entity||"No entity selected":"filter-vacuum"===t.type?t.counter_entity||"Tracking not set up":"fan-presets"===t.type?t.display??"tile":"Fan speed"}_renderFeatureRow(t,e){const i=this._editingIndex===e,s=Oi.find(e=>e.type===t.type);return H`<div class="feature">
      <div class="feature-head">
        <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
        <ha-icon icon=${s?.icon??"mdi:card-outline"}></ha-icon>
        <div class="feature-title">
          <div>${s?.label??t.type}</div>
          <div class="hint">${this._summary(t)}</div>
        </div>
        <button
          class="icon-btn"
          aria-label="Edit feature"
          aria-expanded=${String(i)}
          @click=${()=>this._editingIndex=i?null:e}
        >
          <ha-icon icon=${i?"mdi:chevron-up":"mdi:pencil"}></ha-icon>
        </button>
        <button
          class="icon-btn"
          aria-label="Delete feature"
          @click=${()=>this._removeFeature(e)}
        >
          <ha-icon icon="mdi:delete"></ha-icon>
        </button>
      </div>
      ${i?H`<div class="feature-editor">${this._renderFeatureEditor(t,e)}</div>`:K}
    </div>`}_renderFeatureEditor(t,e){const i=t=>this._featureChanged(e,t);switch(t.type){case"fan-presets":case"speed-wheel":case"filter-vacuum":case"percentage-tile":return H`<mp-purifier-feature-editor
          .hass=${this.hass}
          .fanEntity=${this._config.entity}
          .cardConfig=${this._config}
          .rpmEntity=${this._rpmEntity}
          .feature=${t}
          @feature-changed=${i}
        ></mp-purifier-feature-editor>`;case"entity-tile":return H`<mp-entity-tile-editor
          .hass=${this.hass}
          .feature=${t}
          @feature-changed=${i}
        ></mp-entity-tile-editor>`;case"input-select":return H`<mp-input-select-editor
          .hass=${this.hass}
          .feature=${t}
          @feature-changed=${i}
        ></mp-input-select-editor>`;default:{const e="sensor-list"===t.type?["sensor","binary_sensor"]:"button-list"===t.type?["button","input_button","scene","script"]:["switch","input_boolean","light","fan"];return H`<mp-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey=${"switch-list"===t.type||"switch-group"===t.type?"entities":"items"}
          .showDisplay=${"switch-group"===t.type}
          .includeDomains=${e}
          @feature-changed=${i}
        ></mp-entity-list-editor>`}}}}Ti.styles=[At,r`
      :host {
        display: block;
        container-type: inline-size;
      }
      .fields,
      .calibration {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
      }
      .field-row {
        display: grid;
        gap: 12px;
        min-width: 0;
      }
      .field-column {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--mp-on-surface-variant);
      }
      .field-row > * {
        min-width: 0;
      }
      .halves {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .thirds {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      @container (width < 360px) {
        .field-row {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .warning {
        border: 1px solid var(--mp-outline-variant);
        background: var(--mp-surface-container);
        border-radius: var(--mp-shape-chip-square);
        padding: 12px;
        color: var(--mp-on-surface);
        overflow-wrap: anywhere;
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .editor,
      .features,
      .add-menu {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .features {
        gap: 8px;
      }
      summary {
        cursor: pointer;
        padding: 12px 0;
        color: var(--mp-on-surface);
      }
      .features-header {
        font-weight: 500;
        color: var(--mp-on-surface);
      }
      .feature {
        border: 1px solid var(--mp-outline-variant);
        border-radius: var(--mp-shape-chip-square);
        overflow: visible;
        background: var(--mp-surface-container);
      }
      .feature-head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
      }
      .handle {
        cursor: grab;
        color: var(--mp-on-surface-variant);
        display: grid;
        place-items: center;
      }
      .feature-title {
        flex: 1;
        min-width: 0;
        color: var(--mp-on-surface);
        overflow-wrap: anywhere;
      }
      button {
        font: inherit;
        cursor: pointer;
        border: none;
      }
      .icon-btn {
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        border-radius: var(--mp-shape-full);
        background: transparent;
        color: var(--mp-on-surface-variant);
      }
      button:hover {
        background: var(--mp-surface-container-highest);
      }
      button:focus-visible,
      summary:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .feature-editor {
        padding: 8px 12px 12px;
        border-top: 1px solid var(--mp-outline-variant);
      }
      .hint {
        color: var(--mp-on-surface-variant);
        font-size: 13px;
        margin: 0;
        overflow-wrap: anywhere;
      }
      .add-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 10px 18px;
        border-radius: var(--mp-shape-full);
        background: var(--mp-primary);
        color: var(--mp-on-primary);
      }
      .add-btn:hover {
        background: var(--mp-primary);
        filter: brightness(0.95);
      }
      .add-menu {
        margin-top: 8px;
        gap: 0;
        background: var(--mp-surface);
        border: 1px solid var(--mp-outline-variant);
        border-radius: var(--mp-shape-chip-square);
        overflow: hidden;
      }
      .add-opt {
        text-align: left;
        min-height: 44px;
        padding: 12px 16px;
        background: transparent;
        color: var(--mp-on-surface);
      }
    `],t([ut({attribute:!1})],Ti.prototype,"hass",void 0),t([mt()],Ti.prototype,"_config",void 0),t([mt()],Ti.prototype,"_editingIndex",void 0),t([mt()],Ti.prototype,"_addOpen",void 0),t([mt()],Ti.prototype,"_confirmCalibration",void 0),t([mt()],Ti.prototype,"_calibrating",void 0),t([mt()],Ti.prototype,"_progress",void 0),t([mt()],Ti.prototype,"_calibrationMessage",void 0),t([mt()],Ti.prototype,"_calibrationError",void 0),customElements.get("material-purifier-card-editor")||customElements.define("material-purifier-card-editor",Ti);var qi=Object.freeze({__proto__:null,MaterialPurifierCardEditor:Ti,calibrationRunner:Ci});export{Ze as MaterialPurifierCard};
