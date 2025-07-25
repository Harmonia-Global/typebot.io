import { isReadWorkspaceFobidden } from "@/features/workspace/helpers/isReadWorkspaceFobidden";
import { authenticatedProcedure } from "@/helpers/server/trpc";
import { TRPCError } from "@trpc/server";
import { getAuthenticatedGoogleClient } from "@typebot.io/credentials/getAuthenticatedGoogleClient";
import prisma from "@typebot.io/prisma";
import { z } from "@typebot.io/zod";
import { GoogleSpreadsheet } from "google-spreadsheet";

export const getSpreadsheetName = authenticatedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      credentialsId: z.string(),
      spreadsheetId: z.string(),
    }),
  )
  .query(
    async ({
      input: { workspaceId, credentialsId, spreadsheetId },
      ctx: { user },
    }) => {
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
        },
        select: {
          id: true,
          members: true,
          credentials: {
            where: {
              id: credentialsId,
            },
            select: {
              id: true,
              data: true,
              iv: true,
            },
          },
        },
      });
      if (!workspace || isReadWorkspaceFobidden(workspace, user))
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        });

      const credentials = workspace.credentials[0];
      if (!credentials)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credentials not found",
        });

      const client = await getAuthenticatedGoogleClient(
        credentials.id,
        workspaceId,
      );

      if (!client?.credentials.access_token)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Google client could not be initialized",
        });

      try {
        const googleSheet = new GoogleSpreadsheet(spreadsheetId, {
          token: client.credentials.access_token,
        });

        await googleSheet.loadInfo();

        return { name: googleSheet.title };
      } catch (e) {
        return { name: "" };
      }
    },
  );
