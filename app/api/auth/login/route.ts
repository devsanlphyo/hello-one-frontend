import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, deviceId, deviceName } = body;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5173";

    const userAgent = request.headers.get("user-agent") || "";
    const forwardedFor = request.headers.get("x-forwarded-for") || "";

    const backendRes = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      body: JSON.stringify({ email, password, deviceId, deviceName }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to sign in" },
        { status: backendRes.status },
      );
    }

    // Check if device approval is required
    if (data.requiresApproval) {
      return NextResponse.json({
        isSuccess: false,
        requiresApproval: true,
        deviceStatus: data.deviceStatus || "pending",
        message:
          data.message ||
          "This device is awaiting administrator approval before you can sign in.",
      });
    }

    const { accessToken, user } = data;

    const response = NextResponse.json({
      isSuccess: true,
      message: data.message || "Login successful",
      user,
    });

    if (accessToken) {
      response.cookies.set({
        name: "auth_token",
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error during login" },
      { status: 500 },
    );
  }
}
