import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    hf: isSet(process.env.HF_API_KEY),
    luma: isSet(process.env.LUMA_API_KEY),
    runway: isSet(process.env.RUNWAYML_API_SECRET),
    fal: isSet(process.env.FAL_KEY),
  };

  return NextResponse.json(status);
}

function isSet(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0 && !value.startsWith('your_');
}
