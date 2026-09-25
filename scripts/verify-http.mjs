import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
const origin=process.env.APP_ORIGIN;
if(!origin||!/^http:\/\/(localhost|127\.0\.0\.1):/.test(origin))throw new Error('HTTP verification is restricted to a local server.');
const db=new PrismaClient();const emails=[];const password=randomUUID();
function client(){let cookie='';return {get cookie(){return cookie},async request(path,method='GET',body,headers={}){const r=await fetch(origin+path,{method,headers:{...(method!=='GET'?{'Content-Type':'application/json',Origin:origin}:{}),...(cookie?{Cookie:cookie}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];const raw=await r.text();return {status:r.status,headers:r.headers,data:r.headers.get('content-type')?.includes('json')?JSON.parse(raw):raw}}}}
const a=client(),b=client();
try{
 assert.equal((await a.request('/api/finance/snapshot')).status,401);
 assert.equal((await a.request('/api/auth/login','POST',{email:'x@example.test',password},{Origin:'https://attacker.example'})).status,403);
 for(const [client,name] of [[a,'A'],[b,'B']]){const email=`http-${randomUUID()}@example.test`;emails.push(email);const signup=await client.request('/api/auth/signup','POST',{email,password,name,currency:'USD',timeZone:'UTC',acceptTerms:true});assert.equal(signup.status,201,JSON.stringify(signup.data));assert.match(signup.headers.get('set-cookie'),/HttpOnly/i);}
 const day=(await a.request('/api/finance/snapshot')).data.today;
 const body={name:'HTTP verification account',kind:'bank',currency:'USD',openingBalance:'1000.00',openingDate:day,idempotencyKey:randomUUID()};
 const account=await a.request('/api/finance/accounts','POST',body);assert.equal(account.status,201,JSON.stringify(account.data));const id=account.data.id;
 const duplicate=await a.request('/api/finance/accounts','POST',body);assert.equal(duplicate.data.id,id);
 const expense={accountId:id,kind:'expense',description:'Verification purchase',category:'Food & groceries',amount:'12.34',date:day,idempotencyKey:randomUUID()};
 assert.equal((await b.request('/api/finance/transactions','POST',expense)).status,404);
 assert.equal((await a.request('/api/finance/transactions','POST',expense)).status,201);
 assert.equal((await a.request('/api/finance/transactions','POST',expense)).status,201);
 assert.equal((await a.request('/api/finance/snapshot')).data.summaries[0].balance,'98766');
 assert.equal((await b.request('/api/finance/snapshot')).data.accounts.length,0);
 assert.equal((await a.request('/api/finance/transactions','POST',{...expense,amount:'0.001',idempotencyKey:randomUUID()})).status,400);
 const exportFile=await a.request('/api/finance/export');assert.equal(exportFile.status,200);assert.match(exportFile.data,/Verification purchase/);
 const fullExport=await a.request('/api/finance/full-export');assert.equal(fullExport.status,200);assert.equal(fullExport.data.format,'expenses-tracker-export');assert.equal(fullExport.data.policyAcceptances.length,2);
 const oldCookie=a.cookie;assert.equal((await a.request('/api/auth/logout','POST')).status,200);assert.equal((await a.request('/api/finance/snapshot','GET',undefined,{Cookie:oldCookie})).status,401);
 assert.equal((await a.request('/api/auth/login','POST',{email:emails[0],password:'wrong-password'})).status,401);
 assert.equal((await a.request('/api/auth/login','POST',{email:emails[0],password})).status,200);
 assert.equal((await a.request('/api/finance/snapshot')).data.accounts[0].balance,'98766');
 console.log('PASS: signup, HttpOnly sessions, origin protection, account creation/retry, expenses/retry, user isolation, validation, export, logout revocation, and login persistence.');
}finally{await db.user.deleteMany({where:{email:{in:emails}}});await db.$disconnect()}
