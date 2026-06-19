import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ ok: false, error: '请填写账号和密码' }, { status: 400 });
  }
  const result = await login(username, password);
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
