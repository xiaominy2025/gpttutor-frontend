export class PlatformError extends Error {status:number;constructor(status:number,message:string)}
export function digest(value:string):string;
export function cookie(name:string,value:string,seconds:number,sameSite?:string):string;
export function denied():PlatformError;
export type Store = {
 get(id:string):Promise<any>; create(id:string,value:any):Promise<void>;
 replace(id:string,version:number,value:any):Promise<boolean>; remove(id:string,version?:number):Promise<boolean>;
};
export function createOAuth(options:{store:Store;provider:any;origin:string;prefix:string;logoutPath?:string;sessionName?:string;transactionName?:string;now?:()=>number}):{
 login():Promise<{url:string;cookie:string}>;
 complete(query:URLSearchParams,cookies:Record<string,string>):Promise<{id:string;principal:{sub:string};tokens:any;cookies:string[]}>;
 session(cookies:Record<string,string>):Promise<{id:string;sub:string;token:string}|null>;
 logout(cookies:Record<string,string>):Promise<{url:string;cookie:string}>;
};
