// Farcaster Mini App webhook endpoint
// This receives event notifications from Farcaster (e.g., app added/removed)
export async function POST(request) {
  try {
    const body = await request.json();
    // Log the event for debugging (visible in Vercel logs)
    console.log("Farcaster webhook event:", JSON.stringify(body));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
