import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Please upload a JPEG, PNG, or WebP image.` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 });
    }

    const imageId = uuidv4();
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${imageId}.${ext}`;

    const tempDir = path.join(process.cwd(), 'public', 'temp', 'images');
    await mkdir(tempDir, { recursive: true });

    const filePath = path.join(tempDir, fileName);
    await writeFile(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json({
      imageId,
      imageUrl: `/temp/images/${fileName}`,
      fileName,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[upload-image]', err.message);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
