import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string({
      required_error: "El titulo es requerido",
      invalid_type_error: "El titulo debe ser un texto",
    })
    .min(1)
    .max(255),
  description: z
    .string({
      required_error: "La descripcion es requerida",
      invalid_type_error: "La descripcion debe ser un texto",
    })
    .min(1)
    .max(255)
    .optional(),
});

export const updateTaskSchema = z.object({
  username: z
    .string({
      required_error: "El nombre de usuario es requerido",
      invalid_type_error: "El nombre de usuario debe ser un texto",
    })
    .min(1)
    .max(255).optional(),
  email: z
    .string({
      required_error: "El email es requerido",
      invalid_type_error: "La descripcion debe ser un texto",
    })
    .min(1)
    .max(255)
    .optional(),
});


