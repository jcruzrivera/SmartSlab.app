export type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type PolicyContent = {
  title: string;
  description: string;
  sections: PolicySection[];
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};
