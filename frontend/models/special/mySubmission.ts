import { Submission } from '../base'
import EditSubmissionInterface from '~/components/interface/crud/special/editSubmissionInterface.vue'

export const MySubmission = {
  ...Submission,
  addOptions: {
    fields: [
      'event',
      'eventEra',
      'timeElapsed',
      'participantsList',
      'externalLinks',
      'happenedOn',
      'world',
      // 'files',
      'privateComments',
      'publicComments',
      'discordId',
      // 'status',
    ],
    component: EditSubmissionInterface,
  },
}
