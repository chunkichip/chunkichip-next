import type { NextConfig } from 'next';
const nextConfig:NextConfig = {
  async redirects(){return [
    {source:'/:path*',has:[{type:'host',value:'www.chunkichip.com'}],destination:'https://chunkichip.com/:path*',permanent:true},
    {source:'/jobs',destination:'/careers',permanent:true},
    {source:'/menu',destination:'/#menu',permanent:true},
    {source:'/donation-requests',destination:'/contact',permanent:true},
    {source:'/product/chiptinis-catering/:id',destination:'/catering',permanent:true},
    {source:'/product/full-size-cookie-catering/:id',destination:'/catering',permanent:true},
    {source:'/product/:slug/:id',destination:'/product/:id',permanent:true},
    {source:'/shop/catering/:id',destination:'/catering',permanent:true},
    {source:'/shop/nationwide-shipping/:id',destination:'/#shipping-boxes',permanent:true},
    {source:'/shop/cookie-boxes-shipped/:id',destination:'/#shipping-boxes',permanent:true},
    {source:'/shop/gift-boxes/:id',destination:'/#shipping-boxes',permanent:true},
    {source:'/shop/boxes/:id',destination:'/#boxes',permanent:true},
    {source:'/shop/chunki-chip/:id',destination:'/#single-cookies',permanent:true},
    {source:'/shop/cookies/:id',destination:'/#single-cookies',permanent:true},
    {source:'/shop/drinks/:id',destination:'/#menu',permanent:true},
    {source:'/shop/all/:id',destination:'/#menu',permanent:true},
  ];},
};
export default nextConfig;
