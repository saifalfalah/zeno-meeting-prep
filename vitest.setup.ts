import { vi } from 'vitest'

// Mock Next.js headers
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (_name: string) => ({ value: "mocked-cookie" }),
    set: vi.fn(),
  }),
  headers: () => ({
    get: (_name: string) => "mocked-header",
  }),
}))

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))
