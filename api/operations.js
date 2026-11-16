const express = require('express');
const { SquareClient, SquareEnvironment } = require('square');
const { currentFlavors } = require('./productionEngine');

// Independent API: no customer checkout routes, shipping, or catering startup jobs.
module.exports = function operations({ square, env = process.env } = {}) {
 const app = express();
 app.use(express.json({ limit: '1mb' }));
 const client = square || (env.SQUARE_ACCESS_TOKEN ? new SquareClient({token:env.SQUARE_ACCESS_TOKEN,environment:env.SQUARE_ENV==='production'?SquareEnvironment.Production:SquareEnvironment.Sandbox}) : null);
 const configuredLocations = () => [
  {id:'milford',name:'Milford',squareLocationId:env.SQUARE_LOCATION_ID_MILFORD || env.SQUARE_LOCATION_ID},
  {id:'nashua',name:'Nashua',squareLocationId:env.SQUARE_LOCATION_ID_NASHUA},
 ].filter(l=>l.squareLocationId);
 async function searchCatalog(objectTypes) {
  if(!client)throw new Error('Square connection is not configured.');
  const out=[];let cursor;
  do {const page=await client.catalog.search({objectTypes,limit:100,cursor});out.push(...(page.objects || []));cursor=page.cursor;}while(cursor);
  return out;
 }
 app.use((req,res,next)=>{res.set('Cache-Control','no-store');res.set('X-Robots-Tag','noindex, nofollow');next();});
 app.get('/api/health',(_req,res)=>res.json({ok:true,app:'chunki-operations',squareConfigured:Boolean(client)}));
 app.get('/api/locations',(_req,res)=>res.json(configuredLocations().map(({id,name})=>({id,name}))));
 app.use('/api/production',require('./production')({configuredLocations,searchCatalog}));
 // The editor needs the active flavor names and IDs; images and customer
 // checkout data are intentionally unnecessary for this catalog response.
 app.get('/api/products',async(_req,res)=>{
  try {
   const [items,lists]=await Promise.all([searchCatalog(['ITEM']),searchCatalog(['MODIFIER_LIST'])]);
   const flavors=new Map();
   for(const location of configuredLocations())for(const f of currentFlavors(items,lists,location.squareLocationId))flavors.set(f.id,f);
   res.json([{id:'operations-menu',name:'1 Cookie Box',isBox:true,modifierSets:[{modifiers:[...flavors.values()]}]}]);
  }catch{res.status(503).json({error:'Could not load Square flavors.'});}
 });
 app.use('/api',(_req,res)=>res.status(404).json({error:'This endpoint is not part of the operations app.'}));
 return app;
};
