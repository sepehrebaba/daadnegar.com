// Project type definitions

export type Language = "fa" | "en";

export type AppScreen =
  | "start"
  | "language"
  | "welcome"
  | "about"
  | "security"
  | "invite-code"
  | "login"
  | "passkey-register"
  | "passkey-verify"
  | "main-menu"
  | "my-tokens"
  | "report-category"
  | "report-basic-info"
  | "report-organization"
  | "report-person"
  | "report-location"
  | "report-occurrence"
  | "report-evidence"
  | "report-contact"
  | "report-confirmation"
  | "report-success"
  | "report-famous-list"
  | "report-manual-entry"
  | "report-documents"
  | "report-description"
  | "report-step1"
  | "my-requests"
  | "request-detail"
  | "approval-list"
  | "invite-user"
  | "error";

// Report wizard constants (also seeded in DB)
export type ReportCategory = "bribery" | "embezzlement" | "nepotism" | "abuse" | "other";
export type OrganizationType =
  | "government"
  | "municipality"
  | "judiciary"
  | "military"
  | "private"
  | "other";
export type OccurrenceFrequency = "once" | "few" | "repeated" | "ongoing";
export type EvidenceType = "document" | "image" | "video" | "audio" | "witness";

export const REPORT_CATEGORIES: {
  value: ReportCategory;
  label: string;
  subcategories: { value: string; label: string }[];
}[] = [
  {
    value: "bribery",
    label: "رشوه",
    subcategories: [
      { value: "cash", label: "نقدی" },
      { value: "gift", label: "هدیه/خدمات" },
      { value: "promise", label: "وعده منصب/امتیاز" },
    ],
  },
  {
    value: "embezzlement",
    label: "اختلاس",
    subcategories: [
      { value: "budget", label: "بودجه دولتی" },
      { value: "public", label: "اموال عمومی" },
    ],
  },
  {
    value: "nepotism",
    label: "پارتی‌بازی و رانت",
    subcategories: [
      { value: "hiring", label: "استخدام غیرعادلانه" },
      { value: "contract", label: "واگذاری قرارداد" },
    ],
  },
  {
    value: "abuse",
    label: "سوءاستفاده از قدرت",
    subcategories: [
      { value: "position", label: "سوءاستفاده از موقعیت" },
      { value: "threat", label: "تهدید و ارعاب" },
    ],
  },
  { value: "other", label: "سایر", subcategories: [{ value: "other", label: "موارد دیگر" }] },
];

export const ORGANIZATION_TYPES: { value: OrganizationType; label: string }[] = [
  { value: "government", label: "دولتی" },
  { value: "municipality", label: "شهرداری" },
  { value: "judiciary", label: "قضایی" },
  { value: "military", label: "نظامی/امنیتی" },
  { value: "private", label: "بخش خصوصی" },
  { value: "other", label: "سایر" },
];

export const OCCURRENCE_FREQUENCIES: { value: OccurrenceFrequency; label: string }[] = [
  { value: "once", label: "یک بار" },
  { value: "few", label: "چند بار" },
  { value: "repeated", label: "به طور مکرر" },
  { value: "ongoing", label: "در حال وقوع" },
];

export const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: "document", label: "سند" },
  { value: "image", label: "تصویر" },
  { value: "video", label: "ویدئو" },
  { value: "audio", label: "صوت" },
  { value: "witness", label: "شاهد" },
];

export type RequestStatus = "pending" | "accepted" | "rejected";

/** Report status for a reviewer in the pending-review list */
export type ReviewerListStatus =
  | {
      kind: "await_accept";
      /** Start of the 24-hour acceptance window */
      assignmentAssignedAt: string;
    }
  | {
      kind: "await_vote";
      /** After validator acceptance; null for non-validator users */
      acceptedAt: string | null;
    }
  | {
      kind: "voted";
      voteAction: "accepted" | "rejected";
    };

export interface User {
  id: string;
  passkey: string;
  inviteCode: string;
  isActivated: boolean;
  tokensCount: number;
  approvedRequestsCount: number;
  /** "user" | "validator" - validators can always approve reports */
  role?: string;
  username?: string;
  name?: string;
  /** True until the user changes their initial password */
  mustChangePassword?: boolean;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  nationalCode?: string;
  imageUrl?: string;
  isFamous: boolean;
}

export interface ReportCase {
  id: string;
  userId: string;
  personId: string;
  person: Person;
  documents: Array<
    Partial<{
      id: string;
      name: string;
      createdAt: Date;
      url: string;
      reportId: string;
    }>
  >;
  description: string;
  status: RequestStatus;
  createdAt: Date;
  /** Used in report wizard: whether a specific person is involved */
  hasInvolvedPerson?: boolean;
  /** Selected person when hasInvolvedPerson is true */
  involvedPerson?: Person;
  categoryId?: string;
  subcategoryId?: string;
  category?: ReportCategory;
  subcategory?: string;
  title?: string;
  organizationType?: OrganizationType;
  organizationName?: string;
  province?: string;
  city?: string;
  exactLocation?: string;
  occurrenceFrequency?: OccurrenceFrequency;
  occurrenceDate?: Date;
  hasEvidence?: boolean;
  evidenceTypes?: EvidenceType[];
  evidenceDescription?: string;
  wantsContact?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactSocial?: string;
  /** Only set on the pending-list API response for reviewers */
  listReviewerStatus?: ReviewerListStatus | null;
  confirmAccuracy?: boolean;
  confirmNoPersonalInfo?: boolean;
  confirmProcessAgreement?: boolean;
}

export interface AppState {
  currentScreen: AppScreen;
  language: Language;
  user: User | null;
  currentReport: Partial<ReportCase> | null;
  selectedRequest: ReportCase | null;
}
