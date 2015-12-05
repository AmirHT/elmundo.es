// Copyright (c) Admeta AB 2008-2012
// Version 1.58.1


var Admeta=Admeta||{};

Admeta.version="1.58.1";
Admeta.textVersion="2.20";
if(!Admeta.base) Admeta.base="http://atemda.com/";
if(!Admeta.textAdsJS) Admeta.textAdsJS="http://s.atemda.com/script/TextAds.js?{sv}";
Admeta.singleImpression="JSAdservingSP.ashx?wId={wId}&pId={pId}&rank={rank}&gid={gid}&clk={clk}&di=1&exm={exm}&jsv={jsv}&tsv={tsv}&cb={cb}&fl={fl}&vitp={vitp}&vit={vit}&jscb={jscb}";
Admeta.singleImpressionNamed="JSAdservingSP.ashx?pbId={pbId}&wsName={wsName}&wName={wName}&rank={rank}&bfDim={width}x{height}&gid={gid}&clk={clk}&di=1&exm={exm}&jsv={jsv}&tsv={tsv}&cb={cb}&fl={fl}&vitp={vitp}&vit={vit}&jscb={jscb}";
Admeta.pageImpression="JSAdservingMP.ashx?pc={pc}&pbId={pbId}&clk={clk}&exm={exm}&jsv={jsv}&tsv={tsv}&cb={cb}&arp={arp}&fl={fl}&vitp={vitp}&vit={vit}&jscb={jscb}";
Admeta.pageRepeatParam="&pId{o}={pId}&rank{o}={rank}&gid{o}={gid}&clk{o}={clk}";
Admeta.pageRepeatParamNamed="&wsName{o}={wsName}&wName{o}={wName}&rank{o}={rank}&bfDim{o}={width}x{height}&gid{o}={gid}&clk{o}={clk}";
if(!Admeta.focus) Admeta.focus=1;

Admeta.init = function (vtUrl)
{
	if(Admeta.initialized) return;

	Admeta.SIV.init(vtUrl);
	
	if (window.addEventListener) {
		window.addEventListener("focus",Admeta.onFocus,false);
		window.addEventListener("blur",Admeta.onBlur,false);
	}
	else if (window.attachEvent) {
		window.attachEvent("onfocus",Admeta.onFocus);
		window.attachEvent("onblur",Admeta.onBlur);
	}

	Admeta.initialized=true;
};

Admeta.onFocus = function()
{
	Admeta.focus=1;
}

Admeta.onBlur = function()
{
	Admeta.focus=0;
}

if (!Admeta.MatC) Admeta.MatC = {
	pList: [],
	setup: function (pid,o,adId,gid,SIV,RF,eff,w,h,sImg,sImgUrl,sImgH,sPos,unsoldTag,unsoldMethod)
	{
		return this.addPlacementInfo(pid,o,adId,gid,SIV,RF,eff,w,h,sImg,sImgUrl,sImgH,sPos,unsoldTag,unsoldMethod);
	},
	addPlacementInfo: function (pid,o,adId,gid,SIV,RF,eff,w,h,sImg,sImgUrl,sImgH,sPos,unsoldTag,unsoldMethod)
	{
		var pInfo=this.getExisting(gid);
		if(pInfo) {
			pInfo.adId=adId;
			pInfo.SIV=SIV;
			if(RF!==undefined&&pInfo.RF===undefined) pInfo.RF=RF;
			if(eff!==undefined&&pInfo.RF===undefined) pInfo.eff=eff;
			pInfo.w=w;
			pInfo.h=h;
			pInfo.timerStarted=false;
			pInfo.pollTimeOut=1;
			pInfo.pid=pid;
			pInfo.o=o;
		}
		else {
			pInfo=this.Placement(pid,o,adId,gid,SIV,RF,eff,w,h,sImg,sImgUrl,sImgH,sPos,unsoldTag,unsoldMethod);
			pInfo.adsQueue=[];
			pInfo.maxAds=Admeta.Refresh.maxAds;
			pInfo.qPos=-1;
			this.pList[this.pList.length]=pInfo;
		}
		return pInfo;
	},
	addTextInit: function(gid,args)
	{
		var pInfo=this.getExisting(gid);
		pInfo.adsQueue[pInfo.adsQueue.length]={type:'text',init:args,ads:[]};
	},
	addTextAd: function(gid,args)
	{
		var pInfo=this.getExisting(gid);
		var ads=pInfo.adsQueue[pInfo.adsQueue.length-1].ads;
		ads[ads.length]=args;
	},
	addTextInsert: function(gid,args)
	{
		var pInfo=this.getExisting(gid);
		pInfo.adsQueue[pInfo.adsQueue.length-1].insert=args;
	},
	addImage: function(gid,args)
	{
		this.addAd('image',gid,args);
	},
	addFlash: function(gid,args)
	{
		this.addAd('flash',gid,args);
	},
	addHTML: function(gid,args)
	{
		this.addAd('html',gid,args);
	},
	addDHTML: function(gid,args)
	{
		this.addAd('dhtml',gid,args);
	},
	addAd: function(type,gid,args)
	{
		var pInfo=this.getExisting(gid);
		if(Admeta.MatC.full(pInfo)) return;
		pInfo.adsQueue[pInfo.adsQueue.length]={type:type,ad:args};
	},
	full: function(pInfo)
	{
		return pInfo===undefined?true:pInfo.adsQueue.length>=Admeta.Refresh.maxAds;
	},
	getExisting: function(gid)
	{
		for (var i=0;i<Admeta.MatC.pList.length;i++) {
			var pInfo=Admeta.MatC.pList[i];
			if(pInfo.gid==gid) return pInfo;
		}
		return undefined;
	},
	generateId: function ()
	{
		return (((1+Math.random())*0x1000000)|0).toString(16).substring(1);
	},
	setInnerIds: function(mat)
	{
		var gid=mat.gid;
		mat.innerId=(gid!==undefined&&gid.length>2&&gid.substr(0,2)=="AM"?gid:"AM"+"_"+this.generateId())+"_SIV";
		mat.innermostId=mat.innerId+"_im";
	},
	Placement: function (pid,o,adId,gid,SIV,RF,eff,w,h,sImg,sImgUrl,sImgH,sPos,unsoldTag,unsoldMethod)
	{
		return {pid:pid,o:o,gid:gid,adId:adId,elemVisible:false,innerId:gid,innermostId:gid,SIV:SIV,RF:RF,active:0,eff:eff,w:w,h:h,arp:0,sImg:sImg,sImgUrl:sImgUrl,sImgH:sImgH,sPos:!sPos?0:sPos,unsoldTag:unsoldTag,unsoldMethod:unsoldMethod};
	},
	checkElemVisible: function (id)
	{
		var isOpera=navigator.userAgent.indexOf('Opera')!=-1;
		var isStandard=document.compatMode=='CSS1Compat';
		var vpH=isOpera?self.innerHeight:isStandard?document.documentElement.clientHeight:document.body.clientHeight;
		var top=document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop;
		var vpW=isOpera?self.innerWidth:isStandard?document.documentElement.clientWidth:document.body.clientWidth;
		var left=document.documentElement.scrollLeft?document.documentElement.scrollLeft:document.body.scrollLeft;
		var el=document.getElementById(id);

		var pos=Admeta.MatC.getPos(el);
		var width=el.offsetWidth;
		var height=el.offsetHeight;

		if (pos[1]+width>vpW+left) width-=pos[1]+width-vpW-left;
		if (pos[1]<left) width-=left-pos[1];
		if (pos[0]+height> vpH+top) height-=pos[0]+height-vpH-top;
		if (pos[0]<top) height-=top-pos[0];

		if(width<0 ) width=0; if( height<0 ) height=0;
		var coverage=(width*height)/(el.offsetWidth*el.offsetHeight);

		return coverage>0.8;
	},
	stopMeasure: function(o)
	{
		if(!o.offsetParent) return true;
		if(o.currentStyle&&o.currentStyle=="relative") return true;
		if(window.getComputedStyle&&document.defaultView.getComputedStyle(o,null).getPropertyValue("position")=="relative") return true;
		return false;
	},
	getPos: function (o)
	{
		var curtop=0;
		var curleft=0;

		if (o.offsetParent) {
			do {
				if(Admeta.MatC.stopMeasure(o)) break;
				curtop+=o.offsetTop;
				curleft+=o.offsetLeft;
			} while (o=o.offsetParent);
		}
		return [curtop,curleft];
	}

};

if (!Admeta.SIV) Admeta.SIV = {
	eventHandlersInitialized: false,
	busy: false,
	evInit: false,
	init: function(vtUrl)
	{
		Admeta.SIV.vtUrl=vtUrl;
	},
	setupEventHandlers: function ()
	{
		if (this.eventHandlersInitialized) return;

		this.eventHandlersInitialized=true;
		
		Admeta.SIV.parentOnLoad=(window.onload)?window.onload:function () {};
		Admeta.SIV.parentOnScroll=(window.onscroll)?window.onscroll:function () {};
		Admeta.SIV.parentOnResize=(window.onresize)?window.onresize:function () {};

		if (window.addEventListener) {
			window.addEventListener("load",this.evHandler,false);
			window.addEventListener("scroll",this.evHandler,false);
			window.addEventListener("resize",this.evHandler,false);
		}
		else if (window.attachEvent) {
			document.attachEvent("onreadystatechange",function(){
				if (document.readyState=="complete") {
					document.detachEvent( "onreadystatechange",arguments.callee );

					Admeta.SIV.evInit=true;
					Admeta.SIV.evHandler();
				}
			});

			if (document.documentElement.doScroll && typeof window.frameElement==="undefined" ) (function(){
				if (Admeta.SIV.evInit) return;

				try {
					document.documentElement.doScroll("left");
				} catch (error) {
					setTimeout (arguments.callee,0);
					return;
				}

				Admeta.SIV.evInit=true;
				Admeta.SIV.evHandler();
			})();

			window.attachEvent("onscroll",Admeta.SIV.evHandler);
			window.attachEvent("onresize",Admeta.SIV.evHandler);
		}
		else
		{
			window.onload = function () {
				Admeta.SIV.parentOnLoad();
				Admeta.SIV.evHandler();
			};

			window.onscroll = function () {
				Admeta.SIV.parentOnScroll();
				Admeta.SIV.evHandler();
			};

			window.onresize = function () {
				Admeta.SIV.parentOnResize();
				Admeta.SIV.evHandler();
			};
		}
	},
	setup: function (mat)
	{
		if (mat&&mat.SIV) this.setupEventHandlers();
	},
	evHandler: function (ev)
	{
		if (Admeta.SIV.busy) return;
		Admeta.SIV.busy=true;
		var mc=Admeta.MatC;

		vList=[];

		for (var i=0;i<mc.pList.length;i++) {
			var mat=mc.pList[i];
			if (mat&&mat.SIV&&!mat.ElemVisible) {
				if (mc.checkElemVisible(mat.innerId)) {
					mat.ElemVisible=true;
					vList[vList.length]=mat;
				}
			}
		}

		if (vList.length>0)
		{
			var matList="?mc="+vList.length+"&";
			var el;

			for (var i=0;i<vList.length;i++) {
				var mat=vList[i];
				el=document.getElementById(mat.innerId);

				var ids = (""+mat.adId).split(",");

				for(var n=0;n<ids.length;n++)
					matList+="pId"+i+"="+mat.pid+"&mId"+i+"="+ids[n]+"&";
			}

			img=document.createElement("img");
			img.setAttribute("id","AmImg"+vList[0].adId );
			img.setAttribute("width","1px" );
			img.setAttribute("height","1px" );
			el.rows[0].cells[0].appendChild(img);
			img.setAttribute("src",Admeta.SIV.vtUrl+matList+"rnd="+new Date().getTime() );
		}

		Admeta.SIV.busy=false;
	}
};

Admeta.brandAd = function(ad,w,h,sImg,sImgUrl,imgH,sPos,gid)
{
	var pInfo=Admeta.MatC.getExisting(gid);
	if(pInfo&&pInfo.sImg!==undefined){sImg=pInfo.sImg===0?undefined:pInfo.sImg;sImgUrl=pInfo.sImgUrl;imgH=pInfo.imgH;sPos=pInfo.sPos;}
	if (sImg===undefined) return ad;
	var pos="right:0px;bottom:0px";
	if(sPos==1) pos="left:0px;bottom:0px";
	if(sPos==2) pos="left:0px;top:0px";
	if(sPos==3) pos="right:0px;top:0px";
	var padTop=sPos>=2?"padding-top:"+imgH:"";
	var logo="<a style='position:absolute;"+pos+";z-index:100;border:0;padding:0;margin:0;width:auto;font-size:0' href='"+sImgUrl+"' target='_blank' rel='nofollow'><img style='border:0;margin:0;padding:0' src='"+sImg+"'></img></a>";
	return "<fieldset id='AMFS"+gid+"' style='display:inline;border:0;margin:0;overflow:hidden;padding:0;"+padTop+";width:"+w+"px;height:"+(h+imgH)+"px;position:relative;overflow:hidden;'>"+ad+logo+"</fieldset>";
};

Admeta.isVisible = function(ele)
{
	do {
		if(ele.style.display=='none') return false;
		ele=ele.parentNode;
	} while (ele!==undefined&&ele.tagName!='BODY');
	return true;
};

Admeta.outputInIframe = function(ifrId,html)
{
	var ifr=document.getElementById(ifrId);
	var b=Admeta.getBrowser();

	var evh=function (e) {
		var ifrDoc;
		if(ifr.contentDocument)
			ifrDoc=ifr.contentDocument;
		else if(ifr.contentWindow)
			ifrDoc=ifr.contentWindow.document;
		else if(window.frames[ifr.name])
			ifrDoc=window.frames[ifr.name].document;
			
		var io=b=="msie"||b=="opera";
		ifrDoc.open();
		if (io&&e==1) ifrDoc.close();
		ifrDoc.write('<!DOCTYPE html>');
		ifrDoc.write("<html><body style='margin:0px;padding:0px;'>"+html+"</body></html>");
		if(!io) ifrDoc.close();
	};
	
	if(Admeta.isVisible(ifr)||document.readyState=="complete"||ifr.readyState=="complete")
		evh(1);
	else 
		switch(b)
		{
			case "webkit":ifr.onload = function(){ifr.onload=undefined;evh();};break;
			case "msie":if(Admeta.IEVersion()<=8){ifr.attachEvent("onload",function(){ifr.detachEvent("onload",arguments.callee);evh();});break;}
			default:ifr.onload = evh;
		}
};

if (!Admeta.Text) Admeta.Text = {
	AdGroup: [],
	init: function ()
	{
		this.AdGroup.push({initArgs:arguments,Ads:[],xRenderF:undefined});
	},
	create: function ()
	{
		this.AdGroup[this.AdGroup.length-1].Ads.push(arguments);
	},
	insert: function ()
	{
		Admeta.storeMaterial(arguments[2]);
		this.process(0,arguments);
	},
	write: function ()
	{
		Admeta.storeMaterial(arguments[2]);
		this.process(1,arguments);
	},
	process: function(op,args)
	{
		var ag=this.AdGroup[this.AdGroup.length-1];
		ag.Operation=op;
		ag.placementDetails=args;
		var gid=args.length>=5?args[4]:undefined;
		ag.xRenderF=Admeta.Text.getRenderer(op,gid,args[0]);
		
		if(ag.js!==undefined) {
			Admeta.Script.load(ag.js,Admeta.defLoad||op==0,undefined,0);
			return;
		}
		
		this.loadTextAdsJs(op);
	},
	loadTextAdsJs: function(op)
	{
		if (Admeta.Text.ProcessTextAds===undefined) {
			if(!Admeta.Text.ScriptLoading) {
				Admeta.Text.ScriptLoading=true;
				Admeta.Script.load(Admeta.versionFile(Admeta.textAdsJS,Admeta.textVersion),Admeta.defLoad||op==0,undefined,0);
			}
		}
		else
			Admeta.Text.ProcessTextAds();
	},
	pushPlacement: function(gid)
	{
		document.write('<di'+'v id="'+gid+'"></di'+'v>');
	},
	customRender: function(js,callback,gid)
	{
		var ag=this.AdGroup[this.AdGroup.length-1];
		ag.js=js;
		ag.rop=1;
		if (Admeta.xRenderF===undefined) Admeta.xRenderF={};
		Admeta.xRenderF[gid]=callback;
	},
	resetCustomRender: function(gid)
	{
		if (Admeta.xRenderF!==undefined) Admeta.xRenderF[gid]=undefined;
	},
	getRenderer: function(op,gid,pid)
	{
		var xf=Admeta.xRenderF;
		if(!xf) return xf;
		var rf=xf[pid];
		xf[pid]=undefined;
		if(gid&&xf[gid]) return xf[gid];
		return rf;
	}
};

Admeta.Flash = {
	get: function (mUrl,w,h,gf,ct,urldct,sImg,sImgUrl,sImgH,sPos,trProbeName,trProbeTags,gid)
	{
		var bc="";

		if (this.support()) {
			var params=ct+"="+urldct;
			
			if(trProbeName!==undefined)
				params+="&trackingcode="+escape(trProbeName);
			if(trProbeTags!==undefined)
				params+="&retargetingtags="+escape(trProbeTags);
			
			bc='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0" id="vfmov" width="'+w+'" height="'+h+'" align="middle">\n';
			bc+='   <param name="allowScriptAccess" value="always">\n';
			bc+='   <param name="movie" value="'+mUrl+'?'+params+'">\n';
			bc+='   <param name="quality" value="high">\n';
			bc+='   <param name="wmode" value="opaque">\n';
			bc+='   <embed src="'+mUrl+'?'+params+'" width="'+w+'" height="'+h+'" quality=high name="vfmov" align="middle" allowScriptAccess="always" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" wmode="opaque" outline="none"></embed>\n';
			bc+='</object>';
		}
		else {
			if(gf.match("pixel\\.gif$")){w=h="1px";}
			bc='<a href="'+unescape(urldct)+'" target="_blank" rel="nofollow"><img src="'+gf+'" width="'+w+'" height="'+h+'" border="0"></a>';
		}

		return Admeta.brandAd(bc,w,h,sImg,sImgUrl,sImgH,sPos,gid);
	},
	insert: function (pid,o,adId,mUrl,w,h,gf,ct,urldct,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos,trProbeName,trProbeTags)
	{
		Admeta.MatC.addFlash(gid,arguments);
		var mat=Admeta.setupMaterial(pid,o,adId,gid,SIV,RF,eff,1,w,h);
		var bc=this.get(mUrl,w,h,gf,ct,urldct,sImg,sImgUrl,sImgH,sPos,trProbeName,trProbeTags,gid);
		Admeta.insertMaterial(pid,o,gid,mat,w,h,bc);
	},
	write: function (pid,o,adId,mUrl,w,h,gf,ct,urldct,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos,trProbeName,trProbeTags)
	{
		Admeta.MatC.addFlash(gid,arguments);
		var mat=Admeta.setupMaterial(pid,o,adId,gid,SIV,RF,eff,1,w,h);
		Admeta.writeMaterial(pid,gid,mat,w,h,this.get(mUrl,w,h,gf,ct,urldct,sImg,sImgUrl,sImgH,sPos,trProbeName,trProbeTags,gid));
	},
	support: function()
	{
		var cv=5;
		var plugin=(navigator.mimeTypes && navigator.mimeTypes['application/x-shockwave-flash'])?
											navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin:0;
		if (plugin){
			var words=navigator.plugins['Shockwave Flash'].description.split(" ");

			for (i=0;i<words.length;++i){
				if (isNaN(parseInt(words[i]))) continue;
				if(words[i]>=cv) return true;
			}
		}
		else if (Admeta.getBrowser()=="msie"){
			for (i=10;i>0;i--){
				try{
					var flash=new ActiveXObject('ShockwaveFlash.ShockwaveFlash.'+i);
					return true;
				}catch(e){}
			}
		}
		return false;
	}
};

Admeta.Image = {
	get: function (mUrl,w,h,urldct,pid,o,sImg,sImgUrl,sImgH,sPos,gid)
	{
		var ad='<a href="'+urldct+'" target="_blank" rel="nofollow"><img id="AM'+pid+"_"+o+'" src="'+mUrl+'" width="'+w+'" height="'+h+'" border="0"></a>';
		return Admeta.brandAd(ad,w,h,sImg,sImgUrl,sImgH,sPos,gid);
	},
	insert: function (pid,o,adId,mUrl,w,h,urldct,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos)
	{
		Admeta.MatC.addImage(gid,arguments);
		var mat=Admeta.setupMaterial(pid,o,adId,gid,SIV,RF,eff,0,w,h);
		Admeta.insertMaterial(pid,o,gid,mat,w,h,this.get(mUrl,w,h,urldct,pid,o,sImg,sImgUrl,sImgH,sPos,gid));
	},
	write: function (pid,o,adId,mUrl,w,h,urldct,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos)
	{
		Admeta.MatC.addImage(gid,arguments);
		var mat=Admeta.setupMaterial(pid,o,adId,gid,SIV,RF,eff,0,w,h);
		Admeta.writeMaterial(pid,gid,mat,w,h,this.get(mUrl,w,h,urldct,pid,o,sImg,sImgUrl,sImgH,sPos,gid));
	}
};

Admeta.JS = {
	getIframe: function (w,h,id,sImg,sImgUrl,sImgH,sPos,gid)
	{
		var ad='<iframe name="'+id+'" id="'+id+'" scrolling="no" frameborder="0" hidefocus="true" style="border-style:none;margin:0px;width:'+w+'px;height:'+h+'px" src="about:blank"></iframe>';
		return Admeta.brandAd(ad,w,h,sImg,sImgUrl,sImgH,sPos,gid);
	},
	generateIfrId: function (pid,o,adId)
	{
		return "AMIfr_"+pid+"_"+o+"_"+adId+"_"+Admeta.MatC.generateId();
	},
	updateIfrSrc: function (id,ifrUrl)
	{
		document.getElementById(id).src=ifrUrl;
	},
	prepareIfr: function (op,pid,o,adId,w,h,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos,argsA)
	{
		op==2?Admeta.MatC.addDHTML(gid,argsA):Admeta.MatC.addHTML(gid,argsA);
		var mat=Admeta.setupMaterial(pid,o,adId,gid,SIV,RF,eff,3,w,h);
		var ifrId=this.generateIfrId(pid,o,adId);
		var ifr=this.getIframe(w,h,ifrId,sImg,sImgUrl,sImgH,sPos,gid);
		op==0||op==2?Admeta.insertMaterial(pid,o,gid,mat,w,h,ifr,3):Admeta.writeMaterial(pid,gid,mat,w,h,ifr,3);
		return ifrId;
	},
	output: function (op,pid,o,adId,ifrUrl,w,h,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos,argsA)
	{
		this.updateIfrSrc(this.prepareIfr(op,pid,o,adId,w,h,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos,argsA),ifrUrl);
	},
	insert: function (pid,o,adId,ifrUrl,w,h,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos)
	{
		this.output(0,pid,o,adId,ifrUrl,w,h,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos,arguments);
	},
	write: function (pid,o,adId,ifrUrl,w,h,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos)
	{
		this.output(1,pid,o,adId,ifrUrl,w,h,SIV,gid,RF,eff,sImg,sImgUrl,sImgH,sPos,arguments);
	},
	replaceStr: function(str,fnd,rep)
	{
		while(str.indexOf(fnd)!=-1) str=str.replace(fnd,rep);
		return str;
	},
	prepareCode: function(code,ct)
	{
		code=unescape(code);
		code=this.replaceStr(code,"{clickthrough0}",unescape(ct));
		code=this.replaceStr(code,"{clickthrough1}",ct);
		code=this.replaceStr(code,"{clickthrough2}",escape(ct));
		code=this.replaceStr(code,"{clickthrough}",unescape(ct));
		return this.replaceStr(code,"{random}",Math.floor(Math.random()*10001));
	},
	insertC: function (pid,o,adId,code,ct,w,h,SIV,gid,RF,eff)
	{
		var u=undefined;
		Admeta.outputInIframe(this.prepareIfr(2,pid,o,adId,w,h,SIV,gid,RF,eff,u,u,u,arguments),this.prepareCode(code,ct));
	},
	writeC: function (pid,o,adId,code,ct,w,h,SIV,gid)
	{
		Admeta.storeMaterial(adId);
		document.write(this.prepareCode(code,ct));
	}
};

Admeta.Refresh = {
	maxAds: 5,
	setup: function (pInfo)
	{
		if(!pInfo) return;	
		if (pInfo.RF&&pInfo.RF>0) this.setupTimer(pInfo);
		return pInfo;
	},
	active: function(gid,active,id)
	{
		var pInfo=Admeta.MatC.getExisting(gid);
		if(!pInfo) return;
		pInfo.active=active;
	},
	attachEv: function(el,gid)
	{
		el.onmouseover=function(){Admeta.Refresh.active(gid,1,el.id);};
		el.onmouseout=function(){Admeta.Refresh.active(gid,0,el.id);};
	},
	setupTimer: function(pInfo)
	{
		var a="Admeta.Refresh.tmHandler('"+pInfo.gid+"')";
		var to=pInfo.timerStarted?pInfo.RF*1000:pInfo.pollTimeOut;
		pInfo.pollTimeOut=1000;
		setTimeout(a,to);
	},
	attMaterial: function(pInfo)
	{
		this.attachEv(document.getElementById(pInfo.innerId),pInfo.gid);
		pInfo.arp++;
	},
	nextAd: function(pInfo)
	{
		if (pInfo.adsQueue.length>=pInfo.maxAds)
			Admeta.Refresh.loopAd(pInfo);
		else
			Admeta.Refresh.loadAd(pInfo);
	},
	lastAdAvailable: function(pInfo)
	{
		if(!pInfo.RF||pInfo.RF==0) return;
		pInfo.maxAds=pInfo.adsQueue.length;
		Admeta.Refresh.nextAd(pInfo);
	},
	loadAd: function(pInfo)
	{
		var sp=Admeta.setParam;
		var fc=Admeta.base+Admeta.pageImpression;
		fc=sp(fc,"pc",1);
		fc=sp(fc,"arp",pInfo.arp);
		fc=Admeta.setCommonParams(fc);

		var item=sp(Admeta.pageRepeatParam,"o",0);
		item=sp(item,"pId",pInfo.pid);
		item=sp(item,"rank",pInfo.o);
		item=sp(item,"clk",pInfo.clk||"");
		fc+=sp(item,"gid",pInfo.gid);
		fc=Admeta.addKeywords(fc);
		
		Admeta.Script.load(fc,true,pInfo.innermostId+"_scr",1);
	},
	loopAd: function(pInfo)
	{
		pInfo.qPos = ++pInfo.qPos % pInfo.maxAds;
		Admeta.Refresh.displayCachedAd(pInfo);
	},
	displayCachedAd: function(pInfo)
	{
		var ad=pInfo.adsQueue[pInfo.qPos];
		var rf=Admeta.Refresh;
		switch(ad.type)
		{
			case "text": rf.displayText(ad);break;
			case "image": rf.displayImage(ad);break;
			case "flash": rf.displayFlash(ad);break;
			case "html": rf.displayHTML(ad);break;
			case "dhtml": rf.displayDHTML(ad);break;
		}
	},
	displayText: function(ad)
	{
		var at=Admeta.Text;
		at.init.apply(at,ad.init);
		for(var i=0;i<ad.ads.length;i++) at.create.apply(at,ad.ads[i]);
		at.insert.apply(at,ad.insert);
	},
	displayImage: function(ad)
	{
		Admeta.Image.insert.apply(Admeta.Image,ad.ad);
	},
	displayFlash: function(ad)
	{
		Admeta.Flash.insert.apply(Admeta.Flash,ad.ad);
	},
	displayHTML: function(ad)
	{
		Admeta.JS.insert.apply(Admeta.JS,ad.ad);
	},
	displayDHTML: function(ad)
	{
		Admeta.JS.insertC.apply(Admeta.JS,ad.ad);
	},
	tmHandler: function(gid)
	{
		var pInfo=Admeta.MatC.getExisting(gid);
		if (Admeta.focus&&!pInfo.active&&Admeta.MatC.checkElemVisible(pInfo.innermostId))
		{
			if (pInfo.timerStarted) {
				Admeta.Refresh.nextAd(pInfo);
				return;
			}
			pInfo.timerStarted=true;
		}
		Admeta.Refresh.setupTimer(pInfo);
	}
};

if(!Admeta.Script) Admeta.Script = {
	scriptList:[],
	executing:0,
	loaded: function()
	{
		Admeta.inFrontCall=false;
		if(typeof(AdmetaIframed)!="undefined") parent.Admeta.loadNext(Admeta.adsServed);
		Admeta.processAsync();
		Admeta.Script.executing--;
		if(Admeta.Script.executing==0&&Admeta.Script.scriptList.length>0) {
			var scr=Admeta.Script.scriptList.pop();
			Admeta.Script.load(scr.url,true,scr.id,1);
		}
	},
	load: function(url,def,id,q)
	{
		if (document.readyState=="complete") def=true;
		if(q&&def&&Admeta.Script.executing>0) {
			Admeta.Script.scriptList.push({url:url,id:id});
			return;
		}
		try {
			if(q) Admeta.Script.executing++;
			url=Admeta.setParam(url,"exm",Admeta.adsServed!==undefined?Admeta.adsServed.join(","):"");
			if(def) {
				Admeta.Script.loadInTag(url,id);
			}
			else {
				document.write("<"+"script"+" charset='utf-8' type='text/javascript' src='"+url+"'></"+"script"+">");
			}
		} catch(e) {
			if(q) Admeta.Script.executing--;
		}
	},
	loadInTag: function(url,id)
	{
		var node=document.getElementsByTagName("script")[0];
		scr=document.createElement('script');
		scr.type='text/javascript';
		scr.async=true;
		if(id) scr.id=id;
		scr.src=url;
		node.parentNode.insertBefore(scr, node);
	}
};

Admeta.getBrowser = function()
{
	var ua=navigator.userAgent.toLowerCase();
	if(ua.indexOf('opera')!=-1) return "opera";
	if(ua.indexOf('msie')!=-1) return "msie";
	if(ua.indexOf('khtml')!=-1||ua.indexOf('applewebkit')!=-1) return "webkit";
	if(ua.indexOf('gecko')!=-1) return "ff";
	return "";
}

Admeta.IEVersion = function ()
{
	var ua=navigator.userAgent;
	var ieOf=ua.indexOf("MSIE ");
	return ieOf==-1?0:parseFloat(ua.substring(ieOf + 5, ua.indexOf(";", ieOf)));
}

Admeta.embedMaterial = function (mat,w,h,bannerContent)
{
	if(mat&&(mat.RF||mat.SIV)&&mat.innerId==mat.innermostId)
		Admeta.MatC.setInnerIds(mat);
		
	var displayType=Admeta.getBrowser()=="msie"?"inline":"inline-table";

	return mat==null||(!mat.RF&&!mat.SIV)||document.getElementById(mat.innerId)!=null?bannerContent:
		'<table id="'+mat.innerId+'" style="margin:0;padding:0;border-collapse:collapse;display:'+displayType+';" border="0" cellspacing="0" cellpadding="0" width="'+w+'px" height="'+h+'px">'+
		'<tr><td id="'+mat.innermostId+'" style="padding:0;margin:0">'+
		bannerContent+
		'</td></tr></table>';
};

Admeta.getContainer = function (pid,o,gid,mat)
{
	if(!mat) mat=Admeta.MatC.getExisting(gid);
	if (mat) {
		var elem=document.getElementById(mat.innermostId);
		if (elem) return elem;
	}
	if (gid!==undefined) {
		var elem=document.getElementById(gid);
		if (elem) return elem;
	}
	return document.getElementById('Admeta'+pid+'_'+o);
};

Admeta.insertMaterial = function(pid,o,gid,mat,w,h,html)
{
	var c=Admeta.getContainer(pid,o,gid,mat);
	c.innerHTML=Admeta.embedMaterial(mat,w,h,html);
	Admeta.postP(mat);
}

Admeta.writeMaterial = function(pid,gid,mat,w,h,html)
{
	document.write(Admeta.embedMaterial(mat,w,h,html));
	Admeta.postP(mat);
}

Admeta.postP = function(pInfo)
{
	if(pInfo&&pInfo.RF)
		Admeta.Refresh.attMaterial(pInfo);
}

Admeta.storeMaterial = function (mId)
{
	if (Admeta.adsServed===undefined)
		Admeta.adsServed=[];

	var ids = (""+mId).split(",");

	for(var n=0;n<ids.length;n++)
		if(!Admeta.contains(Admeta.adsServed,ids[n])) Admeta.adsServed.push(ids[n]);
};

Admeta.contains = function(a,id) {
    var i=a.length;
    while (i--) if (a[i]===id) return true;
	return false;
}

Admeta.setupMaterial = function(pid,o,adId,gid,SIV,RF,eff,mt,w,h)
{
	Admeta.storeMaterial(adId);
	var mat=Admeta.MatC.setup(pid,o,adId,gid,SIV,RF,eff,w,h)
	Admeta.SIV.setup(mat);
	Admeta.Refresh.setup(mat);
	return mat;
}

Admeta.initSetupMaterial = function(gid)
{
	Admeta.MatC.setup(ADM_PL.pId,ADM_PL.rank,-1,gid,undefined,ADM_PL.refresh,(ADM_PL.fade?1:0)|(ADM_PL.attRefreshed?2:0),ADM_PL.width,ADM_PL.height,ADM_PL.brandImgUrl,ADM_PL.brandLandingUrl,ADM_PL.brandImgHeight,ADM_PL.brandImgPos,ADM_PL.unsoldTag,ADM_PL.unsoldMethod);
}

Admeta.setParam = function (str,param,value)
{
	var pattern=new RegExp("{"+param+"}","g");
	return str.replace(pattern,value);
};

Admeta.versionFile = function(f,v)
{
	return Admeta.setParam(f,"sv",v);
}

Admeta.callUserScript = function(scr, directInsert)
{
	var di=directInsert===undefined?0:directInsert;
	
	if(scr.slice(0,6)=="http:/"||scr.slice(0,7)=="https:/") {
		Admeta.loadImg(scr);
		return;
	}
	
	if(!di) {
		if(document.body) {
			var div=document.createElement('div');
			div.innerHTML=scr;
			document.body.appendChild(div);
		}
	}
	else
		document.write(scr);
};

Admeta.userMatch = function(url,t,gid) 
{
	switch(t){
		case "redirect":
			Admeta.loadImg(url);break;
		case "js":
			Admeta.Script.loadInTag(url);break;
		case "iframe": 
			var ifr=document.createElement('iframe');
			ifr.src=url;
			ifr.setAttribute('width', 0);
			ifr.setAttribute('height', 0);
			ifr.setAttribute('style', "display:none");
			var n=document.getElementById(gid);
			n.parentNode.insertBefore(ifr,n)
			break;
	}
};

Admeta.loadImg = function(url)
{
	Admeta.imgLoad=Admeta.imgLoad||[];
	var amImg=new Image(0,0);
	amImg.src=url;
	Admeta.imgLoad.push(amImg);
}

if (!Admeta.noAdAvailable) Admeta.noAdAvailable = function(gid,di) 
{
	var pInfo=Admeta.MatC.getExisting(gid);
	if(pInfo.unsoldTag!==undefined)
		di?document.write(pInfo.unsoldTag):document.getElementById(pInfo.innermostId).innerHTML=pInfo.unsoldTag;
	if(pInfo.unsoldMethod!==undefined)
		eval(pInfo.unsoldMethod.replace(/\{id\}/g, pInfo.innermostId));
	Admeta.Refresh.lastAdAvailable(pInfo);
}

if (!Admeta.unsold) Admeta.unsold = function(gid,content,di,ifrId,url)
{
	var pInfo=Admeta.MatC.getExisting(gid);
	
	if (pInfo.unsoldTag!==undefined) return;

	if(di)
		document.write(content);
	else
		document.getElementById(pInfo.innermostId).innerHTML=content;
		
	document.getElementById(ifrId).src=url;
}

Admeta.encodeClickTag = function(clk)
{
	return (clk.indexOf("&")!=-1 || clk.indexOf("?")!=-1)?escape(clk):clk;
};

Admeta.getOverrides = function ()
{
	var at=Admeta.Text;
	at.forceSize=ADM_PL.textSize;
	at.forceCenterImg=ADM_PL.centerImages;
	at.forceBaseFontSize=ADM_PL.fontSize;
	at.forceBaseFont=ADM_PL.font;
	ADM_PL.TextSize=undefined;
	ADM_PL.CenterImages=undefined;
	ADM_PL.fontSize=undefined;
	ADM_PL.font=undefined;
}

Admeta.getCookie = function(name)
{
	var c=document.cookie;
	var p=c.indexOf(name+"=");
	if (p==-1) return "";
	p+=name.length+1;
	var e=c.indexOf(";",p);
	if(e==-1) e=c.length;
	var v=decodeURIComponent(c.substring(p,e));
	return v;
}

Admeta.setCommonParams = function(fc)
{
	var sp=Admeta.setParam;
	fc=sp(fc,"clk",ADM_PL!==undefined&&ADM_PL.clk!==undefined?Admeta.encodeClickTag(ADM_PL.clk):escape("[]"));
	fc=sp(fc,"arp",0);
	fc=sp(fc,"jsv",Admeta.version);
	fc=sp(fc,"tsv",Admeta.textVersion);
	fc=sp(fc,"cb",new Date().getTime());
	fc=sp(fc,"fl",Admeta.Flash.support()?1:0);
	fc=sp(fc,"jscb",ADM_PL!==undefined&&ADM_PL.jsonCallback!==undefined?ADM_PL.jsonCallback:"");
	var vitp=0;
	var vit="";
	try {
		if(typeof(wlrcmd)!=='undefined') {vitp=1;vit=wlrcmd;}
		else if(typeof(adptpecresp)!=="undefined"&&adptpecresp!="") {vitp=2;vit=adptpecresp;}
		else if(typeof(adptkwresp)!=="undefined"&&adptkwresp!="") {vitp=2;vit=adptkwresp;}
		else if(typeof(adt_bt)!=='undefined') {vitp=2;vit=adt_bt;}
		else if(typeof(W2T_UserCategories)!=='undefined') {vitp=3;vit=W2T_UserCategories.join(",");}
		else if(typeof(rsinetsegs)!=='undefined') {vitp=3;vit=rsinetsegs.join(",");}
		else if(typeof(nuggprof)!=='undefined'&&nuggprof!="") {vitp=2;vit=nuggprof;}
		var gc=Admeta.getCookie;
		if(vitp==0) {
			var v=gc("pec_resp");
			if(v!="") {vitp=2;vit=v.replace(/,/g,";");}
			v=gc("rsi_segs");
			if(v!="") {vitp=3;vit=v.replace(/\|/g,",");}
			v=gc("adptseg");
			if(v!="") {vitp=2;vit=v.replace(/([\w,]+)-([\w]+)/g, "$2=$1").replace(/,/g, ":").replace(/#/g,";")}
		}
	} catch(e) {}
	fc=sp(fc,"vitp", vitp);
	fc=sp(fc,"vit", escape(vit));
		
	return fc;
}

Admeta.addKeywords = function(fc)
{
	return fc;
	var kw=window.OAS_query?OAS_query:parent.OAS_query?parent.OAS_query:0;
	return !kw?fc:fc+"&kw="+escape(kw);
}

Admeta.storeRenderF = function(gid)
{
	if (Admeta.xRenderF===undefined) Admeta.xRenderF={};
	if (ADM_PL.renderF!==undefined||ADM_PL.ADM_RENDERF!==undefined) {
		var rf=ADM_PL.renderF!==undefined?ADM_PL.renderF:ADM_PL.ADM_RENDERF;
		Admeta.xRenderF[gid]=rf;
		Admeta.xRenderF[ADM_PL.pId]=rf;
	}
}

Admeta.getGid = function()
{
	return (ADM_PL.pId===undefined?escape(ADM_PL.Page).replace(/%/g,"_")+ADM_PL.Width+ADM_PL.Height:ADM_PL.pId)+':'+(ADM_PL.rank===undefined?1:ADM_PL.rank)+':'+(((1+Math.random())*0x1000000)|0).toString(16).substring(1);
}

Admeta.callSingleImpression = function ()
{
	var gid=Admeta.getGid();
	var sp=Admeta.setParam;
	Admeta.initSetupMaterial(gid);
	Admeta.storeRenderF(gid);

	var fc=Admeta.base;
	
	Admeta.getOverrides();
	Admeta.fixADMPL();

	if (ADM_PL.wId!==undefined) {
		fc+=Admeta.singleImpression;
		fc=sp(fc,"wId",ADM_PL.wId);
		fc=sp(fc,"pId",ADM_PL.pId);
		fc=sp(fc,"gid",gid);
		fc=sp(fc,"rank",ADM_PL.rank);
	}
	else if(ADM_PL.pbId!==undefined&&ADM_PL.Site!==undefined&&ADM_PL.Page!==undefined&&ADM_PL.Width!==undefined&&ADM_PL.Height!==undefined) {
		fc+=Admeta.singleImpressionNamed;
		fc=sp(fc,"pbId",ADM_PL.pbId);
		fc=sp(fc,"gid",gid);
		fc=sp(fc,"wsName",ADM_PL.Site);
		fc=sp(fc,"wName",ADM_PL.Page);
		fc=sp(fc,"rank",ADM_PL.rank===undefined?1:ADM_PL.rank);
		fc=sp(fc,"width",ADM_PL.Width);
		fc=sp(fc,"height",ADM_PL.Height);
	}
	else
		return;
		
	fc=Admeta.setCommonParams(fc);
	fc=Admeta.addKeywords(fc);
	
	ADM_PL.wId=undefined;
	ADM_PL.wsName=undefined;
	ADM_PL.defLoad=undefined;

	Admeta.inFrontCall=true;
	Admeta.Script.load(fc,Admeta.defLoad,undefined,1);
};

Admeta.writeDiv = function(id)
{
	document.write('<di'+'v id="'+id+'"></di'+'v>');
};

Admeta.pushPlacementInfo = function(gid)
{
	var a=ADM_PL;
	Admeta.initSetupMaterial(gid);
	Admeta.storeRenderF(gid,a.pId);

	if (Admeta.pushedAds===undefined) Admeta.pushedAds=[];
	
	Admeta.fixADMPL();
	
	Admeta.pushedAds.push({wId:ADM_PL.wId,pid:ADM_PL.pId,rank:ADM_PL.rank===undefined?1:ADM_PL.rank,gid:gid,wsName:ADM_PL.Site,wpName:ADM_PL.Page,width:ADM_PL.Width,height:ADM_PL.Height,pbId:ADM_PL.pbId,clk:ADM_PL.clk});
};

Admeta.fixADMPL = function()
{
	var a=ADM_PL;
	var f=Admeta.convADMPLName;
	f(a,"Site","site");
	f(a,"Page","page");
	f(a,"Width","width");
	f(a,"Height","height");
	f(a,"rank","Rank");
	if (a.ATpagefilter) a.Page='Default web page';
}

Admeta.convADMPLName = function(o,to,from)
{
	if(o[to]===undefined) o[to]=o[from];
}

Admeta.pushPlacement = function ()
{
	var gid=Admeta.getGid();
	
	Admeta.writeDiv(gid);
	Admeta.pushPlacementInfo(gid);

	ADM_PL.wId=undefined;
	ADM_PL.wsName=undefined;
};

Admeta.processFullPage = function (checkTags)
{
	var pas=Admeta.pushedAds;
	var sp=Admeta.setParam;
	if(pas===undefined||pas.length==0) return;

	var up=[];

	for (i=0;i<pas.length;i++)
		if(!checkTags||document.getElementById(pas[i].gid)) up.push(i);

	Admeta.getOverrides();

	if(up.length>0) {
		var fc=Admeta.base+Admeta.pageImpression;
		fc=sp(fc,"pc",up.length);
		fc=Admeta.setCommonParams(fc);

		for (i=0;i<up.length;i++) {
			var pa = pas[up[i]];
			if (pa.wId!==undefined) {
				var item=sp(Admeta.pageRepeatParam,"o",i);
				item=sp(item,"pId",pa.pid);
				item=sp(item,"rank",pa.rank);
				item=sp(item,"clk",pa.clk||"");
				fc+=sp(item,"gid",pa.gid);
			}
			else if (pa.pbId!==undefined&&pa.wsName!==undefined&&pa.wpName!==undefined&&pa.width!==undefined&&pa.height!==undefined) {
				fc=sp(fc,"pbId",pa.pbId);
				var item=sp(Admeta.pageRepeatParamNamed,"o",i);
				item=sp(item,"wsName",pa.wsName);
				item=sp(item,"wName",pa.wpName);
				item=sp(item,"width",pa.width);
				item=sp(item,"height",pa.height);
				item=sp(item,"rank",pa.rank);
				item=sp(item,"clk",pa.clk||"");
				fc+=sp(item,"gid",pa.gid);
			}
		}

		fc=Admeta.addKeywords(fc);
		Admeta.inFrontCall=true;
		Admeta.Script.load(fc,ADM_PL.defLoad,undefined,1);
		
		Admeta.pushedAds=[];
	}
};

Admeta.loadInTag = function()
{
	Admeta.pushPlacementInfo(ADM_PL.tagId);
	Admeta.processFullPage(true);
}

Admeta.fixDefLoad = function()
{
	if(ADM_PL.async) ADM_PL.defLoad=ADM_PL.async;
	Admeta.defLoad=ADM_PL.defLoad!==undefined&&!Admeta.defLoad?ADM_PL.defLoad:Admeta.defLoad;
	if(ADM_PL.tp=="sp"&&Admeta.defLoad) ADM_PL.tp="spp";
}

Admeta.testDocWrite = function()
{
	var tp=ADM_PL.tp;
	if((tp=="sp"||tp=="fp"||tp=="spp")&&((window._Admeta&&window._Admeta.aTags)||Admeta.aTags))
	{
		var id=Admeta.getGid();
		document.write("<div id='"+id+"'></div>");
		var ele=document.getElementById(id);
		if(!ele) return false;
		ele.parentNode.removeChild(ele);
		return true;
	}
	return true;
}

Admeta.loadAdsJSON = function(callbackMethodName, placements)
{
	for(;placements.length>0;){
		ADM_PL=placements.pop();
		var gid=Admeta.getGid();
		Admeta.pushPlacementInfo(gid);
	}
	ADM_PL={jsonCallback:callbackMethodName, defLoad:true};
	Admeta.processFullPage(false);
}

Admeta.storeJSONMaterials = function(materials)
{
	for(i=0;i<materials.Ids.length;i++)
		Admeta.storeMaterial(materials.Ids[i]);
}

Admeta.handleClientInvoke = function()
{
	if (!Admeta.testDocWrite()) return;
	Admeta.fixDefLoad();
	
	switch (ADM_PL.tp)
	{
		case "sp":
			Admeta.callSingleImpression();
			break;
		case "fp":
			Admeta.pushPlacement();
			break;
		case "fpc":
			Admeta.processFullPage(true);
			break;
		case "spt":
			Admeta.loadInTag();
			break;
		case "spp":
			Admeta.pushPlacement();
			Admeta.processFullPage(true);
			break;
	}

	ADM_PL=undefined;
};

Admeta.processATags = function(at)
{
	if(!at||at.length==0) return;
	var bak=ADM_PL;
	var defbak=Admeta.defLoad;
	
	for(;at.length>0;){
		ADM_PL=at.pop();
		Admeta.pushPlacementInfo(ADM_PL.tagId);
	}

	ADM_PL={tp:"fpc",async:true};
	Admeta.handleClientInvoke();
	
	Admeta.defLoad=defbak;
	ADM_PL=bak;
}

Admeta.processAsync = function()
{
	if (Admeta.inFrontCall) return;
	if (window._Admeta) Admeta.processATags(window._Admeta.aTags);
	Admeta.processATags(Admeta.aTags);
}

Admeta.processImpressions = function()
{
	if (typeof(AdmetaIframed)!="undefined") Admeta.adsServed=parent.Admeta.adsServed;
	
	var ll=Admeta.loadList||Admeta.ll;
	if (ll){
		for (;ll.length>0;) ll.pop()();
		if(Admeta.ll) Admeta.ll=[]; else Admeta.loadList=[];
	}
	Admeta.processAsync();
	if (typeof(ADM_PL)!="undefined")
		Admeta.handleClientInvoke();
};

Admeta.processImpressions();
