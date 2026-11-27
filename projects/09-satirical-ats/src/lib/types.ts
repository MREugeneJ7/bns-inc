export type Answers = Record<string, string | string[]>;

export type Option = {
  value: string;
  label: string;
  detail?: string;
  best?: boolean;
  minority?: boolean;
};

export type ChoiceQuestion = {
  id: string;
  label: string;
  helper?: string;
  required?: boolean;
  options: Option[];
  layout?: "stack" | "split";
};

export type MultiQuestion = {
  id: string;
  label: string;
  helper?: string;
  required?: boolean;
  min?: number;
  options: Option[];
};

export type TextQuestion = {
  id: string;
  label: string;
  helper?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url" | "number" | "date";
  autoComplete?: string;
  required?: boolean;
  min?: number;
  max?: number;
  suffix?: string;
  rows?: number;
  wide?: boolean;
  recommendation?: string;
};

export type SelectQuestion = {
  id: string;
  label: string;
  helper?: string;
  required?: boolean;
  placeholder?: string;
  options: string[];
};

export type StepId = "identity" | "stack" | "intent" | "conditions" | "diversity" | "review";

export type CvMeta = {
  name: string;
  size: number;
  text: string;
  characters: number;
  indexedAt: string;
};
