import { Kenum } from "../core/helpers/enum";

export class submissionStatusKenum extends Kenum {
  static readonly SUBMITTED = new submissionStatusKenum("SUBMITTED", 1);
  static readonly UNDER_REVIEW = new submissionStatusKenum("UNDER_REVIEW", 2);
  static readonly APPROVED = new submissionStatusKenum("APPROVED", 3);
  static readonly INFORMATION_REQUESTED = new submissionStatusKenum(
    "INFORMATION_REQUESTED",
    4
  );
  static readonly REJECTED = new submissionStatusKenum("REJECTED", 5);
}
