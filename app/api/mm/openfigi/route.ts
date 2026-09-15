import { NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ error: 'Use Premium instrument search in your dashboard.' }, { status: 410 }) }
export async function POST() { return GET() }
