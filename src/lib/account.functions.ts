import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

export const deleteCurrentAccount = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ confirmed: z.literal(true) })
      .strict()
      .parse(data),
  )
  .handler(async (): Promise<DeleteAccountResult> => {
    const { deleteAuthenticatedAccount } = await import("./account.server");
    return deleteAuthenticatedAccount();
  });
