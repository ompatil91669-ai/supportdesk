export type UserRole = "Customer" | "Agent" | "Admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: User;
}

export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  meta: Record<string, unknown>;
}

export class ApiError extends Error {
  public status: number;
  public code: string;

  constructor(
    status: number,
    code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not configured");
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Cannot connect to the server. Please try again."
    );
  }

  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "Unexpected server response."
    );
  }

  if (!response.ok || result.error) {
    if (response.status === 401 && accessToken) {
      setAccessToken(null);
    }

    throw new ApiError(
      response.status,
      result.error?.code ?? "API_ERROR",
      result.error?.message ?? "Something went wrong."
    );
  }

  if (result.data === null) {
    throw new ApiError(
      response.status,
      "EMPTY_RESPONSE",
      "Server returned no data."
    );
  }

  return result.data;
}

export function loginApi(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
export async function apiRequestWithMeta<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
      { ...options, headers }
    );
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Cannot connect to the server. Please try again."
    );
  }

  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "Unexpected server response."
    );
  }

  if (!response.ok || result.error) {
    if (response.status === 401 && accessToken) {
      setAccessToken(null);
    }

    throw new ApiError(
      response.status,
      result.error?.code ?? "API_ERROR",
      result.error?.message ?? "Something went wrong."
    );
  }

  if (result.data === null) {
    throw new ApiError(
      response.status,
      "EMPTY_RESPONSE",
      "Server returned no data."
    );
  }

  return result;
}

export interface StreamApiCallbacks {
  onDelta: (text: string) => void;
  onComplete: () => void;
  onError: (code: string, message: string) => void;
  onInterrupted: () => void;
}

export async function streamApiRequest(
  endpoint: string,
  callbacks: StreamApiCallbacks,
  options: RequestInit = {}
): Promise<void> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "text/event-stream");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
      { ...options, headers }
    );
  } catch {
    if (options.signal?.aborted) {
      callbacks.onInterrupted();
    } else {
      callbacks.onError("NETWORK_ERROR", "Cannot connect to the server.");
    }
    return;
  }

  if (!response.ok) {
    try {
      const result = (await response.json()) as ApiResponse<unknown>;
      callbacks.onError(
        result.error?.code ?? "API_ERROR",
        result.error?.message ?? "The AI request failed."
      );
    } catch {
      callbacks.onError(
        "INVALID_RESPONSE",
        "The server returned an unexpected response."
      );
    }
    return;
  }

  if (!response.body) {
    callbacks.onInterrupted();
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  let failed = false;

  function fail(code: string, message: string) {
    if (failed || completed) return;
    failed = true;
    callbacks.onError(code, message);
  }

  function processEvent(block: string) {
    if (failed || completed) return;
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trimStart());
      }
    }

    if (dataLines.length === 0) return;
    const payload = dataLines.join("\n");
    let data: unknown;
    try {
      data = JSON.parse(payload);
    } catch {
      fail("INVALID_STREAM", "The AI stream returned invalid data.");
      return;
    }

    if (eventName === "delta") {
      if (
        typeof data === "object" &&
        data !== null &&
        "text" in data &&
        typeof data.text === "string"
      ) {
        callbacks.onDelta(data.text);
      } else {
        fail("INVALID_STREAM", "The AI stream returned invalid data.");
      }
    } else if (eventName === "complete") {
      completed = true;
      callbacks.onComplete();
    } else if (eventName === "error") {
      if (
        typeof data === "object" &&
        data !== null &&
        "code" in data &&
        typeof data.code === "string" &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        fail(data.code, data.message);
      } else {
        fail("INVALID_STREAM", "The AI stream returned invalid data.");
      }
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex >= 0) {
        processEvent(buffer.slice(0, separatorIndex));
        buffer = buffer.slice(separatorIndex + 2);
        if (failed) break;
        separatorIndex = buffer.indexOf("\n\n");
      }
      if (failed) {
        await reader.cancel();
        break;
      }
    }

    if (!failed) {
      buffer += decoder.decode();
      if (buffer.trim()) processEvent(buffer);
    }
    if (!completed && !failed) callbacks.onInterrupted();
  } catch {
    if (options.signal?.aborted || (!completed && !failed)) {
      callbacks.onInterrupted();
    }
  }
}