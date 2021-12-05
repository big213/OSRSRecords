import axios from "axios";
import { env } from "../../../config";

const prodResource = axios.create({
  baseURL: env.site.api_url,
});

export async function executeGiraffeql(query) {
  const request = {
    headers: {
      "x-api-key": env.site.api_key,
    },
  };

  const { data } = await prodResource.post("/giraffeql", query, request);

  return data.data;
}
