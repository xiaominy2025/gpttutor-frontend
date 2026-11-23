function handler(event) {
  var request = event.request;
  if (request.headers.host && request.headers.host.value === 'engentlabs.com') {
    if (request.method !== 'GET' && request.method !== 'HEAD') return {statusCode: 403, statusDescription: 'Forbidden'};
    var parts = [];
    Object.keys(request.querystring || {}).forEach(function(key) {
      var item = request.querystring[key];
      (item.multiValue || [item]).forEach(function(v) { parts.push(key + '=' + v.value); });
    });
    return {statusCode: 302, statusDescription: 'Found', headers: {
      location: {value: 'https://www.engentlabs.com' + request.uri + (parts.length ? '?' + parts.join('&') : '')},
      'cache-control': {value: 'no-store'}}};
  }
  if (request.uri.indexOf('/engent-release-a/') === 0) request.uri = request.uri.slice('/engent-release-a'.length);
  else if (request.uri === '/explore' || request.uri.indexOf('/explore/') === 0) request.uri = '/index.html';
  if (request.uri === '/forecasting') return {statusCode: 301, statusDescription: 'Moved Permanently', headers: {
    location: {value: '/forecasting/'}, 'cache-control': {value: 'no-store'}}};
  if (request.uri === '/forecasting/') request.uri = '/forecasting/index.html';
  if (request.uri === '/process') return {statusCode: 301, statusDescription: 'Moved Permanently', headers: {
    location: {value: '/process/'}, 'cache-control': {value: 'no-store'}}};
  if (request.uri.indexOf('/process/') === 0 && request.uri.slice(request.uri.lastIndexOf('/') + 1).indexOf('.') === -1) request.uri = '/process/index.html';
  return request;
}
