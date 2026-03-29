import NextAuth from "next-auth"
import "next-auth/jwt"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No adapter — we use JWT sessions only. The "clients" table in Supabase
  // is our user store; NextAuth adapter tables (users/accounts/sessions) don't exist.
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) return null

        // Check admin password (simple auth for client dashboard)
        const adminPassword = process.env.ADMIN_PASSWORD
        if (adminPassword && password === adminPassword) {
          // Look up client in Supabase clients table
          const { data: client } = await supabaseAdmin
            .from("clients")
            .select("id, name, email")
            .eq("email", email)
            .single()

          if (client) {
            return {
              id: client.id,
              name: client.name || email.split("@")[0],
              email: client.email,
            }
          }

          // Email not found in clients table but password is correct —
          // auto-create a client record so new users can sign in immediately
          const { data: newClient, error } = await supabaseAdmin
            .from("clients")
            .insert({
              email,
              name: email.split("@")[0],
              plan: "free",
              status: "active",
            })
            .select("id, name, email")
            .single()

          if (newClient && !error) {
            return {
              id: newClient.id,
              name: newClient.name,
              email: newClient.email,
            }
          }

          return null
        }

        return null
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
})
