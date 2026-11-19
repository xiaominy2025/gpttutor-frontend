// SOURCE PROPOSAL ONLY: preserve existing function name/associations and other behaviors.
function handler(event) {
 var request=event.request;
 if(request.uri==='/engent-alpha/'||request.uri==='/engent-alpha')request.uri='/index.html';
 else if(request.uri.indexOf('/engent-alpha/')===0)request.uri=request.uri.slice('/engent-alpha'.length);
 else if(request.uri==='/explore'||request.uri.indexOf('/explore/')===0)request.uri='/index.html';
 return request;
}
