import { Kenum } from "../core/helpers/enum";

export class eventEraModeKenum extends Kenum {
  static readonly NORMAL = new eventEraModeKenum("NORMAL", 1);
  static readonly CURRENT_ERA = new eventEraModeKenum("CURRENT_ERA", 2);
  static readonly RELEVANT_ERAS = new eventEraModeKenum("RELEVANT_ERAS", 3);
}
