import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sustconnect.vercel.app'
  return {
    rules: [{ userAgent: '*', allow: ['/','/post/','/jobs','/notices','/tuition','/sell'], disallow: ['/dm','/crush','/settings','/admin','/auth/','/api/','/confessions','/notifications'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
