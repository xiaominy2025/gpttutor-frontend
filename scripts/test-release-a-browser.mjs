// Local compiled-artifact fixture only. Blocks every external browser request.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const root=resolve('.artifacts/release-a/web');let signed=false;
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/api/platform/login'){signed=true;res.writeHead(303,{Location:'/explore'});return res.end();}
 if(path==='/api/platform/session'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({signedIn:signed,navigator:false,treeLoginUrl:'https://d6owpirihdsus.cloudfront.net/api/shared/login'}));}
 if(path==='/'){return res.end('Existing Tree application fixture; marketing homepage is separate.');}
 const relative=path.startsWith('/engent-alpha/')?decodeURIComponent(path.slice('/engent-alpha/'.length)):
  path==='/explore'||path.startsWith('/explore/')?'index.html':null;
 const file=relative&&resolve(root,relative);
 if(!file||!file.startsWith(root+'/')&&!file.startsWith(root+'\\')){res.writeHead(404);return res.end();}
 try{const bytes=await readFile(file);res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'})[extname(file)]??'application/octet-stream');res.end(bytes);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(5296,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE??'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:5296'?route.continue():route.abort());
 await page.goto('http://127.0.0.1:5296/explore');await page.getByRole('link',{name:'Sign in',exact:true}).waitFor();
 assert.equal(await page.getByRole('heading',{name:'AI Navigator',exact:true}).count(),0);
 assert.equal(await page.getByRole('link',{name:'Engent Labs home'}).getAttribute('href'),'https://www.engentlabs.com/');
 await page.getByRole('link',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Sign out of this tool',exact:true}).waitFor();
 assert.equal(await page.getByRole('link',{name:'Open Decision Tree Coach with shared sign-in'}).getAttribute('href'),'https://d6owpirihdsus.cloudfront.net/api/shared/login');
 await page.reload();await page.getByRole('button',{name:'Sign out of this tool',exact:true}).waitFor();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert(await page.getByRole('img',{name:'Engent Labs',exact:true}).evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.screenshot({path:`.artifacts/release-a/explore-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);console.log('PASS: compiled Alpha prefix, direct Explore/refresh, optional fixture sign-in, Tree link, no Navigator, logo and desktop/mobile. All external requests blocked; no real OAuth or deployment.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
