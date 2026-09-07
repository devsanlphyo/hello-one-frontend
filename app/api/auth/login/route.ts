import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5173";
    const backendRes = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to sign in" },
        { status: backendRes.status },
      );
    }

    const { accessToken, user } = data;

    const response = NextResponse.json({
      isSuccess: true,
      message: data.message || "Login successful",
      user,
    });

    response.cookies.set({
      name: "auth_token",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error during login" },
      { status: 500 },
    );
  }
}
