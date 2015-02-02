var lxScript = new Object;
lxScript = {
	each: function( obj, fn, args ) {
		if ( obj.length == undefined )
			for ( var i in obj )
				fn.apply( obj[i], args || [i, obj[i]] );
		else
			for ( var i = 0, ol = obj.length; i < ol; i++ )
				if ( fn.apply( obj[i], args || [i, obj[i]] ) === false ) break;
		return obj;
	},
	getCookie: function ( name )
	{
		var start = document.cookie.indexOf( name + "=" );
		var len = start + name.length + 1;
		if ( ( !start ) && ( name != document.cookie.substring( 0, name.length ) ) ) {
			return null;
		}
		if ( start == -1 ) return null;
		var end = document.cookie.indexOf( ";", len );
		if ( end == -1 ) end = document.cookie.length;
		return unescape( document.cookie.substring( len, end ) );
	},
};

var ieerr = 'Your browser does not support this feature. IE 7+ Users must enable "Native XMLHTTP support" to use this.';
function lxRequest(method, url)
{
	this.request = null;
	this.progress = null;
	this.watching = null;
	this.callback = null;
	this.status = -1;
	this.message = "";
	this.timeout = 20000;
	this.p = 0;
	this.url = url;
	this.parent = null;
	this.requestMessage = "";

	if(window.XMLHttpRequest)
	{
		this.request = new XMLHttpRequest();
		this.request.open(method, url, true);
	}

	this.send = function(parent, string, callback )
	{
		this.parent = (parent ? parent : document.getElementsByTagName('body')[0]);
		this.progress = new lxProgress(this.parent);

		if(this.request)
		{
			var myself = this;
			this.progress.display();
			this.progress.setText("Making Request");
			this.progress.setTitle(this.url);

			this.callback=callback;

			this.watching = setInterval(function() { myself.watch(myself) }, 500);
			this.request.onreadystatechange = function() { myself.p = myself.request.readyState*25 };

			this.timeout=20000;
			this.request.send(string);
		}
		else
		{
			this.progress.failed();
			this.progress.setText(ieerr);
		}
		return 0;
	}

	this.getMessage = function()
	{
		if ( this.request.responseXML == null || this.request.responseXML.documentElement == null )
		{
			if ( this.request.responseText )
				this.requestMessage = this.request.responseText
		}
		else if ( this.request.responseXML.documentElement )
		{
			if ( this.request.responseXML.documentElement.getAttribute('status') )
			{
				this.status = this.request.responseXML.documentElement.getAttribute('status');
				this.requestMessage = this.request.responseXML.documentElement.firstChild.nodeValue;
			}
			else if (this.request.responseXML.documentElement.innerText)
				this.requestMessage = this.request.responseXML.documentElement.innerText;
			else
				this.requestMessage = this.request.responseText;
		}
		else
		{
			this.requestMessage = "Unknown Error";
		}
		this.progress.remove();
		return this.requestMessage;
	}

	this.watch = function(self)
	{
		if ( !self.request )
		{
			clearInterval(self.watching);
		}
		else
		{
			if ( self.timeout > 0 )
			{
				var message = ['Starting','Sending','Receiving Headers','Receiving Message','Done'];
				self.timeout -= 500;
				self.p += 1;

				self.progress.setText(message[self.request.readyState]);
				self.progress.setProgress(self.p);

				if ( self.request.readyState == 4 )
				{
					clearInterval(self.watching);
					self.status = self.request.status;

					self.callback( self );
				}
			}
			else
			{
				self.progress.failed();
				self.progress.setText('Timed Out');

				clearInterval(self.watching);
			}
		}
	}
}

function lxProgress( parent )
{
	this.element = document.createElement('progress');

	this.text = document.createTextNode('Loading');
	if ( typeof(parent) == "string")
		this.p = document.getElementById(parent);
	else
		this.p = parent;

	this.element.appendChild(this.text);
	this.element.setAttribute('max', 100 );
	this.element.setAttribute('value', 0 );

	this.setTitle = function(newText)
	{
		this.element.setAttribute('title', newText );
	}
	this.setText = function(newText)
	{
		this.text.nodeValue = newText;
	}
	this.setProgress = function(newPercent)
	{
		this.element.setAttribute('value', newPercent );
	}
	this.failed = function()
	{
		this.text.nodeValue = 'Failed';
	}
	this.display = function()
	{
		this.p.appendChild(this.element);
	}
	this.remove = function()
	{
		this.p.removeChild(this.element);
	}
}

function clear_children(e)
{
	if (e)
		while(e.hasChildNodes())
			e.removeChild(e.lastChild);
}

function import_content(src, desc)
{
	if ( typeof(src) == 'undefined' || src == null) return 0;
	if ( typeof(desc) == 'undefined' || desc == null) return 0;

	if(desc.nodeType == 1){
		if(src.childNodes && src.childNodes.length>0){
			clear_children(desc);
			for (var i=0, il=src.childNodes.length; i<il;i++){
				var s = src.childNodes[i];
				if(s.nodeType == 1){
					var newNode = document.createElement(s.nodeName);
					for (var j=0, ij=s.attributes.length; j<ij;j++){
						var q = s.attributes[j]
						if ( q['nodeName'] == "href")
							newNode.setAttribute(q['nodeName'], '#'+q['nodeValue']);
						else if ( q['nodeName'] == "src")
							newNode.setAttribute(q['nodeName'], q['nodeValue'].substr(3) );
						else
							newNode.setAttribute(q['nodeName'], q['nodeValue']);
					}
					import_content(s,newNode);
					desc.appendChild(newNode);
				}
				else if(s.nodeType == 3)
					desc.appendChild(document.createTextNode(s.nodeValue));
			}
		}
	}
	else if(desc.nodeType == 3){
		if (src.nodeType == 3)
			desc.nodeValue = src.nodeValue;
		else if (src.firstChild)
			desc.nodeValue = src.firstChild.nodeValue;
	}
}
