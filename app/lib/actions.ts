"use server";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  status: z.enum(["paid", "pending"]).default("pending"),
  date: z.string(),
});

const createInvoiceSchemaFormSchema = createInvoiceSchema.omit({ date: true });

export async function createInvoice(data: FormData) {
  const { customerId, amount, status } = createInvoiceSchemaFormSchema.parse({
    customerId: data.get("customerId"),
    amount: data.get("amount"),
    status: data.get("status"),
  });

  const amountInCents = Math.round(amount * 100);
  const [date] = new Date().toISOString().split("T");

  await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;

  revalidatePath('dashboard/invoices');
  redirect('/dashboard/invoices');
}
