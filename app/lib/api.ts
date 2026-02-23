export async function api<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (res.status === 401) {
    window.location.replace("/mobile/login");
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = "Request failed";

    try {
      const error = await res.json();
      message = error.message || message;
    } catch {}

    throw new Error(message);
  }

  return res.json();
}