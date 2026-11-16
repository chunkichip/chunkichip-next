require('dotenv').config();
const next = require('next');
const express = require('express');
const createOperations = require('./api/operations');

async function start() {
 const port=Number(process.env.PORT || 3001);
 const nextApp=next({dev:false,hostname:'0.0.0.0',port});
 await nextApp.prepare();
 const handle=nextApp.getRequestHandler();
 const app=express();app.disable('x-powered-by');
 app.use((_req,res,next)=>{res.set('X-Robots-Tag','noindex, nofollow');next();});
 app.use(createOperations());
 app.get('/',(_req,res)=>res.redirect(302,'/admin'));
 app.use((req,res)=>{
  if(req.path==='/admin' || req.path.startsWith('/_next/') || req.path==='/icon.png' || req.path==='/favicon.ico')return handle(req,res);
  return res.status(404).send('Page not found.');
 });
 const server=app.listen(port,'0.0.0.0',()=>console.log(`Chunki Chip operations listening on ${port}`));
 process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
 return server;
}
if(require.main===module)start().catch(error=>{console.error('Operations startup failed:',error.message);process.exit(1);});
module.exports={start};
