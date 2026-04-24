import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const API_URL = process.env.API_URL; // server-only var ✅

export async function POST(request: NextRequest) {
    // Guard: env vars
    if (!API_URL) {
        console.error('[signup] FATAL: API_URL not defined in .env.local');
        return NextResponse.json({ error: 'Server misconfiguration: API_URL not set.' }, { status: 500 });
    }

    // Parse body
    let body: { email: string; password: string; orgName: string; fullName: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { email, password, orgName, fullName } = body;
    if (!email || !password || !orgName || !fullName) {
        return NextResponse.json({ error: 'email, password, orgName and fullName are required.' }, { status: 400 });
    }

    // Step 1: Supabase Auth signup with role: 'member' to bypass DB constraint
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'member',       // ← bypass president/org_id constraint
                full_name: fullName,
                org_name: orgName,
            },
        },
    });

    if (authError) {
        console.error('[signup] Supabase Auth error:', authError.message);
        return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;
    const session = authData.session;

    if (!user) {
        return NextResponse.json({ error: 'Auth signup succeeded but no user returned.' }, { status: 500 });
    }

    console.log(`[signup] Step 1 done. User: ${user.id}`);

    // Step 2: Call FastAPI to create org + upgrade role to president
    let fastApiResponse: Response;
    try {
        fastApiResponse = await fetch(`${API_URL}/v1/onboarding/create-president`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
                user_id: user.id,
                org_name: orgName,
                full_name: fullName,
                email: user.email,
            }),
        });
    } catch (networkError) {
        console.error('[signup] FastAPI unreachable:', networkError);
        return NextResponse.json({
            error: 'Account created but org setup failed: backend unreachable.',
            userId: user.id,
            partialSuccess: true,
        }, { status: 503 });
    }

    if (!fastApiResponse.ok) {
        const detail = await fastApiResponse.text();
        console.error(`[signup] FastAPI error ${fastApiResponse.status}:`, detail);
        return NextResponse.json({
            error: `Org setup failed: ${detail}`,
            userId: user.id,
            partialSuccess: true,
        }, { status: fastApiResponse.status });
    }

    const orgData = await fastApiResponse.json();
    console.log('[signup] Step 2 done. Org:', orgData.org_id);

    return NextResponse.json({
        success: true,
        userId: user.id,
        orgId: orgData.org_id,
        session: session ?? null,
    }, { status: 201 });
}