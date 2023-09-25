import * as admin from "firebase-admin";
admin.initializeApp();
import "../schema";
import { Admin } from "../schema/services";

console.log("start");

(async () => {
  // await Admin.backupNecessarySubmissionEvidence("k1ox44sz");

  console.log("done");
})();
