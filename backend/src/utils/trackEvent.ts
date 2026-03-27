// ─────────────────────────────────────────────────────────────────────────────
// trackEvent.ts — pegar este archivo en Silver Star: src/utils/trackEvent.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fire and forget: nunca bloquea, nunca lanza error al cliente.
// Si el monitor está caído, Silver Star sigue funcionando sin enterarse.

const MONITOR_URL = process.env.MONITOR_URL;
const MONITOR_API_KEY = process.env.MONITOR_API_KEY;

type EventType =
    | "ai.query.success"
    | "ai.query.failed"
    | "error.server"
    | "error.unhandled"
    | "auth.login"
    | "payment.created";

export function trackEvent(
    eventType: EventType,
    payload: Record<string, unknown>
): void {
    console.log('[trackEvent] MONITOR_URL:', MONITOR_URL)
    console.log('[trackEvent] MONITOR_API_KEY:', MONITOR_API_KEY ? 'set' : 'NOT SET')

    if (!MONITOR_URL || !MONITOR_API_KEY) {
        console.log('[trackEvent] Skipping — env vars not set')
        return
    }

    // Fire and forget — sin await intencional
    fetch(`${MONITOR_URL}/track`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MONITOR_API_KEY}`,
        },
        body: JSON.stringify({ eventType, payload }),
    }).then(res => {
        console.log('[trackEvent] Response status:', res.status)
    }).catch((err) => {
        console.log('[trackEvent] Fetch error:', err.message)
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejemplos de uso en Silver Star:
// ─────────────────────────────────────────────────────────────────────────────

/*
// En src/routes/ai.ts
import { trackEvent } from "../utils/trackEvent";

const startTime = Date.now();
try {
  const response = await anthropic.messages.create({ ... });

  trackEvent("ai.query.success", {
    model: response.model,
    tokens_in: response.usage.input_tokens,
    tokens_out: response.usage.output_tokens,
    cost_usd: calcCost(response.usage),   // implementar según modelo
    duration_ms: Date.now() - startTime,
  });

} catch (error: any) {
  trackEvent("ai.query.failed", {
    error_type: error.type ?? "unknown",           // "rate_limit", "timeout", etc.
    error_message: error.message?.slice(0, 200),
    prompt_length: userMessage?.length ?? 0,
    duration_ms: Date.now() - startTime,
  });
  throw error; // re-lanzar para que el cliente reciba el error
}

// En src/routes/auth.ts — login exitoso
trackEvent("auth.login", { userId, success: true });

// En src/routes/auth.ts — login fallido
trackEvent("auth.login", { email, success: false });

// En src/routes/payments.ts — pago registrado
trackEvent("payment.created", { paymentId });

// En src/index.ts — middleware global de errores (al final de todos los middleware)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  trackEvent("error.server", {
    route: req.path,
    method: req.method,
    status_code: err.status ?? 500,
    message: err.message?.slice(0, 200),
  });
  res.status(err.status ?? 500).json({ error: "Internal server error" });
});
*/