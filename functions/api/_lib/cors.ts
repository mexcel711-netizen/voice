export function corsHeaders(origin: string | null, allowedOrigin?: string): Record<string, string> {
  const allow =
    allowedOrigin && allowedOrigin !== '*'
      ? allowedOrigin
      : origin || '*';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export function jsonResponse(
  body: unknown,
  status = 200,
  origin: string | null = null,
  allowedOrigin?: string
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, allowedOrigin),
    },
  });
}
