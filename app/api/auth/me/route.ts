import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
      });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5173";
    const backendRes = await fetch(`${apiUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendRes.ok) {
      const response = NextResponse.json(
        { isAuthenticated: false, user: null },
        { status: 401 },
      );
      response.cookies.set({
        name: "auth_token",
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const data = await backendRes.json();
    return NextResponse.json({
      isAuthenticated: true,
      user: data.profile,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        isAuthenticated: false,
        user: null,
        message: error?.message || "Failed to fetch current user session",
      },
      { status: 500 },
    );
  }
}
