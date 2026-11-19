import {CognitoJwtVerifier} from 'aws-jwt-verify';
import {PlatformError, denied} from './oauth.mjs';
export function cognitoProvider({poolId,clientId,domain,fetcher=fetch}) {
 const base='https://'+domain;
 const access=CognitoJwtVerifier.create({userPoolId:poolId,clientId,tokenUse:'access'});
 const identity=CognitoJwtVerifier.create({userPoolId:poolId,clientId,tokenUse:'id'});
 async function form(path,values) {
  const result=await fetcher(base+path,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams(values),signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!result.ok) throw new PlatformError(503,'Sign-in service is unavailable.');
  return result;
 }
 return {
  authorize({state,nonce,challenge,callback}) {
   return base+'/oauth2/authorize?'+new URLSearchParams({client_id:clientId,response_type:'code',
    scope:'openid email aws.cognito.signin.user.admin',redirect_uri:callback,state,nonce,
    code_challenge:challenge,code_challenge_method:'S256'});
  },
  async exchange({code,verifier,callback}) {
   return (await form('/oauth2/token',{grant_type:'authorization_code',client_id:clientId,code,code_verifier:verifier,redirect_uri:callback})).json();
  },
  async identity(tokens,nonce) {
   const [id,token]=await Promise.all([identity.verify(tokens.id_token),access.verify(tokens.access_token)]);
   if(id.nonce!==nonce || !id.email_verified || typeof id.email!=='string' || id.sub!==token.sub) throw denied();
   return {sub:id.sub};
  },
  access: token=>access.verify(token),
  async refresh(token) { return (await form('/oauth2/token',{grant_type:'refresh_token',client_id:clientId,refresh_token:token})).json(); },
  async revoke(token) { await form('/oauth2/revoke',{client_id:clientId,token}); },
  logout(uri) { return base+'/logout?'+new URLSearchParams({client_id:clientId,logout_uri:uri}); }
 };
}
