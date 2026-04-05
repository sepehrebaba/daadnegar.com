import { Elysia, t } from "elysia";
import { ip } from "elysia-ip";
import { prisma } from "../../db";
import { auth } from "@/lib/auth";
import { resolveInviteToken } from "../../lib/auth-invite";
import { createAuditLog } from "../audit";

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

export const peopleService = new Elysia({ prefix: "/people" })
  .use(ip())
  .derive(async ({ request }) => {
    let session = await getSession(request.headers);
    if (!session?.user && request.headers) {
      const inviteUser = await resolveInviteToken(request.headers.get("Authorization"));
      if (inviteUser) {
        session = {
          user: {
            id: inviteUser.userId,
            name: inviteUser.name,
            email: inviteUser.email,
            username: inviteUser.username,
            image: null,
            emailVerified: false,
            role: inviteUser.role ?? "user",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: null,
        } as unknown as NonNullable<Awaited<ReturnType<typeof getSession>>>;
      }
    }
    return { session };
  })
  .get("/unknown", async () => {
    let person = await prisma.person.findFirst({
      where: { firstName: "نامشخص", lastName: "عمومی" },
    });
    if (!person) {
      person = await prisma.person.create({
        data: { firstName: "نامشخص", lastName: "عمومی", isFamous: false },
      });
    }
    return person;
  })
  .get(
    "/famous",
    async ({ query }) => {
      const search = query?.search?.trim();
      const people = await prisma.person.findMany({
        where: { isFamous: true, status: "approved" },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
      if (search) {
        const s = search.toLowerCase();
        return people.filter(
          (p) => p.firstName.toLowerCase().includes(s) || p.lastName.toLowerCase().includes(s),
        );
      }
      return people;
    },
    { query: t.Object({ search: t.Optional(t.String()) }) },
  )
  .post(
    "/",
    async ({ body, request, ip, session }) => {
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }
      const person = await prisma.person.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          fatherName: body.fatherName || undefined,
          nationalCode: body.nationalCode || undefined,
          imageUrl: body.imageUrl || undefined,
          title: body.title || undefined,
          organization: body.organization || undefined,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          address: body.address || undefined,
          mobile: body.mobile || undefined,
          phone: body.phone || undefined,
          isFamous: false,
          status: "pending",
        },
      });
      await createAuditLog({
        action: "create",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({
          firstName: person.firstName,
          lastName: person.lastName,
        }),
        ctx: {
          userId: session.user.id,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
      return person;
    },
    {
      body: t.Object({
        firstName: t.String({ minLength: 1 }),
        lastName: t.String({ minLength: 1 }),
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    },
  );
