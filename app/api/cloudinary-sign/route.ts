import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const folder = url.searchParams.get('folder') || 'products';

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary config missing:', { cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
      return NextResponse.json({ error: 'Cloudinary configuration missing' }, { status: 500 });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );

    console.log('Generated Cloudinary signature:', { timestamp, signature, apiKey, cloudName, folder });

    return NextResponse.json({ signature, timestamp, apiKey, cloudName });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to generate signature', details: (error as Error).message }, { status: 500 });
  }
}