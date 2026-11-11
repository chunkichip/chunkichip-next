import 'server-only';
import { cache } from 'react';
import { getWeeklyFlavors, isInternalPackaging } from './catalog';

export type SeoProduct = {
  id:string; name:string; description:string; imageUrl:string|null; variationId:string|null;
  priceAmount:number; price:string; isBox:boolean; boxSize:string|null; shippingOnly?:boolean; thisWeekOnly?:boolean;
  modifierSets?:{id:string;name:string;minSelected:number;maxSelected:number;modifiers:{id:string;name:string;description?:string;imageUrl?:string|null;priceAmount:number;price:string;soldOut?:boolean;thisWeekOnly?:boolean}[]}[];
};
export const getPublicCatalog = cache(async ():Promise<SeoProduct[]|null> => {
  const origin = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
  try {
    const response = await fetch(`${origin.replace(/\/$/,'')}/api/products`, {next:{revalidate:300},signal:AbortSignal.timeout(8000)});
    if(!response.ok) return null;
    const data = await response.json();
    if(!Array.isArray(data)) return null;
    return data.filter(p=>p && typeof p.id==='string' && typeof p.name==='string' && !isInternalPackaging(p) && !/catering/i.test(p.name));
  } catch { return null; }
});
export function catalogPages(products:SeoProduct[]):SeoProduct[] {
  const pages = new Map(products.map(p=>[p.id,p]));
  for(const flavor of getWeeklyFlavors(products)) {
    if(!pages.has(flavor.id)) pages.set(flavor.id,{...flavor,description:flavor.description || '',imageUrl:flavor.imageUrl || null,variationId:null,priceAmount:flavor.priceAmount || 0,price:flavor.price || '',isBox:false,boxSize:null,shippingOnly:false,modifierSets:[]});
  }
  return [...pages.values()];
}
export function plainDescription(value:string) {
  return value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
}
