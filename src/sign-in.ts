import { request, RequestError } from "./api";
import type { Me } from "../shared/contracts";

/** Retry only the read-only session check, with a finite number of attempts. */
export async function checkSignIn(onRetry: () => void = () => {}): Promise<Me> {
  const delays = [750, 1500, 3000];
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await request("/me", { signal: AbortSignal.timeout(8000) }, false);
      return await response.json() as Me;
    } catch (error) {
      const temporary = error instanceof RequestError
        ? error.status === 429 || error.status >= 500
        : error instanceof TypeError || (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name));
      const retryAfter = error instanceof RequestError ? error.retryAfterMs : 0;
      if (!temporary || attempt >= delays.length || retryAfter > 10_000) throw error;
      onRetry();
      await new Promise(resolve => setTimeout(resolve, Math.max(delays[attempt], retryAfter)));
    }
  }
}
