import {extname,basename} from 'node:path';
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.mp3':'audio/mpeg','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
export function releaseAssetMetadata(path){
 if(!path||path.startsWith('/')||path.includes(':')||path.includes('\\')||path.split('/').includes('..'))throw Error('Relative artifact path required');
 const contentType=types[extname(path).toLowerCase()];if(!contentType)throw Error('Unreviewed asset type');
 const hashed=/-[A-Za-z0-9_-]{8,}\.[^.]+$/.test(basename(path));
 return {contentType,cacheControl:hashed?'public,max-age=31536000,immutable':'no-cache,max-age=0,must-revalidate'};
}
