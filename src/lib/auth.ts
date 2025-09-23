import NextAuth from "next-auth";
// import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "./api/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          image: user.image,
        };
      },
    }),
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        joinCode: { label: "Join Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.joinCode) {
          return null;
        }

        const player = await prisma.player.findUnique({
          where: { joinCode: credentials.joinCode as string },
          include: {
            session: {
              select: {
                id: true,
                name: true,
                status: true,
                allowGuestJoin: true,
              },
            },
          },
        });

        if (
          !player ||
          !player.session.allowGuestJoin ||
          player.session.status === "FINISHED"
        ) {
          return null;
        }

        return {
          id: `guest_${player.id}`,
          // email: `guest_${player.id}@badminton.local`,
          name: player.name || `Player ${player.playerNumber}`,
          role: UserRole.GUEST,
          playerId: player.id,
          sessionId: player.sessionId,
          playerNumber: player.playerNumber,
          requireConfirmInfo: player.requireConfirmInfo,
          confirmedByPlayer: player.confirmedByPlayer,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        if (user.role === UserRole.PLAYER || user.role === UserRole.GUEST) {
          token.playerId = (user as any).playerId;
          token.sessionId = (user as any).sessionId;
          token.playerNumber = (user as any).playerNumber;
          token.requireConfirmInfo = (user as any).requireConfirmInfo;
          token.confirmedByPlayer = (user as any).confirmedByPlayer;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        // Add player-specific fields
        if (token.role === UserRole.PLAYER || token.role === UserRole.GUEST) {
          (session.user as any).playerId = (token as any).playerId;
          (session.user as any).sessionId = (token as any).sessionId;
          (session.user as any).playerNumber = (token as any).playerNumber;
          (session.user as any).requireConfirmInfo = (
            token as any
          ).requireConfirmInfo;
          (session.user as any).confirmedByPlayer = (
            token as any
          ).confirmedByPlayer;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  // trustHost: true,
});
