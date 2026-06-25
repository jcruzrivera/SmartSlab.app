import Link from "next/link";

import { sendMessageAction } from "@/app/actions/marketplace";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import {
  listMessagesForUser,
  type MessageWithRelations,
} from "@/lib/db/messages";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null): string {
  if (!value) return "Not dated";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MessagesPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Connect the database to use buyer-vendor messaging.
        </p>
      </main>
    );
  }

  const user = await getOrCreateCurrentDbUser();
  const messages = user ? await listMessagesForUser(user.id) : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Messages" },
        ]}
      />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Follow up on quote requests and active buyer-vendor conversations.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Authenticated quote requests and replies will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} currentUserId={user!.id} />
          ))}
        </div>
      )}
    </main>
  );
}

function MessageCard({
  message,
  currentUserId,
}: {
  message: MessageWithRelations;
  currentUserId: string;
}) {
  const other =
    message.senderId === currentUserId ? message.recipient : message.sender;
  const otherName =
    other?.companyName ?? other?.contactName ?? other?.email ?? "Contact";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{otherName}</p>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(message.createdAt)}
            {message.slab ? (
              <>
                {" - "}
                <Link href={`/slab/${message.slab.id}`} className="hover:text-[#0d8fa8]">
                  {message.slab.name}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {message.senderId === currentUserId ? "Sent" : "Received"}
        </span>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {message.content}
      </p>
      {other ? (
        <form action={sendMessageAction} className="mt-4 flex flex-col gap-2">
          <input type="hidden" name="recipientId" value={other.id} />
          <input type="hidden" name="slabId" value={message.slabId ?? ""} />
          <textarea
            name="content"
            rows={2}
            placeholder="Reply..."
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            type="submit"
            className="inline-flex h-9 w-fit items-center rounded-lg bg-[#1bb0ce] px-3 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
          >
            Send reply
          </button>
        </form>
      ) : null}
    </article>
  );
}
