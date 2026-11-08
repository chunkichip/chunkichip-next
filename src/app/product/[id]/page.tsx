import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { catalogPages, getPublicCatalog, plainDescription } from '@/lib/seo-catalog';
import ProductPage from './ProductPage';

type Props = {params:Promise<{id:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const {id}=await params;
  const products=await getPublicCatalog();
  const product=products ? catalogPages(products).find(p=>p.id===id) : null;
  if(!product) return {title:'Cookie Menu | Chunki Chip',robots:{index:false,follow:true}};
  const title=`${product.name} | Chunki Chip`;
  const description=(plainDescription(product.description) || `Order ${product.name} from Chunki Chip in Milford, NH. Explore fresh-baked cookies, pickup, and shipping options.`).slice(0,165);
  const image=product.imageUrl || '/hero-customers.webp';
  return {title,description,alternates:{canonical:`/product/${encodeURIComponent(id)}`},
    openGraph:{title,description,url:`https://chunkichip.com/product/${encodeURIComponent(id)}`,type:'website',images:[{url:image,alt:product.name}]},
    twitter:{card:'summary_large_image',title,description,images:[image]},
  };
}
export default async function Page({params}:Props) {
  const {id}=await params;
  const products=await getPublicCatalog();
  const product=products ? catalogPages(products).find(p=>p.id===id) : null;
  if(products && !product) notFound();
  const breadcrumb=product ? {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'Chunki Chip',item:'https://chunkichip.com/'},
    {'@type':'ListItem',position:2,name:product.name,item:`https://chunkichip.com/product/${encodeURIComponent(id)}`},
  ]} : null;
  return <>{breadcrumb&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumb).replace(/</g,'\\u003c')}}/>}<ProductPage params={params} initialProduct={product} initialProducts={products || []}/></>;
}
