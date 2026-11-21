// Integrate the two independently built frontends with local Guest fixtures only.
import{chromium}from'@playwright/test';
import{readFileSync,existsSync,mkdirSync,writeFileSync}from'node:fs';
import{resolve,extname}from'node:path';
if(!process.argv[2])throw Error('Supply the reviewed Process web artifact directory');
const processWeb=resolve(process.argv[2]),website=resolve(process.argv[3]??'.artifacts/release-b-alpha-enabled/web');
const origin='https://d6owpirihdsus.cloudfront.net',out=resolve('.artifacts/ui-refinement-20261121');
mkdirSync(out,{recursive:true});const results=[];
const browser=await chromium.launch({channel:'chrome',headless:false});
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await context.addInitScript(()=>{window.showOpenFilePicker=undefined;window.showSaveFilePicker=undefined;});
 await context.route('**/*',route=>{
  const q=route.request(),u=new URL(q.url());
  if(u.origin!==origin||!['GET','HEAD'].includes(q.method()))return route.abort();
  if(u.pathname.startsWith('/api/')){
   if(u.pathname==='/api/platform/session')return route.fulfill({json:{signedIn:false,role:'guest'}});
   if(u.pathname==='/api/process/workbook/status')return route.fulfill({json:{mode:'live',access:'guest',aiEnabled:false,model:'fixture'}});
   return route.abort();
  }
  const coach=u.pathname.startsWith('/process/'),root=coach?processWeb:website;
  const relative=decodeURIComponent(coach?u.pathname.slice(9):u.pathname.startsWith('/engent-alpha/')?u.pathname.slice(14):u.pathname.slice(1));
  if(relative.includes('..'))return route.abort();
  const file=existsSync(root+'/'+relative)&&extname(relative)?root+'/'+relative:root+'/index.html';
  const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf','.mp3':'audio/mpeg','.txt':'text/plain'}[extname(file)];
  return route.fulfill({body:readFileSync(file),contentType:type??'application/octet-stream'});
 });
 const page=await context.newPage(); let navigationConfirmations=0; page.on('dialog',async dialog=>{if(dialog.type()!=='confirm'||!dialog.message().includes('unsaved file changes'))throw Error('Unexpected dialog');navigationConfirmations++;await dialog.accept();});
 for(const width of[1440,1024,768,390]){
  await page.setViewportSize({width,height:900});await page.goto(origin+'/explore');
  await page.getByRole('link',{name:'Launch Decision Process Coach',exact:true}).click();
  await page.waitForURL(origin+'/process/');
  const decision=page.getByRole('textbox',{name:'Define Your Decision',exact:true});await decision.waitFor();
  const text='Synthetic paired UI recovery test at '+width+'px.';await decision.fill(text);
  await page.waitForFunction(value=>new Promise(done=>{const r=indexedDB.open('engent-structured-decision-workbook',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('projects').objectStore('projects').get('active');q.onsuccess=()=>{db.close();done(q.result?.includes(value));};};}),text);
  await page.reload();if(await decision.inputValue()!==text)throw Error('Reload recovery failed');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Process horizontal overflow');
  await page.screenshot({path:out+'/paired-process-'+width+'.png'});
  await page.getByRole('link',{name:'Explore Coaches',exact:true}).click();await page.waitForURL(origin+'/explore');
  await page.getByRole('link',{name:'Launch Decision Process Coach',exact:true}).waitFor();
  const nested=await page.evaluate(()=>[document.body,document.getElementById('root')].some(e=>e.scrollHeight>e.clientHeight+1&&['auto','scroll'].includes(getComputedStyle(e).overflowY)));
  if(nested)throw Error('Nested scroll returned after cross-app navigation');
  await page.getByRole('link',{name:'Launch Decision Process Coach',exact:true}).click();await decision.waitFor();
  if(await decision.inputValue()!==text)throw Error('Cross-app navigation lost local recovery');
  results.push({width,exploreLaunch:true,realProcessFrontend:true,reloadRecovery:true,returnToExplore:true,recoveryAfterReturn:true,horizontalOverflow:false,nestedExploreScroll:false});
 }
 writeFileSync(out+'/paired-navigation-results.json',JSON.stringify({passed:true,results,navigationConfirmations,realApiCalls:0,paidCalls:0,ownerFilesUsed:false},null,2));
 console.log(JSON.stringify({passed:true,widths:results.length,realApiCalls:0,paidCalls:0}));await context.close();
}finally{await browser.close();}


