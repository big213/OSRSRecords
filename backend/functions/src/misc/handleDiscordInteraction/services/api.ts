import axios from "axios";
import { env } from "../../../config";

const prodResource = axios.create({
  baseURL: env.site.api_url,
});

export async function executeGiraffeql(query, attempts = 0) {
  const request = {
    headers: {
      "x-api-key": env.site.api_key,
    },
  };

  try {
    const { data } = await prodResource.post("/giraffeql", query, request);

    return data.data;
  } catch(err: any) {
    // check response type. if it is not an object, must be due to some general function failure. re-attempt up to 3 times before throwing the err
    if (attempts < 3 && typeof err.response.data !== "object") {
      return executeGiraffeql({
        query,
        attempts: attempts + 1,
      });
    }
    throw err;
  }

}
