import { Kenum } from "../core/helpers/enum";

export class eventDifficultyKenum extends Kenum {
  static readonly EASY = new eventDifficultyKenum("EASY", 1);
  static readonly NORMAL = new eventDifficultyKenum("NORMAL", 2);
  static readonly HARD = new eventDifficultyKenum("HARD", 3);
}
