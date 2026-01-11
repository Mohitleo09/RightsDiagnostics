import { auth } from '@/app/auth'

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth()
    console.log('Session API - session:', session);

    if (!session) {
      console.log('Session API - No session found');
      return new Response(
        JSON.stringify({ message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Session API - Session found, returning session data');
    return new Response(
      JSON.stringify(session),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Session API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}