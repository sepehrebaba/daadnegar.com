import { Readable } from "stream";
import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { auth } from "@/lib/auth";
import { resolveInviteToken } from "../../lib/auth-invite";
import { getSettingNumber, SETTING_KEYS } from "../../lib/settings";
import { minioClient, UPLOAD_BUCKET } from "../../lib/minio";
import { processUploadedFile } from "../../lib/upload-processor";
import { assertPasswordChangeNotRequired } from "../../lib/must-change-password";

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

function getBaseUrl(): string {
  return process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Turn document.url (MinIO key) into a URL the client can fetch */
export function documentToServeUrl(doc: { id: string; name: string; url: string }): string {
  const base = getBaseUrl();
  return `${base}/api/upload/serve/${doc.id}`;
}

export const uploadService = new Elysia({ prefix: "/upload" })
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
            image: null,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: "",
            userId: inviteUser.userId,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            createdAt: new Date(),
            updatedAt: new Date(),
            token: "",
            ipAddress: null,
            userAgent: null,
          },
        };
      }
    }
    if (session?.user?.id) {
      await assertPasswordChangeNotRequired(session.user.id);
    }
    return { session };
  })
  .post(
    "/",
    async ({ body, session }) => {
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const file = body.file;
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await processUploadedFile(buffer, file.name);

      if (!result.ok) {
        throw new Error(result.error);
      }

      const { buffer: cleanBuffer, key, mime } = result;

      try {
        const exists = await minioClient.bucketExists(UPLOAD_BUCKET);
        if (!exists) {
          await minioClient.makeBucket(UPLOAD_BUCKET);
        }
        await minioClient.putObject(UPLOAD_BUCKET, key, cleanBuffer, cleanBuffer.length, {
          "Content-Type": mime,
        });
      } catch (err) {
        console.error("MinIO upload error:", err);
        throw new Error("خطا در ذخیره‌سازی فایل");
      }

      return {
        key,
        name: file.name,
      };
    },
    {
      body: t.Object({
        file: t.File(),
      }),
      type: "multipart/form-data",
    },
  )
  .get(
    "/serve/:documentId",
    async ({ params, set, session }) => {
      if (!session?.user?.id) {
        set.status = 401;
        throw new Error("Unauthorized");
      }

      const doc = await prisma.reportDocument.findUnique({
        where: { id: params.documentId },
        include: { report: true },
      });

      if (!doc) {
        set.status = 404;
        throw new Error("Not found");
      }

      const report = doc.report;

      const admin = await prisma.admin.findUnique({
        where: { userId: session.user.id },
      });

      const isOwner = report.userId === session.user.id;
      const isAdmin = !!admin;

      let canView = isOwner || isAdmin;
      if (!canView) {
        const [dbUser, approvedCount, minRequired] = await Promise.all([
          prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
          }),
          prisma.report.count({
            where: { userId: session.user.id, status: "accepted" },
          }),
          getSettingNumber(SETTING_KEYS.MIN_APPROVED_REPORTS_FOR_APPROVAL),
        ]);
        canView = dbUser?.role === "validator" || (approvedCount ?? 0) >= (minRequired ?? 0);
      }

      if (!canView) {
        set.status = 403;
        throw new Error("Forbidden");
      }

      try {
        const nodeStream = await minioClient.getObject(UPLOAD_BUCKET, doc.url);
        const webStream = Readable.toWeb(nodeStream as Readable) as ReadableStream;
        return new Response(webStream, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `inline; filename="${encodeURIComponent(doc.name)}"`,
          },
        });
      } catch (err) {
        console.error("MinIO get error:", err);
        set.status = 500;
        throw new Error("خطا در دریافت فایل");
      }
    },
    { params: t.Object({ documentId: t.String() }) },
  );
