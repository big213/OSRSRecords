import * as admin from "firebase-admin";
admin.initializeApp();
import "../schema";
import { Admin, Submission } from "../schema/services";
import { submissionStatusKenum } from "../schema/enums";

console.log("start");

(async () => {
  // await Admin.backupNecessarySubmissionEvidence("k1ox44sz");
  console.log("done");
})();
