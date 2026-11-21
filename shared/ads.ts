export const shim = `<script>(function(){
var noop=function(){},yes=function(cb){if(typeof cb==="function")cb();return Promise.resolve()};
var ad={showAd:function(){return Promise.resolve({didShowAd:false})},preloadAd:function(){return Promise.resolve()},
adExists:function(){return Promise.resolve(false)},cancelAd:noop,showBanner:noop,hideBanner:noop,
on:function(e,cb){if(cb)setTimeout(cb,0)},off:noop,once:function(e,cb){if(cb)setTimeout(cb,0)},
emit:noop,broadcast:noop,start:noop,resume:noop,pause:noop,mute:noop,
SDK_READY:true,VIDEO_LENGTH:0,PREROLL:"preroll",MIDROLL:"midroll",REWARDED:"rewarded",
ALL_ADS_COMPLETED:"all_ads_completed",AD_ERROR:"ad_error",CONTENT_RESUMED:"content_resumed",
USER_IS_SUBSCRIBED:true,getPreBidData:function(){return{}}};
window.gdsdk=ad;window.gdApi=ad;window.SDKGameDistribution=ad;window.GameDistribution=ad;
window.gameMonetize=ad;window.GameMonetizeAds=ad;window.aiGameSDK=ad;window.sdk=ad;
window.adsbygoogle=window.adsbygoogle||[];window.adsbygoogle.push=noop;
window.adsbygoogle.loaded=true;
window.ima={};window.google=window.google||{};window.google.ima={AdDisplayContainer:function(){},
AdsLoader:function(){this.addEventListener=noop;this.requestAds=noop;this.destroy=noop},
AdsRequest:function(){},AdsManagerLoadedEvent:{Type:{}},AdEvent:{Type:{ALL_ADS_COMPLETED:"a",CONTENT_RESUME_REQUESTED:"b"}},AdErrorEvent:{Type:{}},settings:{setLocale:noop},ViewMode:{NORMAL:"n",FULLSCREEN:"f"}};
var block=["imasdk","googlesyndication","doubleclick","googletagservices","adservice","analytics","pm.gamedistribution","gamemonetize.com/feed","api.gamedistribution"];
var of=window.fetch;window.fetch=function(u){var s=String(u&&u.url?u.url:u);
for(var i=0;i<block.length;i++)if(s.indexOf(block[i])>-1)return Promise.reject(new Error("ad blocked"));
return of.apply(this,arguments)};
var ox=window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open=function(m,u){
for(var i=0;i<block.length;i++)if(String(u).indexOf(block[i])>-1){this.send=noop;return}
return ox.apply(this,arguments)};
})();</script>`;

export function inject(page: string, base: string): string {
  const head = `<base href="${base}">\n${shim}`;
  const i = page.search(/<head[^>]*>/i);
  if (i === -1) return head + page;
  const j = page.indexOf(">", i) + 1;
  return page.slice(0, j) + head + page.slice(j);
}
