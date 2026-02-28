const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

async function getHealth() {
  try {
    const response = await fetch(`${backendBaseUrl}/health`, { cache: "no-store" });
    if (!response.ok) return "backend indisponible";
    const data = (await response.json()) as { status: string };
    return data.status;
  } catch {
    return "backend non joignable";
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="container">
      <h1>BuildShield AI</h1>
      <p>Architecture MVP: Next.js + backend serverless AWS</p>
      <p>
        Statut API: <strong>{health}</strong>
      </p>
      <ul>
        <li>Quote Intelligence</li>
        <li>Contract Protection</li>
        <li>Cash Flow Radar</li>
      </ul>
    </main>
  );
}
