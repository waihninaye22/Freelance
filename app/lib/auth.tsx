import { createContext, useContext } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getToken, setToken, type Result, type User } from "./api"

type AuthContextValue = { user: User | null; isLoading: boolean; signOut: () => void }
const AuthContext = createContext<AuthContextValue>({ user: null, isLoading: false, signOut: () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const auth = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => (await api.get<Result<User>>("/auth/me")).data,
    enabled: Boolean(getToken()),
    retry: false,
    staleTime: 60_000,
  })
  const signOut = () => {
    setToken(null)
    queryClient.setQueryData(["auth", "me"], null)
    void api.post("/auth/logout").catch(() => undefined)
    void queryClient.cancelQueries()
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" })
  }
  return <AuthContext.Provider value={{ user: auth.data ?? null, isLoading: auth.isLoading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
