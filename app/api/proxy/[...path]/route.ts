import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

async function proxyHandler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const subpath = path.join("/");

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5173";
    const queryString = request.nextUrl.search;
    const targetUrl = `${apiUrl}/${subpath}${queryString}`;

    const headers = new Headers();
    const incomingContentType = request.headers.get("content-type");
    if (incomingContentType) {
      headers.set("content-type", incomingContentType);
    }
    const incomingDeviceId = request.headers.get("x-device-id");
    if (incomingDeviceId) {
      headers.set("x-device-id", incomingDeviceId);
    }
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const init: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        headers.delete("content-type");
        init.body = formData;
      } else {
        const bodyBuffer = await request.arrayBuffer();
        if (bodyBuffer.byteLength > 0) {
          init.body = bodyBuffer;
        }
      }
    }

    const backendRes = await fetch(targetUrl, init);

    const responseContentType = backendRes.headers.get("content-type") || "";
    if (responseContentType.includes("application/json")) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    } else {
      const text = await backendRes.text();
      return new NextResponse(text, {
        status: backendRes.status,
        headers: { "content-type": responseContentType || "text/plain" },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to proxy request" },
      { status: 500 },
    );
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const PATCH = proxyHandler;
export const DELETE = proxyHandler;
