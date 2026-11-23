import { z } from "zod";

export const testCaseSchema = z.object({
  input: z.string().trim().min(1, "Input is required"),
  output: z.string().trim().min(1, "Expected output is required"),
  explanation: z.string().optional(),
});

export const hiddenTestCaseSchema = z.object({
  input: z.string().trim().min(1, "Input is required"),
  output: z.string().trim().min(1, "Expected output is required"),
});

export const createProblemSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),

    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters"),

    difficulty: z.enum(["easy", "medium", "hard"], {
      errorMap: () => ({ message: "Difficulty must be easy, medium, or hard" }),
    }),

    tags: z.string().optional().default(""),

    visibleTestCases: z
      .array(testCaseSchema)
      .min(2, "At least 2 visible test cases are required"),

    hiddenTestCases: z
      .array(hiddenTestCaseSchema)
      .min(2, "At least 2 hidden test cases are required"),

    pythonRefCode: z.string().optional().default(""),
    pythonStartCode: z.string().optional().default(""),
    cppRefCode: z.string().optional().default(""),
    cppStartCode: z.string().optional().default(""),
  })
  .refine(
    (data) => Boolean(data.pythonRefCode?.trim() || data.cppRefCode?.trim()),
    {
      message: "At least one reference solution (Python or C++) is required.",
      path: ["pythonRefCode"],
    }
  );
