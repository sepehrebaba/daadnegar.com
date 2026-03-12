import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { createAuditLog } from "./audit";

const UNKNOWN_PERSON_SLUG = "unknown";

export const peopleService = new Elysia({ prefix: "/people", aot: false })
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
        where: { isFamous: true },
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
    async ({ body, request, ip }) => {
      const person = await prisma.person.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          nationalCode: body.nationalCode || undefined,
          imageUrl: body.imageUrl || undefined,
          isFamous: false,
        },
      });
      await createAuditLog({
        action: "create",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ firstName: person.firstName, lastName: person.lastName }),
        ctx: { ipAddress: ip?.address, userAgent: request.headers.get("user-agent") ?? undefined },
      });
      return person;
    },
    {
      body: t.Object({
        firstName: t.String({ minLength: 1 }),
        lastName: t.String({ minLength: 1 }),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
      }),
    },
  );
