import { PrismaClient } from "@/generated/prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { appInvite } from "@better-auth-extended/app-invite";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT) || 3307,
  user: process.env.DATABASE_USER || "dadban",
  password: process.env.DATABASE_PASSWORD || "dadban_secret",
  database: process.env.DATABASE_NAME || "dadban",
  connectionLimit: 5,
});

const client = new PrismaClient({ adapter });

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(client, { provider: "mysql" }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // invite-only: sign up only via invitation
  },
  plugins: [
    appInvite({
      sendInvitationEmail: async (data) => {
        const inviteLink = `${baseURL}/accept-invitation?invitationId=${data.id}`;
        console.log("[app-invite] Send invitation email:", {
          to: data.email,
          name: data.name,
          inviteLink,
        });
        // TODO: Integrate with Resend, SendGrid, etc.
        // await sendEmail({ to: data.email, subject: 'Invitation', body: `Invite link: ${inviteLink}` });
      },
    }),
  ],
});
