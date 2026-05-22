import { NextResponse } from "next/server";
import { signCloudinaryUpload } from "@/lib/media/cloudinary";

export async function POST(request: Request) {
  try {
    const { folder, resourceType } = (await request.json()) as {
      folder?: string;
      resourceType?: "image" | "video";
    };

    if (!folder || !resourceType) {
      return NextResponse.json({ error: "Missing upload parameters." }, { status: 400 });
    }

    const signature = signCloudinaryUpload({ folder, resourceType });
    return NextResponse.json(signature);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to sign upload." }, { status: 500 });
  }
}
