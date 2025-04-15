"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale/es";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetBankAccounts } from "@/hooks/ajustes/cuentas/useGetBankAccounts";
import { Loader2 } from "lucide-react";
import { Credit } from "@/types";
import { useCreateCreditPayment } from "@/actions/administracion/pagos_creditos/actions";

interface FormProps {
  onClose: () => void;
  credit: Credit;
}

export function CreditPaymentForm({ onClose, credit }: FormProps) {
  const { createCreditPayment } = useCreateCreditPayment();
  const { data: accounts, isLoading: isAccLoading } = useGetBankAccounts();
  // Calcular el monto pendiente por pagar
  const pendingAmount = Number(credit.debt) - Number(credit.payed_amount || 0);

  const formSchema = z
    .object({
      bank_account_id: z
        .string({
          message: "Debe elegir una cuenta de banco.",
        })
        .optional(),
      pay_method: z.enum(["EFECTIVO", "TRANSFERENCIA"], {
        message: "Debe elegir un método de pago.",
      }),
      pay_amount: z.string().refine(
        (val) => {
          const number = parseFloat(val);
          return !isNaN(number) && number >= 0;
        },
        {
          message: "La cantidad pagada debe ser mayor a cero.",
        }
      ),
      payment_date: z.date({
        required_error: "La fecha de vuelo es requerida",
      }),
      pay_description: z
        .string()
        .min(3, {
          message: "Los detalles del pago deben tener al menos 3 caracteres.",
        })
        .max(100, {
          message: "Los detalles del pago tiene un máximo 100 caracteres.",
        }),
    })
    .refine(
      (data) => {
        if (data.pay_method === "TRANSFERENCIA" && !data.bank_account_id) {
          return false;
        }
        return true;
      },
      {
        message: "La cuenta de banco es requerida para transferencias.",
        path: ["bank_account_id"],
      }
    )
    .refine(
      (data) => {
        const payAmount = parseFloat(data.pay_amount);
        return payAmount <= pendingAmount;
      },
      {
        message: `El monto a pagar no puede ser mayor que el saldo pendiente (${pendingAmount.toFixed(2)})`,
        path: ["pay_amount"],
      }
    );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pay_amount: pendingAmount.toFixed(2),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payAmount = parseFloat(values.pay_amount);
    
    if (payAmount > pendingAmount) {
      form.setError("pay_amount", {
        message: `El monto a pagar no puede ser mayor que el saldo pendiente (${pendingAmount.toFixed(2)})`,
      });
      return;
    }

    const formattedValues = {
      ...values,
      id: credit.id,
      client_id: credit.client.id,
      pay_amount: payAmount,
    };

    createCreditPayment.mutate(formattedValues, {
      onSuccess: () => {
        onClose();
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-3"
      >
        <div className="flex gap-2 items-center justify-center">
          <FormField
            control={form.control}
            name="pay_method"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Método de Pago</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione método de pago" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          {form.watch("pay_method") !== "EFECTIVO" && (
            <FormField
              control={form.control}
              name="bank_account_id"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Cuenta de Banco</FormLabel>
                  <Select
                    disabled={isAccLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isAccLoading ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              "Seleccione el tipo..."
                            )
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts &&
                        accounts.map((acc) => (
                          <SelectItem value={acc.id.toString()} key={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="pay_amount"
          render={({ field }) => (
            <FormItem className="w-full">
              <div className="flex justify-between items-center">
                <FormLabel>Cantidad a Pagar</FormLabel>
                <span className="text-sm text-muted-foreground">
                  Saldo pendiente: {pendingAmount.toFixed(2)}
                </span>
              </div>
              <FormControl>
                <Input 
                  placeholder={`Ingrese el monto a pagar (máximo ${pendingAmount.toFixed(2)})`} 
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                      field.onChange(value);
                    }
                  }}
                />
              </FormControl>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue("pay_amount", pendingAmount.toFixed(2))}
                >
                  Pagar deuda completo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue("pay_amount", "0")}
                >
                  Limpiar
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem className="flex flex-col mt-2.5">
              <FormLabel>Fecha de Pago</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", {
                          locale: es,
                        })
                      ) : (
                        <span>Seleccione una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1999-07-21")
                    }
                    initialFocus
                    fromYear={1980}
                    toYear={new Date().getFullYear()}
                    captionLayout="dropdown-buttons"
                    components={{
                      Dropdown: (props) => (
                        <select
                          {...props}
                          className="bg-popover text-popover-foreground"
                        >
                          {props.children}
                        </select>
                      ),
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pay_description"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Detalle/Descripción" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createCreditPayment.isPending}>
          {createCreditPayment.isPending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </Form>
  );
}
