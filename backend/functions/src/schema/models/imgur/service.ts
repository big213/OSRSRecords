import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { BaseService } from "../../core/services";
import axios from "axios";
import { permissionsCheck } from "../../core/helpers/permissions";
import { env } from "../../../config";

const prodResource = axios.create({
  baseURL: "https://api.imgur.com/3",
});

export class ImgurService extends BaseService {
  accessControl: AccessControlMap = {};

  @permissionsCheck("get")
  async getImageData({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const validatedArgs = <any>args;
    const { data } = await prodResource.get("/image/" + validatedArgs, {
      headers: {
        Authorization: "Client-ID " + env.imgur.client_id,
      },
    });

    return data.data;
  }
}
