function collect(a,f){var n=[];for(var i=0;i<a.length;i++){var v=f(a[i]);if(v!=null)n.push(v)}return n};

ajax={};
ajax.x=function(){try{return new ActiveXObject('Msxml2.XMLHTTP')}catch(e){try{return new ActiveXObject('Microsoft.XMLHTTP')}catch(e){return new XMLHttpRequest()}}};
ajax.serialize=function(f){var g=function(n){return f.getElementsByTagName(n)};var nv=function(e){if(e.name)return encodeURIComponent(e.name)+'='+encodeURIComponent(e.value);else return ''};var i=collect(g('input'),function(i){if((i.type!='radio'&&i.type!='checkbox')||i.checked)return nv(i)});var s=collect(g('select'),nv);var t=collect(g('textarea'),nv);return i.concat(s).concat(t).join('&');};
ajax.send=function(u,f,m,a){var x=ajax.x();x.open(m,u,true);x.onreadystatechange=function(){if(x.readyState==4)f(x.responseText)};if(m=='POST')x.setRequestHeader('Content-type','application/x-www-form-urlencoded');x.send(a)};
ajax.get=function(url,func){ajax.send(url,func,'GET')};
ajax.gets=function(url){var x=ajax.x();x.open('GET',url,false);x.send(null);return x.responseText};
ajax.post=function(url,func,args){ajax.send(url,func,'POST',args)};
ajax.update=function(url,elm){var e=$(elm);var f=function(r){e.innerHTML=r};
ajax.get(url,f)};
ajax.submit=function(url,elm,frm){var e=$(elm);var f=function(r){e.innerHTML=r};ajax.post(url,f,ajax.serialize(frm))};

function urlencode (str) {
    str = (str+'').toString();
    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
} 
   

var cacheJSON=null;
var cacheIndices=null;
	
var encapsulaDatos = function (codIndices){
        var datos='cod=';
        for(i=0;i<codIndices.length;i++)
        {
            datos += (urlencode(codIndices[i])+'|');  
        }
       // Quitamos la ultima coma del ultimo elemento    
       datos=datos.substring(0,datos.length-1);
       return datos;
}

var indicesCacheados = function (codIndices)
    {
        if (cacheIndices == null)
        {
            return false;
        }
        else
        {
           if (cacheIndices == codIndices) 
           {
               return true;
           }
           else
           {
               
               return false;
           }
        }
             
    }

var enviaDatosServidor = function (codIndices, url)
    {

        if(cacheJSON == null || !indicesCacheados())
        {
          var datos = encapsulaDatos(codIndices);
          var urlSend = url+'?'+datos+'&llave='+llave;
          var respuestaJSON=ajax.gets(urlSend); 
          cacheJSON=respuestaJSON;
          cacheIndices=codIndices
        }
        else // YA TENGO CACHE DE LOS INDICES
        {
          respuestaJSON=cacheJSON;
        }
        return respuestaJSON;

    }
    
    function gestionarRetorno(datosJson){ 
		/*
		The problem occurs because eval is interpreting the first item in the JSON string as a JavaScript Label. The solution is to wrap the JSON string in parenthesis. 
		var data = eval(datosJson);
		*/
        var data = eval( "(" + datosJson+ ")" );
        if (data.completo)
        {
            for (i=0;i< data['valores'].length;i++)
            {
                console.log(data['valores'][i]['valor']);
                procesaIndice('capa',data['valores'][i]['valor']);
            }
        }

    }
    function procesaIndicesListasDef(capaSalida,indicesBolsa)
    {

        var datosJson = enviaDatosServidor(indicesBolsa,VALOR_JSON);
        var contenedorDatos=null;
        var shtml = [];

        var data = eval( "(" + datosJson+ ")" );
        if (data.completo)
        {
            if (indicesBolsa.length > 1)
            {
                contenedorJson = data['valores'];
                for (i=0;i< contenedorJson.length;i++)
                {
                    contenedorDatos = contenedorJson[i]['valor'];
                    if (contenedorDatos.cambio.substring(0,1) == '+')
                    {
                        estado='sube';
                    }
                    else
                    {
                        estado='baja';
                    }
                    shtml+='<dl class="bolsa-'+contenedorDatos.cod_instrumento.replace('.','-')+'">';
                    shtml+='<dt class="indice"><a href="http://www.elmundo.es/elmundo/economia'+contenedorDatos.url_ficha+'">'+contenedorDatos.nombre+'</a></dt>';
                    shtml+='<dd class="cotizacion '+estado+'"><a href="http://www.elmundo.es/elmundo/economia'+contenedorDatos.url_ficha+'">'+contenedorDatos.cotizacion+'</a></dd>';
                    shtml+='<dd class="var-porcentual '+estado+' ">'+contenedorDatos.cambio_porcentual+'%</dd>';
                    shtml+='<dd class="variacion">'+contenedorDatos.cambio+'</dd>';
                    shtml+='</dl>';
                }
            }
            else 
            {
                    contenedorDatos = data['valor'];
                    if (contenedorDatos.cambio.substring(0,1) == '+')
                    {
                        var estado='sube';
                    }
                    else
                    {
                       var  estado='baja';
                    }
                    shtml+='<dl class="bolsa-'+contenedorDatos.cod_instrumento.replace('.','-')+'">';
                    shtml+='<dt class="indice"><a href="http://www.elmundo.es/elmundo/economia'+contenedorDatos.url_ficha+'">'+contenedorDatos.nombre+'</a></dt>';
                    shtml+='<dd class="cotizacion '+estado+'"><a href="http://www.elmundo.es/elmundo/economia'+contenedorDatos.url_ficha+'">'+contenedorDatos.cotizacion+'</a></dd>';
                    shtml+='<dd class="var-porcentual '+estado+'">'+contenedorDatos.cambio_porcentual+'%</dd>';
                    shtml+='<dd class="variacion">'+contenedorDatos.cambio+'</dd>';
                    shtml+='</dl>';
            }
        }
        document.getElementById(capaSalida).innerHTML = shtml;
        return shtml;
    }

    function procesaIndicesTabular(capaSalida,indicesBolsa)
    {
        var datosJson = enviaDatosServidor(indicesBolsa,VALOR_JSON);
        var contenedorDatos=null;
        var shtml = '<table>';

        var data = eval( "(" + datosJson+ ")" );

        if (data.completo)
        {
            shtml+='<th>Indice</th>';
            shtml+='<th>Último</th>';
            shtml+='<th>Var.%</th>';
            shtml+='<th>Var.</th>';
            if (indicesBolsa.length > 1)
            {
                contenedorJson = data['valores'];
                for (i=0;i< contenedorJson.length;i++)
                {
                    contenedorDatos = contenedorJson[i]['valor'];
                    if (contenedorDatos.cambio.substring(0,1) == '+')
                    {
                        var estado='sube';
                    }
                    else
                    {
                       var  estado='baja';
                    }
                    if (i%2 == 0)
                    {
                        var parimpar='par';
                    }
                    else
                    {
                        var parimpar='impar';
                    }
                    shtml+='<tr class="bolsa-'+contenedorDatos.cod_instrumento.replace('.','-')+' '+parimpar+'">';
                    shtml+='<td class="indice"><a href="http://www.elmundo.es/elmundo/economia'+contenedorDatos.url_ficha+'">'+contenedorDatos.nombre+'</a></td>';
                    shtml+='<td class="cotizacion '+estado+'"><a href="http://www.elmundo.es/elmundo/economia'+contenedorDatos.url_ficha+'">'+contenedorDatos.cotizacion+'</a></td>';
                    shtml+='<td class="var-porcentual '+estado+'">'+contenedorDatos.cambio_porcentual+'%</td>';
                    shtml+='<td class="variacion">'+contenedorDatos.cambio+'</td>';
                    shtml+='</tr>';
                }
            }
            else
            {
                    contenedorDatos = data['valor'];
                    if (contenedorDatos.cambio.substring(0,1) == '+')
                    {
                        var estado='sube';
                    }
                    else
                    {
                       var  estado='baja';
                    }

                    shtml+='<tr class="bolsa-'+contenedorDatos.cod_instrumento.replace('.','-')+'">';
                    shtml+='<td class="indice"><a href="http://www.elmundo.es/elmundo/economia'+contenedorDatos.url_ficha+'">'+contenedorDatos.nombre+'</a></td>';
                    shtml+='<td class="cotizacion '+estado+'"><a href="http://www.elmundo.es/elmundo/economia'+contenedorDatos.url_ficha+'">'+contenedorDatos.cotizacion+'</a></td>';
                    shtml+='<td class="var-porcentual '+estado+'">'+contenedorDatos.cambio_porcentual+'%</td>';
                    shtml+='<td class="variacion">'+contenedorDatos.cambio+'</td>';
                    shtml+='</tr>';
            }
        }
        shtml+='</table>';
        document.getElementById(capaSalida).innerHTML = shtml;
        return shtml;
    }
       
