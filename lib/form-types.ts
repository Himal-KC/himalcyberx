export type FormActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_FORM_STATE: FormActionState = {
  success: false,
  message: "",
};
