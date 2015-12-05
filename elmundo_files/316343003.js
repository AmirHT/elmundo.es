/* AG-develop 12.7.1-649 (2012-09-20 11:43:57 CEST) */
rsinetsegs=['D11172_10001','D11172_10013','D11172_10014','D11172_10016','D11172_10021','D11172_10023','D11172_10024','D11172_10022','D11172_10040','D11172_10044','D11172_10043','D11172_10050'];
var rsiExp=new Date((new Date()).getTime()+2419200000);
var rsiDom=location.hostname;
rsiDom=rsiDom.replace(/.*(\.[\w\-]+\.[a-zA-Z]{3}$)/,'$1');
rsiDom=rsiDom.replace(/.*(\.[\w\-]+\.\w+\.[a-zA-Z]{2}$)/,'$1');
rsiDom=rsiDom.replace(/.*(\.[\w\-]{3,}\.[a-zA-Z]{2}$)/,'$1');
var rsiSegs="";
var rsiPat=/.*_5.*/;
for(x=0;x<rsinetsegs.length;++x){if(!rsiPat.test(rsinetsegs[x]))rsiSegs+='|'+rsinetsegs[x];}
document.cookie="rsi_segs="+(rsiSegs.length>0?rsiSegs.substr(1):"")+";expires="+rsiExp.toGMTString()+";path=/;domain="+rsiDom;
if(typeof(DM_onSegsAvailable)=="function"){DM_onSegsAvailable(['D11172_10001','D11172_10013','D11172_10014','D11172_10016','D11172_10021','D11172_10023','D11172_10024','D11172_10022','D11172_10040','D11172_10044','D11172_10043','D11172_10050'],'d11172');}