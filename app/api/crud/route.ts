import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.API_URL;

export async function POST(req: NextRequest) {
  try {
    // Ambil endpoint dari custom header
    const endpoint = req.headers.get('X-ENDPOINT');

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing X-ENDPOINT header' }, { status: 400 });
    }

    // Ambil body dari request
    const body = await req.json();

    // Kirim ke endpoint yang diberikan
    const res = await axios.post(`${API_BASE_URL}/${endpoint}`, body, {
      headers: {
        'Content-Type': 'application/json',
        // Jika kamu pakai token juga nanti, tinggal aktifkan ini:
        // Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(res.data);
  } catch (error: any) {
    console.log(error)
    return NextResponse.json(
      { message: error.response.data.message || error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
