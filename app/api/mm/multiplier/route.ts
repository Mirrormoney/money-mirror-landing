import { NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ error: 'Use the signed-in comparison dashboard.' }, { status: 410 }) }
export async function POST() { return GET() }
